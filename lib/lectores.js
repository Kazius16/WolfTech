/* ============================================================
   LECTORES DE PDF DE PROVEEDORES
   Reciben las páginas del PDF como texto con posición
   ([{items:[{s, x, y, w}]}], y crece hacia arriba) y devuelven
   filas: {proveedor, ref, nombre, costo, categoria}
   - ref: lo que identifica al producto en la lista del proveedor
     (código en J&L, nombre original en PYPHS)
   Para agregar un proveedor nuevo: escribir otro lector y
   registrarlo en LECTORES.
   ============================================================ */
const LECTORES = (() => {
  const limpio = s => s.replace(/\s+/g, ' ').trim();
  const numero = s => parseInt(s.replace(/[^\d]/g, ''), 10) || 0;

  // une en renglones los textos que están a la misma altura
  function renglones(items, tol = 2.5){
    const ord = [...items].sort((a,b) => b.y - a.y || a.x - b.x);
    const out = [];
    ord.forEach(it => {
      const r = out.find(r => Math.abs(r.y - it.y) <= tol);
      if(r) r.items.push(it); else out.push({ y: it.y, items: [it] });
    });
    out.forEach(r => r.items.sort((a,b) => a.x - b.x));
    return out;
  }

  function categoriaPorNombre(n){
    const u = n.toUpperCase();
    if(/^CHASIS/.test(u)) return 'Chasis';
    if(/^FUENTE/.test(u)) return 'Fuentes';
    if(/^(VENTILADOR|REFRIGERACION|LIQUIDA|COOLER|DISIPADOR)/.test(u)) return 'Refrigeración';
    if(/^(PAD|SOPORTE|TECLADO|MOUSE|DIADEMA|AUDIFONO|MONITOR)/.test(u)) return 'Periféricos';
    if(/RYZEN|^INTEL/.test(u)) return 'Procesadores';
    if(/^BOARD/.test(u)) return 'Boards';
    if(/PORTATIL|LAPTOP|CYBORG|KATANA|THIN|NITRO|LEGION|TUF F/.test(u)) return 'Portátiles';
    if(/RTX|RXT|GTX|RADEON|RX ?\d{4}/.test(u)) return 'Tarjetas de video';
    if(/^(DDR|RAM|KIT \d+GB)/.test(u) || /DDR[45]/.test(u)) return 'Memoria RAM';
    if(/^(SOLIDO|SSD|DISCO|M\.2)/.test(u)) return 'Almacenamiento';
    return null;
  }

  /* ---------- J&L Suministros: CODIGO · NOMBRE · CONTADO · CONTADO IVA ---------- */
  function jyl(paginas){
    const filas = [];
    let empezo = false;  // se salta el bloque de "ofertas de la semana" del inicio
    paginas.forEach(pg => {
      renglones(pg.items).forEach(r => {
        const txt = limpio(r.items.map(i => i.s).join(' '));
        if(/CONTADO IVA|SOLO PARA VENTA/.test(txt)){ empezo = true; return; }
        if(!empezo) return;
        const cod = r.items[0];
        if(!/^[A-Z0-9]{6,}$/.test(cod.s.trim()) || cod.x > 80) return;
        const nombre = limpio(r.items.filter(i => i !== cod && i.x < 340 && !/^[\d.]+$/.test(i.s.trim())).map(i => i.s).join(' '));
        const precios = r.items.filter(i => i.x >= 340 && /^[\d.]+$|^-$/.test(i.s.trim()));
        if(!nombre || !precios.length) return;   // los títulos de sección no traen precio
        const ult = precios[precios.length - 1];
        const costo = ult && ult.s.trim() !== '-' ? numero(ult.s) : 0;
        filas.push({ proveedor: 'J&L', ref: cod.s.trim(), nombre, costo, categoria: categoriaPorNombre(nombre) });
      });
    });
    // si el proveedor repite un código para dos productos, se le suma el nombre
    const veces = {}; filas.forEach(f => veces[f.ref] = (veces[f.ref]||0) + 1);
    filas.forEach(f => { if(veces[f.ref] > 1) f.ref = f.ref + ' ' + f.nombre.toUpperCase(); });
    return filas;
  }
  jyl.reconoce = texto => /CONTADO IVA/.test(texto) && /CODIGO/.test(texto);

  /* ---------- PYPHS: tres columnas, nombre + precio ($ o TRANSITO) ---------- */
  const ENCABEZADOS = [
    [/^PROCESADORES/, 'Procesadores'], [/^BOARDS?\b/, 'Boards'], [/^TARJETAS GRAFICAS/, 'Tarjetas de video'],
    [/^MEMORIAS RAM/, 'Memoria RAM'], [/^REFRIGERACION/, 'Refrigeración'], [/^FUENTES/, 'Fuentes'],
    [/^PORTATILES/, 'Portátiles'], [/^ALMACENAMIENTO/, 'Almacenamiento'], [/^(CHASIS|GABINETES)/, 'Chasis'],
    [/^(PERIFERICOS|MONITORES|TECLADOS|MOUSE)/, 'Periféricos'],
  ];
  const esPrecio = s => /^\$\s*[\d.]+$/.test(s.trim()) || /^TRANSITO$/i.test(s.trim());
  const esRuido = t => /LISTA DE PRECIOS|^\d{2}\/\d{2}\/\d{4}$|^P[áa]gina \d/i.test(t);
  function pyphs(paginas){
    // columnas: posiciones x donde están los precios
    const xs = paginas.flatMap(pg => pg.items.filter(i => esPrecio(i.s)).map(i => i.x)).sort((a,b) => a-b);
    const cols = [];
    xs.forEach(x => { const c = cols.find(c => Math.abs(c.x - x) < 40); if(c){ c.n++; c.x += (x - c.x)/c.n; } else cols.push({x, n:1}); });
    const colX = cols.filter(c => c.n >= 2).map(c => c.x).sort((a,b) => a-b);
    const colDe = x => { const i = colX.findIndex(cx => x < cx - 2); return i === -1 ? colX.length - 1 : i; };
    const colPrecio = x => colX.reduce((m, cx, i) => Math.abs(cx - x) < Math.abs(colX[m] - x) ? i : m, 0);
    const filas = [];
    paginas.forEach(pg => {
      colX.forEach((_, c) => {
        const precios = pg.items.filter(i => esPrecio(i.s) && colPrecio(i.x) === c).map(i => ({ y: i.y, s: i.s.trim(), nombres: [] }));
        const lineas = renglones(pg.items.filter(i => !esPrecio(i.s) && i.s.trim() && colDe(i.x) === c))
          .map(r => ({ y: r.y, t: limpio(r.items.map(i => i.s).join(' ')) }))
          .filter(l => !esRuido(l.t));
        const encabezados = [];
        lineas.forEach(l => {
          const h = ENCABEZADOS.find(([re]) => re.test(l.t.toUpperCase()));
          if(h && !precios.some(p => Math.abs(p.y - l.y) < 3)){ encabezados.push({ y: l.y, cat: h[1] }); return; }
          // cada renglón de nombre va con el precio más cercano en altura (nombres partidos en 2-3 renglones)
          let mejor = null;
          precios.forEach(p => { const d = Math.abs(p.y - l.y); if(d <= 20 && (!mejor || d < mejor.d)) mejor = { p, d }; });
          if(mejor) mejor.p.nombres.push(l);
        });
        precios.forEach(p => {
          if(!p.nombres.length) return;
          const nombre = limpio(p.nombres.sort((a,b) => b.y - a.y).map(l => l.t).join(' '));
          const enc = encabezados.filter(e => e.y > p.y).sort((a,b) => a.y - b.y)[0];
          filas.push({ proveedor: 'PYPHS', ref: nombre.toUpperCase(), nombre, costo: /TRANSITO/i.test(p.s) ? 0 : numero(p.s),
                       categoria: (enc && enc.cat) || categoriaPorNombre(nombre) });
        });
      });
    });
    return filas;
  }
  pyphs.reconoce = texto => /LISTA DE PRECIOS PARA DISTRIBUIDORES/.test(texto);

  return { 'J&L': jyl, 'PYPHS': pyphs, categoriaPorNombre };
})();
export default LECTORES;
