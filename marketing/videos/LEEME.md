# Videos de WolfTech

Cada video es una página HTML con una función `render(t)` que dibuja el cuadro del segundo `t`.
`render.cjs` la abre con Playwright, toma un cuadro cada 1/30 s y arma el MP4 con FFmpeg (1080×1920, 30 fps).

- `01-construye-poder.html`: anuncio de lanzamiento (18 s).
- Necesita `fx.png` (está en `public/fx.png`) en la misma carpeta y un servidor local:
  `python3 -m http.server 8799` y luego `node render.cjs`.
