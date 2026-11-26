'use client';
/* ============================================================
   PC EN 3D — acompaña al armador (components/Armador.jsx)
   · Solo CSS 3D (transform-style: preserve-3d + perspective), sin librerías.
   · Empieza vacía (contornos punteados) y se llena con lo que el cliente elige.
   · Los datos salen de la selección real: p.s (REGLAS en lib/catalogo.js) y el nombre
     del producto. Si un dato no está, se dibuja una versión genérica, sin inventar specs.
   · Tocar una pieza (o su contorno) abre su paso en el armador.
   Ejes del modelo: x = de atrás (−) hacia el frente (+) del chasis,
   y = hacia abajo, z = hacia el lado abierto (donde iría el panel lateral).
   Escala: 0,9 px por mm.
   ============================================================ */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { nombreCorto } from '@/lib/catalogo';
import { store } from '@/lib/util';

/* ---------- medidas ---------- */
const MM = 0.9;
const D = 420, H = 450, W = 210, PARED = 6;                     // chasis genérico tipo mid tower
const BOARDS = { 'ATX': [244, 305], 'Micro ATX': [244, 244], 'Mini ITX': [170, 170], 'E-ATX': [330, 305] }; // ancho × alto (mm, estándar)
const BX = -D / 2 + PARED + 16;   // borde trasero de la board
const BY = -H / 2 + PARED + 22;   // borde superior de la board
const BZ = -W / 2 + PARED + 13;   // cara de la board (sobre los separadores)
const PISO = H / 2 - PARED;       // cara de arriba del piso del chasis

const VISTAS = [
  { k: '34', t: '3/4', rx: -14, ry: -28 },
  { k: 'lado', t: 'Lado', rx: -4, ry: 0 },
  { k: 'frente', t: 'Frente', rx: -8, ry: -90 },
  { k: 'arriba', t: 'Arriba', rx: -62, ry: -18 },
];
const INICIAL = VISTAS[0];

/* Cuánto se separa cada pieza en la vista «Separada» (x, y, z) */
const SEPARAR = {
  case: [0, 0, -70], board: [0, 0, 30], cpu: [0, 0, 110], cool: [0, -20, 230], rad: [130, 0, 30],
  ram: [40, -10, 160], ssd: [0, 10, 100], gpu: [0, 100, 230], psu: [-40, 70, 250],
};

/* ============================================================
   LECTURA DE LA SELECCIÓN
   Mismos patrones que tablaSpecs/lineaSpecs en lib/catalogo.js. null = genérico.
   ============================================================ */
function leer(piezas) {
  const N = (p) => (p ? p.nombre.toUpperCase() : '');
  const { cpu, board, ram, gpu, ssd, psu, cool } = piezas, caja = piezas.case;

  const formato = board?.s?.formato || null;
  const [bwmm, bhmm] = BOARDS[formato] || BOARDS.ATX;
  const bw = bwmm * MM, bh = bhmm * MM, itx = formato === 'Mini ITX';

  // ventiladores de la tarjeta de video: «3 fan», «2X», «Trio», «Dual»
  const ng = N(gpu);
  const fg = ng.match(/(\d)\s?FAN/) || ng.match(/\b([123])X\b/);
  const ventGPU = fg ? +fg[1] : /TRIO/.test(ng) ? 3 : /DUAL/.test(ng) ? 2 : null;

  // módulos de RAM: «2*8», «2X16» → 2; si no lo dice, 1
  const nr = N(ram);
  const mr = nr.match(/\b([248])\s?[*X]\s?\d{1,2}(?!\d)/);

  // almacenamiento: SATA de 2,5" o M.2 (si no dice, M.2 genérico)
  const ns = N(ssd);
  const capacidad = (ns.match(/\d+\s?TB|\d+\s?GB/) || [])[0] || null;

  // refrigeración: líquida (mismo patrón que tablaSpecs) o aire
  const nc = N(cool);
  const liquida = cool ? /LÍQUIDA|LIQUIDA|LC |360/.test(nc) : false;
  const radiador = +((nc.match(/(240|280|360)/) || [])[1] || 0) || null;

  const np = N(psu);
  const cert = (np.match(/BRONCE|GOLD|PLATINUM/) || [])[0];

  const nk = N(caja);
  return {
    formato, bw, bh, itx,
    chipset: board?.s?.chipset || null,
    ventGPU,
    modelo: gpu ? nombreCorto(gpu) : null, vram: gpu?.s?.vram || null,
    modulos: ram ? (mr ? +mr[1] : 1) : 0, ddr: ram?.s?.ddr || null, ramRGB: /RGB/.test(nr),
    sata: /SATA/.test(ns), capacidad,
    liquida, radiador, coolBlanco: /WHITE|ICE/.test(nc), coolRGB: /RGB/.test(nc),
    stock: !!(cpu && cpu.s?.disipador && !cool),
    vatios: psu?.s?.w || null, cert: cert ? { BRONCE: '80 Plus Bronze', GOLD: '80 Plus Gold', PLATINUM: '80 Plus Platinum' }[cert] : null,
    cajaBlanca: /WHITE/.test(nk), cajaRGB: /RGB/.test(nk),
  };
}

