import React, { useState, useMemo } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { Button } from './Button';

export interface ColumnDef<T> {
  id: string;
  header: React.ReactNode;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  mobileHidden?: boolean;
  mobilePrimary?: boolean; // Main title in mobile card view
  mobileSecondary?: boolean; // Subtitle in mobile card view
  mobileBadge?: boolean; // Badge in mobile card view
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  enableSelection?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  bulkActions?: (selectedIds: string[]) => React.ReactNode;
  initialSortColumn?: string;
  initialSortDirection?: 'asc' | 'desc';
  pageSize?: number;
  mobileCardRender?: (item: T, isSelected: boolean, onToggleSelect: () => void) => React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Buscar...',
  searchFilter,
  isLoading = false,
  error,
  onRetry,
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription = 'Não existem dados correspondentes aos filtros selecionados.',
  onRowClick,
  enableSelection = false,
  selectedIds = [],
  onSelectionChange,
  bulkActions,
  initialSortColumn,
  initialSortDirection = 'asc',
  pageSize = 10,
  mobileCardRender,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | undefined>(initialSortColumn);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() =>
    columns.reduce((acc, col) => ({ ...acc, [col.id]: true }), {})
  );
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    if (searchFilter) {
      return data.filter((item) => searchFilter(item, searchQuery.toLowerCase()));
    }
    return data.filter((item) =>
      Object.values(item as Record<string, unknown>).some(
        (val) => val && String(val).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery, searchFilter]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    const col = columns.find((c) => c.id === sortColumn);
    if (!col || !col.accessorKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[col.accessorKey!];
      const bVal = b[col.accessorKey!];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection, columns]);

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Selection handlers
  const allPageIds = paginatedData.map(keyExtractor);
  const isAllPageSelected =
    allPageIds.length > 0 && allPageIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (isAllPageSelected) {
      onSelectionChange(selectedIds.filter((id) => !allPageIds.includes(id)));
    } else {
      const next = new Set([...selectedIds, ...allPageIds]);
      onSelectionChange(Array.from(next));
    }
  };

  const toggleSelectRow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((item) => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSort = (colId: string) => {
    if (sortColumn === colId) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(colId);
      setSortDirection('asc');
    }
  };

  const activeCols = columns.filter((c) => visibleColumns[c.id]);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full min-h-[40px] pl-9 pr-4 py-1.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {/* Column Visibility */}
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              onClick={() => setShowColumnPicker(!showColumnPicker)}
            >
              Colunas
            </Button>
            {showColumnPicker && (
              <div className="absolute right-0 mt-1.5 z-30 w-48 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl space-y-1">
                <p className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Exibir Colunas
                </p>
                {columns.map((col) => (
                  <label
                    key={col.id}
                    className="flex items-center gap-2 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[col.id]}
                      onChange={(e) =>
                        setVisibleColumns({ ...visibleColumns, [col.id]: e.target.checked })
                      }
                      className="rounded text-blue-600"
                    />
                    <span className="truncate">{typeof col.header === 'string' ? col.header : col.id}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Action Bar if items are selected */}
      {enableSelection && selectedIds.length > 0 && bulkActions && (
        <div className="flex items-center justify-between p-3 bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold">
              {selectedIds.length}
            </span>
            <span>{selectedIds.length === 1 ? 'item selecionado' : 'itens selecionados'}</span>
          </div>
          <div className="flex items-center gap-2">{bulkActions(selectedIds)}</div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-6 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">{error}</p>
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Tentar Novamente
            </Button>
          )}
        </div>
      )}

      {/* Loading state skeleton */}
      {isLoading && !error && (
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden p-4 space-y-3 animate-pulse">
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg w-full" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg w-full" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && paginatedData.length === 0 && (
        <div className="p-10 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-2">
            <Inbox className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{emptyTitle}</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{emptyDescription}</p>
          {searchQuery && (
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
              Limpar busca
            </Button>
          )}
        </div>
      )}

      {/* Data Content (Desktop Table + Mobile Cards) */}
      {!isLoading && !error && paginatedData.length > 0 && (
        <>
          {/* Desktop Table View (md and above) */}
          <div className="hidden md:block w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold select-none">
                    {enableSelection && (
                      <th className="p-3.5 w-10 text-center">
                        <button
                          type="button"
                          onClick={toggleSelectAll}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                        >
                          {isAllPageSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                    )}
                    {activeCols.map((col) => (
                      <th
                        key={col.id}
                        onClick={() => col.sortable && handleSort(col.id)}
                        className={`p-3.5 ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                        } ${
                          col.sortable
                            ? 'cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors'
                            : ''
                        }`}
                        style={{ width: col.width }}
                      >
                        <div
                          className={`inline-flex items-center gap-1.5 ${
                            col.align === 'center'
                              ? 'justify-center'
                              : col.align === 'right'
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          <span>{col.header}</span>
                          {col.sortable && (
                            <span className="text-slate-400">
                              {sortColumn === col.id ? (
                                sortDirection === 'asc' ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                                )
                              ) : (
                                <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paginatedData.map((item) => {
                    const id = keyExtractor(item);
                    const isSelected = selectedIds.includes(id);

                    return (
                      <tr
                        key={id}
                        onClick={() => onRowClick && onRowClick(item)}
                        className={`
                          transition-colors duration-100
                          ${
                            isSelected
                              ? 'bg-blue-50/40 dark:bg-blue-950/20'
                              : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                          }
                          ${onRowClick ? 'cursor-pointer' : ''}
                        `}
                      >
                        {enableSelection && (
                          <td
                            className="p-3.5 w-10 text-center"
                            onClick={(e) => toggleSelectRow(id, e)}
                          >
                            <button
                              type="button"
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        )}
                        {activeCols.map((col) => {
                          const content = col.cell
                            ? col.cell(item)
                            : col.accessorKey
                            ? String(item[col.accessorKey] ?? '')
                            : null;

                          return (
                            <td
                              key={col.id}
                              className={`p-3.5 text-slate-800 dark:text-slate-200 ${
                                col.align === 'center'
                                  ? 'text-center'
                                  : col.align === 'right'
                                  ? 'text-right'
                                  : 'text-left'
                              }`}
                            >
                              {content}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View (sm and below) */}
          <div className="md:hidden flex flex-col gap-2.5">
            {paginatedData.map((item) => {
              const id = keyExtractor(item);
              const isSelected = selectedIds.includes(id);

              if (mobileCardRender) {
                return (
                  <div key={id} onClick={() => onRowClick && onRowClick(item)}>
                    {mobileCardRender(item, isSelected, () => toggleSelectRow(id))}
                  </div>
                );
              }

              // Default responsive card fallback
              const primaryCol = columns.find((c) => c.mobilePrimary) || columns[0];
              const secondaryCol = columns.find((c) => c.mobileSecondary) || columns[1];
              const badgeCol = columns.find((c) => c.mobileBadge);
              const otherCols = columns.filter(
                (c) =>
                  c.id !== primaryCol?.id &&
                  c.id !== secondaryCol?.id &&
                  c.id !== badgeCol?.id &&
                  !c.mobileHidden
              );

              return (
                <div
                  key={id}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`
                    p-4 rounded-2xl border transition-all duration-150 bg-white dark:bg-slate-900
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20'
                        : 'border-slate-200/80 dark:border-slate-800'
                    }
                    ${onRowClick ? 'cursor-pointer active:scale-[0.99]' : ''}
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {enableSelection && (
                        <button
                          type="button"
                          onClick={(e) => toggleSelectRow(id, e)}
                          className="mt-0.5 text-slate-400 shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {primaryCol.cell
                            ? primaryCol.cell(item)
                            : primaryCol.accessorKey
                            ? String(item[primaryCol.accessorKey] ?? '')
                            : ''}
                        </h4>
                        {secondaryCol && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {secondaryCol.cell
                              ? secondaryCol.cell(item)
                              : secondaryCol.accessorKey
                              ? String(item[secondaryCol.accessorKey] ?? '')
                              : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {badgeCol && (
                      <div className="shrink-0">
                        {badgeCol.cell
                          ? badgeCol.cell(item)
                          : badgeCol.accessorKey
                          ? String(item[badgeCol.accessorKey] ?? '')
                          : ''}
                      </div>
                    )}
                  </div>

                  {otherCols.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                      {otherCols.slice(0, 4).map((col) => (
                        <div key={col.id} className="min-w-0">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block truncate">
                            {typeof col.header === 'string' ? col.header : col.id}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium truncate block">
                            {col.cell
                              ? col.cell(item)
                              : col.accessorKey
                              ? String(item[col.accessorKey] ?? '-')
                              : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-2 py-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-slate-500">
              Mostrando <span className="font-semibold text-slate-800 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</span> a{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {Math.min(currentPage * pageSize, sortedData.length)}
              </span>{' '}
              de <span className="font-semibold text-slate-800 dark:text-slate-200">{sortedData.length}</span>
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Página anterior"
                className="p-1.5 min-h-[32px] min-w-[32px]"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-2 font-semibold text-slate-700 dark:text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Próxima página"
                className="p-1.5 min-h-[32px] min-w-[32px]"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
