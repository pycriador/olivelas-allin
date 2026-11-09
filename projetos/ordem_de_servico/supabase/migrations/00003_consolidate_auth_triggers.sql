-- ServiceForge — Consolidated auth.users sync trigger
-- Drops ALL previous triggers on auth.users and creates ONE clean handler.

-- 1. Cleanup old triggers and functions
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_deleted on auth.users;

drop function if exists public.handle_auth_user_created();
drop function if exists public.handle_auth_user_deleted();
drop function if exists public.handle_new_user();

-- 2. Ensure enum and tables exist
do $$ begin
  create type public.app_role as enum ('global_admin', 'admin', 'user');
exception when duplicate_object then null;
end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Grant permissions
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

-- 4. Enable RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- 5. RLS policies for profiles
drop policy if exists "profiles select own or admin" on public.profiles;
create policy "profiles select own or admin" on public.profiles for select to authenticated
using (id = auth.uid() or exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'global_admin')));

drop policy if exists "profiles update own or admin" on public.profiles;
create policy "profiles update own or admin" on public.profiles for update to authenticated
using (id = auth.uid() or exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'global_admin')))
with check (id = auth.uid() or exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('admin', 'global_admin')));

drop policy if exists "profiles insert self" on public.profiles;
create policy "profiles insert self" on public.profiles for insert to authenticated
with check (id = auth.uid());

-- 6. RLS policies for user_roles
drop policy if exists "users can read own roles" on public.user_roles;
create policy "users can read own roles" on public.user_roles for select to authenticated
using (user_id = auth.uid() or exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'global_admin'));

drop policy if exists "admins manage roles" on public.user_roles;
create policy "admins manage roles" on public.user_roles for all to authenticated
using (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'global_admin'))
with check (exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'global_admin'));

-- 7. Trigger function — handles BOTH profiles and user_roles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id, new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 8. Updated_at trigger for profiles
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.tg_set_updated_at();
