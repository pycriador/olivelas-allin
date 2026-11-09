import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'ghost'
  | 'destructive'
  | 'link'
  | 'icon'
  | 'outline';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      fullWidth = false,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Base styles with WCAG 2.2 AA compliant focus rings, safe touch targets and smooth transitions
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs border border-transparent dark:bg-blue-600 dark:hover:bg-blue-500',
      secondary:
        'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 dark:border-slate-700',
      tertiary:
        'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 border border-transparent dark:text-slate-300 dark:hover:bg-slate-800',
      ghost:
        'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 border border-transparent',
      destructive:
        'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs border border-transparent dark:bg-rose-600 dark:hover:bg-rose-500',
      link:
        'bg-transparent text-blue-600 dark:text-blue-400 hover:underline p-0 h-auto min-h-0 font-semibold border-none active:scale-100',
      icon:
        'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 rounded-lg p-2 aspect-square',
      outline:
        'bg-transparent hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[36px] rounded-lg',
      md: 'text-sm px-4 py-2 gap-2 min-h-[44px] rounded-xl',
      lg: 'text-base px-5 py-2.5 gap-2.5 min-h-[48px] rounded-xl',
    };

    // Override size padding for icon-only variant
    const appliedSizeStyle = variant === 'icon' ? 'min-h-[40px] min-w-[40px] p-2 rounded-lg' : sizeStyles[size];

    return (
      <button
        ref={ref}
        type={type}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${appliedSizeStyle}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="animate-spin h-4 w-4 text-current shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>
        )}
        {children && <span className="truncate">{children}</span>}
        {!isLoading && rightIcon && (
          <span className="shrink-0 flex items-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
