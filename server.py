"""
Online Dice – Server with cross-device sync API
Chạy: python server.py
Mở trên máy livestream:  http://localhost:8080
Mở trên điện thoại:      http://<IP-máy-tính>:8080/remote.html
"""
import http.server
import json
import os
import time
import socket

PORT = 8080
SETTINGS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sync_settings.json')

# Init settings file
if not os.path.exists(SETTINGS_FILE):
    with open(SETTINGS_FILE, 'w') as f:
        json.dump({'_v': 0}, f)


class DiceHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/settings':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-cache, no-store')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            try:
                with open(SETTINGS_FILE, 'r') as f:
                    data = f.read()
            except Exception:
                data = '{"_v":0}'
            self.wfile.write(data.encode())
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/settings':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode()
            try:
                obj = json.loads(body)
                obj['_v'] = int(time.time() * 1000)  # version timestamp
                with open(SETTINGS_FILE, 'w') as f:
                    json.dump(obj, f)
                resp = json.dumps({'ok': True, '_v': obj['_v']})
            except Exception as e:
                resp = json.dumps({'ok': False, 'error': str(e)})
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(resp.encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        # Suppress noisy polling logs
        if '/api/settings' not in (args[0] if args else ''):
            super().log_message(format, *args)


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '???'


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    local_ip = get_local_ip()
    server = http.server.HTTPServer(('0.0.0.0', PORT), DiceHandler)
    print(f'')
    print(f'  Online Dice Server')
    print(f'  ==================')
    print(f'  May livestream:  http://localhost:{PORT}')
    print(f'  Dien thoai:     http://{local_ip}:{PORT}/remote.html')
    print(f'  Cung mang WiFi la sync duoc!')
    print(f'')
    server.serve_forever()
