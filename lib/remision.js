/* ============================================================
   REMISIONES (/admin/remision)
   Constancia de lo que se le entrega al cliente: productos con su
   serial y su garantía (editable), forma de pago, total y firma de
   recibido. Se guarda en Supabase (tabla remisiones, 08-remisiones.sql)
   para reimprimirla o buscar un serial cuando alguien reclame garantía.
   «Descargar PDF» usa la impresión del navegador (en el celular:
   Compartir/Imprimir → Guardar como PDF).
   Se puede llenar a mano o desde un pedido: /admin/remision?pedido=<id>
   ============================================================ */
import { cliente } from './admin';
import { pesos, sinTildes } from './util';
import { TIENDA, SITIO, RESENA_GOOGLE, RECARGO_LINK, telefonoBonito } from './config';
import { celularIntl, ID_RECARGO } from './pedidos';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = (v) => parseInt(String(v ?? '').replace(/[^\d]/g, ''), 10) || 0;
export const codigo = (n) => 'REM-' + String(n).padStart(4, '0');
const hoy = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const fechaLarga = (f) => new Date(f + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
const GARANTIA = (nombre) => (/usad|reacondicion|open ?box/i.test(nombre) ? '6 meses' : '12 meses');
export const PAGOS = ['Transferencia', 'Link de pago (tarjeta)', 'Contraentrega', 'Efectivo'];

export const totalDe = (items, envio) => items.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0) + (envio || 0);

/* ---------- el documento (lo que se imprime / guarda como PDF) ---------- */
export function documento(r, logoSvg = '') {
  const filas = r.items.map((i, k) => `<tr>
      <td class="rd__n">${k + 1}</td>
      <td><b>${esc(i.nombre)}</b>${i.serial ? `<small>Serial: ${esc(i.serial)}</small>` : ''}</td>
      <td class="rd__c">${esc(i.garantia || '—')}</td>
      <td class="rd__c">${i.cantidad || 1}</td>
      <td class="rd__r">${pesos(i.precio || 0)}</td>
      <td class="rd__r"><b>${pesos((i.precio || 0) * (i.cantidad || 1))}</b></td>
    </tr>`).join('');
  const sub = totalDe(r.items, 0);
  return `<article class="rd${r.anulada ? ' rd--anulada' : ''}">
    <header class="rd__top">
      <div class="rd__marca">${logoSvg}<div><strong>WOLFTECH</strong><span>Componentes y PC gamer</span></div></div>
      <div class="rd__tit"><strong>REMISIÓN</strong><span>No. ${esc(codigo(r.numero))}</span></div>
    </header>
    ${r.anulada ? '<p class="rd__anul">ANULADA</p>' : ''}
    <section class="rd__datos">
      <div><h4>Cliente</h4>
        <p><b>${esc(r.cliente)}</b></p>
        ${r.documento ? `<p>${esc(r.documento)}</p>` : ''}
        ${r.celular ? `<p>Cel. ${esc(r.celular)}</p>` : ''}
        ${r.direccion || r.ciudad ? `<p>${esc([r.direccion, r.ciudad].filter(Boolean).join(', '))}</p>` : ''}
      </div>
      <div><h4>Entrega</h4>
        <p>Fecha: <b>${esc(fechaLarga(r.fecha))}</b></p>
        <p>Forma de pago: <b>${esc(r.pago || '—')}</b></p>
        ${r.nota ? `<p>${esc(r.nota)}</p>` : ''}
      </div>
    </section>
    <table class="rd__tabla">
      <thead><tr><th>#</th><th>Producto</th><th>Garantía</th><th>Cant.</th><th>Valor unit.</th><th>Total</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
    <div class="rd__tot">
      <p><span>Subtotal</span><span>${pesos(sub)}</span></p>
      ${r.envio ? `<p><span>Envío</span><span>${pesos(r.envio)}</span></p>` : ''}
      <p class="rd__total"><span>TOTAL</span><span>${pesos(r.total)}</span></p>
    </div>
    <section class="rd__cond">
      <h4>Condiciones</h4>
      <ul>
        <li>Los productos se revisaron antes de entregarlos: sello, serial, accesorios y funcionamiento.</li>
        <li>La garantía corre desde la fecha de esta remisión, por el término indicado en cada producto. Para hacerla válida, conserva este documento, el empaque y los accesorios, y escríbenos por WhatsApp.</li>
        <li>No cubre golpes, humedad, pines doblados, sellos o seriales alterados, ni daños por mala instalación o uso indebido (Ley 1480 de 2011). Condiciones completas en ${esc(SITIO.replace('https://www.', ''))}/garantia.</li>
      </ul>
    </section>
    <section class="rd__firmas">
      <div><span class="rd__linea"></span><p>Recibí a satisfacción · Nombre y C.C.</p></div>
      <div><span class="rd__linea"></span><p>Entregó · WolfTech</p></div>
    </section>
    <footer class="rd__pie">${esc(TIENDA.titular)} · ${esc(TIENDA.documento)} · ${esc(TIENDA.direccion)}, ${esc(TIENDA.ciudad)} · WhatsApp ${esc(telefonoBonito())} · ${esc(SITIO.replace('https://www.', ''))}</footer>
  </article>`;
}

