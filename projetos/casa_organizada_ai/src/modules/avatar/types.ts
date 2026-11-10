export type AvatarCategory = 'illustration' | 'animal' | 'nature' | 'abstract' | 'emoji' | 'character';
export type AvatarStyle = 'flat' | 'outline' | 'filled' | 'gradient' | 'pixel' | 'minimal';
export type AvatarType = 'none' | 'library' | 'upload';

export interface Avatar {
  id: string;
  slug: string;
  name: string;
  category: AvatarCategory;
  style: AvatarStyle;
  svgContent: string | null;
  pngUrl: string | null;
  colors: string[];
  tags: string[];
  isSystem: boolean;
  sort: number;
}

export interface AvatarColors {
  bg: string;
  fg: string;
  accent: string;
}

// Default avatar color schemes
export const AVATAR_COLORS: Record<string, AvatarColors> = {
  calm: { bg: '#E8F0FE', fg: '#1A73E8', accent: '#1557B0' },
  focus: { bg: '#F3E8FF', fg: '#7C3AED', accent: '#5B21B6' },
  sunny: { bg: '#FEF3C7', fg: '#D97706', accent: '#B45309' },
  nature: { bg: '#D1FAE5', fg: '#059669', accent: '#047857' },
  ocean: { bg: '#DBEAFE', fg: '#2563EB', accent: '#1D4ED8' },
  star: { bg: '#EDE9FE', fg: '#7C3AED', accent: '#6D28D9' },
  heart: { bg: '#FCE7F3', fg: '#DB2777', accent: '#BE185D' },
  default: { bg: '#F3F4F6', fg: '#6B7280', accent: '#4B5563' },
};

// Generated SVG avatars (simple geometric illustrations)
export function generateAvatarSvg(slug: string, colors: AvatarColors): string {
  const initial = slug.replace('avatar-', '').charAt(0).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" rx="20" fill="${colors.bg}"/>
    <circle cx="50" cy="38" r="18" fill="${colors.fg}" opacity="0.9"/>
    <ellipse cx="50" cy="72" rx="30" ry="22" fill="${colors.fg}" opacity="0.7"/>
    <circle cx="42" cy="34" r="2.5" fill="${colors.bg}" opacity="0.8"/>
    <circle cx="58" cy="34" r="2.5" fill="${colors.bg}" opacity="0.8"/>
    <path d="M42 44 Q50 50 58 44" stroke="${colors.bg}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.8"/>
    <text x="50" y="86" text-anchor="middle" font-size="12" font-weight="bold" fill="${colors.accent}" opacity="0.5">${initial}</text>
  </svg>`;
}
