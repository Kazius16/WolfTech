/* ============================================================
   CATÁLOGO — reglas puras (sirven en el servidor y en el navegador)
   · Lectura de la lista  categoria;marca;nombre;costo;estado;proveedor;ref
   · Especificaciones y compatibilidad (se sacan del nombre)
   · Precios con margen
   ============================================================ */
import { sinTildes, slug } from './util';
import { AJUSTES_BASE } from './config';

export const ORDEN_CATEGORIAS = ['Procesadores', 'Tarjetas de video', 'Boards', 'Memoria RAM', 'Almacenamiento', 'Fuentes', 'Refrigeración', 'Chasis', 'Portátiles', 'Periféricos'];
export const CODIGO_CAT = { 'Procesadores': 'CPU', 'Tarjetas de video': 'GPU', 'Boards': 'MB', 'Memoria RAM': 'RAM', 'Almacenamiento': 'SSD', 'Fuentes': 'PSU', 'Refrigeración': 'COOL', 'Chasis': 'CASE', 'Portátiles': 'LAPTOP', 'Periféricos': 'ACC' };
export const ESTADOS = ['disponible', 'transito', 'destacado', 'oculto'];

/* Textos para las páginas de categoría (SEO) */
export const INTRO_CATEGORIA = {
  'Procesadores': 'Procesadores AMD Ryzen e Intel Core para gaming y trabajo. Te decimos qué board y memoria son compatibles con cada uno.',
  'Tarjetas de video': 'Tarjetas de video NVIDIA GeForce RTX para jugar en 1080p, 1440p y 4K. Cada una con la fuente recomendada.',
  'Boards': 'Boards AM4, AM5 e Intel con el socket y el tipo de memoria claros para que no te equivoques.',
  'Memoria RAM': 'Memoria RAM DDR4 y DDR5 para PC de escritorio, en kits y módulos de varias velocidades.',
  'Almacenamiento': 'Discos sólidos SSD M.2 NVMe y SATA para que tu PC arranque y cargue juegos en segundos.',
  'Fuentes': 'Fuentes de poder certificadas 80 Plus, de 500 W a más de 1000 W, para cada tarjeta de video.',
  'Refrigeración': 'Disipadores por aire, refrigeración líquida y ventiladores para mantener tu procesador fresco.',
  'Chasis': 'Chasis gamer con buen flujo de aire, vidrio templado y ventiladores RGB o ARGB.',
  'Portátiles': 'Portátiles gamer con tarjetas RTX, listos para jugar y trabajar donde estés.',
  'Periféricos': 'Teclados, mouse, diademas y accesorios para completar tu setup.',
};

export const slugCategoria = (c) => slug(c);
export const categoriaPorSlug = (s) => ORDEN_CATEGORIAS.find((c) => slug(c) === s) || null;

/* ---------- lista de texto ---------- */
export function parseLista(texto) {
  const items = [], errores = [], usados = new Set();
  String(texto || '').split('\n').forEach((raw, i) => {
    const l = raw.trim();
    if (!l || l.startsWith('#')) return;
    const f = l.split(';').map((s) => s.trim());
    if (f.length < 5) { errores.push(`Línea ${i + 1}: faltan campos (${f.length} de 5)`); return; }
    const [categoria, marca, nombre, costoTxt, estadoTxt, proveedor = '', ref = ''] = f;
    const costo = parseInt(costoTxt.replace(/[^\d]/g, ''), 10) || 0;
    let estado = sinTildes(estadoTxt.toLowerCase());
    if (!ESTADOS.includes(estado)) { errores.push(`Línea ${i + 1}: estado «${estadoTxt}» no válido`); estado = 'disponible'; }
    // el id sale de marca + nombre: así la foto y la página se conservan aunque cambie el precio
    let id = slug(`${marca} ${nombre}`), n = 2;
    while (usados.has(id)) id = slug(`${marca} ${nombre}`) + '-' + (n++);
    usados.add(id);
    items.push({ id, categoria, marca, nombre, costo, estado, proveedor, ref, linea: i + 1 });
  });
  return { items, errores };
}

export const ENCABEZADO_LISTA = '# categoria;marca;nombre;costo;estado;proveedor;ref';
export const comoTexto = (rows) => [ENCABEZADO_LISTA,
  ...rows.map((r) => [r.categoria, r.marca, r.nombre, r.costo, r.estado, r.proveedor || '', r.ref || ''].join(';'))].join('\n');

