-- ============================================================================
--  RUMBO - esquema inicial
--  Pegar entero en Supabase > SQL Editor > New query > Run.
--  Es idempotente: se puede volver a correr sin romper nada.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1. Andamiaje comun
-- ---------------------------------------------------------------------------

-- updated_at lo pone LA BASE, no el cliente. Si lo pusiera el cliente, un
-- dispositivo con la hora atrasada guardaria con fecha vieja, la huella no se
-- moveria y los demas dispositivos nunca verian ese cambio.
create or replace function public.tocar_updated_at()
returns trigger language plpgsql as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

-- Prepara una tabla: prende RLS, deja una sola policy "cada uno ve lo suyo"
-- y engancha el trigger de updated_at. Toda tabla nueva del proyecto se
-- registra llamando a esta funcion, asi no hay forma de olvidarse de RLS.
create or replace function public.preparar_tabla(nombre text)
returns void language plpgsql as $fn$
begin
  execute format('alter table public.%I enable row level security', nombre);

  execute format('drop policy if exists "propias" on public.%I', nombre);
  execute format(
    'create policy "propias" on public.%I for all
       using (user_id = auth.uid()) with check (user_id = auth.uid())', nombre);

  execute format('drop trigger if exists trg_updated_at on public.%I', nombre);
  execute format(
    'create trigger trg_updated_at before update on public.%I
       for each row execute function public.tocar_updated_at()', nombre);

  -- El sondeo consulta siempre por user_id ordenando por updated_at.
  execute format(
    'create index if not exists %I on public.%I (user_id, updated_at desc)',
    'idx_' || nombre || '_huella', nombre);
end;
$fn$;

-- Igual que preparar_tabla, pero para CATALOGOS: tablas sin user_id que son
-- iguales para todos (los ejercicios y los alimentos de referencia). Todo el
-- mundo los lee, nadie los escribe desde la app.
create or replace function public.preparar_catalogo(nombre text)
returns void language plpgsql as $fn$
begin
  execute format('alter table public.%I enable row level security', nombre);

  execute format('drop policy if exists "lectura" on public.%I', nombre);
  execute format(
    'create policy "lectura" on public.%I for select to authenticated using (true)', nombre);

  execute format('drop trigger if exists trg_updated_at on public.%I', nombre);
  execute format(
    'create trigger trg_updated_at before update on public.%I
       for each row execute function public.tocar_updated_at()', nombre);
end;
$fn$;

-- Columnas que lleva toda tabla del proyecto (Postgres no tiene macros, asi que
-- van escritas en cada una):
--   id         uuid primary key default gen_random_uuid()
--   user_id    uuid not null default auth.uid() references auth.users on delete cascade
--   created_at timestamptz not null default now()
--   updated_at timestamptz not null default now()
--
-- user_id NO lo manda el cliente: lo pone el DEFAULT auth.uid(). Asi nadie puede
-- insertar filas a nombre de otro, ni equivocandose ni a proposito.


-- ---------------------------------------------------------------------------
--  2. Perfil (una fila por persona)
-- ---------------------------------------------------------------------------

create table if not exists public.perfil (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique default auth.uid() references auth.users on delete cascade,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  nombre         text,

  -- Datos del cuerpo: los usan el generador de dieta (calorias) y el de rutina.
  fecha_nacimiento date,
  sexo             text check (sexo in ('masculino','femenino')),
  altura_cm        numeric,
  peso_kg          numeric,
  nivel_actividad  text default 'moderado'
                   check (nivel_actividad in ('sedentario','ligero','moderado','alto','atleta')),
  objetivo         text default 'mantener'
                   check (objetivo in ('bajar','mantener','subir')),

  -- Objetivos diarios. Los calcula el generador, pero se pueden pisar a mano.
  kcal_objetivo  numeric,
  prot_objetivo  numeric,
  carb_objetivo  numeric,
  gras_objetivo  numeric,
  peso_objetivo  numeric
);
select public.preparar_tabla('perfil');


-- ---------------------------------------------------------------------------
--  3. Tareas y proyectos
-- ---------------------------------------------------------------------------

create table if not exists public.proyectos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  nombre      text not null,
  color       text not null default '#6c8cff',
  archivado   boolean not null default false
);
select public.preparar_tabla('proyectos');

create table if not exists public.tareas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  titulo      text not null,
  notas       text,
  proyecto_id uuid references public.proyectos on delete set null,
  prioridad   smallint not null default 1 check (prioridad between 0 and 2),
  vence_el    date,
  hecha       boolean not null default false,
  hecha_el    timestamptz
);
select public.preparar_tabla('tareas');
create index if not exists idx_tareas_pendientes on public.tareas (user_id, hecha, vence_el);


-- ---------------------------------------------------------------------------
--  4. Habitos
-- ---------------------------------------------------------------------------

create table if not exists public.habitos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  nombre      text not null,
  color       text not null default '#4fb286',
  meta_diaria numeric not null default 1,
  unidad      text,
  dias        smallint[] not null default '{0,1,2,3,4,5,6}',
  activo      boolean not null default true
);
select public.preparar_tabla('habitos');

