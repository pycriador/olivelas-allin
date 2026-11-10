import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary:
      'bg-theme-primary text-white hover:bg-theme-primary-hover border border-transparent shadow-xs transition-colors',
    secondary:
      'bg-theme-subtle text-theme-main hover:opacity-90 border border-theme',
    outline:
      'bg-transparent border border-theme text-theme-main hover:bg-theme-subtle',
    ghost:
      'bg-transparent text-theme-muted hover:text-theme-main hover:bg-theme-subtle border border-transparent',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 border border-transparent shadow-xs',
  };

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
    md: 'h-9 px-4 text-sm gap-2 rounded-lg',
    lg: 'h-10 px-5 text-sm gap-2 rounded-lg font-semibold',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 ring-theme-primary disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap active:scale-[0.98]',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
