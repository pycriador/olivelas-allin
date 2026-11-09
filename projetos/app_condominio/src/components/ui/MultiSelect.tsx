import React, { useState, useRef, useEffect, useId } from 'react';
import { Check, ChevronDown, X, AlertCircle } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  badgeColor?: string;
}

export interface MultiSelectProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  containerClassName?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  description,
  error,
  required = false,
  options,
  value,
  onChange,
  placeholder = 'Selecione uma ou mais opções...',
  disabled = false,
  containerClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleOption = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const removeOption = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== val));
  };

  return (
    <div ref={containerRef} className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          id={`${generatedId}-label`}
          className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200"
        >
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          aria-labelledby={`${generatedId}-label`}
          aria-expanded={isOpen}
          className={`
            w-full min-h-[44px] px-3.5 py-2 text-left text-sm rounded-xl transition-colors duration-150 flex items-center justify-between gap-2
            bg-white dark:bg-slate-900 
            border ${
              error
                ? 'border-rose-500 focus:border-rose-600 focus:ring-rose-500/20'
                : 'border-slate-200 dark:border-slate-700/80 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-blue-500/20'
            }
            focus:outline-none focus:ring-3
            disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed
          `}
        >
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {value.length === 0 ? (
              <span className="text-slate-400 dark:text-slate-500 text-sm truncate">{placeholder}</span>
            ) : (
              value.map((val) => {
                const opt = options.find((o) => o.value === val);
                return (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                  >
                    <span>{opt?.label || val}</span>
                    <button
                      type="button"
                      onClick={(e) => removeOption(val, e)}
                      className="hover:opacity-75 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-1 text-slate-400 shrink-0">
            {error ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto p-1">
            {options.map((opt) => {
              const isSelected = value.includes(opt.value);
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => toggleOption(opt.value)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors cursor-pointer
                    ${
                      isSelected
                        ? 'bg-blue-50/80 text-blue-700 font-semibold dark:bg-blue-950/40 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }
                  `}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {description && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      )}

      {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
};
