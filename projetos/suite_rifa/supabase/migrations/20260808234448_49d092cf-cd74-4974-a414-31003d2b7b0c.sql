
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  legal_name TEXT,
  document TEXT,
  email TEXT,
  phone TEXT,
  status public.org_status NOT NULL DEFAULT 'ACTIVE',
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#4f46e5',
  secondary_color TEXT NOT NULL DEFAULT '#0f172a',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_organizations_status ON public.organizations(status);
CREATE INDEX idx_organizations_created_at ON public.organizations(created_at DESC);
CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.org_role NOT NULL DEFAULT 'MEMBER',
  status public.membership_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
CREATE INDEX idx_memberships_org ON public.organization_memberships(organization_id);
CREATE INDEX idx_memberships_user ON public.organization_memberships(user_id);
CREATE INDEX idx_memberships_org_status ON public.organization_memberships(organization_id, status);
CREATE TRIGGER memberships_updated_at BEFORE UPDATE ON public.organization_memberships
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.org_role NOT NULL DEFAULT 'MEMBER',
  token_hash TEXT NOT NULL UNIQUE,
  status public.invitation_status NOT NULL DEFAULT 'INVITED',
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invitations_org_status ON public.organization_invitations(organization_id, status);
CREATE INDEX idx_invitations_email ON public.organization_invitations(lower(email));

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  actor_user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_org_created ON public.audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);

-- Security helpers (definer, avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id UUID, _user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE organization_id = _org_id AND user_id = _user_id AND status = 'ACTIVE'
  );
$$;

CREATE OR REPLACE FUNCTION public.org_role_of(_org_id UUID, _user_id UUID DEFAULT auth.uid())
RETURNS public.org_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.organization_memberships
  WHERE organization_id = _org_id AND user_id = _user_id AND status = 'ACTIVE';
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(_org_id UUID, _roles public.org_role[], _user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE organization_id = _org_id AND user_id = _user_id
      AND status = 'ACTIVE' AND role = ANY(_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.org_is_active(_org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organizations WHERE id = _org_id AND status = 'ACTIVE');
$$;

GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
GRANT SELECT ON public.organization_memberships TO authenticated;
GRANT ALL ON public.organization_memberships TO service_role;
GRANT SELECT ON public.organization_invitations TO authenticated;
GRANT ALL ON public.organization_invitations TO service_role;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orgs_select_members" ON public.organizations FOR SELECT TO authenticated
USING (public.is_org_member(id) OR public.is_global_admin());

CREATE POLICY "orgs_update_admins" ON public.organizations FOR UPDATE TO authenticated
USING (
  public.is_global_admin()
  OR (public.has_org_role(id, ARRAY['OWNER','ADMIN']::public.org_role[]) AND status = 'ACTIVE')
)
WITH CHECK (
  public.is_global_admin()
  OR (public.has_org_role(id, ARRAY['OWNER','ADMIN']::public.org_role[]) AND status = 'ACTIVE')
);

CREATE POLICY "memberships_select_same_org" ON public.organization_memberships FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_org_member(organization_id) OR public.is_global_admin());

CREATE POLICY "invitations_select_admins" ON public.organization_invitations FOR SELECT TO authenticated
USING (public.has_org_role(organization_id, ARRAY['OWNER','ADMIN']::public.org_role[]) OR public.is_global_admin());

CREATE POLICY "audit_select_org_admins" ON public.audit_logs FOR SELECT TO authenticated
USING (
  public.is_global_admin()
  OR (organization_id IS NOT NULL AND public.has_org_role(organization_id, ARRAY['OWNER','ADMIN']::public.org_role[]))
);

REVOKE EXECUTE ON FUNCTION public.is_global_admin(UUID) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_org_member(UUID, UUID) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.org_role_of(UUID, UUID) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_org_role(UUID, public.org_role[], UUID) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.org_is_active(UUID) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_global_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_role_of(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_org_role(UUID, public.org_role[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_is_active(UUID) TO authenticated;
