-- ============================================================
-- WOLFTECH · Esconder el costo del proveedor y los márgenes
-- Cómo usarlo: Supabase → SQL Editor → New query → pega todo → Run.
-- Se puede correr más de una vez sin dañar nada.
--
-- Qué hace:
--  · Los clientes (anon) ya NO pueden leer costo, proveedor, ref ni márgenes.
--  · El precio al público lo calcula la base de datos en la vista "catalogo".
--  · El panel del administrador sigue viendo y editando todo igual.
-- ============================================================

-- 1) Vista pública: solo lo que ve el cliente, con el precio ya calculado
create or replace view public.catalogo as
select
  p.id, p.orden, p.categoria, p.marca, p.nombre, p.estado, p.actualizado,
  case
    when p.costo = 0 or p.estado = 'transito' then null
    when a.redondeo then
      (ceil(p.costo * (1 + coalesce((a.margenes ->> p.categoria)::numeric, a.margen_base) / 100) / 10000) * 10000 - 100)::integer
    else
      (ceil(p.costo * (1 + coalesce((a.margenes ->> p.categoria)::numeric, a.margen_base) / 100) / 100) * 100)::integer
  end as precio
from public.productos p
cross join (
  select coalesce(max(margen_base), 15) as margen_base,
         coalesce((array_agg(margenes))[1], '{}'::jsonb) as margenes,
         coalesce(bool_or(redondeo), true) as redondeo
  from public.ajustes where id = 1
) a
where p.estado <> 'oculto';

grant select on public.catalogo to anon, authenticated;

-- 2) Los clientes solo pueden leer estas columnas de productos (sin costo, proveedor ni ref)
revoke select on public.productos from anon;
grant select (id, orden, categoria, marca, nombre, estado, actualizado) on public.productos to anon;

-- 3) De los ajustes, los clientes solo ven la fecha de la lista (no los márgenes)
revoke select on public.ajustes from anon;
grant select (id, fecha_lista) on public.ajustes to anon;

-- El administrador (authenticated + es_admin) sigue con acceso completo:
grant select, insert, update, delete on public.productos, public.ajustes to authenticated;
