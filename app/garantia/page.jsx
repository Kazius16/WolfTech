import Legal from '@/components/Legal';

export const metadata = {
  title: 'Garantía',
  description: 'Garantía de los productos de WolfTech según el Estatuto del Consumidor (Ley 1480 de 2011): término, cómo reclamar y qué cubre.',
  alternates: { canonical: '/garantia' },
};

export default function Garantia() {
  return (
    <Legal ruta="/garantia" titulo="Garantía" lead="Todo lo que vendemos es nuevo, original y tiene garantía legal. Si algo falla, nos escribes a nosotros y nosotros nos encargamos.">
      <h2>Cuánto dura</h2>
      <p>La garantía cubre la calidad, el buen funcionamiento y la seguridad del producto, como lo exige el Estatuto del Consumidor (Ley 1480 de 2011).</p>
      <ul>
        <li>El término es el que da el fabricante para cada producto. Te lo indicamos al confirmar tu pedido.</li>
        <li>Si no se indica un término, la garantía de un producto nuevo es de <strong>un (1) año</strong>.</li>
        <li>Empieza a contar desde el día en que recibes el producto.</li>
        <li>Mientras el producto está en revisión o reparación por garantía, ese tiempo no se descuenta.</li>
      </ul>

      <h2>Cómo reclamar</h2>
      <ol>
        <li>Escríbenos por WhatsApp o al correo con tu nombre, el producto, la fecha de compra y qué falla tiene. Fotos o un video de la falla ayudan mucho.</li>
        <li>Te decimos cómo hacernos llegar el producto. Debe ir completo, con sus accesorios y, si la tienes, la caja.</li>
        <li>Cuando lo recibimos te damos una constancia con la fecha y el estado en que llegó.</li>
        <li>Lo revisamos y, si hace falta, lo tramitamos con el proveedor o el fabricante. Te mantenemos al tanto.</li>
      </ol>

      <h2>Qué hacemos si el producto falla</h2>
      <ul>
        <li>Primero, la reparación gratuita del producto.</li>
        <li>Si la falla se repite después de repararlo, o si no tiene arreglo, puedes pedir el cambio por uno igual (o similar) o la devolución de tu dinero.</li>
        <li>La reparación no debe tardar más de 30 días hábiles desde que recibimos el producto.</li>
      </ul>

      <h2>Qué no cubre la garantía</h2>
      <p>Según la ley, la garantía no aplica cuando el daño se debe a fuerza mayor o caso fortuito, al hecho de un tercero, al uso indebido del producto o a no seguir las instrucciones de instalación y uso. En hardware de PC eso incluye, por ejemplo:</p>
      <ul>
        <li>Golpes, humedad, líquidos o quemaduras visibles.</li>
        <li>Pines doblados en procesadores o en el socket de la board.</li>
        <li>Sellos, etiquetas o números de serie rotos o modificados.</li>
        <li>Instalación incorrecta o modificaciones físicas, como cambiar el disipador de una tarjeta de video.</li>
      </ul>
      <p className="nota">Antes de entregarte cada producto lo revisamos. Si lo recibes en persona, revísalo con nosotros en el momento.</p>
    </Legal>
  );
}
