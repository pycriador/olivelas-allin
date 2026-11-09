import React, { TextareaHTMLAttributes, forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      description,
      error,
      required = false,
      showCharCount = false,
      maxLength,
      value,
      className = '',
      containerClassName = '',
      id,
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const descId = `${textareaId}-desc`;

    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={textareaId}
              className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <span>{label}</span>
              {required && <span className="text-rose-500 font-bold">*</span>}
            </label>
          )}

          {showCharCount && maxLength && (
            <span className="text-[11px] font-mono text-slate-400">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>

        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            rows={rows}
            maxLength={maxLength}
            value={value}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : description ? descId : undefined}
            className={`
              w-full p-3.5 text-sm rounded-xl transition-colors duration-150
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
              resize-y min-h-[80px]
              ${className}
            `}
            {...props}
          />
        </div>

        {description && !error && (
          <p id={descId} className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}

        {error && (
          <p id={errorId} className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
