// Minimal static server for the exported ./out bundle (local verification only).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const root = join(process.cwd(), 'out');
const port = 5055;
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  // Next.js ships RSC segment payloads (`__next.*.txt`) for client-side
  // navigation; without a text type they arrive as octet-stream.
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.wav': 'audio/wav',
  '.opus': 'audio/ogg',
};

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    let fsPath = join(root, p);
    try {
      if ((await stat(fsPath)).isDirectory()) fsPath = join(fsPath, 'index.html');
    } catch {
      if (!extname(fsPath)) fsPath = join(root, p, 'index.html');
    }
    const body = await readFile(fsPath);
    // RSC segment payloads must be served as `text/x-component`; the App Router
    // discards the response otherwise and client-side navigation silently
    // does nothing.
    const isRsc = 'rsc' in (req.headers ?? {}) || /(^|[?&])_rsc=/.test(req.url);
    res.writeHead(200, {
      'content-type': isRsc
        ? 'text/x-component'
        : types[extname(fsPath)] || 'application/octet-stream',
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
}).listen(port, () => console.log(`serving ./out at http://localhost:${port}`));
