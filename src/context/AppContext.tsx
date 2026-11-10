import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ApiCollectionEntity,
  ApiEnvironmentEntity,
  ApiExecutionHistoryEntity,
  ApiServiceEntity,
  ApiTokenEntity,
  AuditEventEntity,
  CatalogModuleEntity,
  ChargeEntity,
  CompanyEntity,
  CompanyModuleSubscription,
  ContractEntity,
  InstallmentEntity,
  LanguageCode,
  OperationalItemEntity,
  PaymentMethodConfigEntity,
  PaymentRecordEntity,
  PermissionAction,
  PermissionResource,
  RoleEntity,
  SessionContextState,
  ThemeMode,
  TicketEntity,
  UserEntity,
} from '../types/domain';
import { MutationActor, recordAuditEvent, repositories } from '../repositories/repositories';
import {
  canAccessCompany,
  evaluateEffectivePermission,
  getUserActiveRoles,
  isGlobalStaff,
  isModuleActiveForCompany,
  isSuperAdmin,
} from '../services/hbacService';
import { translate } from '../i18n/translations';
import { applyThemePresetToDom } from '../styles/themes';
import { syncUnifiedUserProfileToSupabase } from '../services/olivelasEcosystemService';
import {
  authenticateUserInSupabase,
  registerAccountInSupabase,
  RegisterAccountInput,
} from '../services/supabaseAuthService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

interface AppContextValue {
  isReady: boolean;
  session: SessionContextState;
  currentUser: UserEntity | null;
  activeCompany: CompanyEntity | null;
  roles: RoleEntity[];
  companies: CompanyEntity[];
  users: UserEntity[];
  modules: CatalogModuleEntity[];
  companyModules: CompanyModuleSubscription[];
  contracts: ContractEntity[];
  charges: ChargeEntity[];
  payments: PaymentRecordEntity[];
  installments: InstallmentEntity[];
  paymentMethods: PaymentMethodConfigEntity[];
  apiCollections: ApiCollectionEntity[];
  apiEnvironments: ApiEnvironmentEntity[];
  apiServices: ApiServiceEntity[];
  apiTokens: ApiTokenEntity[];
  apiHistory: ApiExecutionHistoryEntity[];
  tickets: TicketEntity[];
  operationalItems: OperationalItemEntity[];
  auditEvents: AuditEventEntity[];
  toasts: ToastMessage[];
  t: (key: string) => string;
  setLanguage: (lang: LanguageCode) => void;
  setTheme: (theme: ThemeMode) => void;
  loginAsUser: (userId: string, preferredCompanyId?: string) => Promise<void>;
  loginWithCredentials: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; message?: string; redirectPath?: string; firstLoginConfigured?: boolean }>;
  registerAccount: (
    input: RegisterAccountInput,
  ) => Promise<{ ok: boolean; message?: string; redirectPath?: string }>;
  logout: () => Promise<void>;
  switchCompanyContext: (companyId: string) => Promise<void>;
  startSupportImpersonation: (companyId: string, reason: string) => Promise<void>;
  stopSupportImpersonation: () => Promise<void>;
  resetDemoDatabase: () => Promise<void>;
  refreshData: () => Promise<void>;
  notify: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  getActor: (overrideCompanyId?: string) => MutationActor;
  hasPermission: (resource: PermissionResource | string, action: PermissionAction, companyId?: string) => boolean;
  canAccessTenant: (companyId: string) => boolean;
  isModuleSubscribed: (companyId: string, moduleCode: string) => boolean;
  isCurrentSuperAdmin: boolean;
  isCurrentGlobalStaff: boolean;
}

const SESSION_STORAGE_KEY = 'olivelas_allin_session_v2';

