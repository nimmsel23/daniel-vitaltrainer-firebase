// Deploy as the owner at the existing public web app URL. Run setupContact once.
// Anfragen werden per WhatsApp oder SMS bestätigt: Erst die Nachricht von einer echten Nummer
// erreicht Daniel. Das Skript speichert nur Code, Quelle, Seite und Zeitpunkt, keine Inhalte.
const OWNER = 'nimmdaniel@gmail.com';
const PHONE = '4367761506077';
const CONSENT = 'Ich möchte Daniels Newsletter mit Tipps und Angeboten zum Vitaltraining per E-Mail erhalten.';
const DAY = 86400000;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function setupContact() {
  if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'expireContactRequests')) {
    ScriptApp.newTrigger('expireContactRequests').timeBased().everyHours(1).create();
  }
}

function locked(work) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { return work(PropertiesService.getScriptProperties()); }
  finally { lock.releaseLock(); }
}

function digest(text) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text));
}


function expireContactRequests() {
  locked(store => {
    const data = store.getProperties();
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('pending:') && JSON.parse(value).expires <= Date.now()) store.deleteProperty(key);
      if (key.startsWith('limit:') && Number(value) <= Date.now()) store.deleteProperty(key);
    }
  });
}

function page(message) {
  return HtmlService.createHtmlOutput('<html lang="de"><main style="font-family:system-ui,sans-serif;max-width:32rem;margin:2rem auto;padding:0 1rem;line-height:1.5"><h1>Vitaltraining mit Daniel</h1>' + message + '</main></html>').addMetaTag('viewport','width=device-width, initial-scale=1');
}

function newCode() {
  let code = 'VT-';
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid());
  for (let i = 0; i < 4; i++) code += CODE_CHARS[(bytes[i] + 256) % CODE_CHARS.length];
  return code;
}

function cleanSource(value) {
  return String(value || 'direkt').toLowerCase().replace(/[^a-z0-9.\-_]/g, '').slice(0, 40) || 'direkt';
}

function cleanPage(value) {
  const path = String(value || '/').slice(0, 60);
  return /^\/[a-z0-9\-_.\/]*$/i.test(path) ? path : '/';
}

// Monatsstatistik ohne personenbezogene Daten. Beim ersten Eintrag eines neuen Monats
// bekommt Daniel die Zusammenfassung des Vormonats per Mail.
function countRequest(store, entry) {
  const month = Utilities.formatDate(new Date(), 'Europe/Vienna', 'yyyy-MM');
  let stats = JSON.parse(store.getProperty('stats') || 'null');
  if (stats && stats.month !== month) {
    sendDigest(stats);
    stats = null;
  }
  stats = stats || {month, gestartet: 0, spam: 0, quellen: {}, codes: []};
  if (entry.spam) stats.spam++;
  else {
    stats.gestartet++;
    stats.quellen[entry.src] = (stats.quellen[entry.src] || 0) + 1;
    if (stats.codes.length < 200) stats.codes.push([entry.code, entry.src, entry.page, entry.time].join(' · '));
  }
  store.setProperty('stats', JSON.stringify(stats));
}

function sendDigest(stats) {
  if (!stats.gestartet && !stats.spam) return;
  const quellen = Object.entries(stats.quellen).map(([k, v]) => '  ' + k + ': ' + v).join('\n') || '  keine';
  try {
    MailApp.sendEmail(OWNER, 'Anfragen ' + stats.month + ': ' + stats.gestartet + ' gestartet',
      'Formular-Anfragen ' + stats.month + '\n\n' +
      'Gestartet: ' + stats.gestartet + '\nSpam-Bots verworfen: ' + stats.spam + '\n\nQuellen:\n' + quellen +
      '\n\nCodes (mit deinen WhatsApp/SMS-Bestätigungen abgleichen):\n' + (stats.codes.join('\n') || '  keine'));
  } catch (error) { /* Statistik ist nicht kritisch */ }
}

function confirmLinks(code, name, message) {
  const text = 'Hallo Daniel, ich bestätige meine Trainingsanfrage ' + code + '.\nName: ' + name + '\n\n' + message.slice(0, 700);
  const encoded = encodeURIComponent(text);
  return '<p><b>Letzter Schritt:</b> Bestätige deine Anfrage per WhatsApp oder SMS. Die Nachricht ist schon vorbereitet, du musst sie nur absenden. Erst dann erreicht mich deine Anfrage.</p>' +
    '<p><a target="_top" style="display:inline-block;padding:.8rem 1.2rem;background:#1f7a4d;color:#fff;border-radius:.5rem;text-decoration:none;font-weight:600" href="https://wa.me/' + PHONE + '?text=' + encoded + '">Per WhatsApp bestätigen</a></p>' +
    '<p><a target="_top" href="sms:+' + PHONE + '?&body=' + encoded + '">Lieber per SMS bestätigen</a></p>' +
    '<p>Dein Code: <b>' + code + '</b></p>';
}

