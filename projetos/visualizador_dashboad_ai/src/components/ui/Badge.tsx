import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.ComponentPropsWithoutRef<'span'> {
  className?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'purple' | 'info' | 'danger';
  size?: 'sm' | 'md';
  children?: React.ReactNode;
}

export function Badge({
  className,
  variant = 'default',
  size = 'sm',
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-theme-subtle text-theme-main border-theme',
    secondary: 'bg-theme-subtle/80 text-theme-muted border-theme/60',
    outline: 'border-theme text-theme-main bg-transparent',
    purple: 'bg-theme-primary-light text-theme-primary-text border-theme',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-semibold rounded-md',
    md: 'text-xs px-2.5 py-1 font-semibold rounded-lg',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border tracking-tight whitespace-nowrap transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
