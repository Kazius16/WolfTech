/* ============================================================
   PANEL DEL ADMINISTRADOR (lógica)
   Se monta sobre el HTML de components/AdminPanel.jsx.
   Todo se guarda en Supabase; al guardar, la tienda se actualiza
   para todos los clientes (vía /api/revalidar).
   ============================================================ */
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_KEY, SUPABASE_URL } from './config';
import { ORDEN_CATEGORIAS, CODIGO_CAT, parseLista, comoTexto, specsDe, normalizarAjustes, margen, calcularPrecio, faltaParaArmador, lineaSpecs } from './catalogo';
import { pesos, sinTildes } from './util';
import LECTORES from './lectores';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ahora = () => new Date().toISOString();

let sb = null;
const cliente = () => (sb ||= createClient(SUPABASE_URL, SUPABASE_KEY));

/* ---------- datos en Supabase ---------- */
const DATOS = {
  lista: '', ajustes: normalizarAjustes(), fotos: {},
  async iniciar() {
    const c = cliente();
    const [p, a, f] = await Promise.all([
      c.from('productos').select('*').order('orden'),
      c.from('ajustes').select('*').eq('id', 1).maybeSingle(),
      c.from('fotos').select('producto_id,url'),
    ]);
    if (p.error) throw p.error;
    this.lista = comoTexto(p.data);
    const x = a.data || {};
    this.ajustes = normalizarAjustes({ margenBase: x.margen_base != null ? +x.margen_base : undefined, margenes: x.margenes || {}, redondeo: x.redondeo ?? undefined, fecha: x.fecha_lista || null });
    this.fotos = Object.fromEntries((f.data || []).map((r) => [r.producto_id, r.url]));
  },
  async guardarLista(t) {
    const c = cliente(), { items } = parseLista(t);
    const rows = items.map((p, i) => ({ id: p.id, orden: i, categoria: p.categoria, marca: p.marca, nombre: p.nombre, costo: p.costo, estado: p.estado, proveedor: p.proveedor, ref: p.ref, actualizado: ahora() }));
    const up = await c.from('productos').upsert(rows);
    if (up.error) throw new Error('No se pudo guardar: ' + up.error.message);
    const quedan = new Set(rows.map((r) => r.id));
    const borrar = parseLista(this.lista).items.map((p) => p.id).filter((id) => !quedan.has(id));
    if (borrar.length) { const d = await c.from('productos').delete().in('id', borrar); if (d.error) throw new Error('No se pudo borrar: ' + d.error.message); }
    this.lista = t;
  },
  async guardarAjustes(a) {
    const row = { id: 1, actualizado: ahora() };
    if (a.margenBase != null) row.margen_base = a.margenBase;
    if (a.margenes) row.margenes = a.margenes;
    if (a.redondeo != null) row.redondeo = a.redondeo;
    if (a.fecha) row.fecha_lista = a.fecha;
    const r = await cliente().from('ajustes').upsert(row);
    if (r.error) throw new Error('No se pudieron guardar los ajustes: ' + r.error.message);
    this.ajustes = normalizarAjustes({ ...this.ajustes, ...a });
  },
  async guardarFoto(id, dataUrl) {
    const c = cliente(), blob = await (await fetch(dataUrl)).blob();
    const ruta = `${id}-${Date.now()}.${blob.type === 'image/webp' ? 'webp' : 'png'}`;
    const up = await c.storage.from('fotos').upload(ruta, blob, { contentType: blob.type, upsert: true });
    if (up.error) throw new Error('No se pudo subir la foto: ' + up.error.message);
    const url = c.storage.from('fotos').getPublicUrl(ruta).data.publicUrl;
    const r = await c.from('fotos').upsert({ producto_id: id, url, actualizado: ahora() });
    if (r.error) throw new Error('No se pudo guardar la foto: ' + r.error.message);
    this.fotos[id] = url;
  },
  async quitarFoto(id) {
    const r = await cliente().from('fotos').delete().eq('producto_id', id);
    if (r.error) throw new Error(r.error.message);
    delete this.fotos[id];
  },
  async esAdmin() {
    const c = cliente(); const { data } = await c.auth.getSession();
    if (!data.session) return false;
    const r = await c.rpc('es_admin'); return !!r.data;
  },
  async entrar(email, pass) {
    const c = cliente();
    const r = await c.auth.signInWithPassword({ email, password: pass });
    if (r.error) throw new Error('Correo o contraseña incorrectos');
    const a = await c.rpc('es_admin');
    if (!a.data) { await c.auth.signOut(); throw new Error('Esta cuenta no tiene permiso de administrador'); }
  },
  async salir() { await cliente().auth.signOut(); },
  // avisa al servidor que hay cambios, para que la tienda se actualice ya
  async publicar() {
    const { data } = await cliente().auth.getSession();
    if (!data.session) return;
    try { await fetch('/api/revalidar', { method: 'POST', headers: { Authorization: 'Bearer ' + data.session.access_token } }); } catch { /* se actualiza sola en unos minutos */ }
  },
};

