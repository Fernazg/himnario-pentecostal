-- Esquema para sincronizar el Himnario Pentecostal con Supabase.
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
  updated_at  bigint not null
);
create index if not exists songs_updated_at_idx on public.songs (updated_at);
create index if not exists songs_category_idx on public.songs (category);

alter table public.songs enable row level security;
-- Lectura pública; escritura solo para usuarios autenticados (administradores).
create policy "songs_read" on public.songs for select using (true);
create policy "songs_write" on public.songs for all to authenticated using (true) with check (true);
