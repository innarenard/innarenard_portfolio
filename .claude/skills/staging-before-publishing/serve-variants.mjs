// Стенд редизайна. Один процесс поднимает все порты сразу:
//
//   8010  хаб-переключатель
//   8001  текущий сайт (эталон, ветка redesign/base)
//   8016  галерея интерактивных компонентов Lunel
//   8017  рабочий вариант  .variants/v6
//
// Пять сравнительных вариантов (порты 8011–8015) убраны 30 октября 2026,
// когда Инна выбрала сводный. Ветки redesign/v1…v5 остались: рабочая копия
// любой из них поднимается обратно одной командой
//   git worktree add .variants/vN redesign/vN
// и строкой в списке ниже.
//
// Правила те же, что у serve.mjs: Cache-Control: no-store, иначе браузер
// держит старый js/i18n.js и новый блок остаётся английским.
//
// Отдельно: если файла нет в worktree варианта, но он есть в images/
// основного чекаута — отдаём оттуда. Благодаря этому фотография,
// положенная в images/ уже после сборки вариантов, появляется сразу во всех.

import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';

const BASE = '/Users/innaivanova/PortfolioWebsite';

const SITES = [
  { port: 8010, root: join(BASE, '.variants/hub'), title: 'Хаб' },
  { port: 8001, root: BASE, title: 'Текущий сайт' },
  { port: 8016, root: join(BASE, '.variants/shared/gallery'), title: 'Компоненты Lunel' },
  { port: 8017, root: join(BASE, '.variants/v6'), title: 'Рабочий вариант' },
  { port: 8018, root: join(BASE, '.variants/shapes'), title: 'Формы Ф1–Ф5' },
];

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.pdf': 'application/pdf', '.ico': 'image/x-icon', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
};

const resolve = (root, urlPath) => {
  const safe = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const candidates = [join(root, safe)];
  // общие картинки и общий бандл компонентов — из основного чекаута
  if (safe.startsWith('/images/') || safe.startsWith('images/')) candidates.push(join(BASE, safe));
  if (safe.startsWith('/shared/')) candidates.push(join(BASE, '.variants', safe.slice(1)));

  for (const c of candidates) {
    try {
      const st = statSync(c);
      if (st.isDirectory()) {
        const idx = join(c, 'index.html');
        statSync(idx);
        return idx;
      }
      return c;
    } catch { /* пробуем следующий */ }
  }
  return null;
};

for (const site of SITES) {
  createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const fsPath = resolve(site.root, urlPath);
    const head = { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Access-Control-Allow-Origin': '*' };

    if (!fsPath) {
      res.writeHead(404, { ...head, 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end(`404 — ${urlPath} нет в ${site.title}`);
    }
    try {
      res.writeHead(200, {
        ...head,
        'Content-Type': TYPES[extname(fsPath).toLowerCase()] || 'application/octet-stream',
        'Content-Length': statSync(fsPath).size,
      });
      createReadStream(fsPath).pipe(res);
    } catch {
      res.writeHead(404, { ...head, 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404');
    }
  }).listen(site.port, () => console.log(`${String(site.port).padEnd(6)} ${site.title.padEnd(22)} http://localhost:${site.port}/`));
}
