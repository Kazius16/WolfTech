'use client';
/* ============================================================
   BOTÓN FLOTANTE DE WHATSAPP
   · En un producto, el mensaje ya trae el nombre del producto.
   · Se esconde en el admin, con el carrito abierto y cuando
     aparece la barra del armador en celular.
   ============================================================ */
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { waDirecto } from '@/lib/whatsapp';
import { useTienda } from './Tienda';
import { IconoChat } from './Iconos';

export default function WhatsAppFlotante() {
  const ruta = usePathname();
  const { porId } = useTienda();
  const [visible, setVisible] = useState(false);
  const [corto, setCorto] = useState(false);

  useEffect(() => {
    // en el inicio aparece después del hero; en las demás páginas, de una
    const f = () => {
      setVisible(ruta !== '/' || scrollY > innerHeight * 0.55);
      setCorto(scrollY > 400);   // al bajar se vuelve solo el ícono
    };
    f(); addEventListener('scroll', f, { passive: true });
    return () => removeEventListener('scroll', f);
  }, [ruta]);

  if (ruta.startsWith('/admin')) return null;
  const id = ruta.startsWith('/producto/') ? ruta.split('/')[2] : null;
  const p = id ? porId.get(id) : null;
  const texto = p ? `Hola WolfTech, me interesa: ${p.marca} ${p.nombre}. ¿Está disponible?` : 'Hola WolfTech, vengo de la página y quiero cotizar.';

  return (
    <a className={'wa-flot' + (visible ? ' is-on' : '') + (corto ? ' is-corto' : '')} href={waDirecto(texto)} target="_blank" rel="noopener"
      aria-label="Escríbenos por WhatsApp">
      <IconoChat />
      <span>Escríbenos</span>
    </a>
  );
}