/* ---------- compatibilidad (se calcula del nombre) ---------- */
export const REGLAS = {
  cpu(p) {
    const n = p.nombre.toUpperCase();
    let socket = null, ddr = null, w = 105, disipador = false;
    const r = n.match(/RYZEN \d (\d{4})(X3D|XT|X|G|F)?/);
    if (r) {
      const suf = r[2] || '', m = +r[1];
      socket = r[1][0] === '5' ? 'AM4' : 'AM5';
      ddr = socket === 'AM4' ? 'DDR4' : 'DDR5';
      w = suf === 'X3D' ? (m >= 9900 ? 170 : 120) : /^(7900|9950|9900)/.test(r[1]) ? 170 : suf === 'G' || suf === 'XT' || m === 5700 || /^(9600|9700)/.test(r[1]) ? 88 : 105;
      disipador = suf === 'G' || (suf === 'XT' && m < 6000);
    } else if (/ULTRA/.test(n)) {
      socket = 'LGA1851'; ddr = 'DDR5'; w = /285K|270K/.test(n) ? 250 : 160;
    } else if (/I[579]-?1[234]\d{3}/.test(n)) {
      socket = 'LGA1700';
      w = /14700|12700/.test(n) ? 200 : /14600K/.test(n) ? 180 : 120;
      disipador = !/K/.test(n.match(/1[234]\d{3}\w*/)[0]);
    }
    const nucleos = (n.match(/(\d+) NÚCLEOS/) || [])[1] || null;
    return { socket, ddr, w, disipador, nucleos };
  },
  board(p) {
    const n = p.nombre.toUpperCase();
    let socket = null;
    if (/\b[ABX](520|550|570)/.test(n)) socket = 'AM4';
    else if (/\b[ABX](620|650|840|850|870)/.test(n) || /AM5/.test(n)) socket = 'AM5';
    else if (/\b[HBZ](610|660|760|790)/.test(n)) socket = 'LGA1700';
    else if (/\b[ZB](890|860)/.test(n)) socket = 'LGA1851';
    const ddr = (n.match(/DDR[45]/) || [])[0] || (socket === 'AM4' ? 'DDR4' : 'DDR5');
    return { socket, ddr, wifi: /WIFI|WF|AX/.test(n) };
  },
  ram(p) { const n = p.nombre.toUpperCase(); return { ddr: (n.match(/DDR[45]/) || [])[0] || null, gb: +((n.match(/(\d+)\s?GB/) || [])[1] || 0) }; },
  gpu(p) {
    const n = p.nombre.toUpperCase().replace(/\s+/g, ' ');
    const m = n.match(/(\d{4}) ?(TI)?/);
    const mod = m ? m[1] + (m[2] ? 'TI' : '') : '';
    const T = { '3050': [130, 450], '5050': [130, 550], '5060': [145, 550], '4060TI': [165, 550], '5060TI': [180, 600], '5070': [250, 650], '5070TI': [300, 750], '5080': [360, 850] };
    const [w, fuente] = T[mod] || [220, 650];
    return { modelo: mod, w, fuente, vram: +((n.match(/(\d+)\s?GB/) || [])[1] || 0) };
  },
  psu(p) { const ws = (p.nombre.toUpperCase().match(/\d{3,4}/g) || []).map(Number).filter((x) => x >= 400 && x <= 1600); return { w: ws.length ? Math.max(...ws) : 0 }; },
};
export function specsDe(p) {
  const f = { 'Procesadores': REGLAS.cpu, 'Boards': REGLAS.board, 'Memoria RAM': REGLAS.ram, 'Tarjetas de video': REGLAS.gpu, 'Fuentes': REGLAS.psu }[p.categoria];
  return f ? f(p) : {};
}

/* ¿El armador puede usar este producto? Devuelve lo que falta en el nombre (vacío = todo bien) */
export function faltaParaArmador(p) {
  const s = specsDe(p);
  if (p.categoria === 'Procesadores' && !s.socket) return 'no se reconoce el modelo: escribe «Ryzen 5 7600X», «Core i5-14400F» o «Core Ultra 7 265K»';
  if (p.categoria === 'Boards' && !s.socket) return 'no se reconoce el chipset: escribe B650, B760, A520, X870… en el nombre';
  if (p.categoria === 'Memoria RAM' && !s.ddr) return 'falta el tipo de memoria: escribe DDR4 o DDR5 en el nombre';
  if (p.categoria === 'Fuentes' && !s.w) return 'falta la potencia: escribe los vatios en el nombre (ej. 750)';
  if (p.categoria === 'Tarjetas de video' && !s.modelo) return 'no se reconoce el modelo: escribe RTX 5060, RTX 5070 Ti…';
  return '';
}