create table if not exists public.habito_registros (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  habito_id   uuid not null references public.habitos on delete cascade,
  fecha       date not null,
  valor       numeric not null default 1,
  unique (habito_id, fecha)
);
select public.preparar_tabla('habito_registros');
create index if not exists idx_habito_reg_fecha on public.habito_registros (user_id, fecha);


-- ---------------------------------------------------------------------------
--  5. Rutina (la semana tipica)
-- ---------------------------------------------------------------------------

create table if not exists public.bloques_rutina (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  nombre      text not null,
  dia_semana  smallint not null check (dia_semana between 0 and 6),
  hora_inicio time not null,
  hora_fin    time not null,
  color       text not null default '#9b7fd4',
  notas       text
);
select public.preparar_tabla('bloques_rutina');
create index if not exists idx_rutina_dia on public.bloques_rutina (user_id, dia_semana, hora_inicio);


-- ---------------------------------------------------------------------------
--  6. Entrenamiento
-- ---------------------------------------------------------------------------

create table if not exists public.ejercicios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  nombre      text not null,
  grupo       text,
  notas       text
);
select public.preparar_tabla('ejercicios');

create table if not exists public.sesiones (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  fecha        date not null default current_date,
  nombre       text not null default 'Entrenamiento',
  duracion_min integer,
  notas        text
);
select public.preparar_tabla('sesiones');
create index if not exists idx_sesiones_fecha on public.sesiones (user_id, fecha desc);

create table if not exists public.series (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  sesion_id    uuid not null references public.sesiones on delete cascade,
  ejercicio_id uuid not null references public.ejercicios on delete cascade,
  orden        smallint not null default 0,
  peso         numeric,
  repeticiones smallint,
  hecha        boolean not null default true
);
select public.preparar_tabla('series');
create index if not exists idx_series_sesion on public.series (user_id, sesion_id, orden);


-- Catalogo de ejercicios, igual para todos. Lo carga sql/02-catalogos.sql.
-- 'patron' es el movimiento que entrena (empuje horizontal, bisagra de cadera,
-- etc.): es lo que usa el generador para armar la rutina, porque una rutina se
-- arma por patrones y recien despues se elige con que ejercicio cubrirlos.
create table if not exists public.ejercicios_base (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  nombre     text not null unique,
  patron     text not null,
  grupos     text[] not null default '{}',
  equipo     text not null default 'barra',
  nivel      text not null default 'principiante'
             check (nivel in ('principiante','intermedio','avanzado')),
  -- Que tan central es el ejercicio dentro de su patron: 1 es el basico de
  -- referencia y 5 un aislado. El generador elige por este orden, no por
  -- nombre, para que el principal del dia sea un press de banca y no unas
  -- aperturas.
  prioridad  smallint not null default 5,
  notas      text
);
select public.preparar_catalogo('ejercicios_base');
create index if not exists idx_ejbase_patron on public.ejercicios_base (patron, equipo);


-- Planes de entrenamiento generados. Un plan tiene dias, y cada dia tiene
-- ejercicios con series, repeticiones y descanso.
create table if not exists public.planes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  nombre      text not null,
  deporte     text not null,
  nivel       text not null default 'principiante',
  objetivo    text not null default 'mixto',
  dias_semana smallint not null default 3,
  equipo      text[] not null default '{}',
  notas       text,
  activo      boolean not null default true
);
select public.preparar_tabla('planes');

