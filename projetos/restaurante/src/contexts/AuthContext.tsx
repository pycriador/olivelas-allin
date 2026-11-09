import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { UserProfile } from '@/types/auth';
import { auditService } from '@/services/auditService';
import { sessionService } from '@/services/sessionService';
import { AuthContext } from './auth-context';

const DEMO_USER_KEY = 'olivelas_demo_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (!isSupabaseConfigured && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(DEMO_USER_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // ignore
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      void sessionService.syncCurrentSession(user);
    }
  }, [user]);

  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    // Supabase is configured: initialize session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching session:', error.message);
        } else if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            avatar_url: session.user.user_metadata?.avatar_url,
            createdAt: session.user.created_at,
          });
        } else {
          const stored = localStorage.getItem(DEMO_USER_KEY);
          if (stored) {
            setUser(JSON.parse(stored));
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen to Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          avatar_url: session.user.user_metadata?.avatar_url,
          createdAt: session.user.created_at,
        });
      } else {
        const stored = localStorage.getItem(DEMO_USER_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const translateError = (message: string): string => {
    const lower = message.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
      return 'E-mail ou senha incorretos.';
    }
    if (lower.includes('user already registered') || lower.includes('already exists')) {
      return 'Este e-mail já está cadastrado. Tente entrar.';
    }
    if (lower.includes('password should be at least')) {
      return 'A senha deve possuir no mínimo 6 caracteres.';
    }
    if (lower.includes('rate limit') || lower.includes('too many requests')) {
      return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos.';
    }
    if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch')) {
      return 'Falha de comunicação com o servidor. Verifique sua conexão.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Por favor, confirme seu e-mail antes de acessar.';
    }
    return message || 'Ocorreu um erro ao processar sua solicitação.';
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      const demoUser: UserProfile = {
        id: 'demo-user-1',
        email,
        name: email.split('@')[0] || 'Usuário Restaurante',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      void auditService.logEvent({
        action: 'LOGIN_SUCCESS',
        entity_type: 'auth',
        actor_user_id: demoUser.id,
        metadata: { method: 'password', email },
      });
      return {};
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        void auditService.logEvent({
          action: 'LOGIN_FAILED',
          entity_type: 'auth',
          metadata: { method: 'password', email, error: error.message },
        });
        return { error: translateError(error.message) };
      }

      if (data.user) {
        void auditService.logEvent({
          action: 'LOGIN_SUCCESS',
          entity_type: 'auth',
          actor_user_id: data.user.id,
          metadata: { method: 'password', email },
        });
      }

      return {};
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Não foi possível realizar o login.';
      void auditService.logEvent({
        action: 'LOGIN_FAILED',
        entity_type: 'auth',
        metadata: { method: 'password', email, error: errorMsg },
      });
      return { error: translateError(errorMsg) };
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    if (!isSupabaseConfigured) {
      const demoUser: UserProfile = {
        id: 'demo-user-1',
        email,
        name: name || email.split('@')[0] || 'Administrador',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      void auditService.logEvent({
        action: 'USER_CREATED',
        entity_type: 'user',
        actor_user_id: demoUser.id,
        metadata: { email, name },
      });
      return {};
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        return { error: translateError(error.message) };
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: name || data.user.email?.split('@')[0],
          createdAt: data.user.created_at,
        });

        void auditService.logEvent({
          action: 'USER_CREATED',
          entity_type: 'user',
          actor_user_id: data.user.id,
          metadata: { email, name },
        });
      }

      return {};
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Não foi possível realizar o cadastro.';
      return { error: translateError(errorMsg) };
    }
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      const demoUser: UserProfile = {
        id: 'demo-google-user',
        email: 'gestor@olivelas.com',
        name: 'Gestor Olivelas (Google)',
        avatar_url: '',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      return {};
    }

    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname.startsWith('/olivelas-restaurant') ? '/olivelas-restaurant' : ''}/app`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        return { error: translateError(error.message) };
      }
      return {};
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Não foi possível conectar com o Google.';
      return { error: translateError(errorMsg) };
    }
  };

  const resetPassword = async (email: string) => {
    void auditService.logEvent({
      action: 'PASSWORD_RESET_REQUEST',
      entity_type: 'auth',
      metadata: { email },
    });

    if (!isSupabaseConfigured) {
      return {};
    }

    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname.startsWith('/olivelas-restaurant') ? '/olivelas-restaurant' : ''}/login`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { error: translateError(error.message) };
      }
      return {};
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Não foi possível enviar o e-mail de recuperação.';
      return { error: translateError(errorMsg) };
    }
  };

  const signOut = async () => {
    const currentUserId = user?.id;
    void auditService.logEvent({
      action: 'LOGOUT',
      entity_type: 'auth',
      actor_user_id: currentUserId,
      metadata: { email: user?.email },
    });

    if (!isSupabaseConfigured) {
      localStorage.removeItem(DEMO_USER_KEY);
      setUser(null);
      return;
    }

    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isMockAuth: !isSupabaseConfigured,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        resetPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { useAuth } from '@/hooks/useAuth';
