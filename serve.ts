// Neon Dusk Cover Maker: a tiny static file server for local development.
// Serves app/ over HTTP so the cover maker can be tried in a desktop browser:
//   node serve.ts
// then open http://localhost:8080

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = resolve(join(fileURLToPath(new URL(".", import.meta.url)), "app"));
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "127.0.0.1";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

function safePath(requestPath) {
  const cleaned = normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, "");
  const full = resolve(join(APP_ROOT, cleaned === "/" ? "index.html" : cleaned));
  if (full !== APP_ROOT && !full.startsWith(APP_ROOT + sep)) return null;
  return full;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    const file = safePath(url.pathname);
    if (!file) {
      res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, {
      "content-type": MIME_TYPES[extname(file).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  } catch (err) {
    if (err && err.code === "ENOENT" || err && err.code === "EISDIR") {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end("Server error");
  }
});

server.listen(PORT, HOST, () => {
  console.log("Neon Dusk Cover Maker at http://" + HOST + ":" + PORT + "/");
});
