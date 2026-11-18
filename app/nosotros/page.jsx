/* Quiénes somos: quién está detrás de la tienda y cómo trabajamos (genera confianza) */
import Link from 'next/link';
import Legal from '@/components/Legal';
import JsonLd from '@/components/JsonLd';
import { SITIO, TIENDA, REDES } from '@/lib/config';

export const metadata = {
  title: 'Quiénes somos',
  description: 'WolfTech es una tienda de hardware de PC de Envigado, Antioquia. Quién está detrás, cómo trabajamos con distribuidores mayoristas y por qué revisamos cada producto antes de entregarlo.',
  alternates: { canonical: '/nosotros' },
};

export default function Nosotros() {
  return (
    <Legal info ruta="/nosotros" titulo="Quiénes somos" lead="WolfTech es una tienda de hardware de PC de Envigado, Antioquia. Armamos y vendemos equipos para jugar, crear y trabajar, con precios claros y alguien real al otro lado del WhatsApp.">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'AboutPage', name: 'Quiénes somos | WolfTech', url: SITIO + '/nosotros',
        about: { '@id': SITIO + '/#tienda' },
      }} />

      <h2>Quién está detrás</h2>
      <p>WolfTech es un negocio familiar de Envigado. El titular es <strong>{TIENDA.titular}</strong> ({TIENDA.documento}), con domicilio en {TIENDA.direccion}, {TIENDA.ciudad}. Cada pedido lo atiende una persona del equipo, no un bot.</p>

      <h2>Cómo trabajamos</h2>
      <p>No guardamos bodega propia: trabajamos con distribuidores mayoristas de Medellín. Eso nos deja tener cientos de referencias sin subir los precios para pagar inventario. A cambio, somos claros con el proceso:</p>
      <ul>
        <li><strong>Antes de cobrarte</strong> confirmamos con el distribuidor que el producto está disponible y el precio final.</li>
        <li><strong>El mismo día del pago</strong> recogemos el producto.</li>
        <li><strong>Lo revisamos antes de entregártelo</strong>: que esté nuevo, sellado y completo.</li>
        <li>Si un producto dice «Consultar», está en tránsito: te damos la fecha estimada antes de que pagues.</li>
      </ul>

      <h2>Qué vendemos</h2>
      <p>Procesadores, tarjetas de video, boards, memoria RAM, almacenamiento, fuentes, refrigeración, chasis, portátiles, monitores, periféricos y más. Todo es nuevo y original, de marcas como AMD, Intel, NVIDIA, MSI, ASUS, Gigabyte, Lenovo y Logitech. Si estás armando un PC, el <Link href="/#armador">armador</Link> te avisa si las piezas son compatibles.</p>

      <h2>Tu compra está protegida</h2>
      <ul>
        <li><Link href="/garantia">Garantía legal</Link> de todos los productos, según el Estatuto del Consumidor (Ley 1480 de 2011).</li>
        <li><Link href="/cambios-y-retracto">Derecho de retracto</Link> de 5 días hábiles en compras a distancia.</li>
        <li><Link href="/envios">Envíos a toda Colombia</Link> con número de guía y paquete asegurado.</li>
        <li>Tus datos se tratan según nuestra <Link href="/privacidad">política de tratamiento de datos</Link>.</li>
      </ul>

      <h2>Síguenos</h2>
      <p>Publicamos armados, comparativas y novedades en{' '}
        {REDES.tiktok && <><a href={REDES.tiktok} target="_blank" rel="noopener">TikTok</a>, </>}
        {REDES.instagram && <><a href={REDES.instagram} target="_blank" rel="noopener">Instagram</a> y </>}
        {REDES.facebook && <a href={REDES.facebook} target="_blank" rel="noopener">Facebook</a>}.
      </p>
    </Legal>
  );
}
