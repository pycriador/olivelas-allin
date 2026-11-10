import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

interface LogoProps {
  className?: string;
  showSubtitle?: boolean;
  to?: string;
}

export function Logo({ className, showSubtitle = false, to = '/' }: LogoProps) {
  const content = (
    <div className={cn('inline-flex items-center gap-2.5 select-none group', className)}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
        {/* Sleek culinary olive badge */}
        <svg
          viewBox="0 0 24 24"
          className="h-4.5 w-4.5 fill-current"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 3C8 6 6 10 7 15C8.5 15.5 12 14.5 14 12C16 9.5 15 6 12 3Z" fill="currentColor" opacity="0.9" />
          <path d="M15 11C14 15 12 18 8 19C7.5 16.5 8.5 13 11 11C12.5 10 14 10.5 15 11Z" fill="currentColor" opacity="0.75" />
          <circle cx="11.5" cy="14" r="1.5" fill="var(--background, #fff)" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-base tracking-tight text-foreground leading-tight">
          Olivelas - <span className="text-primary font-medium">Gestão de Restaurantes & KDS</span>
        </span>
        {showSubtitle && (
          <span className="text-[11px] font-medium text-muted-foreground tracking-wide">
            Super Administrador • All In
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md">
        {content}
      </Link>
    );
  }

  return content;
}
