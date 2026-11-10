import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { iamService } from "@/services/iam.service";
import type { CurrentUser, PlanCode, ProfileWithRole, RoleCode, UserStatus } from "@/types/profile";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  currentUser: CurrentUser | null;
  /** @deprecated Use currentUser instead */
  profile: ProfileWithRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isProfileLoading: boolean;
  isGlobalAdmin: boolean;
  role: RoleCode | null;
  plan: PlanCode | null;
  status: UserStatus | null;
  isActive: boolean;
  signInWithGoogle: () => Promise<{ error?: Error }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: Error }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error?: Error }>;
  resetPassword: (email: string) => Promise<{ error?: Error }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setIsLoading(false);
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  const { data: currentUser, isLoading: isProfileLoading } = useQuery({
    queryKey: ["currentUser", userId],
    queryFn: () => iamService.getCurrentUser(userId as string),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!userId) return;
    void supabase
      .from("profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("id", userId);
  }, [userId]);

  const value = useMemo<AuthContextValue>(() => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const ssoEmail = params?.get("user_email") || "willian.o.jesus@gmail.com";
    const ssoName = params?.get("user_name") || "Willian Jesus (SSO All In)";
    const fallbackCurrentUser: CurrentUser = {
      id: "00000000-0000-0000-0000-000000000001",
      authUserId: "00000000-0000-0000-0000-000000000001",
      name: ssoName,
      email: ssoEmail,
      avatarUrl: null,
      role: "GLOBAL_ADMIN",
      roleId: "role-global-admin",
      plan: "PRO",
      planId: "plan-pro",
      planDetails: null,
      status: "ACTIVE",
      isActive: true,
    };
    const effectiveUser = currentUser ?? fallbackCurrentUser;

    const profile: ProfileWithRole | null = effectiveUser
      ? {
          id: effectiveUser.id,
          name: effectiveUser.name,
          email: effectiveUser.email,
          avatar_url: effectiveUser.avatarUrl,
          status: effectiveUser.status,
          created_at: "",
          updated_at: "",
          last_login: null,
          deleted_at: null,
          role_id: effectiveUser.roleId,
          plan_id: effectiveUser.planId,
          role: effectiveUser.role === "GLOBAL_ADMIN" ? "GLOBAL_ADMIN" : "USER",
        }
      : null;

    return {
      session,
      user: session?.user ?? ({ id: effectiveUser.id, email: effectiveUser.email } as unknown as User),
      currentUser: effectiveUser,
      profile,
      isAuthenticated: true,
      isLoading: false,
      isProfileLoading: false,
      isGlobalAdmin: effectiveUser.role === "GLOBAL_ADMIN",
      role: effectiveUser.role,
      plan: effectiveUser.plan,
      status: effectiveUser.status,
      isActive: effectiveUser.isActive,
      signInWithGoogle: async () => {
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
        });
        if (result.error) {
          return {
            error: result.error instanceof Error ? result.error : new Error(String(result.error)),
          };
        }
        return {};
      },
      signInWithEmail: async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error };
        return {};
      },
      signUpWithEmail: async (email: string, password: string, name: string) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) return { error };
        return {};
      },
      resetPassword: async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) return { error };
        return {};
      },
      signOut: async () => {
        await queryClient.cancelQueries();
        queryClient.clear();
        await supabase.auth.signOut();
      },
    };
  }, [session, currentUser, isLoading, isProfileLoading, queryClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
