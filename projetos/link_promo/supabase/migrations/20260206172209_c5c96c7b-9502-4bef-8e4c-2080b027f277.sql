
-- Create message templates table
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table  
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_url TEXT NOT NULL,
  short_url TEXT,
  product_name TEXT,
  old_price TEXT,
  new_price TEXT,
  installments TEXT,
  marketplace TEXT,
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  generated_message TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth required for this tool)
CREATE POLICY "Allow all operations on templates" ON public.message_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- Insert default templates
INSERT INTO public.message_templates (name, content, is_default) VALUES
('Promoção Simples', '🔥 OFERTA! {{nome_produto}}

💰 De: {{preco_antigo}}
✅ Por: {{preco_novo}}
📦 Em até {{parcelas}}

🔗 Compre aqui: {{link}}', true),
('Promoção Detalhada', '⚡ PROMOÇÃO IMPERDÍVEL! ⚡

📱 {{nome_produto}}

❌ Antes: {{preco_antigo}}
✅ Agora: {{preco_novo}}
💳 Parcele em {{parcelas}}

🛒 Garanta o seu: {{link}}

⏰ Corra, pode acabar a qualquer momento!', false);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
