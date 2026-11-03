/* Plantilla de las páginas legales (envíos, garantía, retracto, datos) */
import Link from 'next/link';
import { TIENDA, WHATSAPP, telefonoBonito } from '@/lib/config';

export const PAGINAS_LEGALES = [
  ['/envios', 'Envíos'],
  ['/garantia', 'Garantía'],
  ['/cambios-y-retracto', 'Cambios y retracto'],
  ['/privacidad', 'Tratamiento de datos'],
];

export default function Legal({ ruta, titulo, lead, children }) {
  return (
    <main className="legal">
      <nav className="crumbs" aria-label="Ruta"><Link href="/">Inicio</Link> / {titulo}</nav>
      <h1>{titulo}</h1>
      <p className="legal__lead">{lead}</p>
      <p className="legal__upd">Vigente desde el {TIENDA.vigenciaPoliticas}</p>
      {children}
      <h2>¿Dudas?</h2>
      <p>
        Escríbenos por <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener">WhatsApp al {telefonoBonito()}</a> o
        al correo <a href={`mailto:${TIENDA.correo}`}>{TIENDA.correo}</a>. Normalmente respondemos el mismo día.
      </p>
      <div className="legal__more">
        {PAGINAS_LEGALES.filter(([r]) => r !== ruta).map(([r, t]) => <Link key={r} className="btn btn--line btn--sm" href={r}>{t}</Link>)}
      </div>
    </main>
  );
}

/* quién es el responsable (se llena en lib/config.js) */
export function Responsable() {
  return (
    <dl className="ficha">
      <dt>Responsable</dt><dd>{TIENDA.titular ? `${TIENDA.titular}, nombre comercial ${TIENDA.marca}` : TIENDA.marca}</dd>
      {TIENDA.documento ? <><dt>Identificación</dt><dd>{TIENDA.documento}</dd></> : null}
      <dt>Dirección</dt><dd>{TIENDA.direccion}, {TIENDA.ciudad}, Colombia</dd>
      <dt>Correo</dt><dd><a href={`mailto:${TIENDA.correo}`}>{TIENDA.correo}</a></dd>
      <dt>WhatsApp</dt><dd>{telefonoBonito()}</dd>
    </dl>
  );
}
