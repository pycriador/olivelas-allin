import React from 'react';
import { CalendarEvent } from './types';
import { CalendarEventCard } from './CalendarEventCard';
import { Inbox } from 'lucide-react';

export interface CalendarAgendaViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export const CalendarAgendaView: React.FC<CalendarAgendaViewProps> = ({
  events,
  onEventClick,
}) => {
  // Group events by date
  const groupedEvents = events.reduce((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  const sortedDates = Object.keys(groupedEvents).sort();

  if (sortedDates.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
        <Inbox className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Nenhum evento agendado
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          Não há reservas ou compromissos correspondentes aos filtros atuais.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((dateStr) => {
        const dateObj = new Date(dateStr + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });

        const dayEvents = groupedEvents[dateStr];

        return (
          <div key={dateStr} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold capitalize text-slate-900 dark:text-white">
                {formattedDate}
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                ({dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dayEvents.map((ev) => (
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
  );
};
