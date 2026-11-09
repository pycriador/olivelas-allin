-- Mensagens personalizadas de WhatsApp por campanha.
-- O criador da rifa pode cadastrar, editar e excluir varias mensagens
-- e marcar uma como padrao (is_default).

-- ----------------------------------------------------------------------------
-- 1. Tabela
-- ----------------------------------------------------------------------------
CREATE TABLE public.campaign_whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Apenas uma mensagem padrao por campanha.
CREATE UNIQUE INDEX campaign_whatsapp_messages_one_default_per_campaign
  ON public.campaign_whatsapp_messages (campaign_id)
  WHERE is_default = true;

CREATE INDEX campaign_whatsapp_messages_campaign_idx
  ON public.campaign_whatsapp_messages (campaign_id);

CREATE TRIGGER campaign_whatsapp_messages_updated_at
  BEFORE UPDATE ON public.campaign_whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 2. Grants
-- ----------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_whatsapp_messages TO authenticated;
GRANT ALL ON public.campaign_whatsapp_messages TO service_role;

-- ----------------------------------------------------------------------------
-- 3. RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.campaign_whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage campaign whatsapp messages" ON public.campaign_whatsapp_messages;
CREATE POLICY "Admins manage campaign whatsapp messages" ON public.campaign_whatsapp_messages
  FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Owners manage campaign whatsapp messages" ON public.campaign_whatsapp_messages;
CREATE POLICY "Owners manage campaign whatsapp messages" ON public.campaign_whatsapp_messages
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_whatsapp_messages.campaign_id AND c.created_by = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_whatsapp_messages.campaign_id AND c.created_by = auth.uid())
  );