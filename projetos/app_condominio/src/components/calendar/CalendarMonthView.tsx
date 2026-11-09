import React from 'react';
import { CalendarEvent } from './types';
import { CalendarEventCard } from './CalendarEventCard';

export interface CalendarMonthViewProps {
  year: number;
  month: number; // 0-indexed (0=Jan, 11=Dec)
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDayClick?: (dateStr: string) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  year,
  month,
  events,
  onEventClick,
  onDayClick,
}) => {
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Days in month calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

  const todayStr = '2026-08-28'; // Reference current date

  const cells = Array.from({ length: totalCells }).map((_, idx) => {
    if (idx < firstDayOfMonth) {
      // Prev month trailing
      const dayNum = daysInPrevMonth - firstDayOfMonth + idx + 1;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(
        dayNum
      ).padStart(2, '0')}`;
      return { dayNum, isCurrentMonth: false, dateStr };
    } else if (idx < firstDayOfMonth + daysInMonth) {
      // Current month
      const dayNum = idx - firstDayOfMonth + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
        dayNum
      ).padStart(2, '0')}`;
      return { dayNum, isCurrentMonth: true, dateStr };
    } else {
      // Next month leading
      const dayNum = idx - (firstDayOfMonth + daysInMonth) + 1;
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(
        dayNum
      ).padStart(2, '0')}`;
      return { dayNum, isCurrentMonth: false, dateStr };
    }
  });

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-2.5">
        {daysOfWeek.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-200/60 dark:divide-slate-800/60">
        {cells.map((cell) => {
          const dayEvents = events.filter((e) => e.date === cell.dateStr);
          const isToday = cell.dateStr === todayStr;

          return (
            <div
              key={cell.dateStr}
              onClick={() => onDayClick && onDayClick(cell.dateStr)}
              className={`
                min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors
                ${
                  cell.isCurrentMonth
                    ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                    : 'bg-slate-50/40 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600'
                }
              `}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${
                      isToday
                        ? 'bg-blue-600 text-white shadow-xs'
                        : cell.isCurrentMonth
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-600'
                    }
                  `}
                >
                  {cell.dayNum}
                </span>

                {dayEvents.length > 2 && (
                  <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">
                    +{dayEvents.length - 2} mais
                  </span>
                )}
              </div>

              {/* Event pills in cell */}
              <div className="mt-1 space-y-1 flex-1">
                {dayEvents.slice(0, 2).map((ev) => (
                  <CalendarEventCard
                    key={ev.id}
                    event={ev}
                    compact
                    onClick={() => onEventClick(ev)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
