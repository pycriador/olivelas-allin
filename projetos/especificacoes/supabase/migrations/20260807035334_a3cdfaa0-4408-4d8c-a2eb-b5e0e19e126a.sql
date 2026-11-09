REVOKE EXECUTE ON FUNCTION public.has_app_role(text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_global_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_approved() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.register_or_bootstrap(text, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_app_role(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_global_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved() TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_or_bootstrap(text, text, text) TO authenticated;

INSERT INTO public.roles (id, name, description, system, permissions) VALUES
('role-admin-global','Admin Global','Full access to every resource, including IAM, backups and audit.',true, ARRAY['*:*']),
('role-workspace-owner','Workspace Owner','Controls an entire workspace.',true, ARRAY['workspace:*','project:*','sprint:*','delivery:*','spec:*','version:*','template:*','snippet:*','user:read','audit:read','backup:*','settings:read']),
('role-workspace-admin','Workspace Admin','Manages users and content of a workspace.',true, ARRAY['workspace:read','project:*','sprint:*','delivery:*','spec:*','version:*','template:*','snippet:*','user:read','user:update','user:create','audit:read','settings:read']),
('role-project-owner','Project Owner','Controls a single project and everything inside it.',true, ARRAY['workspace:read','project:read','project:update','sprint:*','delivery:*','spec:*','version:*','template:read','snippet:*','settings:read']),
('role-editor','Editor','Create, edit and move content.',true, ARRAY['workspace:read','project:read','project:create','project:update','sprint:read','sprint:create','sprint:update','delivery:read','delivery:create','delivery:update','spec:read','spec:create','spec:update','spec:delete','version:read','version:create','template:read','snippet:*','settings:read']),
('role-reviewer','Reviewer','Review, approve and comment only.',true, ARRAY['workspace:read','project:read','sprint:read','delivery:read','spec:read','spec:approve','spec:comment','version:read','template:read','snippet:read','settings:read']),
('role-viewer','Viewer','Read-only access.',true, ARRAY['workspace:read','project:read','sprint:read','delivery:read','spec:read','version:read','template:read','snippet:read','settings:read'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.groups (id, name, description, system, role_id) VALUES
('group-administrators','Administrators','Global administrators',true,'role-admin-global'),
('group-engineering','Engineering','Editors of specifications',true,'role-editor'),
('group-stakeholders','Stakeholders','Read-only stakeholders',true,'role-viewer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.templates (id, name, description, type, blocks) VALUES
('tpl-sprint','Sprint Plan','Objetivos, escopo e critérios de aceite de uma sprint.','sprint',
 '[{"id":"b1","type":"markdown","content":"# Sprint\n\n## Objetivo\n\n## Escopo\n"},{"id":"b2","type":"checklist","content":"- [ ] Item 1\n- [ ] Item 2"}]'::jsonb),
('tpl-adr','Architecture Decision Record','Contexto, decisão e consequências.','adr',
 '[{"id":"b1","type":"markdown","content":"# ADR\n\n## Contexto\n\n## Decisão\n\n## Consequências\n"}]'::jsonb),
('tpl-api','API Specification','Endpoints, contratos e exemplos.','api',
 '[{"id":"b1","type":"markdown","content":"# API\n\n## Endpoints\n"},{"id":"b2","type":"code","content":"GET /api/resource"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;
