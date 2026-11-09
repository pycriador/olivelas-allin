import React, { InputHTMLAttributes, forwardRef, useId } from 'react';

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  description?: string;
  error?: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
  containerClassName?: string;
}

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ id, name, label, description, error, className = '', disabled, checked, onChange, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={inputId}
          className={`inline-flex items-start gap-3 select-none cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="relative flex items-center justify-center mt-0.5 shrink-0">
            <input
              ref={ref}
              type="radio"
              id={inputId}
              name={name}
              checked={checked}
              disabled={disabled}
              onChange={onChange}
              className="peer sr-only"
              {...props}
            />
            <div
              className={`
                w-5 h-5 rounded-full border transition-all duration-150 flex items-center justify-center
                border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900
                peer-checked:border-blue-600 dark:peer-checked:border-blue-500
                peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/30 peer-focus-visible:ring-offset-2
              `}
            >
              {checked && (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-500" />
              )}
            </div>
          </div>

          {label && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">
                {label}
              </span>
              {description && (
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {description}
                </span>
              )}
            </div>
          )}
        </label>

        {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  description,
  error,
  options,
  value,
  onChange,
  disabled = false,
  orientation = 'vertical',
  containerClassName = '',
}) => {
  return (
    <div className={`w-full flex flex-col gap-2 ${containerClassName}`}>
      {label && (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      )}

      <div
        className={`flex ${
          orientation === 'vertical' ? 'flex-col gap-2.5' : 'flex-row flex-wrap gap-4'
        }`}
      >
        {options.map((opt) => {
          const isChecked = value === opt.value;
          const isDisabled = disabled || opt.disabled;

          return (
            <label
              key={opt.value}
              className={`inline-flex items-start gap-3 select-none cursor-pointer ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                <input
                  type="radio"
                  name={name}
                  value={opt.value}
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => onChange(opt.value)}
                  className="peer sr-only"
                />
                <div
                  className={`
                    w-5 h-5 rounded-full border transition-all duration-150 flex items-center justify-center
                    border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900
                    peer-checked:border-blue-600 dark:peer-checked:border-blue-500
                    peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/30 peer-focus-visible:ring-offset-2
                  `}
                >
                  {isChecked && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-500" />
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">
                  {opt.label}
                </span>
                {opt.description && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {opt.description}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {description && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      )}

      {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
};
