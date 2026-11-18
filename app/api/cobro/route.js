/* ============================================================
   /api/cobro — links de pago de Bold (solo administradores)
   POST { total, descripcion, referencia }  → crea el link
   GET  ?link=LNK_xxx                        → estado del link
   La llave de Bold vive SOLO en Vercel (variable BOLD_API_KEY),
   nunca en el código ni en el navegador.
   Documentación: developers.bold.co → API Link de pagos
   ============================================================ */
import { SITIO, SUPABASE_KEY, SUPABASE_URL } from '@/lib/config';

const BOLD = 'https://integrations.api.bold.co/online/link/v1';

async function esAdmin(req) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/es_admin`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}', cache: 'no-store',
  });
  return r.ok && (await r.json()) === true;
}

function llave() {
  const k = process.env.BOLD_API_KEY;
  if (!k) throw new Error('Falta configurar BOLD_API_KEY en Vercel (llave de identidad de Bold)');
  return k;
}

const error = (msg, status = 400) => Response.json({ ok: false, error: msg }, { status });

export async function POST(req) {
  if (!(await esAdmin(req))) return error('Sin permiso', 403);
  let body; try { body = await req.json(); } catch { return error('Pedido inválido'); }
  const total = Math.round(Number(body.total));
  if (!Number.isFinite(total) || total < 1000) return error('El total debe ser de al menos $1.000');
  const descripcion = String(body.descripcion || 'Pedido WolfTech').replace(/\s+/g, ' ').trim().slice(0, 100).padEnd(2, '.');
  const referencia = String(body.referencia || '').replace(/[^\w-]/g, '').slice(0, 60) || undefined;
  try {
    const r = await fetch(BOLD, {
      method: 'POST',
      headers: { Authorization: `x-api-key ${llave()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount_type: 'CLOSE',
        amount: { currency: 'COP', total_amount: total, tip_amount: 0 },
        description: descripcion,
        reference: referencia,
        callback_url: SITIO + '/',
      }),
      cache: 'no-store',
    });
    const d = await r.json().catch(() => ({}));
    const link = d?.payload?.payment_link, url = d?.payload?.url;
    if (!r.ok || !link || !url) return error('Bold no creó el link: ' + (d?.errors?.map?.((e) => e.message || e).join(', ') || r.status), 502);
    if (!/^https:\/\/([a-z0-9-]+\.)*bold\.co\//i.test(url)) return error('Bold devolvió un link raro, no lo uses', 502);
    return Response.json({ ok: true, link, url });
  } catch (e) { return error(e.message, 500); }
}

export async function GET(req) {
  if (!(await esAdmin(req))) return error('Sin permiso', 403);
  const link = new URL(req.url).searchParams.get('link') || '';
  if (!/^LNK_[A-Za-z0-9]+$/.test(link)) return error('Link inválido');
  try {
    const r = await fetch(`${BOLD}/${link}`, { headers: { Authorization: `x-api-key ${llave()}` }, cache: 'no-store' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return error('Bold no respondió: ' + r.status, 502);
    return Response.json({ ok: true, estado: d.status, total: d.total, metodo: d.payment_method || null });
  } catch (e) { return error(e.message, 500); }
}
