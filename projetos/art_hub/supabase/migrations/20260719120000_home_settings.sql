-- Add homepage customization fields to settings
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS home_title TEXT DEFAULT 'Canecas - Olivelas',
  ADD COLUMN IF NOT EXISTS home_tagline TEXT DEFAULT 'arte que veste sua caneca.',
  ADD COLUMN IF NOT EXISTS home_subtitle TEXT DEFAULT 'Um catálogo curado de ilustrações e estampas. Escolha a arte perfeita, envie o código pelo WhatsApp e a gente cuida do resto.',
  ADD COLUMN IF NOT EXISTS home_collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL;
