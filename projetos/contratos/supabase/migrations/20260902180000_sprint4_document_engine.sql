-- Sprint 4 · ClauseForge Document Engine
-- Data Binding, Rules Engine, Visual Flow Builder, Builder, Execution, Validation e Export.
-- Extende o schema da fundação (Sprint 1) e do AI Foundation (Sprint 2).
-- Princípio central: "Projeto é a unidade de automação documental".

-- ============================================================
-- Novos enums
-- ============================================================

create type public.flow_node_kind as enum (
  'start','load_data','validate','transform','rules','build_document','human_review','approval','generate','export','end'
);
create type public.flow_connection_kind as enum ('success','failure','condition_true','condition_false');
create type public.builder_block_kind as enum (
  'section','paragraph','clause','variable','condition','list','table','image','page_break','text'
);
create type public.document_status as enum ('generated','edited','exported');
create type public.validation_level as enum ('error','warning','info');
create type public.validation_scope as enum ('data','variables','rules','clauses','builder','workflow','document');
create type public.execution_log_level as enum ('info','success','warning','error');
create type public.mapping_value_kind as enum ('field','constant','expression');

-- ============================================================
-- Altera data_sources para dar suporte a fontes globais (workspace)
-- ============================================================

alter table public.data_sources add column workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.data_sources alter column project_id drop not null;
alter table public.data_sources add column kind text;
alter table public.data_sources add column description text;
alter table public.data_sources add column is_active boolean not null default true;
alter table public.data_sources add column updated_at timestamptz not null default now();
create trigger data_sources_updated before update on public.data_sources for each row execute function public.set_updated_at();

-- Fontes globais vivem no workspace; fontes de projeto pertencem ao projeto.
-- Mantém RLS: fonte global via membro do workspace; fonte de projeto via projeto.

-- ============================================================
-- builders · campos adicionais
-- ============================================================

alter table public.builders add column description text;
alter table public.builders add column status text not null default 'draft';
alter table public.builders add column updated_at timestamptz not null default now();
create trigger builders_updated before update on public.builders for each row execute function public.set_updated_at();

-- ============================================================
-- rules · campos adicionais
-- ============================================================

alter table public.rules add column description text;
alter table public.rules add column message text;
alter table public.rules add column severity text not null default 'error';
alter table public.rules add column order_seq integer not null default 0;
alter table public.rules add column updated_at timestamptz not null default now();
create trigger rules_updated before update on public.rules for each row execute function public.set_updated_at();

-- ============================================================
-- executions · campos adicionais
-- ============================================================

alter table public.executions add column source_id uuid;
alter table public.executions add column record_id text;
alter table public.executions add column version_number integer;
alter table public.executions add column duration_ms integer;
alter table public.executions add column context jsonb not null default '{}'::jsonb;

-- ============================================================
-- generated_documents · conteúdo, status, versão e edição
-- ============================================================

alter table public.generated_documents add column content text;
alter table public.generated_documents add column content_format text not null default 'markdown';
alter table public.generated_documents add column document_status public.document_status not null default 'generated';
alter table public.generated_documents add column project_version integer;
alter table public.generated_documents add column version integer not null default 1;
alter table public.generated_documents add column edited_at timestamptz;

-- ============================================================
-- project_data_sources · projeto referencia fontes globais
-- ============================================================

create table public.project_data_sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  data_source_id uuid not null references public.data_sources(id) on delete cascade,
  alias text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (project_id, data_source_id)
);
grant select, insert, update, delete on public.project_data_sources to authenticated;
grant all on public.project_data_sources to service_role;

-- ============================================================
-- variable_mappings · Fonte → Campo → Variável
-- ============================================================

create table public.variable_mappings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  variable_id uuid not null references public.variables(id) on delete cascade,
  source_id uuid,
  field_path text,
  value_kind public.mapping_value_kind not null default 'field',
  constant_value jsonb,
  expression text,
  transform text,
  fallback jsonb,
  is_required boolean not null default false,
  created_at timestamptz not null default now(),
  unique (project_id, variable_id)
);
grant select, insert, update, delete on public.variable_mappings to authenticated;
grant all on public.variable_mappings to service_role;

-- ============================================================
-- flows · orquestração visual
-- ============================================================

