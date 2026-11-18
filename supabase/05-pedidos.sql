-- ============================================================
-- WOLFTECH · Pedidos y links de pago (Bold)
-- Cómo usarlo: Supabase → SQL Editor → New query → pega todo → Run.
-- Se puede correr más de una vez sin dañar nada.
--
-- Guarda cada pedido que cobras desde el admin: cliente, productos,
-- total y el link de pago de Bold. Solo los administradores lo ven:
-- los clientes de la tienda no tienen ningún acceso a esta tabla.
-- ============================================================

create table if not exists public.pedidos (
  id          uuid primary key default gen_random_uuid(),
  creado      timestamptz not null default now(),
  cliente     text not null,
  celular     text not null default '',
  items       jsonb not null default '[]',   -- [{id, nombre, cantidad, precio}]
  envio       integer not null default 0,
  total       integer not null,
  nota        text not null default '',
  estado      text not null default 'pendiente'
              check (estado in ('pendiente', 'pagado', 'entregado', 'anulado')),
  link_id     text,                           -- LNK_… de Bold
  link_url    text,
  pagado      timestamptz
);

create index if not exists pedidos_creado on public.pedidos (creado desc);

alter table public.pedidos enable row level security;
revoke all on public.pedidos from anon;
grant select, insert, update, delete on public.pedidos to authenticated;

drop policy if exists "admin ve pedidos" on public.pedidos;
create policy "admin ve pedidos" on public.pedidos
  for select to authenticated using (public.es_admin());
drop policy if exists "admin crea pedidos" on public.pedidos;
create policy "admin crea pedidos" on public.pedidos
  for insert to authenticated with check (public.es_admin());
drop policy if exists "admin edita pedidos" on public.pedidos;
create policy "admin edita pedidos" on public.pedidos
  for update to authenticated using (public.es_admin()) with check (public.es_admin());
drop policy if exists "admin borra pedidos" on public.pedidos;
create policy "admin borra pedidos" on public.pedidos
  for delete to authenticated using (public.es_admin());
