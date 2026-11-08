-- Esquema del Himnario Pentecostal compartido (Supabase / PostgreSQL).
-- Lectura pública; escritura solo para administradores (tabla admins).
-- Idempotente: puede ejecutarse varias veces.

-- Marca de sincronización en milisegundos, asignada por el servidor.
create or replace function public.now_ms() returns bigint
language sql volatile as $$ select (extract(epoch from clock_timestamp()) * 1000)::bigint $$;

create or replace function public.touch_synced_at() returns trigger
language plpgsql as $$
begin
  new.synced_at := public.now_ms();
  return new;
end $$;

-- Canciones -------------------------------------------------------------
create table if not exists public.songs (
  id          text primary key,
  title       text not null,
  number      text,
  category    text not null check (category in ('himnos', 'alabanzas', 'coros')),
  lyrics      text not null default '',
  author      text,
  composer    text,
  key         text,
  notes       text,
  created_at  bigint not null,
  updated_at  bigint not null,
  deleted     boolean not null default false,
  synced_at   bigint not null default public.now_ms()
);
create index if not exists songs_synced_at_idx on public.songs (synced_at);

drop trigger if exists songs_touch on public.songs;
create trigger songs_touch before insert or update on public.songs
  for each row execute function public.touch_synced_at();

-- Listas de culto compartidas -------------------------------------------
create table if not exists public.lists (
  id          text primary key,
  name        text not null,
  date        text,
  description text,
  song_ids    jsonb not null default '[]'::jsonb,
  created_at  bigint not null,
  updated_at  bigint not null,
  deleted     boolean not null default false,
  synced_at   bigint not null default public.now_ms()
);
create index if not exists lists_synced_at_idx on public.lists (synced_at);

drop trigger if exists lists_touch on public.lists;
create trigger lists_touch before insert or update on public.lists
  for each row execute function public.touch_synced_at();

-- Administradores ---------------------------------------------------------
create table if not exists public.admins (
  email text primary key check (email = lower(email))
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = lower(auth.jwt() ->> 'email'));
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- Seguridad (RLS) ---------------------------------------------------------
alter table public.songs  enable row level security;
alter table public.lists  enable row level security;
alter table public.admins enable row level security;

drop policy if exists songs_read  on public.songs;
drop policy if exists songs_write on public.songs;
drop policy if exists lists_read  on public.lists;
drop policy if exists lists_write on public.lists;
drop policy if exists admins_self on public.admins;

create policy songs_read  on public.songs for select using (true);
create policy songs_write on public.songs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy lists_read  on public.lists for select using (true);
create policy lists_write on public.lists for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- Cada usuario solo puede ver si su propio correo es administrador.
create policy admins_self on public.admins for select to authenticated using (email = lower(auth.jwt() ->> 'email'));

grant select on public.songs, public.lists to anon, authenticated;
grant insert, update, delete on public.songs, public.lists to authenticated;
grant select on public.admins to authenticated;

-- Para agregar un administrador:
--   insert into public.admins (email) values ('correo@ejemplo.com');
