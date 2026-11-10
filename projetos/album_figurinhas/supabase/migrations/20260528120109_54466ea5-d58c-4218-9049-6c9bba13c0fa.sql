
-- =========================
-- ROLES
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Auto profile + admin role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;

  IF NEW.email = 'willian.o.jesus@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- ALBUMS
-- =========================
CREATE TABLE public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_url TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.albums TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.albums TO authenticated;
GRANT ALL ON public.albums TO service_role;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads published albums" ON public.albums FOR SELECT TO anon, authenticated USING (is_published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manages albums ins" ON public.albums FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manages albums upd" ON public.albums FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manages albums del" ON public.albums FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- =========================
-- PAGES
-- =========================
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Página',
  order_index INTEGER NOT NULL DEFAULT 0,
  page_type TEXT NOT NULL DEFAULT 'common', -- 'cover' | 'common' | 'back_cover'
  background JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.pages (album_id, order_index);
GRANT SELECT ON public.pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads pages" ON public.pages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin pages ins" ON public.pages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin pages upd" ON public.pages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin pages del" ON public.pages FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- =========================
-- STICKERS (figurinhas / espaços de foto)
-- =========================
CREATE TABLE public.stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  x_cm NUMERIC(8,3) NOT NULL DEFAULT 1,
  y_cm NUMERIC(8,3) NOT NULL DEFAULT 1,
  width_cm NUMERIC(8,3) NOT NULL DEFAULT 5,
  height_cm NUMERIC(8,3) NOT NULL DEFAULT 7,
  rotation NUMERIC(6,2) NOT NULL DEFAULT 0,
  number INTEGER,
  number_enabled BOOLEAN NOT NULL DEFAULT true,
  number_position TEXT NOT NULL DEFAULT 'bottom-right',
  title TEXT,
  caption TEXT,
  style JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.stickers (page_id);
GRANT SELECT ON public.stickers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stickers TO authenticated;
GRANT ALL ON public.stickers TO service_role;
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads stickers" ON public.stickers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin stickers ins" ON public.stickers FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin stickers upd" ON public.stickers FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin stickers del" ON public.stickers FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- =========================
-- UPLOADS (fotos enviadas pelos visitantes para figurinhas)
-- =========================
CREATE TABLE public.uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sticker_id UUID NOT NULL REFERENCES public.stickers(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  width_px INTEGER,
  height_px INTEGER,
  crop JSONB NOT NULL DEFAULT '{}'::jsonb,
  session_id TEXT,           -- visitor anonymous session
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.uploads (sticker_id);
CREATE INDEX ON public.uploads (album_id);
GRANT SELECT, INSERT ON public.uploads TO anon, authenticated;
GRANT UPDATE, DELETE ON public.uploads TO authenticated;
GRANT ALL ON public.uploads TO service_role;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads uploads" ON public.uploads FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anyone inserts uploads" ON public.uploads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admin deletes uploads" ON public.uploads FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin updates uploads" ON public.uploads FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- =========================
-- STORAGE BUCKETS
-- =========================
INSERT INTO storage.buckets (id, name, public) VALUES ('album-assets','album-assets', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('sticker-uploads','sticker-uploads', true) ON CONFLICT (id) DO NOTHING;

-- Album assets: admin write, public read
CREATE POLICY "album-assets public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'album-assets');
CREATE POLICY "album-assets admin write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'album-assets' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "album-assets admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'album-assets' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "album-assets admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'album-assets' AND public.has_role(auth.uid(),'admin'));

-- Sticker uploads: anyone reads + uploads, admin manages
CREATE POLICY "sticker-uploads public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'sticker-uploads');
CREATE POLICY "sticker-uploads anyone insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'sticker-uploads');
CREATE POLICY "sticker-uploads admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'sticker-uploads' AND public.has_role(auth.uid(),'admin'));
