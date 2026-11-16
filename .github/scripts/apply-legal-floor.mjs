// Der Vault-Datenschutz kann den USA-/Speicherdauer-Abschnitt verlieren.
// Live darf ihn nicht verlieren: fehlt der Marker, wird der Abschnitt vor
// "Deine Rechte" eingesetzt. Text entspricht dem Stand, der schon in src/ liegt.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const file = resolve(import.meta.dirname, "../../src/datenschutz.html");
const marker = "Data Privacy Framework";
let html = await readFile(file, "utf8");

if (html.includes(marker)) {
  console.log("legal floor: Datenschutz enthält den USA-Abschnitt bereits.");
  process.exit(0);
}

const section = `      <h2>Übermittlung in die USA &amp; Speicherdauer</h2>
      <p>Firebase (Hosting, Analytics) und das Kontaktformular (Google Apps Script, Gmail) werden von Google betrieben. Dabei können Daten in die USA übermittelt werden. Google ist nach dem EU-US Data Privacy Framework zertifiziert; die Übermittlung stützt sich auf den Angemessenheitsbeschluss der EU-Kommission (Art. 45 DSGVO).</p>
      <p>Anfragen per E-Mail oder Formular lösche ich, sobald sie erledigt sind und keine gesetzliche Aufbewahrungspflicht besteht. Analytics-Daten werden von Google nach der eingestellten Aufbewahrungsdauer (höchstens 14 Monate) automatisch gelöscht.</p>`;

const anchor = "      <h2>Deine Rechte</h2>";
if (!html.includes(anchor)) {
  console.error("legal floor: Anker <h2>Deine Rechte</h2> fehlt in src/datenschutz.html.");
  process.exit(1);
}

html = html.replace(anchor, `${section}\n\n${anchor}`);
await writeFile(file, html);
console.log("legal floor: USA-Abschnitt in src/datenschutz.html eingesetzt.");
