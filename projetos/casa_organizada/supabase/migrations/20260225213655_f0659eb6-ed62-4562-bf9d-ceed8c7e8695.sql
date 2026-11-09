
-- Auto-assign admin role for specific emails
CREATE OR REPLACE FUNCTION public.assign_role_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  user_email := NEW.email;
  
  -- Check if this email should be admin
  IF user_email IN ('willian.o.jesus@gmail.com', 'py.criador@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_role_on_signup();
