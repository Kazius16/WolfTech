'use client';
/* ============================================================
   ARMADOR DE PC — solo muestra lo compatible
   (socket, tipo de memoria y potencia de la fuente)
   ============================================================ */
import { useEffect, useRef, useState } from 'react';
import { lineaSpecs, nombreCorto } from '@/lib/catalogo';
import { pesos, store } from '@/lib/util';
import { waLink } from '@/lib/whatsapp';
import { useTienda } from './Tienda';
import { IconoChat } from './Iconos';

export const PASOS = [
  { k: 'cpu', t: 'Procesador', cat: 'Procesadores' },
  { k: 'board', t: 'Board', cat: 'Boards' },
  { k: 'ram', t: 'Memoria RAM', cat: 'Memoria RAM' },
  { k: 'gpu', t: 'Tarjeta de video', cat: 'Tarjetas de video', opcional: true },
  { k: 'ssd', t: 'Almacenamiento', cat: 'Almacenamiento' },
  { k: 'psu', t: 'Fuente de poder', cat: 'Fuentes' },
  { k: 'cool', t: 'Refrigeración', cat: 'Refrigeración', opcional: true },
  { k: 'case', t: 'Chasis', cat: 'Chasis' },
];
const OBLIGATORIOS = ['cpu', 'board', 'ram', 'ssd', 'psu', 'case'];
const precioTxt = (p) => (p.precio ? pesos(p.precio) : 'Consultar');

/* ---------- reglas (funciones puras sobre la selección) ---------- */
function reglas(PC, porId) {
  const sel = (k) => (PC[k] ? porId.get(PC[k]) || null : null);
  const consumo = () => {
    const cpu = sel('cpu'), gpu = sel('gpu');
    const w = (cpu ? cpu.s.w : 0) + (gpu ? gpu.s.w : 0) + 90;
    return { w, recomendada: Math.max(gpu ? gpu.s.fuente : 450, Math.ceil((w * 1.35) / 50) * 50) };
  };
  const socketObjetivo = () => sel('cpu')?.s.socket || sel('board')?.s.socket || null;
  const ddrObjetivo = () => sel('board')?.s.ddr || sel('cpu')?.s.ddr || null;
  const compatible = (paso, p) => {
    if (paso.k === 'cpu') return true; // cambiar de procesador quita lo incompatible y avisa
    if (paso.k === 'board') { const c = sel('cpu'); if (c && p.s.socket !== c.s.socket) return false; const r = sel('ram'); return !r || r.s.ddr === p.s.ddr; }
    if (paso.k === 'ram') { const d = ddrObjetivo(); return !d || p.s.ddr === d; }
    if (paso.k === 'psu') return !p.s.w || p.s.w >= consumo().recomendada;
    if (paso.k === 'cool') return !/VENTILADOR/i.test(p.nombre);
    return true;
  };
  const verificar = () => {
    const out = [], cpu = sel('cpu'), b = sel('board'), r = sel('ram'), g = sel('gpu'), f = sel('psu'), co = sel('cool');
    if (cpu && b) out.push(cpu.s.socket === b.s.socket ? ['ok', `Socket ${cpu.s.socket} en procesador y board`] : ['bad', `El procesador es ${cpu.s.socket} y la board ${b.s.socket}`]);
    if (b && r) out.push(b.s.ddr === r.s.ddr ? ['ok', `Memoria ${r.s.ddr}, igual que la board`] : ['bad', `La board usa ${b.s.ddr} y la memoria es ${r.s.ddr}`]);
    const { w, recomendada } = consumo();
    if (cpu || g) out.push(['info', `Consumo estimado ≈ ${w} W · fuente recomendada ≥ ${recomendada} W`]);
    if (f && f.s.w) out.push(f.s.w >= recomendada ? ['ok', `Fuente de ${f.s.w} W, suficiente`] : ['bad', `La fuente de ${f.s.w} W se queda corta (≥ ${recomendada} W)`]);
    if (cpu && !cpu.s.disipador && !co) out.push(['bad', `${nombreCorto(cpu)} no trae disipador: agrega refrigeración`]);
    if (cpu && cpu.s.disipador && !co) out.push(['ok', `${nombreCorto(cpu)} trae disipador de fábrica`]);
    if (!g && cpu) out.push(['info', 'Sin tarjeta de video: usarás los gráficos del procesador, si los tiene']);
    return out;
  };
  return { sel, consumo, socketObjetivo, ddrObjetivo, compatible, verificar };
}

