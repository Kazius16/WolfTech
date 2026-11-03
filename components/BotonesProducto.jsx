'use client';
/* Botones de la página de producto: cotizar por WhatsApp y agregar al carrito */
import { waLink } from '@/lib/whatsapp';
import { useTienda } from './Tienda';
import { IconoChat } from './Iconos';

export default function BotonesProducto({ id }) {
  const { porId, carrito, agregar } = useTienda();
  const p = porId.get(id);
  if (!p) return null;
  return (
    <div className="pd__cta">
      <a className="btn btn--solid" href={waLink([{ p, c: 1 }], true)} target="_blank" rel="noopener"><IconoChat />Cotizar por WhatsApp</a>
      <button className="btn btn--ghost" onClick={() => agregar(p.id)}>{carrito[p.id] ? 'Agregar otro al carrito' : 'Agregar al carrito'}</button>
    </div>
  );
}
