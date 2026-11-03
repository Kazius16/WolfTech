/* ============================================================
   POST /api/revalidar
   El panel lo llama después de guardar, para que las páginas
   muestren los cambios de una vez (sin esperar 5 minutos).
   Solo funciona con la sesión de un administrador.
   ============================================================ */
import { revalidatePath, revalidateTag } from 'next/cache';
import { SUPABASE_KEY, SUPABASE_URL } from '@/lib/config';

export async function POST(req) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return Response.json({ ok: false, error: 'Falta la sesión' }, { status: 401 });
  // Supabase responde si ese usuario es administrador (misma regla que protege la base de datos)
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/es_admin`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}',
    cache: 'no-store',
  });
  const esAdmin = r.ok && (await r.json()) === true;
  if (!esAdmin) return Response.json({ ok: false, error: 'Sin permiso' }, { status: 403 });
  revalidateTag('catalogo', { expire: 0 });   // datos de Supabase
  revalidatePath('/', 'layout');              // todas las páginas
  return Response.json({ ok: true });
}
