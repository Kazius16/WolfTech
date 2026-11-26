'use client';
/* ============================================================
   PÍXEL DE META (Facebook e Instagram)
   · PageView al entrar y en cada cambio de página.
   · Contact cuando alguien abre WhatsApp desde cualquier botón
     (armador, carrito, producto, botón flotante, pie de página).
   · No mide nada en el admin.
   ============================================================ */
import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { META_PIXEL } from '@/lib/config';

const fbq = (...a) => { if (typeof window !== 'undefined' && window.fbq) window.fbq(...a); };
const esAdmin = (ruta) => ruta.startsWith('/admin');

// de dónde salió el clic a WhatsApp, para ver en Meta qué botón trae más contactos
function origen(a, ruta) {
  if (a.closest('#armador')) return 'armador';
  if (a.closest('.cart, [class*="carrito"], [class*="drawer"]')) return 'carrito';
  if (a.closest('footer')) return 'pie de página';
  if (ruta.startsWith('/producto')) return a.closest('[class*="flot"]') ? 'botón flotante' : 'producto';
  if (a.closest('[class*="flot"]')) return 'botón flotante';
  return 'otro';
}

export default function PixelMeta() {
  const ruta = usePathname();
  const primera = useRef(true);

  // cambios de página dentro de la tienda (la primera vista ya la cuenta el código base)
  useEffect(() => {
    if (primera.current) { primera.current = false; return; }
    if (!esAdmin(ruta)) fbq('track', 'PageView');
  }, [ruta]);

  // clics a WhatsApp
  useEffect(() => {
    const clic = (e) => {
      const a = e.target.closest && e.target.closest('a[href*="wa.me"], a[href*="whatsapp.com"]');
      if (!a || esAdmin(location.pathname)) return;
      fbq('track', 'Contact', { content_category: origen(a, location.pathname) });
    };
    document.addEventListener('click', clic, true);
    return () => document.removeEventListener('click', clic, true);
  }, []);

  if (!META_PIXEL || esAdmin(ruta)) return null;
  return (
    <>
      <Script id="pixel-meta" strategy="afterInteractive">{`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL}');fbq('track','PageView');`}</Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: 'none' }} alt="" src={`https://www.facebook.com/tr?id=${META_PIXEL}&ev=PageView&noscript=1`} />
      </noscript>
    </>
  );
}
