
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','manager','user');
CREATE TYPE public.app_permission AS ENUM (
  'manage_users','manage_groups','manage_permissions','view_dashboard',
  'create_forms','edit_forms','delete_forms','publish_forms',
  'view_responses','export_responses','view_analytics','manage_templates',
  'view_audit_logs','manage_settings'
);
CREATE TYPE public.entity_status AS ENUM ('active','inactive');
CREATE TYPE public.form_status AS ENUM ('draft','published','archived');
CREATE TYPE public.form_visibility AS ENUM ('public','private');
CREATE TYPE public.response_status AS ENUM ('complete','partial');

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- GROUPS
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status public.entity_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  avatar_url text,
  status public.entity_status NOT NULL DEFAULT 'active',
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission public.app_permission NOT NULL,
  UNIQUE (role, permission)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.group_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  permission public.app_permission NOT NULL,
  UNIQUE (group_id, permission)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_permissions TO authenticated;
GRANT ALL ON public.group_permissions TO service_role;
ALTER TABLE public.group_permissions ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER HELPERS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin');
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission public.app_permission)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = _user_id AND rp.permission = _permission
  );
$$;

CREATE OR REPLACE FUNCTION public.user_group(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT group_id FROM public.profiles WHERE id = _user_id;
$$;

-- FORMS
CREATE TABLE public.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  slug text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'other',
  status public.form_status NOT NULL DEFAULT 'draft',
  visibility public.form_visibility NOT NULL DEFAULT 'private',
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  pages jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);
CREATE INDEX forms_owner_idx ON public.forms(owner_id);
CREATE INDEX forms_slug_idx ON public.forms(slug);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forms TO authenticated;
GRANT SELECT ON public.forms TO anon;
GRANT ALL ON public.forms TO service_role;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_manage_form(_user_id uuid, _form_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.forms f
    WHERE f.id = _form_id AND (
      f.owner_id = _user_id
      OR public.has_role(_user_id, 'admin')
      OR (public.has_role(_user_id, 'manager') AND f.group_id IS NOT NULL AND f.group_id = public.user_group(_user_id))
    )
  );
$$;

CREATE TABLE public.form_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  version integer NOT NULL,
  label text NOT NULL DEFAULT '',
  schema jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (form_id, version)
);
GRANT SELECT, INSERT, DELETE ON public.form_versions TO authenticated;
GRANT SELECT ON public.form_versions TO anon;
GRANT ALL ON public.form_versions TO service_role;
ALTER TABLE public.form_versions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  form_version integer NOT NULL DEFAULT 1,
  schema_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  respondent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.response_status NOT NULL DEFAULT 'complete',
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX form_responses_form_idx ON public.form_responses(form_id, submitted_at DESC);
GRANT SELECT, INSERT, DELETE ON public.form_responses TO authenticated;
GRANT INSERT ON public.form_responses TO anon;
GRANT ALL ON public.form_responses TO service_role;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'other',
  schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  thumbnail text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_templates TO authenticated;
GRANT ALL ON public.form_templates TO service_role;
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text NOT NULL DEFAULT '',
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_created_idx ON public.audit_logs(created_at DESC);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'info',
  entity_type text,
  entity_id text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- TRIGGERS
CREATE TRIGGER groups_updated BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER forms_updated BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER templates_updated BEFORE UPDATE ON public.form_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- POLICIES
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin(auth.uid()) OR (public.has_role(auth.uid(),'manager') AND group_id = public.user_group(auth.uid())));
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin(auth.uid())) WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "profiles admin delete" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "groups read" ON public.groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "groups admin write" ON public.groups FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "roles read own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "role perms read" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "group perms read" ON public.group_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "group perms admin write" ON public.group_permissions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "forms public read" ON public.forms FOR SELECT TO anon
  USING (status = 'published' AND visibility = 'public');
CREATE POLICY "forms scoped read" ON public.forms FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.is_admin(auth.uid())
    OR (status = 'published' AND visibility = 'public')
    OR (public.has_role(auth.uid(),'manager') AND group_id IS NOT NULL AND group_id = public.user_group(auth.uid()))
  );
CREATE POLICY "forms insert own" ON public.forms FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "forms update scoped" ON public.forms FOR UPDATE TO authenticated
  USING (public.can_manage_form(auth.uid(), id)) WITH CHECK (public.can_manage_form(auth.uid(), id));
CREATE POLICY "forms delete scoped" ON public.forms FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "versions read" ON public.form_versions FOR SELECT TO authenticated
  USING (public.can_manage_form(auth.uid(), form_id));
