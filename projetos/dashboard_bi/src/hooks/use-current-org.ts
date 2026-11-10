import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCurrentOrg() {
  const q = useQuery({
    queryKey: ["current-org"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_organization_id")
        .eq("id", userData.user.id)
        .maybeSingle();
      const orgId = profile?.current_organization_id;
      if (!orgId) return null;
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .maybeSingle();
      return org;
    },
  });
  return { org: q.data ?? null, isLoading: q.isLoading };
}
