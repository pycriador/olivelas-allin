import { create } from "zustand";

/**
 * Client-side tenant selection ONLY.
 * This value is a UI convenience. It is NEVER a source of authorization:
 * every read/write is validated server-side by RLS and security-definer functions.
 */
interface TenantState {
  activeOrganizationId: string | null;
  setActiveOrganizationId: (id: string | null) => void;
}

const KEY = "rafflehub.activeOrganizationId";

export const useTenantStore = create<TenantState>((set) => ({
  activeOrganizationId: null,
  setActiveOrganizationId: (id) => {
    if (typeof window !== "undefined") {
      if (id) window.localStorage.setItem(KEY, id);
      else window.localStorage.removeItem(KEY);
    }
    set({ activeOrganizationId: id });
  },
}));

export function readStoredOrganizationId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}