CREATE POLICY "versions insert" ON public.form_versions FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_form(auth.uid(), form_id));
CREATE POLICY "versions delete" ON public.form_versions FOR DELETE TO authenticated
  USING (public.can_manage_form(auth.uid(), form_id));

CREATE POLICY "responses owner read" ON public.form_responses FOR SELECT TO authenticated
  USING (public.can_manage_form(auth.uid(), form_id));
CREATE POLICY "responses owner delete" ON public.form_responses FOR DELETE TO authenticated
  USING (public.can_manage_form(auth.uid(), form_id));
CREATE POLICY "responses anon insert" ON public.form_responses FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.status = 'published' AND f.visibility = 'public'));
CREATE POLICY "responses auth insert" ON public.form_responses FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.status = 'published'));

CREATE POLICY "templates read" ON public.form_templates FOR SELECT TO authenticated USING (active OR public.is_admin(auth.uid()));
CREATE POLICY "templates admin write" ON public.form_templates FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(),'manage_templates')) WITH CHECK (public.has_permission(auth.uid(),'manage_templates'));

CREATE POLICY "audit read" ON public.audit_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_permission(auth.uid(),'view_audit_logs'));
CREATE POLICY "audit insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications own" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "settings own" ON public.user_settings FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- SEED: role permissions
INSERT INTO public.role_permissions (role, permission)
SELECT 'admin', p FROM unnest(enum_range(NULL::public.app_permission)) p;
INSERT INTO public.role_permissions (role, permission) VALUES
  ('manager','view_dashboard'),('manager','manage_users'),('manager','manage_groups'),
  ('manager','create_forms'),('manager','edit_forms'),('manager','publish_forms'),
  ('manager','view_responses'),('manager','export_responses'),('manager','view_analytics'),
  ('user','view_dashboard'),('user','create_forms'),('user','edit_forms'),
  ('user','publish_forms'),('user','view_responses'),('user','export_responses'),('user','view_analytics');

-- SEED: groups
INSERT INTO public.groups (name, description) VALUES
  ('Administradores','Acesso completo à plataforma'),
  ('Managers','Gestão de formulários e respostas do grupo'),
  ('Usuários','Criação e gestão dos próprios formulários');

-- SEED: templates
INSERT INTO public.form_templates (name, description, category, schema) VALUES
 ('Pesquisa de satisfação','Meça a satisfação dos seus clientes (NPS + comentários).','survey',
  '[{"id":"pg_t1","title":"Satisfação","order":0,"fields":[{"id":"f_t1","type":"scale","label":"O quanto você recomendaria nossa empresa?","required":true,"options":[],"min":0,"max":10,"order":0},{"id":"f_t2","type":"long_text","label":"O que podemos melhorar?","required":false,"options":[],"order":1}]}]'::jsonb),
 ('Feedback','Colete feedback rápido sobre um produto ou serviço.','feedback',
  '[{"id":"pg_t2","title":"Feedback","order":0,"fields":[{"id":"f_t3","type":"rating","label":"Como você avalia sua experiência?","required":true,"options":[],"max":5,"order":0},{"id":"f_t4","type":"long_text","label":"Comentários","required":false,"options":[],"order":1}]}]'::jsonb),
 ('Cadastro','Formulário de cadastro com dados básicos de contato.','registration',
  '[{"id":"pg_t3","title":"Dados","order":0,"fields":[{"id":"f_t5","type":"short_text","label":"Nome completo","required":true,"options":[],"order":0},{"id":"f_t6","type":"email","label":"E-mail","required":true,"options":[],"order":1},{"id":"f_t7","type":"phone","label":"Telefone","required":false,"options":[],"order":2}]}]'::jsonb),
 ('Evento','Inscrição em evento com preferências do participante.','event',
  '[{"id":"pg_t4","title":"Inscrição","order":0,"fields":[{"id":"f_t8","type":"short_text","label":"Nome","required":true,"options":[],"order":0},{"id":"f_t9","type":"email","label":"E-mail","required":true,"options":[],"order":1},{"id":"f_t10","type":"select","label":"Participação","required":true,"options":[{"id":"o1","label":"Presencial","value":"presencial"},{"id":"o2","label":"Online","value":"online"}],"order":2}]}]'::jsonb),
 ('Pesquisa interna','Clima organizacional e engajamento do time.','internal',
  '[{"id":"pg_t5","title":"Pesquisa interna","order":0,"fields":[{"id":"f_t11","type":"scale","label":"Como você avalia seu nível de satisfação no trabalho?","required":true,"options":[],"min":1,"max":10,"order":0},{"id":"f_t12","type":"long_text","label":"Sugestões","required":false,"options":[],"order":1}]}]'::jsonb);
