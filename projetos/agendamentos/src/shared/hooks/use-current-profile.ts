import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];
export type AppRole = Database["public"]["Enums"]["app_role"];

export interface CurrentProfile {
  profile: Profile | null;
  tenant: Tenant | null;
  roles: AppRole[];
}

async function fetchCurrentProfile(): Promise<CurrentProfile> {
  const { data: sessionData } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  const user = sessionData.session?.user;
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const companyName = params?.get("company_name") || (typeof window !== "undefined" ? localStorage.getItem("allin_company_name") : null) || "Olivelas Clínica Matriz";
  const companyId = params?.get("company_id") || (typeof window !== "undefined" ? localStorage.getItem("allin_company_id") : null) || "00000000-0000-0000-0000-000000000001";
  const userName = params?.get("user_name") || (typeof window !== "undefined" ? localStorage.getItem("allin_user_name") : null) || "Willian Jesus (SSO All In)";
  const userEmail = params?.get("user_email") || (typeof window !== "undefined" ? localStorage.getItem("allin_user_email") : null) || "willian.o.jesus@gmail.com";

  if (typeof window !== "undefined" && params?.get("company_name")) {
    localStorage.setItem("allin_company_name", companyName);
    localStorage.setItem("allin_company_id", companyId);
    localStorage.setItem("allin_user_name", userName);
    localStorage.setItem("allin_user_email", userEmail);
  }

  if (!user) {
    return {
      profile: {
        id: "00000000-0000-0000-0000-000000000001",
        email: userEmail,
        full_name: userName,
        tenant_id: companyId,
        avatar_url: null,
        phone: null,
        status: "active",
        locale: "pt-BR",
        theme: "system",
        last_login_at: new Date().toISOString(),
        timezone: "America/Sao_Paulo",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as Profile,
      tenant: {
        id: companyId,
        name: companyName,
        slug: companyId,
        timezone: "America/Sao_Paulo",
        locale: "pt-BR",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as Tenant,
      roles: ["admin" as AppRole],
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  let tenant: Tenant | null = null;
  if (profile?.tenant_id) {
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", profile.tenant_id)
      .maybeSingle();
    tenant = data ?? null;
  }

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  return {
    profile: profile ?? null,
    tenant,
    roles: (roleRows ?? []).map((r) => r.role as AppRole),
  };
}

export function useCurrentProfile() {
  return useQuery({
    queryKey: ["current-profile"],
    queryFn: fetchCurrentProfile,
    staleTime: 60_000,
  });
}
