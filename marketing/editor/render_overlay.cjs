// Dibuja la capa de gráficos cuadro por cuadro (PNG transparente) con Playwright.
// Uso: node render_overlay.cjs <carpeta_trabajo> <carpeta_cuadros> [t1,t2,...]
// La carpeta de trabajo tiene overlay.html, plan.json y logo.svg (los copia editar.py).
// Con una lista de tiempos solo saca esos cuadros (para revisar).
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const [dir, salida, tiempos] = process.argv.slice(2);
const tipos = { '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const f = path.join(dir, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(path.resolve(dir)) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

server.listen(0, async () => {
  const port = server.address().port;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', (e) => console.log('ERROR en la página:', e.message));
  await p.goto(`http://127.0.0.1:${port}/overlay.html`);
  await p.evaluate(() => window.listo);
  const plan = JSON.parse(fs.readFileSync(path.join(dir, 'plan.json'), 'utf8'));
  const lista = tiempos ? tiempos.split(',').map(Number) : null;
  const n = lista ? lista.length : Math.round(plan.total * 30);
  for (let k = 0; k < n; k++) {
    const t = lista ? lista[k] : k / 30;
    await p.evaluate((t) => window.render(t), t);
    const nombre = lista ? `t_${t}.png` : `${String(k).padStart(5, '0')}.png`;
    await p.screenshot({ path: path.join(salida, nombre), omitBackground: true });
    if (!lista && k % 150 === 0) console.log(`  cuadro ${k}/${n}`);
  }
  await b.close();
  server.close();
});
