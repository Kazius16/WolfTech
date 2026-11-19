/* ============================================================
   FOTO SEMANAL DE PRECIOS
   Lee los precios públicos de la vista "catalogo" de Supabase (la misma
   que ve cualquier cliente: SIN costos) y los guarda en
   reportes/precios/ultimo.json para la revisión semanal contra el mercado.
   Lo corre GitHub Actions (.github/workflows/precios-semanal.yml).
   ============================================================ */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';

// la URL y la llave PÚBLICA (publishable) salen de lib/config.js, sin importarlo
const config = readFileSync(new URL('../lib/config.js', import.meta.url), 'utf8');
const SUPABASE_URL = config.match(/SUPABASE_URL = [^']*'([^']+)'/)[1];
const SUPABASE_KEY = config.match(/SUPABASE_KEY = [^']*'(sb_publishable_[^']+)'/)[1];

const h = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
const r = await fetch(`${SUPABASE_URL}/rest/v1/catalogo?select=id,categoria,marca,nombre,estado,precio&order=orden`, { headers: h });
if (!r.ok) { console.error('Supabase respondió', r.status, await r.text()); process.exit(1); }
const productos = await r.json();
mkdirSync('reportes/precios', { recursive: true });
writeFileSync('reportes/precios/ultimo.json', JSON.stringify({
  fecha: new Date().toISOString().slice(0, 10),
  nota: 'Precios públicos de wolftech.com.co (sin costos). Lo usa la revisión semanal de precios.',
  total: productos.length,
  productos,
}, null, 1) + '\n');
console.log(`Guardados ${productos.length} productos`);
