// Временная замена serve.py: python3 заблокирован лицензией Xcode.
// Те же правила: порт 8001, Cache-Control: no-store.
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';

const ROOT = '/Users/innaivanova/PortfolioWebsite';
const PORT = 8001;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp4': 'video/mp4',
  '.pdf': 'application/pdf', '.ico': 'image/x-icon', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2',
};

createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let fsPath = join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ''));
  try {
    if (statSync(fsPath).isDirectory()) fsPath = join(fsPath, 'index.html');
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end('404');
  }
  try {
    const size = statSync(fsPath).size;
    res.writeHead(200, {
      'Content-Type': TYPES[extname(fsPath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': size,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    });
    createReadStream(fsPath).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end('404');
  }
}).listen(PORT, () => console.log('stand on http://localhost:8001'));
