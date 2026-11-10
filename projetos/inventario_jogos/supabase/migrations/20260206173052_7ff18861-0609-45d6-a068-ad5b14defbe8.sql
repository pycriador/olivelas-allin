-- Drop the existing view and recreate without security_invoker
-- This makes the view run with definer privileges, allowing it to read all games
DROP VIEW IF EXISTS public.games_public;

CREATE VIEW public.games_public AS
  SELECT id, name, media_type, description, price, url, original_text, created_at
  FROM public.games;

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.games_public TO anon;
GRANT SELECT ON public.games_public TO authenticated;