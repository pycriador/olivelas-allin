-- Tighten ai_settings access: admin-only (matching ai_prompts pattern)
-- Visitors should not see chat_model, embedding_model, temperature, etc.

-- Remove anon SELECT grant
REVOKE SELECT ON public.ai_settings FROM anon;

-- Drop the public read policy
DROP POLICY IF EXISTS "ai_settings public read" ON public.ai_settings;

-- Ensure only authenticated users can read (admin-only via RLS)
-- The existing "ai_settings admin manage" policy already covers admin CRUD.
-- Add an explicit read policy for authenticated admins.
DO $$ BEGIN
  CREATE POLICY "ai_settings admin read" ON public.ai_settings
    FOR SELECT TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
