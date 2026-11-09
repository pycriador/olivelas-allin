import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { THEME_STORAGE_KEY, THEMES } from "@/constants/app";
import type { Theme } from "@/types";

interface ThemeState {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") return getSystemTheme();
  return theme;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "system",
      resolvedTheme: typeof window === "undefined" ? "light" : resolveTheme("system"),
      setTheme: (theme) =>
        set({
          theme,
          resolvedTheme: resolveTheme(theme),
        }),
      toggleTheme: () => {
        const current = get().resolvedTheme;
        const next: Theme = current === "dark" ? "light" : "dark";
        set({ theme: next, resolvedTheme: next });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.resolvedTheme = resolveTheme(state.theme);
        }
      },
      version: 1,
    },
  ),
);

export { THEMES };
