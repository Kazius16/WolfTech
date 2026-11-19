-- ============================================================
-- WOLFTECH · Precio de mercado automático (robot semanal)
-- Cómo usarlo: Supabase → SQL Editor → New query → pega todo → Run.
-- Se puede correr más de una vez. Incluye lo de 03, 04 y 06.
--
-- Cada domingo el robot busca el precio más barato confiable (Alkosto,
-- Ktronix, Falabella, Éxito, Mercado Libre) y llama a
-- aplicar_precios_mercado(). La base de datos decide el precio:
--   objetivo = más barato del mercado − 3 %  (ajustes.margenes._mercado_desc)
--   piso     = costo + 12 %                  (ajustes.margenes._mercado_piso)
--              y nunca menos que costo + ganancia mínima (si costo ≥ $20.000)
--   • si el objetivo queda sobre el piso → ese es el precio (redondeado a …900)
--   • si no, pero el piso (redondeado) sigue debajo del mercado → el piso
--   • si ni así → «no compite»: se deja el precio normal y se avisa
-- El robot NUNCA ve costos y no puede poner precios por debajo del piso.
--
-- Prioridad del precio: precio fijo (tú, manual) → precio de mercado (robot,
-- solo si sigue sobre el piso con el costo de hoy) → margen normal (escala).
-- Debe coincidir con calcularPrecio() en lib/catalogo.js.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

alter table public.productos add column if not exists precio_fijo integer;
alter table public.productos add column if not exists precio_mercado integer;
alter table public.productos add column if not exists mercado_ref text;          -- «Alkosto $1.299.900»
alter table public.productos add column if not exists mercado_fecha timestamptz;

-- ---------- registro de cambios (solo lo ve el admin) ----------
create table if not exists public.cambios_precio (
  id bigint generated always as identity primary key,
  fecha timestamptz not null default now(),
  producto_id text not null,
  antes integer,
  despues integer,
  mercado integer,
  ref text,
  accion text not null          -- sube | baja | igual | no_compite | revisar | omitido
);
alter table public.cambios_precio enable row level security;
drop policy if exists cambios_admin on public.cambios_precio;
create policy cambios_admin on public.cambios_precio for select to authenticated using (public.es_admin());
revoke all on public.cambios_precio from anon;

-- ---------- llave del robot (solo se guarda su huella) ----------
create table if not exists public.robot_llave (
  id integer primary key default 1 check (id = 1),
  huella text not null,
  creada timestamptz not null default now()
);
alter table public.robot_llave enable row level security;   -- sin políticas: nadie la lee por la API
revoke all on public.robot_llave from anon, authenticated;

-- Genera una llave nueva (invalida la anterior). Se corre SOLO desde el SQL Editor:
--   select public.nueva_llave_robot();
-- y el resultado se pega en GitHub → Settings → Secrets → PRECIOS_LLAVE.
create or replace function public.nueva_llave_robot()
returns text language plpgsql security definer set search_path = public, extensions as $$
declare l text := 'wtr_' || encode(gen_random_bytes(24), 'hex');
begin
  insert into robot_llave (id, huella, creada) values (1, encode(digest(l, 'sha256'), 'hex'), now())
  on conflict (id) do update set huella = excluded.huella, creada = now();
  return l;
end $$;
revoke all on function public.nueva_llave_robot() from public, anon, authenticated;

-- ---------- reglas de precio (las usan la vista y el robot) ----------
-- redondeo hacia arriba (igual que redondear() en lib/catalogo.js)
create or replace function public.wt_redondear(v numeric, redondeo boolean default true)
returns integer language sql immutable as $$
  select case
    when not redondeo then (ceil(v / 100) * 100)::integer
    when v < 10000  then (ceil(v / 100) * 100)::integer
    when v < 100000 then (ceil(v / 1000) * 1000 - 100)::integer
    else (ceil(v / 10000) * 10000 - 100)::integer
  end $$;

-- redondeo hacia abajo a …900 / …9.900 (para quedar DEBAJO del mercado)
create or replace function public.wt_redondear_abajo(v numeric)
returns integer language sql immutable as $$
  select case
    when v < 10000  then (floor(v / 100) * 100)::integer
    when v < 100000 then (floor((v + 100) / 1000) * 1000 - 100)::integer
    else (floor((v + 100) / 10000) * 10000 - 100)::integer
  end $$;

-- piso de ganancia para el precio de mercado
create or replace function public.wt_piso_mercado(costo numeric, margenes jsonb)
returns numeric language sql immutable as $$
  select greatest(
    costo * (1 + coalesce((margenes ->> '_mercado_piso')::numeric, 12) / 100),
    case when costo >= 20000 then costo + coalesce((margenes ->> '_ganancia_min')::numeric, 0) else 0 end
  ) $$;

