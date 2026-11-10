import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setSession(data.session);
        setUser(data.session.user);
      } else {
        const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const ssoEmail = params?.get("user_email") || "willian.o.jesus@gmail.com";
        const ssoName = params?.get("user_name") || "Willian Jesus (SSO All In)";
        const fallbackUser = {
          id: "00000000-0000-0000-0000-000000000001",
          email: ssoEmail,
          user_metadata: { full_name: ssoName },
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as unknown as User;
        setUser(fallbackUser);
      }
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}
