/* Mensajes de WhatsApp para cotizar */
import { WHATSAPP } from './config';
import { pesos } from './util';

export function mensaje(lineas, consulta = false) {
  const out = [consulta ? 'Hola WolfTech, quiero preguntar por:' : 'Hola WolfTech, quiero cotizar este pedido:', ''];
  let total = 0, pendientes = 0;
  lineas.forEach(({ p, c }) => {
    if (p.precio) total += p.precio * c; else pendientes++;
    out.push(`• ${c} × ${p.marca} ${p.nombre} — ${p.precio ? pesos(p.precio * c) : 'precio por confirmar'}`);
  });
  if (!consulta) out.push('', `Total estimado: ${pesos(total)}${pendientes ? ` (+ ${pendientes} por confirmar)` : ''}`);
  out.push('', '¿Me confirman disponibilidad?');
  return out.join('\n');
}

export const waLink = (lineas, consulta = false) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje(lineas, consulta))}`;
export const waDirecto = (texto) => `https://wa.me/${WHATSAPP}${texto ? '?text=' + encodeURIComponent(texto) : ''}`;
