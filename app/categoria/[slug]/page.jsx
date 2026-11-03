/* ============================================================
   PÁGINA DE CATEGORÍA  /categoria/<slug>
   Ej. /categoria/tarjetas-de-video
   ============================================================ */
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITIO } from '@/lib/config';
import { obtenerCatalogo } from '@/lib/datos';
import { INTRO_CATEGORIA, ORDEN_CATEGORIAS, categoriaPorSlug, slugCategoria } from '@/lib/catalogo';
import { pesos } from '@/lib/util';
import Catalogo from '@/components/Catalogo';
import JsonLd from '@/components/JsonLd';

export const revalidate = 300;

export function generateStaticParams() {
  return ORDEN_CATEGORIAS.map((c) => ({ slug: slugCategoria(c) }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cat = categoriaPorSlug(slug);
  if (!cat) return { title: 'Categoría no encontrada', robots: { index: false } };
  const { productos } = await obtenerCatalogo();
  const n = productos.filter((p) => p.categoria === cat).length;
  return {
    title: `${cat} en Medellín y Envigado`,
    description: `${INTRO_CATEGORIA[cat]} ${n} referencias con precio de contado, envíos a toda Colombia y asesoría por WhatsApp.`,
    alternates: { canonical: `/categoria/${slug}` },
  };
}

export default async function Categoria({ params }) {
  const { slug } = await params;
  const cat = categoriaPorSlug(slug);
  if (!cat) notFound();
  const { productos } = await obtenerCatalogo();
  const lista = productos.filter((p) => p.categoria === cat);
  const precios = lista.map((p) => p.precio).filter(Boolean);
  const otras = ORDEN_CATEGORIAS.filter((c) => c !== cat && productos.some((p) => p.categoria === c));

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage', name: `${cat} | WolfTech`, url: `${SITIO}/categoria/${slug}`,
        mainEntity: {
          '@type': 'ItemList', numberOfItems: lista.length,
          itemListElement: lista.slice(0, 50).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITIO}/producto/${p.id}`, name: `${p.marca} ${p.nombre}` })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO + '/' },
          { '@type': 'ListItem', position: 2, name: cat, item: `${SITIO}/categoria/${slug}` },
        ],
      },
    ],
  };

  return (
    <main className="cat catp">
      <JsonLd data={ld} />
      <nav className="crumbs" aria-label="Ruta"><Link href="/">Inicio</Link><span>/</span><span>{cat}</span></nav>
      <div className="cat__top">
        <h1 className="sec-title" data-reveal="title">{cat}</h1>
        <p className="cat__lead">
          {INTRO_CATEGORIA[cat]} {lista.length} referencias{precios.length ? `, desde ${pesos(Math.min(...precios))}` : ''}.
        </p>
      </div>
      {lista.length ? <Catalogo categoria={cat} /> : <p className="empty">Por ahora no hay productos publicados en esta categoría. Escríbenos y lo buscamos con el proveedor.</p>}
      <div className="catp__others">
        {otras.map((c) => <Link key={c} className="btn btn--line btn--sm" href={`/categoria/${slugCategoria(c)}`}>{c}</Link>)}
      </div>
    </main>
  );
}
