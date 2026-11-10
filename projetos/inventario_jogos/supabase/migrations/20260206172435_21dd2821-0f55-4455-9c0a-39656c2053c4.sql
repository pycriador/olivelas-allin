-- Create a public view that excludes the user_id column
CREATE VIEW public.games_public
WITH (security_invoker=on) AS
  SELECT id, name, media_type, description, price, url, original_text, created_at
  FROM public.games;

-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view games" ON public.games;

-- Create a restrictive policy that only allows the owner to SELECT from the base table
CREATE POLICY "Users can view their own games"
  ON public.games FOR SELECT
  USING (auth.uid() = user_id);

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.games_public TO anon;
GRANT SELECT ON public.games_public TO authenticated;