import { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../lib/api';

const DEFAULT_ADMIN: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'willian.o.jesus@gmail.com',
  full_name: 'Willian Jesus (Global Admin)',
  role: 'admin',
  status: 'active',
  department: 'Diretoria & TI',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function useAuth() {
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('olivelas_forms_current_user_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return DEFAULT_ADMIN;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('olivelas_forms_current_user_v2', JSON.stringify(user));
  }, [user]);

  const switchUser = async (email: string) => {
    setLoading(true);
    try {
      const data = await api.login(email);
      setUser(data.user);
      localStorage.setItem('olivelas_forms_current_user_v2', JSON.stringify(data.user));
    } catch (err: any) {
      console.error('Failed to switch user:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      localStorage.setItem('olivelas_forms_current_user_v2', JSON.stringify(data.user));
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('olivelas_forms_current_user_v2');
    setUser(DEFAULT_ADMIN);
  };

  const isAdmin = user.role === 'admin';
  const isCreator = user.role === 'creator' || user.role === 'admin';
  const isViewer = user.role === 'viewer';

  const canEditForm = (formOwnerId: string, formCollaborators?: Array<{ user_email: string; role: string }>) => {
    if (isAdmin) return true;
    if (user.id === formOwnerId) return true;
    if (formCollaborators) {
      const match = formCollaborators.find(c => c.user_email.toLowerCase() === user.email.toLowerCase());
      if (match && match.role === 'editor') return true;
    }
    return false;
  };

  return {
    user,
    loading,
    switchUser,
    login,
    logout,
    isAdmin,
    isCreator,
    isViewer,
    canEditForm,
  };
}
