import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import {
  User,
  Condominium,
  Membership,
  UserRole,
  Resource,
  Reservation,
  CondoDocument,
  Announcement,
  ServiceRequest,
  Occurrence,
  Assembly,
  Bill,
  Unit,
  ModuleKey,
} from '../types';
import { mockUsers, mockMemberships } from '../mock-data/users';
import { mockCondominiums, mockUnits } from '../mock-data/condominiums';
import { mockResources } from '../mock-data/resources';
import { mockReservations } from '../mock-data/reservations';
import { mockDocuments } from '../mock-data/documents';
import { mockAnnouncements } from '../mock-data/announcements';
import { mockRequests } from '../mock-data/requests';
import { mockOccurrences } from '../mock-data/occurrences';
import { mockAssemblies } from '../mock-data/assemblies';
import { mockBills } from '../mock-data/bills';
import { getViewFromPath, getPathFromView, getRouteConfig } from '../utils/routes';

export type AppView =
  | 'landing'
  | 'login'
  | 'condo_select'
  | 'dashboard'
  | 'bills'
  | 'documents'
  | 'announcements'
  | 'reservations'
  | 'calendar'
  | 'requests'
  | 'occurrences'
  | 'assemblies'
  | 'admin_dashboard'
  | 'trustee_dashboard'
  | 'units_management'
  | 'resources_config'
  | 'condo_settings'
  | 'permissions_matrix'
  | 'global_admin'
  | 'modules_management'
  | 'design_system';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error' | 'warning';
  title: string;
  message: string;
}

interface AppContextType {
  // Navigation & View
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  toggleDarkMode: () => void;
  isMobileSimulator: boolean;
  toggleMobileSimulator: () => void;
  isContextSwitcherOpen: boolean;
  setIsContextSwitcherOpen: (val: boolean) => void;
  isAiSearchOpen: boolean;
  setIsAiSearchOpen: (val: boolean) => void;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  setIsSidebarCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void;

  // Active Context & Tenancy
  currentUser: User;
  setCurrentUser: (user: User) => void;
  activeCondominium: Condominium;
  condominiums: Condominium[];
  userMemberships: Membership[];
  activeMembership: Membership | null;
  activeRole: UserRole;
  switchCondominium: (condoId: string, preferredRole?: UserRole) => void;
  switchRole: (role: UserRole) => void;
  loginAs: (user: User, condoId?: string, role?: UserRole) => void;
  logout: () => void;

  // Data Collections & Mutations
  resources: Resource[];
  reservations: Reservation[];
  addReservation: (res: Omit<Reservation, 'id' | 'createdAt'>) => void;
  cancelReservation: (id: string) => void;
  approveReservation: (id: string) => void;

  documents: CondoDocument[];
  addDocument: (doc: Omit<CondoDocument, 'id' | 'uploadedAt'>) => void;

  announcements: Announcement[];
  addAnnouncement: (ann: Omit<Announcement, 'id' | 'publishedAt' | 'readByUserIds'>) => void;
  markAnnouncementAsRead: (id: string) => void;

  requests: ServiceRequest[];
  addRequest: (req: Omit<ServiceRequest, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'timeline'>) => void;
  updateRequestStatus: (id: string, status: ServiceRequest['status'], responseMsg?: string) => void;

  occurrences: Occurrence[];
  addOccurrence: (occ: Omit<Occurrence, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'timeline'>) => void;
  updateOccurrenceStatus: (id: string, status: Occurrence['status'], responseMsg?: string) => void;

  assemblies: Assembly[];
  voteOnAssembly: (assemblyId: string, itemId: string, choice: 'yes' | 'no' | 'abstain') => void;

  bills: Bill[];
  payBill: (id: string) => void;

  units: Unit[];
  allUsers: User[];

  // Module & Config Management
  condoModuleOverrides: Record<string, Record<string, boolean>>;
  toggleCondoModule: (condoId: string, moduleKey: string, enabled: boolean) => void;
  updateCondoBookingWindow: (condoId: string, days: number) => void;