create table if not exists public.plan_dias (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  plan_id    uuid not null references public.planes on delete cascade,
  orden      smallint not null default 0,
  nombre     text not null,
  foco       text,
  dia_semana smallint check (dia_semana between 0 and 6)
);
select public.preparar_tabla('plan_dias');
create index if not exists idx_plandias_plan on public.plan_dias (user_id, plan_id, orden);

create table if not exists public.plan_ejercicios (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  plan_dia_id   uuid not null references public.plan_dias on delete cascade,
  orden         smallint not null default 0,
  nombre        text not null,          -- copiado del catalogo: el plan no se
  patron        text,                   -- rompe si manana cambia el catalogo
  series        smallint not null default 3,
  reps_min      smallint not null default 8,
  reps_max      smallint not null default 12,
  descanso_seg  smallint not null default 90,
  nota          text
);
select public.preparar_tabla('plan_ejercicios');
create index if not exists idx_planej_dia on public.plan_ejercicios (user_id, plan_dia_id, orden);


-- ---------------------------------------------------------------------------
--  7. Dieta
-- ---------------------------------------------------------------------------

create table if not exists public.alimentos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  nombre      text not null,
  kcal_100    numeric not null default 0,
  prot_100    numeric not null default 0,
  carb_100    numeric not null default 0,
  gras_100    numeric not null default 0,
  porcion_g   numeric
);
select public.preparar_tabla('alimentos');

-- Catalogo de alimentos con su aporte nutricional, igual para todos.
-- Lo carga sql/02-catalogos.sql. Los alimentos propios van en public.alimentos.
create table if not exists public.alimentos_base (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  nombre     text not null unique,
  categoria  text not null default 'otros',
  kcal_100   numeric not null default 0,
  prot_100   numeric not null default 0,
  carb_100   numeric not null default 0,
  gras_100   numeric not null default 0,
  fibra_100  numeric not null default 0,
  porcion_g  numeric,
  porcion_nombre text
);
select public.preparar_catalogo('alimentos_base');
create index if not exists idx_albase_cat on public.alimentos_base (categoria);

create table if not exists public.comidas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  fecha       date not null default current_date,
  momento     text not null default 'almuerzo'
              check (momento in ('desayuno','almuerzo','merienda','cena','snack')),
  notas       text
);
select public.preparar_tabla('comidas');
create index if not exists idx_comidas_fecha on public.comidas (user_id, fecha desc);

-- Los macros se guardan COPIADOS en el item, no se leen del alimento.
-- Si manana corregis las calorias de un alimento, lo que comiste el mes pasado
-- tiene que seguir diciendo lo que decia: es un registro historico, no una vista.
create table if not exists public.comida_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  comida_id   uuid not null references public.comidas on delete cascade,
  alimento_id uuid references public.alimentos on delete set null,
  nombre      text not null,
  gramos      numeric not null default 100,
  kcal        numeric not null default 0,
  prot        numeric not null default 0,
  carb        numeric not null default 0,
  gras        numeric not null default 0
);
select public.preparar_tabla('comida_items');
create index if not exists idx_comida_items on public.comida_items (user_id, comida_id);


-- ---------------------------------------------------------------------------
--  8. Finanzas personales
-- ---------------------------------------------------------------------------

create table if not exists public.categorias (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  nombre      text not null,
  tipo        text not null default 'egreso' check (tipo in ('ingreso','egreso')),
  color       text not null default '#e0a458'
);
select public.preparar_tabla('categorias');

create table if not exists public.movimientos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  fecha        date not null default current_date,
  tipo         text not null default 'egreso' check (tipo in ('ingreso','egreso')),
  monto        numeric not null default 0,
  categoria_id uuid references public.categorias on delete set null,
  detalle      text,
  medio        text
);
select public.preparar_tabla('movimientos');
create index if not exists idx_mov_fecha on public.movimientos (user_id, fecha desc);

create table if not exists public.vencimientos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  nombre       text not null,
  monto        numeric not null default 0,
  dia_mes      smallint not null default 1 check (dia_mes between 1 and 31),
  activo       boolean not null default true,
  pagado_hasta date
);
select public.preparar_tabla('vencimientos');