-- ---------- vista pública ----------
create or replace view public.catalogo as
select
  p.id, p.orden, p.categoria, p.marca, p.nombre, p.estado, p.actualizado,
  case
    when p.estado = 'transito' then null
    when coalesce(p.precio_fijo, 0) > 0 then p.precio_fijo
    when p.costo = 0 then null
    when coalesce(p.precio_mercado, 0) > 0
         and p.precio_mercado >= public.wt_piso_mercado(p.costo, a.margenes) then p.precio_mercado
    else public.wt_redondear(v.bruto, a.redondeo)
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
    case when p.costo >= 20000
         then p.costo + coalesce((a.margenes ->> '_ganancia_min')::numeric, 0)
         else 0 end
  ) as bruto
) v
where p.estado <> 'oculto';

grant select on public.catalogo to anon, authenticated;

-- ---------- lo que llama el robot ----------
-- cambios = [{"id": "...", "mercado": 1299900, "ref": "Alkosto $1.299.900"}, …]
-- "mercado" = el precio MÁS BARATO confiable del mismo producto nuevo.
create or replace function public.aplicar_precios_mercado(llave text, cambios jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  c jsonb; p record; aj record;
  mercado integer; objetivo integer; piso numeric; nuevo integer; antes integer; accion text;
  salida jsonb := '[]'::jsonb;
begin
  if llave is null or not exists (select 1 from robot_llave where huella = encode(digest(llave, 'sha256'), 'hex')) then
    raise exception 'Llave del robot inválida';
  end if;
  if jsonb_typeof(cambios) <> 'array' or jsonb_array_length(cambios) > 200 then
    raise exception 'Se espera una lista de máximo 200 productos';
  end if;
  select coalesce((array_agg(margenes))[1], '{}'::jsonb) as margenes into aj from ajustes where id = 1;

  for c in select * from jsonb_array_elements(cambios) loop
    select * into p from productos where id = c ->> 'id';
    mercado := nullif(regexp_replace(coalesce(c ->> 'mercado', ''), '[^0-9]', '', 'g'), '')::integer;
    nuevo := null; antes := null;
    if p.id is null then
      accion := 'omitido: no existe';
    else
      select precio into antes from catalogo where id = p.id;
      if p.estado in ('transito', 'oculto') or coalesce(p.costo, 0) = 0 then
        accion := 'omitido: sin costo o no publicado';
      elsif coalesce(p.precio_fijo, 0) > 0 then
        accion := 'omitido: tiene precio fijo manual';
      elsif mercado is null or mercado <= 0 then
        accion := 'omitido: sin precio de mercado';
      elsif mercado < p.costo * 0.8 or mercado > p.costo * 3 then
        accion := 'revisar';   -- casi seguro es otro producto o un precio raro
      else
        piso := wt_piso_mercado(p.costo, aj.margenes);
        objetivo := wt_redondear_abajo(mercado * (1 - coalesce((aj.margenes ->> '_mercado_desc')::numeric, 3) / 100));
        if objetivo < piso and wt_redondear(piso + 100) < mercado then
          objetivo := wt_redondear(piso + 100);     -- el 3 % no da, pero el piso sí queda debajo del mercado
        end if;
        if objetivo < piso then
          accion := 'no_compite';
          update productos set precio_mercado = null, mercado_ref = c ->> 'ref', mercado_fecha = now() where id = p.id;
        else
          nuevo := objetivo;
          update productos set precio_mercado = nuevo, mercado_ref = c ->> 'ref', mercado_fecha = now() where id = p.id;
          accion := case when antes is null or nuevo = antes then 'igual' when nuevo > antes then 'sube' else 'baja' end;
        end if;
      end if;
    end if;
    if p.id is not null then
      select precio into nuevo from catalogo where id = p.id;   -- el precio real que queda al público
    end if;
    insert into cambios_precio (producto_id, antes, despues, mercado, ref, accion)
      values (coalesce(c ->> 'id', '?'), antes, nuevo, mercado, c ->> 'ref', accion);
    salida := salida || jsonb_build_object('id', c ->> 'id', 'antes', antes, 'ahora', nuevo, 'mercado', mercado, 'accion', accion);
  end loop;
  return salida;
end $$;
revoke all on function public.aplicar_precios_mercado(text, jsonb) from public;
grant execute on function public.aplicar_precios_mercado(text, jsonb) to anon, authenticated;
