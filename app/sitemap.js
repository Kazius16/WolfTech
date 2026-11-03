/* Mapa del sitio para Google: se arma solo con los productos publicados */
import { SITIO } from '@/lib/config';
import { obtenerCatalogo } from '@/lib/datos';
import { ORDEN_CATEGORIAS, slugCategoria } from '@/lib/catalogo';

export const revalidate = 3600;

export default async function sitemap() {
  const { productos } = await obtenerCatalogo();
  const hoy = new Date();
  const cats = ORDEN_CATEGORIAS.filter((c) => productos.some((p) => p.categoria === c));
  return [
    { url: SITIO + '/', lastModified: hoy, changeFrequency: 'daily', priority: 1 },
    ...cats.map((c) => ({ url: `${SITIO}/categoria/${slugCategoria(c)}`, lastModified: hoy, changeFrequency: 'daily', priority: 0.8 })),
    ...productos.map((p) => ({ url: `${SITIO}/producto/${p.id}`, lastModified: p.actualizado ? new Date(p.actualizado) : hoy, changeFrequency: 'weekly', priority: p.estado === 'destacado' ? 0.8 : 0.6 })),
    ...['envios', 'garantia', 'cambios-y-retracto', 'privacidad'].map((s) => ({ url: `${SITIO}/${s}`, changeFrequency: 'yearly', priority: 0.3 })),
  ];
}
