'use client';
/* Marco del producto: foto real o espacio reservado. Se inclina con el mouse.
   La foto la optimiza Vercel (next/image): tamaño justo para cada pantalla,
   formato AVIF/WebP y caché en el CDN. Mientras carga se ve el nombre de la marca
   y la foto aparece con un fundido suave. */
import { useRef, useState } from 'react';
import Image from 'next/image';
import { CODIGO_CAT } from '@/lib/catalogo';

// cuánto ocupa la foto en pantalla, para que el navegador pida el tamaño justo
const TAMANOS = {
  xl: '(max-width: 760px) 100vw, 60vw',
  lg: '(max-width: 760px) 100vw, 30vw',
  ficha: '(max-width: 900px) 100vw, 50vw',
  normal: '(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 22vw',
};

export default function Marco({ p, badge = '', prioridad = false, tam = 'normal' }) {
  const ref = useRef(null);
  const [cargada, setCargada] = useState(false);
  const mover = (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = ref.current, r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.classList.add('is-tilting');
    el.style.setProperty('--ry', ((x - 0.5) * 8).toFixed(2) + 'deg');
    el.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
    el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
    el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
  };
  const salir = () => {
    const el = ref.current; el.classList.remove('is-tilting');
    el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
  };
  return (
    <div className="frame" ref={ref} onPointerMove={mover} onPointerLeave={salir}>
      {badge ? <span className="frame__badge">{badge}</span> : null}
      <div className="frame__in">
        {p.foto ? (
          <>
            {/* se ve mientras la foto carga */}
            <div className={'frame__ph' + (cargada ? ' is-hidden' : '')} aria-hidden="true"><b>{p.marca}</b></div>
            <Image
              src={p.foto}
              alt={`${p.marca} ${p.nombre}`}
              fill
              sizes={TAMANOS[tam] || TAMANOS.normal}
              quality={80}
              priority={prioridad}
              className={'frame__img' + (cargada ? ' is-loaded' : '')}
              onLoad={() => setCargada(true)}
            />
          </>
        ) : (
          <>
            <div className="frame__ph" aria-hidden="true"><b>{p.marca}</b></div>
            <i className="frame__c" /><i className="frame__c" /><i className="frame__c" />
            <span className="frame__tag mono">Foto pendiente · {CODIGO_CAT[p.categoria] || ''}</span>
          </>
        )}
      </div>
    </div>
  );
}
