/* ============================================================
   PÁGINA DE PRODUCTO  /producto/<id>
   Una dirección propia por producto, para Google y para compartir.
   ============================================================ */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITIO } from '@/lib/config';
import { obtenerCatalogo, obtenerProducto } from '@/lib/datos';
import { lineaSpecs, nombreCorto, slugCategoria, sugerencias, tablaSpecs } from '@/lib/catalogo';
import { pesos } from '@/lib/util';
import Marco from '@/components/Marco';
import JsonLd from '@/components/JsonLd';
import BotonesProducto from '@/components/BotonesProducto';
import Tile from '@/components/Tile';
import { IconoFlecha } from '@/components/Iconos';

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const { productos } = await obtenerCatalogo();
  return productos.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = await obtenerProducto(id);
  if (!p) return { title: 'Producto no encontrado', robots: { index: false } };
  const nombre = `${p.marca} ${p.nombre}`;
  const specs = lineaSpecs(p);
  const desc = `${nombre}${specs ? ` (${specs})` : ''}. ${p.precio ? `Precio de contado ${pesos(p.precio)}.` : 'Pregunta precio y fecha de llegada.'} Nuevo, con garantía. Envíos a toda Colombia desde Envigado. Cotiza por WhatsApp.`;
  return {
    title: `${nombre} | Precio en Colombia`,
    description: desc.slice(0, 300),
    alternates: { canonical: `/producto/${p.id}` },
    openGraph: { title: nombre, description: desc, url: `/producto/${p.id}`, images: p.foto ? [{ url: p.foto, alt: nombre }] : [{ url: '/og.jpg', width: 1200, height: 630 }] },
  };
}

export default async function Producto({ params }) {
  const { id } = await params;
  const p = await obtenerProducto(id);
  if (!p) notFound();
  const { productos } = await obtenerCatalogo();
  const sug = sugerencias(p, productos);
  const misma = productos.filter((x) => x.categoria === p.categoria && x.id !== p.id && x.precio)
    .sort((a, b) => Math.abs((a.precio || 0) - (p.precio || 0)) - Math.abs((b.precio || 0) - (p.precio || 0))).slice(0, 4);
  const urlCat = `/categoria/${slugCategoria(p.categoria)}`;
  const url = `${SITIO}/producto/${p.id}`;

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product', '@id': url + '#producto', name: `${p.marca} ${p.nombre}`, sku: p.id, category: p.categoria,
        brand: { '@type': 'Brand', name: p.marca },
        image: p.foto ? [p.foto] : [SITIO + '/og.jpg'],
        description: `${p.marca} ${p.nombre}. ${lineaSpecs(p)}`.trim(),
        ...(p.precio ? {
          offers: {
            '@type': 'Offer', url, priceCurrency: 'COP', price: p.precio,
            availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition',
            seller: { '@id': SITIO + '/#tienda' },
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy', applicableCountry: 'CO', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
              merchantReturnDays: 5, returnMethod: 'https://schema.org/ReturnByMail', returnFees: 'https://schema.org/ReturnShippingFees',
            },
          },
        } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO + '/' },
          { '@type': 'ListItem', position: 2, name: p.categoria, item: SITIO + urlCat },
          { '@type': 'ListItem', position: 3, name: `${p.marca} ${p.nombre}`, item: url },
        ],
      },
    ],
  };

  return (
    <main className="pdp">
      <JsonLd data={ld} />
      <div className="pd__bar">
        <nav className="pd__crumb" aria-label="Ruta">
          <Link href="/">Inicio</Link><span>/</span><Link href={urlCat}>{p.categoria}</Link><span>/</span><span>{p.marca}</span>
        </nav>
        <Link className="pd__back" href={urlCat}><IconoFlecha />Ver más {p.categoria.toLowerCase()}</Link>
      </div>
      <div className="pd__main">
        <div className="curtain"><Marco p={p} prioridad /></div>
        <div className="pd__info">
          <p className="pd__brand">{p.marca}</p>
          <h1 className="pd__name"><span className="wipe is-in">{nombreCorto(p)}</span></h1>
          <p className="pd__full">{p.marca} {p.nombre}</p>
          <p className="pd__price num">{p.precio ? pesos(p.precio) : 'Consultar'}</p>
          <p className="pd__note">{p.precio ? 'Precio de contado. Te confirmamos disponibilidad por WhatsApp el mismo día.' : 'Producto en tránsito: escríbenos y te damos precio y fecha.'}</p>
          <BotonesProducto id={p.id} />
          <ul className="pd__trust">
            <li>Nuevo, original y con garantía. <Link href="/garantia">Cómo funciona</Link></li>
            <li>Lo revisamos antes de entregarlo.</li>
            <li>Envíos a toda Colombia. <Link href="/envios">Tiempos y costos</Link></li>
          </ul>
          <dl className="specs mono">
            {tablaSpecs(p).map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </div>
      </div>
      {sug.length ? (
        <div className="pd__more">
          <div className="pd__grid">
            {sug.map(([t, sub, items]) => (
              <div key={t}>
                <h2 className="pd__h">{t}</h2>
                <p>{sub}</p>
                <ul className="mini">
                  {items.map((x) => (
                    <li key={x.id}>
                      <Link href={`/producto/${x.id}`}>
                        <span className="mini__n">{x.marca} {x.nombre}<small>{lineaSpecs(x)}</small></span>
                        <span className="mini__p num">{x.precio ? pesos(x.precio) : 'Consultar'}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {misma.length ? (
        <section className="pd__cat" aria-labelledby="otros">
          <h2 id="otros">Otras opciones en {p.categoria.toLowerCase()}</h2>
          <div className="grid">{misma.map((x, i) => <Tile key={x.id} p={x} i={i} />)}</div>
        </section>
      ) : null}
    </main>
  );
}
