// Deploy as the owner at the existing public web app URL. Run setupContact once.
const OWNER = 'nimmdaniel@gmail.com';
const CONSENT = 'Ich möchte Daniels Newsletter mit Tipps und Angeboten zum Vitaltraining per E-Mail erhalten.';
const DAY = 86400000;

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
  return HtmlService.createHtmlOutput('<html lang="de"><main style="font-family:sans-serif;max-width:560px;margin:3rem auto;padding:0 1.2rem;line-height:1.6"><h1>Vitaltraining mit Daniel</h1><p>' + message + '</p><p><a href="https://daniel-vitaltrainer.web.app/" target="_top">Zurück zur Website</a></p></main></html>').addMetaTag('viewport','width=device-width, initial-scale=1');
}

function notifyOwner(name, email, message) {
  MailApp.sendEmail({to:OWNER, replyTo:email, subject:'Neue Anfrage Erstgespräch: ' + name, body:name + '\n' + email + '\n\n' + message});
}

function doGet(e) {
  const token = e.parameter.token || '';
  if (!/^[a-f0-9-]{36}$/.test(token)) return page('Dieser Link ist ungültig.');
  const record = PropertiesService.getScriptProperties().getProperty('pending:' + digest(token));
  if (!record || JSON.parse(record).expires <= Date.now()) return page('Dieser Link ist abgelaufen oder bereits verwendet.');
  const label = JSON.parse(record).newsletter ? 'Anfrage und Newsletter-Anmeldung bestätigen' : 'Anfrage bestätigen';
  return page('<form method="post" target="_top" action="' + ScriptApp.getService().getUrl() + '"><input type="hidden" name="token" value="' + token + '"><button>' + label + '</button></form>');
}

function doPost(e) {
  try {
    const p = e.parameter;
    if (p.token) return confirmRequest(p.token);
    const email = (p.email || '').trim();
    const name = (p.name || '').trim();
    const message = (p.message || '').trim();
    if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email) || email.length > 254 || !name || name.length > 100 || !message || message.length > 1500) {
      return page('Bitte prüfe deine Eingaben und versuche es erneut.');
    }
    if (p.website) return page('Danke! Deine Anfrage ist bei mir angekommen.'); // Honeypot gegen Bots
    return locked(store => {
      const now = Date.now();
      const rateKey = 'limit:' + digest(email.toLowerCase());
      if (Number(store.getProperty(rateKey)) > now) return page('Deine Anfrage ist bereits bei mir. Ich melde mich persönlich bei dir.');
      if (MailApp.getRemainingDailyQuota() < 2) return page('Der Versand ist gerade nicht möglich. Schreib direkt an ' + OWNER + '.');
      // Anfrage geht sofort an Daniel; Double-Opt-in nur für den Newsletter.
      notifyOwner(name, email, message);
      store.setProperty(rateKey, String(now + 900000));
      const newsletter = p.newsletter === 'yes';
      if (!newsletter) return page('Danke, ' + name.replace(/[<>&"]/g, '') + '! Deine Anfrage ist bei mir angekommen. Ich melde mich persönlich bei dir, meist innerhalb von zwei Werktagen.');
      const token = Utilities.getUuid();
      const key = 'pending:' + digest(token);
      const link = ScriptApp.getService().getUrl() + '?token=' + token;
      store.setProperty(key, JSON.stringify({email,name,newsletter:true,requested:now,expires:now+DAY}));
      try {
        MailApp.sendEmail(email, 'Bitte bestätige deine Newsletter-Anmeldung', 'Über das Vitaltrainer-Formular wurde diese Newsletter-Anmeldung gewählt: ' + CONSENT + '\n\nFalls das von dir stammt, öffne den Link und bestätige dort innerhalb von 24 Stunden:\n' + link + '\n\nSonst kannst du diese E-Mail ignorieren. Deine Anfrage ist unabhängig davon bereits bei Daniel angekommen.');
      } catch (error) { store.deleteProperty(key); }
      return page('Danke! Deine Anfrage ist bei mir angekommen. Für den Newsletter schicke ich dir noch eine Bestätigungsmail.');
    });
  } catch (error) { return page('Das hat gerade nicht geklappt. Versuche es später erneut oder schreib an ' + OWNER + '.'); }
}

function confirmRequest(token) {
  if (!/^[a-f0-9-]{36}$/.test(token)) return page('Dieser Link ist ungültig.');
  return locked(store => {
    const key = 'pending:' + digest(token);
    const value = store.getProperty(key);
    if (!value || JSON.parse(value).expires <= Date.now()) return page('Dieser Link ist abgelaufen oder bereits verwendet.');
    const r = JSON.parse(value);
    if (r.newsletter) {
      const id = 'subscriber:' + digest(r.email.toLowerCase());
      if (!store.getProperty(id)) store.setProperty(id, JSON.stringify({email:r.email, source:'Vitaltrainer-Kontaktformular', consent:CONSENT, requested:r.requested, confirmed:Date.now()}));
    }
    if (r.message) MailApp.sendEmail({to:OWNER, replyTo:r.email, subject:'Bestätigte Vitaltraining-Anfrage', body:r.name + '\n' + r.email + '\n\n' + r.message}); // alte, noch offene Anfragen
    store.deleteProperty(key);
    return page(r.newsletter ? 'Danke! Deine Newsletter-Anmeldung ist bestätigt. Abmeldung jederzeit per E-Mail an ' + OWNER + '.' : 'Danke! Deine Anfrage ist bestätigt und an Daniel versendet.');
  });
}
