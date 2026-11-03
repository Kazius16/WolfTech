'use client';
/* ============================================================
   HERO — el logo se enciende como un circuito (WebGL, sin librerías)
   La textura /fx.png sale del PNG original del logo:
     R = distancia al borde (forma exacta del logo)
     G = recorrido de la corriente desde la nariz hasta las orejas
     B = nodos (los círculos del circuito)
   ============================================================ */
import { useEffect, useRef, useState } from 'react';
import Logo from './Logo';
import { useTienda } from './Tienda';

const VS = 'attribute vec2 a; void main(){ gl_Position = vec4(a,0.,1.); }';
const FS = `
precision highp float;
uniform sampler2D uFx; uniform float uTime, uIgn, uKick, uScale, uAbsorb; uniform vec2 uCenter, uRot, uMouse;
const vec3 NEON = vec3(.18, .55, 1.0);   // azul neón
const float N = 1024.0, R = 80.0;
vec2 toPlane(vec2 p){
  float cy = cos(uRot.x), sy = sin(uRot.x), cx = cos(uRot.y), sx = sin(uRot.y);
  mat3 Ry = mat3(cy,0.,-sy, 0.,1.,0., sy,0.,cy);
  mat3 Rx = mat3(1.,0.,0., 0.,cx,sx, 0.,-sx,cx);
  mat3 M = Rx*Ry;
  vec3 n = M*vec3(0.,0.,1.);
  vec3 ro = vec3(0.,0.,3.4), rd = normalize(vec3(p, -3.4));
  float t = -dot(ro, n)/dot(rd, n);
  vec3 h = ro + rd*t;
  return (h*M).xy;
}
float band(float x, float c, float w){ float d = (x-c)/w; return exp(-d*d); }
void main(){
  vec2 p = (gl_FragCoord.xy - uCenter) / uScale;
  vec2 q = toPlane(p);
  vec2 uv = vec2(q.x*.5+.5, .5-q.y*.5);
  vec3 fx = texture2D(uFx, clamp(uv, .001, .999)).rgb;
  float outside = max(max(abs(q.x), abs(q.y)) - 1.0, 0.0);
  float d = (fx.r - .5) * 4.0 * R / N + outside;
  float g = fx.g;
  float node = fx.b;
  float px = 1.15 / uScale;
  float inside = smoothstep(px, -px, d);
  float front = uIgn;
  float lit = smoothstep(front + .004, front - .05, g);
  float fb = band(g, front, .022) * step(front, 1.08);
  float pul = 0.0;
  if(uIgn > 1.0){
    for(int i=0;i<3;i++){ float c = fract(uTime*.11 + float(i)/3.0)*1.25 - .1; pul += band(g, c, .03); }
  }
  float kick = band(g, uKick*1.1 - .05, .05) * step(uKick, 1.2);
  vec2 mq = toPlane((uMouse - uCenter)/uScale);
  float near = exp(-length(q - mq)*2.6);
  float core = inside * (mix(.045, .80, lit) + fb*2.2 + pul*.45*lit + kick*1.4 + near*.12*lit);
  float nodeOn = smoothstep(.15, 1., node) * lit;
  core += nodeOn * inside * (.25 + .2*sin(uTime*2.2 + g*12.));
  float dO = max(d, 0.0);
  float reach = smoothstep(.15, .08, dO);
  float tight = lit*(.5 + pul*1.2 + near*.9) + fb*3.0 + kick*2.2;
  float wide  = lit*(.35 + near*.5) + fb*2.0 + kick*1.4;
  float halo = exp(-dO*60.0)*.55*tight + exp(-dO*20.0)*.10*wide;
  halo += nodeOn * exp(-dO*14.0) * .30;
  float blue = exp(-dO*42.0) * (fb*1.5 + pul*.6*lit + kick*1.0 + uAbsorb*.8*lit);
  blue += inside * (fb*.7 + kick*.4 + uAbsorb*.15*lit);
  float edge = smoothstep(1.34, 1.12, max(abs(p.x), abs(p.y)));
  halo *= reach; blue *= reach;
  vec3 col = (vec3(core + halo*.55) + NEON*(halo*.6 + blue)) * edge;
  col = max(col - .012, 0.0) / .988;
  col = 1.0 - exp(-col*1.35);
  gl_FragColor = vec4(col, max(col.r, max(col.g, col.b)));
}`;

