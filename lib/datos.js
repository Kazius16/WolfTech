/* ============================================================
   DATOS EN EL SERVIDOR
   Lee el catálogo de Supabase (solo lo público) y lo guarda en caché.
   Si Supabase no responde, usa la copia de respaldo del repositorio.
   ============================================================ */
import { cache } from 'react';
import { SUPABASE_URL, SUPABASE_KEY, REFRESCO } from './config';
import { armarCatalogo, comoTexto } from './catalogo';
import RESPALDO from './catalogo-respaldo';

async function rest(ruta) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, {
    headers: { apikey: SUPABASE_KEY, Accept: 'application/json' },
    next: { revalidate: REFRESCO, tags: ['catalogo'] },
  });
  if (!r.ok) throw new Error(`Supabase ${r.status} en ${ruta}`);
  return r.json();
}

export const obtenerCatalogo = cache(async () => {
  try {
    const [productos, ajustes, fotos] = await Promise.all([
      rest('productos?select=id,orden,categoria,marca,nombre,costo,estado,proveedor,ref,actualizado&order=orden'),
      rest('ajustes?select=*&id=eq.1'),
      rest('fotos?select=producto_id,url'),
    ]);
    const a = ajustes[0] || {};
    const cat = armarCatalogo({
      texto: comoTexto(productos),
      ajustes: {
        margenBase: a.margen_base != null ? +a.margen_base : undefined,
        margenes: a.margenes || {},
        redondeo: a.redondeo ?? undefined,
        fecha: a.fecha_lista || null,
      },
      fotos: Object.fromEntries(fotos.map((f) => [f.producto_id, f.url])),
    });
    // fecha de actualización por producto (para el sitemap)
    const fechas = Object.fromEntries(productos.map((p) => [p.id, p.actualizado]));
    cat.productos.forEach((p) => { p.actualizado = fechas[p.id] || null; });
    return { ...cat, origen: 'supabase' };
  } catch (err) {
    console.error('Catálogo de respaldo:', err.message);
    return { ...armarCatalogo({ texto: RESPALDO, ajustes: {} }), origen: 'respaldo' };
  }
});

export async function obtenerProducto(id) {
  const { productos } = await obtenerCatalogo();
  return productos.find((p) => p.id === id) || null;
}
