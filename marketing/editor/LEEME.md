# Editor de videos WolfTech

Convierte las tomas crudas del celular en un video vertical listo para TikTok/Reels/Facebook, con el estilo de la marca:
pausas cortadas, zoom alternado en cada corte, color corregido (incluye HDR del iPhone), gráficos animados,
subtítulos automáticos con la palabra actual en azul, cierre con el lobo y dos versiones de sonido.

En Claude Code basta con escribir **`/editar-video <carpeta>`**. Este LEEME es para saber qué pasa por dentro.

## Instalar (una sola vez)
1. **ffmpeg completo** (con `zscale`, para pasar el HDR del iPhone a normal):
   - Windows: `winget install Gyan.FFmpeg` · macOS: `brew install ffmpeg` · Linux: `sudo apt install ffmpeg`
2. **Node 18+** y, dentro de esta carpeta: `npm install` y luego `npx playwright install chromium`
3. **Python 3.10+**: `pip install faster-whisper numpy scipy`
   - faster-whisper hace los subtítulos y ubica los gráficos en la palabra exacta. La primera vez descarga el modelo (~500 MB).
   - Sin faster-whisper también funciona: corta por pausas, pero no hay subtítulos y los gráficos se ubican con `"t"` (segundos).
4. **Fuente Inter / Inter Display** instalada en el computador (gratis en https://rsms.me/inter). Sin ella los textos salen en otra fuente.

## Usar
```bash
python editar.py ../../videos-crudos/parte-por-parte-02 --revisar   # transcribe y hace hoja de contacto (rápido)
python editar.py ../../videos-crudos/parte-por-parte-02             # video final en <carpeta>/salida/
```
La carpeta lleva las tomas y un `guion.json` (copiar `guion-ejemplo.json`). Las tomas crudas **no se suben a git** (pesan mucho).

## guion.json
- `clips`: tomas en orden. `nombre` (para referirse a ella), `destello` (destello blanco al empezar), `cola` (segundos que deja correr al final, p. ej. un paneo al logo), `desde`/`hasta` (recortar la toma), `tramos` (forzar a mano qué partes usar), `sin_zoom`.
- `graficos`: lista de gráficos. Tipos:
  - `titulo` (gancho arriba, con `kicker`) · `seccion` (rótulo mono azul) · `chip` (texto grande abajo) · `fila` (dato con `detalle`, `fila`: 0, 1, 2…) · `nota` (texto mediano, `y`) · `medidor` (barra que se llena; `marcas` con `valor`, `texto`, `cuando`).
  - En los textos, `*palabra*` sale en azul y `\n` es salto de línea.
- `cuando` / `hasta`:
  - `{"clip": "monitor", "palabra": "1080p"}` → cuando se dice esa palabra (necesita Whisper). Si se repite, toma la siguiente aparición.
  - `{"clip": "monitor", "t": 5.5}` → segundo 5.5 de esa toma (sin Whisper).
  - `{"seccion": "fuente"}` → cuando empieza esa toma. `"mas": 1.5` suma segundos.
  - Sin `hasta`, el gráfico dura hasta que termina la toma donde aparece.
- `velocidad` (1.08), `zooms` ([1.0, 1.14]), `color` (filtro de ffmpeg), `subtitulos` (true/false), `cierre` (`frase`, `duracion`).

## Reglas de la marca (no cambiar sin hablarlo)
- Colores: negro, blanco y azul #2E8CFF. Inter Display (Black para golpes, ExtraLight para la marca).
- El logo es `../videos/logo.svg`, exacto. Nunca redibujarlo.
- Texto importante entre y=230 y y=1620 (la interfaz de TikTok tapa arriba y abajo).
- Nada de emojis como íconos, degradados morados ni precios sin confirmar.
- Datos técnicos iguales a los de la tienda (`lib/catalogo.js`). Si no se puede verificar, no va.