  // Toast notifications
  toasts: ToastMessage[];
  showToast: (type: ToastMessage['type'], title: string, message: string) => void;
  addToast: (toast: { type: ToastMessage['type']; title: string; message: string }) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation
  const [currentView, setCurrentViewRaw] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      return getViewFromPath(window.location.pathname);
    }
    return 'landing';
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true); // Default logged in for interactive mockup demo
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isMobileSimulator, setIsMobileSimulator] = useState<boolean>(false);
  const [isContextSwitcherOpen, setIsContextSwitcherOpen] = useState<boolean>(false);
  const [isAiSearchOpen, setIsAiSearchOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  // User & Condominium Context
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]); // Willian Silva
  const [activeCondoId, setActiveCondoId] = useState<string>('condo-solar-park');
  const [activeRole, setActiveRole] = useState<UserRole>('resident');

  // Active Condominium Entity (defined early for title sync)
  const [condos, setCondos] = useState<Condominium[]>(mockCondominiums);
  const activeCondominium = useMemo(() => {
    const found = condos.find((c) => c.id === activeCondoId);
    return found || condos[0];
  }, [condos, activeCondoId]);

  // URL Routing Sync
  const setCurrentView = useCallback(
    (view: AppView, replaceHistory = false) => {
      setCurrentViewRaw(view);
      if (typeof window !== 'undefined') {
        const targetPath = getPathFromView(view);
        const currentPath = window.location.pathname;

        if (currentPath !== targetPath) {
          if (replaceHistory) {
            window.history.replaceState(null, '', targetPath);
          } else {
            window.history.pushState(null, '', targetPath);
          }
        }

        const routeInfo = getRouteConfig(view);
        document.title = 'Olivelas - Gestão de Condomínios';
      }
    },
    [activeCondominium]
  );

  // Popstate listener for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const viewFromUrl = getViewFromPath(window.location.pathname);
      setCurrentViewRaw(viewFromUrl);
      const routeInfo = getRouteConfig(viewFromUrl);
      document.title = 'Olivelas - Gestão de Condomínios';
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeCondominium]);

  // Document Title update effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const routeInfo = getRouteConfig(currentView);
      document.title = 'Olivelas - Gestão de Condomínios';
    }
  }, [currentView, activeCondominium]);

  // App Data States
  const [resources, setResources] = useState<Resource[]>(mockResources);
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
  const [documents, setDocuments] = useState<CondoDocument[]>(mockDocuments);
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [requests, setRequests] = useState<ServiceRequest[]>(mockRequests);
  const [occurrences, setOccurrences] = useState<Occurrence[]>(mockOccurrences);
  const [assemblies, setAssemblies] = useState<Assembly[]>(mockAssemblies);
  const [bills, setBills] = useState<Bill[]>(mockBills);
  const [units, setUnits] = useState<Unit[]>(mockUnits);
  const [allUsers] = useState<User[]>(mockUsers);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Condo Module Overrides (for 3-tier Feature Flags demonstration)
  const [condoModuleOverrides, setCondoModuleOverrides] = useState<Record<string, Record<string, boolean>>>({
    'condo-solar-park': {
      bills: true,
      documents: true,
      announcements: true,
      reservations: true,
      calendar: true,
      requests: true,
      occurrences: true,
      assemblies: true,
      ai_search: true,
      access_control: true,
    },
    'condo-green-village': {
      bills: true,
      documents: true,
      announcements: true,
      reservations: true,
      calendar: true,
      requests: true,
      occurrences: true,
      assemblies: true,
      ai_search: true,
      access_control: false,
    },
    'condo-residencial-jardim': {
      bills: true,
      documents: true,
      announcements: true,
      reservations: true,
      calendar: true,
      requests: true,
      occurrences: true,
      assemblies: false,
      ai_search: false,
      access_control: false,
    },
  });

  // Dark mode effect on document HTML root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);
  const toggleMobileSimulator = () => setIsMobileSimulator((prev) => !prev);

  // User Memberships
  const userMemberships = useMemo(() => {
    return mockMemberships.filter((m) => m.userId === currentUser.id);
  }, [currentUser]);

  // Active Membership
  const activeMembership = useMemo(() => {
    const mem = userMemberships.find(
      (m) => m.condominiumId === activeCondoId && m.role === activeRole
    );
    if (mem) return mem;
    const fallbackMem = userMemberships.find((m) => m.condominiumId === activeCondoId);
    return fallbackMem || userMemberships[0] || null;
  }, [userMemberships, activeCondoId, activeRole]);

  // Toast Helpers
  const showToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const addToast = (toast: { type: ToastMessage['type']; title: string; message: string }) => {
    showToast(toast.type, toast.title, toast.message);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Context Switching Logic
  const switchCondominium = (condoId: string, preferredRole?: UserRole) => {
    setActiveCondoId(condoId);
    const targetCondo = condos.find((c) => c.id === condoId);
    const condoMemberships = userMemberships.filter((m) => m.condominiumId === condoId);
    
    let nextRole: UserRole = 'resident';
    if (preferredRole && condoMemberships.some((m) => m.role === preferredRole)) {
      nextRole = preferredRole;
    } else if (condoMemberships.length > 0) {
      nextRole = condoMemberships[0].role;
    } else if (currentUser.isGlobalAdmin) {
      nextRole = 'global_admin';
    }

    setActiveRole(nextRole);
    setIsContextSwitcherOpen(false);

    // Auto-adjust view if leaving admin views or entering appropriate dashboard
    if (nextRole === 'resident') {
      if (['admin_dashboard', 'trustee_dashboard', 'global_admin', 'modules_management'].includes(currentView)) {
        setCurrentView('dashboard');
      }
    } else if (nextRole === 'trustee') {
      setCurrentView('trustee_dashboard');
    } else if (nextRole === 'admin') {
      setCurrentView('admin_dashboard');
    } else if (nextRole === 'global_admin') {
      setCurrentView('global_admin');
    }

    showToast('info', 'Contexto Alterado', `Operando no contexto: ${targetCondo?.name || condoId}`);
  };

  const switchRole = (role: UserRole) => {
    setActiveRole(role);
    if (role === 'resident') setCurrentView('dashboard');
    else if (role === 'trustee') setCurrentView('trustee_dashboard');
    else if (role === 'admin') setCurrentView('admin_dashboard');
    else if (role === 'global_admin') setCurrentView('global_admin');

    showToast('success', 'Perfil Alternado', `Modo alterado para: ${role.toUpperCase()}`);
  };

  const loginAs = (user: User, condoId?: string, role?: UserRole) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    const targetCondo = condoId || 'condo-solar-park';
    const targetRole = role || 'resident';
    setActiveCondoId(targetCondo);
    setActiveRole(targetRole);

    if (targetRole === 'resident') setCurrentView('dashboard');
    else if (targetRole === 'trustee') setCurrentView('trustee_dashboard');
    else if (targetRole === 'admin') setCurrentView('admin_dashboard');
    else if (targetRole === 'global_admin') setCurrentView('global_admin');

    showToast('success', 'Login Realizado', `Bem-vindo, ${user.name}!`);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentView('landing');
    showToast('info', 'Sessão Encerrada', 'Você saiu da plataforma.');
  };

  // Reservation Actions
  const addReservation = (newRes: Omit<Reservation, 'id' | 'createdAt'>) => {
    const created: Reservation = {
      ...newRes,
      id: `resv-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setReservations((prev) => [created, ...prev]);
    showToast('success', 'Reserva Realizada!', `${created.resourceName} agendado para ${created.date} das ${created.startTime} às ${created.endTime}.`);
  };

  const cancelReservation = (id: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r))
    );
    showToast('info', 'Reserva Cancelada', 'A reserva foi cancelada com sucesso.');
  };

  const approveReservation = (id: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'confirmed' } : r))
    );
    showToast('success', 'Reserva Aprovada', 'A solicitação de espaço foi confirmada.');
  };

  // Documents
  const addDocument = (doc: Omit<CondoDocument, 'id' | 'uploadedAt'>) => {
    const created: CondoDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    setDocuments((prev) => [created, ...prev]);
    showToast('success', 'Documento Enviado', `"${created.title}" foi sincronizado com sucesso.`);
  };

  // Announcements
  const addAnnouncement = (ann: Omit<Announcement, 'id' | 'publishedAt' | 'readByUserIds'>) => {
    const created: Announcement = {
      ...ann,
      id: `ann-${Date.now()}`,
      publishedAt: new Date().toISOString(),
      readByUserIds: [currentUser.id],
    };
    setAnnouncements((prev) => [created, ...prev]);
    showToast('success', 'Comunicado Publicado', `O aviso foi enviado para todos os moradores.`);
  };

  const markAnnouncementAsRead = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id === id && !a.readByUserIds.includes(currentUser.id)) {
          return { ...a, readByUserIds: [...a.readByUserIds, currentUser.id] };
        }
        return a;
      })
    );
  };

  // Requests
  const addRequest = (req: Omit<ServiceRequest, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'timeline'>) => {
    const ticketNumber = 1000 + requests.length + 1;
    const now = new Date().toISOString();
    const created: ServiceRequest = {
      ...req,
      id: `req-${ticketNumber}`,
      ticketNumber,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          id: `t-${Date.now()}`,
          author: req.userName,
          role: 'Morador',
          message: 'Solicitação registrada no sistema.',
          timestamp: now,
        },
      ],
    };
    setRequests((prev) => [created, ...prev]);
    showToast('success', 'Solicitação Aberta', `Protocolo #${ticketNumber} criado com sucesso.`);
  };

  const updateRequestStatus = (id: string, status: ServiceRequest['status'], responseMsg?: string) => {
    const now = new Date().toISOString();
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updatedTimeline = [...r.timeline];
          if (responseMsg) {
            updatedTimeline.push({
              id: `t-${Date.now()}`,
              author: currentUser.name,
              role: activeRole === 'trustee' ? 'Síndico' : 'Administração',
              message: responseMsg,
              timestamp: now,
            });
          }
          return { ...r, status, updatedAt: now, timeline: updatedTimeline };
        }
        return r;
      })
    );
    showToast('info', 'Status Atualizado', `Solicitação atualizada para ${status}.`);
  };

  // Occurrences
  const addOccurrence = (occ: Omit<Occurrence, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'timeline'>) => {
    const ticketNumber = 400 + occurrences.length + 1;
    const now = new Date().toISOString();
    const created: Occurrence = {
      ...occ,
      id: `occ-${ticketNumber}`,
      ticketNumber,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          id: `ot-${Date.now()}`,
          author: occ.userName,
          role: 'Morador',
          message: 'Ocorrência aberta no livro digital.',
          timestamp: now,
        },
      ],
    };
    setOccurrences((prev) => [created, ...prev]);
    showToast('success', 'Ocorrência Registrada', `Protocolo #${ticketNumber} cadastrado com fotos.`);
  };

  const updateOccurrenceStatus = (id: string, status: Occurrence['status'], responseMsg?: string) => {
    const now = new Date().toISOString();
    setOccurrences((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const updatedTimeline = [...o.timeline];
          if (responseMsg) {
            updatedTimeline.push({
              id: `ot-${Date.now()}`,
              author: currentUser.name,
              role: activeRole === 'trustee' ? 'Síndico' : 'Administração',
              message: responseMsg,
              timestamp: now,
            });
          }
          return {
            ...o,
            status,
            updatedAt: now,
            timeline: updatedTimeline,
            lastResponse: responseMsg
              ? { by: currentUser.name, message: responseMsg, timestamp: now }
              : o.lastResponse,
          };
        }
        return o;
      })
    );
    showToast('info', 'Ocorrência Atualizada', `Status alterado para ${status}.`);
  };

  // Assemblies Voting
  const voteOnAssembly = (assemblyId: string, itemId: string, choice: 'yes' | 'no' | 'abstain') => {
    setAssemblies((prev) =>
      prev.map((a) => {
        if (a.id === assemblyId) {
          const updatedVotingItems = a.votingItems.map((item) => {
            if (item.id === itemId) {
              const prevVote = item.userVote;
              let yes = item.votesYes;
              let no = item.votesNo;
              let abstain = item.votesAbstain;

              if (prevVote === 'yes') yes--;
              else if (prevVote === 'no') no--;
              else if (prevVote === 'abstain') abstain--;

              if (choice === 'yes') yes++;
              else if (choice === 'no') no++;
              else if (choice === 'abstain') abstain++;

              return {
                ...item,
                votesYes: yes,
                votesNo: no,
                votesAbstain: abstain,
                userVote: choice,
              };
            }
            return item;
          });
          return { ...a, votingItems: updatedVotingItems };
        }
        return a;
      })
    );
    showToast('success', 'Voto Computado', `Seu voto foi registrado com sucesso e assinado digitalmente.`);
  };

  // Bills
  const payBill = (id: string) => {
    setBills((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'paid', paidAt: new Date().toISOString() } : b))
    );
    showToast('success', 'Pagamento Confirmado', 'Boleto liquidado via PIX com sucesso!');
  };

  // Feature Flags & Modules
  const toggleCondoModule = (condoId: string, moduleKey: string, enabled: boolean) => {
    setCondoModuleOverrides((prev) => ({
      ...prev,
      [condoId]: {
        ...(prev[condoId] || {}),
        [moduleKey]: enabled,
      },
    }));
    setCondos((prev) =>
      prev.map((c) => {
        if (c.id === condoId) {
          return {
            ...c,
            enabledModules: {
              ...c.enabledModules,
              [moduleKey]: enabled,
            },
          };
        }
        return c;
      })
    );
    showToast('info', 'Módulo Atualizado', `Módulo "${moduleKey}" ${enabled ? 'ativado' : 'desativado'} para o condomínio.`);
  };

  const updateCondoBookingWindow = (condoId: string, days: number) => {
    setCondos((prev) =>
      prev.map((c) => (c.id === condoId ? { ...c, bookingWindowDays: days } : c))
    );
    showToast('success', 'Parâmetro Salvo', `Janela de reserva futura configurada para ${days} dias.`);
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        isLoggedIn,
        setIsLoggedIn,
        isDarkMode,
        setIsDarkMode,
        toggleDarkMode,
        isMobileSimulator,
        toggleMobileSimulator,
        isContextSwitcherOpen,
        setIsContextSwitcherOpen,
        isAiSearchOpen,
        setIsAiSearchOpen,
        isSidebarCollapsed,
        toggleSidebarCollapse,
        setIsSidebarCollapsed,
        currentUser,
        setCurrentUser,
        activeCondominium,
        condominiums: condos,
        userMemberships,
        activeMembership,
        activeRole,
        switchCondominium,
        switchRole,
        loginAs,
        logout,
        resources,
        reservations,
        addReservation,
        cancelReservation,
        approveReservation,
        documents,
        addDocument,
        announcements,
        addAnnouncement,
        markAnnouncementAsRead,
        requests,
        addRequest,
        updateRequestStatus,
        occurrences,
        addOccurrence,
        updateOccurrenceStatus,
        assemblies,
        voteOnAssembly,
        bills,
        payBill,
        units,
        allUsers,
        condoModuleOverrides,
        toggleCondoModule,
        updateCondoBookingWindow,
        toasts,
        showToast,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
