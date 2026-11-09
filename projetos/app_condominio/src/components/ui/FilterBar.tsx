import React, { useState } from 'react';
import { Filter, X, Check } from 'lucide-react';
import { Button } from './Button';
import { BottomSheet } from './BottomSheet';

export interface FilterItem {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
}

export interface FilterBarProps {
  filters: FilterItem[];
  onClearAll?: () => void;
  activeFilterCount?: number;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onClearAll,
  activeFilterCount = 0,
  className = '',
}) => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  return (
    <>
      {/* Desktop Filter Row (md and above) */}
      <div className={`hidden md:flex items-center gap-2.5 flex-wrap ${className}`}>
        {filters.map((f) => (
          <select
            key={f.id}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className="min-h-[36px] px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
          >
            {f.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}

        {activeFilterCount > 0 && onClearAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            leftIcon={<X className="w-3.5 h-3.5" />}
          >
            Limpar filtros ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Mobile Filter Button (sm and below) */}
      <div className="md:hidden flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Filter className="w-3.5 h-3.5" />}
          onClick={() => setIsMobileFilterOpen(true)}
        >
          <span>Filtros</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ml-1">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && onClearAll && (
          <button
            onClick={onClearAll}
            className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            Limpar todos
          </button>
        )}
      </div>

      {/* Mobile Filters Bottom Sheet */}
      <BottomSheet
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Filtrar Resultados"
      >
        <div className="space-y-4">
          {filters.map((f) => (
            <div key={f.id} className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {f.label}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {f.options.map((opt) => {
                  const isSelected = f.value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => f.onChange(opt.value)}
                      className={`
                        p-2.5 rounded-xl border text-xs font-semibold transition-all text-left flex items-center justify-between
                        ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }
                      `}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="pt-4 flex items-center gap-3">
            {onClearAll && (
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => {
                  onClearAll();
                  setIsMobileFilterOpen(false);
                }}
              >
                Limpar Todos
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => setIsMobileFilterOpen(false)}
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
};
