import { create } from "zustand";
import { organizationsApi } from "@/services/org-service";
import type { OrgPermission, OrgRole, Organization } from "@/types/org";

const STORAGE_KEY = "iam-pro-org";

interface OrgState {
  organizations: Organization[];
  currentId: string | null;
  role: OrgRole | null;
  permissions: OrgPermission[];
  isLoading: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  setCurrent: (id: string) => Promise<void>;
  reload: () => Promise<void>;
  current: () => Organization | null;
  can: (perm: OrgPermission) => boolean;
}

function readStored(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export const useOrgStore = create<OrgState>()((set, get) => ({
  organizations: [],
  currentId: null,
  role: null,
  permissions: [],
  isLoading: false,
  loaded: false,

  async load() {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const orgs = await organizationsApi.listMine();
      const stored = readStored();
      const currentId =
        (stored && orgs.some((o) => o.id === stored) ? stored : orgs[0]?.id) ?? null;
      set({ organizations: orgs, currentId, loaded: true });
      if (currentId) {
        const [permissions, role] = await Promise.all([
          organizationsApi.permissions(currentId),
          organizationsApi.myRole(currentId),
        ]);
        set({ permissions, role });
      } else {
        set({ permissions: [], role: null });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  async setCurrent(id) {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
    set({ currentId: id });
    const [permissions, role] = await Promise.all([
      organizationsApi.permissions(id),
      organizationsApi.myRole(id),
    ]);
    set({ permissions, role });
  },

  async reload() {
    set({ loaded: false });
    await get().load();
  },

  current() {
    const { organizations, currentId } = get();
    return organizations.find((o) => o.id === currentId) ?? null;
  },

  can(perm) {
    return get().permissions.includes(perm);
  },
}));
