---
description: Edita las tomas crudas de un video de WolfTech con el editor de la marca (pausas, zoom, color, gráficos, subtítulos, cierre y sonido)
argument-hint: <carpeta con las tomas> [qué video es, p. ej. "parte por parte 02 · RAM"]
---

Edita el video de WolfTech que está en: $ARGUMENTS

Usa el editor de `marketing/editor/` (lee `marketing/editor/LEEME.md` si es la primera vez). Sigue estos pasos y no te saltes la revisión:

1. **Revisar el entorno.** Comprueba que estén `ffmpeg` (con el filtro `zscale`), `node` con Playwright en `marketing/editor/node_modules` y Python con `faster-whisper`, `numpy` y `scipy`. Si falta algo, instálalo (ver LEEME) y dime qué instalaste.

2. **Mirar las tomas.** Corre `python marketing/editor/editar.py <carpeta> --revisar`. Abre la hoja de contacto (`salida/hoja-contacto.jpg`) y lee la transcripción de cada toma.
   - Identifica qué parte del guion es cada toma. El guion de la semana está en `marketing/semanas/` o en los documentos del proyecto WOLFTECH; si no lo encuentras, pregúntame cuál es.
   - Si hay varias tomas de la misma parte, elige la mejor (completa, sin trabas, enfocada) y dime cuál descartaste y por qué.
   - Si la persona se equivocó o repitió una frase dentro de una toma, sácala con `tramos` o `desde`/`hasta`.

3. **Escribir `<carpeta>/guion.json`** a partir de `marketing/editor/guion-ejemplo.json`:
   - Gancho con `titulo` arriba desde el segundo 0.
   - Un `seccion` + `fila`/`chip`/`medidor` por cada dato importante, anclado con `"palabra"` al momento exacto en que se dice.
   - Cierre con la frase de la marca que encaje con el video.
   - Solo datos que coincidan con la tienda (`lib/catalogo.js`). Nada de precios ni FPS sin confirmar.

4. **Renderizar** con `python marketing/editor/editar.py <carpeta>`.

5. **Revisar el resultado antes de entregarlo.** Saca cuadros del video final (por ejemplo uno cada 4 segundos con ffmpeg) y míralos:
   - que ningún gráfico tape la cara ni se salga de la zona segura (y entre 230 y 1620),
   - que los subtítulos estén bien escritos (corrige nombres como «RTX», «DDR5», «WolfTech» en `_trabajo/<toma>.palabras.json` y vuelve a renderizar),
   - que el color de piel se vea natural (si se ve amarillo, sube `temperature` en `color`; si se ve azul, bájala).
   Corrige y vuelve a renderizar hasta que esté bien.

6. **Entregar.** Dime dónde quedaron `<nombre>-con-efectos.mp4` y `<nombre>-solo-voz.mp4`, cuánto dura y qué tomas usaste. Recuérdame que la versión «solo voz» es para ponerle el audio en tendencia dentro de TikTok o Instagram.
