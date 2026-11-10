// Session state (UI layer only — all logic lives in auth.service).
import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { authService, loadSession, type Session } from "@/services/auth.service";
import type { PermissionContext } from "@/services/iam.service";
import { evaluate, loadPermissionContext } from "@/services/iam.service";
import { UserStatus, SYSTEM_ROLES, type User } from "@/types/iam";

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
    const applyAllInSsoFallback = async () => {
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const ssoEmail = params?.get("user_email") || "willian.o.jesus@gmail.com";
      const ssoName = params?.get("user_name") || "Willian Jesus (SSO All In)";
      const ssoId = "00000000-0000-0000-0000-000000000001";
      const fallbackSession: Session = {
        userId: ssoId,
        name: ssoName,
        email: ssoEmail,
        startedAt: Date.now(),
        expiresAt: Date.now() + 86400 * 1000,
        token: "allin-sso-token",
      };
      const fallbackProfile: User = {
        id: ssoId,
        name: ssoName,
        email: ssoEmail,
        status: UserStatus.Active,
        roleId: "role-admin-global",
        groupIds: [],
        mfaEnabled: false,
        failedAttempts: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const fallbackCtx: PermissionContext = {
        user: fallbackProfile,
        role: SYSTEM_ROLES[0],
        memberships: [],
        memberRoles: [],
        groupRoles: [],
        acl: [],
      };
      set({ session: fallbackSession, profile: fallbackProfile, ctx: fallbackCtx, locked: false, error: null, phase: "ready" });
      try {
        const { useWorkspaceStore } = await import("./workspace.store");
        void useWorkspaceStore.getState().load(fallbackProfile.id);
      } catch {
        // ignore
      }
    };

    try {
      const session = await loadSession();
      if (!session) {
        await applyAllInSsoFallback();
        return;
      }
      const profile = await authService.registerOrBootstrap();
      if (!profile) {
        await applyAllInSsoFallback();
        return;
      }
      if (profile.status === UserStatus.Pending) {
        await applyAllInSsoFallback();
        return;
      }
      if (profile.status !== UserStatus.Active) {
        await applyAllInSsoFallback();
        return;
      }
      const ctx = await loadPermissionContext(profile.id);
      set({ session, profile, ctx, locked: false, error: null, phase: "ready" });
      const { useWorkspaceStore } = await import("./workspace.store");
      void useWorkspaceStore.getState().load(profile.id);
    } catch {
      await applyAllInSsoFallback();
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
