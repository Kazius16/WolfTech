-- ============================================================
-- WOLFTECH · Fecha en que se agregó cada producto (para "Novedades")
-- Cómo usarlo: Supabase → SQL Editor → New query → pega todo → Run.
-- Se puede correr más de una vez sin dañar nada.
-- ============================================================

-- 1) Nueva columna: cuándo se agregó el producto.
--    Los productos nuevos la llenan solos; los que ya existían quedan con la fecha de la primera lista.
alter table public.productos add column if not exists creado timestamptz;
update public.productos set creado = '2026-10-27' where creado is null;
alter table public.productos alter column creado set default now();

-- 2) La vista pública ahora también muestra esa fecha (al final, para no romper nada)
create or replace view public.catalogo as
select
  p.id, p.orden, p.categoria, p.marca, p.nombre, p.estado, p.actualizado,
  case
    when p.costo = 0 or p.estado = 'transito' then null
    when a.redondeo then
      (ceil(p.costo * (1 + coalesce((a.margenes ->> p.categoria)::numeric, a.margen_base) / 100) / 10000) * 10000 - 100)::integer
    else
      (ceil(p.costo * (1 + coalesce((a.margenes ->> p.categoria)::numeric, a.margen_base) / 100) / 100) * 100)::integer
  end as precio,
  p.creado
from public.productos p
cross join (
  select coalesce(max(margen_base), 15) as margen_base,
         coalesce((array_agg(margenes))[1], '{}'::jsonb) as margenes,
         coalesce(bool_or(redondeo), true) as redondeo
  from public.ajustes where id = 1
) a
where p.estado <> 'oculto';

grant select on public.catalogo to anon, authenticated;
grant select (creado) on public.productos to anon;
