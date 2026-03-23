-- ══════════════════════════════════════════════
--  LUCA — Supabase Database Schema
--  Run this in Supabase → SQL Editor → New Query
-- ══════════════════════════════════════════════

-- ─── Liked Songs ──────────────────────────────
create table if not exists public.liked_songs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  song_id    text not null,
  title      text not null,
  artist     text not null,
  cover      text,
  src        text not null,
  duration   integer default 0,
  liked_at   timestamptz default now(),
  unique(user_id, song_id)
);
alter table public.liked_songs enable row level security;
create policy "liked_songs_policy" on public.liked_songs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Playlists ────────────────────────────────
create table if not exists public.playlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  description text default '',
  cover       text default '',
  created_at  timestamptz default now()
);
alter table public.playlists enable row level security;
create policy "playlists_policy" on public.playlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Playlist Songs ───────────────────────────
create table if not exists public.playlist_songs (
  id          uuid primary key default gen_random_uuid(),
  playlist_id uuid references public.playlists(id) on delete cascade not null,
  song_id     text not null,
  title       text not null,
  artist      text not null,
  cover       text,
  src         text not null,
  duration    integer default 0,
  position    integer default 0,
  added_at    timestamptz default now()
);
alter table public.playlist_songs enable row level security;
create policy "playlist_songs_policy" on public.playlist_songs
  for all using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );

-- ─── Listening History ────────────────────────
create table if not exists public.listening_history (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references auth.users(id) on delete cascade not null,
  song_id   text not null,
  title     text not null,
  artist    text not null,
  cover     text,
  src       text not null,
  duration  integer default 0,
  played_at timestamptz default now()
);
alter table public.listening_history enable row level security;
create policy "history_policy" on public.listening_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);