create table public.flows (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.flows to authenticated;
grant all on public.flows to service_role;
create trigger flows_updated before update on public.flows for each row execute function public.set_updated_at();

create table public.flow_nodes (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references public.flows(id) on delete cascade,
  kind public.flow_node_kind not null,
  title text,
  config jsonb not null default '{}'::jsonb,
  position_x double precision not null default 0,
  position_y double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.flow_nodes to authenticated;
grant all on public.flow_nodes to service_role;
create trigger flow_nodes_updated before update on public.flow_nodes for each row execute function public.set_updated_at();

create table public.flow_connections (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references public.flows(id) on delete cascade,
  from_node_id uuid not null references public.flow_nodes(id) on delete cascade,
  to_node_id uuid not null references public.flow_nodes(id) on delete cascade,
  kind public.flow_connection_kind not null default 'success',
  condition jsonb,
  created_at timestamptz not null default now(),
  unique (from_node_id, kind)
);
grant select, insert, update, delete on public.flow_connections to authenticated;
grant all on public.flow_connections to service_role;

-- ============================================================
-- builder_blocks · documento estruturado (Editor Visual)
-- ============================================================

create table public.builder_blocks (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid not null references public.builders(id) on delete cascade,
  kind public.builder_block_kind not null default 'section',
  title text,
  content text,
  clause_id uuid,
  clause_version integer,
  condition jsonb,
  order_seq integer not null default 0,
  parent_id uuid references public.builder_blocks(id) on delete cascade,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.builder_blocks to authenticated;
grant all on public.builder_blocks to service_role;
create trigger builder_blocks_updated before update on public.builder_blocks for each row execute function public.set_updated_at();

-- ============================================================
-- validation_results · centro de validação
-- ============================================================

create table public.validation_results (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  scope public.validation_scope not null,
  level public.validation_level not null default 'info',
  code text,
  message text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.validation_results to authenticated;
grant all on public.validation_results to service_role;

-- ============================================================
-- execution_logs · trilha de execução
-- ============================================================

create table public.execution_logs (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.executions(id) on delete cascade,
  step text not null,
  level public.execution_log_level not null default 'info',
  message text,
  data jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.execution_logs to authenticated;
grant all on public.execution_logs to service_role;

-- ============================================================
-- Permissões Sprint 4
-- ============================================================

insert into public.permissions (key, module, description) values
 ('projects.publish','Projects','Publicar versões de projeto'),
 ('projects.approve','Projects','Aprovar fluxos e documentos'),
 ('sources.read','Sources','Ver fontes de dados'),
 ('sources.write','Sources','Administrar fontes de dados'),
 ('variables.read','Variables','Ver variáveis'),
 ('variables.write','Variables','Administrar variáveis'),
 ('rules.read','Rules','Ver regras'),
 ('rules.write','Rules','Administrar regras'),
 ('flows.read','Flows','Ver fluxos'),
 ('flows.write','Flows','Administrar fluxos'),
 ('builder.read','Builder','Ver builder visual'),
 ('builder.write','Builder','Editar builder visual'),
 ('execute.run','Executions','Executar projetos'),
 ('document.export','Documents','Exportar documentos'),
 ('document.edit','Documents','Editar documentos gerados');

insert into public.role_permissions (role, permission_key) select 'super_admin', key from public.permissions where module in ('Sources','Variables','Rules','Flows','Builder') or key in ('projects.publish','projects.approve','execute.run','document.export','document.edit');
insert into public.role_permissions (role, permission_key) select 'workspace_admin', key from public.permissions where module in ('Sources','Variables','Rules','Flows','Builder') or key in ('projects.publish','projects.approve','execute.run','document.export','document.edit');
insert into public.role_permissions (role, permission_key) select 'manager', key from public.permissions where module in ('Sources','Variables','Rules','Flows','Builder') or key in ('projects.publish','execute.run','document.export','document.edit');
insert into public.role_permissions (role, permission_key) select 'editor', key from public.permissions where module in ('Sources','Variables','Rules','Flows','Builder') or key in ('execute.run','document.export','document.edit');
insert into public.role_permissions (role, permission_key) select 'reviewer', key from public.permissions where key in ('sources.read','variables.read','rules.read','flows.read','builder.read','document.export');
insert into public.role_permissions (role, permission_key) select 'viewer', key from public.permissions where key in ('sources.read','variables.read','rules.read','flows.read','builder.read');

-- ============================================================
-- RLS para novas tabelas
-- ============================================================

alter table public.project_data_sources enable row level security;
alter table public.variable_mappings enable row level security;
alter table public.flows enable row level security;
alter table public.flow_nodes enable row level security;
alter table public.flow_connections enable row level security;
alter table public.builder_blocks enable row level security;
alter table public.validation_results enable row level security;
alter table public.execution_logs enable row level security;

create policy "project scoped project_data_sources" on public.project_data_sources for all to authenticated using (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(auth.uid(), p.workspace_id))) with check (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(auth.uid(), p.workspace_id)));
create policy "project scoped variable_mappings" on public.variable_mappings for all to authenticated using (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(auth.uid(), p.workspace_id))) with check (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(auth.uid(), p.workspace_id)));
create policy "project scoped flows" on public.flows for all to authenticated using (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(auth.uid(), p.workspace_id))) with check (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(auth.uid(), p.workspace_id)));
create policy "project scoped flow_nodes" on public.flow_nodes for all to authenticated using (exists (select 1 from public.flows f join public.projects p on p.id = f.project_id where f.id = flow_id and public.is_workspace_member(auth.uid(), p.workspace_id))) with check (exists (select 1 from public.flows f join public.projects p on p.id = f.project_id where f.id = flow_id and public.is_workspace_member(auth.uid(), p.workspace_id)));
create policy "project scoped flow_connections" on public.flow_connections for all to authenticated using (exists (select 1 from public.flows f join public.projects p on p.id = f.project_id where f.id = flow_id and public.is_workspace_member(auth.uid(), p.workspace_id))) with check (exists (select 1 from public.flows f join public.projects p on p.id = f.project_id where f.id = flow_id and public.is_workspace_member(auth.uid(), p.workspace_id)));
create policy "project scoped builder_blocks" on public.builder_blocks for all to authenticated using (exists (select 1 from public.builders b join public.projects p on p.id = b.project_id where b.id = builder_id and public.is_workspace_member(auth.uid(), p.workspace_id))) with check (exists (select 1 from public.builders b join public.projects p on p.id = b.project_id where b.id = builder_id and public.is_workspace_member(auth.uid(), p.workspace_id)));
create policy "project scoped validation_results" on public.validation_results for all to authenticated using (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(auth.uid(), p.workspace_id))) with check (exists (select 1 from public.projects p where p.id = project_id and public.is_workspace_member(auth.uid(), p.workspace_id)));
create policy "execution scoped logs" on public.execution_logs for all to authenticated using (exists (select 1 from public.executions e where e.id = execution_id and public.is_workspace_member(auth.uid(), e.workspace_id))) with check (exists (select 1 from public.executions e where e.id = execution_id and public.is_workspace_member(auth.uid(), e.workspace_id)));

-- data_sources agora pode ser global (workspace_id) → política adicional (mantém a project-scoped existente)
create policy "workspace scoped global data_sources" on public.data_sources for all to authenticated using (workspace_id is not null and public.is_workspace_member(auth.uid(), workspace_id)) with check (workspace_id is not null and public.is_workspace_member(auth.uid(), workspace_id));

-- ============================================================
-- Seeds
-- OBS: seeds integer se ainda não existirem (idempotência via DO blocks).
-- ============================================================

do $$
begin
  if not exists (select 1 from public.connectors where kind = 'csv') then
    insert into public.connectors (workspace_id, name, kind, config, is_enabled)
    values ('11111111-1111-1111-1111-111111111111','CSV (arquivo)','csv','{"mode":"file"}'::jsonb,true);
  end if;
  if not exists (select 1 from public.connectors where kind = 'json') then
    insert into public.connectors (workspace_id, name, kind, config, is_enabled)
    values ('11111111-1111-1111-1111-111111111111','JSON (API)','json','{"mode":"payload"}'::jsonb,true);
  end if;
end $$;

-- Bibliotecas de cláusulas corporativas
insert into public.libraries (workspace_id, name, description)
select '11111111-1111-1111-1111-111111111111', 'Biblioteca Corporativa', 'Cláusulas-padrão para contratos do workspace'
where not exists (select 1 from public.libraries where workspace_id = '11111111-1111-1111-1111-111111111111' and name = 'Biblioteca Corporativa');

insert into public.libraries (workspace_id, name, description)
select '11111111-1111-1111-1111-111111111111', 'Cláusulas Trabalhistas', 'Cláusulas para documentos de RH'
where not exists (select 1 from public.libraries where workspace_id = '11111111-1111-1111-1111-111111111111' and name = 'Cláusulas Trabalhistas');

-- Cláusulas corporativas (fixas, vinculadas à Biblioteca Corporativa)
insert into public.clauses (library_id, title, content, tags, version)
select l.id, 'Contrato de Licenciamento de Software', 'CONTRATO DE LICENCIAMENTO DE SOFTWARE\n\nA {{cliente.nome}}, doravante denominada CONTRATANTE, inscrita no CNPJ sob o nº {{cliente.cnpj}}, e a CONTRATADA, celebrarão o presente instrumento para fins de licenciamento de software de uso não exclusivo.', array['licenciamento','software'], 1
from public.libraries l where l.name = 'Biblioteca Corporativa'
and not exists (select 1 from public.clauses c where c.library_id = l.id and c.title = 'Contrato de Licenciamento de Software');

