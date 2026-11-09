import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { IamGroup, IamRole, IamUser } from "./iam-types";
import { getUserProfile, listGroups } from "./iam-service";

export const GLOBAL_ADMIN_EMAIL = "willian.o.jesus@gmail.com";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  // IAM properties
  iamUser: IamUser | null;
  iamRole: IamRole;
  isGlobalAdmin: boolean;
  isAnalyst: boolean;
  isConsumer: boolean;
  canManageIam: boolean;
  canApproveArts: boolean;
  canSubmitArts: boolean;
  canUseDirectAi: boolean;
  userGroups: IamGroup[];
  activeGroup: IamGroup | null;
  setActiveGroupId: (groupId: string) => void;
  refreshIam: () => Promise<void>;
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // IAM state
  const [iamUser, setIamUser] = useState<IamUser | null>(null);
  const [allGroups, setAllGroups] = useState<IamGroup[]>([]);
  const [activeGroupId, setActiveGroupIdState] = useState<string>("");

  async function loadIamState(currentUser: User | null) {
    if (!currentUser || !currentUser.email) {
      setIamUser(null);
      setAllGroups([]);
      return;
    }

    try {
      const [groups, profile] = await Promise.all([
        listGroups(),
        getUserProfile(currentUser.email, currentUser.user_metadata?.["full_name"]),
      ]);

      setAllGroups(groups || []);
      setIamUser(profile || null);

      // Define grupo ativo padrão
      if (profile && profile.group_ids && profile.group_ids.length > 0) {
        const found = (groups || []).find((g) => profile.group_ids?.includes(g.id));
        if (found) {
          setActiveGroupIdState(found.id);
        } else if (groups && groups.length > 0) {
          setActiveGroupIdState(groups[0].id);
        }
      } else if (groups && groups.length > 0) {
        setActiveGroupIdState(groups[0].id);
      }
    } catch (err) {
      console.warn("Erro ao carregar IAM state:", err);
    }
  }

  useEffect(() => {
    // 1. Carrega sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      loadIamState(session?.user ?? null).finally(() => setLoading(false));
    });

    // 2. Escuta mudanças de estado de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      loadIamState(session?.user ?? null).finally(() => setLoading(false));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function refreshIam() {
    if (user) {
      await loadIamState(user);
    }
  }

  const isGlobalAdminByEmail = Boolean(
    user?.email && user.email.trim().toLowerCase() === GLOBAL_ADMIN_EMAIL.toLowerCase()
  );

  const iamRole: IamRole = isGlobalAdminByEmail
    ? "global_admin"
    : iamUser?.role || (user ? "consumer" : "consumer");

  const isGlobalAdmin = iamRole === "global_admin";
  const isAnalyst = iamRole === "analyst";
  const isConsumer = iamRole === "consumer";

  const canManageIam = isGlobalAdmin;
  const canApproveArts = isGlobalAdmin || isAnalyst;
  const canSubmitArts = Boolean(user);
  const canUseDirectAi = isGlobalAdmin || isAnalyst;

  const userGroups = isGlobalAdmin
    ? allGroups
    : allGroups.filter((g) => iamUser?.group_ids?.includes(g.id));

  const activeGroup =
    allGroups.find((g) => g.id === activeGroupId) ||
    userGroups[0] ||
    allGroups[0] ||
    null;

  function setActiveGroupId(id: string) {
    setActiveGroupIdState(id);
  }

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (!error && data.user) {
        await loadIamState(data.user);
      }
      return { error: error ? new Error(error.message) : null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Falha ao autenticar.") };
    }
  }

  async function signUp(email: string, password: string, fullName?: string) {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const isAdm = cleanEmail === GLOBAL_ADMIN_EMAIL.toLowerCase();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName?.trim() || undefined,
            is_global_admin: isAdm,
          },
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      // Inicializa perfil IAM
      if (data.user) {
        await getUserProfile(cleanEmail, fullName);
      }

      const needsEmailConfirmation = !data.session;
      return { error: null, needsEmailConfirmation };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Falha ao cadastrar usuário.") };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIamUser(null);
    setAllGroups([]);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        iamUser,
        iamRole,
        isGlobalAdmin,
        isAnalyst,
        isConsumer,
        canManageIam,
        canApproveArts,
        canSubmitArts,
        canUseDirectAi,
        userGroups,
        activeGroup,
        setActiveGroupId,
        refreshIam,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}
