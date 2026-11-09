import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

const STORAGE_PREFIX = "rafflehub.theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  toggle: () => {},
});

function storageKey(userId?: string | null) {
  return userId ? `${STORAGE_PREFIX}.${userId}` : STORAGE_PREFIX;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [userId, setUserId] = useState<string | null>(null);

  // Read the persisted theme after hydration (per user when signed in).
  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey(userId));
    if (stored === "dark" || stored === "light") {
      setThemeState(stored);
      return;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setThemeState(prefersDark ? "dark" : "light");
  }, [userId]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    function sync() {
      const id = window.localStorage.getItem("rafflehub.currentUserId");
      setUserId(id);
    }
    sync();
    window.addEventListener("rafflehub:user-changed", sync);
    return () => window.removeEventListener("rafflehub:user-changed", sync);
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      window.localStorage.setItem(storageKey(userId), next);
    },
    [userId],
  );

  const toggle = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [setTheme, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function rememberThemeOwner(userId: string | null) {
  if (typeof window === "undefined") return;
  if (userId) window.localStorage.setItem("rafflehub.currentUserId", userId);
  else window.localStorage.removeItem("rafflehub.currentUserId");
  window.dispatchEvent(new Event("rafflehub:user-changed"));
}
