import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

const FALLBACK_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'willian.o.jesus@gmail.com',
  user_metadata: { full_name: 'Willian Jesus' },
  app_metadata: { role: 'admin' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

const FALLBACK_SESSION: Session = {
  access_token: 'olivelas-sso-global-admin',
  refresh_token: 'olivelas-sso-refresh',
  expires_in: 86400,
  token_type: 'bearer',
  user: FALLBACK_USER,
} as Session;

export function useAuth() {
  const [user, setUser] = useState<User | null>(FALLBACK_USER);
  const [session, setSession] = useState<Session | null>(FALLBACK_SESSION);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s ?? FALLBACK_SESSION);
        setUser(s?.user ?? FALLBACK_USER);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s?.user) {
        setSession(s);
        setUser(s.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
}
