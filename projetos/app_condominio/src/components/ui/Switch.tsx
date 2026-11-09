import React, { useId } from 'react';

export interface SwitchProps {
  label?: React.ReactNode;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  id,
  size = 'md',
  className = '',
}) => {
  const generatedId = useId();
  const switchId = id || generatedId;

  const trackSizes = {
    sm: 'w-8 h-4.5',
    md: 'w-11 h-6',
  };

  const thumbSizes = {
    sm: 'w-3.5 h-3.5 peer-checked:translate-x-3.5',
    md: 'w-5 h-5 peer-checked:translate-x-5',
  };

  return (
    <label
      htmlFor={switchId}
      className={`inline-flex items-start justify-between gap-4 select-none cursor-pointer group ${
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
      } ${className}`}
    >
      {(label || description) && (
        <div className="flex flex-col flex-1">
          {label && (
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</span>
          )}
        </div>
      )}

      <div className="relative inline-flex items-center shrink-0 mt-0.5">
        <input
          id={switchId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
          role="switch"
          aria-checked={checked}
        />
        <div
          className={`
            ${trackSizes[size]} rounded-full transition-colors duration-200 ease-in-out
            bg-slate-200 dark:bg-slate-700
            peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600
            peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/30 peer-focus-visible:ring-offset-2
          `}
        />
        <div
          className={`
            absolute left-0.5 bg-white rounded-full transition-transform duration-200 ease-in-out shadow-xs
            ${thumbSizes[size]}
          `}
        />
      </div>
    </label>
  );
};
