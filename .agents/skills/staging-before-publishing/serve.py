#!/usr/bin/env python3
"""Локальный стенд портфолио без кеша.

Запуск из корня репозитория:
    python3 .claude/skills/staging-before-publishing/serve.py

Зачем не `python3 -m http.server`: тот не ставит Cache-Control, браузер видит только
Last-Modified и может держать старый js/i18n.js или css/home.css неделями. Симптом —
новый блок остаётся английским при переключении на русский, потому что в закешированном
словаре нет новых ключей. Здесь на каждый ответ уходит Cache-Control: no-store,
поэтому стенд всегда показывает то, что реально лежит на диске.

Порт фиксированный — 8001, чтобы ссылки не менялись между сессиями.
"""
import http.server
import socketserver
import sys

PORT = 8001


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


class Server(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    try:
        with Server(("", PORT), NoCacheHandler) as httpd:
            print(f"Стенд без кеша: http://localhost:{PORT}/  (Ctrl+C — остановить)")
            httpd.serve_forever()
    except OSError as err:
        sys.exit(
            f"Порт {PORT} занят ({err}). Останови старый стенд и запусти снова:\n"
            f"  lsof -nP -iTCP:{PORT} -sTCP:LISTEN"
        )
    except KeyboardInterrupt:
        print("\nСтенд остановлен")
