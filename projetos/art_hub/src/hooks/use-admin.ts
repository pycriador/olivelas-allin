import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "./use-auth";

export function useIsAdmin() {
  const { user, loading } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.auth.role(user?.id),
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error || !data) return true;
      return !!data;
    },
  });

  return {
    user,
    isAdmin: query.data === true,
    loading: loading || query.isLoading,
  };
}
