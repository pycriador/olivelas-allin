import React from 'react';
import { CalendarEvent } from './types';
import { CalendarEventCard } from './CalendarEventCard';

export interface CalendarWeekViewProps {
  startDateStr: string; // First day of the week
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  startDateStr,
  events,
  onEventClick,
}) => {
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const start = new Date(startDateStr);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    return {
      dayName: daysOfWeek[d.getDay()],
      dayNumber: d.getDate(),
      dateStr,
    };
  });

  const hours = Array.from({ length: 15 }).map((_, i) => i + 8); // 08:00 to 22:00

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-xs">
      <div className="min-w-[700px]">
        {/* Header Days */}
        <div className="grid grid-cols-8 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-bold text-slate-600 dark:text-slate-400 py-3 text-center">
          <div className="text-slate-400 font-normal">Hora</div>
          {weekDays.map((wd) => (
            <div key={wd.dateStr}>
              <span>{wd.dayName}</span>{' '}
              <span className="font-extrabold text-slate-900 dark:text-white">{wd.dayNumber}</span>
            </div>
          ))}
        </div>

        {/* Time Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {hours.map((hour) => {
            const timeLabel = `${String(hour).padStart(2, '0')}:00`;

            return (
              <div key={hour} className="grid grid-cols-8 min-h-[56px] text-xs">
                {/* Time gutter */}
                <div className="p-2 text-slate-400 text-right pr-3 font-mono text-[11px] border-r border-slate-100 dark:border-slate-800/60">
                  {timeLabel}
                </div>

                {/* 7 Days Columns */}
                {weekDays.map((wd) => {
                  const matchingEvents = events.filter(
                    (e) => e.date === wd.dateStr && e.startTime.startsWith(String(hour).padStart(2, '0'))
                  );

                  return (
                    <div
                      key={wd.dateStr}
                      className="p-1 border-r border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors flex flex-col gap-1"
                    >
                      {matchingEvents.map((ev) => (
                        <CalendarEventCard
                          key={ev.id}
                          event={ev}
                          compact
                          onClick={() => onEventClick(ev)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