function doGet(e) {
  const token = e.parameter.token || '';
  if (!/^[a-f0-9-]{36}$/.test(token)) return page('<p>Dieser Link ist ungültig.</p>');
  const record = PropertiesService.getScriptProperties().getProperty('pending:' + digest(token));
  if (!record || JSON.parse(record).expires <= Date.now()) return page('<p>Dieser Link ist abgelaufen oder bereits verwendet.</p>');
  return page('<form method="post" target="_top" action="' + ScriptApp.getService().getUrl() + '"><input type="hidden" name="token" value="' + token + '"><button>Newsletter-Anmeldung bestätigen</button></form>');
}

function doPost(e) {
  try {
    const p = e.parameter;
    if (p.token) return confirmNewsletter(p.token);
    const time = Utilities.formatDate(new Date(), 'Europe/Vienna', 'dd.MM. HH:mm');
    const src = cleanSource(p.src);
    const pagePath = cleanPage(p.page);
    // Verstecktes Feld ausgefüllt: Bot. Normale Antwort, nichts weiter.
    if ((p.website || '').trim()) {
      locked(store => countRequest(store, {spam: true}));
      return page('<p>Danke für deine Nachricht.</p>');
    }
    const email = (p.email || '').trim();
    const name = (p.name || '').trim();
    const message = (p.message || '').trim();
    const newsletter = p.newsletter === 'yes';
    const emailOk = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email) && email.length <= 254;
    if (!name || name.length > 100 || !message || message.length > 1500 || (email && !emailOk) || (newsletter && !emailOk)) {
      return page('<p>Bitte prüfe deine Eingaben und versuche es erneut. Für den Newsletter brauche ich eine gültige E-Mail-Adresse.</p>');
    }
    const code = newCode();
    let note = '';
    locked(store => {
      countRequest(store, {code, src, page: pagePath, time});
      if (!newsletter) return;
      const now = Date.now();
      const rateKey = 'limit:' + digest(email.toLowerCase());
      if (Number(store.getProperty(rateKey)) > now || MailApp.getRemainingDailyQuota() < 2) return;
      const token = Utilities.getUuid();
      const key = 'pending:' + digest(token);
      store.setProperty(key, JSON.stringify({email, requested: now, expires: now + DAY}));
      try {
        MailApp.sendEmail(email, 'Bitte bestätige deine Newsletter-Anmeldung bei Daniel',
          'Über das Vitaltrainer-Formular wurde diese Newsletter-Anmeldung gewählt: ' + CONSENT +
          '\n\nFalls das von dir stammt, öffne den Link und bestätige dort innerhalb von 24 Stunden:\n' +
          ScriptApp.getService().getUrl() + '?token=' + token + '\n\nSonst kannst du diese E-Mail ignorieren.');
        store.setProperty(rateKey, String(now + 900000));
        note = '<p>Für den Newsletter schicke ich dir zusätzlich eine Bestätigungsmail.</p>';
      } catch (error) { store.deleteProperty(key); }
    });
    return page(confirmLinks(code, name, message) + note);
  } catch (error) {
    return page('<p>Das hat gerade nicht geklappt. Schreib mir direkt per WhatsApp an +43 677 615 060 77.</p>');
  }
}

function confirmNewsletter(token) {
  if (!/^[a-f0-9-]{36}$/.test(token)) return page('<p>Dieser Link ist ungültig.</p>');
  return locked(store => {
    const key = 'pending:' + digest(token);
    const value = store.getProperty(key);
    if (!value || JSON.parse(value).expires <= Date.now()) return page('<p>Dieser Link ist abgelaufen oder bereits verwendet.</p>');
    const r = JSON.parse(value);
    const id = 'subscriber:' + digest(r.email.toLowerCase());
    if (!store.getProperty(id)) store.setProperty(id, JSON.stringify({email: r.email, source: 'Vitaltrainer-Kontaktformular', consent: CONSENT, requested: r.requested, confirmed: Date.now()}));
    store.deleteProperty(key);
    return page('<p>Danke! Deine Newsletter-Anmeldung ist bestätigt. Abmeldung jederzeit per E-Mail an ' + OWNER + '.</p>');
  });
}
