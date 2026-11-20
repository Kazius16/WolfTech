"""QR de WolfTech: módulos como pistas de circuito + el lobo oficial en el centro.
Uso: python3 qr.py [url]  → qr-wolftech.svg y qr-wolftech.png (2000 px)
El logo se toma exacto de marketing/videos/logo.svg (nunca se redibuja)."""
import re, sys, segno, cairosvg
from pathlib import Path

URL = sys.argv[1] if len(sys.argv) > 1 else 'https://linktr.ee/wolftech.com.co'
AZUL, TINTA = '#2E8CFF', '#0A0A0A'
qr = segno.make(URL, error='h', boost_error=False)
M = [list(r) for r in qr.matrix]
N = len(M)
C = 40                      # px por módulo
Q = 4                       # zona de silencio (módulos)
T = (N + 2 * Q) * C

def en_ojo(y, x):           # los 3 cuadros de las esquinas se dibujan aparte
    return (y < 7 and x < 7) or (y < 7 and x >= N - 7) or (y >= N - 7 and x < 7)

# hueco del centro para el lobo (≈ 6 % del código; el nivel H aguanta 30 %)
H = 9 if N < 41 else 11
c0 = (N - H) // 2
def en_centro(y, x): return c0 <= y < c0 + H and c0 <= x < c0 + H

partes = []
alto = C * 0.8
for y in range(N):
    x = 0
    while x < N:
        if M[y][x] and not en_ojo(y, x) and not en_centro(y, x):
            x2 = x
            while x2 + 1 < N and M[y][x2 + 1] and not en_ojo(y, x2 + 1) and not en_centro(y, x2 + 1): x2 += 1
            px, py = (x + Q) * C, (y + Q) * C
            if x2 == x:     # módulo suelto → nodo (punto)
                partes.append(f'<circle cx="{px + C/2}" cy="{py + C/2}" r="{C*0.43:.1f}"/>')
            else:           # varios seguidos → pista con puntas redondas
                w = (x2 - x + 1) * C - (C - alto)
                partes.append(f'<rect x="{px + (C-alto)/2:.1f}" y="{py + (C-alto)/2:.1f}" width="{w:.1f}" height="{alto:.1f}" rx="{alto/2:.1f}"/>')
            x = x2 + 1
        else:
            x += 1

ojos = []
for oy, ox in [(0, 0), (0, N - 7), (N - 7, 0)]:
    px, py = (ox + Q) * C, (oy + Q) * C
    ojos.append(f'<rect x="{px + C/2}" y="{py + C/2}" width="{6*C}" height="{6*C}" rx="{1.9*C}" fill="none" stroke="{TINTA}" stroke-width="{C}"/>'
                f'<rect x="{px + 2*C}" y="{py + 2*C}" width="{3*C}" height="{3*C}" rx="{0.9*C}" fill="{AZUL}"/>')

# lobo oficial dentro de un círculo negro
logo = Path(__file__).resolve().parent.parent / 'videos' / 'logo.svg'
src = logo.read_text()
vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', src).group(1).split()]
interior = re.sub(r'^.*?<svg[^>]*>|</svg>\s*$', '', src, flags=re.S)
cx = cy = T / 2
r = H * C / 2 - C * 0.15
lw = r * 1.48                                  # ancho del lobo dentro del círculo
esc = lw / vb[2]; lh = vb[3] * esc
lobo = (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#000"/>'
        f'<circle cx="{cx}" cy="{cy}" r="{r - C*0.12}" fill="none" stroke="{AZUL}" stroke-width="{C*0.08}" opacity=".9"/>'
        f'<g transform="translate({cx - lw/2:.1f} {cy - lh/2 + r*0.03:.1f}) scale({esc:.5f})">{interior}</g>')

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {T} {T}" width="{T}" height="{T}">'
       f'<rect width="{T}" height="{T}" rx="{C*2.2}" fill="#fff"/>'
       f'<g fill="{TINTA}">{"".join(partes)}</g>{"".join(ojos)}{lobo}</svg>')
Path('qr-wolftech.svg').write_text(svg)
cairosvg.svg2png(bytestring=svg.encode(), write_to='qr-wolftech.png', output_width=2000, output_height=2000)
print('QR', N, 'x', N, '·', URL)
