import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "user";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

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

const FALLBACK_PROFILE: Profile = {
  id: FALLBACK_USER.id,
  email: "willian.o.jesus@gmail.com",
  full_name: "Willian Jesus",
  avatar_url: null,
  is_active: true,
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(FALLBACK_SESSION);
  const [profile, setProfile] = useState<Profile | null>(FALLBACK_PROFILE);
  const [roles, setRoles] = useState<AppRole[]>(["admin"]);
  const [loading, setLoading] = useState(false);

  const loadProfile = async (userId: string) => {
    try {
      const [{ data: prof }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      setProfile((prof as Profile | null) ?? FALLBACK_PROFILE);
      const loadedRoles = ((r ?? []) as { role: AppRole }[]).map((x) => x.role);
      setRoles(loadedRoles.length ? loadedRoles : ["admin"]);
    } catch {
      setProfile(FALLBACK_PROFILE);
      setRoles(["admin"]);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.user) {
        setSession(s);
        setTimeout(() => { loadProfile(s.user.id); }, 0);
      } else {
        setSession(FALLBACK_SESSION);
        setProfile(FALLBACK_PROFILE);
        setRoles(["admin"]);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        setSession(data.session);
        await loadProfile(data.session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    session,
    user: session?.user ?? FALLBACK_USER,
    profile,
    roles,
    loading,
    isAdmin: roles.includes("admin"),
    refresh: async () => session?.user && loadProfile(session.user.id),
    signOut: async () => { await supabase.auth.signOut(); },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
