create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.worlds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  width integer not null check (width between 12 and 120),
  height integer not null check (height between 12 and 80),
  grid jsonb not null,
  generation integer not null default 0,
  version integer not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  cells jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  simulation_speed integer not null default 8 check (simulation_speed between 1 and 20),
  last_opened_world_id uuid null references public.worlds(id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists worlds_user_id_updated_at_idx on public.worlds (user_id, updated_at desc);
create index if not exists patterns_user_id_updated_at_idx on public.patterns (user_id, updated_at desc);

drop trigger if exists worlds_set_updated_at on public.worlds;
create trigger worlds_set_updated_at
before update on public.worlds
for each row execute function public.set_updated_at();

drop trigger if exists patterns_set_updated_at on public.patterns;
create trigger patterns_set_updated_at
before update on public.patterns
for each row execute function public.set_updated_at();

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

alter table public.worlds enable row level security;
alter table public.patterns enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists "worlds_select_own" on public.worlds;
create policy "worlds_select_own"
on public.worlds for select
using (auth.uid() = user_id);

drop policy if exists "worlds_insert_own" on public.worlds;
create policy "worlds_insert_own"
on public.worlds for insert
with check (auth.uid() = user_id);

drop policy if exists "worlds_update_own" on public.worlds;
create policy "worlds_update_own"
on public.worlds for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "worlds_delete_own" on public.worlds;
create policy "worlds_delete_own"
on public.worlds for delete
using (auth.uid() = user_id);

drop policy if exists "patterns_select_own" on public.patterns;
create policy "patterns_select_own"
on public.patterns for select
using (auth.uid() = user_id);

drop policy if exists "patterns_insert_own" on public.patterns;
create policy "patterns_insert_own"
on public.patterns for insert
with check (auth.uid() = user_id);

drop policy if exists "patterns_update_own" on public.patterns;
create policy "patterns_update_own"
on public.patterns for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "patterns_delete_own" on public.patterns;
create policy "patterns_delete_own"
on public.patterns for delete
using (auth.uid() = user_id);

drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own"
on public.user_preferences for select
using (auth.uid() = user_id);

drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own"
on public.user_preferences for insert
with check (auth.uid() = user_id);

drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own"
on public.user_preferences for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
