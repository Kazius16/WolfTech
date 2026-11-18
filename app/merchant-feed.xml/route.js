/* ============================================================
   FEED PARA GOOGLE MERCHANT CENTER  →  /merchant-feed.xml
   Lista de productos para Google Shopping (fichas gratuitas).
   · Solo productos con foto y con precio (Google exige imagen y precio).
   · Se actualiza solo: Google lo descarga cada día.
   ============================================================ */
import { SITIO } from '@/lib/config';
import { obtenerCatalogo } from '@/lib/datos';
import { tablaSpecs } from '@/lib/catalogo';

export const revalidate = 3600;

const xml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function descripcion(p) {
  const specs = tablaSpecs(p).filter(([k]) => k !== 'Estado').map(([k, v]) => `${k}: ${v}`).join('. ');
  return `${p.marca} ${p.nombre}. ${specs ? specs + '. ' : ''}Producto nuevo y original, con garantía. Lo revisamos antes de entregarlo. Envíos a toda Colombia desde Envigado (Antioquia).`;
}

export async function GET() {
  const { productos } = await obtenerCatalogo();
  const lista = productos.filter((p) => p.precio && p.foto);
  const items = lista.map((p) => `
    <item>
      <g:id>${xml(p.id)}</g:id>
      <g:title>${xml(`${p.marca} ${p.nombre}`.slice(0, 150))}</g:title>
      <g:description>${xml(descripcion(p).slice(0, 5000))}</g:description>
      <g:link>${SITIO}/producto/${xml(p.id)}</g:link>
      <g:image_link>${xml(p.foto.startsWith('/') ? SITIO + p.foto : p.foto)}</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:price>${p.precio}.00 COP</g:price>
      <g:condition>new</g:condition>
      <g:brand>${xml(p.marca)}</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:product_type>${xml(p.categoria)}</g:product_type>
    </item>`).join('');

  const cuerpo = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>WolfTech</title>
    <link>${SITIO}</link>
    <description>Componentes y PC gamer en Medellín y Envigado</description>${items}
  </channel>
</rss>
`;
  return new Response(cuerpo, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=3600' } });
}
