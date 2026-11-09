-- Fix missing foreign keys for user references so relation embeds work.

alter table public.workspace_members
  add constraint workspace_members_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.workspace_members
  add constraint workspace_members_invited_by_fkey
  foreign key (invited_by) references public.profiles (id) on delete set null;

alter table public.user_roles
  add constraint user_roles_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.group_members
  add constraint group_members_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;