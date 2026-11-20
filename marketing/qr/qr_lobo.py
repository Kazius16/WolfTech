"""QR con forma de lobo: el logo oficial (marketing/videos/logo.svg) se convierte en
puntos y pistas del mismo estilo del QR, y el código real va en la cara del lobo.
Uso: python3 qr_lobo.py [url]  → qr-lobo(.svg/.png transparente), qr-lobo-blanco.png y qr-lobo-negro(.svg/.png)"""
import sys, io, segno, cairosvg, numpy as np
from PIL import Image
from pathlib import Path

URL = sys.argv[1] if len(sys.argv) > 1 else 'https://linktr.ee/wolftech.co'
AZUL, TINTA = '#2E8CFF', '#0A0A0A'
LOGO = Path(__file__).resolve().parent.parent / 'videos' / 'logo.svg'
LW, LH = 850, 812                          # viewBox del logo

qr = segno.make(URL, error='h', boost_error=False)
Mq = [list(r) for r in qr.matrix]; N = len(Mq)
SIL = 4                                    # zona de silencio alrededor del código (módulos)
QX, QY, QS = 425, 432, 440                 # centro y lado (en unidades del logo) del código + silencio
u = QS / (N + 2 * SIL)                     # tamaño de un módulo en unidades del logo
cols, rows = int(np.ceil(LW / u)) + 2, int(np.ceil(LH / u)) + 2
ox = (cols * u - LW) / 2; oy = (rows * u - LH) / 2

# 1) el logo como cuadrícula: ¿pasa una línea del lobo por este módulo?
k = 8
png = cairosvg.svg2png(url=str(LOGO), output_width=int(cols * k * LW / (cols * u)))
im = np.array(Image.open(io.BytesIO(png)).convert('RGBA'))[:, :, 3] > 100
sc = im.shape[1] / LW
def tinta_logo(cx, cy):                    # cx, cy en unidades del logo
    x0, x1 = int((cx - u * .3) * sc), int((cx + u * .3) * sc)
    y0, y1 = int((cy - u * .3) * sc), int((cy + u * .3) * sc)
    if x1 <= 0 or y1 <= 0 or x0 >= im.shape[1] or y0 >= im.shape[0]: return False
    return im[max(y0, 0):y1, max(x0, 0):x1].mean() > .35

G = np.zeros((rows, cols), bool)
for r in range(rows):
    for c in range(cols):
        G[r, c] = tinta_logo(c * u - ox + u / 2, r * u - oy + u / 2)

# 2) el código QR en la cara (con su zona de silencio vacía)
q0c = int(round((QX - QS / 2 + ox) / u)); q0r = int(round((QY - QS / 2 + oy) / u))
caja = (q0r, q0c, q0r + N + 2 * SIL, q0c + N + 2 * SIL)
G[caja[0]:caja[2], caja[1]:caja[3]] = False
EYE = np.zeros((rows, cols), bool)
Q = np.zeros((rows, cols), bool)   # módulos del código (van siempre negros)
for y in range(N):
    for x in range(N):
        r, c = q0r + SIL + y, q0c + SIL + x
        ojo = (y < 7 and x < 7) or (y < 7 and x >= N - 7) or (y >= N - 7 and x < 7)
        if ojo: EYE[r, c] = True
        elif Mq[y][x]: Q[r, c] = True

# 3) dibujo: pistas horizontales con puntas redondas y nodos sueltos
C = 30
W, H = cols * C, rows * C
alto = C * .8
def trazos(Gm):
    out = []
    for r in range(rows):
        c = 0
        while c < cols:
            if Gm[r, c]:
                c2 = c
                while c2 + 1 < cols and Gm[r, c2 + 1]: c2 += 1
                px, py = c * C, r * C
                if c2 == c: out.append(f'<circle cx="{px + C/2}" cy="{py + C/2}" r="{C*.43:.1f}"/>')
                else: out.append(f'<rect x="{px + (C-alto)/2:.1f}" y="{py + (C-alto)/2:.1f}" width="{(c2-c+1)*C-(C-alto):.1f}" height="{alto:.1f}" rx="{alto/2:.1f}"/>')
                c = c2 + 1
            else: c += 1
    return ''.join(out)
lobo, codigo = trazos(G), trazos(Q)
ojos = []
for oy_, ox_ in [(0, 0), (0, N - 7), (N - 7, 0)]:
    px, py = (q0c + SIL + ox_) * C, (q0r + SIL + oy_) * C
    ojos.append(f'<rect x="{px + C/2}" y="{py + C/2}" width="{6*C}" height="{6*C}" rx="{1.9*C}" fill="none" stroke="{TINTA}" stroke-width="{C}"/>'
                f'<rect x="{px + 2*C}" y="{py + 2*C}" width="{3*C}" height="{3*C}" rx="{.9*C}" fill="{AZUL}"/>')
# panel blanco detrás del código (para que funcione sobre fondo negro también)
pr = (caja[0] * C, caja[1] * C, (caja[2] - caja[0]) * C)
panel = f'<rect x="{pr[1] + C*.5}" y="{pr[0] + C*.5}" width="{pr[2] - C}" height="{pr[2] - C}" rx="{C*2}" fill="#fff"/>'

def svg(fondo, color_lobo):
    bg = f'<rect width="{W}" height="{H}" fill="{fondo}"/>' if fondo else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{bg}'
            f'<g fill="{color_lobo}">{lobo}</g>{panel}<g fill="{TINTA}">{codigo}</g>{"".join(ojos)}</svg>')

Path('qr-lobo.svg').write_text(svg(None, TINTA))
cairosvg.svg2png(bytestring=svg(None, TINTA).encode(), write_to='qr-lobo.png', output_width=2400)
cairosvg.svg2png(bytestring=svg('#fff', TINTA).encode(), write_to='qr-lobo-blanco.png', output_width=2400)
Path('qr-lobo-negro.svg').write_text(svg('#000', '#fff'))
cairosvg.svg2png(bytestring=svg('#000', '#fff').encode(), write_to='qr-lobo-negro.png', output_width=2400)
print('QR', N, 'x', N, '· cuadrícula', cols, 'x', rows, '·', URL)
