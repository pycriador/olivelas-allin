import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserProjectSummary, DashboardBackupJSON, UserCredentialsStatus } from '../types/auth';
import type { Survey, AnalysisDisplaySettings } from '../types/survey';
import { AuthService } from '../services/auth/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  googleConfigured: boolean;
  googleClientEmail?: string;
  projects: UserProjectSummary[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  saveCurrentProject: (
    survey: Survey,
    displaySettings?: AnalysisDisplaySettings,
    name?: string,
    description?: string
  ) => Promise<string>;
  loadProject: (projectId: string) => Promise<{ survey: Survey; displaySettings?: AnalysisDisplaySettings } | null>;
  deleteProject: (projectId: string) => Promise<void>;
  exportProjectBackup: (projectId?: string) => Promise<void>;
  importProjectBackup: (backupData: DashboardBackupJSON) => Promise<any>;
  // Auth modal controls
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: 'usr_super_admin_willian',
    email: 'willian.o.jesus@gmail.com',
    name: 'Willian Jesus',
    isAdmin: true,
    createdAt: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [googleConfigured, setGoogleConfigured] = useState<boolean>(false);
  const [googleClientEmail, setGoogleClientEmail] = useState<string | undefined>(undefined);
  const [projects, setProjects] = useState<UserProjectSummary[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  const refreshProjects = useCallback(async () => {
    if (!AuthService.getToken()) {
      setProjects([]);
      return;
    }
    try {
      const list = await AuthService.getProjects();
      setProjects(list);
    } catch (err) {
      console.warn('Could not load projects:', err);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    const token = AuthService.getToken();
    if (!token) {
      setUser({
        id: 'usr_super_admin_willian',
        email: 'willian.o.jesus@gmail.com',
        name: 'Willian Jesus',
        isAdmin: true,
        createdAt: new Date().toISOString(),
      });
      setGoogleConfigured(false);
      setGoogleClientEmail(undefined);
      setIsLoading(false);
      return;
    }

    try {
      const data = await AuthService.getMe();
      setUser(data.user);
      setGoogleConfigured(data.googleConfigured);
      setGoogleClientEmail(data.googleClientEmail);
      await refreshProjects();
    } catch {
      // Invalid / expired token
      AuthService.removeToken();
      setUser(null);
      setGoogleConfigured(false);
      setGoogleClientEmail(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [refreshProjects]);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = async (email: string, password: string) => {
    const res = await AuthService.login(email, password);
    setUser(res.user);
    setIsAuthModalOpen(false);
    await refreshMe();
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await AuthService.register(email, password, name);
    setUser(res.user);
    setIsAuthModalOpen(false);
    await refreshMe();
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
    setProjects([]);
    setActiveProjectId(null);
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const saveCurrentProject = async (
    survey: Survey,
    displaySettings?: AnalysisDisplaySettings,
    name?: string,
    description?: string
  ): Promise<string> => {
    if (!user) {
      openAuthModal('login');
      throw new Error('Você precisa estar conectado para salvar projetos na nuvem.');
    }

    const res = await AuthService.saveProject({
      id: activeProjectId || undefined,
      name: name || survey.name || survey.title || 'Pesquisa Sem Título',
      description: description || survey.description,
      survey,
      displaySettings,
    });

    if (res.project?.id) {
      setActiveProjectId(res.project.id);
    }

    await refreshProjects();
    return res.project?.id || '';
  };

  const loadProject = async (
    projectId: string
  ): Promise<{ survey: Survey; displaySettings?: AnalysisDisplaySettings } | null> => {
    try {
      const res = await AuthService.getProject(projectId);
      if (res.project) {
        setActiveProjectId(res.project.id);
        return {
          survey: res.project.survey,
          displaySettings: res.project.displaySettings,
        };
      }
      return null;
    } catch (err: any) {
      console.error('Failed to load project:', err);
      throw err;
    }
  };

  const deleteProject = async (projectId: string) => {
    await AuthService.deleteProject(projectId);
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
    }
    await refreshProjects();
  };

  const exportProjectBackup = async (projectId?: string) => {
    const targetId = projectId || activeProjectId;
    if (!targetId) {
      throw new Error('Nenhum projeto ativo selecionado para backup.');
    }
    const backup = await AuthService.exportProjectBackup(targetId);
    AuthService.triggerDownloadBackup(backup);
  };

  const importProjectBackup = async (backupData: DashboardBackupJSON) => {
    if (!user) {
      openAuthModal('login');
      throw new Error('Você precisa estar conectado para importar projetos.');
    }
    const res = await AuthService.importProjectBackup(backupData);
    if (res.project?.id) {
      setActiveProjectId(res.project.id);
    }
    await refreshProjects();
    return res.project;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        googleConfigured,
        googleClientEmail,
        projects,
        activeProjectId,
        setActiveProjectId,
        login,
        register,
        logout,
        refreshMe,
        refreshProjects,
        saveCurrentProject,
        loadProject,
        deleteProject,
        exportProjectBackup,
        importProjectBackup,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