export default function Armador() {
  const { productos, porId, agregar, toast, abrirCarrito } = useTienda();
  const [PC, setPC] = useState({});
  const [abierto, setAbierto] = useState('cpu');
  const [visible, setVisible] = useState(false);
  const [movil, setMovil] = useState(false);
  const seccion = useRef(null);

  useEffect(() => {
    const g = store.get('pc', {});
    for (const k in g) if (!porId.has(g[k])) delete g[k];
    setPC(g);
  }, [porId]);
  useEffect(() => {
    const io = new IntersectionObserver(([en]) => setVisible(en.isIntersecting), { threshold: 0.05 });
    io.observe(seccion.current);
    const m = () => setMovil(innerWidth <= 900); m(); addEventListener('resize', m);
    return () => { io.disconnect(); removeEventListener('resize', m); };
  }, []);

  const R = reglas(PC, porId);
  const opciones = (paso) => {
    const todas = productos.filter((p) => p.categoria === paso.cat);
    const ok = todas.filter((p) => R.compatible(paso, p)).sort((a, b) => (a.precio ?? Infinity) - (b.precio ?? Infinity));
    return { ok, ocultas: todas.length - ok.length };
  };

  const guardar = (nuevo) => { setPC(nuevo); store.set('pc', nuevo); };
  const elegir = (k, id) => {
    const nuevo = { ...PC, [k]: id };
    const R2 = reglas(nuevo, porId), quitados = [];
    PASOS.forEach((paso) => {
      if (paso.k !== k && nuevo[paso.k]) {
        const p = R2.sel(paso.k);
        if (p && !R2.compatible(paso, p)) { quitados.push(paso.t.toLowerCase()); delete nuevo[paso.k]; }
      }
    });
    if (quitados.length) toast(`Quitamos ${quitados.join(' y ')} porque ya no era compatible`);
    const i = PASOS.findIndex((p) => p.k === k), sig = PASOS.slice(i + 1).find((p) => !nuevo[p.k]);
    setAbierto(sig ? sig.k : null);
    guardar(nuevo);
    requestAnimationFrame(() => {
      const head = document.querySelector(`[data-step="${sig ? sig.k : k}"]`);
      if (head && head.getBoundingClientRect().top < 60) head.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  };
  const limpiar = (k) => {
    const nuevo = { ...PC }; delete nuevo[k];
    const i = PASOS.findIndex((p) => p.k === k);
    setAbierto(PASOS[i + 1]?.k || null);
    guardar(nuevo);
  };

  const items = PASOS.map((paso) => [paso, R.sel(paso.k)]).filter(([, p]) => p);
  const total = items.reduce((a, [, p]) => a + (p.precio || 0), 0);
  const pend = items.filter(([, p]) => !p.precio).length;
  const checks = R.verificar();
  const listo = OBLIGATORIOS.every((k) => PC[k]) && !checks.some((c) => c[0] === 'bad');

  return (
    <section className="build" id="armador" aria-labelledby="buildTitle" ref={seccion}>
      <div className="build__top">
        <h2 className="sec-title" id="buildTitle" data-reveal="title">Arma tu PC</h2>
        <p className="build__lead">Elige pieza por pieza. Solo te mostramos lo que es compatible: socket, tipo de memoria y potencia de la fuente.</p>
      </div>
      <div className="build__grid">
        <div>
          {PASOS.map((paso, i) => {
            const p = R.sel(paso.k), { ok, ocultas } = opciones(paso);
            const motivo = paso.k === 'ram' && R.ddrObjetivo() ? `Solo ${R.ddrObjetivo()}`
              : paso.k === 'board' && R.socketObjetivo() ? `Solo ${R.socketObjetivo()}`
              : paso.k === 'psu' ? `Solo ≥ ${R.consumo().recomendada} W` : '';
            const open = abierto === paso.k;
            return (
              <div key={paso.k} className={`step ${p ? 'is-set' : ''} ${open ? 'is-open' : ''}`}>
                <button className="step__head" data-step={paso.k} aria-expanded={open} onClick={() => setAbierto(open ? null : paso.k)}>
                  <span className="step__n">{i + 1}</span>
                  <span className="step__t">
                    {paso.t}{paso.opcional ? <span className="step__opt"> (opcional)</span> : null}
                    <small>{p ? <><b>{p.marca} {p.nombre}</b> · {precioTxt(p)}</> : `${motivo ? motivo + ' · ' : ''}${ok.length} opciones`}</small>
                  </span>
                  <span className="step__go">{p ? 'Cambiar' : 'Elegir'}</span>
                </button>
                {open ? (
                  <div className="step__body">
                    <ul className="opts">
                      {ok.map((o) => (
                        <li key={o.id}>
                          <button className="opt" aria-pressed={PC[paso.k] === o.id} onClick={() => elegir(paso.k, o.id)}>
                            <span>{o.marca} {o.nombre}<span className="mono">{lineaSpecs(o)}</span></span>
                            <span className="opt__p num">{precioTxt(o)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    {ocultas ? <p className="step__note">{ocultas} opciones ocultas porque no son compatibles con lo que elegiste.</p> : null}
                    {p || paso.opcional ? <button className="step__skip" onClick={() => limpiar(paso.k)}>{p ? 'Quitar esta pieza' : 'Omitir este paso'}</button> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <aside className="sum" id="sum" aria-label="Resumen de tu PC">
          <h3>Tu PC</h3>
          {items.length ? (
            <ul className="sum__list">
              {items.map(([paso, p]) => <li key={paso.k}><span>{paso.t}</span><span>{nombreCorto(p)}</span><span className="num">{precioTxt(p)}</span></li>)}
            </ul>
          ) : <p className="step__note" style={{ marginBottom: 18 }}>Empieza por el procesador: de él dependen la board y la memoria.</p>}
          {checks.length ? <ul className="checks">{checks.map(([k, t]) => <li key={t} className={k}>{t}</li>)}</ul> : null}
          <div className="sum__total"><span>Total{pend ? ` (+${pend} por confirmar)` : ''}</span><b className="num">{pesos(total)}</b></div>
          <a className="btn btn--solid" href={items.length ? waLink(items.map(([, p]) => ({ p, c: 1 }))) : '#'} target="_blank" rel="noopener"
            data-off={!items.length || undefined} aria-disabled={!items.length}><IconoChat />Cotizar este PC por WhatsApp</a>
          <button className="btn btn--ghost" disabled={!items.length}
            onClick={() => { PASOS.forEach((p) => PC[p.k] && agregar(PC[p.k], 1, true)); toast('Tu PC quedó en el carrito'); abrirCarrito(true); }}>
            Agregar todo al carrito
          </button>
          {items.length && !listo ? <p className="step__note">Faltan piezas obligatorias o hay algo por corregir. Igual puedes enviarlo y te asesoramos.</p> : null}
        </aside>
      </div>
      <div className={'sum__bar' + (items.length && movil && visible ? ' is-on' : '')}>
        <span>Tu PC <b className="num">{pesos(total)}</b></span>
        <a className="btn btn--sm" href="#sum">Ver resumen</a>
      </div>
    </section>
  );
}