/* ---------- PDF (pdf.js se carga solo cuando se necesita) ---------- */
const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/';
let pdfLib = null;
// import() por fuera del empaquetador: el archivo viene del CDN
const importar = new Function('u', 'return import(u)');
async function cargarPdfJs() {
  if (pdfLib) return pdfLib;
  pdfLib = await importar(PDFJS + 'pdf.min.mjs');
  pdfLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.mjs';
  return pdfLib;
}
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaLarga = (d, m, a) => `${d} de ${MESES[m - 1]} de ${a}`;
async function leerPdf(file) {
  const lib = await cargarPdfJs();
  const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const paginas = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    paginas.push({ items: tc.items.filter((t) => t.str && t.str.trim()).map((t) => ({ s: t.str, x: t.transform[4], y: t.transform[5], w: t.width })) });
  }
  const texto = paginas.flatMap((p) => p.items.map((i) => i.s)).join(' ');
  const prov = Object.keys(LECTORES).find((k) => typeof LECTORES[k] === 'function' && LECTORES[k].reconoce && LECTORES[k].reconoce(texto));
  if (!prov) throw new Error(`No reconocimos «${file.name}». Por ahora la página lee las listas de J&L y PYPHS.`);
  const fecha = texto.match(/(\d{2})\/(\d{2})\/(\d{4})/) || [];
  return { prov, filas: LECTORES[prov](paginas), archivo: file.name, fecha: fecha[0] ? fechaLarga(+fecha[1], +fecha[2], +fecha[3]) : null, orden: fecha[0] ? +fecha[3] * 10000 + +fecha[2] * 100 + +fecha[1] : 0 };
}

/* nombre limpio para productos nuevos (se puede corregir en la lista) */
const MARCAS = ['ANTEC', 'ASUS', 'MSI', 'GIGABYTE', 'AORUS', 'CORSAIR', 'PATRIOT', 'KLEVV', 'CRUCIAL', 'INTEL', 'AMD', 'THERMALTAKE', 'THERMALRIGHT', 'PNY', 'ZOTAC', 'LEXAR', 'GSKILL', 'G.SKILL', 'KINGSTON', 'SAMSUNG', 'SKYNIX', 'WD', 'SEAGATE', 'COOLER MASTER', 'NZXT', 'LIAN LI', 'DEEPCOOL', 'REDRAGON', 'LOGITECH', 'HYPERX', 'RAZER', 'ACER', 'LENOVO', 'HP', 'DELL', 'XPG', 'ADATA', 'TEAMGROUP', 'EVGA', 'SAPPHIRE', 'XFX', 'POWERCOLOR', 'PALIT', 'GAINWARD', 'INNO3D'];
const SIGLAS = new Set(['RGB', 'ARGB', 'RTX', 'GTX', 'RX', 'OC', 'AM4', 'AM5', 'SSD', 'GB', 'TB', 'DDR4', 'DDR5', 'TUF', 'ROG', 'MAG', 'PRO', 'LP', 'ICE', 'XMP', 'EXPO', 'NE', 'WF', 'AX', 'FHD', 'QHD', 'SATA', 'GT', 'LC', 'PNY', 'MSI', 'ATX', 'ITX', 'NVME', 'USB', 'RGB/ARGB']);
function nombreNuevo(raw) {
  let u = raw.toUpperCase().replace(/\bRXT\b/, 'RTX').replace(/_/g, ' ');
  const marca = MARCAS.find((m) => new RegExp('\\b' + m.replace('.', '\\.') + '\\b').test(u)) || (/RYZEN/.test(u) ? 'AMD' : '');
  u = u.replace(/^(CHASIS|FUENTE DE PODER|FUENTE|BOARD|SOLIDO|REFRIGERACION|SSD M\.2|RAM)\s+/, '');
  if (marca) u = u.replace(new RegExp('\\b' + marca.replace('.', '\\.') + '\\b'), '');
  const minus = { EN: 'en', SIN: 'sin', CAJA: 'caja', BLISTER: 'blíster', NUEVO: 'nuevo', CORE: 'núcleos', NUCLEOS: 'núcleos', FAN: 'fan', WIFI: 'WiFi', GHZ: 'GHz', MHZ: 'MHz', NATIVO: 'nativo', BLINDADA: 'blindada', AIRE: 'aire' };
  const nombre = u.split(/\s+/).filter(Boolean).map((t) => minus[t] || (SIGLAS.has(t) || /\d/.test(t) ? t : t[0] + t.slice(1).toLowerCase())).join(' ').replace(/^- /, '');
  const bonita = !marca ? 'Otra' : marca === 'GSKILL' || marca === 'G.SKILL' ? 'G.Skill' : marca.length <= 4 ? marca : marca[0] + marca.slice(1).toLowerCase();
  return { marca: bonita === 'Aorus' ? 'Gigabyte' : bonita, nombre: nombre.trim() };
}

