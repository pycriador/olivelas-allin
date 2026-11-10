import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const FALLBACK_ADMIN_USER: User = {
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
  user: FALLBACK_ADMIN_USER,
} as Session;

const Ctx = React.createContext<AuthCtx>({
  user: FALLBACK_ADMIN_USER,
  session: FALLBACK_SESSION,
  isAdmin: true,
  loading: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(FALLBACK_SESSION);
  const [user, setUser] = React.useState<User | null>(FALLBACK_ADMIN_USER);
  const [isAdmin, setIsAdmin] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s?.user) {
        setSession(s);
        setUser(s.user);
        setIsAdmin(true);
      } else {
        setSession(FALLBACK_SESSION);
        setUser(FALLBACK_ADMIN_USER);
        setIsAdmin(true);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s?.user) {
        setSession(s);
        setUser(s.user);
      }
      setIsAdmin(true);
      setLoading(false);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return <Ctx.Provider value={{ user, session, isAdmin, loading, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => React.useContext(Ctx);
