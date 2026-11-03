/* Página de inicio: hero, catálogo, armador y cómo compras */
import { SITIO, TIENDA, telefonoIntl } from '@/lib/config';
import { obtenerCatalogo } from '@/lib/datos';
import Hero from '@/components/Hero';
import Catalogo from '@/components/Catalogo';
import Armador from '@/components/Armador';
import ComoCompras from '@/components/ComoCompras';
import JsonLd from '@/components/JsonLd';

export const revalidate = 300;
export const metadata = { alternates: { canonical: '/' } };

export default async function Inicio() {
  const { productos } = await obtenerCatalogo();
  const disp = productos.filter((p) => p.precio).length;
  const marcas = new Set(productos.map((p) => p.marca)).size;
  return (
    <main id="inicio">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'ComputerStore', '@id': SITIO + '/#tienda', name: 'WolfTech', url: SITIO + '/',
            logo: SITIO + '/apple-touch-icon.png', image: SITIO + '/og.jpg', telephone: telefonoIntl(), email: TIENDA.correo,
            description: 'Tienda de componentes y PC gamer en Envigado y Medellín, con envíos a toda Colombia.',
            address: { '@type': 'PostalAddress', addressLocality: 'Envigado', addressRegion: 'Antioquia', addressCountry: 'CO' },
            areaServed: [...['Medellín', 'Envigado', 'Itagüí', 'Sabaneta', 'Bello', 'La Estrella'].map((c) => ({ '@type': 'City', name: c })), { '@type': 'Country', name: 'Colombia' }],
            priceRange: '$$',
          },
          { '@type': 'WebSite', '@id': SITIO + '/#web', url: SITIO + '/', name: 'WolfTech', inLanguage: 'es-CO', publisher: { '@id': SITIO + '/#tienda' } },
        ],
      }} />
      <Hero />
      <section className="cat" id="catalogo" aria-labelledby="catTitle">
        <div className="cat__top">
          <h2 className="sec-title" id="catTitle" data-reveal="title">Catálogo</h2>
          <p className="cat__lead">{productos.length} referencias de {marcas} marcas. {productos.length - disp} en tránsito: pregúntanos y te damos fecha.</p>
        </div>
        <Catalogo />
      </section>
      <Armador />
      <ComoCompras />
    </main>
  );
}
