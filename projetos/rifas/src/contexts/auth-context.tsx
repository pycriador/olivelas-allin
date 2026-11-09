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
    const profile: ProfileWithRole | null = currentUser
      ? {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          avatar_url: currentUser.avatarUrl,
          status: currentUser.status,
          created_at: "",
          updated_at: "",
          last_login: null,
          deleted_at: null,
          role_id: currentUser.roleId,
          plan_id: currentUser.planId,
          role: currentUser.role === "GLOBAL_ADMIN" ? "GLOBAL_ADMIN" : "USER",
        }
      : null;

    return {
      session,
      user: session?.user ?? null,
      currentUser: currentUser ?? null,
      profile,
      isAuthenticated: Boolean(session),
      isLoading,
      isProfileLoading,
      isGlobalAdmin: currentUser?.role === "GLOBAL_ADMIN",
      role: currentUser?.role ?? null,
      plan: currentUser?.plan ?? null,
      status: currentUser?.status ?? null,
      isActive: currentUser?.isActive ?? false,
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
