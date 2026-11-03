import Legal, { Responsable } from '@/components/Legal';
import { TIENDA } from '@/lib/config';

export const metadata = {
  title: 'Política de tratamiento de datos personales',
  description: 'Cómo WolfTech recoge, usa y protege tus datos personales, según la Ley 1581 de 2012 y el Decreto 1377 de 2013.',
  alternates: { canonical: '/privacidad' },
};

export default function Privacidad() {
  return (
    <Legal ruta="/privacidad" titulo="Tratamiento de datos" lead="Solo pedimos los datos que necesitamos para venderte, entregarte y darte garantía. No los vendemos ni los compartimos para publicidad de otros.">
      <h2>1. Quién es el responsable</h2>
      <p>Esta política cumple la Ley 1581 de 2012 y el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015). El responsable del tratamiento de tus datos es:</p>
      <Responsable />

      <h2>2. Qué datos recogemos</h2>
      <ul>
        <li>Los que nos das para cotizar o comprar: nombre, número de celular o WhatsApp, correo, dirección y ciudad de entrega.</li>
        <li>Número de cédula o NIT, solo si hace falta para el comprobante de venta o la factura.</li>
        <li>Lo que compras, los mensajes que nos envías y la información de garantías.</li>
      </ul>
      <p>No pedimos datos sensibles ni guardamos datos de tarjetas. El carrito y el armador de PC de esta página se guardan solo en tu navegador, no en nuestros servidores.</p>

      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Responder tus cotizaciones y preguntas.</li>
        <li>Confirmar el pedido, el pago y coordinar la entrega o el envío.</li>
        <li>Hacer el comprobante de venta y cumplir obligaciones contables y tributarias.</li>
        <li>Atender garantías, retractos, quejas y reclamos.</li>
        <li>Enviarte novedades y promociones, solo si nos lo autorizas. Puedes pedir que no te las enviemos más en cualquier momento.</li>
      </ul>

      <h2>4. Tu autorización</h2>
      <p>Cuando nos escribes y nos das tus datos para cotizar o comprar, nos autorizas a tratarlos para las finalidades de esta política. Puedes revocar esa autorización o pedir que borremos tus datos cuando quieras, salvo que debamos conservarlos por una obligación legal o porque haya un pedido o una garantía en curso.</p>
      <p>No recogemos a propósito datos de menores de edad. Si un menor quiere comprar, debe hacerlo su padre, madre o representante.</p>

      <h2>5. Con quién los compartimos</h2>
      <ul>
        <li>Con la transportadora, solo lo necesario para la entrega (nombre, teléfono y dirección).</li>
        <li>Con el proveedor o el fabricante, cuando hay que tramitar una garantía.</li>
        <li>Con los servicios que usamos para operar: WhatsApp (Meta) para hablar contigo, y los servicios de alojamiento de esta página. Algunos de ellos guardan la información fuera de Colombia.</li>
        <li>Con autoridades, cuando la ley lo exija.</li>
      </ul>

      <h2>6. Tus derechos</h2>
      <p>Como titular de los datos tienes derecho a:</p>
      <ul>
        <li>Conocer, actualizar y corregir tus datos.</li>
        <li>Pedir prueba de la autorización que nos diste.</li>
        <li>Saber para qué hemos usado tus datos.</li>
        <li>Revocar la autorización o pedir que borremos tus datos.</li>
        <li>Consultar tus datos gratis.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC), después de haber hecho el reclamo ante nosotros.</li>
      </ul>

      <h2>7. Cómo ejercerlos</h2>
      <p>Escribe al correo <a href={`mailto:${TIENDA.correo}`}>{TIENDA.correo}</a> o por WhatsApp con tu nombre, tu número de contacto y qué necesitas.</p>
      <ul>
        <li><strong>Consultas</strong> (saber qué datos tenemos): respondemos en máximo 10 días hábiles. Si no alcanzamos, te avisamos el motivo y respondemos en máximo 5 días hábiles más.</li>
        <li><strong>Reclamos</strong> (corregir, actualizar, borrar o revocar): respondemos en máximo 15 días hábiles. Si no alcanzamos, te avisamos el motivo y respondemos en máximo 8 días hábiles más.</li>
      </ul>

      <h2>8. Seguridad y tiempo de conservación</h2>
      <p>Guardamos tus datos con medidas razonables para evitar su pérdida, uso no autorizado o acceso indebido. Los conservamos mientras exista la relación comercial y durante el tiempo que exijan las normas contables, tributarias y de garantía.</p>

      <h2>9. Cambios a esta política</h2>
      <p>Si cambiamos algo importante de esta política, lo publicaremos en esta página antes de aplicarlo, con la nueva fecha de vigencia.</p>
    </Legal>
  );
}
