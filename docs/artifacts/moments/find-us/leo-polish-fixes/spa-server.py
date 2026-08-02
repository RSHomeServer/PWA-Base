#!/usr/bin/env python3
import http.server
import os
import socketserver

ROOT = "/mnt/storage/Containers/Cursor/Website_Hosting/apps/memories-web/dist"
PORT = 4199


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        fs = self.translate_path(path)
        if path != "/" and not os.path.exists(fs):
            self.path = "/index.html"
        return super().do_GET()

    def log_message(self, *_args):
        pass


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        httpd.serve_forever()
