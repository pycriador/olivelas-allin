-- =========================================================================
-- ServiceForge — Fundação Supabase (Parte 1)
-- Execute este arquivo no SQL Editor do seu projeto Supabase.
-- =========================================================================

-- ---------- 1. Enum e tabela de papéis -------------------------------------
do $$ begin
  create type public.app_role as enum ('global_admin', 'admin', 'user');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

drop policy if exists "users can read own roles" on public.user_roles;
create policy "users can read own roles" on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'global_admin'));

drop policy if exists "admins manage roles" on public.user_roles;
create policy "admins manage roles" on public.user_roles for all to authenticated
using (public.has_role(auth.uid(), 'global_admin'))
with check (public.has_role(auth.uid(), 'global_admin'));

-- ---------- 2. Perfis -------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

drop policy if exists "profiles select own or admin" on public.profiles;
create policy "profiles select own or admin" on public.profiles for select to authenticated
using (id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'global_admin'));

drop policy if exists "profiles update own or admin" on public.profiles;
create policy "profiles update own or admin" on public.profiles for update to authenticated
using (id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'global_admin'))
with check (id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'global_admin'));

drop policy if exists "profiles insert self" on public.profiles;
create policy "profiles insert self" on public.profiles for insert to authenticated
with check (id = auth.uid());

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.tg_set_updated_at();

-- ---------- 3. Trigger para novos usuários ---------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- 4. Buckets de Storage ------------------------------------------
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('documents', 'documents', false),
  ('uploads', 'uploads', false),
  ('exports', 'exports', false)
on conflict (id) do nothing;

-- Avatars: leitura pública; escrita restrita ao próprio usuário (prefixo=user_id/)
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "avatars owner write" on storage.objects;
create policy "avatars owner write" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update" on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars owner delete" on storage.objects;
create policy "avatars owner delete" on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Documents / uploads / exports: apenas o dono ou admin
do $$
declare b text;
begin
  foreach b in array array['documents','uploads','exports'] loop
    execute format($p$drop policy if exists "%1$s owner all" on storage.objects$p$, b);
    execute format(
      $p$create policy "%1$s owner all" on storage.objects
         for all to authenticated
         using (bucket_id = %1$L and (owner = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'global_admin')))
         with check (bucket_id = %1$L and owner = auth.uid())$p$,
      b
    );
  end loop;
end $$;