/* monta la animación y devuelve la función que la detiene */
function montarHero(hero, cv, tc, alFallar) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let gl;
  try { gl = cv.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true }); } catch { /* sin WebGL */ }
  if (!gl) { alFallar(); return () => {}; }

  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; };
  let prog;
  try {
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw gl.getProgramInfoLog(prog);
  } catch (e) { console.warn(e); alFallar(); return () => {}; }
  gl.useProgram(prog);
  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(12), gl.DYNAMIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['uFx', 'uTime', 'uIgn', 'uKick', 'uScale', 'uCenter', 'uRot', 'uMouse', 'uAbsorb'].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });

  /* ---------- pistas de circuito al fondo (canvas 2D) ---------- */
  const ctx = tc.getContext('2d');
  let traces = [], DPR = 1, Wc = 0, Hc = 0, C = { x: 0, y: 0, s: 0 }, absorb = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);
  function genTraces() {
    traces = [];
    const n = innerWidth < 760 ? 16 : 30;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + rnd(-0.08, 0.08);
      const dx = Math.cos(ang), dy = Math.sin(ang);
      let x = C.x + dx * C.s * rnd(0.95, 1.15), y = C.y + dy * C.s * rnd(0.95, 1.15);
      const pts = [[x, y]];
      const horiz = Math.abs(dx) > Math.abs(dy);
      const sx = Math.sign(dx) || 1, sy = Math.sign(dy) || 1;
      const L1 = rnd(0.15, 0.5) * C.s;
      if (horiz) x += sx * L1; else y += sy * L1; pts.push([x, y]);
      const L2 = rnd(0.1, 0.35) * C.s;
      x += sx * L2 * (horiz ? 1 : 0.999); y += sy * L2; pts.push([x, y]);
      const far = (Math.max(Wc, Hc) / DPR) * 1.2;
      if (horiz) x += sx * far; else y += sy * far; pts.push([x, y]);
      let len = 0; const seg = [];
      for (let k = 1; k < pts.length; k++) { const l = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); seg.push(l); len += l; }
      const corte = Math.random() < 0.45 ? rnd(0.35, 0.7) : 1;
      traces.push({ pts, seg, len: len * corte, node: corte < 1, pulses: [], next: rnd(0, 3) });
    }
  }
  function at(t, s) {
    let d = s;
    for (let k = 0; k < t.seg.length; k++) { if (d <= t.seg[k]) { const a = t.pts[k], b = t.pts[k + 1], u = d / t.seg[k]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; } d -= t.seg[k]; }
    return t.pts[t.pts.length - 1];
  }
  function drawTraces(dt, show, par) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, Wc, Hc);
    ctx.save(); ctx.translate(par.x, par.y);
    ctx.lineWidth = 1; ctx.lineJoin = 'round';
    traces.forEach((t, i) => {
      const vis = Math.min(1, Math.max(0, show * 1.6 - (i / traces.length) * 0.6));
      if (vis <= 0) return;
      ctx.strokeStyle = 'rgba(255,255,255,.075)';
      ctx.beginPath();
      const L = t.len * vis, steps = 24;
      for (let k = 0; k <= steps; k++) { const p = at(t, (L * k) / steps); if (k) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
      ctx.stroke();
      if (t.node && vis >= 1) { const e = at(t, t.len); ctx.beginPath(); ctx.arc(e[0], e[1], 3.2, 0, 7); ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.stroke(); }
      if (reduce || show < 1) return;
      t.next -= dt;
      if (t.next <= 0) { t.pulses.push({ s: t.len, v: rnd(160, 320), dir: -1 }); t.next = rnd(1.8, 5.5); }
      t.pulses = t.pulses.filter((p) => {
        p.s += p.dir * p.v * dt;
        if (p.dir < 0 && p.s <= 0) { absorb = Math.min(0.9, absorb + 0.35); return false; }
        return p.s > 0 && p.s < t.len + 1;
      });
      t.pulses.forEach((p) => {
        const tail = 90;
        ctx.save(); ctx.shadowColor = 'rgba(46,140,255,.9)'; ctx.shadowBlur = 10;
        for (let k = 0; k < 10; k++) {
          const s0 = p.s - (p.dir * tail * k) / 10, s1 = p.s - (p.dir * tail * (k + 1)) / 10;
          if (s0 < 0 || s1 < 0 || s0 > t.len || s1 > t.len) continue;
          const a = at(t, s0), b = at(t, s1), f = 1 - k / 10;
          const g = Math.round(140 + 115 * f * f), r = Math.round(46 + 200 * f * f * f);
          ctx.strokeStyle = `rgba(${r},${g},255,${(0.95 * f).toFixed(3)})`;
          ctx.lineWidth = 1.2 + f * 1.2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        }
        ctx.restore(); ctx.lineWidth = 1;
      });
    });
    ctx.restore();
  }
  const burst = () => traces.forEach((t) => t.pulses.push({ s: 0, v: rnd(380, 620), dir: 1 }));

  /* ---------- tamaño y encuadre ---------- */
  function size() {
    const mobile = innerWidth < 760;
    DPR = Math.min(devicePixelRatio || 1, mobile ? 2 : 1.5);
    const w = hero.clientWidth, h = hero.clientHeight;
    cv.width = Wc = Math.floor(w * DPR); cv.height = Hc = Math.floor(h * DPR);
    tc.width = Wc; tc.height = Hc;
    gl.viewport(0, 0, Wc, Hc);
    const cx = mobile ? w * 0.5 : w * 0.64, cy = mobile ? h * 0.36 : h * 0.46;
    const s = mobile ? Math.min(w * 0.47, h * 0.3) : Math.min(w * 0.3, h * 0.4);
    C = { x: cx, y: cy, s };
    gl.uniform2f(U.uCenter, cx * DPR, (h - cy) * DPR);
    gl.uniform1f(U.uScale, s * DPR);
    // solo se dibuja el rectángulo alrededor del logo (más rápido en celulares)
    const m = 1.35, x0 = ((cx - s * m) / w) * 2 - 1, x1 = ((cx + s * m) / w) * 2 - 1, y0 = 1 - ((cy + s * m) / h) * 2, y1 = 1 - ((cy - s * m) / h) * 2;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x0, y0, x1, y0, x0, y1, x0, y1, x1, y0, x1, y1]), gl.DYNAMIC_DRAW);
    genTraces();
  }

  /* ---------- interacción ---------- */
  let mx = -9999, my = -9999, tx = 0, ty = 0, rx = 0, ry = 0, drag = null, dX = 0, dY = 0, kickT = 9;
  const onMove = (e) => {
    if (e.pointerType === 'mouse') { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; const r = hero.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }
    if (drag) { dX = drag.x0 + ((e.clientX - drag.x) / innerWidth) * 1.6; dY = drag.y0 + ((e.clientY - drag.y) / innerHeight) * 1.2; }
  };
  const onDown = (e) => {
    if (e.target.closest('a,button')) return;
    const r = hero.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top;
    if (e.pointerType !== 'mouse') drag = { x: e.clientX, y: e.clientY, x0: dX, y0: dY };
    if (ign >= 1.05) { kickT = 0; burst(); }
  };
  const onUp = () => { drag = null; };

  /* ---------- animación ---------- */
  let visible = true, raf = 0, t0 = 0, last = 0, ign = reduce ? 1.2 : 0, vivo = true;
  const IGN_START = 0.35, IGN_DUR = 2.3;
  function frame(now) {
    if (!vivo) return;
    if (!t0) t0 = now;
    const t = (now - t0) / 1000, dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    if (!reduce) { const k = Math.min(1, Math.max(0, (t - IGN_START) / IGN_DUR)); ign = (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2) * 1.2; }
    kickT += dt * 0.9; absorb *= Math.pow(0.25, dt);
    if (!drag) { dX *= 0.93; dY *= 0.93; }
    rx += (tx - rx) * 0.05; ry += (ty - ry) * 0.05;
    const idle = reduce ? 0 : Math.sin(t * 0.5) * 0.1;
    gl.uniform2f(U.uRot, rx * 0.55 + idle + dX, ry * 0.4 + dY + (reduce ? 0 : Math.cos(t * 0.37) * 0.05));
    gl.uniform2f(U.uMouse, mx * DPR, (hero.clientHeight - my) * DPR);
    gl.uniform1f(U.uTime, t); gl.uniform1f(U.uIgn, ign); gl.uniform1f(U.uKick, kickT); gl.uniform1f(U.uAbsorb, absorb);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    drawTraces(dt, Math.min(1, Math.max(0, ign - 0.55) / 0.5), { x: -rx * 18, y: -ry * 12 });
    raf = visible ? requestAnimationFrame(frame) : 0;
  }
  const reanudar = () => { if (visible && !raf && vivo) { last = 0; raf = requestAnimationFrame(frame); } };
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; reanudar(); });
  const onVis = () => { visible = !document.hidden; reanudar(); };

  const tex = gl.createTexture(), img = new Image();
  img.onload = () => {
    if (!vivo) return;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach((p) => gl.texParameteri(gl.TEXTURE_2D, p, gl.LINEAR));
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((p) => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
    gl.uniform1i(U.uFx, 0);
    size(); addEventListener('resize', size);
    addEventListener('pointermove', onMove, { passive: true });
    hero.addEventListener('pointerdown', onDown);
    addEventListener('pointerup', onUp);
    io.observe(hero);
    document.addEventListener('visibilitychange', onVis);
    raf = requestAnimationFrame(frame);
  };
  img.onerror = alFallar;
  img.src = '/fx.png';

  return () => {
    vivo = false; cancelAnimationFrame(raf); io.disconnect();
    removeEventListener('resize', size); removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp);
    hero.removeEventListener('pointerdown', onDown); document.removeEventListener('visibilitychange', onVis);
  };
}

