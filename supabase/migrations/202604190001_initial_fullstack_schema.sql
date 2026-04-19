create extension if not exists pgcrypto;

create table if not exists public.worlds (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  width integer not null check (width between 12 and 120),
  height integer not null check (height between 12 and 80),
  grid_json jsonb not null,
  generation integer not null default 0,
  version integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.patterns (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  width integer not null check (width between 1 and 120),
  height integer not null check (height between 1 and 120),
  cells_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  simulation_speed integer not null default 8 check (simulation_speed between 1 and 20),
  last_opened_cloud_world_id uuid references public.worlds(id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists worlds_owner_updated_idx on public.worlds (owner_user_id, updated_at desc);
create index if not exists patterns_owner_updated_idx on public.patterns (owner_user_id, updated_at desc);

alter table public.worlds enable row level security;
alter table public.patterns enable row level security;
alter table public.user_preferences enable row level security;

create policy if not exists "users_manage_own_worlds"
  on public.worlds
  for all
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

create policy if not exists "users_manage_own_patterns"
  on public.patterns
  for all
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

create policy if not exists "users_manage_own_preferences"
  on public.user_preferences
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
