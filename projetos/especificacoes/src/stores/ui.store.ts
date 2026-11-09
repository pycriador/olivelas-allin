import { create } from "zustand";

interface UIState {
  sidebarCollapsed: boolean;
  searchOpen: boolean;
  setSidebar: (v: boolean) => void;
  toggleSidebar: () => void;
  setSearchOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  searchOpen: false,
  setSidebar: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
}));