/* ============================================================
   PRIMITIVAS 3D
   ============================================================ */

/* Caja: 6 caras alrededor de su centro. `caras` = contenido opcional por cara:
   f (frente, z+), b (atrás), r (derecha, x+), l (izquierda), t (arriba, y−), u (abajo) */
function Caja({ x = 0, y = 0, z = 0, w, h, d, c = '', caras = {}, sin = '' }) {
  const cara = (k, cw, chh, tr) => (sin.includes(k) ? null : (
    <div className={`c3__f c3__${k}`} style={{ width: cw, height: chh, marginLeft: -cw / 2, marginTop: -chh / 2, transform: tr }}>{caras[k]}</div>
  ));
  return (
    <div className={`c3 ${c}`} style={{ transform: `translate3d(${x}px,${y}px,${z}px)` }}>
      {cara('f', w, h, `translateZ(${d / 2}px)`)}
      {cara('b', w, h, `rotateY(180deg) translateZ(${d / 2}px)`)}
      {cara('r', d, h, `rotateY(90deg) translateZ(${w / 2}px)`)}
      {cara('l', d, h, `rotateY(-90deg) translateZ(${w / 2}px)`)}
      {cara('t', w, d, `rotateX(90deg) translateZ(${h / 2}px)`)}
      {cara('u', w, d, `rotateX(-90deg) translateZ(${h / 2}px)`)}
    </div>
  );
}

/* Plano: una sola cara (se ve por los dos lados). rot = giro extra, ej. 'rotateY(90deg)' */
function Plano({ x = 0, y = 0, z = 0, w, h, rot = '', c = '', children }) {
  return (
    <div className={`pl3 ${c}`} style={{ width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2, transform: `translate3d(${x}px,${y}px,${z}px) ${rot}` }}>
      {children}
    </div>
  );
}

/* Tubo entre dos puntos (dos planos cruzados): para las mangueras de la líquida */
function Tubo({ a, b, r = 7 }) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const L = Math.hypot(dx, dy, dz);
  const giroY = Math.atan2(-dz, dx), giroZ = Math.atan2(dy, Math.hypot(dx, dz));
  const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  return (
    <div className="c3" style={{ transform: `translate3d(${m[0]}px,${m[1]}px,${m[2]}px) rotateY(${giroY}rad) rotateZ(${giroZ}rad)` }}>
      <div className="pl3 p3-tubo" style={{ width: L, height: r, marginLeft: -L / 2, marginTop: -r / 2 }} />
      <div className="pl3 p3-tubo" style={{ width: L, height: r, marginLeft: -L / 2, marginTop: -r / 2, transform: 'rotateX(90deg)' }} />
    </div>
  );
}

const Vent = ({ n = 1, rgb, size }) => (
  <div className="p3-vents">{Array.from({ length: n }, (_, i) => <i key={i} className={`p3-fan${rgb ? ' is-rgb' : ''}`} style={size ? { width: size, height: size } : null} />)}</div>
);
const Etiqueta = ({ children }) => <span className="p3-et">{children}</span>;

/* Pieza: grupo que se separa, se resalta y anima su entrada cuando cambia el producto.
   Va fuera del componente principal para que React no la vuelva a montar en cada render. */
