import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const root = resolve(process.cwd(), process.argv[2] ?? "src");
const port = Number(process.env.PORT ?? 4173);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const candidate = resolve(root, pathname === "/" ? "index.html" : `.${pathname}`);
  const allowed = candidate === root || candidate.startsWith(`${root}${sep}`);

  if (!allowed) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const info = await stat(candidate);
    const file = info.isDirectory() ? resolve(candidate, "index.html") : candidate;
    response.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Daniel Vitaltraining läuft auf http://localhost:${port}`);
});
