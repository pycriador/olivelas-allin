-- Security improvements migration
-- Adds: audit_log, created_by/updated_by, soft delete

-- 1. Audit log table
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  before_json JSONB,
  after_json JSONB,
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can insert audit log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE INDEX audit_log_user_idx ON public.audit_log(user_id, created_at DESC);
CREATE INDEX audit_log_entity_idx ON public.audit_log(entity, entity_id);
CREATE INDEX audit_log_action_idx ON public.audit_log(action, created_at DESC);
CREATE INDEX audit_log_created_idx ON public.audit_log(created_at DESC);

-- 2. Add created_by/updated_by to collections
ALTER TABLE public.collections
  ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Add created_by/updated_by to artworks
ALTER TABLE public.artworks
  ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Add created_by/updated_by to settings
ALTER TABLE public.settings
  ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. Soft delete columns for collections
ALTER TABLE public.collections
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN delete_reason TEXT;

-- 6. Soft delete columns for artworks
ALTER TABLE public.artworks
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN delete_reason TEXT;

-- 7. Indexes for soft delete filtering
CREATE INDEX collections_deleted_idx ON public.collections(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX artworks_deleted_idx ON public.artworks(deleted_at) WHERE deleted_at IS NOT NULL;

-- 8. Function to log audit events (callable from app)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_entity TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_before JSONB DEFAULT NULL,
  p_after JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_request_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_log (
    user_id, action, entity, entity_id,
    before_json, after_json, ip_address, user_agent, request_id
  ) VALUES (
    p_user_id, p_action, p_entity, p_entity_id,
    p_before, p_after, p_ip_address, p_user_agent, p_request_id
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_audit_event(UUID, TEXT, TEXT, UUID, JSONB, JSONB, TEXT, TEXT, TEXT) TO authenticated;