insert into public.clauses (library_id, title, content, tags, version)
select l.id, 'SLA de Nível de Serviço', 'O CONTRATANTE terá direito a um atendimento técnico com tempo de resposta de até {{sla.resposta}} horas e disponibilidade de {{sla.disponibilidade}} do serviço.', array['sla','suporte'], 1
from public.libraries l where l.name = 'Biblioteca Corporativa'
and not exists (select 1 from public.clauses c where c.library_id = l.id and c.title = 'SLA de Nível de Serviço');

insert into public.clauses (library_id, title, content, tags, version)
select l.id, 'Confidencialidade', 'As partes se obrigam a manter sigilo sobre informações confidenciais trocadas durante a vigência do contrato e por {{confidencialidade.vigencia}} anos após seu término.', array['confidencialidade','lgpd'], 1
from public.libraries l where l.name = 'Biblioteca Corporativa'
and not exists (select 1 from public.clauses c where c.library_id = l.id and c.title = 'Confidencialidade');

insert into public.clauses (library_id, title, content, tags, version)
select l.id, 'Multa e Distrato', 'Em caso de rescisão unilateral, a parte infratora pagará multa de 10% sobre o valor total mensal atualizado.', array['multa','distrato'], 1
from public.libraries l where l.name = 'Biblioteca Corporativa'
and not exists (select 1 from public.clauses c where c.library_id = l.id and c.title = 'Multa e Distrato');

insert into public.clauses (library_id, title, content, tags, version)
select l.id, 'Rescisão Trabalhista', 'A rescisão do contrato de trabalho observará as verbas rescisórias legais, incluindo saldo de salário, férias proporcionais, 13º salário proporcional e multa de 40% sobre o FGTS, quando aplicável.', array['trabalhista','rescisão','rh'], 1
from public.libraries l where l.name = 'Cláusulas Trabalhistas'
and not exists (select 1 from public.clauses c where c.library_id = l.id and c.title = 'Rescisão Trabalhista');

insert into public.clauses (library_id, title, content, tags, version)
select l.id, 'Termo de Confidencialidade do Colaborador', 'O COLABORADOR se compromete a manter confidencialidade sobre informações da empresa, durante e após o vínculo empregatício.', array['rh','confidencialidade'], 1
from public.libraries l where l.name = 'Cláusulas Trabalhistas'
and not exists (select 1 from public.clauses c where c.library_id = l.id and c.title = 'Termo de Confidencialidade do Colaborador');

insert into public.clauses (library_id, title, content, tags, version)
select l.id, 'Declaração de Encargos Sociais', 'A empresa declara estar em dia com as obrigações previdenciárias e de FGTS, comprometendo-se a apresentar comprovações quando solicitado.', array['encargos','rh'], 1
from public.libraries l where l.name = 'Cláusulas Trabalhistas'
and not exists (select 1 from public.clauses c where c.library_id = l.id and c.title = 'Declaração de Encargos Sociais');

-- ============================================================
-- Seed · Cinco projetos demo (E2E)
-- 1. Contrato SaaS (CloudCore Software / Hospital Vida Plena)
-- 2. Prestação de Servicios (TechNova Solutions / Grupo Horizonte)
-- 3. Admissão de Funcionários (People First / Mariana Oliveira)
-- 4. Compra e Venda de Imóvel (Prime Imóveis / Rafael Almeida)
-- 5. Fornecimento Industrial (MetalWorks / Aço Forte Industrial)
-- Dados fictícios explicitamente; roteiro idempotente.
-- ============================================================

do $$
declare
  v_ws constant uuid := '11111111-1111-1111-1111-111111111111';
  v_source_id uuid;
  v_project_id uuid;
  v_builder_id uuid;
  v_flow_id uuid;
  v_variable record;
  v_clause_lic uuid;
  v_clause_sla uuid;
  v_clause_conf uuid;
