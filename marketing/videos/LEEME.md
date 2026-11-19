# Videos animados de WolfTech

Cada video es una página HTML con una función `render(t)` que dibuja el cuadro del segundo `t`.
`render.cjs` la abre con Playwright, toma un cuadro cada 1/30 s (JPEG 92) y arma el MP4 con FFmpeg
(1080×1920, 30 fps, H.264 CRF 18). El sonido se genera aparte (golpes, subidas, boom) y se une con `-c:v copy`.

| Archivo | Video |
|---|---|
| `01-construye-poder.html` | Lanzamiento: problemas del gamer → piezas → el lobo se enciende → "Construye poder." (18 s) |
| `02-es-compatible.html` | Cadena de compatibilidad pieza por pieza, error con DDR4, "Arma tu PC sin errores." (18,5 s) |
| `03-tres-errores.html` | 3 errores al armar tu PC: memoria DDR4 en AM5, fuente de 500 W con RTX 5070, 9800X3D sin disipador, "Arma bien a la primera." (19,8 s) |

Recursos: `logo.svg` (logo oficial en blanco, no redibujar), `fx.png` (textura del encendido del lobo).

Cómo renderizar:
```bash
cd marketing/videos
python3 -m http.server 8799 &
node render.cjs 03-tres-errores.html          # todas las escenas → 03-tres-errores.mp4 + .cortes.json
node render.cjs 03-tres-errores.html 1,2      # solo esas escenas, para revisar
python3 sonido.py 03-tres-errores             # efectos sintetizados → 03-tres-errores.wav
ffmpeg -i 03-tres-errores.mp4 -i 03-tres-errores.wav -c:v copy -c:a aac -b:a 192k -shortest 03-con-sonido.mp4
```
Cada página nueva define `window.ESC` (escenas) y `window.CORTES` (momentos de sonido: golpe, corte, falla, bien, boom).
Las páginas 01 y 02 no los tienen: `render.cjs` usa la lista ESC por defecto.

Estilo: negro, blanco y azul neón #2E8CFF; Inter Display (Black para golpes, ExtraLight para la marca);
cortes a ~130 BPM (0,46 s); texto importante entre y=230 y y=1620 (zona segura de TikTok).
