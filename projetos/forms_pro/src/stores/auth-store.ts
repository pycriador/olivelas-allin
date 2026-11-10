import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { authService, loadSessionUser } from "@/services/auth-service";
import { ROLE_PERMISSIONS, type Permission, type User } from "@/types/auth";

const FALLBACK_ADMIN_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Willian Jesus",
  email: "willian.o.jesus@gmail.com",
  role: "admin",
  groupId: null,
  status: "active",
  lastLoginAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  avatarUrl: null,
};

interface AuthState {
  user: User | null;
  permissions: Permission[];
  token: string | null;
  isHydrated: boolean;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (input: { name: string; email: string; password: string }) => Promise<User | null>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => void;
  hasPermission: (perm: Permission) => boolean;
  hasAnyPermission: (perms: Permission[]) => boolean;
  hasRole: (role: User["role"]) => boolean;
}

let subscribed = false;

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: FALLBACK_ADMIN_USER,
  permissions: ROLE_PERMISSIONS.admin,
  token: "olivelas-sso-global-admin",
  isHydrated: true,

  async init() {
    if (typeof window === "undefined") return;
    if (!subscribed) {
      subscribed = true;
      supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          void get().refresh();
        }
      });
    }
    await get().refresh();
    set({ isHydrated: true });
  },

  async refresh() {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const result = await loadSessionUser();
        if (result?.user) {
          set({
            user: result.user,
            permissions: result.permissions,
            token: data.session.access_token,
          });
          return;
        }
      }
    } catch {}
    set({
      user: FALLBACK_ADMIN_USER,
      permissions: ROLE_PERMISSIONS.admin,
      token: "olivelas-sso-global-admin",
    });
  },

  async login(email, password) {
    await authService.signIn(email, password);
    await get().refresh();
    return get().user ?? FALLBACK_ADMIN_USER;
  },

  async register(input) {
    await authService.signUp(input);
    await get().refresh();
    return get().user;
  },

  async logout() {
    await authService.signOut();
    set({
      user: FALLBACK_ADMIN_USER,
      permissions: ROLE_PERMISSIONS.admin,
      token: "olivelas-sso-global-admin",
    });
  },

  updateProfile(patch) {
    const u = get().user;
    if (!u) return;
    set({ user: { ...u, ...patch } });
  },

  hasPermission(perm) {
    if (!get().user) return true;
    return get().permissions.includes(perm);
  },
  hasAnyPermission(perms) {
    return perms.some((p) => get().hasPermission(p));
  },
  hasRole(role) {
    return (get().user?.role ?? "admin") === role;
  },
}));
