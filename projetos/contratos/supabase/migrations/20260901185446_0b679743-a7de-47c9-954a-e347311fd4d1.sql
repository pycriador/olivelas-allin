create type public.app_role as enum ('super_admin','workspace_admin','manager','editor','reviewer','viewer');
create type public.member_status as enum ('active','invited','suspended');
create type public.workspace_status as enum ('active','trial','suspended','archived');
create type public.workspace_plan as enum ('free','starter','business','enterprise');
create type public.project_status as enum ('draft','active','archived');
create type public.execution_status as enum ('pending','running','succeeded','failed','cancelled');
create type public.connector_kind as enum ('google_sheets','google_docs','rest_api','csv','xlsx','json');

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  domain text,
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Sao_Paulo',
  plan public.workspace_plan not null default 'enterprise',
  status public.workspace_status not null default 'active',
  branding jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.workspaces to authenticated;
grant all on public.workspaces to service_role;

create table public.profiles (
  id uuid primary key,
  email text not null,
  full_name text,
  avatar_url text,
  job_title text,
  locale text not null default 'pt-BR',
  theme text not null default 'system',
  status public.member_status not null default 'active',
  mfa_enabled boolean not null default false,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  status public.member_status not null default 'active',
  is_default boolean not null default false,
  invited_by uuid,
  joined_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);
grant select, insert, update, delete on public.workspace_members to authenticated;
grant all on public.workspace_members to service_role;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now()
);
create unique index user_roles_unique_scoped on public.user_roles (user_id, role, coalesce(workspace_id, '00000000-0000-0000-0000-000000000000'::uuid));
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

create or replace function public.is_global_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = 'super_admin' and workspace_id is null);
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role, _workspace_id uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_global_admin(_user_id) or exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
      and (_workspace_id is null or workspace_id = _workspace_id)
  );
$$;

create or replace function public.is_workspace_member(_user_id uuid, _workspace_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_global_admin(_user_id) or exists (
    select 1 from public.workspace_members
    where user_id = _user_id and workspace_id = _workspace_id and status = 'active'
  );
$$;

create or replace function public.is_workspace_admin(_user_id uuid, _workspace_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_global_admin(_user_id) or exists (
    select 1 from public.user_roles
    where user_id = _user_id and workspace_id = _workspace_id and role in ('super_admin','workspace_admin')
  );
$$;

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.groups to authenticated;
grant all on public.groups to service_role;

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);
grant select, insert, delete on public.group_members to authenticated;
grant all on public.group_members to service_role;

create table public.permissions (
  key text primary key,
  module text not null,
  description text
);
grant select on public.permissions to authenticated;
grant all on public.permissions to service_role;

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role public.app_role not null,
  permission_key text not null references public.permissions(key) on delete cascade,
  unique (role, permission_key)
);
grant select on public.role_permissions to authenticated;
grant all on public.role_permissions to service_role;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  status public.project_status not null default 'draft',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;

create table public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version integer not null default 1,
  snapshot jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (project_id, version)
);
grant select, insert, update, delete on public.project_versions to authenticated;
grant all on public.project_versions to service_role;

create table public.connectors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  kind public.connector_kind not null,
  config jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.connectors to authenticated;
grant all on public.connectors to service_role;

create table public.credentials (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  provider text not null,
  encrypted_payload text,
  fingerprint text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.credentials to authenticated;
grant all on public.credentials to service_role;

create table public.data_sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  connector_id uuid references public.connectors(id) on delete set null,
  name text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.data_sources to authenticated;
grant all on public.data_sources to service_role;

create table public.variables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  key text not null,
  label text,
  data_type text not null default 'text',
  default_value jsonb,
  is_required boolean not null default false,
  created_at timestamptz not null default now(),
  unique (project_id, key)
);
grant select, insert, update, delete on public.variables to authenticated;
grant all on public.variables to service_role;

create table public.builders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  layout jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.builders to authenticated;
grant all on public.builders to service_role;

create table public.rules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  expression jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.rules to authenticated;
grant all on public.rules to service_role;

create table public.executions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  status public.execution_status not null default 'pending',
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  triggered_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.executions to authenticated;
grant all on public.executions to service_role;

create table public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  execution_id uuid references public.executions(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  name text not null,
  format text not null default 'pdf',
  storage_path text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.generated_documents to authenticated;
grant all on public.generated_documents to service_role;

create table public.libraries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.libraries to authenticated;
grant all on public.libraries to service_role;

create table public.clauses (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.libraries(id) on delete cascade,
  title text not null,
  content text,
  tags text[] not null default '{}',
  version integer not null default 1,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.clauses to authenticated;
grant all on public.clauses to service_role;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  actor_id uuid,
  actor_email text,
  action text not null,
  entity text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);
grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  title text not null,
  body text,
  level text not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  scope text not null default 'workspace',
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (workspace_id, scope, key)
);
grant select, insert, update, delete on public.settings to authenticated;
grant all on public.settings to service_role;

