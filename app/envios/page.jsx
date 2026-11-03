import Link from 'next/link';
import Legal from '@/components/Legal';

export const metadata = {
  title: 'Envíos a toda Colombia',
  description: 'Cómo enviamos tu pedido de WolfTech: entregas en Envigado, Medellín y el Valle de Aburrá, y envíos a toda Colombia por transportadora con número de guía.',
  alternates: { canonical: '/envios' },
};

export default function Envios() {
  return (
    <Legal ruta="/envios" titulo="Envíos" lead="Despachamos desde Envigado a todo el país. Antes de pagar te decimos cuánto cuesta el envío y cuándo llega.">
      <h2>Cuándo sale tu pedido</h2>
      <p>El pedido se despacha cuando el pago está confirmado. Ese mismo día recogemos el producto con el proveedor, lo revisamos y lo preparamos para la entrega.</p>
      <p>Si un producto aparece como <strong>«Consultar»</strong> está en tránsito: te damos la fecha estimada antes de que pagues.</p>

      <h2>Envigado, Medellín y el Valle de Aburrá</h2>
      <ul>
        <li>Coordinamos la entrega contigo por WhatsApp: dirección, día y franja horaria.</li>
        <li>Normalmente entregamos el mismo día o el día hábil siguiente al pago, según la hora y la disponibilidad del proveedor.</li>
        <li>El costo del domicilio depende de la zona. Lo paga el cliente y te lo decimos antes de pagar.</li>
      </ul>

      <h2>Resto de Colombia</h2>
      <ul>
        <li>Enviamos por transportadora, con el paquete asegurado por el valor de la compra.</li>
        <li>Te mandamos el número de guía para que sigas el envío.</li>
        <li>El tiempo depende de la ciudad: en ciudades principales suele tardar de 1 a 3 días hábiles y en otros municipios puede tardar más. Son tiempos de la transportadora, no los podemos garantizar.</li>
        <li>El costo del envío depende del destino, el tamaño y el peso. Lo paga el cliente y te lo cotizamos antes de pagar.</li>
      </ul>

      <h2>Cuando recibes el paquete</h2>
      <ul>
        <li>Revisa que la caja llegue sellada y sin golpes antes de firmar. Si se ve dañada, déjalo anotado en la guía de la transportadora.</li>
        <li>Te recomendamos grabar un video mientras abres el paquete. Si algo llega mal, ese video hace mucho más fácil y rápido el reclamo.</li>
        <li>Si falta algo o llega dañado, escríbenos lo antes posible con fotos o el video. Lo resolvemos contigo y con la transportadora.</li>
      </ul>
      <p className="nota">Esto no reemplaza tus derechos de <Link href="/garantia">garantía</Link> ni de <Link href="/cambios-y-retracto">retracto</Link>: siguen igual.</p>
    </Legal>
  );
}
