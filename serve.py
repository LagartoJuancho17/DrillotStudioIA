#!/usr/bin/env python3
"""Servidor estático de desarrollo.

`python3 -m http.server` no manda cabeceras de caché, así que el navegador
aplica su heurística y se queda con copias viejas de css/js/partials: editás
un archivo, recargás y seguís viendo lo anterior. Acá se fuerza `no-store` en
todo, de modo que cada recarga trae siempre la versión del disco.

Uso:
    python3 serve.py [puerto]     # por defecto 4123
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEFAULT_PORT = 4123


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_header(self, keyword, value):
        # SimpleHTTPRequestHandler manda Last-Modified, que habilita
        # revalidación condicional (304) y devuelve el archivo viejo.
        if keyword == "Last-Modified":
            return
        super().send_header(keyword, value)

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    handler = partial(NoCacheHandler, directory=str(ROOT))
    with ThreadingHTTPServer(("", port), handler) as httpd:
        print(f"Sirviendo {ROOT} en http://localhost:{port} (sin caché)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nDetenido.")


if __name__ == "__main__":
    main()
