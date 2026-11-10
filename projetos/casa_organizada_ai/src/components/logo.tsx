import { Link } from "@tanstack/react-router";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-2">
      <span
        aria-hidden
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-elegant"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12 12 4l9 8" />
          <path d="M5 10v10h5v-6h4v6h5V10" />
        </svg>
        <span className="absolute inset-0 rounded-xl bg-gradient-brand opacity-0 blur-md transition-opacity group-hover:opacity-70" />
      </span>
      {!compact && (
        <span className="font-display text-base font-semibold tracking-tight">
          HomeFlow
        </span>
      )}
    </Link>
  );
}