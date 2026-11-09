import React, { SelectHTMLAttributes, forwardRef, useId } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      description,
      error,
      required = false,
      options,
      placeholder,
      className = '',
      containerClassName = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const descId = `${selectId}-desc`;

    return (
      <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
        )}

        <div className="relative flex items-center w-full">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : description ? descId : undefined}
            className={`
              w-full min-h-[44px] px-3.5 py-2 pr-10 text-sm rounded-xl appearance-none transition-colors duration-150
              bg-white dark:bg-slate-900 
              text-slate-900 dark:text-slate-100 
              border ${
                error
                  ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700/80 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-blue-500/20'
              }
              focus:outline-none focus:ring-3
              disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            {error ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {description && !error && (
          <p id={descId} className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}

        {error && (
          <p id={errorId} className="text-xs font-medium text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
