'use client';
/* ============================================================
   FRANJA DE NOVEDADES — se desliza con el dedo (no pasa sola).
   Se llena sola con lo último que se agregó al catálogo.
   ============================================================ */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { lineaSpecs, nombreCorto, novedades } from '@/lib/catalogo';
import { pesos } from '@/lib/util';
import { useTienda } from './Tienda';
import Marco from './Marco';
import { IconoFlecha } from './Iconos';

export default function Novedades() {
  const { productos } = useTienda();
  const { titulo, nuevos, items } = novedades(productos);
  const pista = useRef(null);
  const [borde, setBorde] = useState({ ini: true, fin: false });

  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    const f = () => setBorde({ ini: el.scrollLeft < 8, fin: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
    f(); el.addEventListener('scroll', f, { passive: true }); addEventListener('resize', f);
    return () => { el.removeEventListener('scroll', f); removeEventListener('resize', f); };
  }, [items.length]);

  if (items.length < 3) return null;
  const mover = (dir) => {
    const el = pista.current, tarjeta = el.querySelector('.nov__item');
    el.scrollBy({ left: dir * (tarjeta ? tarjeta.offsetWidth + 16 : 320) * 2, behavior: 'smooth' });
  };

  return (
    <section className="nov" aria-labelledby="novTitle">
      <div className="nov__top">
        <h2 className="sec-title" id="novTitle" data-reveal="title">{titulo}</h2>
        <p className="nov__lead">{nuevos ? 'Lo último que llegó al catálogo.' : 'Lo que más recomendamos esta semana.'}</p>
        <div className="nov__arrows">
          <button onClick={() => mover(-1)} disabled={borde.ini} aria-label="Anteriores"><IconoFlecha /></button>
          <button onClick={() => mover(1)} disabled={borde.fin} aria-label="Siguientes" className="der"><IconoFlecha /></button>
        </div>
      </div>
      <ul className="nov__track" ref={pista}>
        {items.map((p, i) => (
          <li className="nov__item" key={p.id}>
            <Link href={`/producto/${p.id}`} prefetch={false} className="nov__link">
              <Marco p={p} badge={nuevos && i < 3 && p.creado ? 'Nuevo' : ''} />
              <p className="nov__brand">{p.marca} · {p.categoria}</p>
              <h3 className="nov__name">{nombreCorto(p)}</h3>
              <p className="nov__specs mono">{lineaSpecs(p)}</p>
              <p className="nov__price num">{pesos(p.precio)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
