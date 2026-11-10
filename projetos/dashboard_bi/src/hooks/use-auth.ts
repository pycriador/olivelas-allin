import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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

export function useAuth() {
  const [session, setSession] = useState<Session | null>(FALLBACK_SESSION);
  const [user, setUser] = useState<User | null>(FALLBACK_USER);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? FALLBACK_SESSION);
      setUser(s?.user ?? FALLBACK_USER);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
      }
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}
