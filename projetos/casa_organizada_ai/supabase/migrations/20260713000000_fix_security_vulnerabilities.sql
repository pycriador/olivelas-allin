-- ============================================================
-- SECURITY FIXES
-- Issues addressed:
--   1. Critical: User download activity exposed to public (template_downloads)
--   2. Warning: User ratings/comments publicly exposed (template_ratings)
--   3. Warning: User theme ratings/comments publicly exposed (theme_ratings)
--   4. Warning: Signed-In Users Can Execute SECURITY DEFINER Function (has_role)
-- ============================================================

-- ============================================================
-- FIX 1: template_downloads - restrict public access
-- ============================================================
REVOKE SELECT ON public.template_downloads FROM anon;

DROP POLICY IF EXISTS "template_downloads_read" ON public.template_downloads;

CREATE POLICY "template_downloads_read_own" ON public.template_downloads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'global_admin'));

-- ============================================================
-- FIX 2: template_ratings - hide user identity from anon
-- ============================================================
REVOKE SELECT ON public.template_ratings FROM anon;

CREATE OR REPLACE VIEW public.public_template_ratings AS
SELECT
  id,
  template_id,
  rating,
  comment,
  created_at,
  updated_at
FROM public.template_ratings;

GRANT SELECT ON public.public_template_ratings TO anon;

-- ============================================================
-- FIX 3: theme_ratings - hide user identity from anon
-- ============================================================
REVOKE SELECT ON public.theme_ratings FROM anon;

CREATE OR REPLACE VIEW public.public_theme_ratings AS
SELECT
  id,
  theme_id,
  rating,
  comment,
  created_at,
  updated_at
FROM public.theme_ratings;

GRANT SELECT ON public.public_theme_ratings TO anon;

-- ============================================================
-- FIX 4: has_role - prevent users from querying other users' roles
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = _user_id OR
     EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'global_admin'::public.app_role) THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    );
  END IF;
  RETURN FALSE;
END;
$$;
