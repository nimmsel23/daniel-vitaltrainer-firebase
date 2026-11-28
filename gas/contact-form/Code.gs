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
  return HtmlService.createHtmlOutput('<html lang="de"><main><h1>Vitaltraining mit Daniel</h1><p>' + message + '</p></main></html>').addMetaTag('viewport','width=device-width, initial-scale=1');
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
    return locked(store => {
      const now = Date.now();
      const rateKey = 'limit:' + digest(email.toLowerCase());
      if (Number(store.getProperty(rateKey)) > now) return page('Bitte prüfe dein Postfach oder versuche es in 15 Minuten erneut.');
      if (MailApp.getRemainingDailyQuota() < 2) return page('Der Versand ist gerade nicht möglich. Schreib direkt an ' + OWNER + '.');
      const token = Utilities.getUuid();
      const key = 'pending:' + digest(token);
      const newsletter = p.newsletter === 'yes';
      const link = ScriptApp.getService().getUrl() + '?token=' + token;
      store.setProperty(key, JSON.stringify({email,name,message,newsletter,requested:now,expires:now+DAY}));
      try {
        MailApp.sendEmail(email, 'Bitte bestätige deine Anfrage an Daniel', 'Über das Vitaltrainer-Formular wurde deine Adresse angegeben.\n\n' + (newsletter ? 'Zusätzlich wurde diese Newsletter-Anmeldung gewählt: ' + CONSENT + '\n\n' : '') + 'Falls das von dir stammt, öffne den Link und bestätige dort innerhalb von 24 Stunden:\n' + link + '\n\nSonst kannst du diese E-Mail ignorieren.');
      } catch (error) { store.deleteProperty(key); throw error; }
      store.setProperty(rateKey, String(now + 900000));
      return page('Bitte öffne die Bestätigungsmail und bestätige dort deine Anfrage. Schau gegebenenfalls im Spamordner nach.');
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
    MailApp.sendEmail({to:OWNER, replyTo:r.email, subject:'Bestätigte Vitaltraining-Anfrage', body:r.name + '\n' + r.email + '\n\n' + r.message});
    store.deleteProperty(key);
    return page(r.newsletter ? 'Danke! Deine Anfrage ist versendet und deine Newsletter-Anmeldung ist bestätigt. Abmeldung jederzeit per E-Mail an ' + OWNER + '.' : 'Danke! Deine Anfrage ist bestätigt und an Daniel versendet.');
  });
}
