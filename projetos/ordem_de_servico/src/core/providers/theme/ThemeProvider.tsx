import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { ThemeMode } from "../../services/configuration";
import { configurationService } from "../../services/configuration";
import { applyAppTheme, DEFAULT_THEME_ID, THEME_COLOR_STORAGE_KEY, THEME_MODE_STORAGE_KEY } from "@/lib/appThemes";

interface ThemeContextValue {
  theme: ThemeMode;
  resolved: "light" | "dark";
  colorTheme: string;
  setTheme: (t: ThemeMode) => void;
  setColorTheme: (colorId: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(THEME_MODE_STORAGE_KEY) as ThemeMode;
      if (saved === "light" || saved === "dark" || saved === "system") return saved;
    }
    return "system";
  });

  const [colorTheme, setColorThemeState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(THEME_COLOR_STORAGE_KEY);
      if (saved) return saved;
    }
    return DEFAULT_THEME_ID;
  });

  const [resolved, setResolved] = useState<"light" | "dark">("light");

  const syncDocument = useCallback((mode: ThemeMode, colorId: string) => {
    if (typeof window === "undefined") return;
    const isDark =
      mode === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : mode === "dark";
    const res: "light" | "dark" = isDark ? "dark" : "light";
    setResolved(res);
    applyAppTheme(colorId, mode);
  }, []);

  useEffect(() => {
    syncDocument(theme, colorTheme);
  }, [theme, colorTheme, syncDocument]);

  useEffect(() => {
    let mounted = true;
    configurationService.get().then((cfg) => {
      if (!mounted) return;
      if (cfg.theme && (cfg.theme === "light" || cfg.theme === "dark" || cfg.theme === "system")) {
        setThemeState(cfg.theme);
        syncDocument(cfg.theme, colorTheme);
      }
    });
    return () => {
      mounted = false;
    };
  }, [colorTheme, syncDocument]);

  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => syncDocument("system", colorTheme);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, colorTheme, syncDocument]);

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_MODE_STORAGE_KEY, t);
    }
    syncDocument(t, colorTheme);
    void configurationService.update({ theme: t });
  };

  const setColorTheme = (colorId: string) => {
    setColorThemeState(colorId);
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_COLOR_STORAGE_KEY, colorId);
    }
    syncDocument(theme, colorId);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolved, colorTheme, setTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
