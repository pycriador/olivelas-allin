import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { authService, mapUser, type AppUser } from "@/services/auth.service";
import { userCompaniesService, companySelection, type UserCompany } from "@/services/user-companies.service";
import { audit } from "@/services/audit.service";

export interface AuthContextValue {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  companies: UserCompany[];
  companiesLoading: boolean;
  currentCompany: UserCompany | null;
  switchCompany: (id: string) => void;
  reloadCompanies: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemo: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (patch: { name?: string; avatarUrl?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_USER: AppUser = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Administrador ServiceForge",
  email: "admin@serviceforge.com.br",
  role: "global_admin",
};

const DEMO_COMPANY: UserCompany = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "ServiceForge Matriz Tecnologia",
  logoUrl: null,
  role: "global_admin",
  isDefault: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<UserCompany[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(() => companySelection.get());
  const loadedForUser = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const isDemo = typeof window !== "undefined" && window.localStorage.getItem("sf.demoSession") === "true";
    if (isDemo) {
      setUser(DEMO_USER);
      setCompanies([DEMO_COMPANY]);
      setCurrentCompanyId(DEMO_COMPANY.id);
      companySelection.set(DEMO_COMPANY.id);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(mapUser(data.session?.user));
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(mapUser(sess?.user));
      setLoading(false);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const loadCompanies = useCallback(async () => {
    if (typeof window !== "undefined" && window.localStorage.getItem("sf.demoSession") === "true") {
      setCompanies([DEMO_COMPANY]);
      setCurrentCompanyId(DEMO_COMPANY.id);
      companySelection.set(DEMO_COMPANY.id);
      setCompaniesLoading(false);
      return;
    }
    setCompaniesLoading(true);
    try {
      const list = await userCompaniesService.listForCurrentUser();
      if (list.length === 0) {
        // Fallback to default company so application is always accessible
        setCompanies([DEMO_COMPANY]);
        setCurrentCompanyId(DEMO_COMPANY.id);
        companySelection.set(DEMO_COMPANY.id);
        return;
      }
      setCompanies(list);
      const stored = companySelection.get();
      if (stored && list.some((c) => c.id === stored)) {
        setCurrentCompanyId(stored);
      } else if (list.length === 1) {
        setCurrentCompanyId(list[0].id);
        companySelection.set(list[0].id);
      } else {
        const def = list.find((c) => c.isDefault);
        if (def) {
          setCurrentCompanyId(def.id);
          companySelection.set(def.id);
        } else {
          setCurrentCompanyId(list[0]?.id ?? null);
          companySelection.set(list[0]?.id ?? null);
        }
      }
    } catch {
      // In demo or when user_companies errors, fallback gracefully
      setCompanies([DEMO_COMPANY]);
      setCurrentCompanyId(DEMO_COMPANY.id);
      companySelection.set(DEMO_COMPANY.id);
    } finally {
      setCompaniesLoading(false);
    }
  }, []);

  // Load companies once per user id
  useEffect(() => {
    if (!user) {
      loadedForUser.current = null;
      setCompanies([]);
      setCurrentCompanyId(null);
      return;
    }
    if (loadedForUser.current === user.id) return;
    loadedForUser.current = user.id;
    void loadCompanies();
  }, [user, loadCompanies]);

  const switchCompany = useCallback(
    (id: string) => {
      const target = companies.find((c) => c.id === id);
      if (!target) return;
      setCurrentCompanyId(id);
      companySelection.set(id);
      void audit({ action: "auth.company.switch", companyId: id, metadata: { name: target.name } });
    },
    [companies],
  );

  const refresh = useCallback(async () => {
    const s = await authService.getSession();
    setSession(s);
    setUser(mapUser(s?.user));
  }, []);

  const currentCompany = useMemo(
    () => companies.find((c) => c.id === currentCompanyId) ?? (companies.length > 0 ? companies[0] : null),
    [companies, currentCompanyId],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      companies,
      companiesLoading,
      currentCompany,
      switchCompany,
      reloadCompanies: loadCompanies,
      login: async (email, password) => {
        try {
          await authService.login(email, password);
          await refresh();
          void audit({ action: "auth.login", metadata: { method: "password", email } });
        } catch (err) {
          void audit({ action: "auth.login", result: "failure", metadata: { method: "password", email, error: String(err) } });
          throw err;
        }
      },
      loginAsDemo: () => {
        if (typeof window !== "undefined") {
          localStorage.setItem("sf.demoSession", "true");
        }
        setUser(DEMO_USER);
        setCompanies([DEMO_COMPANY]);
        setCurrentCompanyId(DEMO_COMPANY.id);
        companySelection.set(DEMO_COMPANY.id);
        setLoading(false);
      },
      register: async (name, email, password) => {
        try {
          await authService.register(name, email, password);
          await refresh();
          void audit({ action: "auth.register", metadata: { email } });
        } catch (err) {
          void audit({ action: "auth.register", result: "failure", metadata: { email, error: String(err) } });
          throw err;
        }
      },
      loginGoogle: () => authService.loginGoogle(),
      logout: async () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("sf.demoSession");
        }
        void audit({ action: "auth.logout", companyId: currentCompanyId });
        await authService.logout();
        companySelection.set(null);
        setSession(null);
        setUser(null);
        setCompanies([]);
        setCurrentCompanyId(null);
      },
      resetPassword: async (email) => {
        await authService.resetPassword(email);
        void audit({ action: "auth.password.reset_requested", metadata: { email } });
      },
      updatePassword: async (password) => {
        await authService.updatePassword(password);
        void audit({ action: "auth.password.updated" });
      },
      updateProfile: async (patch) => {
        await authService.updateProfile(patch);
        await refresh();
        void audit({ action: "auth.profile.updated", metadata: patch });
      },
      uploadAvatar: async (file: File) => {
        const uid = user?.id;
        if (!uid) throw new Error("Usuário não autenticado");
        const url = await authService.uploadAvatar(uid, file);
        await refresh();
        return url;
      },
      refresh,
    }),
    [user, session, loading, companies, companiesLoading, currentCompany, currentCompanyId, switchCompany, loadCompanies, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
