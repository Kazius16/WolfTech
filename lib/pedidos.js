/* ============================================================
   PEDIDOS Y LINKS DE PAGO (parte del panel /admin)
   1. Armas el pedido: cliente, productos (precio al público), envío.
   2. «Crear link de pago» lo guarda en Supabase (tabla pedidos)
      y le pide a Bold el link (vía /api/cobro, la llave está en Vercel).
   3. Le mandas el link al cliente por WhatsApp y luego revisas si pagó.
   ============================================================ */
import { pesos, sinTildes } from './util';
import { RECARGO_LINK } from './config';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ESTADOS = { pendiente: 'Esperando pago', pagado: 'Pagado', entregado: 'Entregado', anulado: 'Anulado' };
const BOLD_A_ESTADO = { PAID: 'pagado' };
const TXT_BOLD = { ACTIVE: 'aún sin pagar', PROCESSING: 'pago en proceso', PAID: 'PAGADO', REJECTED: 'pago rechazado', CANCELLED: 'pago cancelado', EXPIRED: 'link vencido' };

// 3001234567 / +57 300 123 4567 → 573001234567
export const celularIntl = (c) => { const d = String(c || '').replace(/\D/g, ''); return d.length === 10 ? '57' + d : d; };

// el recargo va como una línea más del pedido para que quede registrado
export const ID_RECARGO = 'recargo-link';
export const recargoDe = (subtotal) => Math.ceil((subtotal * RECARGO_LINK) / 100 / 100) * 100;

export function mensajeCobro(p) {
  const prods = p.items.filter((i) => i.id !== ID_RECARGO);
  const rec = p.items.find((i) => i.id === ID_RECARGO);
  const lineas = prods.map((i) => `• ${i.cantidad > 1 ? i.cantidad + ' x ' : ''}${i.nombre} — ${pesos(i.precio * i.cantidad)}`);
  if (p.envio) lineas.push(`• Envío — ${pesos(p.envio)}`);
  const pago = rec
    ? `*Transferencia (Bre-B, Nequi o banco): ${pesos(p.total - rec.precio)}* (sin recargo)\n*Tarjeta débito o crédito: ${pesos(p.total)}* (incluye ${RECARGO_LINK} % de la plataforma de pago; con crédito puedes diferir a cuotas)\n\nLink para pagar con tarjeta:\n${p.link_url}\n\nSi prefieres transferencia, avísame y te paso los datos.`
    : `*Total: ${pesos(p.total)}*\n\nLink para pagar con tarjeta, PSE o Nequi:\n${p.link_url}`;
  return `Hola ${p.cliente.split(' ')[0]}, este es tu pedido en WolfTech:\n\n${lineas.join('\n')}\n\n${pago}\n\nApenas se confirme el pago recogemos tu pedido, lo revisamos y te avisamos. 🐺`;
}

