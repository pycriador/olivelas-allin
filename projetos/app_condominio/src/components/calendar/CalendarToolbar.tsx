import React from 'react';
import { ChevronLeft, ChevronRight, Filter, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { CalendarViewMode } from './types';

export interface CalendarToolbarProps {
  currentDateLabel: string;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewReservation?: () => void;
  filterCount?: number;
  onToggleFilter?: () => void;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  currentDateLabel,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  onNewReservation,
  filterCount = 0,
  onToggleFilter,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
      {/* Date Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onToday}>
          Hoje
        </Button>

        <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 shadow-xs">
          <button
            type="button"
            onClick={onPrev}
            className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Período anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Próximo período"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white capitalize ml-1">
          {currentDateLabel}
        </h2>
      </div>

      {/* Actions & View Modes */}
      <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
        {/* Filter Trigger */}
        {onToggleFilter && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Filter className="w-3.5 h-3.5" />}
            onClick={onToggleFilter}
          >
            <span>Filtros</span>
            {filterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
                {filterCount}
              </span>
            )}
          </Button>
        )}

        {/* View Mode Segmented Controls */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {(
            [
              { id: 'month', label: 'Mês' },
              { id: 'week', label: 'Semana' },
              { id: 'day', label: 'Dia' },
              { id: 'agenda', label: 'Agenda' },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onViewModeChange(mode.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === mode.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {onNewReservation && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={onNewReservation}
          >
            Nova Reserva
          </Button>
        )}
      </div>
    </div>
  );
};
