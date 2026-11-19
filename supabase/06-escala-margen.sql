-- ============================================================
-- WOLFTECH · Margen según el costo (escala) + ganancia mínima
-- Cómo usarlo: Supabase → SQL Editor → New query → pega todo → Run.
-- Se puede correr más de una vez. Incluye lo de 03 y 04.
--
-- La escala y la ganancia mínima se guardan desde el admin dentro de
-- ajustes.margenes como "_escala" ([[hasta, %], …, [null, %]]) y "_ganancia_min".
-- La ganancia mínima solo aplica a productos de costo ≥ $20.000.
-- Prioridad del margen: precio fijo → margen de la categoría → escala → margen base.
-- Debe coincidir con calcularPrecio() en lib/catalogo.js.
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
  select coalesce(
    nullif(a.margenes ->> p.categoria, '')::numeric,                       -- margen propio de la categoría
    (select (e ->> 1)::numeric                                             -- franja de la escala
       from jsonb_array_elements(case when jsonb_typeof(a.margenes -> '_escala') = 'array'
                                      then a.margenes -> '_escala' else '[]'::jsonb end) with ordinality as t(e, n)
      where jsonb_typeof(e -> 0) = 'null' or p.costo <= (e ->> 0)::numeric
      order by n limit 1),
    a.margen_base
  ) as m
) mg
cross join lateral (
  select greatest(
    p.costo * (1 + mg.m / 100),
    case when p.costo >= 20000                                             -- no aplica a consumibles baratos
         then p.costo + coalesce((a.margenes ->> '_ganancia_min')::numeric, 0) -- nunca ganar menos de esto
         else 0 end
  ) as bruto
) v
where p.estado <> 'oculto';

grant select on public.catalogo to anon, authenticated;
