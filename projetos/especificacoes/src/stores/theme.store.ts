import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";
export type ThemePalette =
  | "corporate-blue"
  | "emerald"
  | "purple"
  | "orange"
  | "dark-graphite"
  | "light";

interface ThemeState {
  mode: ThemeMode;
  palette: ThemePalette;
  setMode: (mode: ThemeMode) => void;
  setPalette: (palette: ThemePalette) => void;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "light",
      palette: "corporate-blue",
      setMode: (mode) => set({ mode }),
      setPalette: (palette) => set({ palette }),
      toggleMode: () => set({ mode: get().mode === "light" ? "dark" : "light" }),
    }),
    { name: "specforge:theme" },
  ),
);
