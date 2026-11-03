/* Cómo compras (proceso real, en orden) */
import Link from 'next/link';

const PASOS = [
  ['Cotizas', 'Escríbenos por WhatsApp desde cualquier producto, o arma tu PC y envía el pedido completo.'],
  ['Confirmamos', 'Verificamos disponibilidad y precio final con el proveedor el mismo día.'],
  ['Pagas', 'Te enviamos los datos para el pago. Con el pago confirmado apartamos tu pedido.'],
  ['Revisamos', 'Recogemos el producto y lo revisamos antes de entregártelo o despacharlo.'],
  ['Recibes', 'En el Valle de Aburrá te lo llevamos; al resto del país va por transportadora con número de guía.'],
];

export default function ComoCompras() {
  return (
    <section className="how" id="como-compras" aria-labelledby="howTitle">
      <h2 className="sec-title" id="howTitle" data-reveal="title">Cómo compras</h2>
      <ol className="how__list">
        {PASOS.map(([t, p], i) => (
          <li key={t}><span className="how__n">{i + 1}</span><div><h3>{t}</h3><p>{p}</p></div></li>
        ))}
      </ol>
      <p className="how__legal">
        Todo lo que vendemos es nuevo y con garantía. Lee cómo funcionan los <Link href="/envios">envíos</Link>, la <Link href="/garantia">garantía</Link> y el <Link href="/cambios-y-retracto">derecho de retracto</Link>.
      </p>
    </section>
  );
}
