-- ============================================================
-- SPRINT 6 — Enterprise Collaboration, Automation,
--              Integrações e PWA
-- ============================================================

-- ============================================================
-- 1. COLLABORATION ENGINE — sessões de edição em tempo real
-- ============================================================
CREATE TABLE public.collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('form','template','comment','automation')),
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','idle','away','disconnected')),
  cursor_pos JSONB,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX collab_session_entity ON public.collaboration_sessions(entity_type, entity_id);
CREATE INDEX collab_session_user ON public.collaboration_sessions(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collaboration_sessions TO authenticated;
GRANT ALL ON public.collaboration_sessions TO service_role;
ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collab_sessions_read" ON public.collaboration_sessions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "collab_sessions_own" ON public.collaboration_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 2. COMMENTS — comentários com threads e menções
-- ============================================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('form','template','task','field','event','automation')),
  entity_id UUID NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  emojis JSONB DEFAULT '[]'::jsonb,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX comments_entity ON public.comments(entity_type, entity_id, created_at);
CREATE INDEX comments_parent ON public.comments(parent_id);
CREATE INDEX comments_author ON public.comments(author_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_read" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert" ON public.comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "comments_update" ON public.comments FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "comments_delete" ON public.comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'global_admin'));

-- Comment mentions
CREATE TABLE public.comment_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);
GRANT SELECT, INSERT ON public.comment_mentions TO authenticated;
GRANT ALL ON public.comment_mentions TO service_role;
ALTER TABLE public.comment_mentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mentions_read" ON public.comment_mentions FOR SELECT TO authenticated USING (true);
CREATE POLICY "mentions_insert" ON public.comment_mentions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.comments WHERE id = comment_id AND author_id = auth.uid()));

-- ============================================================
-- 3. TIMELINE — histórico completo de alterações
-- ============================================================
CREATE TABLE public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX timeline_entity ON public.timeline_events(entity_type, entity_id, created_at DESC);
CREATE INDEX timeline_user ON public.timeline_events(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.timeline_events TO authenticated;
GRANT ALL ON public.timeline_events TO service_role;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "timeline_read" ON public.timeline_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "timeline_insert" ON public.timeline_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 4. NOTIFICATIONS — central de notificações em tempo real
-- ============================================================
CREATE TYPE public.notification_channel AS ENUM ('in_app','email','push','sms');

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'share','comment','mention','change','task_due','task_overdue',
    'reminder','automation','integration','system')),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  channel public.notification_channel NOT NULL DEFAULT 'in_app',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX notifications_unread ON public.notifications(user_id) WHERE is_read = false;
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Notification preferences
CREATE TABLE public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  share_in_app BOOLEAN NOT NULL DEFAULT true,
  share_email BOOLEAN NOT NULL DEFAULT false,
  comment_in_app BOOLEAN NOT NULL DEFAULT true,
  comment_email BOOLEAN NOT NULL DEFAULT false,
  mention_in_app BOOLEAN NOT NULL DEFAULT true,
  mention_email BOOLEAN NOT NULL DEFAULT true,
  change_in_app BOOLEAN NOT NULL DEFAULT true,
  task_due_in_app BOOLEAN NOT NULL DEFAULT true,
  task_due_email BOOLEAN NOT NULL DEFAULT true,
  reminder_in_app BOOLEAN NOT NULL DEFAULT true,
  reminder_email BOOLEAN NOT NULL DEFAULT false,
  automation_in_app BOOLEAN NOT NULL DEFAULT true,
  digest_frequency TEXT NOT NULL DEFAULT 'never' CHECK (digest_frequency IN ('never','daily','weekly')),
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_prefs_own" ON public.notification_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER notif_prefs_set_updated_at BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 5. AUTOMATION BUILDER — automações visuais
-- ============================================================
CREATE TABLE public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INT NOT NULL DEFAULT 1,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_run_at TIMESTAMPTZ,
  run_count INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX automations_owner ON public.automations(owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automations TO authenticated;
GRANT ALL ON public.automations TO service_role;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automations_own" ON public.automations
  FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "automations_admin" ON public.automations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'global_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'global_admin'));

CREATE TRIGGER automations_set_updated_at BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Automation triggers
CREATE TABLE public.automation_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'task_created','task_completed','form_submitted','form_created',
    'form_shared','calendar_event','specific_date','specific_time',
    'recurrence','webhook')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort INT NOT NULL DEFAULT 0
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_triggers TO authenticated;
GRANT ALL ON public.automation_triggers TO service_role;
ALTER TABLE public.automation_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto_triggers_own" ON public.automation_triggers
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.automations WHERE id = automation_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.automations WHERE id = automation_id AND owner_id = auth.uid()));

-- Automation conditions
CREATE TABLE public.automation_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  operator TEXT NOT NULL DEFAULT 'and' CHECK (operator IN ('and','or','not')),
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort INT NOT NULL DEFAULT 0
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_conditions TO authenticated;
GRANT ALL ON public.automation_conditions TO service_role;
ALTER TABLE public.automation_conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto_conditions_own" ON public.automation_conditions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.automations WHERE id = automation_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.automations WHERE id = automation_id AND owner_id = auth.uid()));

-- Automation actions
CREATE TABLE public.automation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'create_task','update_task','complete_task','move_form',
    'send_notification','create_event','duplicate_form',
    'generate_pdf','call_ai','log_audit','webhook')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort INT NOT NULL DEFAULT 0
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_actions TO authenticated;
GRANT ALL ON public.automation_actions TO service_role;
ALTER TABLE public.automation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto_actions_own" ON public.automation_actions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.automations WHERE id = automation_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.automations WHERE id = automation_id AND owner_id = auth.uid()));

