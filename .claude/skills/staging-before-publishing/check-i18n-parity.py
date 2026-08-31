#!/usr/bin/env python3
"""Проверка синхронности локализаций портфолио.

Запуск из корня репозитория:  python3 .claude/skills/staging-before-publishing/check-i18n-parity.py
Необязательный аргумент — префикс ключей, например lunel_ (проверить только один кейс).

Проверяет:
  1. каждый ключ есть и в en, и в ru;
  2. нет дублей ключей внутри одного языка;
  3. нет пустых значений при непустом переводе на другом языке;
  4. каждый data-i18n="ключ" в HTML существует в обоих словарях;
  5. для каждого data-i18n-src/poster с {lang} на диске есть и _en, и _ru файл;
  6. видимый текст в HTML не остался без data-i18n — иначе он не переключится вообще.

Выход: 0 — всё синхронно, 1 — есть расхождения.
"""
import re
import sys
from collections import Counter
from pathlib import Path

PREFIX = sys.argv[1] if len(sys.argv) > 1 else ""
ROOT = Path.cwd()
problems = []


def load_blocks():
    src = (ROOT / "js/i18n.js").read_text(encoding="utf-8")
    blocks = {}
    for lang in ("en", "ru"):
        m = re.search(r"\n    " + lang + r": \{\n(.*?)\n    \},?\n", src, re.S)
        if not m:
            sys.exit(f"не нашёл блок {lang} в js/i18n.js")
        body = m.group(1)
        pairs = re.findall(r'^\s{6}([A-Za-z_][A-Za-z0-9_]*):\s*"(.*)"\s*,?\s*$', body, re.M)
        blocks[lang] = {"order": [k for k, _ in pairs], "map": dict(pairs)}
    return blocks


def keep(key):
    return key.startswith(PREFIX)


blocks = load_blocks()
en, ru = blocks["en"], blocks["ru"]

for lang, data in blocks.items():
    dups = [k for k, c in Counter(data["order"]).items() if c > 1 and keep(k)]
    for k in sorted(dups):
        problems.append(f"дубликат ключа в {lang}: {k}")

for k in en["map"]:
    if keep(k) and k not in ru["map"]:
        problems.append(f"ключ есть в en, нет в ru: {k}")
for k in ru["map"]:
    if keep(k) and k not in en["map"]:
        problems.append(f"ключ есть в ru, нет в en: {k}")

for k in sorted(set(en["map"]) & set(ru["map"])):
    if not keep(k):
        continue
    a, b = en["map"][k].strip(), ru["map"][k].strip()
    if bool(a) != bool(b):
        empty = "en" if not a else "ru"
        problems.append(f"пустой перевод в {empty}: {k}")

html_files = [p for p in ROOT.rglob("*.html") if ".git" not in p.parts and "innarenard" not in p.parts]
for path in html_files:
    text = path.read_text(encoding="utf-8", errors="ignore")
    rel = path.relative_to(ROOT)
    for attr in ("data-i18n", "data-i18n-alt", "data-i18n-href"):
        for key in re.findall(attr + r'="([A-Za-z_][A-Za-z0-9_]*)"', text):
            if not keep(key):
                continue
            for lang, data in blocks.items():
                if key not in data["map"]:
                    problems.append(f"{rel}: ключ {key} отсутствует в {lang}")
    for tmpl in re.findall(r'data-i18n-(?:src|poster)="([^"]*\{lang\}[^"]*)"', text):
        name = tmpl.split("/")[-1]
        if PREFIX and not name.startswith(PREFIX.rstrip("_")):
            continue
        for lang in ("en", "ru"):
            candidate = ROOT / "images" / name.replace("{lang}", lang)
            if not candidate.exists():
                problems.append(f"{rel}: нет картинки {candidate.relative_to(ROOT)}")


# ── 6. видимый текст без data-i18n ────────────────────────────────────────────
# Словари могут быть идеально синхронны, но если у элемента нет data-i18n,
# переключатель до него просто не доберётся: на странице навсегда останется
# английский текст из HTML. Именно так проскочило имя в подвале главной.

from html.parser import HTMLParser

SKIP_TAGS = {"script", "style", "svg", "noscript"}
# собственные имена и служебные подписи, которые не переводятся
ALLOWED = {
    # ссылки и собственные имена
    "cv", "telegram", "linkedin", "dribbble", "github", "behance",
    "en", "ru", "lunel", "samokat", "mes", "figma",
    # технические подписи, одинаковые в обоих языках
    "b2b", "b2c", "dau", "mau", "wau", "ios", "android", "web",
    "ux", "ui", "mvp", "api", "saas", "kpi", "a/b", "end-to-end",
    "time to task", "app store", "google play",
}


class TextWithoutKey(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []          # (tag, есть ли data-i18n на этом или выше)
        self.skip_depth = 0
        self.found = []          # (текст, тег)

    def handle_starttag(self, tag, attrs):
        if tag in SKIP_TAGS:
            self.skip_depth += 1
        keys = {k for k, _ in attrs}
        covered = bool(self.stack and self.stack[-1][1]) or "data-i18n" in keys
        if tag not in ("br", "img", "hr", "input", "meta", "link", "source"):
            self.stack.append((tag, covered))

    def handle_endtag(self, tag):
        if tag in SKIP_TAGS and self.skip_depth:
            self.skip_depth -= 1
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        if self.skip_depth or not self.stack:
            return
        tag, covered = self.stack[-1]
        if covered:
            return
        text = " ".join(data.split())
        if not text or text.lower() in ALLOWED:
            return
        if len(re.findall(r"[A-Za-z]", text)) < 2:
            return
        self.found.append((text, tag))


legacy = []
titles = []
for path in html_files:
    rel = path.relative_to(ROOT)
    parser = TextWithoutKey()
    parser.feed(path.read_text(encoding="utf-8", errors="ignore"))
    # главная и папка нашего кейса — наша ответственность, остальные кейсы — старый долг
    ours = rel.name == "index.html" and len(rel.parts) == 1
    if PREFIX:
        ours = ours or rel.parts[0].startswith(PREFIX.rstrip("_"))
    for text, tag in parser.found:
        msg = f"{rel}: текст без data-i18n в <{tag}>: «{text[:60]}»"
        if tag == "title":
            titles.append(msg)
        else:
            (problems if ours else legacy).append(msg)

if titles:
    print(f"Заголовки <title> без перевода ({len(titles)}) — решение по всему сайту сразу:")
    for m in sorted(set(titles)):
        print("  ◦", m)

if legacy:
    print(f"Старый долг в других кейсах ({len(legacy)}) — не правим, только фиксируем:")
    for m in sorted(set(legacy)):
        print("  ◦", m)

scope = f" (префикс {PREFIX})" if PREFIX else ""
if problems:
    print(f"РАСХОЖДЕНИЯ{scope}: {len(problems)}")
    for p in sorted(set(problems)):
        print("  •", p)
    sys.exit(1)
print(f"Локализации синхронны{scope}: {len(en['map'])} ключей en / {len(ru['map'])} ru")
