-- ============================================================
-- WOLFTECH · Remisiones (constancia de entrega)
-- Cómo usarlo: Supabase → SQL Editor → New query → pega todo → Run.
-- Se puede correr más de una vez sin dañar nada.
--
-- Guarda cada remisión que haces en /admin/remision: cliente, productos
-- con su serial y garantía, forma de pago y total. Sirve para
-- reimprimirla o buscar el serial cuando alguien reclame garantía.
-- Solo los administradores la ven.
-- ============================================================

create sequence if not exists public.remisiones_numero;

create table if not exists public.remisiones (
  id         uuid primary key default gen_random_uuid(),
  numero     integer not null unique default nextval('public.remisiones_numero'),
  creada     timestamptz not null default now(),
  fecha      date not null default current_date,
  cliente    text not null,
  documento  text not null default '',
  celular    text not null default '',
  direccion  text not null default '',
  ciudad     text not null default '',
  items      jsonb not null default '[]',   -- [{nombre, cantidad, precio, serial, garantia}]
  envio      integer not null default 0,
  total      integer not null default 0,
  pago       text not null default '',
  nota       text not null default '',
  pedido_id  uuid references public.pedidos (id) on delete set null,
  anulada    boolean not null default false
);
alter sequence public.remisiones_numero owned by public.remisiones.numero;

create index if not exists remisiones_creada on public.remisiones (creada desc);
-- para buscar rápido por serial cuando alguien reclama garantía
create index if not exists remisiones_items on public.remisiones using gin (items jsonb_path_ops);

alter table public.remisiones enable row level security;
revoke all on public.remisiones from anon;
grant select, insert, update on public.remisiones to authenticated;
grant usage on sequence public.remisiones_numero to authenticated;

drop policy if exists "admin ve remisiones" on public.remisiones;
create policy "admin ve remisiones" on public.remisiones
  for select to authenticated using (public.es_admin());
drop policy if exists "admin crea remisiones" on public.remisiones;
create policy "admin crea remisiones" on public.remisiones
  for insert to authenticated with check (public.es_admin());
drop policy if exists "admin edita remisiones" on public.remisiones;
create policy "admin edita remisiones" on public.remisiones
  for update to authenticated using (public.es_admin()) with check (public.es_admin());
-- no se borran: si una sale mal se marca «anulada» (así no se repiten números)
