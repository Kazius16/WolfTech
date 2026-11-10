# Videos animados de WolfTech

Cada video es una página HTML con una función `render(t)` que dibuja el cuadro del segundo `t`.
`render.cjs` la abre con Playwright, toma un cuadro cada 1/30 s (JPEG 92) y arma el MP4 con FFmpeg
(1080×1920, 30 fps, H.264 CRF 18). El sonido se genera aparte (golpes, subidas, boom) y se une con `-c:v copy`.

| Archivo | Video |
|---|---|
| `01-construye-poder.html` | Lanzamiento: problemas del gamer → piezas → el lobo se enciende → "Construye poder." (18 s) |
| `02-es-compatible.html` | Cadena de compatibilidad pieza por pieza, error con DDR4, "Arma tu PC sin errores." (18,5 s) |

Recursos: `logo.svg` (logo oficial en blanco, no redibujar), `fx.png` (textura del encendido del lobo).

Cómo renderizar:
```bash
cd marketing/videos
python3 -m http.server 8799 &
# en render.cjs: cambiar el nombre del .html y la lista ESC de escenas [inicio, fin]
node render.cjs
```

Estilo: negro, blanco y azul neón #2E8CFF; Inter Display (Black para golpes, ExtraLight para la marca);
cortes a ~130 BPM (0,46 s); texto importante entre y=230 y y=1620 (zona segura de TikTok).
