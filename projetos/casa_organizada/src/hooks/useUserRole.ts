import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AppRole = 'admin' | 'editor' | 'viewer' | 'moderator' | 'user';

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (cancelled) return;
        const roles = (data ?? []).map((r) => r.role as AppRole);
        if (roles.includes('admin')) setRole('admin');
        else if (roles.includes('editor')) setRole('editor');
        else setRole(roles[0] ?? 'viewer');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isEditor: role === 'editor' || role === 'admin',
  };
}
