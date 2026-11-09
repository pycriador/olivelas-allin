import { create } from "zustand";
import type { AuthSession, UserRole, Profile, Permission } from "@/types";

interface AuthState {
  session: AuthSession | null;
  profile: Profile | null;
  roles: UserRole[];
  permissions: Permission[];
  isGlobalAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  setSession: (session: AuthSession | null) => void;
  setProfile: (profile: Profile | null) => void;
  setRoles: (roles: UserRole[]) => void;
  setPermissions: (permissions: Permission[]) => void;
  setIsGlobalAdmin: (value: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  roles: [],
  permissions: [],
  isGlobalAdmin: false,
  isLoading: true,
  error: null,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setRoles: (roles) => set({ roles }),
  setPermissions: (permissions) => set({ permissions }),
  setIsGlobalAdmin: (isGlobalAdmin) => set({ isGlobalAdmin }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      session: null,
      profile: null,
      roles: [],
      permissions: [],
      isGlobalAdmin: false,
      isLoading: false,
      error: null,
    }),
}));
