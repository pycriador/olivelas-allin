CREATE TABLE public.pdf_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Layout',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX pdf_layouts_form_idx ON public.pdf_layouts(form_id);
CREATE INDEX pdf_layouts_owner_idx ON public.pdf_layouts(owner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdf_layouts TO authenticated;
GRANT ALL ON public.pdf_layouts TO service_role;

ALTER TABLE public.pdf_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their pdf layouts"
  ON public.pdf_layouts FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER pdf_layouts_updated_at
  BEFORE UPDATE ON public.pdf_layouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();