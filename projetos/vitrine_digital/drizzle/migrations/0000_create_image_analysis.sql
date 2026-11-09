CREATE TABLE public.image_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  image_url text,
  image_path text,
  image_type text,
  business_name text,
  category text,
  title text,
  summary text,
  searchable_text text,
  keywords text[] DEFAULT '{}',
  confidence numeric,
  analysis jsonb,
  phash text,
  processing_version text DEFAULT 'v1',
  model_used text,
  status text NOT NULL DEFAULT 'pending',
  error_message text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_analysis TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.image_analysis TO authenticated;
GRANT ALL ON public.image_analysis TO service_role;

ALTER TABLE public.image_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON public.image_analysis FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert" ON public.image_analysis FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public update" ON public.image_analysis FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public delete" ON public.image_analysis FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX image_analysis_created_at_idx ON public.image_analysis (created_at DESC);
