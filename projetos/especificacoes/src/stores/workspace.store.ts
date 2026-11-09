// Active workspace selection (UI state only; data access goes through services).
import { create } from "zustand";
import { workspaceService } from "@/services/workspace.service";
import type { Workspace } from "@/types/domain";

const STORAGE_KEY = "specforge:workspace";

interface WorkspaceState {
  current: Workspace | null;
  list: Workspace[];
  loading: boolean;
  error: string | null;
  load: (userId?: string) => Promise<void>;
  select: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  current: null,
  list: [],
  loading: false,
  error: null,

  load: async (userId) => {
    set({ loading: true, error: null });
    try {
      const list = await workspaceService.list();
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      const fromStorage = stored ? list.find((w) => w.id === stored) : undefined;
      const current = fromStorage ?? (await workspaceService.resolveCurrent(userId)) ?? null;
      set({ list, current, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "Falha ao carregar workspace" });
    }
  },

  select: (id) => {
    const next = get().list.find((w) => w.id === id);
    if (!next) return;
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, id);
    set({ current: next });
  },
}));

export const useCurrentWorkspace = () => useWorkspaceStore((s) => s.current);
