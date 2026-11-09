import React, { InputHTMLAttributes, forwardRef, useId } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      description,
      error,
      required = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      containerClassName = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const descId = `${inputId}-desc`;

    return (
      <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled || isLoading}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : description ? descId : undefined}
            className={`
              w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl transition-colors duration-150
              bg-white dark:bg-slate-900 
              text-slate-900 dark:text-slate-100 
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              border ${
                error
                  ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700/80 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-blue-500/20'
              }
              focus:outline-none focus:ring-3
              disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon || isLoading || error ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />

          <div className="absolute right-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : error ? (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            ) : (
              rightIcon
            )}
          </div>
        </div>

        {description && !error && (
          <p id={descId} className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}

        {error && (
          <p id={errorId} className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
