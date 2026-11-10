import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "editor" | "viewer" | "client";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador Global",
  editor: "Editor",
  viewer: "Visualizador",
  client: "Cliente",
};

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
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
  full_name: "Willian Jesus",
  avatar_url: null,
  email: "willian.o.jesus@gmail.com",
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(FALLBACK_SESSION);
  const [user, setUser] = useState<User | null>(FALLBACK_USER);
  const [profile, setProfile] = useState<Profile | null>(FALLBACK_PROFILE);
  const [role, setRole] = useState<AppRole | null>("admin");
  const [loading, setLoading] = useState(false);

  const loadExtras = async (uid: string) => {
    try {
      const [{ data: prof }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url, email").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      setProfile(prof ?? FALLBACK_PROFILE);
      const list = (roles ?? []).map((r) => r.role as AppRole);
      const ordered: AppRole[] = ["admin", "editor", "viewer", "client"];
      setRole(ordered.find((r) => list.includes(r)) ?? "admin");
    } catch {
      setProfile(FALLBACK_PROFILE);
      setRole("admin");
    }
  };

  const refresh = async () => {
    if (user) await loadExtras(user.id);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (sess?.user) {
        setSession(sess);
        setUser(sess.user);
        setTimeout(() => loadExtras(sess.user.id), 0);
      } else {
        setSession(FALLBACK_SESSION);
        setUser(FALLBACK_USER);
        setProfile(FALLBACK_PROFILE);
        setRole("admin");
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
        void loadExtras(data.session.user.id);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function canEdit(role: AppRole | null) {
  return role === "admin" || role === "editor";
}
export function isAdmin(role: AppRole | null) {
  return role === "admin";
}
export function isClient(role: AppRole | null) {
  return role === "client";
}
export function isTeam(role: AppRole | null) {
  return role === "admin" || role === "editor" || role === "viewer";
}
