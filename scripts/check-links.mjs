// Prüft interne Links/Assets und #Anker in src/*.html (ohne Abhängigkeiten).
import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, join } from "node:path";

const src = resolve(import.meta.dirname, "..", "src");
const pages = (await readdir(src)).filter((f) => f.endsWith(".html"));
const html = Object.fromEntries(await Promise.all(pages.map(async (p) => [p, await readFile(join(src, p), "utf8")])));
const ids = Object.fromEntries(pages.map((p) => [p, new Set([...html[p].matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]));

const exists = (p) => stat(join(src, p)).then(() => true, () => false);
const errors = [];

for (const page of pages) {
  for (const [, attr, url] of html[page].matchAll(/\s(href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(url)) continue;
    const [pathPart, anchor] = url.split("#");
    const target = pathPart === "" ? page : pathPart.replace(/^\//, "").split("?")[0] || "index.html";
    const file = target.includes(".") ? target : `${target}.html`;
    if (!(await exists(file))) { errors.push(`${page}: ${attr}="${url}" -> ${file} fehlt`); continue; }
    if (anchor && file.endsWith(".html") && !ids[file]?.has(anchor)) errors.push(`${page}: ${attr}="${url}" -> #${anchor} fehlt in ${file}`);
  }
}

if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`Links ok (${pages.length} Seiten)`);
