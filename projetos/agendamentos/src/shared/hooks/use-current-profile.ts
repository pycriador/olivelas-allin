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
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { profile: null, tenant: null, roles: [] };

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
