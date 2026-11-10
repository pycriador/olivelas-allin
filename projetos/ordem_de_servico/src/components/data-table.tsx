import { useState, useMemo, type ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/core/i18n/I18nProvider";

export interface Column<T> {
  key: string;
  header?: string;
  label?: string;
  className?: string;
  render: (item: T) => ReactNode;
  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;
  hideable?: boolean;
  defaultVisible?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  toolbar?: ReactNode;
  initialSortColumn?: string;
  initialSortDirection?: "asc" | "desc";
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchable = true,
  searchKeys,
  searchPlaceholder,
  pageSize: defaultPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  emptyMessage,
  toolbar,
  initialSortColumn,
  initialSortDirection = "asc",
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortColumn, setSortColumn] = useState<string | null>(initialSortColumn ?? null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialSortDirection);

  const isSortable = (col: Column<T>) => {
    if (col.sortable === false) return false;
    if (col.key === "actions" || col.key === "action") return false;
    return true;
  };

  const filtered = useMemo(() => {
    if (!search || !searchable) return data;
    const q = search.toLowerCase().trim();
    return data.filter((item) => {
      const keys = (searchKeys ?? Object.keys(item as object)) as (keyof T)[];
      return keys.some((key) => {
        const val = item[key];
        if (val == null) return false;
        if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
          return String(val).toLowerCase().includes(q);
        }
        if (Array.isArray(val)) {
          return val.some((v) => typeof v === "string" && v.toLowerCase().includes(q));
        }
        if (typeof val === "object") {
          return Object.values(val).some(
            (v) => (typeof v === "string" || typeof v === "number") && String(v).toLowerCase().includes(q)
          );
        }
        return false;
      });
    });
  }, [data, search, searchable, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortColumn) return filtered;
    const col = columns.find((c) => c.key === sortColumn);
    if (!col || !isSortable(col)) return filtered;

    return [...filtered].sort((a, b) => {
      if (col.sortFn) {
        const r = col.sortFn(a, b);
        return sortDir === "asc" ? r : -r;
      }

      // Universal smart comparator
      const getVal = (obj: any, path: string) => {
        if (!obj) return null;
        if (path.includes(".")) {
          return path.split(".").reduce((acc, part) => acc?.[part], obj);
        }
        return obj[path];
      };

      const valA = getVal(a, col.key);
      const valB = getVal(b, col.key);

      if (valA == null && valB == null) return 0;
      if (valA == null) return sortDir === "asc" ? 1 : -1;
      if (valB == null) return sortDir === "asc" ? -1 : 1;

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDir === "asc" ? valA - valB : valB - valA;
      }

      if (valA instanceof Date && valB instanceof Date) {
        return sortDir === "asc" ? valA.getTime() - valB.getTime() : valB.getTime() - valA.getTime();
      }

      const strA = String(valA).trim();
      const strB = String(valB).trim();

      // Check if dates as ISO strings
      const dateA = Date.parse(strA);
      const dateB = Date.parse(strB);
      if (!isNaN(dateA) && !isNaN(dateB) && strA.length >= 10 && strB.length >= 10) {
        return sortDir === "asc" ? dateA - dateB : dateB - dateA;
      }

      return sortDir === "asc"
        ? strA.localeCompare(strB, "pt-BR", { numeric: true, sensitivity: "base" })
        : strB.localeCompare(strA, "pt-BR", { numeric: true, sensitivity: "base" });
    });
  }, [filtered, sortColumn, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 inline text-muted-foreground/60 transition-opacity group-hover:opacity-100" />;
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1.5 h-3.5 w-3.5 inline text-primary" />
    ) : (
      <ChevronDown className="ml-1.5 h-3.5 w-3.5 inline text-primary" />
    );
  };

  return (
    <div className="space-y-4 min-w-0 max-w-full">
      {(searchable || toolbar) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder ?? t("common.search")}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-8"
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      <div className="rounded-xl border border-border/70 overflow-hidden bg-card shadow-xs min-w-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => {
                const canSort = isSortable(col);
                return (
                  <TableHead
                    key={col.key}
                    className={canSort ? "cursor-pointer select-none group hover:bg-muted/60 transition-colors" : ""}
                    onClick={() => canSort && handleSort(col.key)}
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>{col.header ?? col.label}</span>
                      {canSort && <SortIcon column={col.key} />}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
                  {emptyMessage ?? t("common.noResults")}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((item) => (
                <TableRow key={keyExtractor(item)}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>{col.render(item)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {sorted.length > pageSize && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {sorted.length} {t("common.records")}
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}
            >
              <SelectTrigger className="w-16 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              {t("common.previous")}
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {t("common.page")} {safePage + 1} {t("common.of")} {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(safePage + 1)}
            >
              {t("common.next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
