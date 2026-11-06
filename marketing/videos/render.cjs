const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const ESC = [[0, 3.5], [3.5, 5.0], [5.0, 7.7], [7.7, 8.6], [8.6, 12.0], [12.0, 14.2], [14.2, 18.0]];
const solo = process.argv[2] ? process.argv[2].split(',').map(Number) : ESC.map((_, i) => i);
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('http://localhost:8799/anuncio.html'); await pg.evaluate(() => window.listo);
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
})();
