import React from 'react';

export interface CalendarDatePickerProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  days: { dateStr: string; dayNumber: number; dayName: string; isToday: boolean; hasEvents: boolean }[];
}

export const CalendarDatePicker: React.FC<CalendarDatePickerProps> = ({
  selectedDate,
  onSelectDate,
  days,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-2 px-1 no-scrollbar border-b border-slate-100 dark:border-slate-800">
      {days.map((d) => {
        const isSelected = d.dateStr === selectedDate;

        return (
          <button
            key={d.dateStr}
            type="button"
            onClick={() => onSelectDate(d.dateStr)}
            className={`
              flex flex-col items-center justify-center min-w-[48px] py-2 px-1.5 rounded-2xl transition-all cursor-pointer select-none
              ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : d.isToday
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }
            `}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isSelected ? 'text-blue-100' : 'text-slate-400'
              }`}
            >
              {d.dayName}
            </span>
            <span className="text-base font-bold my-0.5">{d.dayNumber}</span>
            {d.hasEvents && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSelected ? 'bg-white' : 'bg-blue-600 dark:bg-blue-400'
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