create trigger workspaces_updated before update on public.workspaces for each row execute function public.set_updated_at();
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger projects_updated before update on public.projects for each row execute function public.set_updated_at();
create trigger connectors_updated before update on public.connectors for each row execute function public.set_updated_at();
create trigger credentials_updated before update on public.credentials for each row execute function public.set_updated_at();

alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.workspace_members enable row level security;
alter table public.user_roles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.projects enable row level security;
alter table public.project_versions enable row level security;
alter table public.connectors enable row level security;
alter table public.credentials enable row level security;
alter table public.data_sources enable row level security;
alter table public.variables enable row level security;
alter table public.builders enable row level security;
alter table public.rules enable row level security;
alter table public.executions enable row level security;
alter table public.generated_documents enable row level security;
alter table public.libraries enable row level security;
alter table public.clauses enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.settings enable row level security;

create policy "members read workspace" on public.workspaces for select to authenticated using (public.is_workspace_member(auth.uid(), id));
create policy "global admin manages workspaces" on public.workspaces for all to authenticated using (public.is_global_admin(auth.uid())) with check (public.is_global_admin(auth.uid()));
create policy "ws admin updates workspace" on public.workspaces for update to authenticated using (public.is_workspace_admin(auth.uid(), id));

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_global_admin(auth.uid()) or exists (select 1 from public.workspace_members m1 join public.workspace_members m2 on m1.workspace_id = m2.workspace_id where m1.user_id = auth.uid() and m2.user_id = profiles.id));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid() or public.is_global_admin(auth.uid()));

create policy "read own memberships" on public.workspace_members for select to authenticated using (user_id = auth.uid() or public.is_workspace_admin(auth.uid(), workspace_id));
create policy "admins manage memberships" on public.workspace_members for all to authenticated using (public.is_workspace_admin(auth.uid(), workspace_id)) with check (public.is_workspace_admin(auth.uid(), workspace_id));

create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_global_admin(auth.uid()) or (workspace_id is not null and public.is_workspace_admin(auth.uid(), workspace_id)));

create policy "read permissions" on public.permissions for select to authenticated using (true);
create policy "read role permissions" on public.role_permissions for select to authenticated using (true);

create policy "ws scoped groups" on public.groups for all to authenticated using (workspace_id is null or public.is_workspace_member(auth.uid(), workspace_id)) with check (workspace_id is not null and public.is_workspace_admin(auth.uid(), workspace_id));
create policy "group members read" on public.group_members for select to authenticated using (exists (select 1 from public.groups g where g.id = group_id and (g.workspace_id is null or public.is_workspace_member(auth.uid(), g.workspace_id))));
create policy "group members manage" on public.group_members for all to authenticated using (exists (select 1 from public.groups g where g.id = group_id and g.workspace_id is not null and public.is_workspace_admin(auth.uid(), g.workspace_id))) with check (exists (select 1 from public.groups g where g.id = group_id and g.workspace_id is not null and public.is_workspace_admin(auth.uid(), g.workspace_id)));

