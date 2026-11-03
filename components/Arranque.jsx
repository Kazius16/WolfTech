'use client';
/* ============================================================
   Cosas que pasan al cargar cualquier página:
   · body.is-ready → arranca la animación de entrada
   · revela títulos y tarjetas cuando entran a la pantalla
   · redirige los enlaces viejos (#producto-… y #admin)
   ============================================================ */
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function Arranque() {
  const ruta = usePathname();
  const router = useRouter();

  useEffect(() => {
    const h = location.hash;
    if (h.startsWith('#producto-')) router.replace('/producto/' + h.slice(10));
    else if (h === '#admin') router.replace('/admin');
  }, [router]);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-ready')));
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    const observar = () => document.querySelectorAll('[data-reveal]:not(.is-in), .tile:not(.is-in)').forEach((el) => io.observe(el));
    observar();
    // el catálogo cambia al filtrar: se observan las tarjetas nuevas
    const mo = new MutationObserver(observar);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [ruta]);

  return null;
}
