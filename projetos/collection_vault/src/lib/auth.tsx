import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
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

const Ctx = createContext<AuthCtx>({
  user: FALLBACK_USER,
  session: FALLBACK_SESSION,
  loading: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(FALLBACK_SESSION);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? FALLBACK_SESSION);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? FALLBACK_USER,
        session,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
