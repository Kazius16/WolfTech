-- ============================================================
-- WOLFTECH · Precio de venta fijo por producto
-- Cómo usarlo: Supabase → SQL Editor → New query → pega todo → Run.
-- Se puede correr más de una vez sin dañar nada. Incluye el redondeo del 03.
--
-- Agrega la columna "precio_fijo" a productos. Si un producto la tiene,
-- ese es su precio al público y se ignora el margen. Vacía = costo + margen.
-- El precio fijo NO cambia cuando el proveedor sube el costo: revísalo.
-- ============================================================

alter table public.productos add column if not exists precio_fijo integer;

create or replace view public.catalogo as
select
  p.id, p.orden, p.categoria, p.marca, p.nombre, p.estado, p.actualizado,
  case
    when p.estado = 'transito' then null
    when coalesce(p.precio_fijo, 0) > 0 then p.precio_fijo
    when p.costo = 0 then null
    when a.redondeo then
      case
        when v.bruto < 10000  then (ceil(v.bruto / 100) * 100)::integer
        when v.bruto < 100000 then (ceil(v.bruto / 1000) * 1000 - 100)::integer
        else (ceil(v.bruto / 10000) * 10000 - 100)::integer
      end
    else (ceil(v.bruto / 100) * 100)::integer
  end as precio
from public.productos p
cross join (
  select coalesce(max(margen_base), 15) as margen_base,
         coalesce((array_agg(margenes))[1], '{}'::jsonb) as margenes,
         coalesce(bool_or(redondeo), true) as redondeo
  from public.ajustes where id = 1
) a
cross join lateral (
  select p.costo * (1 + coalesce((a.margenes ->> p.categoria)::numeric, a.margen_base) / 100) as bruto
) v
where p.estado <> 'oculto';

grant select on public.catalogo to anon, authenticated;
-- el precio fijo es público de todas formas (es el precio de venta); el costo sigue oculto
