'use client';
/* ============================================================
   ESTADO DE LA TIENDA EN EL NAVEGADOR
   · catálogo (llega del servidor)
   · carrito (se guarda en este navegador)
   · avisos (toast)
   ============================================================ */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { pesos, store } from '@/lib/util';
import { nombreCorto } from '@/lib/catalogo';
import { mensaje, waLink } from '@/lib/whatsapp';
import { IconoX } from './Iconos';

const Ctx = createContext(null);
export const useTienda = () => useContext(Ctx);

export default function Tienda({ productos, fecha, children }) {
  const porId = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);
  const [carrito, setCarrito] = useState({});
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState({ txt: '', on: false });
  const t = useRef(0);

  // el carrito se lee del navegador después de cargar (evita diferencias con el servidor)
  useEffect(() => {
    const c = store.get('carrito', {});
    for (const id in c) if (!porId.has(id)) delete c[id];
    setCarrito(c);
  }, [porId]);
  const guardar = (c) => { setCarrito(c); store.set('carrito', c); };

  const toast = useCallback((txt) => {
    setAviso({ txt, on: true });
    clearTimeout(t.current);
    t.current = setTimeout(() => setAviso((a) => ({ ...a, on: false })), 2800);
  }, []);

  const agregar = useCallback((id, n = 1, silencio = false) => {
    const p = porId.get(id); if (!p) return;
    setCarrito((c) => { const nuevo = { ...c, [id]: (c[id] || 0) + n }; store.set('carrito', nuevo); return nuevo; });
    if (!silencio) toast(`Agregado: ${p.marca} ${nombreCorto(p)}`);
  }, [porId, toast]);

  const lineas = Object.entries(carrito).map(([id, c]) => ({ p: porId.get(id), c })).filter((l) => l.p);
  const cantidad = lineas.reduce((a, l) => a + l.c, 0);

  useEffect(() => {
    document.body.classList.toggle('is-cart', abierto);
    const esc = (e) => { if (e.key === 'Escape') setAbierto(false); };
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  }, [abierto]);

  const valor = { productos, porId, fecha, carrito, agregar, lineas, cantidad, toast, abrirCarrito: setAbierto };

  return (
    <Ctx.Provider value={valor}>
      {children}
      <Carrito lineas={lineas} abierto={abierto} cerrar={() => setAbierto(false)}
        cambiar={(id, d) => { const c = { ...carrito }; c[id] = Math.max(0, (c[id] || 0) + d); if (!c[id]) delete c[id]; guardar(c); }}
        quitar={(id) => { const c = { ...carrito }; delete c[id]; guardar(c); }}
        toast={toast} />
      <div className={'toast' + (aviso.on ? ' is-on' : '')} role="status" aria-live="polite">{aviso.txt}</div>
    </Ctx.Provider>
  );
}

function Carrito({ lineas, abierto, cerrar, cambiar, quitar, toast }) {
  const total = lineas.reduce((a, l) => a + (l.p.precio || 0) * l.c, 0);
  const pend = lineas.filter((l) => !l.p.precio).length;
  const copiar = async () => {
    if (!lineas.length) return;
    try { await navigator.clipboard.writeText(mensaje(lineas)); toast('Mensaje copiado'); }
    catch { toast('No se pudo copiar. Usa el botón de WhatsApp.'); }
  };
  return (
    <>
      <div className="scrim" onClick={cerrar} />
      <aside className="drawer" aria-label="Carrito" aria-hidden={!abierto} inert={abierto ? undefined : true}>
        <div className="drawer__head">
          <h2>Tu pedido</h2>
          <button className="x" onClick={cerrar} aria-label="Cerrar carrito"><IconoX /></button>
        </div>
        <div className="drawer__body">
          {lineas.length ? lineas.map(({ p, c }) => (
            <div className="line" key={p.id}>
              <p className="line__n"><small>{p.marca} · {p.categoria}</small>{p.nombre}</p>
              <p className="line__p num">{p.precio ? pesos(p.precio * c) : 'Consultar'}</p>
              <div className="qty">
                <button onClick={() => cambiar(p.id, -1)} aria-label="Quitar uno">−</button>
                <span className="num">{c}</span>
                <button onClick={() => cambiar(p.id, 1)} aria-label="Agregar uno">+</button>
              </div>
              <button className="line__rm" onClick={() => quitar(p.id)}>Quitar</button>
            </div>
          )) : <p className="cart-empty">Tu pedido está vacío. Si es un solo producto, puedes escribirnos directo desde su botón de WhatsApp.</p>}
        </div>
        <div className="drawer__foot">
          <div className="drawer__total"><span>Total estimado</span><b className="num">{pesos(total)}</b></div>
          <p className="drawer__note">{pend ? `${pend} producto(s) con precio por confirmar. ` : ''}Precios sujetos a confirmación de disponibilidad.</p>
          <a className="btn btn--solid" href={lineas.length ? waLink(lineas) : '#'} target="_blank" rel="noopener"
            aria-disabled={!lineas.length} data-off={!lineas.length || undefined}>Enviar pedido por WhatsApp</a>
          <button className="drawer__copy" onClick={copiar}>Copiar mensaje</button>
          <p className="drawer__legal">Al enviar tu pedido aceptas nuestra <Link href="/privacidad" onClick={cerrar}>política de datos</Link>. Ver <Link href="/envios" onClick={cerrar}>envíos</Link> y <Link href="/garantia" onClick={cerrar}>garantía</Link>.</p>
        </div>
      </aside>
    </>
  );
}
