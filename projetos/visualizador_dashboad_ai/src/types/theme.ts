export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;       // Accent / main brand color (e.g. #4f46e5)
  primaryHover: string;  // Darker/lighter on hover
  primaryLight: string;  // Soft background tint for active states/badges
  primaryText: string;   // Text color when background is primaryLight
  bgCanvas: string;      // Main background (e.g. #f8fafc)
  bgSurface: string;     // Card / container background (e.g. #ffffff)
  bgSubtle: string;      // Subdued background for inputs, badges, hover
  borderColor: string;   // Default border color
  borderFocus: string;   // Focus border
  textMain: string;      // Primary heading and body text
  textMuted: string;     // Secondary descriptive text
  textFaint: string;     // Subdued hints and timestamps
  accentBadge: string;   // Pill / Highlight color
}

export interface ThemeDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  mode: ThemeMode;
  previewColors: {
    bg: string;
    surface: string;
    primary: string;
    accent: string;
  };
  variables: Record<string, string>;
}
