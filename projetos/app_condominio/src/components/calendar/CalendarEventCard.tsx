import React from 'react';
import { Clock, MapPin, User, Users, Flame, PartyPopper, Dumbbell, Sparkles, AlertCircle } from 'lucide-react';
import { CalendarEvent } from './types';
import { Badge } from '../ui/Badge';

export interface CalendarEventCardProps {
  event: CalendarEvent;
  onClick?: () => void;
  compact?: boolean;
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  event,
  onClick,
  compact = false,
}) => {
  // Semantic resource colors and icons for accessibility
  const getResourceMeta = (cat: CalendarEvent['category']) => {
    switch (cat) {
      case 'party_hall':
        return {
          icon: <PartyPopper className="w-3.5 h-3.5" />,
          colorClass: 'border-l-blue-500 bg-blue-50/70 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200',
          badgeColor: 'primary' as const,
        };
      case 'barbecue':
        return {
          icon: <Flame className="w-3.5 h-3.5" />,
          colorClass: 'border-l-amber-500 bg-amber-50/70 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
          badgeColor: 'warning' as const,
        };
      case 'sports':
        return {
          icon: <Dumbbell className="w-3.5 h-3.5" />,
          colorClass: 'border-l-emerald-500 bg-emerald-50/70 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
          badgeColor: 'success' as const,
        };
      case 'assembly':
        return {
          icon: <Users className="w-3.5 h-3.5" />,
          colorClass: 'border-l-purple-500 bg-purple-50/70 text-purple-900 dark:bg-purple-950/40 dark:text-purple-200',
          badgeColor: 'purple' as const,
        };
      case 'maintenance':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5" />,
          colorClass: 'border-l-rose-500 bg-rose-50/70 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200',
          badgeColor: 'error' as const,
        };
      default:
        return {
          icon: <Sparkles className="w-3.5 h-3.5" />,
          colorClass: 'border-l-cyan-500 bg-cyan-50/70 text-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-200',
          badgeColor: 'info' as const,
        };
    }
  };

  const meta = getResourceMeta(event.category);

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`
          px-2 py-1 rounded-md text-[11px] font-semibold border-l-3 transition-all truncate cursor-pointer select-none
          ${meta.colorClass} hover:opacity-85 shadow-2xs
        `}
      >
        <span className="font-bold mr-1">{event.startTime}</span>
        <span>{event.title}</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        p-3.5 sm:p-4 rounded-2xl border-l-4 border transition-all cursor-pointer select-none
        border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700
        ${meta.colorClass.split(' ')[0]} shadow-xs
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            {meta.icon}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {event.title}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <Clock className="w-3 h-3" />
              <span>
                {event.startTime} — {event.endTime}
              </span>
            </div>
          </div>
        </div>

        <Badge variant={meta.badgeColor} size="sm">
          {event.categoryLabel}
        </Badge>
      </div>

      {(event.userName || event.userUnit || event.location) && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          {event.location && (
            <div className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {event.userUnit && (
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Apt {event.userUnit}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
