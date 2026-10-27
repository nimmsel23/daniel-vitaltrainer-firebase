const RECIPIENT = "nimmdaniel+kontaktformular@gmail.com";

function doGet() {
  return ContentService
    .createTextOutput("Dieser Endpoint nimmt nur POST-Anfragen vom Kontaktformular auf daniel-vitaltrainer.web.app entgegen.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  const params = (e && e.parameter) || {};
  const name = (params.name || "").trim();
  const email = (params.email || "").trim();
  const message = (params.message || "").trim();

  if (!name || !email || !message) {
    return respond({ ok: false, error: "missing_fields" });
  }

  const subject = "Kontaktanfrage von " + name + " (Vitaltrainer-Website)";
  const body = [
    "Neue Anfrage über das Kontaktformular auf daniel-vitaltrainer.web.app",
    "",
    "Name: " + name,
    "E-Mail: " + email,
    "",
    "Nachricht:",
    message
  ].join("\n");

  MailApp.sendEmail({
    to: RECIPIENT,
    replyTo: email,
    subject: subject,
    body: body
  });

  return respond({ ok: true });
}

function respond(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
