import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationControlProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  pageSizeOptions?: number[];
}

export function PaginationControl({
  page,
  pageSize,
  total,
  totalPages: propTotalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationControlProps) {
  const totalPages = propTotalPages !== undefined ? propTotalPages : Math.max(1, Math.ceil(total / pageSize));
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/60 bg-card/40 text-xs">
      <div className="flex items-center gap-4 text-muted-foreground">
        <span>
          Mostrando <strong className="text-foreground">{startItem}</strong> -{' '}
          <strong className="text-foreground">{endItem}</strong> de{' '}
          <strong className="text-foreground">{total}</strong> registros
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span>Por página:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-background border border-border/80 rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <span className="text-muted-foreground mr-2">
          Página <strong className="text-foreground">{page}</strong> de{' '}
          <strong className="text-foreground">{Math.max(1, totalPages)}</strong>
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="h-7 w-7 p-0"
          title="Primeira página"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-7 w-7 p-0"
          title="Página anterior"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-7 w-7 p-0"
          title="Próxima página"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="h-7 w-7 p-0"
          title="Última página"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
