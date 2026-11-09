export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeOption {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  hue: number;
}

export const COLOR_FAMILIES = [
  { id: 'ocean', name: 'Oceano', hue: 204 },
  { id: 'forest', name: 'Floresta', hue: 145 },
  { id: 'coral', name: 'Coral', hue: 12 },
  { id: 'violet', name: 'Violeta', hue: 272 },
  { id: 'amber', name: 'Âmbar', hue: 38 },
  { id: 'rose', name: 'Rosa', hue: 340 },
  { id: 'turquoise', name: 'Turquesa', hue: 174 },
  { id: 'slate', name: 'Ardósia', hue: 218 },
  { id: 'lime', name: 'Lima', hue: 91 },
  { id: 'plum', name: 'Ameixa', hue: 302 },
  { id: 'cobalt', name: 'Cobalto', hue: 229 },
  { id: 'mint', name: 'Menta', hue: 159 },
  { id: 'copper', name: 'Cobre', hue: 25 },
  { id: 'sky', name: 'Céu', hue: 192 },
  { id: 'orchid', name: 'Orquídea', hue: 319 },
] as const;

export const APP_THEMES: ThemeOption[] = COLOR_FAMILIES.flatMap((family) => [
  { ...family, id: `${family.id}-light`, mode: 'light' as const },
  { ...family, id: `${family.id}-dark`, mode: 'dark' as const },
]);

export const DEFAULT_THEME_ID = 'ocean-dark';
export const THEME_COLOR_STORAGE_KEY = 'sf_color_theme';
export const THEME_MODE_STORAGE_KEY = 'sf_theme_mode';

export function getThemeTokens(theme: ThemeOption): Record<string, string> {
  const { hue, mode } = theme;
  const dark = mode === 'dark';

  const background = dark ? `hsl(${hue} 20% 8%)` : `hsl(${hue} 28% 98%)`;
  const foreground = dark ? `hsl(${hue} 12% 94%)` : `hsl(${hue} 24% 12%)`;
  const surface = dark ? `hsl(${hue} 18% 11%)` : `hsl(0 0% 100%)`;
  const elevated = dark ? `hsl(${hue} 19% 14%)` : `hsl(${hue} 24% 95%)`;
  const primary = dark ? `hsl(${hue} 72% 62%)` : `hsl(${hue} 72% 43%)`;
  const primaryForeground = dark ? `hsl(${hue} 25% 10%)` : '#ffffff';
  const secondary = dark ? `hsl(${hue} 18% 18%)` : `hsl(${hue} 22% 92%)`;
  const secondaryForeground = foreground;
  const muted = dark ? `hsl(${hue} 17% 16%)` : `hsl(${hue} 20% 93%)`;
  const mutedForeground = dark ? `hsl(${hue} 11% 65%)` : `hsl(${hue} 12% 42%)`;
  const accent = dark ? `hsl(${hue} 20% 20%)` : `hsl(${hue} 24% 92%)`;
  const accentForeground = foreground;
  const border = dark ? `hsl(${hue} 15% 20%)` : `hsl(${hue} 17% 88%)`;
  const sidebar = dark ? `hsl(${hue} 22% 7%)` : `hsl(${hue} 22% 99%)`;
  const sidebarElevated = dark ? `hsl(${hue} 20% 12%)` : `hsl(${hue} 20% 94%)`;

  return {
    '--background': background,
    '--foreground': foreground,
    '--card': surface,
    '--card-foreground': foreground,
    '--popover': surface,
    '--popover-foreground': foreground,
    '--primary': primary,
    '--primary-foreground': primaryForeground,
    '--secondary': secondary,
    '--secondary-foreground': secondaryForeground,
    '--muted': muted,
    '--muted-foreground': mutedForeground,
    '--accent': accent,
    '--accent-foreground': accentForeground,
    '--destructive': 'hsl(0 72% 51%)',
    '--destructive-foreground': '#ffffff',
    '--border': border,
    '--input': border,
    '--ring': primary,
    '--sidebar': sidebar,
    '--sidebar-foreground': foreground,
    '--sidebar-primary': primary,
    '--sidebar-primary-foreground': primaryForeground,
    '--sidebar-accent': sidebarElevated,
    '--sidebar-accent-foreground': foreground,
    '--sidebar-border': border,
    '--sidebar-ring': primary,
    '--surface': surface,
    '--surface-elevated': elevated,
  };
}

export function applyAppTheme(themeId: string | null, modeOverride?: 'light' | 'dark' | 'system') {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const targetId = themeId || DEFAULT_THEME_ID;
  const theme = APP_THEMES.find((option) => option.id === targetId) || APP_THEMES[0];

  const effectiveMode = modeOverride === 'system' || !modeOverride
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : modeOverride;

  const resolvedTheme = APP_THEMES.find((t) => t.hue === theme.hue && t.mode === effectiveMode) || theme;

  root.dataset.appTheme = resolvedTheme.id;
  root.classList.toggle('dark', resolvedTheme.mode === 'dark');
  root.classList.toggle('light', resolvedTheme.mode === 'light');

  const tokens = getThemeTokens(resolvedTheme);
  Object.entries(tokens).forEach(([varName, val]) => {
    root.style.setProperty(varName, val);
  });
}
