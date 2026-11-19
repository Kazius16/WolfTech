// Render de videos WolfTech: HTML con render(t) → Playwright → FFmpeg.
// Uso:  node render.cjs 03-tres-errores.html            (todas las escenas)
//       node render.cjs 03-tres-errores.html 1,2        (solo esas escenas, para revisar)
// Escenas: si la página define window.ESC = [[inicio, fin], ...] se usan esas; si no, la lista ESC de abajo.
// Salida: <nombre>.mp4 (sin sonido) y <nombre>.cortes.json (momentos para sonido.py).
// Requiere un servidor en esta carpeta:  python3 -m http.server 8799
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const HTML = process.argv[2] || '01-construye-poder.html';
const NOMBRE = HTML.replace(/\.html$/, '');
const ESC_DEFECTO = [[0, 3.5], [3.5, 5.0], [5.0, 7.7], [7.7, 8.6], [8.6, 12.0], [12.0, 14.2], [14.2, 18.0]];
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto(`http://localhost:8799/${HTML}`); await pg.evaluate(() => window.listo);
  const ESC = (await pg.evaluate(() => window.ESC)) || ESC_DEFECTO;
  const solo = process.argv[3] ? process.argv[3].split(',').map(Number) : ESC.map((_, i) => i);
  const cortes = await pg.evaluate(() => window.CORTES || []);
  fs.writeFileSync(`${NOMBRE}.cortes.json`, JSON.stringify({ duracion: ESC[ESC.length - 1][1], cortes }));
  for (const i of solo) {
    const [a, z] = ESC[i], n = Math.round((z - a) * 30), tmp = `esc${i}.tmp.mp4`;
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', tmp]);
    for (let k = 0; k < n; k++) {
      await pg.evaluate((t) => window.render(t), a + k / 30);
      const buf = await pg.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    const code = await new Promise(r => ff.on('close', r));
    if (code === 0) fs.renameSync(tmp, `esc${i}.mp4`); else console.log('fallo escena', i);
    console.log('escena', i, n, 'cuadros');
  }
  await b.close();
  // si se renderizaron todas, se unen en un solo MP4
  if (!process.argv[3]) {
    fs.writeFileSync('lista.txt', ESC.map((_, i) => `file 'esc${i}.mp4'`).join('\n'));
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', 'lista.txt', '-c', 'copy', `${NOMBRE}.mp4`]);
    ESC.forEach((_, i) => fs.unlinkSync(`esc${i}.mp4`)); fs.unlinkSync('lista.txt');
    console.log('listo:', `${NOMBRE}.mp4`);
  }
})();
