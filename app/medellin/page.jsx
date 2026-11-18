/* Página local: Medellín y Valle de Aburrá (para búsquedas tipo «PC gamer Medellín») */
import Link from 'next/link';
import Legal from '@/components/Legal';
import JsonLd from '@/components/JsonLd';
import { SITIO } from '@/lib/config';
import { obtenerCatalogo } from '@/lib/datos';
import { ORDEN_CATEGORIAS, slugCategoria } from '@/lib/catalogo';
import { pesos } from '@/lib/util';

export const revalidate = 300;

export const metadata = {
  title: 'PC gamer y componentes en Medellín y Envigado',
  description: 'Tarjetas de video, procesadores, portátiles gamer y componentes de PC con entrega en Medellín, Envigado, Itagüí, Sabaneta, Bello y La Estrella. Revisados antes de entregar y con garantía.',
  alternates: { canonical: '/medellin' },
};

const MUNICIPIOS = ['Medellín', 'Envigado', 'Sabaneta', 'Itagüí', 'La Estrella', 'Bello', 'Caldas', 'Copacabana'];

export default async function Medellin() {
  const { productos } = await obtenerCatalogo();
  const cats = ORDEN_CATEGORIAS.filter((c) => productos.some((p) => p.categoria === c));
  const desde = (c) => { const v = productos.filter((p) => p.categoria === c && p.precio).map((p) => p.precio); return v.length ? Math.min(...v) : null; };
  const destacados = productos.filter((p) => p.estado === 'destacado' && p.precio).slice(0, 6);

  return (
    <Legal info ruta="/medellin" titulo="Medellín y Valle de Aburrá" lead="Somos de Envigado. Si estás en el Valle de Aburrá, te llevamos tus componentes o tu portátil revisados, normalmente el mismo día o el día hábil siguiente al pago.">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'WebPage', name: 'PC gamer y componentes en Medellín | WolfTech', url: SITIO + '/medellin',
        about: { '@id': SITIO + '/#tienda' },
        breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO + '/' },
          { '@type': 'ListItem', position: 2, name: 'Medellín y Valle de Aburrá', item: SITIO + '/medellin' },
        ] },
      }} />

      <h2>Entregas en el Valle de Aburrá</h2>
      <p>Entregamos en {MUNICIPIOS.slice(0, -1).join(', ')} y {MUNICIPIOS.at(-1)}. Coordinamos contigo por WhatsApp la dirección, el día y la franja horaria. El domicilio depende de la zona y te lo decimos antes de pagar.</p>
      <p>Como trabajamos con distribuidores de Medellín, recogemos tu pedido el mismo día del pago y lo revisamos antes de llevarlo: que esté nuevo, sellado y completo.</p>

      <h2>Qué encuentras</h2>
      <p>{productos.length} referencias de hardware y tecnología:</p>
      <ul>
        {cats.map((c) => { const d = desde(c); return (
          <li key={c}><Link href={`/categoria/${slugCategoria(c)}`}>{c}</Link>{d ? ` — desde ${pesos(d)}` : ''}</li>
        ); })}
      </ul>

      {destacados.length > 0 && <>
        <h2>Lo más pedido</h2>
        <ul>
          {destacados.map((p) => <li key={p.id}><Link href={`/producto/${p.id}`}>{p.marca} {p.nombre}</Link> — {pesos(p.precio)}</li>)}
        </ul>
      </>}

      <h2>¿Armando un PC gamer?</h2>
      <p>En el <Link href="/#armador">armador</Link> eliges las piezas y te avisa si son compatibles (socket, memoria y potencia de la fuente). Envías el pedido completo por WhatsApp y te confirmamos precio y disponibilidad de todo junto.</p>

      <h2>¿Fuera de Antioquia?</h2>
      <p>También enviamos a toda Colombia por transportadora, con el paquete asegurado y número de guía. <Link href="/envios">Así funcionan los envíos</Link>.</p>
    </Legal>
  );
}
