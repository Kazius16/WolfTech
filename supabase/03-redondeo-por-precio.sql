-- ============================================================
-- WOLFTECH · Redondeo según el tamaño del precio
-- Cómo usarlo: Supabase → SQL Editor → New query → pega todo → Run.
-- Se puede correr más de una vez sin dañar nada.
--
-- Antes todo se redondeaba hacia arriba a …9.900, y en productos baratos eso
-- disparaba el precio (un rollo de papel de $2.500 quedaba en $9.900).
-- Ahora, con "redondeo" activo:
--   · menos de $10.000   → se sube a la centena          ($2.875  → $2.900)
--   · menos de $100.000  → termina en …900 de mil         ($81.600 → $81.900)
--   · $100.000 o más     → termina en …9.900, como antes  ($4.883.200 → $4.889.900)
-- Debe coincidir con redondear() en lib/catalogo.js.
-- ============================================================

create or replace view public.catalogo as
select
  p.id, p.orden, p.categoria, p.marca, p.nombre, p.estado, p.actualizado,
  case
    when p.costo = 0 or p.estado = 'transito' then null
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
