'use client';
/* ============================================================
   CATÁLOGO — destacados grandes y el resto en segundo plano.
   Con "categoria" muestra solo esa categoría (páginas /categoria/…).
   ============================================================ */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ORDEN_CATEGORIAS, destacadosOrdenados, lineaSpecs, slugCategoria } from '@/lib/catalogo';
import { sinTildes } from '@/lib/util';
import { waDirecto } from '@/lib/whatsapp';
import { useTienda } from './Tienda';
import Tile from './Tile';

const PASO = 24;

export default function Catalogo({ categoria = null }) {
  const { productos } = useTienda();
  const [cat, setCat] = useState(categoria || 'Todo');
  const [q, setQ] = useState('');
  const [orden, setOrden] = useState('cat');
  // en una categoría se muestra todo (así Google ve todos los productos)
  const [limite, setLimite] = useState(categoria ? 999 : PASO);

  const base = useMemo(() => (categoria ? productos.filter((p) => p.categoria === categoria) : productos), [productos, categoria]);

  const lista = useMemo(() => {
    const palabras = sinTildes(q.toLowerCase()).split(/\s+/).filter(Boolean);
    const r = base.filter((p) => (cat === 'Todo' || p.categoria === cat)
      && palabras.every((w) => sinTildes(`${p.marca} ${p.nombre} ${p.categoria} ${lineaSpecs(p)}`.toLowerCase()).includes(w)));
    const val = (p) => p.precio ?? Infinity;
    if (orden === 'asc') r.sort((a, b) => val(a) - val(b));
    else if (orden === 'desc') r.sort((a, b) => (b.precio ?? -1) - (a.precio ?? -1));
    else r.sort((a, b) => ORDEN_CATEGORIAS.indexOf(a.categoria) - ORDEN_CATEGORIAS.indexOf(b.categoria) || val(a) - val(b));
    return r;
  }, [base, cat, q, orden]);

  // destacados grandes solo en la vista general
  let grandes = [], resto = lista;
  if (orden === 'cat' && !q && !categoria) {
    grandes = destacadosOrdenados(lista).slice(0, 3);
    const usados = new Set(grandes.map((p) => p.id));
    resto = lista.filter((p) => !usados.has(p.id));
  }
  const visibles = resto.slice(0, limite);

  const cuenta = (c) => productos.filter((p) => c === 'Todo' || p.categoria === c).length;
  const tabs = ['Todo', ...ORDEN_CATEGORIAS.filter((c) => cuenta(c))];

  const filas = [];
  let i = 0, ultima = '';
  grandes.forEach((p, k) => filas.push(<Tile key={p.id} p={p} size={k === 0 ? 'xl' : 'lg'} i={i++} />));
  visibles.forEach((p) => {
    if (orden === 'cat' && cat === 'Todo' && !categoria && p.categoria !== ultima) {
      ultima = p.categoria;
      filas.push(
        <div className="grp" key={'g-' + p.categoria}>
          <h3><Link href={`/categoria/${slugCategoria(p.categoria)}`}>{p.categoria}</Link></h3>
          <span className="mono">{cuenta(p.categoria)} referencias</span>
        </div>,
      );
    }
    filas.push(<Tile key={p.id} p={p} i={i++} />);
  });

  return (
    <>
      <div className="tools">
        <label className="sr" htmlFor="q">Buscar producto</label>
        <input className="search" id="q" type="search" placeholder="Buscar: 9800X3D, RTX 5070, DDR5…" autoComplete="off"
          value={q} onChange={(e) => { setQ(e.target.value); setLimite(PASO); }} />
        <label className="sr" htmlFor="sort">Ordenar</label>
        <select className="sort" id="sort" value={orden} onChange={(e) => setOrden(e.target.value)}>
          <option value="cat">{categoria ? 'Recomendado' : 'Por categoría'}</option>
          <option value="asc">Menor precio</option>
          <option value="desc">Mayor precio</option>
        </select>
      </div>
      {categoria ? null : (
        <div className="tabs" role="toolbar" aria-label="Categorías">
          {tabs.map((c) => (
            <button key={c} aria-pressed={c === cat} onClick={() => { setCat(c); setLimite(PASO); }}>
              {c}<sup>{cuenta(c)}</sup>
            </button>
          ))}
        </div>
      )}
      <div className="grid">
        {lista.length ? filas : (
          <p className="empty">
            No encontramos «{q}». <a href={waDirecto(`Hola WolfTech, ¿consiguen ${q}?`)} target="_blank" rel="noopener">Escríbenos por WhatsApp</a> y lo buscamos con el proveedor.
          </p>
        )}
      </div>
      {resto.length > limite ? (
        <div className="list__more"><button className="btn btn--line" onClick={() => setLimite(limite + PASO)}>Ver más ({resto.length - limite})</button></div>
      ) : null}
    </>
  );
}