create policy "ws scoped projects" on public.projects for all to authenticated using (public.is_workspace_member(auth.uid(), workspace_id)) with check (public.is_workspace_member(auth.uid(), workspace_id));
create policy "ws scoped connectors" on public.connectors for all to authenticated using (public.is_workspace_member(auth.uid(), workspace_id)) with check (public.is_workspace_admin(auth.uid(), workspace_id));
create policy "ws admin credentials" on public.credentials for all to authenticated using (public.is_workspace_admin(auth.uid(), workspace_id)) with check (public.is_workspace_admin(auth.uid(), workspace_id));
create policy "ws scoped executions" on public.executions for all to authenticated using (public.is_workspace_member(auth.uid(), workspace_id)) with check (public.is_workspace_member(auth.uid(), workspace_id));
create policy "ws scoped documents" on public.generated_documents for all to authenticated using (public.is_workspace_member(auth.uid(), workspace_id)) with check (public.is_workspace_member(auth.uid(), workspace_id));
create policy "ws scoped libraries" on public.libraries for all to authenticated using (public.is_workspace_member(auth.uid(), workspace_id)) with check (public.is_workspace_member(auth.uid(), workspace_id));
create policy "ws scoped settings" on public.settings for all to authenticated using (workspace_id is not null and public.is_workspace_member(auth.uid(), workspace_id)) with check (workspace_id is not null and public.is_workspace_admin(auth.uid(), workspace_id));
create policy "ws scoped audit read" on public.audit_logs for select to authenticated using ((workspace_id is null and public.is_global_admin(auth.uid())) or (workspace_id is not null and public.is_workspace_admin(auth.uid(), workspace_id)));
create policy "audit insert" on public.audit_logs for insert to authenticated with check (actor_id = auth.uid());
create policy "own notifications" on public.notifications for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "project scoped versions" on public.project_versions for all to authenticated using (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(auth.uid(), p.workspace_id))) with check (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(auth.uid(), p.workspace_id)));
create policy "project scoped data sources" on public.data_sources for all to authenticated using (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(auth.uid(), p.workspace_id))) with check (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(auth.uid(), p.workspace_id)));
create policy "project scoped variables" on public.variables for all to authenticated using (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(auth.uid(), p.workspace_id))) with check (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(auth.uid(), p.workspace_id)));
create policy "project scoped builders" on public.builders for all to authenticated using (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(auth.uid(), p.workspace_id))) with check (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(auth.uid(), p.workspace_id)));
create policy "project scoped rules" on public.rules for all to authenticated using (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(auth.uid(), p.workspace_id))) with check (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(auth.uid(), p.workspace_id)));
create policy "library scoped clauses" on public.clauses for all to authenticated using (exists (select 1 from public.libraries l where l.id = library_id and public.is_workspace_member(auth.uid(), l.workspace_id))) with check (exists (select 1 from public.libraries l where l.id = library_id and public.is_workspace_member(auth.uid(), l.workspace_id)));

insert into public.permissions (key, module, description) values
 ('workspace.read','Workspace','Ver workspace'),('workspace.manage','Workspace','Administrar workspace'),
 ('projects.read','Projects','Ver projetos'),('projects.write','Projects','Criar e editar projetos'),('projects.delete','Projects','Excluir projetos'),
 ('documents.read','Documents','Ver documentos'),('documents.write','Documents','Gerar documentos'),
 ('executions.read','Executions','Ver execucoes'),('executions.run','Executions','Executar projetos'),
 ('libraries.read','Libraries','Ver biblioteca'),('libraries.write','Libraries','Editar clausulas'),
 ('users.read','Users','Ver usuarios'),('users.manage','Users','Administrar usuarios'),
 ('settings.read','Settings','Ver configuracoes'),('settings.manage','Settings','Alterar configuracoes'),
 ('audit.read','Audit','Ver auditoria'),
 ('connectors.read','Connectors','Ver conectores'),('connectors.manage','Connectors','Administrar conectores'),
 ('validation.read','Validation','Ver validacoes'),('validation.manage','Validation','Administrar validacoes');

insert into public.role_permissions (role, permission_key) select 'super_admin', key from public.permissions;
insert into public.role_permissions (role, permission_key) select 'workspace_admin', key from public.permissions;
insert into public.role_permissions (role, permission_key) select 'manager', key from public.permissions where key in ('workspace.read','projects.read','projects.write','documents.read','documents.write','executions.read','executions.run','libraries.read','libraries.write','users.read','settings.read','audit.read','connectors.read','validation.read');
insert into public.role_permissions (role, permission_key) select 'editor', key from public.permissions where key in ('workspace.read','projects.read','projects.write','documents.read','documents.write','executions.read','executions.run','libraries.read','libraries.write','validation.read');
insert into public.role_permissions (role, permission_key) select 'reviewer', key from public.permissions where key in ('workspace.read','projects.read','documents.read','executions.read','libraries.read','validation.read','validation.manage');
insert into public.role_permissions (role, permission_key) select 'viewer', key from public.permissions where key in ('workspace.read','projects.read','documents.read','executions.read','libraries.read');

insert into public.workspaces (id, name, slug, domain, plan, status)
values ('11111111-1111-1111-1111-111111111111','ClauseForge Demo','clauseforge-demo','demo.clauseforge.app','enterprise','active');

insert into public.groups (workspace_id, key, name, description, is_system) values
 (null,'global_admins','Administradores Globais','Administram toda a plataforma',true),
 ('11111111-1111-1111-1111-111111111111','workspace_admins','Administradores Workspace','Administram o workspace',true),
 ('11111111-1111-1111-1111-111111111111','legal','Juridico','Time juridico',true),
 ('11111111-1111-1111-1111-111111111111','compliance','Compliance','Time de compliance',true),
 ('11111111-1111-1111-1111-111111111111','finance','Financeiro','Time financeiro',true),
 ('11111111-1111-1111-1111-111111111111','hr','RH','Recursos humanos',true),
 ('11111111-1111-1111-1111-111111111111','readonly','Leitura','Acesso somente leitura',true);