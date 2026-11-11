// Prüft interne Links/Assets und #Anker in src/**/*.html (ohne Abhängigkeiten).
import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, join, relative, dirname } from "node:path";

const src = resolve(import.meta.dirname, "..", "src");

async function walkHtml(dir) {
  const out = [];
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...(await walkHtml(p)));
    else if (ent.name.endsWith(".html")) out.push(p);
  }
  return out;
}

const files = await walkHtml(src);
const html = Object.fromEntries(await Promise.all(files.map(async (p) => [relative(src, p), await readFile(p, "utf8")])));
const ids = Object.fromEntries(Object.entries(html).map(([p, h]) => [p, new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]));

const exists = (p) => stat(join(src, p)).then(() => true, () => false);

async function resolveTarget(fromPage, pathPart) {
  if (!pathPart || pathPart === "") return fromPage;
  let target = pathPart.replace(/^\//, "").split("?")[0];
  if (!target) return "index.html";
  if (await exists(target)) {
    const st = await stat(join(src, target));
    if (st.isDirectory()) return join(target, "index.html");
    return target;
  }
  if (await exists(`${target}.html`)) return `${target}.html`;
  if (await exists(join(target, "index.html"))) return join(target, "index.html");
  // relative to current page directory
  const rel = join(dirname(fromPage), target);
  if (await exists(rel)) {
    const st = await stat(join(src, rel));
    if (st.isDirectory()) return join(rel, "index.html");
    return rel;
  }
  if (await exists(`${rel}.html`)) return `${rel}.html`;
  if (await exists(join(rel, "index.html"))) return join(rel, "index.html");
  return join(target.includes(".") ? target : `${target}.html`);
}

const errors = [];

for (const page of Object.keys(html)) {
  for (const [, attr, url] of html[page].matchAll(/\s(href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(url)) continue;
    const [pathPart, anchor] = url.split("#");
    const file = (await resolveTarget(page, pathPart)).replace(/\\/g, "/");
    if (!(await exists(file))) { errors.push(`${page}: ${attr}="${url}" -> ${file} fehlt`); continue; }
    if (anchor && file.endsWith(".html") && !ids[file]?.has(anchor)) errors.push(`${page}: ${attr}="${url}" -> #${anchor} fehlt in ${file}`);
  }
}

if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`Links ok (${Object.keys(html).length} Seiten)`);
