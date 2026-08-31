#!/usr/bin/env python3
"""Проверка синхронности локализаций портфолио.

Запуск из корня репозитория:  python3 .claude/skills/staging-before-publishing/check-i18n-parity.py
Необязательный аргумент — префикс ключей, например lunel_ (проверить только один кейс).

Проверяет:
  1. каждый ключ есть и в en, и в ru;
  2. нет дублей ключей внутри одного языка;
  3. нет пустых значений при непустом переводе на другом языке;
  4. каждый data-i18n="ключ" в HTML существует в обоих словарях;
  5. для каждого data-i18n-src/poster с {lang} на диске есть и _en, и _ru файл.

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

scope = f" (префикс {PREFIX})" if PREFIX else ""
if problems:
    print(f"РАСХОЖДЕНИЯ{scope}: {len(problems)}")
    for p in sorted(set(problems)):
        print("  •", p)
    sys.exit(1)
print(f"Локализации синхронны{scope}: {len(en['map'])} ключей en / {len(ru['map'])} ru")
