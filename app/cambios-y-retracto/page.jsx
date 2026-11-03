import Link from 'next/link';
import Legal from '@/components/Legal';

export const metadata = {
  title: 'Cambios, retracto y reversión del pago',
  description: 'Derecho de retracto en compras a distancia (artículo 47 de la Ley 1480 de 2011), cambios y reversión del pago en WolfTech.',
  alternates: { canonical: '/cambios-y-retracto' },
};

export default function Retracto() {
  return (
    <Legal ruta="/cambios-y-retracto" titulo="Cambios y retracto" lead="Si compraste por WhatsApp o por la página y te arrepientes, tienes 5 días hábiles desde que recibes el producto para devolverlo.">
      <h2>Derecho de retracto</h2>
      <p>Las compras que haces sin ver el producto en persona (por WhatsApp, por la página o por redes) son ventas a distancia. En ellas tienes derecho de retracto, según el artículo 47 de la Ley 1480 de 2011.</p>
      <ul>
        <li><strong>Plazo:</strong> 5 días hábiles contados desde que recibes el producto.</li>
        <li><strong>Cómo:</strong> escríbenos por WhatsApp o al correo dentro de ese plazo diciendo que te retractas. No tienes que explicar el motivo.</li>
        <li><strong>Estado del producto:</strong> devuélvelo en las mismas condiciones en que lo recibiste: sin uso, con caja, accesorios, manuales y sellos.</li>
        <li><strong>Costos:</strong> el transporte y los demás gastos de la devolución los paga el cliente.</li>
        <li><strong>Devolución del dinero:</strong> te devolvemos todo lo que pagaste, sin descuentos ni retenciones, en máximo 15 días calendario desde que ejerces el derecho.</li>
      </ul>
      <h3>Cuándo no aplica</h3>
      <p>La ley señala algunas excepciones. La que más puede aplicar en esta tienda es la de productos hechos o adaptados a la medida de lo que pidió el cliente. Si alguna excepción aplica a tu pedido, te lo decimos antes de que pagues.</p>

      <h2>Cambios</h2>
      <p>Si el producto tiene una falla, aplica la <Link href="/garantia">garantía</Link>. Si te equivocaste de referencia o quieres otra, escríbenos: si estás dentro del plazo de retracto lo resolvemos así, y si no, miramos con el proveedor qué se puede hacer.</p>
      <p>Para evitar errores, antes de pagar confirma con nosotros la compatibilidad de las piezas. El <Link href="/#armador">armador de PC</Link> ya revisa socket, memoria y fuente.</p>

      <h2>Reversión del pago</h2>
      <p>Si pagaste con tarjeta de crédito, tarjeta débito u otro medio de pago electrónico, puedes pedir que se reverse el pago, según el artículo 51 de la Ley 1480 de 2011, cuando:</p>
      <ul>
        <li>fuiste víctima de fraude o la operación no la hiciste tú;</li>
        <li>no recibiste el producto;</li>
        <li>el producto que recibiste no es el que pediste, o está defectuoso.</li>
      </ul>
      <p>Para eso, dentro de los 5 días hábiles siguientes a que te enteres del problema, presenta la queja ante nosotros y avisa también a la entidad que emitió tu medio de pago. Después de la solicitud, la reversión se hace en máximo 15 días hábiles.</p>
    </Legal>
  );
}
