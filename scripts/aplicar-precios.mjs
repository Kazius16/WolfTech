/* ============================================================
   APLICAR PRECIOS DE MERCADO
   Lee reportes/precios/mercado.json (lo escribe la revisión semanal:
   el precio MÁS BARATO confiable de cada producto) y se lo manda a
   Supabase → aplicar_precios_mercado(). La base de datos decide el precio
   final y nunca lo deja por debajo del piso de ganancia (07-precio-mercado.sql).
   Guarda el resultado en reportes/precios/aplicado.json.
   Lo corre GitHub Actions (.github/workflows/precios-aplicar.yml) con la
   llave del robot en el secreto PRECIOS_LLAVE (nunca en el código).
   ============================================================ */
import { readFileSync, writeFileSync } from 'node:fs';

const LLAVE = process.env.PRECIOS_LLAVE;
if (!LLAVE) { console.error('Falta el secreto PRECIOS_LLAVE en GitHub → Settings → Secrets → Actions'); process.exit(1); }

const config = readFileSync(new URL('../lib/config.js', import.meta.url), 'utf8');
const SUPABASE_URL = config.match(/SUPABASE_URL = [^']*'([^']+)'/)[1];
const SUPABASE_KEY = config.match(/SUPABASE_KEY = [^']*'(sb_publishable_[^']+)'/)[1];

const entrada = JSON.parse(readFileSync('reportes/precios/mercado.json', 'utf8'));
const cambios = (entrada.productos || [])
  .filter((p) => p.id && p.mercado > 0)
  .map(({ id, mercado, ref }) => ({ id, mercado: Math.round(mercado), ref: String(ref || '').slice(0, 200) }));
if (!cambios.length) { console.log('No hay precios de mercado para aplicar'); process.exit(0); }

const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/aplicar_precios_mercado`, {
  method: 'POST',
  headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ llave: LLAVE, cambios }),
});
if (!r.ok) { console.error('Supabase respondió', r.status, await r.text()); process.exit(1); }
const resultado = await r.json();

const cuenta = resultado.reduce((a, x) => { const k = x.accion.split(':')[0]; a[k] = (a[k] || 0) + 1; return a; }, {});
writeFileSync('reportes/precios/aplicado.json', JSON.stringify({ fecha: new Date().toISOString().slice(0, 10), semana: entrada.fecha, cuenta, resultado }, null, 1) + '\n');
console.log('Aplicado:', JSON.stringify(cuenta));
for (const x of resultado) console.log(`${x.accion.padEnd(12)} ${x.id}: ${x.antes ?? '—'} → ${x.ahora ?? '—'} (mercado ${x.mercado ?? '—'})`);
