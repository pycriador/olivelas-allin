-- ServiceForge Platform — Sync auth.users → public.users
-- Automatically creates/updates a profile in public.users when
-- a user signs up via Supabase Auth (email, Google OAuth, etc.)

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name, role, active, preferences, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'Usuário'),
    coalesce(new.raw_user_meta_data ->> 'role', 'user'),
    true,
    '{}',
    new.created_at,
    new.updated_at
  )
  on conflict (id) do update set
    email    = excluded.email,
    name     = excluded.name,
    updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_auth_user_deleted()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.users where id = old.id;
  return old;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user_created();

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function public.handle_auth_user_deleted();
