import React from 'react';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'purple'
  | 'outline'
  | 'neutral';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    primary:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    secondary:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    success:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    warning:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    error:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    info:
      'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
    purple:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    outline:
      'bg-transparent text-slate-700 border-slate-300 dark:text-slate-300 dark:border-slate-600',
    neutral:
      'bg-slate-100 text-slate-600 border-transparent dark:bg-slate-800 dark:text-slate-400',
  };

  const dotColors: Record<BadgeVariant, string> = {
    primary: 'bg-blue-600',
    secondary: 'bg-slate-500',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    error: 'bg-rose-600',
    info: 'bg-cyan-600',
    purple: 'bg-purple-600',
    outline: 'bg-slate-400',
    neutral: 'bg-slate-400',
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[10px] px-2.5 py-1 gap-1.5 leading-tight',
    md: 'text-xs px-3 py-1.5 gap-1.5 leading-tight',
    lg: 'text-sm px-3.5 py-2 gap-2 leading-tight',
  };

  return (
    <span
      className={`
        inline-flex items-center font-semibold rounded-full border whitespace-nowrap leading-none select-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
      )}
      <span>{children}</span>
    </span>
  );
};
