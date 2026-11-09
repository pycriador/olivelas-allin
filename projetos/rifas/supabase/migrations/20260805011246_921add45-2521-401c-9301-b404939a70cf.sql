-- PROFILES: soft delete
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- USER ROLES: admin management
CREATE POLICY "Admins insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_global_admin());
CREATE POLICY "Admins update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());
CREATE POLICY "Admins delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.is_global_admin());
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- AUDIT LOGS: extra columns
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS old_value JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS new_value JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip TEXT;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

CREATE POLICY "Users insert own audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());
CREATE POLICY "Users view own audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (actor_id = auth.uid());
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON public.audit_logs (actor_id);

-- SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT 'null'::jsonb,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category, key)
);
GRANT SELECT ON public.settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read public settings" ON public.settings FOR SELECT TO authenticated USING (is_public OR public.is_global_admin());
CREATE POLICY "Admins insert settings" ON public.settings FOR INSERT TO authenticated WITH CHECK (public.is_global_admin());
CREATE POLICY "Admins update settings" ON public.settings FOR UPDATE TO authenticated USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());
CREATE POLICY "Admins delete settings" ON public.settings FOR DELETE TO authenticated USING (public.is_global_admin());
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STORAGE FILES
CREATE TABLE IF NOT EXISTS public.storage_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size BIGINT NOT NULL DEFAULT 0,
  folder TEXT NOT NULL DEFAULT 'uploads',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.storage_files TO authenticated;
GRANT ALL ON public.storage_files TO service_role;
ALTER TABLE public.storage_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own files" ON public.storage_files FOR SELECT TO authenticated USING (uploaded_by = auth.uid() OR public.is_global_admin());
CREATE POLICY "Users insert own files" ON public.storage_files FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "Users update own files" ON public.storage_files FOR UPDATE TO authenticated USING (uploaded_by = auth.uid() OR public.is_global_admin()) WITH CHECK (uploaded_by = auth.uid() OR public.is_global_admin());
CREATE POLICY "Users delete own files" ON public.storage_files FOR DELETE TO authenticated USING (uploaded_by = auth.uid() OR public.is_global_admin());
CREATE TRIGGER storage_files_updated_at BEFORE UPDATE ON public.storage_files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS storage_files_folder_idx ON public.storage_files (folder);
CREATE INDEX IF NOT EXISTS storage_files_uploaded_by_idx ON public.storage_files (uploaded_by);

-- SEED SETTINGS
INSERT INTO public.settings (category, key, value, description, is_public) VALUES
  ('system','platform_name','"RaffleHub"','Nome exibido da plataforma',true),
  ('system','support_email','"suporte@rafflehub.app"','E-mail de suporte',true),
  ('system','maintenance_mode','false','Bloqueia o acesso de usuários comuns',true),
  ('interface','default_theme','"light"','Tema padrão para novos usuários',true),
  ('interface','default_language','"pt-BR"','Idioma padrão',true),
  ('interface','primary_color','"#111827"','Cor principal',true),
  ('interface','secondary_color','"#f59e0b"','Cor secundária',true),
  ('interface','logo_url','""','URL do logotipo',true),
  ('interface','favicon_url','""','URL do favicon',true),
  ('security','session_timeout_minutes','120','Tempo de expiração da sessão',false),
  ('security','audit_retention_days','365','Retenção dos registros de auditoria',false),
  ('security','require_admin_approval','false','Novos usuários precisam de aprovação',false),
  ('payments','currency','"BRL"','Moeda padrão',true),
  ('payments','provider','"none"','Provedor de pagamento ativo',false),
  ('sharing','share_base_url','""','URL base para compartilhamento',true),
  ('sharing','enable_social_share','true','Habilita botões de compartilhamento',true),
  ('uploads','max_file_size_mb','10','Tamanho máximo de arquivo em MB',true),
  ('uploads','allowed_mime_types','["image/png","image/jpeg","image/webp","image/gif","application/pdf"]','Tipos de arquivo permitidos',true),
  ('notifications','email_enabled','true','Notificações por e-mail',true),
  ('notifications','digest_frequency','"daily"','Frequência do resumo',true)
ON CONFLICT (category, key) DO NOTHING;