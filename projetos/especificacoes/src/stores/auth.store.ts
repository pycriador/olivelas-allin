// Session state (UI layer only — all logic lives in auth.service).
import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { authService, loadSession, type Session } from "@/services/auth.service";
import type { PermissionContext } from "@/services/iam.service";
import { evaluate, loadPermissionContext } from "@/services/iam.service";
import { UserStatus, type User } from "@/types/iam";

export type AuthPhase = "loading" | "signed-out" | "pending" | "suspended" | "ready" | "error";

interface AuthState {
  session: Session | null;
  profile: User | null;
  ctx: PermissionContext | null;
  ready: boolean;
  locked: boolean;
  error: string | null;
  phase: AuthPhase;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  lock: () => void;
  can: (resource: string, action: string, resourceId?: string) => boolean;
}

let subscribed = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  ctx: null,
  ready: false,
  locked: false,
  error: null,
  phase: "loading",

  init: async () => {
    if (!subscribed && typeof window !== "undefined") {
      subscribed = true;
      supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
          void get().refresh();
        }
      });
    }
    await get().refresh();
    set({ ready: true });
  },

  refresh: async () => {
    try {
      const session = await loadSession();
      if (!session) {
        set({ session: null, profile: null, ctx: null, locked: false, error: null, phase: "signed-out" });
        return;
      }
      const profile = await authService.registerOrBootstrap();
      if (!profile) {
        set({ session, profile: null, ctx: null, phase: "signed-out" });
        return;
      }
      if (profile.status === UserStatus.Pending) {
        set({ session, profile, ctx: null, error: null, phase: "pending" });
        return;
      }
      if (profile.status !== UserStatus.Active) {
        set({ session, profile, ctx: null, error: null, phase: "suspended" });
        return;
      }
      const ctx = await loadPermissionContext(profile.id);
      set({ session, profile, ctx, locked: false, error: null, phase: "ready" });
      const { useWorkspaceStore } = await import("./workspace.store");
      void useWorkspaceStore.getState().load(profile.id);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Connection failed", phase: "error" });
    }
  },

  signIn: async () => {
    set({ error: null });
    try {
      await authService.signInWithGoogle();
      await get().refresh();
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Sign-in failed" });
      throw e;
    }
  },

  logout: async () => {
    await authService.logout();
    set({ session: null, profile: null, ctx: null, locked: false, phase: "signed-out" });
  },

  lock: () => set({ locked: true }),

  can: (resource, action, resourceId) => evaluate(get().ctx, resource, action, resourceId),
}));