const Ctx = createContext(null);
function Pieza({ k, sep = k, p, children, fantasma }) {
  const { foco, setFoco, abierto, separada, tocar } = useContext(Ctx);
  const mov = separada && SEPARAR[sep];
  return (
    <div className={`p3-g${foco === k ? ' is-foco' : ''}${abierto === k ? ' is-abierto' : ''}${fantasma ? ' is-fantasma' : ''}`}
      style={mov ? { transform: `translate3d(${mov[0]}px,${mov[1]}px,${mov[2]}px)` } : undefined}
      onClick={(e) => { e.stopPropagation(); tocar(k); }}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setFoco(k)}
      onPointerLeave={() => setFoco((f) => (f === k ? null : f))}>
      <div key={p ? p.id : 'vacio'} className={`p3-in${p ? ' is-entra' : ''}`}>{children}</div>
    </div>
  );
}

/* ============================================================
   COMPONENTE
   ============================================================ */
export default function PC3D({ pasos, piezas, abierto, alAbrir }) {
  const escena = useRef(null), mundo = useRef(null);
  const rot = useRef({ rx: INICIAL.rx, ry: INICIAL.ry });
  const escala = useRef(0.5);
  const anim = useRef(0), arrastre = useRef(null), movido = useRef(false);
  const cuadros = useRef({ ultimo: 0, lista: [] });
  const quieto = useRef(false);        // prefers-reduced-motion
  const [vista, setVista] = useState(INICIAL.k);
  const [separada, setSeparada] = useState(false);
  const [foco, setFoco] = useState(null);
  const [fija, setFija] = useState(false);     // vista fija si el equipo no aguanta el 3D
  const [plegado, setPlegado] = useState(false);
  const fijaRef = useRef(false);

  /* aplica giro y escala directo al DOM (sin re-render de React en cada cuadro) */
  const aplicar = () => {
    const el = mundo.current; if (!el) return;
    const s = escala.current * (separada ? 0.8 : 1), { rx, ry } = rot.current;
    el.style.transform = `scale3d(${s},${s},${s}) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };
  const aplicarRef = useRef(aplicar); aplicarRef.current = aplicar;

  /* mide la duración de los cuadros mientras el modelo se mueve; si va muy lento, vista fija */
  const medir = (t) => {
    const c = cuadros.current;
    if (document.hidden) { c.ultimo = 0; return; }   // pestaña oculta: el navegador frena los cuadros, no cuenta
    if (c.ultimo && t - c.ultimo < 400) c.lista.push(t - c.ultimo);
    c.ultimo = t;
    if (c.lista.length >= 24) {
      const orden = [...c.lista].sort((a, b) => a - b), mediana = orden[orden.length >> 1];
      c.lista = [];
      if (mediana > 45 && !fijaRef.current) { fijaRef.current = true; setFija(true); }
    }
  };

  /* gira suave hasta una vista (instantáneo con movimiento reducido o vista fija) */
  const irA = (rx, ry) => {
    cancelAnimationFrame(anim.current);
    const a = { ...rot.current }, t0 = performance.now();
    const dur = quieto.current || fijaRef.current ? 0 : 650;
    const dy = ((((ry - a.ry) % 360) + 540) % 360) - 180;   // por el camino más corto
    cuadros.current.ultimo = 0;
    const paso = (t) => {
      const k = dur ? Math.min(1, (t - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
      rot.current = { rx: a.rx + (rx - a.rx) * e, ry: a.ry + dy * e };
      aplicarRef.current(); if (dur) medir(t);
      if (k < 1) anim.current = requestAnimationFrame(paso);
    };
    anim.current = requestAnimationFrame(paso);
  };

  useEffect(() => {
    quieto.current = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPlegado(store.get('pc3d-plegado', false));
    if (typeof CSS !== 'undefined' && CSS.supports && !CSS.supports('transform-style', 'preserve-3d')) { fijaRef.current = true; setFija(true); }
    // escala según el tamaño del recuadro
    const ro = new ResizeObserver(([en]) => {
      const { width, height } = en.contentRect;
      escala.current = Math.max(0.2, Math.min(width / 580, height / 580));
      aplicarRef.current();
    });
    ro.observe(escena.current);
    // al aparecer por primera vez: giro de entrada, que de paso mide el rendimiento
    let visto = false;
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting || visto) return;
      visto = true;
      if (!quieto.current && !fijaRef.current) { rot.current = { rx: -22, ry: -75 }; irA(INICIAL.rx, INICIAL.ry); }
    }, { threshold: 0.3 });
    io.observe(escena.current);
    return () => { ro.disconnect(); io.disconnect(); cancelAnimationFrame(anim.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { aplicar(); });   // tras cada render (separada cambia la escala)
  useEffect(() => {                    // vista fija: vuelve a la vista inicial y se queda ahí
    if (!fija) return;
    cancelAnimationFrame(anim.current);
    rot.current = { rx: INICIAL.rx, ry: INICIAL.ry }; setVista(INICIAL.k); setSeparada(false); aplicar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fija]);

  /* ---------- arrastrar para girar (mouse y dedo) ---------- */
  const alBajar = (e) => {
    if (fija || (e.pointerType === 'mouse' && e.button !== 0)) return;
    cancelAnimationFrame(anim.current);
    arrastre.current = { x: e.clientX, y: e.clientY, id: e.pointerId, ...rot.current, pend: false };
    movido.current = false; cuadros.current.ultimo = 0;
  };
  const alMover = (e) => {
    const a = arrastre.current;
    if (!a || a.id !== e.pointerId) return;
    const dx = e.clientX - a.x, dy = e.clientY - a.y;
    if (!movido.current) {
      if (Math.hypot(dx, dy) < 6) return;
      movido.current = true; setVista(null);
      try { escena.current.setPointerCapture(e.pointerId); } catch { /* sin captura también funciona */ }
    }
    rot.current = { ry: a.ry + dx * 0.45, rx: Math.max(-80, Math.min(30, a.rx - dy * 0.35)) };
    if (!a.pend) { a.pend = true; requestAnimationFrame((t) => { a.pend = false; aplicarRef.current(); medir(t); }); }
  };
  const alSoltar = () => { arrastre.current = null; };

  /* ---------- tocar una pieza abre su paso ---------- */
  const tocar = (k) => { if (!movido.current) alAbrir(k); };
  const titulo = (k) => pasos.find((p) => p.k === k)?.t || '';

  const L = leer(piezas);
  const { cpu, board, ram, gpu, ssd, psu, cool } = piezas, caja = piezas.case;

  /* ---------- posiciones que dependen de la board ---------- */
  const { bw, bh, itx } = L;
  const sx = itx ? bw * 0.42 : Math.min(bw * 0.5, 115), sy = itx ? 58 : 72;
  const CX = BX + sx, CY = BY + sy;                       // centro del socket
  const ranuras = itx ? 2 : 4, paso = itx ? 12 : 10, ramX = BX + bw - (itx ? 34 : 50);
  const m2Y = BY + (itx ? 104 : 152), pcieY = BY + (itx ? 128 : 176);
  const ocupadas = itx ? (L.modulos >= 2 ? [0, 1] : [0]) : L.modulos >= 4 ? [0, 1, 2, 3] : L.modulos === 2 ? [1, 3] : [1];
  const largoGPU = { 1: 170, 2: 214, 3: 268 }[L.ventGPU] || 230;

  /* ---------- chasis (paredes; el lado z+ va abierto para ver adentro) ---------- */
  const paredes = (vacio) => (
    <>
      <Caja c="p3-chasis" z={-W / 2 + PARED / 2} w={D} h={H} d={PARED}
        caras={{ f: vacio ? <Etiqueta>Chasis</Etiqueta> : <i className="p3-pasacables" style={{ left: BX + bw + D / 2 + 14 }} /> }} />
      <Caja c="p3-chasis" y={H / 2 - PARED / 2} w={D} h={PARED} d={W} />
      <Caja c="p3-chasis" x={-D / 2 + PARED / 2} w={PARED} h={H - PARED * 2} d={W} caras={{ l: vacio ? null : <i className="p3-io-trasero" /> }} />
      <Plano c="p3-malla" y={-H / 2} w={D} h={W} rot="rotateX(90deg)" />
      <Plano c="p3-malla" x={D / 2} w={W} h={H} rot="rotateY(90deg)" />
      {vacio ? null : [[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b]) => (
        <Caja key={`${a}${b}`} c="p3-chasis" x={a * (D / 2 - 30)} y={H / 2 + 4} z={b * (W / 2 - 22)} w={34} h={8} d={22} />
      ))}
      {!vacio && L.cajaRGB ? <Caja c="p3-luz" x={D / 2 - 4} z={W / 2 - 10} w={2} h={H - 120} d={2} /> : null}
    </>
  );

  const vacia = !Object.values(piezas).some(Boolean);
  const cuenta = pasos.filter((p) => piezas[p.k]).length;

  return (
    <Ctx.Provider value={{ foco, setFoco, abierto, separada, tocar }}>
    <div className={`p3d${plegado ? ' is-plegado' : ''}${fija ? ' is-fija' : ''}${separada ? ' is-separada' : ''}`}>
      <div className="p3d__barra">
        <span className="p3d__titulo">Tu PC en 3D <span className="num">{cuenta}/{pasos.length}</span></span>
        <button className="p3d__plegar" aria-expanded={!plegado}
          onClick={() => { setPlegado(!plegado); store.set('pc3d-plegado', !plegado); }}>{plegado ? 'Ver' : 'Ocultar'}</button>
      </div>

      <div className="p3d__escena" ref={escena} role="img"
        aria-label={vacia ? 'Vista 3D de tu PC, todavía vacía' : `Vista 3D de tu PC con: ${pasos.filter((p) => piezas[p.k]).map((p) => p.t.toLowerCase()).join(', ')}`}
        onPointerDown={alBajar} onPointerMove={alMover} onPointerUp={alSoltar} onPointerCancel={alSoltar}>
        <div className="p3d__mundo" ref={mundo}>
          <Plano c="p3-suelo" y={H / 2 + 9} w={D + 160} h={W + 160} rot="rotateX(90deg)" />

          {/* Chasis */}
          <Pieza k="case" p={caja} fantasma={!caja}>
            <div className={`p3-in2${L.cajaBlanca ? ' is-blanco' : ''}`}>{paredes(!caja)}</div>
          </Pieza>

          {/* Board con sus ranuras */}
          {board ? (
            <Pieza k="board" p={board}>
              <Caja c="p3-pcb" x={BX + bw / 2} y={BY + bh / 2} z={BZ - 1.5} w={bw} h={bh} d={3}
                caras={{ f: <span className="p3-serig">{[L.chipset, L.formato].filter(Boolean).join(' · ')}</span> }} />
              <Caja c="p3-oscuro" x={BX + 20} y={BY + 50} z={BZ + 15} w={40} h={92} d={30} />
              <Caja c="p3-vrm" x={BX + (48 + sx + 40) / 2} y={BY + 17} z={BZ + 10} w={sx - 8} h={18} d={20} />
              <Caja c="p3-vrm" x={BX + 56} y={BY + (30 + sy + 50) / 2} z={BZ + 10} w={16} h={sy + 20} d={20} />
              <Caja c="p3-socket" x={CX} y={CY} z={BZ + 1.5} w={52} h={52} d={3} />
              {Array.from({ length: ranuras }, (_, i) => (
                <Caja key={i} c="p3-ranura" x={ramX + i * paso} y={BY + 86} z={BZ + 3} w={5} h={120} d={6} />
              ))}
              <Caja c="p3-ranura" x={CX} y={m2Y} z={BZ + 1} w={76} h={20} d={2} />
              <Caja c="p3-ranura" x={BX + (6 + Math.min(bw * 0.75, 200)) / 2} y={pcieY} z={BZ + 4} w={Math.min(bw * 0.75, 200) - 6} h={7} d={8} />
              <Caja c="p3-ranura" x={BX + bw - 6} y={BY + (itx ? 70 : 150)} z={BZ + 6} w={8} h={44} d={12} />
              {!itx ? <Caja c="p3-vrm" x={BX + bw - 48} y={BY + bh - 50} z={BZ + 3} w={36} h={36} d={6} /> : null}
            </Pieza>
          ) : (
            <Pieza k="board" fantasma><Plano x={BX + bw / 2} y={BY + bh / 2} z={BZ} w={bw} h={bh}><Etiqueta>Board</Etiqueta></Plano></Pieza>
          )}

          {/* Procesador (y su disipador de fábrica, si lo trae) */}
          {cpu ? (
            <Pieza k="cpu" p={cpu}>
              <Caja c="p3-cpu" x={CX} y={CY} z={BZ + 5} w={40} h={40} d={4} caras={{ f: <span className="p3-marca">{cpu.marca}</span> }} />
              {L.stock ? <Caja c="p3-oscuro" x={CX} y={CY} z={BZ + 20} w={74} h={74} d={26} caras={{ f: <Vent /> }} /> : null}
            </Pieza>
          ) : (
            <Pieza k="cpu" fantasma><Plano x={CX} y={CY} z={BZ + 7} w={44} h={44}><Etiqueta>CPU</Etiqueta></Plano></Pieza>
          )}

          {/* Refrigeración aparte: aire (torre) o líquida (bomba + radiador al frente) */}
          {cool && !L.liquida ? (
            <Pieza k="cool" p={cool}>
              <div className={`p3-in2${L.coolBlanco ? ' is-blanco' : ''}`}>
                <Caja c="p3-aletas" x={CX} y={CY} z={BZ + 64} w={50} h={128} d={115} />
                <Caja c="p3-oscuro" x={CX + 31} y={CY} z={BZ + 64} w={12} h={116} d={116} caras={{ r: <Vent rgb={L.coolRGB} />, l: <Vent rgb={L.coolRGB} /> }} />
              </div>
            </Pieza>
          ) : null}
          {cool && L.liquida ? (
            <>
              <Pieza k="cool" p={cool}>
                <div className={`p3-in2${L.coolBlanco ? ' is-blanco' : ''}`}>
                  <Caja c="p3-oscuro" x={CX} y={CY} z={BZ + 20} w={56} h={56} d={26} caras={{ f: <i className={`p3-bomba${L.coolRGB ? ' is-rgb' : ''}`} /> }} />
                  <Tubo a={[CX + 18, CY - 14, BZ + 26]} b={[D / 2 - 50, -120, -20]} />
                  <Tubo a={[CX + 18, CY + 14, BZ + 26]} b={[D / 2 - 50, -60, -20]} />
                </div>
              </Pieza>
              <Pieza k="cool" sep="rad" p={cool}>
                <div className={`p3-in2${L.coolBlanco ? ' is-blanco' : ''}`}>
                  {(() => {
                    const r = L.radiador || 240, n = r === 280 ? 2 : r / 120, alto = r * MM + 30;
                    return (
                      <>
                        <Caja c="p3-aletas p3-aletas--h" x={D / 2 - 47} z={0} w={26} h={alto} d={108} />
                        <Caja c="p3-oscuro" x={D / 2 - 22} z={0} w={22} h={alto - 20} d={108} caras={{ r: <Vent n={n} rgb={L.coolRGB} />, l: <Vent n={n} rgb={L.coolRGB} /> }} />
                      </>
                    );
                  })()}
                </div>
              </Pieza>
            </>
          ) : null}
          {cpu && !cpu.s?.disipador && !cool ? (
            <Pieza k="cool" fantasma><Caja c="p3-punteado" x={CX} y={CY} z={BZ + 40} w={96} h={70} d={60} caras={{ f: <Etiqueta>Refrigeración</Etiqueta> }} /></Pieza>
          ) : null}

          {/* Memoria RAM: un módulo por cada uno que diga el nombre */}
          {ram ? (
            <Pieza k="ram" p={ram}>
              {ocupadas.map((i) => (
                <Caja key={i} c={`p3-ram${L.ramRGB ? ' is-rgb' : ''}`} x={ramX + i * paso} y={BY + 86} z={BZ + 22} w={6} h={118} d={32}
                  caras={{ r: <span className="p3-vertical">{L.ddr}</span>, l: <span className="p3-vertical">{L.ddr}</span> }} />
              ))}
            </Pieza>
          ) : (
            <Pieza k="ram" fantasma><Plano x={ramX + ((ranuras - 1) * paso) / 2} y={BY + 86} z={BZ + 10} w={(ranuras - 1) * paso + 14} h={124}><Etiqueta>RAM</Etiqueta></Plano></Pieza>
          )}

          {/* Almacenamiento: M.2 en la board o SATA de 2,5" en el piso */}
          {ssd ? (
            <Pieza k="ssd" p={ssd}>
              {L.sata ? (
                <Caja c="p3-oscuro" x={145} y={PISO - 4} z={30} w={90} h={7} d={63} caras={{ t: <span className="p3-sticker">SATA {L.capacidad || ''}</span> }} />
              ) : (
                <Caja c="p3-m2" x={CX} y={m2Y} z={BZ + 3.5} w={72} h={20} d={3} caras={{ f: <span className="p3-sticker">{L.capacidad || 'M.2'}</span> }} />
              )}
            </Pieza>
          ) : (
            <Pieza k="ssd" fantasma><Plano x={CX} y={m2Y} z={BZ + 5} w={76} h={22}><Etiqueta>SSD</Etiqueta></Plano></Pieza>
          )}

          {/* Tarjeta de video: largo según sus ventiladores (2 si no lo dice) */}
          {gpu ? (
            <Pieza k="gpu" p={gpu}>
              <Caja c="p3-gpu" x={BX - 4 + largoGPU / 2} y={pcieY + 25} z={BZ + 50} w={largoGPU} h={42} d={100}
                caras={{
                  f: <span className="p3-gpu__t"><b>{L.modelo}</b>{L.vram ? <span>{L.vram} GB</span> : null}</span>,
                  u: <Vent n={L.ventGPU || 2} size={Math.min(84, largoGPU / (L.ventGPU || 2) - 8)} />,
                }} />
            </Pieza>
          ) : (
            <Pieza k="gpu" fantasma><Plano x={BX - 4 + 115} y={pcieY + 25} z={BZ + 100} w={230} h={42}><Etiqueta>Tarjeta de video</Etiqueta></Plano></Pieza>
          )}

          {/* Fuente: abajo atrás, con su potencia real */}
          {psu ? (
            <Pieza k="psu" p={psu}>
              <Caja c="p3-psu" x={-D / 2 + PARED + 68} y={PISO - 39} z={-W / 2 + PARED + 63} w={135} h={78} d={126}
                caras={{
                  f: <span className="p3-psu__t"><b className="num">{L.vatios ? `${L.vatios} W` : 'Fuente'}</b><span>{[psu.marca, L.cert].filter(Boolean).join(' · ')}</span></span>,
                  u: <Vent />,
                }} />
            </Pieza>
          ) : (
            <Pieza k="psu" fantasma><Caja c="p3-punteado" x={-D / 2 + PARED + 68} y={PISO - 39} z={-W / 2 + PARED + 63} w={135} h={78} d={126} caras={{ f: <Etiqueta>Fuente</Etiqueta> }} /></Pieza>
          )}
        </div>
      </div>

      <p className="p3d__info" aria-live="polite">
        {fija ? 'Vista fija para que la página vaya fluida en tu equipo. Toca una pieza para cambiarla.'
          : foco ? <><b>{titulo(foco)}</b> · {piezas[foco] ? `${piezas[foco].marca} ${nombreCorto(piezas[foco])}` : 'sin elegir'}</>
          : vacia ? 'Elige piezas y tu PC se arma aquí. Toca una parte para ir a su paso.'
          : 'Arrastra para girar · toca una pieza para cambiarla'}
      </p>

      <div className="p3d__ctrl" role="group" aria-label="Vistas del modelo 3D">
        {VISTAS.map((v) => (
          <button key={v.k} aria-pressed={vista === v.k} onClick={() => { setVista(v.k); irA(v.rx, v.ry); }}>{v.t}</button>
        ))}
        <button className="p3d__sep" aria-pressed={separada}
          onClick={() => { const s = !separada; setSeparada(s); if (s && vista !== 'arriba') { setVista(null); irA(-20, -55); } }}>
          Separada
        </button>
      </div>
    </div>
    </Ctx.Provider>
  );
}
