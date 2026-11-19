// A tiny static server for app/ (Node 22, standard library only), so the
// cover maker can be tried locally without a build step:
//   node serve.ts            serves app/ on http://localhost:8080
//   node serve.ts --port 9000
// It sends the MIME types an offline web app needs and refuses any path
// outside app/. This is a development convenience, not a public web server.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./app', import.meta.url)));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

function pickPort() {
  const i = process.argv.indexOf('--port');
  const n = i === -1 ? 8080 : Number(process.argv[i + 1]);
  return Number.isInteger(n) && n > 0 && n < 65536 ? n : 8080;
}

createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = resolve(join(root, normalize(pathname)));
  if (file !== root && !file.startsWith(root + sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  let size;
  try {
    const s = statSync(file);
    if (!s.isFile()) throw new Error('not a file');
    size = s.size;
  } catch {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, {
    'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(res);
}).listen(pickPort(), '127.0.0.1', () => {
  console.log(`app/ is on http://localhost:${pickPort()}`);
});
