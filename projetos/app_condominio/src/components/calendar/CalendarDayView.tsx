import React from 'react';
import { CalendarEvent } from './types';
import { CalendarEventCard } from './CalendarEventCard';

export interface CalendarDayViewProps {
  dateStr: string; // YYYY-MM-DD
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  dateStr,
  events,
  onEventClick,
}) => {
  const hours = Array.from({ length: 16 }).map((_, i) => i + 7); // 07:00 to 22:00
  const dayEvents = events.filter((e) => e.date === dateStr);

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
        {hours.map((hour) => {
          const hourPrefix = String(hour).padStart(2, '0');
          const matchingEvents = dayEvents.filter((e) => e.startTime.startsWith(hourPrefix));

          return (
            <div
              key={hour}
              className="flex items-start min-h-[64px] hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors"
            >
              {/* Hour Column */}
              <div className="w-16 sm:w-20 p-3 text-right text-xs font-mono font-semibold text-slate-400 border-r border-slate-100 dark:border-slate-800 shrink-0">
                {hourPrefix}:00
              </div>

              {/* Event Area */}
              <div className="flex-1 p-2 flex flex-col gap-2">
                {matchingEvents.map((ev) => (
                  <CalendarEventCard
                    key={ev.id}
                    event={ev}
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
