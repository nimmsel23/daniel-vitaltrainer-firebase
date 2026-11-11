// Importiert ChatGPT-Sites-Pakete aus dem Vitaltrainer-Vault nach src/.
// Quellen (erste Treffer gewinnt):
//   1) GPT_PACKAGES_ROOT/{landingpage,vitalos-public}
//   2) CI-Checkout: vault/website/{landingpage,vitalos-public}
//   3) Vault-Nachbar: ../landingpage und ../vitalos-public
import { cp, mkdir, rm, readFile, writeFile, access, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";

const root = resolve(import.meta.dirname, "..");
const src = resolve(root, "src");

const exists = (p) => access(p).then(() => true, () => false);

async function resolvePackages() {
  const envRoot = process.env.GPT_PACKAGES_ROOT;
  const candidates = [
    envRoot ? { landing: join(envRoot, "landingpage"), vitalos: join(envRoot, "vitalos-public") } : null,
    { landing: resolve(root, "vault/website/landingpage"), vitalos: resolve(root, "vault/website/vitalos-public") },
    { landing: resolve(root, "../landingpage"), vitalos: resolve(root, "../vitalos-public") },
  ].filter(Boolean);

  for (const c of candidates) {
    const landingDist = join(c.landing, "dist");
    const vitalosDist = join(c.vitalos, "dist");
    if ((await exists(landingDist)) && (await exists(vitalosDist))) {
      return { landingDist, vitalosDist, label: c.landing };
    }
  }
  return null;
}

function rewriteVitalosHtml(html) {
  return html
    .replaceAll("https://daniel-vitaltrainer.web.app/", "/")
    .replaceAll("https://daniel-vitaltrainer.web.app", "/")
    .replaceAll('href="/datenschutz/"', 'href="/vitalos/datenschutz/"')
    .replaceAll('href="/konto-loeschen/"', 'href="/vitalos/konto-loeschen/"')
    .replaceAll('href="/datenschutz"', 'href="/vitalos/datenschutz/"')
    .replaceAll('href="/konto-loeschen"', 'href="/vitalos/konto-loeschen/"');
}

async function walkHtml(dir) {
  const out = [];
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...(await walkHtml(p)));
    else if (ent.name.endsWith(".html")) out.push(p);
  }
  return out;
}

async function importDir(fromDist, toDir, { rewrite } = {}) {
  await rm(toDir, { recursive: true, force: true });
  await mkdir(toDir, { recursive: true });
  await cp(fromDist, toDir, { recursive: true });

  if (!rewrite) return;

  // absolute /datenschutz und /konto-loeschen → unter /vitalos/…, damit Trainer-Legal unberührt bleibt
  for (const file of await walkHtml(toDir)) {
    const html = await readFile(file, "utf8");
    await writeFile(file, rewriteVitalosHtml(html));
  }
}

const packages = await resolvePackages();
if (!packages) {
  if (process.env.GPT_PACKAGES_REQUIRED === "1") {
    console.error("GPT-Pakete nicht gefunden (landingpage/dist + vitalos-public/dist).");
    process.exit(1);
  }
  console.log("Keine GPT-Paketquellen gefunden – src/landingpage und src/vitalos unverändert.");
  process.exit(0);
}

await importDir(packages.landingDist, join(src, "landingpage"), { rewrite: false });
await importDir(packages.vitalosDist, join(src, "vitalos"), { rewrite: true });

// Alte /vitalos.html-URL: kanonisch auf Package-Index zeigen (cleanUrls: /vitalos).
const vitalosIndex = await readFile(join(src, "vitalos/index.html"), "utf8");
await writeFile(join(src, "vitalos.html"), rewriteVitalosHtml(vitalosIndex));

console.log(`GPT-Pakete importiert aus ${packages.label}`);
console.log("  -> src/landingpage/");
console.log("  -> src/vitalos/ (+ src/vitalos.html)");
