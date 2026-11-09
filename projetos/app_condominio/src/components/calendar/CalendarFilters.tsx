import React from 'react';
import { CalendarEventCategory } from './types';
import { PartyPopper, Flame, Dumbbell, Sparkles, Users, AlertCircle } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';

export interface CalendarFiltersProps {
  selectedCategories: CalendarEventCategory[];
  onToggleCategory: (cat: CalendarEventCategory) => void;
  onClearAll: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const categoryOptions: {
  id: CalendarEventCategory;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
}[] = [
  {
    id: 'party_hall',
    label: 'Salão de Festas',
    icon: <PartyPopper className="w-3.5 h-3.5 text-blue-500" />,
    colorClass: 'bg-blue-500',
  },
  {
    id: 'barbecue',
    label: 'Churrasqueiras',
    icon: <Flame className="w-3.5 h-3.5 text-amber-500" />,
    colorClass: 'bg-amber-500',
  },
  {
    id: 'sports',
    label: 'Esportes & Quadras',
    icon: <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />,
    colorClass: 'bg-emerald-500',
  },
  {
    id: 'leisure',
    label: 'Lazer & Gourmet',
    icon: <Sparkles className="w-3.5 h-3.5 text-cyan-500" />,
    colorClass: 'bg-cyan-500',
  },
  {
    id: 'assembly',
    label: 'Assembleias',
    icon: <Users className="w-3.5 h-3.5 text-purple-500" />,
    colorClass: 'bg-purple-500',
  },
  {
    id: 'maintenance',
    label: 'Manutenções',
    icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500" />,
    colorClass: 'bg-rose-500',
  },
];

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  selectedCategories,
  onToggleCategory,
  onClearAll,
  isOpenMobile,
  onCloseMobile,
}) => {
  const filterPills = (
    <div className="flex items-center gap-1.5 flex-wrap">
      {categoryOptions.map((opt) => {
        const isSelected =
          selectedCategories.length === 0 || selectedCategories.includes(opt.id);

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggleCategory(opt.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none
              ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 border-transparent text-slate-400 opacity-60'
              }
            `}
          >
            <span className={`w-2 h-2 rounded-full ${opt.colorClass}`} />
            <span>{opt.label}</span>
          </button>
        );
      })}

      {selectedCategories.length > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline px-2 cursor-pointer"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Filter Row */}
      <div className="hidden sm:block py-2">{filterPills}</div>

      {/* Mobile Filter Bottom Sheet */}
      <BottomSheet
        isOpen={isOpenMobile}
        onClose={onCloseMobile}
        title="Filtrar por Categoria"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2">
            {categoryOptions.map((opt) => {
              const isSelected =
                selectedCategories.length === 0 || selectedCategories.includes(opt.id);

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onToggleCategory(opt.id)}
                  className={`
                    flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold transition-all
                    ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    {opt.icon}
                    <span>{opt.label}</span>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${opt.colorClass}`} />
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Button variant="secondary" size="md" fullWidth onClick={onClearAll}>
              Todos
            </Button>
            <Button variant="primary" size="md" fullWidth onClick={onCloseMobile}>
              Aplicar
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
};
