
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price_monthly >= 0),
  price_yearly NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price_yearly >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  trial_days INTEGER NOT NULL DEFAULT 0 CHECK (trial_days >= 0),
  status public.plan_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (plan_id, feature_key)
);

CREATE TABLE public.plan_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  limit_key TEXT NOT NULL,
  limit_value BIGINT NOT NULL DEFAULT 0,
  UNIQUE (plan_id, limit_key)
);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status public.subscription_status NOT NULL DEFAULT 'TRIALING',
  billing_interval public.billing_interval NOT NULL DEFAULT 'MONTHLY',
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_org ON public.subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.organization_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  usage_key TEXT NOT NULL,
  usage_value BIGINT NOT NULL DEFAULT 0 CHECK (usage_value >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, usage_key)
);
CREATE INDEX idx_usage_org ON public.organization_usage(organization_id);
CREATE TRIGGER usage_updated_at BEFORE UPDATE ON public.organization_usage FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT ON public.plans TO authenticated;
GRANT SELECT ON public.plan_features TO authenticated;
GRANT SELECT ON public.plan_limits TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.organization_usage TO authenticated;
GRANT ALL ON public.plans, public.plan_features, public.plan_limits, public.subscriptions, public.organization_usage TO service_role;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_select_active" ON public.plans FOR SELECT TO authenticated
USING (status = 'ACTIVE' OR public.is_global_admin());
CREATE POLICY "plans_write_global_admin" ON public.plans FOR ALL TO authenticated
USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

CREATE POLICY "plan_features_select" ON public.plan_features FOR SELECT TO authenticated USING (true);
CREATE POLICY "plan_features_write_global_admin" ON public.plan_features FOR ALL TO authenticated
USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

CREATE POLICY "plan_limits_select" ON public.plan_limits FOR SELECT TO authenticated USING (true);
CREATE POLICY "plan_limits_write_global_admin" ON public.plan_limits FOR ALL TO authenticated
USING (public.is_global_admin()) WITH CHECK (public.is_global_admin());

CREATE POLICY "subscriptions_select_org" ON public.subscriptions FOR SELECT TO authenticated
USING (public.is_org_member(organization_id) OR public.is_global_admin());

CREATE POLICY "usage_select_org" ON public.organization_usage FOR SELECT TO authenticated
USING (public.is_org_member(organization_id) OR public.is_global_admin());

INSERT INTO public.plans (name, slug, description, price_monthly, price_yearly, trial_days, status)
VALUES
 ('Free','free','Plano inicial para começar a organizar rifas.',0,0,14,'ACTIVE'),
 ('Pro','pro','Plano completo para operações profissionais.',97.00,970.00,14,'ACTIVE');

INSERT INTO public.plan_features (plan_id, feature_key, enabled)
SELECT p.id, f.key, CASE WHEN p.slug = 'pro' THEN true ELSE f.free_enabled END
FROM public.plans p
CROSS JOIN (VALUES
  ('campaigns', true),
  ('multiple_users', false),
  ('advanced_reports', false),
  ('custom_branding', false),
  ('payment_gateways', false),
  ('exports', false),
  ('api_access', false)
) AS f(key, free_enabled)
WHERE p.slug IN ('free','pro');

INSERT INTO public.plan_limits (plan_id, limit_key, limit_value)
SELECT p.id, l.key, CASE WHEN p.slug = 'pro' THEN l.pro ELSE l.free END
FROM public.plans p
CROSS JOIN (VALUES
  ('max_users', 1::BIGINT, 10::BIGINT),
  ('max_campaigns', 1, 20),
  ('max_active_campaigns', 1, 10),
  ('max_numbers_per_campaign', 1000, 100000),
  ('max_participants', 500, 50000),
  ('max_storage', 104857600, 5368709120),
  ('max_exports_per_month', 0, 100)
) AS l(key, free, pro)
WHERE p.slug IN ('free','pro');
