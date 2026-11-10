import { cn } from "@/lib/utils";
import { AVATAR_COLORS, generateAvatarSvg, type AvatarColors } from "@/modules/avatar/types";
import { User } from "lucide-react";

interface AvatarDisplayProps {
  avatarType?: string;
  avatarId?: string | null;
  avatarSlug?: string | null;
  photoUrl?: string | null;
  fullName?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-24 w-24 text-2xl',
};

const svgSizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-24 w-24',
};

export function AvatarDisplay({ avatarType, avatarId, avatarSlug, photoUrl, fullName, size = 'md', className }: AvatarDisplayProps) {
  if (avatarType === 'upload' && photoUrl) {
    return (
      <div className={cn("overflow-hidden rounded-full", sizeMap[size], className)}>
        <img src={photoUrl} alt={fullName ?? 'Avatar'} className="h-full w-full object-cover" />
      </div>
    );
  }

  if (avatarType === 'library' && avatarSlug) {
    const key = avatarSlug.replace('avatar-', '');
    const colors = AVATAR_COLORS[key] ?? AVATAR_COLORS.default;
    return (
      <div className={cn("overflow-hidden rounded-full", svgSizeMap[size], className)}>
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <rect width="100" height="100" rx="20" fill={colors.bg} />
          <circle cx="50" cy="38" r="18" fill={colors.fg} opacity="0.9" />
          <ellipse cx="50" cy="72" rx="30" ry="22" fill={colors.fg} opacity="0.7" />
          <circle cx="42" cy="34" r="2.5" fill={colors.bg} opacity="0.8" />
          <circle cx="58" cy="34" r="2.5" fill={colors.bg} opacity="0.8" />
          <path d="M42 44 Q50 50 58 44" stroke={colors.bg} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
        </svg>
      </div>
    );
  }

  // Fallback: show initial or default icon
  return (
    <div className={cn("flex items-center justify-center rounded-full bg-muted text-muted-foreground", sizeMap[size], className)}>
      {fullName ? (
        <span className="font-medium">{fullName.charAt(0).toUpperCase()}</span>
      ) : (
        <User className="h-1/2 w-1/2" />
      )}
    </div>
  );
}
