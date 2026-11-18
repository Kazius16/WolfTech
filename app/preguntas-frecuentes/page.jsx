/* Preguntas frecuentes (con datos estructurados FAQPage para Google) */
import Link from 'next/link';
import Legal from '@/components/Legal';
import JsonLd from '@/components/JsonLd';
import { SITIO } from '@/lib/config';

export const metadata = {
  title: 'Preguntas frecuentes',
  description: 'Cómo comprar en WolfTech, formas de pago, envíos, garantía, factura y armado de PC. Respuestas claras antes de que compres.',
  alternates: { canonical: '/preguntas-frecuentes' },
};

// [pregunta, respuesta en texto (para Google), respuesta con enlaces (para la página)]
const PREGUNTAS = [
  ['¿Cómo compro en WolfTech?',
    'Elige el producto o arma tu PC y escríbenos por WhatsApp desde la página. Confirmamos disponibilidad y precio final el mismo día, te enviamos los datos de pago y, con el pago confirmado, recogemos el producto, lo revisamos y te lo entregamos o lo despachamos.',
    <>Elige el producto o <Link href="/#armador">arma tu PC</Link> y escríbenos por WhatsApp desde la página. Confirmamos disponibilidad y precio final el mismo día, te enviamos los datos de pago y, con el pago confirmado, recogemos el producto, lo revisamos y te lo entregamos o lo despachamos.</>],
  ['¿Los productos son nuevos y originales?',
    'Sí. Todo lo que vendemos es nuevo, sellado y original, comprado a distribuidores mayoristas autorizados en Medellín. Lo revisamos antes de entregarlo.'],
  ['¿Por qué algunos productos dicen «Consultar»?',
    'Porque están en tránsito donde el distribuidor. Escríbenos y te damos el precio y la fecha estimada antes de que pagues.'],
  ['¿Hacen envíos a toda Colombia?',
    'Sí. En Envigado, Medellín y el Valle de Aburrá coordinamos la entrega por WhatsApp, normalmente el mismo día o el día hábil siguiente al pago. Al resto del país enviamos por transportadora, asegurado y con número de guía. El costo del envío lo paga el cliente y te lo decimos antes de pagar.',
    <>Sí. En Envigado, Medellín y el Valle de Aburrá coordinamos la entrega por WhatsApp, normalmente el mismo día o el día hábil siguiente al pago. Al resto del país enviamos por transportadora, asegurado y con número de guía. El costo del envío lo paga el cliente y te lo decimos antes de pagar. <Link href="/envios">Más sobre envíos</Link>.</>],
  ['¿Cuánto dura la garantía?',
    'La que da el fabricante para cada producto; si no se indica, un año para productos nuevos, como dice el Estatuto del Consumidor. Si algo falla, nos escribes a nosotros y nosotros hacemos el trámite.',
    <>La que da el fabricante para cada producto; si no se indica, un año para productos nuevos, como dice el Estatuto del Consumidor. Si algo falla, nos escribes a nosotros y nosotros hacemos el trámite. <Link href="/garantia">Ver la garantía</Link>.</>],
  ['¿Puedo devolver un producto si me arrepiento?',
    'Sí. En compras a distancia tienes derecho de retracto durante 5 días hábiles desde que recibes el producto, siempre que esté sin usar y en su empaque original. El costo de devolverlo lo asume el cliente.',
    <>Sí. En compras a distancia tienes derecho de retracto durante 5 días hábiles desde que recibes el producto, siempre que esté sin usar y en su empaque original. El costo de devolverlo lo asume el cliente. <Link href="/cambios-y-retracto">Ver cambios y retracto</Link>.</>],
  ['¿Cómo sé si las piezas de mi PC son compatibles?',
    'Usa el armador de la página: revisa el socket del procesador y la board, el tipo de memoria RAM y si la fuente alcanza para la tarjeta de video. Si tienes dudas, te asesoramos por WhatsApp sin costo.',
    <>Usa el <Link href="/#armador">armador</Link>: revisa el socket del procesador y la board, el tipo de memoria RAM y si la fuente alcanza para la tarjeta de video. Si tienes dudas, te asesoramos por WhatsApp sin costo.</>],
  ['¿Los precios incluyen todo?',
    'El precio publicado es el precio del producto. El envío o domicilio se cobra aparte y te lo decimos antes de pagar. Como los distribuidores cambian precios seguido, siempre confirmamos el valor final por WhatsApp antes de cobrarte.'],
];

export default function Faq() {
  return (
    <Legal info ruta="/preguntas-frecuentes" titulo="Preguntas frecuentes" lead="Lo que más nos preguntan antes de comprar. Si tu duda no está aquí, escríbenos por WhatsApp.">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'FAQPage', url: SITIO + '/preguntas-frecuentes',
        mainEntity: PREGUNTAS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      }} />
      {PREGUNTAS.map(([q, a, html]) => (
        <section key={q}>
          <h2>{q}</h2>
          <p>{html || a}</p>
        </section>
      ))}
    </Legal>
  );
}