export function tablaSpecs(p) {
  const s = p.s, c = p.categoria, n = p.nombre.toUpperCase(), t = [];
  if (c === 'Procesadores') { t.push(['Socket', s.socket]); t.push(['Memoria', s.ddr || 'DDR4 o DDR5 (según board)']); if (s.nucleos) t.push(['Núcleos', s.nucleos]); t.push(['Disipador', s.disipador ? 'Incluido' : 'No incluido']); t.push(['Consumo aprox.', s.w + ' W']); }
  else if (c === 'Boards') { t.push(['Socket', s.socket]); t.push(['Memoria', s.ddr]); t.push(['WiFi', s.wifi ? 'Sí' : 'No indicado']); }
  else if (c === 'Memoria RAM') { t.push(['Tipo', s.ddr]); if (s.gb) t.push(['Capacidad', s.gb + ' GB']); const v = (n.match(/(\d{4})\s?(MT|MHZ)?/) || [])[1]; if (v) t.push(['Velocidad', v + ' MT/s']); }
  else if (c === 'Tarjetas de video') { if (s.vram) t.push(['Memoria', s.vram + ' GB']); t.push(['Fuente sugerida', '≥ ' + s.fuente + ' W']); t.push(['Consumo aprox.', s.w + ' W']); }
  else if (c === 'Fuentes') { if (s.w) t.push(['Potencia', s.w + ' W']); const cert = (n.match(/BRONCE|GOLD|PLATINUM/) || [])[0]; if (cert) t.push(['Certificación', { BRONCE: '80 Plus Bronze', GOLD: '80 Plus Gold', PLATINUM: '80 Plus Platinum' }[cert]]); t.push(['Modular', /FULL MODULAR/.test(n) ? 'Full modular' : /SEMI/.test(n) ? 'Semi modular' : 'No indicado']); }
  else if (c === 'Almacenamiento') { const cap = (n.match(/\d+\s?TB|\d+\s?GB/) || [])[0]; if (cap) t.push(['Capacidad', cap]); t.push(['Tipo', /GEN4/.test(n) ? 'M.2 NVMe Gen4' : /SATA/.test(n) ? 'SATA 2.5"' : '—']); const sp = (n.match(/(\d{3,4})\s?MB/) || [])[1]; if (sp) t.push(['Lectura', sp + ' MB/s']); }
  else if (c === 'Refrigeración') { t.push(['Tipo', /VENTILADOR/.test(n) ? 'Ventiladores' : /LÍQUIDA|LIQUIDA|LC |360/.test(n) ? 'Refrigeración líquida' : 'Disipador de aire']); if (/360/.test(n)) t.push(['Radiador', '360 mm']); }
  t.push(['Estado', p.precio ? 'Disponible con el proveedor' : 'En tránsito: consulta fecha']);
  return t.filter((r) => r[1]);
}

export function lineaSpecs(p) {
  const s = p.s, c = p.categoria;
  if (c === 'Procesadores') return [s.socket, s.ddr || 'DDR4/DDR5', s.disipador ? 'con disipador' : 'sin disipador'].filter(Boolean).join(' · ');
  if (c === 'Boards') return [s.socket, s.ddr, s.wifi && 'WiFi'].filter(Boolean).join(' · ');
  if (c === 'Memoria RAM') return [s.ddr, s.gb && s.gb + ' GB'].filter(Boolean).join(' · ');
  if (c === 'Tarjetas de video') return [s.vram && s.vram + ' GB', 'fuente ≥ ' + s.fuente + ' W'].filter(Boolean).join(' · ');
  if (c === 'Fuentes') return s.w ? s.w + ' W' : '';
  return tablaSpecs(p).filter((r) => r[0] !== 'Estado').map((r) => r[1]).slice(0, 2).join(' · ');
}

/* ---------- nombres para mostrar ---------- */
export function nombreCorto(p) {
  const n = p.nombre;
  if (p.categoria === 'Tarjetas de video') { const m = n.match(/RTX \d{4}(\s?TI)?/i); if (m) return m[0].replace(/\s?TI$/i, ' Ti'); }
  if (p.categoria === 'Procesadores') { const m = n.match(/Ryzen \d \d{4}\w*|Core (i\d-\d{5}\w*|Ultra \d \d{3}\w*)/); if (m) return m[0]; }
  if (p.categoria === 'Portátiles') return n.split('·')[0].trim();
  return n.split(' ').slice(0, 3).join(' ');
}
export function restoNombre(p) {
  return (p.marca + ' ' + p.nombre.replace(nombreCorto(p), '')).replace(/\s·\s/g, ' · ').replace(/\s+/g, ' ').replace(/^(\S+) · /, '$1 ').trim();
}