export function mensajeRemision(r) {
  const prods = r.items.filter((i) => i.garantia || i.serial)
    .map((i) => `• ${i.cantidad > 1 ? i.cantidad + ' x ' : ''}${i.nombre}${i.serial ? ` (serial ${i.serial})` : ''}${i.garantia ? ` — garantía ${i.garantia}` : ''}`);
  return `Hola ${r.cliente.split(' ')[0]}, te comparto la remisión ${codigo(r.numero)} de tu compra en WolfTech:\n\n${prods.join('\n')}\n\n*Total: ${pesos(r.total)}*\n\nTe adjunto el PDF. Guárdalo junto con la caja y los accesorios: es tu soporte para la garantía. Si algo falla, escríbenos por aquí.\n\n¡Gracias por confiar en WolfTech! 🐺${RESENA_GOOGLE ? `\nSi te gustó la experiencia, nos ayudas mucho con una reseña: ${RESENA_GOOGLE}` : ''}`;
}

/* ---------- la página ---------- */
export function montarRemision(root, { toast }) {
  const $ = (s) => root.querySelector(s);
  const off = [];
  const on = (el, ev, fn) => { el.addEventListener(ev, fn); off.push(() => el.removeEventListener(ev, fn)); };
  let PRODUCTOS = [], ITEMS = [], LISTA = [], ACTUAL = null, PEDIDO_ID = null;
  const logo = () => $('.rem__logo')?.outerHTML.replace('rem__logo', 'rd__logo') || '';
  const form = $('#rem');

  const etiqueta = (p) => `${p.marca} ${p.nombre}`;
  async function iniciar() {
    const c = cliente(); const { data } = await c.auth.getSession();
    const admin = data.session ? (await c.rpc('es_admin')).data : false;
    root.classList.toggle('is-locked', !admin);
    if (!admin) return;
    const [cat, rem] = await Promise.all([
      c.from('catalogo').select('id,categoria,marca,nombre,precio').order('orden'),
      cargarLista(),
    ]);
    PRODUCTOS = cat.data || [];
    $('#dlRem').innerHTML = PRODUCTOS.map((p) => `<option value="${esc(etiqueta(p))}"></option>`).join('');
    form.fecha.value = hoy();
    const id = new URLSearchParams(location.search).get('pedido');
    if (id) await desdePedido(id);
    pintarItems();
    void rem;
  }

  async function desdePedido(id) {
    const r = await cliente().from('pedidos').select('*').eq('id', id).single();
    if (r.error || !r.data) { toast('No encontré ese pedido'); return; }
    const p = r.data; PEDIDO_ID = p.id;
    form.cliente.value = p.cliente; form.celular.value = (p.celular || '').replace(/^57/, '');
    form.envio.value = p.envio || ''; form.nota.value = p.nota || '';
    form.pago.value = p.items.some((i) => i.id === ID_RECARGO) ? PAGOS[1] : PAGOS[0];
    ITEMS = p.items.map((i) => i.id === ID_RECARGO
      ? { nombre: `Recargo pago con tarjeta (${RECARGO_LINK} %)`, cantidad: 1, precio: i.precio, serial: '', garantia: '' }
      : { nombre: i.nombre, cantidad: i.cantidad || 1, precio: i.precio, serial: '', garantia: GARANTIA(i.nombre) });
    toast(`Datos del pedido de ${p.cliente} cargados: agrega seriales y documento`);
  }

  /* productos de la remisión */
  function pintarItems() {
    $('#remItems').innerHTML = ITEMS.length ? ITEMS.map((i, k) => `<li data-k="${k}">
        <label class="w2">Producto<input data-f="nombre" value="${esc(i.nombre)}" /></label>
        <label>Serial<input data-f="serial" value="${esc(i.serial)}" placeholder="S/N" autocapitalize="characters" /></label>
        <label>Garantía<input data-f="garantia" value="${esc(i.garantia)}" placeholder="12 meses" list="dlGar" /></label>
        <label>Cant.<input data-f="cantidad" inputMode="numeric" value="${i.cantidad}" /></label>
        <label>Valor unit.<input data-f="precio" inputMode="numeric" value="${i.precio ? Number(i.precio).toLocaleString('es-CO') : ''}" /></label>
        <button class="btn btn--ghost btn--sm edp__del" type="button" data-quitar="${k}" aria-label="Quitar">Quitar</button>
      </li>`).join('') : '<li class="cobro__vacio">Agrega productos: búscalos arriba o usa «Línea a mano».</li>';
    pintarTotal();
  }
  function pintarTotal() {
    $('#remTotal').textContent = ITEMS.length ? `Total: ${pesos(totalDe(ITEMS, num(form.envio.value)))}` : '';
  }
  function agregar() {
    const q = $('#remProd').value.trim(); if (!q) return;
    const p = PRODUCTOS.find((x) => etiqueta(x) === q)
      || PRODUCTOS.find((x) => sinTildes(etiqueta(x).toLowerCase()).includes(sinTildes(q.toLowerCase())));
    const nombre = p ? etiqueta(p) : q;
    ITEMS.push({ nombre, cantidad: 1, precio: p?.precio || 0, serial: '', garantia: GARANTIA(nombre) });
    $('#remProd').value = ''; pintarItems();
    $(`#remItems li[data-k="${ITEMS.length - 1}"] [data-f="serial"]`)?.focus();
  }
  on($('#remAdd'), 'click', agregar);
  on($('#remProd'), 'keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } });
  on($('#remMano'), 'click', () => { ITEMS.push({ nombre: '', cantidad: 1, precio: 0, serial: '', garantia: '12 meses' }); pintarItems(); $(`#remItems li[data-k="${ITEMS.length - 1}"] [data-f="nombre"]`)?.focus(); });
  on($('#remItems'), 'input', (e) => {
    const f = e.target.dataset.f; const li = e.target.closest('li[data-k]'); if (!f || !li) return;
    const it = ITEMS[+li.dataset.k];
    it[f] = f === 'cantidad' ? Math.max(1, num(e.target.value)) : f === 'precio' ? num(e.target.value) : e.target.value;
    pintarTotal();
  });
  on($('#remItems'), 'click', (e) => { const b = e.target.closest('[data-quitar]'); if (b) { ITEMS.splice(+b.dataset.quitar, 1); pintarItems(); } });
  on(form, 'input', (e) => { if (e.target.name === 'envio') pintarTotal(); });

  /* guardar */
  on(form, 'submit', async (e) => {
    e.preventDefault();
    const items = ITEMS.filter((i) => i.nombre.trim()).map((i) => ({ ...i, nombre: i.nombre.trim(), serial: i.serial.trim().toUpperCase(), garantia: i.garantia.trim() }));
    if (!items.length) return toast('Agrega al menos un producto');
    const fila = {
      fecha: form.fecha.value || hoy(), cliente: form.cliente.value.trim(), documento: form.documento.value.trim(),
      celular: form.celular.value.trim(), direccion: form.direccion.value.trim(), ciudad: form.ciudad.value.trim(),
      pago: form.pago.value, nota: form.nota.value.trim(), envio: num(form.envio.value), items,
      total: totalDe(items, num(form.envio.value)), ...(PEDIDO_ID ? { pedido_id: PEDIDO_ID } : {}),
    };
    const b = form.querySelector('[type=submit]'); b.disabled = true;
    const r = await cliente().from('remisiones').insert(fila).select().single();
    b.disabled = false;
    if (r.error) return toast(/relation|does not exist|schema cache/i.test(r.error.message) ? 'Primero corre supabase/08-remisiones.sql en Supabase' : r.error.message);
    LISTA.unshift(r.data); pintarLista();
    mostrar(r.data);
    form.reset(); form.fecha.value = hoy(); ITEMS = []; PEDIDO_ID = null; pintarItems();
    history.replaceState(null, '', location.pathname);
    toast(`${codigo(r.data.numero)} guardada`);
  });

  /* ver / descargar / enviar */
  function mostrar(r) {
    ACTUAL = r;
    $('#remDoc').innerHTML = documento(r, logo());
    $('#remVista').hidden = false;
    $('#remAnular').hidden = r.anulada;
    $('#remVista').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  on($('#remPdf'), 'click', () => {
    if (!ACTUAL) return;
    const t = document.title;
    document.title = `Remision ${codigo(ACTUAL.numero)} ${ACTUAL.cliente}`;   // nombre del PDF
    // se imprime una copia suelta del documento, sin el resto de la página
    const hoja = document.createElement('div'); hoja.id = 'remPrint'; hoja.innerHTML = documento(ACTUAL, logo());
    document.body.appendChild(hoja); document.body.classList.add('imprime-remision');
    const limpiar = () => { hoja.remove(); document.body.classList.remove('imprime-remision'); document.title = t; window.removeEventListener('afterprint', limpiar); };
    window.addEventListener('afterprint', limpiar);
    window.print();
    setTimeout(limpiar, 60000);   // por si el navegador no avisa al terminar
  });
  on($('#remWa'), 'click', () => {
    if (!ACTUAL) return;
    const tel = celularIntl(ACTUAL.celular);
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(mensajeRemision(ACTUAL))}`, '_blank', 'noopener');
  });
  on($('#remCopiar'), 'click', async () => { if (ACTUAL) { await navigator.clipboard.writeText(mensajeRemision(ACTUAL)); toast('Mensaje copiado'); } });
  on($('#remAnular'), 'click', async (e) => {
    const b = e.currentTarget;
    if (!b.dataset.seguro) { b.dataset.seguro = '1'; b.textContent = '¿Seguro? Toca otra vez'; return; }
    delete b.dataset.seguro; b.textContent = 'Anular';
    const r = await cliente().from('remisiones').update({ anulada: true }).eq('id', ACTUAL.id);
    if (r.error) return toast(r.error.message);
    ACTUAL.anulada = true; mostrar(ACTUAL); pintarLista(); toast(`${codigo(ACTUAL.numero)} anulada`);
  });
  on($('#remCerrar'), 'click', () => { $('#remVista').hidden = true; ACTUAL = null; });

  /* lista y búsqueda (por cliente, número o serial) */
  async function cargarLista() {
    const r = await cliente().from('remisiones').select('*').order('creada', { ascending: false }).limit(200);
    if (r.error) {
      $('#remList').innerHTML = `<li style="display:block;color:#b00020">${/relation|does not exist|schema cache/i.test(r.error.message) ? 'Para usar remisiones, primero corre supabase/08-remisiones.sql en Supabase.' : esc(r.error.message)}</li>`;
      return;
    }
    LISTA = r.data; pintarLista();
  }
  function pintarLista() {
    const q = sinTildes($('#remBuscar').value.trim().toLowerCase());
    const ver = LISTA.filter((r) => !q || sinTildes(`${codigo(r.numero)} ${r.cliente} ${r.documento} ${r.items.map((i) => i.serial + ' ' + i.nombre).join(' ')}`.toLowerCase()).includes(q));
    $('#remList').innerHTML = ver.slice(0, 40).map((r) => `<li class="ped${r.anulada ? ' ped--anulado' : ''}">
        <p class="photos__n"><small>${esc(codigo(r.numero))} · ${esc(fechaLarga(r.fecha))}${r.anulada ? ' · <b>Anulada</b>' : ''}</small>${esc(r.cliente)} — ${pesos(r.total)}
          <small>${esc(r.items.map((i) => i.nombre + (i.serial ? ` (S/N ${i.serial})` : '')).join(', '))}</small></p>
        <div class="photos__act"><button class="btn btn--ghost btn--sm" type="button" data-ver="${esc(r.id)}">Ver</button></div>
      </li>`).join('') || `<li style="display:block;color:#777">${q ? 'Nada con esa búsqueda.' : 'Todavía no hay remisiones.'}</li>`;
  }
  on($('#remBuscar'), 'input', pintarLista);
  on($('#remList'), 'click', (e) => { const b = e.target.closest('[data-ver]'); if (b) mostrar(LISTA.find((r) => r.id === b.dataset.ver)); });

  iniciar();
  return () => off.forEach((f) => f());
}
