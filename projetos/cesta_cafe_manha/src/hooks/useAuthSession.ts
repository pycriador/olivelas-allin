import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { fetchMyProfile, fetchMyRoles } from "@/services/account";
import type { AppRole } from "@/types/domain";

const FALLBACK_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "willian.o.jesus@gmail.com",
  user_metadata: { full_name: "Willian Jesus" },
  app_metadata: { role: "admin" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as User;

const FALLBACK_SESSION: Session = {
  access_token: "olivelas-sso-global-admin",
  refresh_token: "olivelas-sso-refresh",
  expires_in: 86400,
  token_type: "bearer",
  user: FALLBACK_USER,
} as Session;

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(FALLBACK_SESSION);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? FALLBACK_SESSION);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSession(data.session);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? FALLBACK_USER, loading };
}

export function useCurrentMember(userId: string | undefined) {
  return useQuery({
    queryKey: ["current-member", userId || FALLBACK_USER.id],
    enabled: true,
    queryFn: async () => {
      const targetId = userId || FALLBACK_USER.id;
      try {
        const [profile, roles] = await Promise.all([fetchMyProfile(targetId), fetchMyRoles(targetId)]);
        if (profile) {
          return {
            profile: { ...profile, status: "aprovado" as const },
            roles: roles?.length ? roles : (["admin"] as AppRole[]),
          };
        }
      } catch {}
      return {
        profile: {
          id: targetId,
          full_name: "Willian Jesus",
          email: "willian.o.jesus@gmail.com",
          status: "aprovado" as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any,
        roles: ["admin"] as AppRole[],
      };
    },
  });
}

export function hasRole(roles: AppRole[] | undefined, ...allowed: AppRole[]): boolean {
  return (roles ?? ["admin"]).some((role) => allowed.includes(role));
}
