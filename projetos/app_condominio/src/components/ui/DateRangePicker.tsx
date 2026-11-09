import React from 'react';
import { Calendar } from 'lucide-react';

export interface DateRangePickerProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  startDate: string;
  endDate: string;
  onChangeStartDate: (val: string) => void;
  onChangeEndDate: (val: string) => void;
  disabled?: boolean;
  containerClassName?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  label,
  description,
  error,
  required = false,
  startDate,
  endDate,
  onChangeStartDate,
  onChangeEndDate,
  disabled = false,
  containerClassName = '',
}) => {
  return (
    <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="relative flex items-center">
          <Calendar className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="date"
            disabled={disabled}
            value={startDate}
            onChange={(e) => onChangeStartDate(e.target.value)}
            className="w-full min-h-[44px] pl-10 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-600 disabled:opacity-50"
            aria-label="Data inicial"
          />
        </div>
        <div className="relative flex items-center">
          <Calendar className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="date"
            disabled={disabled}
            value={endDate}
            min={startDate}
            onChange={(e) => onChangeEndDate(e.target.value)}
            className="w-full min-h-[44px] pl-10 pr-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-600 disabled:opacity-50"
            aria-label="Data final"
          />
        </div>
      </div>

      {description && !error && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      )}

      {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
};
