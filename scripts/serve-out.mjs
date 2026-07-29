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
    res.writeHead(200, {
      'content-type': types[extname(fsPath)] || 'application/octet-stream',
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
}).listen(port, () => console.log(`serving ./out at http://localhost:${port}`));