begin
  -- ============================================================
  -- 1 · Contrato SaaS · CloudCore Software / Hospital Vida Plena
  -- ============================================================
  if not exists (select 1 from public.projects where workspace_id = v_ws and slug = 'contrato-saas') then
    insert into public.projects (workspace_id, name, slug, description, status)
    values (v_ws,'Contrato SaaS CloudCore','contrato-saas','Contrato de licenciamento de software entre CloudCore Software e Hospital Vida Plena','active')
    returning id into v_project_id;
  else
    select id into v_project_id from public.projects where workspace_id = v_ws and slug = 'contrato-saas';
  end if;

  if not exists (select 1 from public.data_sources where workspace_id = v_ws and name = 'Catálogo SaaS (global)') then
    insert into public.data_sources (workspace_id, name, kind, description, connector_id, config)
    values (v_ws,'Catálogo SaaS (global)','json','Catálogo central de planos e produtos SaaS', null,
      '{"records":[{"plano":"standard","valorMensal":2900,"slots":50,"sla_resposta":8,"sla_disponibilidade":"99,5%","renovacao_automatica":true},{"plano":"enterprise","valorMensal":7900,"slots":200,"sla_resposta":2,"sla_disponibilidade":"99,9%","renovacao_automatica":true}]}'::jsonb)
    returning id into v_source_id;
  else
    select id into v_source_id from public.data_sources where workspace_id = v_ws and name = 'Catálogo SaaS (global)';
  end if;
  if v_source_id is not null and not exists (select 1 from public.project_data_sources where project_id = v_project_id and data_source_id = v_source_id) then
    insert into public.project_data_sources (project_id, data_source_id, alias) values (v_project_id, v_source_id, 'catalogo');
  end if;

  if not exists (select 1 from public.data_sources where project_id = v_project_id and name = 'Cliente: Hospital Vida Plena') then
    insert into public.data_sources (project_id, name, kind, description, connector_id, config)
    values (v_project_id,'Cliente: Hospital Vida Plena','csv','Dados do cliente', null,
      '{"records":[{"nome":"Hospital Vida Plena","cnpj":"12.345.6789/0001-34","endereco":"Av. Clínica 1450","cidade":"São Paulo","email":"compras@hospitalvidaplena.com.br","plano":"enterprise"}]}'::jsonb)
    returning id into v_source_id;
  else
    select id into v_source_id from public.data_sources where project_id = v_project_id and name = 'Cliente: Hospital Vida Plena';
  end if;
  if v_source_id is not null and not exists (select 1 from public.project_data_sources where project_id = v_project_id and data_source_id = v_source_id) then
    insert into public.project_data_sources (project_id, data_source_id, alias) values (v_project_id, v_source_id, 'cliente');
  end if;

  select id into v_clause_lic from public.clauses where title = 'Contrato de Licenciamento de Software' limit 1;
  select id into v_clause_sla from public.clauses where title = 'SLA de Nível de Serviço' limit 1;
  select id into v_clause_conf from public.clauses where title = 'Confidencialidade' limit 1;

  insert into public.variables (project_id, key, label, data_type, default_value, is_required) values
    (v_project_id,'cliente.nome','Nome do cliente','text',null,true),
    (v_project_id,'cliente.cnpj','CNPJ','text',null,true),
    (v_project_id,'cliente.endereco','Endereço','text',null,true),
    (v_project_id,'cliente.cidade','Cidade','text','São Paulo',true),
    (v_project_id,'cliente.email','Email de contato','email',null,true),
    (v_project_id,'cliente.plano','Plano contratado','text','standard',true),
    (v_project_id,'plano.valorMensal','Valor mensal (BRL)','currency',2900,true),
    (v_project_id,'plano.sla_resposta','SLA resposta (h)','number',8,true),
    (v_project_id,'plano.sla_disponibilidade','SLA disponibilidade','text','99,5%',true);

  insert into public.rules (project_id, name, description, expression, severity, message, is_active) values
    (v_project_id,'Cliente requerido','Valida a integralidade dos dados do cliente','{"all":[{"field":"cliente.nome","op":"not_empty"},{"field":"cliente.cnpj","op":"not_empty"}]}'::jsonb,'error','Faltam dados de identidade do cliente',true),
    (v_project_id,'Plano Enterprise exige SLA Premium','Se o plano for Enterprise, deve incluir SLA Premium','{"if":{"field":"cliente.plano","op":"eq","value":"enterprise"},"then":{"any":[{"field":"plano.sla_resposta","op":"lte","value":2},{"field":"plano.sla_disponibilidade","op":"eq","value":"99,9%"}]}}'::jsonb,'warning','O plano Enterprise deve incluir SLA Premium',true);

  if not exists (select 1 from public.builders where project_id = v_project_id and name = 'Contrato SaaS CloudCore') then
    insert into public.builders (project_id, name, description, status, layout)
    values (v_project_id,'Contrato SaaS CloudCore','Licenciamento de software CloudCore · Hospital Vida Plena','draft','{}'::jsonb)
    returning id into v_builder_id;
  else
    select id into v_builder_id from public.builders where project_id = v_project_id and name = 'Contrato SaaS CloudCore';
  end if;

  if not exists (select 1 from public.flows where project_id = v_project_id and name = 'Fluxo SaaS CloudCore') then
    insert into public.flows (project_id, name, description, is_active)
    values (v_project_id,'Fluxo SaaS CloudCore','Carga os dados → valida → aplica regras → monta o contrato → revisão → exporta','active')
    returning id into v_flow_id;
  else
    select id into v_flow_id from public.flows where project_id = v_project_id and name = 'Fluxo SaaS CloudCore';
  end if;

  if not exists (select 1 from public.flow_nodes where flow_id = v_flow_id) then
    insert into public.flow_nodes (flow_id, kind, title, config, position_x, position_y) values
      (v_flow_id,'start','Início','{}'::jsonb,60,80),
      (v_flow_id,'load_data','Carregar dados','{"sources":["cliente","catalogo"]}'::jsonb,240,40),
      (v_flow_id,'validate','Validar dados','{}'::jsonb,420,80),
      (v_flow_id,'rules','Aplicar regras','{}'::jsonb,600,40),
      (v_flow_id,'build_document','Montar contrato','{}'::jsonb,780,80),
      (v_flow_id,'human_review','Revisão humana','{}'::jsonb,960,80),
      (v_flow_id,'generate','Gerar PDF','{}'::jsonb,1140,40),
      (v_flow_id,'export','Exportar e salvar','{}'::jsonb,1320,80),
      (v_flow_id,'end','Fim','{}'::jsonb,1500,80);
    insert into public.flow_connections (flow_id, from_node_id, to_node_id, kind)
    select v_flow_id, n1.id, n2.id, 'success' from public.flow_nodes n1, public.flow_nodes n2
    where n1.flow_id = v_flow_id and n2.flow_id = v_flow_id
    and ((n1.kind='start' and n2.kind='load_data') or (n1.kind='load_data' and n2.kind='validate')
      or (n1.kind='validate' and n2.kind='rules') or (n1.kind='rules' and n2.kind='build_document')
      or (n1.kind='build_document' and n2.kind='human_review') or (n1.kind='human_review' and n2.kind='generate')
      or (n1.kind='generate' and n2.kind='export') or (n1.kind='export' and n2.kind='end'));
  end if;

  for v_variable in select id from public.variables where project_id = v_project_id and key like 'cliente.%' loop
    if not exists (select 1 from public.variable_mappings where project_id = v_project_id and variable_id = v_variable.id) then
      insert into public.variable_mappings (project_id, variable_id, source_id, field_path, is_required)
      select v_project_id, v_variable.id, s.id, v_variable.id, true
      from public.data_sources s where s.project_id = v_project_id and s.name = 'Cliente: Hospital Vida Plena';
    end if;
  end loop;

  if not exists (select 1 from public.builder_blocks where builder_id = v_builder_id) then
    insert into public.builder_blocks (builder_id, kind, title, content, clause_id, order_seq) values
      (v_builder_id,'section','CONTRATO DE LICENCIAMENTO DE SOFTWARE',null,null,1),
      (v_builder_id,'clause','Licença','Contrato de Licenciamento de Software celebrado entre {{cliente.nome}}, inscrita no CNPJ sob o nº {{cliente.cnpj}}, com sede em {{cliente.endereco}}, e a CONTRATADA CloudCore Software.',v_clause_lic,2),
      (v_builder_id,'variable','Dados do cliente','{{cliente.nome}} · {{cliente.cnpj}} · {{cliente.email}}',null,3),
      (v_builder_id,'clause','SLA de serviços','Plano {{cliente.plano}} · Valor mensal R$ {{plano.valorMensal}} · Resposta em {{plano.sla_resposta}}h · Disponibilidade {{plano.sla_disponibilidade}}.',v_clause_sla,4),
      (v_builder_id,'condition','Cláusula Enterprise','Se o plano for Enterprise, considerar SLA Premium.',null,5),
      (v_builder_id,'clause','Confidencialidade','As partes se obrigam a manter sigilo sobre informações confidenciais.',v_clause_conf,6);
  end if;

  if not exists (select 1 from public.project_versions where project_id = v_project_id and version = 1) then
    insert into public.project_versions (project_id, version, snapshot) values (v_project_id, 1, '{"name":"Contrato SaaS CloudCore"}'::jsonb);
  end if;
  if not exists (select 1 from public.validation_results where project_id = v_project_id and code = 'plan_enterprise_sla') then
    insert into public.validation_results (project_id, scope, level, code, message) values
      (v_project_id,'rules','warning','plan_enterprise_sla','O plano Enterprise deve incluir SLA Premium');
  end if;

  -- ============================================================
  -- 2 · Prestação de Serviços · TechNova Solutions / Grupo Horizonte
  -- ============================================================
  if not exists (select 1 from public.projects where workspace_id = v_ws and slug = 'prestacao-servicos') then
    insert into public.projects (workspace_id, name, slug, description, status)
    values (v_ws,'Prestação de Serviços TechNova','prestacao-servicos','Contrato de prestação de serviços de consultoria entre TechNova Solutions e Grupo Horizonte','active')
    returning id into v_project_id;
  else
    select id into v_project_id from public.projects where workspace_id = v_ws and slug = 'prestacao-servicos';
  end if;

  if not exists (select 1 from public.data_sources where workspace_id = v_ws and name = 'Oferta TechNova (global)') then
    insert into public.data_sources (workspace_id, name, kind, description, connector_id, config)
    values (v_ws,'Oferta TechNova (global)','json','Oferta de serviços de consultoria', null,
      '{"records":[{"servico":"Consultoria Cloud","honorario":8500,"duracao_meses":12,"escopo":"Migração para infraestrutura cloud e otimização de custos"}]}'::jsonb)
    returning id into v_source_id;
  else
    select id into v_source_id from public.data_sources where workspace_id = v_ws and name = 'Oferta TechNova (global)';
  end if;
  if v_source_id is not null and not exists (select 1 from public.project_data_sources where project_id = v_project_id and data_source_id = v_source_id) then
    insert into public.project_data_sources (project_id, data_source_id, alias) values (v_project_id, v_source_id, 'oferta');
  end if;

  if not exists (select 1 from public.data_sources where project_id = v_project_id and name = 'Cliente: Grupo Horizonte') then
    insert into public.data_sources (project_id, name, kind, description, connector_id, config)
    values (v_project_id,'Cliente: Grupo Horizonte','csv','Dados do cliente', null,
      '{"records":[{"nome":"Grupo Horizonte","cnpj":"30.123.456/0001-89","endereco":"Av. Comercial 220","email":"juridico@grupohorizonte.com.br"}]}'::jsonb)
    returning id into v_source_id;
  else
    select id into v_source_id from public.data_sources where project_id = v_project_id and name = 'Cliente: Grupo Horizonte';
  end if;
  if v_source_id is not null and not exists (select 1 from public.project_data_sources where project_id = v_project_id and data_source_id = v_source_id) then
    insert into public.project_data_sources (project_id, data_source_id, alias) values (v_project_id, v_source_id, 'cliente');
  end if;

  select id into v_clause_conf from public.clauses where title = 'Confidencialidade' limit 1;
  select id into v_clause_sla from public.clauses where title = 'SLA de Nível de Serviço' limit 1;

  insert into public.variables (project_id, key, label, data_type, default_value, is_required) values
    (v_project_id,'cliente.nome','Nome do cliente','text',null,true),
    (v_project_id,'cliente.cnpj','CNPJ','text',null,true),
    (v_project_id,'cliente.endereco','Endereço','text',null,true),
    (v_project_id,'cliente.email','Email de contato','email',null,true),
    (v_project_id,'servico.nome','Serviço a prestar','text',null,true),
    (v_project_id,'servico.honorario','Honorários mensais','currency',8500,true),
    (v_project_id,'servico.duracao','Duração (meses)','number',12,true),
    (v_project_id,'servico.escopo','Escopo dos serviços','text',null,true),
    (v_project_id,'servico.sla_resposta','SLA resposta (h)','number',6,true);

  insert into public.rules (project_id, name, description, expression, severity, message, is_active) values
    (v_project_id,'Cliente requerido','Valida a integralidade dos dados do cliente','{"all":[{"field":"cliente.nome","op":"not_empty"},{"field":"cliente.cnpj","op":"not_empty"}]}'::jsonb,'error','Faltam dados de identidade do cliente',true),
    (v_project_id,'Duração mínima','A consultoria deve durar ao menos 6 meses','{"if":{"field":"servico.duracao","op":"lt","value":6},"then":false}'::jsonb,'warning','A duração recomendada é de ao menos 6 meses',true);

  if not exists (select 1 from public.builders where project_id = v_project_id) then
    insert into public.builders (project_id, name, description, status, layout)
    values (v_project_id,'Prestação de Serviços TechNova','Consultoria Cloud · Grupo Horizonte','draft','{}'::jsonb)
    returning id into v_builder_id;
  else
    select id into v_builder_id from public.builders where project_id = v_project_id;
  end if;

  if not exists (select 1 from public.flows where project_id = v_project_id) then
    insert into public.flows (project_id, name, description, is_active)
    values (v_project_id,'Fluxo Serviços','Carga dos dados → valida → aplica regras → monta o contrato → revisão → exporta','active')
    returning id into v_flow_id;
  else
    select id into v_flow_id from public.flows where project_id = v_project_id;
  end if;

  if not exists (select 1 from public.flow_nodes where flow_id = v_flow_id) then
    insert into public.flow_nodes (flow_id, kind, title, config, position_x, position_y) values
      (v_flow_id,'start','Início','{}'::jsonb,60,80),
      (v_flow_id,'load_data','Carregar dados','{"sources":["cliente","oferta"]}'::jsonb,240,40),
      (v_flow_id,'validate','Validar dados','{}'::jsonb,420,80),
      (v_flow_id,'rules','Aplicar regras','{}'::jsonb,600,40),
      (v_flow_id,'build_document','Montar contrato','{}'::jsonb,780,80),
      (v_flow_id,'human_review','Revisão humana','{}'::jsonb,960,80),
      (v_flow_id,'generate','Gerar PDF','{}'::jsonb,1140,40),
      (v_flow_id,'export','Exportar e salvar','{}'::jsonb,1320,80),
      (v_flow_id,'end','Fim','{}'::jsonb,1500,80);
    insert into public.flow_connections (flow_id, from_node_id, to_node_id, kind)
    select v_flow_id, n1.id, n2.id, 'success' from public.flow_nodes n1, public.flow_nodes n2
    where n1.flow_id = v_flow_id and n2.flow_id = v_flow_id
    and ((n1.kind='start' and n2.kind='load_data') or (n1.kind='load_data' and n2.kind='validate')
      or (n1.kind='validate' and n2.kind='rules') or (n1.kind='rules' and n2.kind='build_document')
      or (n1.kind='build_document' and n2.kind='human_review') or (n1.kind='human_review' and n2.kind='generate')
      or (n1.kind='generate' and n2.kind='export') or (n1.kind='export' and n2.kind='end'));
  end if;

  for v_variable in select id from public.variables where project_id = v_project_id and key like 'cliente.%' loop
    if not exists (select 1 from public.variable_mappings where project_id = v_project_id and variable_id = v_variable.id) then
      insert into public.variable_mappings (project_id, variable_id, source_id, field_path, is_required)
      select v_project_id, v_variable.id, s.id, v_variable.id, true
      from public.data_sources s where s.project_id = v_project_id and s.name = 'Cliente: Grupo Horizonte';
    end if;
  end loop;

  if not exists (select 1 from public.builder_blocks where builder_id = v_builder_id) then
    insert into public.builder_blocks (builder_id, kind, title, content, clause_id, order_seq) values
      (v_builder_id,'section','CONTRATO DE PRESTAÇÃO DE SERVIÇOS',null,null,1),
      (v_builder_id,'clause','Serviços','Prestação de serviços de {{servico.nome}} entre {{cliente.nome}}, CNPJ {{cliente.cnpj}}, e a CONTRATADA TechNova Solutions.',null,2),
      (v_builder_id,'variable','Dados do cliente','{{cliente.nome}} · {{cliente.cnpj}} · {{cliente.email}}',null,3),
      (v_builder_id,'clause','Honorários e SLA','Serviço {{servico.nome}} · Honorários mensais R$ {{servico.honorario}} · Duração {{servico.duracao}} meses · Escopo: {{servico.escopo}} · SLA resposta {{servico.sla_resposta}}h.',v_clause_sla,4),
      (v_builder_id,'clause','Confidencialidade','As partes se obrigam a manter sigilo sobre informações confidenciais.',v_clause_conf,5);
  end if;

  if not exists (select 1 from public.project_versions where project_id = v_project_id and version = 1) then
    insert into public.project_versions (project_id, version, snapshot) values (v_project_id, 1, '{"name":"Prestação de Serviços TechNova"}'::jsonb);
  end if;
  if not exists (select 1 from public.validation_results where project_id = v_project_id and code = 'duracao_minima') then
    insert into public.validation_results (project_id, scope, level, code, message) values
      (v_project_id,'rules','info','duracao_minima','A duração recomendada é de ao menos 6 meses');
  end if;

  -- ============================================================
  -- 3 · Admissão de Funcionários · People First / Mariana Oliveira
  -- ============================================================
  if not exists (select 1 from public.projects where workspace_id = v_ws and slug = 'admissao-funcionario') then
    insert into public.projects (workspace_id, name, slug, description, status)
    values (v_ws,'Admissão de Funcionários People First','admissao-funcionario','Pack de documentos de admissão para colaboradores de People First','active')
    returning id into v_project_id;
  else
    select id into v_project_id from public.projects where workspace_id = v_ws and slug = 'admissao-funcionario';
  end if;

  if not exists (select 1 from public.data_sources where project_id = v_project_id and name = 'Colaborador: Mariana Oliveira') then
    insert into public.data_sources (project_id, name, kind, description, connector_id, config)
    values (v_project_id,'Colaborador: Mariana Oliveira','csv','Dados do colaborador', null,
      '{"records":[{"nome":"Mariana Oliveira","cpf":"123.456.789-01","email":"mariana.oliveira@peoplefirst.com.br","cargo":"Advogada","salario":4800,"data_admissao":"2026-10-01"}]}'::jsonb)
    returning id into v_source_id;
  else
    select id into v_source_id from public.data_sources where project_id = v_project_id and name = 'Colaborador: Mariana Oliveira';
  end if;
  if v_source_id is not null and not exists (select 1 from public.project_data_sources where project_id = v_project_id and data_source_id = v_source_id) then
    insert into public.project_data_sources (project_id, data_source_id, alias) values (v_project_id, v_source_id, 'colaborador');
  end if;

  select id into v_clause_conf from public.clauses where title = 'Termo de Confidencialidade do Colaborador' limit 1;

  insert into public.variables (project_id, key, label, data_type, default_value, is_required) values
    (v_project_id,'colaborador.nome','Nome do colaborador','text',null,true),
    (v_project_id,'colaborador.cpf','CPF','text',null,true),
    (v_project_id,'colaborador.email','Email corporativo','email',null,true),
    (v_project_id,'colaborador.cargo','Cargo','text',null,true),
    (v_project_id,'colaborador.salario','Salário mensal','currency',4800,true),
    (v_project_id,'colaborador.data_admissao','Data de admissão','date',null,true);

  insert into public.rules (project_id, name, description, expression, severity, message, is_active) values
    (v_project_id,'Colaborador requerido','Valida os dados do colaborador','{"all":[{"field":"colaborador.nome","op":"not_empty"},{"field":"colaborador.cpf","op":"not_empty"},{"field":"colaborador.email","op":"not_empty"}]}'::jsonb,'error','Faltam dados do colaborador',true);

  if not exists (select 1 from public.builders where project_id = v_project_id) then
    insert into public.builders (project_id, name, description, status, layout)
    values (v_project_id,'Admissão People First','Pack de admissão · Mariana Oliveira','draft','{}'::jsonb)
    returning id into v_builder_id;
  else
    select id into v_builder_id from public.builders where project_id = v_project_id;
  end if;

  if not exists (select 1 from public.flows where project_id = v_project_id) then
    insert into public.flows (project_id, name, description, is_active)
    values (v_project_id,'Fluxo Admissão','Carga dos dados → valida → aplica regras → monta o pack → revisão → exporta','active')
    returning id into v_flow_id;
  else
    select id into v_flow_id from public.flows where project_id = v_project_id;
  end if;

  if not exists (select 1 from public.flow_nodes where flow_id = v_flow_id) then
    insert into public.flow_nodes (flow_id, kind, title, config, position_x, position_y) values
      (v_flow_id,'start','Início','{}'::jsonb,60,80),
      (v_flow_id,'load_data','Carregar dados','{"sources":["colaborador"]}'::jsonb,240,40),
      (v_flow_id,'validate','Validar dados','{}'::jsonb,420,80),
      (v_flow_id,'rules','Aplicar regras','{}'::jsonb,600,40),
      (v_flow_id,'build_document','Montar pack','{}'::jsonb,780,80),
      (v_flow_id,'human_review','Revisão humana','{}'::jsonb,960,80),
      (v_flow_id,'generate','Gerar PDF','{}'::jsonb,1140,40),
      (v_flow_id,'export','Exportar e salvar','{}'::jsonb,1320,80),
      (v_flow_id,'end','Fim','{}'::jsonb,1500,80);
    insert into public.flow_connections (flow_id, from_node_id, to_node_id, kind)
    select v_flow_id, n1.id, n2.id, 'success' from public.flow_nodes n1, public.flow_nodes n2
    where n1.flow_id = v_flow_id and n2.flow_id = v_flow_id
    and ((n1.kind='start' and n2.kind='load_data') or (n1.kind='load_data' and n2.kind='validate')
      or (n1.kind='validate' and n2.kind='rules') or (n1.kind='rules' and n2.kind='build_document')
      or (n1.kind='build_document' and n2.kind='human_review') or (n1.kind='human_review' and n2.kind='generate')
      or (n1.kind='generate' and n2.kind='export') or (n1.kind='export' and n2.kind='end'));
  end if;

  for v_variable in select id from public.variables where project_id = v_project_id and key like 'colaborador.%' loop
    if not exists (select 1 from public.variable_mappings where project_id = v_project_id and variable_id = v_variable.id) then
      insert into public.variable_mappings (project_id, variable_id, source_id, field_path, is_required)
      select v_project_id, v_variable.id, s.id, v_variable.id, true
      from public.data_sources s where s.project_id = v_project_id and s.name = 'Colaborador: Mariana Oliveira';
    end if;
  end loop;

  if not exists (select 1 from public.builder_blocks where builder_id = v_builder_id) then
    insert into public.builder_blocks (builder_id, kind, title, content, clause_id, order_seq) values
      (v_builder_id,'section','PACK DE ADMISSÃO',null,null,1),
      (v_builder_id,'variable','Dados do colaborador','{{colaborador.nome}} · {{colaborador.cpf}} · {{colaborador.email}}',null,2),
      (v_builder_id,'clause','Confidencialidade do colaborador','Confidencialidade aplicável a partir da admissão em {{colaborador.data_admissao}}.',v_clause_conf,3);
  end if;

  if not exists (select 1 from public.project_versions where project_id = v_project_id and version = 1) then
    insert into public.project_versions (project_id, version, snapshot) values (v_project_id, 1, '{"name":"Admissão People First"}'::jsonb);
  end if;

  -- ============================================================
  -- 4 · Compra e Venda de Imóvel · Prime Imóveis / Rafael Almeida
  -- ============================================================
  if not exists (select 1 from public.projects where workspace_id = v_ws and slug = 'compra-venda-imovel') then
    insert into public.projects (workspace_id, name, slug, description, status)
    values (v_ws,'Compra e Venda de Imóvel Prime','compra-venda-imovel','Contrato de compra e venda de imóvel entre Prime Imóveis e Rafael Almeida','active')
    returning id into v_project_id;
  else
    select id into v_project_id from public.projects where workspace_id = v_ws and slug = 'compra-venda-imovel';
  end if;

  if not exists (select 1 from public.data_sources where project_id = v_project_id and name = 'Comprador: Rafael Almeida') then
    insert into public.data_sources (project_id, name, kind, description, connector_id, config)
    values (v_project_id,'Comprador: Rafael Almeida','csv','Dados do comprador', null,
      '{"records":[{"nome":"Rafael Almeida","cpf":"111.222.333-44","endereco":"Rua das Flores 123","email":"rafael.almeida@email.com","imovel_endereco":"Av. Principal 890","preco":450000,"sinal_pct":10}]}'::jsonb)
    returning id into v_source_id;
  else
    select id into v_source_id from public.data_sources where project_id = v_project_id and name = 'Comprador: Rafael Almeida';
  end if;
  if v_source_id is not null and not exists (select 1 from public.project_data_sources where project_id = v_project_id and data_source_id = v_source_id) then
    insert into public.project_data_sources (project_id, data_source_id, alias) values (v_project_id, v_source_id, 'comprador');
  end if;

  insert into public.variables (project_id, key, label, data_type, default_value, is_required) values
    (v_project_id,'comprador.nome','Nome do comprador','text',null,true),
    (v_project_id,'comprador.cpf','CPF','text',null,true),
    (v_project_id,'comprador.email','Email de contato','email',null,true),
    (v_project_id,'comprador.imovel_endereco','Endereço do imóvel','text',null,true),
    (v_project_id,'comprador.preco','Preço de venda','currency',450000,true),
    (v_project_id,'comprador.sinal_pct','Percentual de sinal','number',10,true);

  insert into public.rules (project_id, name, description, expression, severity, message, is_active) values
    (v_project_id,'Comprador requerido','Valida os dados do comprador e do imóvel','{"all":[{"field":"comprador.nome","op":"not_empty"},{"field":"comprador.cpf","op":"not_empty"},{"field":"comprador.imovel_endereco","op":"not_empty"}]}'::jsonb,'error','Faltam dados do comprador ou do imóvel',true),
    (v_project_id,'Sinal mínimo de 10%','O sinal deve representar ao menos 10% do preço','{"if":{"field":"comprador.sinal_pct","op":"lt","value":10},"then":false}'::jsonb,'warning','O sinal recomendado é de ao menos 10% do preço',true);

  if not exists (select 1 from public.builders where project_id = v_project_id) then
    insert into public.builders (project_id, name, description, status, layout)
    values (v_project_id,'Compra e Venda Prime','Compra e venda · Rafael Almeida','draft','{}'::jsonb)
    returning id into v_builder_id;
  else
    select id into v_builder_id from public.builders where project_id = v_project_id;
  end if;

  if not exists (select 1 from public.flows where project_id = v_project_id) then
    insert into public.flows (project_id, name, description, is_active)
    values (v_project_id,'Fluxo CompraVenda','Carga dos dados → valida → aplica regras → monta o contrato → revisão → exporta','active')
    returning id into v_flow_id;
  else
    select id into v_flow_id from public.flows where project_id = v_project_id;
  end if;

  if not exists (select 1 from public.flow_nodes where flow_id = v_flow_id) then
    insert into public.flow_nodes (flow_id, kind, title, config, position_x, position_y) values
      (v_flow_id,'start','Início','{}'::jsonb,60,80),
      (v_flow_id,'load_data','Carregar dados','{"sources":["comprador"]}'::jsonb,240,40),
      (v_flow_id,'validate','Validar dados','{}'::jsonb,420,80),
      (v_flow_id,'rules','Aplicar regras','{}'::jsonb,600,40),
      (v_flow_id,'build_document','Montar contrato','{}'::jsonb,780,80),
      (v_flow_id,'human_review','Revisão humana','{}'::jsonb,960,80),
      (v_flow_id,'generate','Gerar PDF','{}'::jsonb,1140,40),
      (v_flow_id,'export','Exportar e salvar','{}'::jsonb,1320,80),
      (v_flow_id,'end','Fim','{}'::jsonb,1500,80);
    insert into public.flow_connections (flow_id, from_node_id, to_node_id, kind)
    select v_flow_id, n1.id, n2.id, 'success' from public.flow_nodes n1, public.flow_nodes n2
    where n1.flow_id = v_flow_id and n2.flow_id = v_flow_id
    and ((n1.kind='start' and n2.kind='load_data') or (n1.kind='load_data' and n2.kind='validate')
      or (n1.kind='validate' and n2.kind='rules') or (n1.kind='rules' and n2.kind='build_document')
      or (n1.kind='build_document' and n2.kind='human_review') or (n1.kind='human_review' and n2.kind='generate')
      or (n1.kind='generate' and n2.kind='export') or (n1.kind='export' and n2.kind='end'));
  end if;

  for v_variable in select id from public.variables where project_id = v_project_id and key like 'comprador.%' loop
    if not exists (select 1 from public.variable_mappings where project_id = v_project_id and variable_id = v_variable.id) then
      insert into public.variable_mappings (project_id, variable_id, source_id, field_path, is_required)
      select v_project_id, v_variable.id, s.id, v_variable.id, true
      from public.data_sources s where s.project_id = v_project_id and s.name = 'Comprador: Rafael Almeida';
    end if;
  end loop;

  if not exists (select 1 from public.builder_blocks where builder_id = v_builder_id) then
    insert into public.builder_blocks (builder_id, kind, title, content, clause_id, order_seq) values
      (v_builder_id,'section','CONTRATO DE COMPRA E VENDA',null,null,1),
      (v_builder_id,'variable','Dados do comprador','{{comprador.nome}} · {{comprador.cpf}} · {{comprador.email}}',null,2),
      (v_builder_id,'clause','Objeto da compra e venda','Entrega do imóvel em {{comprador.imovel_endereco}} pelo preço de R$ {{comprador.preco}}, com sinal inicial de {{comprador.sinal_pct}}%.',null,3);
  end if;

  if not exists (select 1 from public.project_versions where project_id = v_project_id and version = 1) then
    insert into public.project_versions (project_id, version, snapshot) values (v_project_id, 1, '{"name":"Compra e Venda de Imóvel Prime"}'::jsonb);
  end if;

  -- ============================================================
  -- 5 · Fornecimento Industrial · MetalWorks / Aço Forte Industrial
  -- ============================================================
  if not exists (select 1 from public.projects where workspace_id = v_ws and slug = 'fornecimento-industrial') then
    insert into public.projects (workspace_id, name, slug, description, status)
    values (v_ws,'Fornecimento Industrial MetalWorks','fornecimento-industrial','Contrato de fornecimento industrial entre MetalWorks e Aço Forte Industrial','active')
    returning id into v_project_id;
  else
    select id into v_project_id from public.projects where workspace_id = v_ws and slug = 'fornecimento-industrial';
  end if;

  if not exists (select 1 from public.data_sources where project_id = v_project_id and name = 'Cliente: Aço Forte Industrial') then
    insert into public.data_sources (project_id, name, kind, description, connector_id, config)
    values (v_project_id,'Cliente: Aço Forte Industrial','csv','Dados do cliente industrial', null,
      '{"records":[{"nome":"Aço Forte Industrial","cnpj":"12.345.678/0001-90","endereco":"Parque Industrial Norte 45","email":"compras@acoforte.com.br","material":"Aço laminado","toneladas":1200,"preco_tonelada":1850,"entrega_dias":45}]}'::jsonb)
    returning id into v_source_id;
  else
    select id into v_source_id from public.data_sources where project_id = v_project_id and name = 'Cliente: Aço Forte Industrial';
  end if;
  if v_source_id is not null and not exists (select 1 from public.project_data_sources where project_id = v_project_id and data_source_id = v_source_id) then
    insert into public.project_data_sources (project_id, data_source_id, alias) values (v_project_id, v_source_id, 'cliente');
  end if;

  insert into public.variables (project_id, key, label, data_type, default_value, is_required) values
    (v_project_id,'cliente.nome','Nome do cliente','text',null,true),
    (v_project_id,'cliente.cnpj','CNPJ','text',null,true),
    (v_project_id,'cliente.endereco','Endereço','text',null,true),
    (v_project_id,'cliente.email','Email de contato','email',null,true),
    (v_project_id,'material.nome','Material fornecido','text',null,true),
    (v_project_id,'material.toneladas','Toneladas','number',1200,true),
    (v_project_id,'material.preco_tonelada','Preço por tonelada','currency',1850,true),
    (v_project_id,'material.entrega_dias','Prazo de entrega (dias)','number',45,true);

  insert into public.rules (project_id, name, description, expression, severity, message, is_active) values
    (v_project_id,'Cliente requerido','Valida os dados do cliente e do material','{"all":[{"field":"cliente.nome","op":"not_empty"},{"field":"cliente.cnpj","op":"not_empty"},{"field":"material.nome","op":"not_empty"}]}'::jsonb,'error','Faltam dados do cliente ou do material',true);

  if not exists (select 1 from public.builders where project_id = v_project_id) then
    insert into public.builders (project_id, name, description, status, layout)
    values (v_project_id,'Fornecimento MetalWorks','Fornecimento industrial · Aço Forte','draft','{}'::jsonb)
    returning id into v_builder_id;
  else
    select id into v_builder_id from public.builders where project_id = v_project_id;
  end if;

  if not exists (select 1 from public.flows where project_id = v_project_id) then
    insert into public.flows (project_id, name, description, is_active)
    values (v_project_id,'Fluxo Fornecimento','Carga dos dados → valida → aplica regras → monta o contrato → revisão → exporta','active')
    returning id into v_flow_id;
  else
    select id into v_flow_id from public.flows where project_id = v_project_id;
  end if;

  if not exists (select 1 from public.flow_nodes where flow_id = v_flow_id) then
    insert into public.flow_nodes (flow_id, kind, title, config, position_x, position_y) values
      (v_flow_id,'start','Início','{}'::jsonb,60,80),
      (v_flow_id,'load_data','Carregar dados','{"sources":["cliente"]}'::jsonb,240,40),
      (v_flow_id,'validate','Validar dados','{}'::jsonb,420,80),
      (v_flow_id,'rules','Aplicar regras','{}'::jsonb,600,40),
      (v_flow_id,'build_document','Montar contrato','{}'::jsonb,780,80),
      (v_flow_id,'human_review','Revisão humana','{}'::jsonb,960,80),
      (v_flow_id,'generate','Gerar PDF','{}'::jsonb,1140,40),
      (v_flow_id,'export','Exportar e salvar','{}'::jsonb,1320,80),
      (v_flow_id,'end','Fim','{}'::jsonb,1500,80);
    insert into public.flow_connections (flow_id, from_node_id, to_node_id, kind)
    select v_flow_id, n1.id, n2.id, 'success' from public.flow_nodes n1, public.flow_nodes n2
    where n1.flow_id = v_flow_id and n2.flow_id = v_flow_id
    and ((n1.kind='start' and n2.kind='load_data') or (n1.kind='load_data' and n2.kind='validate')
      or (n1.kind='validate' and n2.kind='rules') or (n1.kind='rules' and n2.kind='build_document')
      or (n1.kind='build_document' and n2.kind='human_review') or (n1.kind='human_review' and n2.kind='generate')
      or (n1.kind='generate' and n2.kind='export') or (n1.kind='export' and n2.kind='end'));
  end if;

  for v_variable in select id from public.variables where project_id = v_project_id and key like 'cliente.%' loop
    if not exists (select 1 from public.variable_mappings where project_id = v_project_id and variable_id = v_variable.id) then
      insert into public.variable_mappings (project_id, variable_id, source_id, field_path, is_required)
      select v_project_id, v_variable.id, s.id, v_variable.id, true
      from public.data_sources s where s.project_id = v_project_id and s.name = 'Cliente: Aço Forte Industrial';
    end if;
  end loop;

  if not exists (select 1 from public.builder_blocks where builder_id = v_builder_id) then
    insert into public.builder_blocks (builder_id, kind, title, content, clause_id, order_seq) values
      (v_builder_id,'section','CONTRATO DE FORNECIMENTO INDUSTRIAL',null,null,1),
      (v_builder_id,'variable','Dados do cliente','{{cliente.nome}} · {{cliente.cnpj}} · {{cliente.email}}',null,2),
      (v_builder_id,'clause','Objeto do fornecimento','Fornecimento de {{material.nome}} no total de {{material.toneladas}} toneladas ao preço de R$ {{material.preco_tonelada}}/t, com entrega em {{material.entrega_dias}} dias.',null,3);
  end if;

  if not exists (select 1 from public.project_versions where project_id = v_project_id and version = 1) then
    insert into public.project_versions (project_id, version, snapshot) values (v_project_id, 1, '{"name":"Fornecimento Industrial MetalWorks"}'::jsonb);
  end if;
end $$;
