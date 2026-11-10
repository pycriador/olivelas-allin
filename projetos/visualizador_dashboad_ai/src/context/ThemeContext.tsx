import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ThemeDefinition, ThemeMode } from '../types/theme';
import {
  ALL_THEMES,
  LIGHT_THEMES,
  DARK_THEMES,
  DEFAULT_LIGHT_THEME_ID,
  DEFAULT_DARK_THEME_ID,
} from '../constants/themes';

const STORAGE_KEY = 'survey_analyzer_theme_id';

interface ThemeContextType {
  themeId: string;
  theme: string;
  mode: ThemeMode;
  isDark: boolean;
  currentTheme: ThemeDefinition;
  setTheme: (newThemeId: string) => void;
  toggleTheme: () => void;
  allThemes: ThemeDefinition[];
  lightThemes: ThemeDefinition[];
  darkThemes: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeToDom(theme: ThemeDefinition) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const isDarkMode = theme.mode === 'dark';

  // 1. Toggle dark class for Tailwind
  if (isDarkMode) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // 2. Set active theme data attribute
  root.setAttribute('data-theme', theme.id);

  // 3. Inject CSS Variables directly on root style
  if (theme.variables) {
    Object.entries(theme.variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ALL_THEMES.some((t) => t.id === saved)) {
        return saved;
      }
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? DEFAULT_DARK_THEME_ID : DEFAULT_LIGHT_THEME_ID;
    }
    return DEFAULT_LIGHT_THEME_ID;
  });

  const currentTheme = useMemo<ThemeDefinition>(() => {
    return ALL_THEMES.find((t) => t.id === themeId) || LIGHT_THEMES[0];
  }, [themeId]);

  const mode: ThemeMode = currentTheme.mode;
  const isDark = mode === 'dark';

  // Apply theme immediately and whenever it changes
  useEffect(() => {
    applyThemeToDom(currentTheme);
    localStorage.setItem(STORAGE_KEY, themeId);
  }, [themeId, currentTheme]);

  const setTheme = (newThemeId: string) => {
    const targetTheme = ALL_THEMES.find((t) => t.id === newThemeId);
    if (targetTheme) {
      setThemeIdState(newThemeId);
      applyThemeToDom(targetTheme);
    }
  };

  const toggleTheme = () => {
    if (isDark) {
      // Find corresponding light theme or fallback to default light
      const suffix = currentTheme.id.replace('dark-', '');
      const matchingLight = LIGHT_THEMES.find((t) => t.id.replace('light-', '') === suffix);
      const nextId = matchingLight ? matchingLight.id : DEFAULT_LIGHT_THEME_ID;
      setTheme(nextId);
    } else {
      // Find corresponding dark theme or fallback to default dark
      const suffix = currentTheme.id.replace('light-', '');
      const matchingDark = DARK_THEMES.find((t) => t.id.replace('dark-', '') === suffix);
      const nextId = matchingDark ? matchingDark.id : DEFAULT_DARK_THEME_ID;
      setTheme(nextId);
    }
  };

  const contextValue = useMemo<ThemeContextType>(
    () => ({
      themeId,
      theme: themeId,
      mode,
      isDark,
      currentTheme,
      setTheme,
      toggleTheme,
      allThemes: ALL_THEMES,
      lightThemes: LIGHT_THEMES,
      darkThemes: DARK_THEMES,
    }),
    [themeId, mode, isDark, currentTheme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
