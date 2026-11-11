import { cp, mkdir, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "src");
const output = resolve(root, "dist-firebase");

// ChatGPT-Pakete (landingpage/, vitalos-public/) vor dem Copy nach src/ ziehen, falls Quellen da sind.
const imp = spawnSync(process.execPath, [resolve(import.meta.dirname, "import-gpt-packages.mjs")], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
if (imp.status) process.exit(imp.status ?? 1);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });

for (const required of [
  "index.html",
  "vitalos.html",
  "vitalos/index.html",
  "landingpage/index.html",
  "styles.css",
  "app.js",
  "assets/hero.png",
]) {
  await stat(resolve(output, required));
}

console.log("Firebase build created in dist-firebase/");