/* letras del titular, cada una entra con su propio retraso */
function Letras({ lineas, d0 }) {
  let i = 0;
  return lineas.map((ln) => (
    <span className="ln" key={ln}>
      {[...ln].map((c, k) => (c === ' ' ? ' ' : <span key={k} className="ch" style={{ '--i': i++, '--d0': d0 + 's' }}>{c}</span>))}
    </span>
  ));
}

/* texto que "se decodifica" */
function useDecodificar(texto, delay) {
  const [out, setOut] = useState('');
  useEffect(() => {
    if (!texto) return;
    const chars = '01ABCDEFX#/·-_';
    let f = 0, raf = 0; const total = 28;
    const tick = () => {
      setOut([...texto].map((c, i) => (c === ' ' ? ' ' : i < (f / total) * texto.length ? c : chars[(Math.random() * chars.length) | 0])).join(''));
      if (++f <= total) raf = requestAnimationFrame(tick); else setOut(texto);
    };
    const t = setTimeout(tick, delay);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [texto, delay]);
  return out;
}

export default function Hero() {
  const { productos, fecha } = useTienda();
  const hero = useRef(null), gl = useRef(null), traces = useRef(null);
  const [sinGL, setSinGL] = useState(false);
  const meta = useDecodificar(`${productos.length} referencias · lista del ${fecha}`, 2000);

  useEffect(() => montarHero(hero.current, gl.current, traces.current, () => setSinGL(true)), []);

  return (
    <section className={'hero' + (sinGL ? ' no-gl' : '')} id="hero" aria-label="WolfTech" ref={hero}>
      <canvas ref={traces} aria-hidden="true" />
      <canvas ref={gl} aria-hidden="true" />
      <div className="hero__fallback" aria-hidden="true"><Logo /></div>
      <p className="hero__meta mono">{meta}</p>
      <div className="hero__copy">
        <h1 aria-label="Construye poder."><Letras lineas={['Construye', 'poder.']} d0={1.15} /></h1>
        <div className="hero__side">
          <p className="wipe" style={{ '--d': '2.1s' }}>Procesadores, tarjetas de video, boards y portátiles gamer. Cotiza por WhatsApp y te confirmamos disponibilidad el mismo día. Envíos a toda Colombia.</p>
          <div className="row wipe" style={{ '--d': '2.3s' }}>
            <a className="btn btn--solid" href="#armador">Arma tu PC</a>
            <a className="btn btn--ghost" href="#catalogo">Ver catálogo</a>
          </div>
        </div>
      </div>
    </section>
  );
}