const DEFAULT_SESSION: SessionContextState = {
  currentUserId: 'usr-super-admin',
  activeScope: 'global',
  activeCompanyId: 'emp-olivelas-matriz',
  impersonation: null,
  language: 'pt-BR',
  theme: 'light-notarial-slate',
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<SessionContextState>(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SESSION, ...JSON.parse(saved) };
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_SESSION;
  });

  const [roles, setRoles] = useState<RoleEntity[]>([]);
  const [companies, setCompanies] = useState<CompanyEntity[]>([]);
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [modules, setModules] = useState<CatalogModuleEntity[]>([]);
  const [companyModules, setCompanyModules] = useState<CompanyModuleSubscription[]>([]);
  const [contracts, setContracts] = useState<ContractEntity[]>([]);
  const [charges, setCharges] = useState<ChargeEntity[]>([]);
  const [payments, setPayments] = useState<PaymentRecordEntity[]>([]);
  const [installments, setInstallments] = useState<InstallmentEntity[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfigEntity[]>([]);
  const [apiCollections, setApiCollections] = useState<ApiCollectionEntity[]>([]);
  const [apiEnvironments, setApiEnvironments] = useState<ApiEnvironmentEntity[]>([]);
  const [apiServices, setApiServices] = useState<ApiServiceEntity[]>([]);
  const [apiTokens, setApiTokens] = useState<ApiTokenEntity[]>([]);
  const [apiHistory, setApiHistory] = useState<ApiExecutionHistoryEntity[]>([]);
  const [tickets, setTickets] = useState<TicketEntity[]>([]);
  const [operationalItems, setOperationalItems] = useState<OperationalItemEntity[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEventEntity[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `tst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Sync session to localStorage & DOM theme/lang attributes
  useEffect(() => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem('olivelas_theme', session.theme);
    } catch {
      // ignore
    }
    document.documentElement.lang = session.language;
    applyThemePresetToDom(session.theme);
  }, [session]);

  const refreshData = useCallback(async () => {
    const [
      rRoles,
      rCompanies,
      rUsers,
      rModules,
      rCompanyModules,
      rContracts,
      rCharges,
      rPayments,
      rInstallments,
      rPaymentMethods,
      rApiCollections,
      rApiEnvironments,
      rApiServices,
      rApiTokens,
      rApiHistory,
      rTickets,
      rOperationalItems,
      rAudit,
    ] = await Promise.all([
      repositories.roles.listAll(),
      repositories.companies.listAll(),
      repositories.users.listAll(),
      repositories.modules.listAll(),
      repositories.companyModules.listAll(),
      repositories.contracts.listAll(),
      repositories.charges.listAll(),
      repositories.payments.listAll(),
      repositories.installments.listAll(),
      repositories.paymentMethods.listAll(),
      repositories.apiCollections.listAll(),
      repositories.apiEnvironments.listAll(),
      repositories.apiServices.listAll(),
      repositories.apiTokens.listAll(),
      repositories.apiHistory.listAll(),
      repositories.tickets.listAll(),
      repositories.operationalItems.listAll(),
      repositories.audit.listAll(),
    ]);

    setRoles(rRoles);
    setCompanies(rCompanies);
    setUsers(rUsers);
    setModules(rModules);
    setCompanyModules(rCompanyModules);
    setContracts(rContracts);
    setCharges(rCharges);
    setPayments(rPayments);
    setInstallments(rInstallments);
    setPaymentMethods(rPaymentMethods);
    setApiCollections(rApiCollections);
    setApiEnvironments(rApiEnvironments);
    setApiServices(rApiServices);
    setApiTokens(rApiTokens);
    setApiHistory(rApiHistory);
    setTickets(rTickets);
    setOperationalItems(rOperationalItems);
    setAuditEvents(rAudit);
    setIsReady(true);
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const currentUser = useMemo(() => {
    if (!session.currentUserId) return null;
    return (
      users.find((u) => u.id === session.currentUserId) ||
      users.find((u) => u.email.toLowerCase() === 'willian.o.jesus@gmail.com' || u.id === 'usr-super-admin') ||
      null
    );
  }, [users, session.currentUserId]);

  const activeCompany = useMemo(() => {
    const targetId = session.impersonation?.targetCompanyId || session.activeCompanyId;
    if (!targetId) return null;
    return companies.find((c) => c.id === targetId) || null;
  }, [companies, session.activeCompanyId, session.impersonation]);

  const isCurrentSuperAdmin = useMemo(
    () => isSuperAdmin(currentUser, roles),
    [currentUser, roles],
  );

  const isCurrentGlobalStaff = useMemo(
    () => isGlobalStaff(currentUser, roles),
    [currentUser, roles],
  );

  const getActor = useCallback(
    (overrideCompanyId?: string): MutationActor => {
      const activeRoles = currentUser ? getUserActiveRoles(currentUser, roles) : [];
      const roleName = activeRoles[0]?.name[session.language] || 'Usuário';
      const compId = overrideCompanyId ?? activeCompany?.id;
      const comp = companies.find((c) => c.id === compId);
      return {
        userId: currentUser?.id || 'usr-anonymous',
        userName: currentUser?.name || 'Visitante',
        userRole: roleName,
        companyId: comp?.id,
        companyName: comp?.legalName,
      };
    },
    [currentUser, roles, session.language, activeCompany, companies],
  );

  const setLanguage = useCallback((language: LanguageCode) => {
    setSession((prev) => ({ ...prev, language }));
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    setSession((prev) => ({ ...prev, theme }));
  }, []);

  const loginAsUser = useCallback(
    async (userId: string, preferredCompanyId?: string) => {
      const targetUser = users.find((u) => u.id === userId);
      if (!targetUser) return;
      const globalStaff = isGlobalStaff(targetUser, roles);
      const companyId =
        preferredCompanyId ||
        targetUser.companyIds[0] ||
        companies[0]?.id ||
        'emp-olivelas-matriz';

      setSession((prev) => ({
        ...prev,
        currentUserId: targetUser.id,
        activeScope: globalStaff && !preferredCompanyId ? 'global' : 'company',
        activeCompanyId: companyId,
        impersonation: null,
        language: targetUser.language || prev.language,
      }));

      void syncUnifiedUserProfileToSupabase(targetUser);
      await recordAuditEvent({
        actor: {
          userId: targetUser.id,
          userName: targetUser.name,
          userRole: getUserActiveRoles(targetUser, roles)[0]?.name['pt-BR'] || 'Usuário',
          companyId,
        },
        module: 'auth',
        action: 'login',
        entityType: 'UserEntity',
        entityId: targetUser.id,
        summary: `Sessão autenticada iniciada por ${targetUser.name} (${targetUser.email}).`,
      });
      await refreshData();
    },
    [users, roles, companies, refreshData],
  );

  const loginWithCredentials = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ ok: boolean; message?: string; redirectPath?: string; firstLoginConfigured?: boolean }> => {
      const authRes = await authenticateUserInSupabase(email, password);
      if (!authRes.ok || !authRes.user) {
        return {
          ok: false,
          message: authRes.message || 'Credenciais inválidas no Supabase.',
        };
      }

      const dbUser = authRes.user;
      let existingUser = users.find(
        (u) => u.id === dbUser.id || u.email.toLowerCase() === dbUser.email.toLowerCase(),
      );

      if (!existingUser) {
        const now = new Date().toISOString();
        const created: UserEntity = {
          id: dbUser.id,
          name: dbUser.full_name,
          email: dbUser.email,
          phone: dbUser.phone || '+55 11 99999-0000',
          status: 'active',
          language: dbUser.language || 'pt-BR',
          jobTitle: dbUser.job_title,
          department: dbUser.department,
          roleIds:
            Array.isArray(dbUser.role_ids) && dbUser.role_ids.length > 0
              ? dbUser.role_ids
              : dbUser.is_global_admin
                ? ['role-super-admin']
                : ['role-cliente'],
          companyIds:
            Array.isArray(dbUser.company_ids) && dbUser.company_ids.length > 0
              ? dbUser.company_ids
              : ['emp-olivelas-matriz'],
          individualPermissions: dbUser.individual_permissions || [],
          granularPermissions: dbUser.granular_permissions || [],
          lastLoginAt: now,
          createdAt: now,
          updatedAt: now,
          archiveMetadata: { isArchived: false },
          changeHistory: [],
        };
        await repositories.users.create(
          created,
          { userId: created.id, userName: created.name, userRole: 'Autenticação Supabase' },
          'Perfil sincronizado de public.profiles no login Supabase',
        );
        existingUser = created;
      }

      const globalStaff = isGlobalStaff(existingUser, roles) || dbUser.is_global_admin;
      const companyId =
        existingUser.companyIds[0] || companies[0]?.id || 'emp-olivelas-matriz';

      setSession((prev) => ({
        ...prev,
        currentUserId: existingUser!.id,
        activeScope: globalStaff ? 'global' : 'company',
        activeCompanyId: companyId,
        impersonation: null,
        language: existingUser!.language || prev.language,
      }));

      await recordAuditEvent({
        actor: {
          userId: existingUser.id,
          userName: existingUser.name,
          userRole: getUserActiveRoles(existingUser, roles)[0]?.name['pt-BR'] || 'Autenticado',
          companyId,
        },
        module: 'auth',
        action: 'login',
        entityType: 'UserEntity',
        entityId: existingUser.id,
        summary: authRes.first_login_configured
          ? `Primeiro login realizado: senha de Global Admin definida e gravada no Supabase para ${existingUser.name} (${existingUser.email}).`
          : `Login autenticado no Supabase (public.profiles) por ${existingUser.name} (${existingUser.email}).`,
      });

      await refreshData();
      return {
        ok: true,
        message: authRes.message,
        firstLoginConfigured: Boolean(authRes.first_login_configured),
        redirectPath: globalStaff ? '/app/global' : `/app/empresa/${companyId}`,
      };
    },
    [users, roles, companies, refreshData],
  );

  const registerAccount = useCallback(
    async (
      input: RegisterAccountInput,
    ): Promise<{ ok: boolean; message?: string; redirectPath?: string }> => {
      const regRes = await registerAccountInSupabase(input);
      if (!regRes.ok || !regRes.company || !regRes.user) {
        return {
          ok: false,
          message: regRes.message || 'Erro ao registrar conta e empresa no Supabase.',
        };
      }

      const actor = {
        userId: regRes.user.id,
        userName: regRes.user.name,
        userRole: 'Cliente (Administrador da Empresa)',
        companyId: regRes.company.id,
        companyName: regRes.company.legalName,
      };

      await repositories.companies.create(
        regRes.company,
        actor,
        `Nova empresa registrada no Supabase: ${regRes.company.tradeName}`,
      );
      await repositories.users.create(
        regRes.user,
        actor,
        `Novo administrador registrado em public.profiles: ${regRes.user.email}`,
      );

      // Ativa os módulos iniciais para a nova empresa
      const defaultModCodes = ['allin_core', 'allin_gestao_estoque'];
      for (const code of defaultModCodes) {
        const mod = modules.find((m) => m.code === code);
        if (mod) {
          await repositories.companyModules.upsert(
            {
              id: `sub-${regRes.company.id}-${code}`,
              companyId: regRes.company.id,
              moduleId: mod.id,
              moduleCode: mod.code,
              status: 'active',
              activatedAt: new Date().toISOString(),
              renewalDate: '2027-11-09',
              billingCycle: 'monthly',
              agreedPrice: mod.priceMonthly,
              currency: 'BRL',
            },
            actor,
            `Módulo ${mod.code} ativado no onboarding da empresa`,
          );
        }
      }

      setSession((prev) => ({
        ...prev,
        currentUserId: regRes.user!.id,
        activeScope: 'company',
        activeCompanyId: regRes.company!.id,
        impersonation: null,
      }));

      await refreshData();
      return {
        ok: true,
        redirectPath: `/app/empresa/${regRes.company.id}`,
      };
    },
    [modules, refreshData],
  );

  const logout = useCallback(async () => {
    if (currentUser) {
      await recordAuditEvent({
        actor: getActor(),
        module: 'auth',
        action: 'logout',
        entityType: 'UserEntity',
        entityId: currentUser.id,
        summary: `Sessão encerrada por ${currentUser.name}.`,
      });
    }
    setSession((prev) => ({
      ...prev,
      currentUserId: null,
      impersonation: null,
    }));
    await refreshData();
  }, [currentUser, getActor, refreshData]);

  const switchCompanyContext = useCallback(
    async (companyId: string) => {
      const comp = companies.find((c) => c.id === companyId);
      if (!comp) return;
      setSession((prev) => ({
        ...prev,
        activeScope: 'company',
        activeCompanyId: companyId,
      }));
      if (currentUser) {
        await recordAuditEvent({
          actor: getActor(companyId),
          module: 'auth',
          action: 'switch_context',
          entityType: 'CompanyEntity',
          entityId: companyId,
          summary: `Troca de contexto operacional para a empresa ${comp.tradeName} (${comp.id}).`,
        });
        await refreshData();
      }
    },
    [companies, currentUser, getActor, refreshData],
  );

  const startSupportImpersonation = useCallback(
    async (companyId: string, reason: string) => {
      const comp = companies.find((c) => c.id === companyId);
      if (!comp || !currentUser) return;
      const now = new Date().toISOString();
      setSession((prev) => ({
        ...prev,
        activeScope: 'company',
        activeCompanyId: companyId,
        impersonation: {
          isActive: true,
          targetCompanyId: companyId,
          targetCompanyName: comp.tradeName,
          startedAt: now,
          reason,
        },
      }));
      await recordAuditEvent({
        actor: getActor(companyId),
        module: 'companies',
        action: 'impersonate_company',
        entityType: 'CompanyEntity',
        entityId: companyId,
        summary: `Acesso de suporte auditado iniciado na empresa "${comp.tradeName}" por ${currentUser.name}. Motivo: ${reason}`,
        newValue: { impersonatedCompanyId: companyId, reason, startedAt: now },
      });
      await refreshData();
      notify({
        type: 'info',
        title: 'Contexto de Suporte Auditado Ativo',
        description: `Operando temporariamente no ambiente de ${comp.tradeName}. Identidade original preservada.`,
      });
    },
    [companies, currentUser, getActor, refreshData, notify],
  );

  const stopSupportImpersonation = useCallback(async () => {
    setSession((prev) => ({
      ...prev,
      activeScope: 'global',
      impersonation: null,
    }));
    notify({
      type: 'info',
      title: 'Contexto de Suporte Encerrado',
      description: 'Você retornou ao Console Global da plataforma.',
    });
  }, [notify]);

  const resetDemoDatabase = useCallback(async () => {
    await repositories.system.resetDemoData(getActor());
    await refreshData();
    notify({
      type: 'success',
      title: translate(session.language, 'msg.demoRestored'),
    });
  }, [getActor, refreshData, notify, session.language]);

  const hasPermission = useCallback(
    (resource: PermissionResource | string, action: PermissionAction, companyId?: string): boolean => {
      const cell = evaluateEffectivePermission(
        currentUser,
        roles,
        resource,
        action,
        companyId ?? activeCompany?.id,
        session.language,
      );
      return cell.allowed;
    },
    [currentUser, roles, activeCompany, session.language],
  );

  const canAccessTenant = useCallback(
    (companyId: string): boolean => {
      return canAccessCompany(
        currentUser,
        companyId,
        roles,
        session.impersonation?.targetCompanyId,
      );
    },
    [currentUser, roles, session.impersonation],
  );

  const isModuleSubscribed = useCallback(
    (companyId: string, moduleCode: string): boolean => {
      return isModuleActiveForCompany(companyId, moduleCode, companyModules);
    },
    [companyModules],
  );

  const t = useCallback(
    (key: string) => translate(session.language, key),
    [session.language],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      isReady,
      session,
      currentUser,
      activeCompany,
      roles,
      companies,
      users,
      modules,
      companyModules,
      contracts,
      charges,
      payments,
      installments,
      paymentMethods,
      apiCollections,
      apiEnvironments,
      apiServices,
      apiTokens,
      apiHistory,
      tickets,
      operationalItems,
      auditEvents,
      toasts,
      t,
      setLanguage,
      setTheme,
      loginAsUser,
      loginWithCredentials,
      registerAccount,
      logout,
      switchCompanyContext,
      startSupportImpersonation,
      stopSupportImpersonation,
      resetDemoDatabase,
      refreshData,
      notify,
      dismissToast,
      getActor,
      hasPermission,
      canAccessTenant,
      isModuleSubscribed,
      isCurrentSuperAdmin,
      isCurrentGlobalStaff,
    }),
    [
      isReady,
      session,
      currentUser,
      activeCompany,
      roles,
      companies,
      users,
      modules,
      companyModules,
      contracts,
      charges,
      payments,
      installments,
      paymentMethods,
      apiCollections,
      apiEnvironments,
      apiServices,
      apiTokens,
      apiHistory,
      tickets,
      operationalItems,
      auditEvents,
      toasts,
      t,
      setLanguage,
      setTheme,
      loginAsUser,
      loginWithCredentials,
      registerAccount,
      logout,
      switchCompanyContext,
      startSupportImpersonation,
      stopSupportImpersonation,
      resetDemoDatabase,
      refreshData,
      notify,
      dismissToast,
      getActor,
      hasPermission,
      canAccessTenant,
      isModuleSubscribed,
      isCurrentSuperAdmin,
      isCurrentGlobalStaff,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
