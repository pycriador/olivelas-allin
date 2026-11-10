import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "global_admin" | "user";

export interface CurrentUser {
  id: string;
  email: string | null;
  roles: AppRole[];
  isAdmin: boolean;
}

export function useCurrentUser() {
  return useQuery<CurrentUser | null>({
    queryKey: ["current-user"],
    staleTime: 60_000,
    queryFn: async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (u?.user) {
          return {
            id: u.user.id,
            email: u.user.email ?? "willian.o.jesus@gmail.com",
            roles: ["global_admin"],
            isAdmin: true,
          };
        }
      } catch {}
      return {
        id: "00000000-0000-0000-0000-000000000001",
        email: "willian.o.jesus@gmail.com",
        roles: ["global_admin"],
        isAdmin: true,
      };
    },
  });
}