export function montarPedidos(root, { toast, cliente, productos }) {
  const $ = (s) => root.querySelector(s);
  const off = [];
  const on = (el, ev, fn) => { el.addEventListener(ev, fn); off.push(() => el.removeEventListener(ev, fn)); };
  let ITEMS = [], PEDIDOS = [];

  async function token() { const { data } = await cliente().auth.getSession(); return data.session?.access_token || ''; }
  async function api(metodo, q = '', body) {
    const r = await fetch('/api/cobro' + q, {
      method: metodo,
      headers: { Authorization: 'Bearer ' + (await token()), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const d = await r.json().catch(() => ({ ok: false, error: 'Respuesta inválida del servidor' }));
    if (!d.ok) throw new Error(d.error || 'Error ' + r.status);
    return d;
  }

  /* ---------- armar el pedido ---------- */
  const etiqueta = (p) => `${p.marca} ${p.nombre} — ${p.precio ? pesos(p.precio) : 'consultar'}`;
  function pintarOpciones() {
    $('#dlCobro').innerHTML = productos().filter((p) => p.estado !== 'oculto').map((p) => `<option value="${esc(etiqueta(p))}"></option>`).join('');
  }
  const subtotal = () => ITEMS.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const envio = () => parseInt(($('#cobro').envio.value || '').replace(/\D/g, ''), 10) || 0;
  const recargo = () => ($('#cobroRecargo').checked ? recargoDe(subtotal() + envio()) : 0);
  const total = () => subtotal() + envio() + recargo();
  const textoTotal = () => recargo()
    ? `Transferencia: ${pesos(total() - recargo())} · Link con tarjeta: ${pesos(total())} (+${pesos(recargo())})`
    : 'Total a cobrar: ' + pesos(total());
  function pintarItems() {
    $('#cobroItems').innerHTML = ITEMS.map((i, k) => `<li>
      <span class="cobro__n">${esc(i.nombre)}</span>
      <label>Cant.<input type="number" min="1" value="${i.cantidad}" data-cant="${k}"></label>
      <label>Precio c/u<input inputmode="numeric" value="${i.precio}" data-pre="${k}"></label>
      <button class="btn btn--ghost btn--sm" type="button" data-quitar="${k}">Quitar</button>
    </li>`).join('') || '<li class="cobro__vacio">Agrega al menos un producto.</li>';
    $('#cobroTotal').textContent = textoTotal();
  }
  function agregar() {
    const v = $('#cobroProd').value.trim(); if (!v) return;
    const p = productos().find((x) => etiqueta(x) === v)
      || productos().find((x) => sinTildes(`${x.marca} ${x.nombre}`.toLowerCase()) === sinTildes(v.toLowerCase()));
    if (!p) { toast('Elige el producto de la lista que aparece al escribir'); return; }
    if (!p.precio) toast('Ese producto no tiene precio: escríbelo tú en «Precio c/u»');
    const ya = ITEMS.find((i) => i.id === p.id);
    if (ya) ya.cantidad++; else ITEMS.push({ id: p.id, nombre: `${p.marca} ${p.nombre}`, cantidad: 1, precio: p.precio || 0 });
    $('#cobroProd').value = ''; pintarItems();
  }
  on($('#cobroAdd'), 'click', agregar);
  on($('#cobroProd'), 'keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } });
  on($('#cobroProd'), 'change', agregar);
  on($('#cobroItems'), 'input', (e) => {
    const t = e.target, n = parseInt(t.value.replace(/\D/g, ''), 10) || 0;
    if (t.dataset.cant) ITEMS[t.dataset.cant].cantidad = Math.max(1, n);
    if (t.dataset.pre) ITEMS[t.dataset.pre].precio = n;
    $('#cobroTotal').textContent = textoTotal();
  });
  on($('#cobroItems'), 'click', (e) => { const b = e.target.closest('[data-quitar]'); if (b) { ITEMS.splice(+b.dataset.quitar, 1); pintarItems(); } });
  on($('#cobro').envio, 'input', () => { $('#cobroTotal').textContent = textoTotal(); });
  on($('#cobroRecargo'), 'change', () => { $('#cobroTotal').textContent = textoTotal(); });

  on($('#cobro'), 'submit', async (e) => {
    e.preventDefault();
    const f = e.target, b = f.querySelector('[type=submit]');
    const ped = {
      cliente: f.cliente.value.trim(), celular: celularIntl(f.celular.value),
      items: [...ITEMS.map((i) => ({ ...i })), ...(recargo() ? [{ id: ID_RECARGO, nombre: `Recargo pago con link (${RECARGO_LINK} %)`, cantidad: 1, precio: recargo() }] : [])], envio: parseInt((f.envio.value || '').replace(/\D/g, ''), 10) || 0, nota: f.nota.value.trim(),
    };
    ped.total = total();
    if (!ped.cliente) { toast('Falta el nombre del cliente'); return; }
    if (!ITEMS.length) { toast('Agrega al menos un producto'); return; }
    if (ped.items.some((i) => !i.precio)) { toast('Hay un producto sin precio'); return; }
    if (ped.total < 1000) { toast('El total es muy bajo'); return; }
    b.disabled = true; b.textContent = 'Creando link…';
    try {
      const c = cliente();
      const ins = await c.from('pedidos').insert({ cliente: ped.cliente, celular: ped.celular, items: ped.items, envio: ped.envio, total: ped.total, nota: ped.nota }).select().single();
      if (ins.error) throw new Error(/relation|does not exist|schema cache/i.test(ins.error.message) ? 'Primero corre supabase/05-pedidos.sql en Supabase' : ins.error.message);
      const p = ins.data;
      const prods = ped.items.filter((i) => i.id !== ID_RECARGO);
      const descripcion = prods.length === 1 ? prods[0].nombre : `${prods[0].nombre} y ${prods.length - 1} más`;
      const ref = 'WT-' + p.id.slice(0, 8) + '-' + Date.now().toString(36);
      let link;
      try { link = await api('POST', '', { total: ped.total, descripcion, referencia: ref }); }
      catch (err) { await c.from('pedidos').delete().eq('id', p.id); throw err; }
      const up = await c.from('pedidos').update({ link_id: link.link, link_url: link.url }).eq('id', p.id).select().single();
      if (up.error) throw new Error(up.error.message);
      ITEMS = []; f.reset(); $('#cobroRecargo').checked = true; pintarItems();
      mostrarListo(up.data);
      await cargarPedidos();
    } catch (err) { toast(err.message); }
    b.disabled = false; b.textContent = 'Crear link de pago';
  });

  function mostrarListo(p) {
    const wa = p.celular ? `https://wa.me/${p.celular}?text=${encodeURIComponent(mensajeCobro(p))}` : '';
    $('#cobroOut').innerHTML = `<div class="cobro__ok">
      <p><b>Link listo para ${esc(p.cliente)} · ${pesos(p.total)}</b></p>
      <p class="mono cobro__url">${esc(p.link_url)}</p>
      <div class="addp__btns edp__btns">
        ${wa ? `<a class="btn btn--solid btn--sm" href="${esc(wa)}" target="_blank" rel="noopener">Enviar por WhatsApp</a>` : ''}
        <button class="btn btn--ghost btn--sm" type="button" data-copiar="${esc(p.id)}">Copiar mensaje</button>
      </div></div>`;
  }

  /* ---------- pedidos recientes ---------- */
  async function cargarPedidos() {
    const r = await cliente().from('pedidos').select('*').order('creado', { ascending: false }).limit(30);
    if (r.error) {
      $('#pedList').innerHTML = `<li style="display:block;color:#b00020">${/relation|does not exist|schema cache/i.test(r.error.message) ? 'Para usar pedidos, primero corre supabase/05-pedidos.sql en Supabase.' : esc(r.error.message)}</li>`;
      return;
    }
    PEDIDOS = r.data; pintarPedidos();
  }
  function pintarPedidos() {
    $('#pedList').innerHTML = PEDIDOS.map((p) => {
      const fecha = new Date(p.creado).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
      const prods = p.items.map((i) => `${i.cantidad > 1 ? i.cantidad + ' x ' : ''}${i.nombre}`).join(', ');
      return `<li class="ped ped--${p.estado}">
        <p class="photos__n"><small>${esc(fecha)} · <b class="ped__e">${esc(ESTADOS[p.estado] || p.estado)}</b>${p.celular ? ' · ' + esc(p.celular.replace(/^57/, '')) : ''}</small>${esc(p.cliente)} — ${pesos(p.total)}
          <small>${esc(prods)}${p.envio ? ' + envío ' + pesos(p.envio) : ''}${p.nota ? ' · ' + esc(p.nota) : ''}</small></p>
        <div class="photos__act">
          ${p.estado === 'pendiente' && p.link_id ? `<button class="btn btn--ghost btn--sm" type="button" data-revisar="${esc(p.id)}">¿Ya pagó?</button>` : ''}
          ${p.link_url && p.estado === 'pendiente' ? `<button class="btn btn--ghost btn--sm" type="button" data-copiar="${esc(p.id)}">Copiar mensaje</button>` : ''}
          ${p.estado === 'pendiente' || p.estado === 'pagado' ? `<button class="btn btn--ghost btn--sm" type="button" data-estado="${esc(p.id)}" data-a="${p.estado === 'pendiente' ? 'pagado' : 'entregado'}">${p.estado === 'pendiente' ? 'Marcar pagado' : 'Marcar entregado'}</button>` : ''}
          ${p.estado === 'pendiente' ? `<button class="btn btn--ghost btn--sm edp__del" type="button" data-estado="${esc(p.id)}" data-a="anulado">Anular</button>` : ''}
        </div>
      </li>`;
    }).join('') || '<li style="display:block;color:#777">Todavía no hay pedidos.</li>';
  }
  async function cambiarEstado(p, estado) {
    const cambios = { estado, ...(estado === 'pagado' ? { pagado: new Date().toISOString() } : {}) };
    const r = await cliente().from('pedidos').update(cambios).eq('id', p.id);
    if (r.error) throw new Error(r.error.message);
    Object.assign(p, cambios); pintarPedidos();
  }
  on(root, 'click', async (e) => {
    const b = e.target.closest('[data-revisar],[data-copiar],[data-estado]'); if (!b || !root.contains(b)) return;
    const id = b.dataset.revisar || b.dataset.copiar || b.dataset.estado;
    const p = PEDIDOS.find((x) => x.id === id); if (!p) return;
    try {
      if (b.dataset.copiar) { await navigator.clipboard.writeText(mensajeCobro(p)); toast('Mensaje copiado'); }
      else if (b.dataset.revisar) {
        b.disabled = true;
        const s = await api('GET', '?link=' + encodeURIComponent(p.link_id));
        toast(`${p.cliente}: ${TXT_BOLD[s.estado] || s.estado}`);
        if (BOLD_A_ESTADO[s.estado]) await cambiarEstado(p, BOLD_A_ESTADO[s.estado]);
        b.disabled = false;
      } else if (b.dataset.estado) {
        if (b.dataset.a === 'anulado' && !b.dataset.seguro) { b.dataset.seguro = '1'; b.textContent = '¿Seguro?'; return; }
        await cambiarEstado(p, b.dataset.a);
        toast(`${p.cliente}: ${ESTADOS[b.dataset.a]}`);
      }
    } catch (err) { toast(err.message); b.disabled = false; }
  });

  return {
    pintar() { pintarOpciones(); pintarItems(); cargarPedidos(); },
    desmontar() { off.forEach((f) => f()); },
  };
}
