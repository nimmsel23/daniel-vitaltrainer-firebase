// Pflicht-Bausteine, die ein Sync von außen (ChatGPT web o. Ä.) nicht verlieren darf.
import { readdir, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const src = resolve(import.meta.dirname, "..", "src");
const read = (f) => readFile(join(src, f), "utf8");
const pages = (await readdir(src)).filter((f) => f.endsWith(".html"));
const errors = [];

for (const page of pages) {
  const h = await read(page);
  for (const needle of ['src="/app.js"', 'src="/consent.js"', 'href="/impressum.html"', 'href="/datenschutz.html"']) {
    if (!h.includes(needle)) errors.push(`${page}: ${needle} fehlt`);
  }
  if (/<script[^>]+firebase-analytics\.js/.test(h)) errors.push(`${page}: firebase-analytics.js darf nur über consent.js geladen werden`);
  if (/fonts\.(googleapis|gstatic)\.com/.test(h)) errors.push(`${page}: externe Google Fonts (selbst hosten: /assets/fonts/)`);
}

const index = await read("index.html");
if (!index.includes('id="contact-form"')) errors.push("index.html: Kontaktformular #contact-form fehlt");
if (!/script\.google\.com\/macros\/s\/[^/]+\/exec/.test(index)) errors.push("index.html: GAS-Webapp-URL im Formular fehlt");
if (/fonts\.(googleapis|gstatic)\.com/.test(await read("styles.css"))) errors.push("styles.css: externe Google Fonts");

for (const f of ["consent.js", "firebase-analytics.js", "app.js", "assets/hero.png", "assets/fonts/manrope-latin.woff2", "assets/fonts/dm-sans-latin.woff2"]) {
  await readFile(join(src, f)).catch(() => errors.push(`${f} fehlt`));
}

if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`Invarianten ok (${pages.length} Seiten)`);