function reducirImagen(file, max = 900) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      let out = c.toDataURL('image/webp', 0.86);
      if (!out.startsWith('data:image/webp')) out = c.toDataURL('image/png');
      res(out);
    };
    img.onerror = () => rej(new Error('No se pudo leer la imagen'));
    img.src = url;
  });
}

/* ============================================================
   MONTAJE: conecta el HTML del panel con la lógica.
   Devuelve una función para desmontar.
   ============================================================ */
export function montarAdmin(root, { toast }) {
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const off = [];
  const on = (el, ev, fn) => { el.addEventListener(ev, fn); off.push(() => el.removeEventListener(ev, fn)); };

  let TODOS = [], VISIBLES = [], IMPORT = null;
  const precio = (p) => calcularPrecio(DATOS.ajustes, p);
  function cargar() {
    TODOS = parseLista(DATOS.lista).items.map((p) => { p.s = specsDe(p); p.precio = precio(p); return p; });
    VISIBLES = TODOS.filter((p) => p.estado !== 'oculto');
  }

  /* ---------- sesión ---------- */
  async function abrir() {
    const ok = await DATOS.esAdmin().catch(() => false);
    root.classList.toggle('is-locked', !ok);
    $('#login').hidden = ok; $('#logout').hidden = !ok;
    if (!ok) return;
    try { await DATOS.iniciar(); } catch (err) { toast('No se pudo cargar el catálogo: ' + err.message); return; }
    cargar(); pintarAdmin();
  }
  on($('#login'), 'submit', async (e) => {
    e.preventDefault();
    const f = e.target, b = f.querySelector('button'); b.disabled = true; $('#loginErr').textContent = '';
    try { await DATOS.entrar(f.email.value.trim(), f.pass.value); f.reset(); await abrir(); }
    catch (err) { $('#loginErr').textContent = err.message; }
    b.disabled = false;
  });
  on($('#logout'), 'click', async () => { await DATOS.salir(); abrir(); });

  async function tras(cambio) {   // guarda, recalcula y publica
    await cambio();
    cargar();
    DATOS.publicar();
  }

  /* ---------- pintar todo ---------- */
  function pintarAdmin() {
    const aj = DATOS.ajustes;
    const cats = ORDEN_CATEGORIAS.filter((c) => TODOS.some((p) => p.categoria === c));
    $('#margins').innerHTML = `<label>Base (todas)<input type="number" min="0" max="80" step="0.5" data-m="__base" value="${aj.margenBase}">%</label>`
      + cats.map((c) => `<label>${esc(c)}<input type="number" min="0" max="80" step="0.5" data-m="${esc(c)}" placeholder="${aj.margenBase}" value="${aj.margenes[c] ?? ''}">%</label>`).join('');
    $('#round').checked = aj.redondeo;
    $('#adminList').value = DATOS.lista;
    statsAdmin(); pintarFotos(); pintarAgregar();
  }

  /* ---------- agregar producto a mano ---------- */
  function pintarAgregar() {
    const f = $('#addp');
    if (!f.categoria.options.length) f.categoria.innerHTML = ORDEN_CATEGORIAS.map((c) => `<option>${esc(c)}</option>`).join('');
    $('#dlMarcas').innerHTML = [...new Set(TODOS.map((p) => p.marca))].sort().map((m) => `<option value="${esc(m)}">`).join('');
    previaAgregar();
  }
  function previaAgregar() {
    const f = $('#addp'), costo = parseInt((f.costo.value || '').replace(/[^\d]/g, ''), 10) || 0;
    if (!f.nombre.value.trim()) { $('#addpPrev').textContent = ''; return; }
    const v = costo && f.estado.value !== 'transito' ? precio({ costo, estado: f.estado.value, categoria: f.categoria.value }) : null;
    const borrador = { categoria: f.categoria.value, nombre: f.nombre.value.trim() };
    const falta = faltaParaArmador(borrador);
    const lee = falta ? '' : lineaSpecs({ ...borrador, s: specsDe(borrador), precio: 1 });
    $('#addpPrev').textContent = `Así se verá: ${f.marca.value.trim() || 'Marca'} ${f.nombre.value.trim()} — ${v ? pesos(v) + ' al público (margen ' + margen(DATOS.ajustes, f.categoria.value) + '%)' : 'Consultar'}`
      + (falta ? `. Ojo, para el armador ${falta}.` : lee ? `. El armador lo lee como: ${lee}.` : '');
  }
  on($('#addp'), 'input', previaAgregar);
  on($('#addp'), 'submit', async (e) => {
    e.preventDefault();
    const f = e.target, limpiar = (v) => v.replace(/;/g, ',').trim();
    const fila = { categoria: f.categoria.value, marca: limpiar(f.marca.value), nombre: limpiar(f.nombre.value),
      costo: parseInt((f.costo.value || '').replace(/[^\d]/g, ''), 10) || 0, estado: f.estado.value, proveedor: limpiar(f.proveedor.value) || 'Otro' };
    if (!fila.marca || !fila.nombre) { toast('Falta la marca o el nombre'); return; }
    if (!fila.costo && fila.estado !== 'oculto') fila.estado = 'transito';
    const texto = DATOS.lista.replace(/\s+$/, '') + '\n' + [fila.categoria, fila.marca, fila.nombre, fila.costo, fila.estado, fila.proveedor, ''].join(';');
    const boton = f.querySelector('[type=submit]'); boton.disabled = true;
    try { await tras(() => DATOS.guardarLista(texto)); }
    catch (err) { toast(err.message); boton.disabled = false; return; }
    const nuevo = parseLista(texto).items.pop();
    if (f.foto.files[0]) {
      try { await DATOS.guardarFoto(nuevo.id, await reducirImagen(f.foto.files[0])); DATOS.publicar(); }
      catch { toast('El producto quedó, pero la foto no se pudo subir'); }
    }
    boton.disabled = false;
    f.reset(); pintarAdmin();
    toast(`Agregado: ${fila.marca} ${fila.nombre}`);
  });

  /* ---------- fotos ---------- */
  function pintarFotos() {
    const q = sinTildes($('#phQ').value.toLowerCase()), f = $('#phF').value;
    const lista = VISIBLES.filter((p) => sinTildes(`${p.marca} ${p.nombre} ${p.categoria}`.toLowerCase()).includes(q))
      .filter((p) => f === 'todos' || (f === 'con') === !!DATOS.fotos[p.id]);
    $('#photos').innerHTML = lista.slice(0, 120).map((p) => {
      const img = DATOS.fotos[p.id];
      return `<li>
        <div class="photos__th">${img ? `<img src="${esc(img)}" alt="">` : esc(CODIGO_CAT[p.categoria] || '')}</div>
        <p class="photos__n"><small>${esc(p.categoria)} · ${esc(p.marca)}</small>${esc(p.nombre)}</p>
        <div class="photos__act">
          <label class="btn btn--${img ? 'ghost' : 'solid'} btn--sm">${img ? 'Cambiar foto' : 'Subir foto'}<input type="file" accept="image/*" data-photo="${p.id}"></label>
          ${img ? `<button class="btn btn--ghost btn--sm" data-unphoto="${p.id}">Quitar</button>` : ''}
        </div>
      </li>`;
    }).join('') || '<li style="display:block;color:#777">Ningún producto coincide.</li>';
    $('#phUse').textContent = `${Object.keys(DATOS.fotos).length} fotos guardadas en la tienda.`;
  }
  on($('#photos'), 'change', async (e) => {
    const inp = e.target.closest('[data-photo]'); if (!inp || !inp.files[0]) return;
    try { toast('Subiendo foto…'); await DATOS.guardarFoto(inp.dataset.photo, await reducirImagen(inp.files[0])); DATOS.publicar(); pintarFotos(); toast('Foto guardada'); }
    catch (err) { toast(err.message); }
  });
  on($('#photos'), 'click', async (e) => {
    const b = e.target.closest('[data-unphoto]'); if (!b) return;
    try { await DATOS.quitarFoto(b.dataset.unphoto); DATOS.publicar(); pintarFotos(); toast('Foto quitada'); }
    catch (err) { toast(err.message); }
  });
  on($('#phQ'), 'input', pintarFotos);
  on($('#phF'), 'change', pintarFotos);

  /* ---------- lista y márgenes ---------- */
  function statsAdmin() {
    const { items, errores } = parseLista($('#adminList').value);
    const n = (e) => items.filter((p) => p.estado === e).length;
    $('#aStats').innerHTML = `<span><b>${items.length}</b> productos</span><span><b>${n('disponible')}</b> disponibles</span><span><b>${n('destacado')}</b> destacados</span><span><b>${n('transito')}</b> en tránsito</span><span><b>${n('oculto')}</b> ocultos</span>`;
    const revisar = items.filter((p) => p.estado !== 'oculto').map((p) => [p, faltaParaArmador(p)]).filter(([, f]) => f);
    $('#aErr').innerHTML = errores.map((e) => `<li>${esc(e)}</li>`).join('')
      + revisar.map(([p, f]) => `<li>Línea ${p.linea} · ${esc(p.marca)} ${esc(p.nombre)}: el armador no lo puede usar, ${esc(f)}.</li>`).join('');
    return { items, errores };
  }
  let tStats = 0;
  on($('#adminList'), 'input', () => { clearTimeout(tStats); tStats = setTimeout(statsAdmin, 300); });
  on($('#aDiff'), 'click', () => {
    const nuevo = parseLista($('#adminList').value).items, viejo = parseLista(DATOS.lista).items;
    const V = new Map(viejo.map((p) => [p.id, p])), N = new Map(nuevo.map((p) => [p.id, p]));
    const nuevos = nuevo.filter((p) => !V.has(p.id)), idos = viejo.filter((p) => !N.has(p.id));
    const cambios = nuevo.filter((p) => V.has(p.id) && V.get(p.id).costo !== p.costo);
    const li = (p) => `<li>${esc(p.marca)} ${esc(p.nombre)} <span class="mono">${p.costo ? pesos(p.costo) : 'consultar'}</span></li>`;
    $('#dNewT').textContent = `Nuevos (${nuevos.length})`; $('#dNew').innerHTML = nuevos.map(li).join('') || '<li>—</li>';
    $('#dGoneT').textContent = `Ya no están (${idos.length})`; $('#dGone').innerHTML = idos.map(li).join('') || '<li>—</li>';
    $('#dPriceT').textContent = `Cambian de precio (${cambios.length})`;
    $('#dPrice').innerHTML = cambios.map((p) => { const a = V.get(p.id).costo, b = p.costo, pct = a ? (((b - a) / a) * 100).toFixed(1) : '—'; return `<li>${esc(p.marca)} ${esc(p.nombre)}<br><span class="mono">${a ? pesos(a) : 'consultar'} → ${b ? pesos(b) : 'consultar'} (${pct > 0 ? '+' : ''}${pct}%)</span></li>`; }).join('') || '<li>—</li>';
    $('#aDiffOut').hidden = false;
  });
  on($('#aSave'), 'click', async (e) => {
    const { errores } = statsAdmin();
    if (errores.length) { toast(`Corrige ${errores.length} línea(s) antes de guardar`); return; }
    const margenes = {}; let base = DATOS.ajustes.margenBase;
    $$('[data-m]').forEach((i) => { if (i.dataset.m === '__base') base = parseFloat(i.value) || 0; else if (i.value !== '') margenes[i.dataset.m] = parseFloat(i.value); });
    e.target.disabled = true;
    try {
      await tras(async () => {
        await DATOS.guardarAjustes({ margenBase: base, margenes, redondeo: $('#round').checked });
        await DATOS.guardarLista($('#adminList').value);   // al guardar a mano no se toca la fecha de la lista
      });
      pintarFotos(); toast('Catálogo guardado y publicado');
    } catch (err) { toast(err.message); }
    e.target.disabled = false;
  });
  on($('#aCopy'), 'click', async () => { try { await navigator.clipboard.writeText($('#adminList').value); toast('Lista copiada'); } catch { toast('Selecciona el texto y cópialo a mano'); } });

  /* ---------- subir PDF del proveedor ---------- */
  function planImport(lecturas) {
    const actual = parseLista(DATOS.lista).items;
    const plan = { lecturas, cambios: [], nuevos: [], idos: [], aTransito: [], aDisponible: [], iguales: 0 };
    lecturas.forEach(({ prov, filas }) => {
      const mios = actual.filter((p) => p.proveedor === prov && p.ref);
      const porRef = new Map(mios.map((p) => [p.ref.toUpperCase(), p]));
      const vistos = new Set();
      filas.forEach((f) => {
        const p = porRef.get(f.ref.toUpperCase());
        if (!p) { plan.nuevos.push({ ...f, ...nombreNuevo(f.nombre), publicar: false }); return; }
        vistos.add(p.id);
        if (p.costo === f.costo) { plan.iguales++; return; }
        if (f.costo === 0) plan.aTransito.push({ p, f });
        else if (p.costo === 0) plan.aDisponible.push({ p, f });
        else plan.cambios.push({ p, f });
      });
      mios.filter((p) => !vistos.has(p.id) && p.estado !== 'oculto').forEach((p) => plan.idos.push(p));
    });
    return plan;
  }
  function pintarImport() {
    const o = $('#impOut'), P = IMPORT;
    if (!P) { o.innerHTML = ''; return; }
    const pct = (a, b) => { const v = ((b - a) / a) * 100; return (v > 0 ? '+' : '') + v.toFixed(1) + '%'; };
    const sube = P.cambios.filter((c) => c.f.costo > c.p.costo).length;
    o.innerHTML = `<div class="imp">
      <div class="imp__head"><h3>${P.lecturas.map((l) => esc(l.prov) + (l.fecha ? ' (' + esc(l.fecha) + ')' : '')).join(' + ')}</h3><span class="mono">${P.lecturas.map((l) => esc(l.archivo)).join(', ')}</span></div>
      <div class="imp__sum">
        <span><b>${P.lecturas.reduce((a, l) => a + l.filas.length, 0)}</b> productos leídos</span>
        <span><b>${P.iguales}</b> sin cambios</span>
        <span><b>${P.cambios.length}</b> cambian de precio (${sube} suben)</span>
        <span><b>${P.nuevos.length}</b> nuevos</span>
        <span><b>${P.idos.length}</b> ya no aparecen</span>
        <span><b>${P.aTransito.length + P.aDisponible.length}</b> cambian de estado</span>
      </div>
      ${P.cambios.length ? `<details open><summary>Cambian de precio (${P.cambios.length})</summary><ul>${P.cambios.map(({ p, f }) => `<li><span>${esc(p.marca)} ${esc(p.nombre)}</span><span class="mono ${f.costo > p.costo ? 'up' : ''}">${pesos(p.costo)} → ${pesos(f.costo)} (${pct(p.costo, f.costo)})</span></li>`).join('')}</ul></details>` : ''}
      ${P.nuevos.length ? `<details open><summary>Nuevos (${P.nuevos.length}) · marca los que quieres publicar</summary>
        <ul><li><label><input type="checkbox" id="impAll"> Seleccionar todos</label><span></span></li>${P.nuevos.map((n, i) => `<li><label><input type="checkbox" data-pub="${i}" ${n.publicar ? 'checked' : ''}> <span>${esc(n.categoria || 'Sin categoría')} · ${esc(n.marca)} ${esc(n.nombre)}</span></label><span class="mono">${n.costo ? pesos(n.costo) : 'consultar'}</span></li>`).join('')}</ul></details>` : ''}
      ${P.idos.length ? `<details><summary>Ya no aparecen en la lista (${P.idos.length}) · se ocultan</summary><ul>${P.idos.map((p) => `<li><span>${esc(p.marca)} ${esc(p.nombre)}</span><span class="mono">${esc(p.proveedor)}</span></li>`).join('')}</ul></details>` : ''}
      ${P.aTransito.length ? `<details><summary>Pasan a tránsito (${P.aTransito.length})</summary><ul>${P.aTransito.map(({ p }) => `<li><span>${esc(p.marca)} ${esc(p.nombre)}</span><span class="mono">consultar</span></li>`).join('')}</ul></details>` : ''}
      ${P.aDisponible.length ? `<details><summary>Vuelven a estar disponibles (${P.aDisponible.length})</summary><ul>${P.aDisponible.map(({ p, f }) => `<li><span>${esc(p.marca)} ${esc(p.nombre)}</span><span class="mono">${pesos(f.costo)}</span></li>`).join('')}</ul></details>` : ''}
      <div class="imp__btns"><button class="btn btn--solid btn--sm" id="impOk">Aplicar cambios</button><button class="btn btn--ghost btn--sm" id="impNo">Cancelar</button></div>
    </div>`;
  }
  async function aplicarImport() {
    const P = IMPORT, lineas = DATOS.lista.split('\n');
    const cambiar = (p, fn) => { const f = lineas[p.linea - 1].split(';'); fn(f); lineas[p.linea - 1] = f.join(';'); };
    P.cambios.forEach(({ p, f }) => cambiar(p, (x) => { x[3] = f.costo; }));
    P.aTransito.forEach(({ p }) => cambiar(p, (x) => { x[3] = 0; if (x[4] !== 'oculto') x[4] = 'transito'; }));
    P.aDisponible.forEach(({ p, f }) => cambiar(p, (x) => { x[3] = f.costo; if (x[4] === 'transito') x[4] = 'disponible'; }));
    P.idos.forEach((p) => cambiar(p, (x) => { x[4] = 'oculto'; }));
    P.nuevos.forEach((n) => lineas.push([n.categoria || 'Periféricos', n.marca, n.nombre, n.costo, n.publicar ? (n.costo ? 'disponible' : 'transito') : 'oculto', n.prov || n.proveedor, n.ref].join(';')));
    const nuevoTexto = lineas.join('\n').replace(/\n{3,}/g, '\n\n');
    const fecha = [...P.lecturas].sort((a, b) => b.orden - a.orden).map((l) => l.fecha).filter(Boolean)[0];
    try {
      await tras(async () => {
        await DATOS.guardarLista(nuevoTexto);
        if (fecha) await DATOS.guardarAjustes({ fecha });
      });
    } catch (err) { toast(err.message); return; }
    const pub = P.nuevos.filter((n) => n.publicar).length;
    IMPORT = null; pintarImport(); pintarAdmin();
    toast(`Lista actualizada: ${P.cambios.length} precios, ${pub} productos nuevos publicados`);
  }
  async function procesarArchivos(files) {
    const o = $('#impOut');
    o.innerHTML = '<p class="imp__msg">Leyendo el PDF…</p>';
    try {
      const lecturas = [];
      for (const f of files) lecturas.push(await leerPdf(f));
      IMPORT = planImport(lecturas);
      pintarImport();
    } catch (err) {
      console.warn(err);
      o.innerHTML = `<p class="imp__msg">${esc(err.message && err.message.startsWith('No reconocimos') ? err.message : 'No se pudo leer el PDF. Revisa que sea la lista original del proveedor (no una foto ni un escaneo).')}</p>`;
    }
  }
  on($('#pdfIn'), 'change', (e) => { if (e.target.files.length) procesarArchivos([...e.target.files]); e.target.value = ''; });
  const drop = $('#drop');
  ['dragenter', 'dragover'].forEach((ev) => on(drop, ev, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((ev) => on(drop, ev, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
  on(drop, 'drop', (e) => { const fs = [...e.dataTransfer.files].filter((f) => /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name)); if (fs.length) procesarArchivos(fs); });
  on($('#impOut'), 'change', (e) => {
    if (!IMPORT) return;
    if (e.target.id === 'impAll') { IMPORT.nuevos.forEach((n) => { n.publicar = e.target.checked; }); $$('[data-pub]').forEach((c) => { c.checked = e.target.checked; }); return; }
    const c = e.target.closest('[data-pub]'); if (c) IMPORT.nuevos[+c.dataset.pub].publicar = c.checked;
  });
  on($('#impOut'), 'click', (e) => {
    if (e.target.id === 'impOk') aplicarImport();
    if (e.target.id === 'impNo') { IMPORT = null; pintarImport(); }
  });

  abrir();
  return () => off.forEach((f) => f());
}