/* ---------- precios ---------- */
export function normalizarAjustes(a = {}) {
  return {
    margenBase: a.margenBase ?? AJUSTES_BASE.margenBase,
    margenes: a.margenes || {},
    redondeo: a.redondeo ?? AJUSTES_BASE.redondeo,
    fecha: a.fecha || AJUSTES_BASE.fecha,
  };
}
export function margen(ajustes, cat) {
  const m = ajustes.margenes[cat];
  return m === undefined || m === '' || isNaN(m) ? ajustes.margenBase : +m;
}
export function calcularPrecio(ajustes, p) {
  if (!p.costo || p.estado === 'transito') return null;
  const v = p.costo * (1 + margen(ajustes, p.categoria) / 100);
  return ajustes.redondeo ? Math.ceil(v / 10000) * 10000 - 100 : Math.ceil(v / 100) * 100;
}

/* ---------- armar el catálogo listo para mostrar ----------
   Devuelve productos SIN el costo del proveedor (solo lo que ve el cliente). */
export function armarCatalogo({ texto, ajustes, fotos = {} }) {
  const aj = normalizarAjustes(ajustes);
  const productos = parseLista(texto).items
    .filter((p) => p.estado !== 'oculto')
    .map((p) => {
      const s = specsDe(p);
      return { id: p.id, categoria: p.categoria, marca: p.marca, nombre: p.nombre, estado: p.estado, s, precio: calcularPrecio(aj, p), foto: fotos[p.id] || null };
    });
  return { productos, fecha: aj.fecha };
}

/* ---------- destacados y sugerencias ---------- */
export function destacadosOrdenados(lista) {
  const prio = ['Tarjetas de video', 'Procesadores', 'Portátiles'];
  return lista.filter((p) => p.estado === 'destacado')
    .sort((a, b) => ((prio.indexOf(a.categoria) + 9) % 9) - ((prio.indexOf(b.categoria) + 9) % 9) || (b.precio || 0) - (a.precio || 0));
}

export function sugerencias(p, visibles) {
  const de = (cat, f, n = 3, orden = 'asc') => visibles
    .filter((x) => x.categoria === cat && x.id !== p.id && f(x))
    .sort((a, b) => orden === 'asc' ? (a.precio ?? Infinity) - (b.precio ?? Infinity) : (b.precio ?? 0) - (a.precio ?? 0))
    .slice(0, n);
  const s = p.s, out = [];
  if (p.categoria === 'Procesadores') {
    out.push(['Boards compatibles', `Socket ${s.socket}`, de('Boards', (b) => b.s.socket === s.socket)]);
    if (s.ddr) out.push(['Memoria compatible', s.ddr, de('Memoria RAM', (r) => r.s.ddr === s.ddr)]);
    if (!s.disipador) out.push(['Necesita refrigeración', 'Este procesador no trae disipador', de('Refrigeración', (r) => !/VENTILADOR/i.test(r.nombre))]);
  } else if (p.categoria === 'Boards') {
    out.push(['Procesadores compatibles', `Socket ${s.socket}`, de('Procesadores', (c) => c.s.socket === s.socket)]);
    out.push(['Memoria compatible', s.ddr, de('Memoria RAM', (r) => r.s.ddr === s.ddr)]);
  } else if (p.categoria === 'Memoria RAM') {
    out.push(['Boards compatibles', s.ddr, de('Boards', (b) => b.s.ddr === s.ddr)]);
  } else if (p.categoria === 'Tarjetas de video') {
    out.push(['Fuentes recomendadas', `${s.fuente} W o más`, de('Fuentes', (f) => f.s.w >= s.fuente)]);
  } else if (p.categoria === 'Fuentes' && s.w) {
    out.push(['Tarjetas que soporta', `Hasta ${s.w} W recomendados`, de('Tarjetas de video', (g) => g.s.fuente <= s.w && g.precio, 3, 'desc')]);
  }
  return out.filter((x) => x[2].length);
}

export const precioTxt = (p, pesosFn) => (p.precio ? pesosFn(p.precio) : 'Consultar');
