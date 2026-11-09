/**
 * Condominium Platform — Design System Tokens
 * Central source of truth for color, typography, spacing, radius, shadow, border, motion, and breakpoints.
 */

export const tokens = {
  // 1. Color System (Semantic Tokens)
  color: {
    // Primary Brand (Deep Blue)
    primary: {
      default: '#2563EB', // blue-600
      hover: '#1D4ED8',   // blue-700
      active: '#1E40AF',  // blue-800
      subtle: '#EFF6FF',  // blue-50
      darkSubtle: 'rgba(37, 99, 235, 0.15)',
      foreground: '#FFFFFF',
    },

    // Neutral Surfaces & Canvases
    canvas: {
      light: '#F8FAFC',   // slate-50 / off-white
      dark: '#0B0F17',    // ultra-deep enterprise slate
    },
    surface: {
      light: '#FFFFFF',
      dark: '#0F172A',    // slate-900
      secondaryLight: '#F1F5F9', // slate-100
      secondaryDark: '#1E293B',  // slate-800
      elevatedLight: '#FFFFFF',
      elevatedDark: '#1E293B',
    },

    // Foregrounds & Typography
    foreground: {
      primaryLight: '#0F172A',   // slate-900
      primaryDark: '#F8FAFC',    // slate-50
      secondaryLight: '#475569', // slate-600
      secondaryDark: '#94A3B8',  // slate-400
      mutedLight: '#94A3B8',     // slate-400
      mutedDark: '#64748B',      // slate-500
    },

    // Borders & Dividers
    border: {
      subtleLight: '#F1F5F9',    // slate-100
      subtleDark: '#1E293B',     // slate-800
      defaultLight: '#E2E8F0',   // slate-200
      defaultDark: '#334155',    // slate-700
      strongLight: '#CBD5E1',    // slate-300
      strongDark: '#475569',     // slate-600
    },

    // Semantic Status Colors
    status: {
      success: {
        text: '#059669', // emerald-600
        bg: '#ECFDF5',   // emerald-50
        border: '#A7F3D0',
        darkText: '#34D399',
        darkBg: 'rgba(5, 150, 105, 0.15)',
        darkBorder: '#065F46',
      },
      warning: {
        text: '#D97706', // amber-600
        bg: '#FFFBEB',   // amber-50
        border: '#FDE68A',
        darkText: '#FBBF24',
        darkBg: 'rgba(217, 119, 6, 0.15)',
        darkBorder: '#78350F',
      },
      error: {
        text: '#DC2626', // red-600
        bg: '#FEF2F2',   // red-50
        border: '#FECACA',
        darkText: '#F87171',
        darkBg: 'rgba(220, 38, 38, 0.15)',
        darkBorder: '#7F1D1D',
      },
      info: {
        text: '#2563EB', // blue-600
        bg: '#EFF6FF',   // blue-50
        border: '#BFDBFE',
        darkText: '#60A5FA',
        darkBg: 'rgba(37, 99, 235, 0.15)',
        darkBorder: '#1E40AF',
      },
      purple: {
        text: '#7C3AED', // purple-600
        bg: '#F5F3FF',   // purple-50
        border: '#DDD6FE',
        darkText: '#A78BFA',
        darkBg: 'rgba(124, 58, 237, 0.15)',
        darkBorder: '#4C1D95',
      },
    },

    // Resource Palette (for calendar & spaces)
    resources: {
      partyHall: { bg: '#3B82F6', lightBg: '#EFF6FF', text: '#1D4ED8', label: 'Salão de Festas' },
      barbecue: { bg: '#F59E0B', lightBg: '#FFFBEB', text: '#B45309', label: 'Churrasqueira' },
      sports: { bg: '#10B981', lightBg: '#ECFDF5', text: '#047857', label: 'Quadras Esportivas' },
      leisure: { bg: '#06B6D4', lightBg: '#ECFEFF', text: '#0E7490', label: 'Piscina & Lazer' },
      work: { bg: '#6366F1', lightBg: '#EEF2FF', text: '#4338CA', label: 'Coworking' },
      wellness: { bg: '#EC4899', lightBg: '#FDF2F8', text: '#BE185D', label: 'Espaço Fitness' },
    },
  },

  // 2. Typography Scale
  typography: {
    fontFamily: {
      sans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    display: {
      size: '2rem', // 32px
      lineHeight: '2.5rem',
      fontWeight: '700',
      letterSpacing: '-0.025em',
    },
    h1: {
      size: '1.5rem', // 24px
      lineHeight: '2rem',
      fontWeight: '700',
      letterSpacing: '-0.02em',
    },
    h2: {
      size: '1.25rem', // 20px
      lineHeight: '1.75rem',
      fontWeight: '600',
      letterSpacing: '-0.015em',
    },
    h3: {
      size: '1rem', // 16px
      lineHeight: '1.5rem',
      fontWeight: '600',
      letterSpacing: '-0.01em',
    },
    h4: {
      size: '0.875rem', // 14px
      lineHeight: '1.25rem',
      fontWeight: '600',
      letterSpacing: '0',
    },
    bodyLarge: {
      size: '1rem', // 16px
      lineHeight: '1.5rem',
      fontWeight: '400',
    },
    body: {
      size: '0.875rem', // 14px
      lineHeight: '1.25rem',
      fontWeight: '400',
    },
    bodySmall: {
      size: '0.75rem', // 12px
      lineHeight: '1rem',
      fontWeight: '400',
    },
    label: {
      size: '0.75rem', // 12px
      lineHeight: '1rem',
      fontWeight: '600',
      letterSpacing: '0.025em',
    },
    caption: {
      size: '0.6875rem', // 11px
      lineHeight: '0.875rem',
      fontWeight: '400',
    },
    overline: {
      size: '0.625rem', // 10px
      lineHeight: '0.75rem',
      fontWeight: '700',
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
    },
  },

  // 3. Spacing Scale (in rems & px)
  spacing: {
    0: '0px',
    1: '0.25rem', // 4px
    2: '0.5rem',  // 8px
    3: '0.75rem', // 12px
    4: '1rem',    // 16px
    5: '1.25rem', // 20px
    6: '1.5rem',  // 24px
    8: '2rem',    // 32px
    10: '2.5rem', // 40px
    12: '3rem',   // 48px
    16: '4rem',   // 64px
  },

  // 4. Border Radius Scale
  radius: {
    none: '0px',
    small: '0.375rem', // 6px (buttons, small badges, inputs)
    medium: '0.5rem',  // 8px (standard controls, tags)
    large: '0.75rem',  // 12px (cards, dropdowns)
    xlarge: '1rem',    // 16px (major panels, modals)
    xxlarge: '1.5rem', // 24px (bottom sheet top)
    pill: '9999px',    // pills, rounded badges, avatars
  },

  // 5. Shadows
  shadow: {
    none: 'none',
    subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    elevated: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
    modal: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },

  // 6. Motion & Transitions
  motion: {
    durationFast: '100ms',
    durationNormal: '150ms',
    durationSlow: '250ms',
    durationSheet: '300ms',
    easingStandard: 'cubic-bezier(0.16, 1, 0.3, 1)', // spring ease-out
    easingInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // 7. Breakpoints
  breakpoints: {
    mobileXs: 320,
    mobileSm: 375,
    mobileMd: 390,
    mobileLg: 430,
    tablet: 768,
    laptop: 1024,
    desktop: 1280,
    wide: 1440,
    ultra: 1920,
  },

  // 8. Z-Index Scale
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    backdrop: 40,
    modal: 50,
    popover: 60,
    toast: 70,
    tooltip: 80,
  },
} as const;

export type DesignTokens = typeof tokens;
