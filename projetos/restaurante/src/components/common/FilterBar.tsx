import React from 'react';
import { Search, X, RotateCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FilterBarProps {
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: FilterField[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, val: string) => void;
  onReset?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function FilterBar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters = [],
  filterValues = {},
  onFilterChange,
  onReset,
  onRefresh,
  isLoading = false,
  children,
}: FilterBarProps) {
  const hasActiveFilters =
    Boolean(search) ||
    Object.values(filterValues).some((v) => Boolean(v && v !== 'all' && v !== ''));

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg border border-border/70 bg-card/60">
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {onSearchChange && (
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-8 h-9 text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {filters.map((filter) => (
          <div key={filter.key} className="flex items-center gap-1.5">
            <select
              value={filterValues[filter.key] || ''}
              onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
              className="h-9 px-2.5 rounded-md border border-border/80 bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {hasActiveFilters && onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-9 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Limpar filtros
          </Button>
        )}

        {children}
      </div>

      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-9 shrink-0 text-xs"
          title="Atualizar lista"
        >
          <RotateCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      )}
    </div>
  );
}