-- Automation execution log
CREATE TABLE public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running','success','error','skipped')),
  trigger_data JSONB DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  execution_time_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX auto_logs_automation ON public.automation_logs(automation_id, created_at DESC);
GRANT SELECT, INSERT ON public.automation_logs TO authenticated;
GRANT ALL ON public.automation_logs TO service_role;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auto_logs_own" ON public.automation_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.automations WHERE id = automation_id AND owner_id = auth.uid()));
CREATE POLICY "auto_logs_insert" ON public.automation_logs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.automations WHERE id = automation_id AND owner_id = auth.uid()));

-- ============================================================
-- 6. INTEGRATION HUB — conectores OAuth e serviços externos
-- ============================================================
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN (
    'google_calendar','outlook_calendar','google_drive','onedrive',
    'dropbox','gmail','outlook_mail','zapier','make','n8n','custom')),
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  credentials JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX integrations_user ON public.integrations(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integrations_own" ON public.integrations
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER integrations_set_updated_at BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Integration logs
CREATE TABLE public.integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success','error','pending')),
  action TEXT NOT NULL,
  request JSONB DEFAULT '{}'::jsonb,
  response JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX integration_logs_int ON public.integration_logs(integration_id, created_at DESC);
GRANT SELECT, INSERT ON public.integration_logs TO authenticated;
GRANT ALL ON public.integration_logs TO service_role;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "int_logs_own" ON public.integration_logs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.integrations WHERE id = integration_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.integrations WHERE id = integration_id AND user_id = auth.uid()));

-- ============================================================
-- 7. WEBHOOKS — webhooks configuráveis
-- ============================================================
CREATE TABLE public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  http_method TEXT NOT NULL DEFAULT 'POST' CHECK (http_method IN ('GET','POST','PUT','PATCH','DELETE')),
  headers JSONB DEFAULT '{}'::jsonb,
  auth_token TEXT,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  retry_count INT NOT NULL DEFAULT 3,
  timeout_ms INT NOT NULL DEFAULT 10000,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhooks TO authenticated;
GRANT ALL ON public.webhooks TO service_role;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhooks_own" ON public.webhooks
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER webhooks_set_updated_at BEFORE UPDATE ON public.webhooks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Webhook execution logs
CREATE TABLE public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success','error','pending','retrying')),
  request_body JSONB DEFAULT '{}'::jsonb,
  response_status INT,
  response_body TEXT,
  error_message TEXT,
  attempt INT NOT NULL DEFAULT 1,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX webhook_logs_webhook ON public.webhook_logs(webhook_id, created_at DESC);
GRANT SELECT ON public.webhook_logs TO authenticated;
GRANT ALL ON public.webhook_logs TO service_role;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_logs_own" ON public.webhook_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.webhooks WHERE id = webhook_id AND user_id = auth.uid()));

-- ============================================================
-- 8. API KEYS — chaves para API pública
-- ============================================================
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX api_keys_user ON public.api_keys(user_id);
CREATE INDEX api_keys_prefix ON public.api_keys(key_prefix);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys_own" ON public.api_keys
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 9. USER SESSIONS — controle de sessões e dispositivos
-- ============================================================
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT,
  device_type TEXT CHECK (device_type IN ('desktop','tablet','mobile','unknown')),
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  is_current BOOLEAN NOT NULL DEFAULT false,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX user_sessions_user ON public.user_sessions(user_id, last_active_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.user_sessions TO authenticated;
GRANT ALL ON public.user_sessions TO service_role;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_own" ON public.user_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 10. PWA — push notification subscriptions
-- ============================================================
CREATE TABLE public.pwa_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL DEFAULT '{}'::jsonb,
  device_info TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pwa_subscriptions TO authenticated;
GRANT ALL ON public.pwa_subscriptions TO service_role;
ALTER TABLE public.pwa_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pwa_subs_own" ON public.pwa_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 11. OFFLINE SYNC — fila de sincronização
-- ============================================================
CREATE TABLE public.sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL CHECK (action IN ('create','update','delete')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','syncing','synced','conflict','error')),
  conflict_data JSONB,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sync_queue_user ON public.sync_queue(user_id, status, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sync_queue TO authenticated;
GRANT ALL ON public.sync_queue TO service_role;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_queue_own" ON public.sync_queue
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 12. PROFILE EXTENSIONS — status e disponibilidade
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online','away','busy','offline')),
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS availability TEXT NOT NULL DEFAULT 'available' CHECK (availability IN ('available','busy','dnd','away','invisible'));

-- ============================================================
-- 13. ENTERPRISE STATS — tabela de métricas consolidadas
-- ============================================================
CREATE TABLE public.enterprise_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  users_online INT NOT NULL DEFAULT 0,
  forms_shared INT NOT NULL DEFAULT 0,
  automations_executed INT NOT NULL DEFAULT 0,
  comments_made INT NOT NULL DEFAULT 0,
  active_integrations INT NOT NULL DEFAULT 0,
  syncs_performed INT NOT NULL DEFAULT 0,
  notifications_sent INT NOT NULL DEFAULT 0,
  ai_requests INT NOT NULL DEFAULT 0,
  storage_bytes BIGINT NOT NULL DEFAULT 0,
  api_requests INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (date)
);

GRANT SELECT ON public.enterprise_stats TO authenticated;
GRANT ALL ON public.enterprise_stats TO service_role;
ALTER TABLE public.enterprise_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enterprise_stats_admin" ON public.enterprise_stats
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'global_admin'));
