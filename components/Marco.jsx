'use client';
/* Marco del producto: foto real o espacio reservado. Se inclina con el mouse. */
import { useRef } from 'react';
import { CODIGO_CAT } from '@/lib/catalogo';

export default function Marco({ p, badge = '', prioridad = false }) {
  const ref = useRef(null);
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
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.foto} alt={`${p.marca} ${p.nombre}`} loading={prioridad ? 'eager' : 'lazy'} decoding="async" />
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
