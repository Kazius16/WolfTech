/* ============================================================
   DATOS EN EL SERVIDOR
   Lee el catálogo público de Supabase (vista "catalogo": sin costos,
   con el precio ya calculado) y lo guarda en caché.
   Si Supabase no responde, usa la copia de respaldo del repositorio.
   ============================================================ */
import { cache } from 'react';
import { SUPABASE_URL, SUPABASE_KEY, REFRESCO, AJUSTES_BASE } from './config';
import { catalogoDesdeVista } from './catalogo';
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
    const [filas, ajustes, fotos] = await Promise.all([
      rest('catalogo?select=id,orden,categoria,marca,nombre,estado,precio,actualizado&order=orden'),
      rest('ajustes?select=fecha_lista&id=eq.1'),
      rest('fotos?select=producto_id,url'),
    ]);
    const productos = catalogoDesdeVista(filas, Object.fromEntries(fotos.map((f) => [f.producto_id, f.url])));
    return { productos, fecha: ajustes[0]?.fecha_lista || AJUSTES_BASE.fecha, origen: 'supabase' };
  } catch (err) {
    console.error('Catálogo de respaldo:', err.message);
    return { productos: catalogoDesdeVista(RESPALDO.productos), fecha: RESPALDO.fecha, origen: 'respaldo' };
  }
});

export async function obtenerProducto(id) {
  const { productos } = await obtenerCatalogo();
  return productos.find((p) => p.id === id) || null;
}
