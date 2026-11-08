#!/usr/bin/env node
// Проверка локализации. Заменяет check-i18n-parity.py: словарь en убран,
// английская версия теперь живёт в самой разметке.
//
//   node .claude/skills/staging-before-publishing/check-i18n.mjs
//   node .claude/skills/staging-before-publishing/check-i18n.mjs lunel_
//
// Что ловит:
//   1. data-i18n без ключа в ru  -> при переключении на русский останется английский
//   2. кириллица в разметке      -> английская версия не английская; это читают поиск и агенты
//   3. английское значение в ru  -> кейс на русском с английскими словами
//   4. дубли ключей в ru
//   5. нет пары картинок _en/_ru
//   6. ключи в ru, которых нет ни на одной странице (мусор)

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const PREFIX = process.argv[2] || '';
const PAGES = ['index.html', 'lunel/index.html', 'order-picking/index.html',
  'transfers-of-goods/index.html', 'picking-priority/index.html',
  'picker-schedule/index.html', 'teachers-journal/index.html', 'colleges/index.html'];

// Латиница, которая законно остаётся латиницей в русском тексте
const TERMS = new Set(['time', 'to', 'task', 'dark', 'store', 'stores', 'ux', 'csat', 'dau', 'mvp',
  'ios', 'android', 'app', 'store', 'google', 'play', 'apple', 'health', 'intelligence', 'swiftui',
  'claude', 'code', 'femtech', 'b2b', 'b2c', 'web', 'lunel', 'mes', 'end', 'a/b', 'test', 'jobs',
  'job', 'stories', 'cjm', 'cjms', 'blue', 'print', 'user', 'retention', 'engagement', 'activation',
  'value', 'nps', 'umux', 'samokat', 'figma', 'tone', 'of', 'voice', 'end-to-end', 'pdf', 'cv',
  'junior', 'middle', 'middle+', 'senior']);

const src = readFileSync(join(ROOT, 'js/i18n.js'), 'utf8');
const sandbox = { window: {}, document: { documentElement: {}, addEventListener() {}, querySelectorAll: () => [], readyState: 'loading' }, localStorage: { getItem: () => null, setItem() {} } };
Object.assign(globalThis, sandbox);
eval(src);
const RU = globalThis.window._i18nTranslations.ru;

const problems = [];
const add = (kind, where, detail) => problems.push({ kind, where, detail });

// 4. дубли ключей в словаре ru
const ruBody = src.slice(src.indexOf('    ru: {'));
const seen = new Set();
for (const m of ruBody.matchAll(/^\s{6}([a-zA-Z0-9_]+):/gm)) {
  if (seen.has(m[1])) add('дубль ключа в ru', 'js/i18n.js', m[1]);
  seen.add(m[1]);
}

const usedKeys = new Set();

for (const page of PAGES) {
  const html = readFileSync(join(ROOT, page), 'utf8');

  // 1 и 2: текстовые блоки
  for (const m of html.matchAll(/data-i18n="([a-zA-Z0-9_]+)"([^>]*)>([^<]*)/g)) {
    const [, key, , text] = m;
    usedKeys.add(key);
    if (PREFIX && !key.startsWith(PREFIX)) continue;
    if (RU[key] == null) add('нет ключа в ru', page, key);
    if (/[А-Яа-яЁё]/.test(text)) add('кириллица в разметке', page, `${key}: ${text.trim().slice(0, 40)}`);
  }
  for (const m of html.matchAll(/data-i18n-(alt|href)="([a-zA-Z0-9_]+)"/g)) {
    usedKeys.add(m[2]);
    if (PREFIX && !m[2].startsWith(PREFIX)) continue;
    if (RU[m[2]] == null) add('нет ключа в ru', page, m[2]);
  }

  // 5: парные картинки
  for (const m of html.matchAll(/data-i18n-(?:src|poster)="([^"]*\{lang\}[^"]*)"/g)) {
    for (const lang of ['en', 'ru']) {
      const rel = m[1].replace('{lang}', lang).replace(/^\.\.\//, '');
      if (PREFIX && !rel.includes(PREFIX.replace(/_$/, '-'))) continue;
      if (!existsSync(join(ROOT, rel))) add('нет картинки', page, rel);
    }
  }
}

// 3: английские значения в русском словаре
for (const [key, raw] of Object.entries(RU)) {
  if (PREFIX && !key.startsWith(PREFIX)) continue;
  if (key.endsWith('_url')) continue;
  const text = String(raw).replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;| /g, ' ');
  if (!text.trim() || /[А-Яа-яЁё]/.test(text)) continue;
  const words = text.match(/[A-Za-z][A-Za-z'’-]+/g) || [];
  if (!words.length) continue;
  if (words.every(w => TERMS.has(w.toLowerCase()))) continue;
  add('английский текст в ru', 'js/i18n.js', `${key}: ${text.trim().slice(0, 45)}`);
}

// 6: ключи, которые нигде не используются. Это мусор, а не поломка,
// поэтому идёт отдельным списком и не роняет проверку
const unused = Object.keys(RU).filter(k =>
  (!PREFIX || k.startsWith(PREFIX)) && !k.endsWith('_url') && !usedKeys.has(k));

const scope = PREFIX ? `ключи с префиксом «${PREFIX}»` : 'весь сайт';
if (problems.length) {
  console.log(`Проверено: ${scope}. Поломок: ${problems.length}\n`);
  let kind = null;
  for (const p of problems.sort((a, b) => a.kind.localeCompare(b.kind))) {
    if (p.kind !== kind) { console.log(`${p.kind}:`); kind = p.kind; }
    console.log(`   ${p.where}  —  ${p.detail}`);
  }
} else {
  console.log(`Проверено: ${scope}. Поломок нет.`);
}
if (unused.length) {
  console.log(`\nне используется на страницах (${unused.length}), можно удалить:`);
  console.log('   ' + unused.join(', '));
}
process.exit(problems.length ? 1 : 0);
