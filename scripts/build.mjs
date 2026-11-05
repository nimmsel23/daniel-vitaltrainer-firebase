import { cp, mkdir, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "src");
const output = resolve(root, "dist-firebase");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });

for (const required of ["index.html", "vitalos.html", "styles.css", "app.js", "assets/hero.png"]) {
  await stat(resolve(output, required));
}

console.log("Firebase build created in dist-firebase/");
