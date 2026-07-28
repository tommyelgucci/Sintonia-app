-- Sintonía — schema de Supabase (Postgres + RLS)
--
-- Principio de diseño: "connections" es una relación simétrica sin roles
-- fijos (no hay partner_a/partner_b con significado distinto, no hay campo
-- de género en ningún lado). Cualquier persona puede invitar a cualquier
-- otra a vincularse, sin importar cómo se identifique ninguna de las dos.
--
-- Principio de privacidad: nada se comparte por default salvo las fechas
-- de ciclo una vez aceptada la conexión. Síntomas, ánimo y notas quedan
-- ocultos hasta que la usuaria dueña de esos datos los habilita
-- explícitamente en "share_settings", por conexión.
--
-- Todas las tablas se crean primero y las políticas RLS al final, porque
-- varias políticas de una tabla temprana (p.ej. cycles) referencian una
-- tabla que se define más adelante (share_settings, connections).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avg_cycle_length int not null default 28,
  avg_period_length int not null default 5,
  created_at timestamptz not null default now()
);

create table if not exists cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  start_date date not null,
  period_length int,
  created_at timestamptz not null default now(),
  unique (user_id, start_date)
);

create index if not exists cycles_user_start_idx on cycles (user_id, start_date desc);

create type flow_intensity as enum ('none', 'light', 'medium', 'heavy');

create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  log_date date not null,
  flow flow_intensity not null default 'none',
  symptoms text[] not null default '{}',
  mood text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create type connection_status as enum ('pending', 'accepted', 'revoked');

create table if not exists connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles (id) on delete cascade,
  addressee_id uuid not null references profiles (id) on delete cascade,
  status connection_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id != addressee_id)
);

-- Evita conexiones duplicadas en cualquiera de los dos sentidos.
create unique index if not exists connections_pair_idx
  on connections (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create table if not exists connection_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references profiles (id) on delete cascade,
  code text not null unique,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_by uuid references profiles (id),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists share_settings (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references connections (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  share_cycle_dates boolean not null default true,
  share_symptoms boolean not null default false,
  share_mood boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (connection_id, user_id)
);

-- ---------------------------------------------------------------------
-- RLS: profiles
-- ---------------------------------------------------------------------
alter table profiles enable row level security;

create policy "profiles: cada quien ve y edita su propio perfil"
  on profiles for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- Un perfil vinculado necesita ser visible por su/s conexión/es aceptada/s
-- (solo el nombre, para mostrarlo en la UI de "pareja vinculada").
create policy "profiles: visible para conexiones aceptadas"
  on profiles for select
  using (
    exists (
      select 1 from connections c
      where c.status = 'accepted'
        and profiles.id in (c.requester_id, c.addressee_id)
        and auth.uid() in (c.requester_id, c.addressee_id)
    )
  );

-- ---------------------------------------------------------------------
-- RLS: cycles
-- ---------------------------------------------------------------------
alter table cycles enable row level security;

create policy "cycles: dueña administra sus ciclos"
  on cycles for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "cycles: visibles para conexión si comparte fechas"
  on cycles for select
  using (
    exists (
      select 1 from connections c
      join share_settings s on s.connection_id = c.id and s.user_id = cycles.user_id
      where c.status = 'accepted'
        and cycles.user_id in (c.requester_id, c.addressee_id)
        and auth.uid() in (c.requester_id, c.addressee_id)
        and auth.uid() != cycles.user_id
        and s.share_cycle_dates
    )
  );

-- ---------------------------------------------------------------------
-- RLS: daily_logs
-- ---------------------------------------------------------------------
alter table daily_logs enable row level security;

create policy "daily_logs: dueña administra sus registros"
  on daily_logs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "daily_logs: visibles para conexión según lo que comparte"
  on daily_logs for select
  using (
    exists (
      select 1 from connections c
      join share_settings s on s.connection_id = c.id and s.user_id = daily_logs.user_id
      where c.status = 'accepted'
        and daily_logs.user_id in (c.requester_id, c.addressee_id)
        and auth.uid() in (c.requester_id, c.addressee_id)
        and auth.uid() != daily_logs.user_id
        and (s.share_symptoms or s.share_mood)
    )
  );

-- ---------------------------------------------------------------------
-- RLS: connections
-- ---------------------------------------------------------------------
alter table connections enable row level security;

create policy "connections: visibles para ambas partes"
  on connections for select
  using (auth.uid() in (requester_id, addressee_id));

-- La conexión se crea recién cuando alguien canjea una invitación (prueba
-- de que ambas partes ya se pusieron de acuerdo fuera de la app, al
-- compartirse el código), así que quien hace el INSERT es la addressee,
-- no la requester original que generó el código.
create policy "connections: la addressee crea el vínculo al canjear un código"
  on connections for insert
  with check (auth.uid() = addressee_id);

create policy "connections: la addressee puede aceptar o rechazar"
  on connections for update
  using (auth.uid() in (requester_id, addressee_id))
  with check (auth.uid() in (requester_id, addressee_id));

-- ---------------------------------------------------------------------
-- RLS: connection_invites
-- ---------------------------------------------------------------------
alter table connection_invites enable row level security;

create policy "connection_invites: la creadora las administra"
  on connection_invites for all
  using (inviter_id = auth.uid())
  with check (inviter_id = auth.uid());

-- Cualquier usuaria autenticada puede leer una invitación por código para
-- canjearla (necesita ver quién invita antes de aceptar).
create policy "connection_invites: legible por código para canjear"
  on connection_invites for select
  using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------
-- RLS: share_settings
-- ---------------------------------------------------------------------
alter table share_settings enable row level security;

create policy "share_settings: dueña administra sus preferencias"
  on share_settings for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "share_settings: la otra parte de la conexión puede leerlas"
  on share_settings for select
  using (
    exists (
      select 1 from connections c
      where c.id = share_settings.connection_id
        and auth.uid() in (c.requester_id, c.addressee_id)
    )
  );

-- ---------------------------------------------------------------------
-- Trigger: al aceptarse una conexión, crear la fila de share_settings de
-- las DOS partes con los defaults de privacidad. Hace falta un trigger
-- (no dos inserts desde el cliente) porque cada usuaria solo puede
-- insertar su propia fila por RLS — quien canjea el código no tiene
-- permiso para crear la fila de la persona que invitó.
-- ---------------------------------------------------------------------
create or replace function create_default_share_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into share_settings (connection_id, user_id)
  values (new.id, new.requester_id), (new.id, new.addressee_id)
  on conflict (connection_id, user_id) do nothing;
  return new;
end;
$$;

create trigger connections_after_insert_share_settings
  after insert on connections
  for each row
  when (new.status = 'accepted')
  execute function create_default_share_settings();
