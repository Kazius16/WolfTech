'use client';
/* Tarjeta de producto en el catálogo */
import Link from 'next/link';
import { lineaSpecs, nombreCorto, restoNombre } from '@/lib/catalogo';
import { pesos } from '@/lib/util';
import { waLink } from '@/lib/whatsapp';
import { useTienda } from './Tienda';
import Marco from './Marco';
import { IconoChat, IconoMas, IconoOk } from './Iconos';

export default function Tile({ p, size = '', i = 0 }) {
  const { carrito, agregar } = useTienda();
  const enCarrito = !!carrito[p.id];
  const href = `/producto/${p.id}`;
  const wa = waLink([{ p, c: 1 }], true);
  return (
    <article className={`tile ${size ? 'tile--' + size : ''}`} style={{ '--d': Math.min(i, 8) * 70 + 'ms' }}>
      <Link className="tile__open curtain" href={href} aria-label={`Ver ${p.marca} ${p.nombre}`} prefetch={false}>
        <Marco p={p} badge={size ? 'Destacado' : ''} prioridad={size === 'xl'} />
      </Link>
      <div className="tile__body">
        <p className="tile__brand">{p.marca} · {p.categoria}</p>
        <h3 className="tile__name">{size ? nombreCorto(p) : <Link href={href} prefetch={false}>{p.nombre}</Link>}</h3>
        {size && restoNombre(p) !== p.marca ? <p className="tile__sub">{restoNombre(p)}</p> : null}
        <p className="tile__specs mono">{lineaSpecs(p)}</p>
        <div className="tile__foot">
          <span className={'tile__price num ' + (p.precio ? '' : 'ask')}>{p.precio ? pesos(p.precio) : 'Consultar'}</span>
          <Link className="btn btn--line btn--sm" href={href} prefetch={false}>Ver</Link>
          {size === 'xl' ? (
            <a className="btn btn--line btn--sm" href={wa} target="_blank" rel="noopener"><IconoChat /><span className="wa-txt">WhatsApp</span></a>
          ) : (
            <a className="ico" href={wa} target="_blank" rel="noopener" aria-label="Preguntar por WhatsApp" title="Preguntar por WhatsApp"><IconoChat /></a>
          )}
          <button className={'ico ' + (enCarrito ? 'is-in' : '')} onClick={() => agregar(p.id)} aria-label="Agregar al carrito">
            {enCarrito ? <IconoOk /> : <IconoMas />}
          </button>
        </div>
      </div>
    </article>
  );
}
