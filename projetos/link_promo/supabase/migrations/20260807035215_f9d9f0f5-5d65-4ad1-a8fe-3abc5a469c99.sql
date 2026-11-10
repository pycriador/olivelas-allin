
-- Add ownership columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.message_templates ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE public.products ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.message_templates ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on products" ON public.products;
DROP POLICY IF EXISTS "Allow all operations on templates" ON public.message_templates;

-- Revoke anon access
REVOKE ALL ON public.products FROM anon;
REVOKE ALL ON public.message_templates FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_templates TO authenticated;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.message_templates TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Products: owner only
CREATE POLICY "Users can view their own products"
  ON public.products FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own products"
  ON public.products FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products"
  ON public.products FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Templates: owner only, plus shared default templates are readable
CREATE POLICY "Users can view their own or default templates"
  ON public.message_templates FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (user_id IS NULL AND is_default = true));
CREATE POLICY "Users can insert their own templates"
  ON public.message_templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates"
  ON public.message_templates FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates"
  ON public.message_templates FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
