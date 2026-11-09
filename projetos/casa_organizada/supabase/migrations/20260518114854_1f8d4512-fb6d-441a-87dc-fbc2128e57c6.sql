
-- Profiles: add blocked + email
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profiles_user_id_key') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email) VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_role_on_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE user_email TEXT;
BEGIN
  user_email := NEW.email;
  IF user_email IN ('willian.o.jesus@gmail.com', 'py.criador@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_role_on_signup();

-- Backfill
UPDATE public.profiles p SET email = u.email
FROM auth.users u WHERE p.user_id = u.id AND p.email IS NULL;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'viewer'::public.app_role FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id);

-- Admin policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Global default tasks
CREATE TABLE IF NOT EXISTS public.global_default_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  estimated_minutes int NOT NULL DEFAULT 5,
  day_of_week text,
  chain_to_next_day text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.global_default_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read global tasks" ON public.global_default_tasks;
CREATE POLICY "Authenticated can read global tasks" ON public.global_default_tasks
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Editors and admins can insert global tasks" ON public.global_default_tasks;
CREATE POLICY "Editors and admins can insert global tasks" ON public.global_default_tasks
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Editors and admins can update global tasks" ON public.global_default_tasks;
CREATE POLICY "Editors and admins can update global tasks" ON public.global_default_tasks
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Editors and admins can delete global tasks" ON public.global_default_tasks;
CREATE POLICY "Editors and admins can delete global tasks" ON public.global_default_tasks
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

-- Seed
INSERT INTO public.global_default_tasks (title, category, estimated_minutes, chain_to_next_day) VALUES
  ('Lavar louça deixada ontem','morning',5,NULL),
  ('Levar lixo separado','morning',3,NULL),
  ('Guardar itens fora do lugar','morning',5,NULL),
  ('Arrumar a cama','morning',2,NULL),
  ('Limpar bancada da cozinha','morning',3,NULL),
  ('Deixar louça de molho','evening',2,'Lavar louça deixada ontem'),
  ('Separar lixo reciclável','evening',3,'Levar lixo separado'),
  ('Preparar roupas do próximo dia','evening',3,NULL),
  ('Varredura rápida da cozinha','evening',5,NULL),
  ('Organizar itens da sala','evening',3,NULL),
  ('Trocar água dos pets','pet',2,NULL),
  ('Alimentar pets','pet',3,NULL),
  ('Limpar área de alimentação','pet',2,NULL),
  ('Recolher pelos visíveis','pet',3,NULL),
  ('Higienizar superfícies tocáveis','baby',5,NULL),
  ('Verificar itens do bebê','baby',3,NULL),
  ('Organizar fraldas e produtos','baby',2,NULL);

INSERT INTO public.global_default_tasks (title, category, estimated_minutes, day_of_week) VALUES
  ('Limpar espelho do banheiro','weekly',3,'monday'),
  ('Limpar vaso sanitário','weekly',5,'monday'),
  ('Organizar bancada do banheiro','weekly',3,'monday'),
  ('Limpar fogão','weekly',5,'tuesday'),
  ('Limpar micro-ondas','weekly',3,'tuesday'),
  ('Organizar geladeira','weekly',5,'tuesday'),
  ('Aspirar sofá','weekly',5,'wednesday'),
  ('Limpar mesa de centro','weekly',2,'wednesday'),
  ('Organizar estante','weekly',5,'wednesday'),
  ('Trocar lençóis','weekly',5,'thursday'),
  ('Organizar guarda-roupa','weekly',5,'thursday'),
  ('Limpar criado-mudo','weekly',2,'thursday'),
  ('Limpar área dos pets','weekly',5,'friday'),
  ('Organizar brinquedos','weekly',3,'friday'),
  ('Passar pano no chão','weekly',10,'saturday'),
  ('Limpar janelas','weekly',5,'saturday'),
  ('Aspirar tapetes','weekly',5,'saturday'),
  ('Verificar produtos de limpeza','weekly',3,'sunday'),
  ('Planejar semana','weekly',5,'sunday'),
  ('Limpeza profunda área dos pets','pet',10,'friday'),
  ('Lavar comedouros e bebedouros','pet',5,'friday'),
  ('Lavar brinquedos dos pets','pet',5,'friday');

INSERT INTO public.global_default_tasks (title, category, estimated_minutes, day_of_week, chain_to_next_day) VALUES
  ('Separar roupas gerais','laundry',3,'monday','Estender roupas gerais'),
  ('Colocar na máquina','laundry',2,'monday',NULL),
  ('Estender/secar','laundry',5,'monday',NULL),
  ('Recolher toalhas usadas','laundry',2,'tuesday',NULL),
  ('Lavar toalhas','laundry',2,'tuesday',NULL),
  ('Colocar toalhas limpas','laundry',3,'tuesday',NULL),
  ('Tirar roupa de cama','laundry',3,'wednesday',NULL),
  ('Lavar roupa de cama','laundry',2,'wednesday',NULL),
  ('Colocar roupa de cama limpa','laundry',5,'wednesday',NULL),
  ('Separar roupas delicadas','laundry',3,'thursday',NULL),
  ('Lavar no modo delicado','laundry',2,'thursday',NULL),
  ('Lavar roupas/caminhas dos pets','laundry',5,'friday',NULL),
  ('Lavagem extra se necessário','laundry',5,'saturday',NULL),
  ('Dobrar e guardar roupas da semana','laundry',10,'saturday',NULL);
