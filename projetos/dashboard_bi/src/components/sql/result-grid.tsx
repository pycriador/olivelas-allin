import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { exportCsv, exportJson, exportXlsx } from "@/lib/sql/export";
import { classifyValue, formatValue, prettyJson, rawText } from "@/lib/sql/value-format";
import type { QueryColumn, QueryRow } from "@/lib/sql/types";
import { toast } from "sonner";

type Props = {
  columns: QueryColumn[];
  rows: QueryRow[];
  locale?: string;
  filename?: string;
  /** Enables client-side sorting/search on the already-fetched page. */
  localTools?: boolean;
  canExport?: boolean;
  maxHeight?: string;
};

export function ResultGrid({
  columns,
  rows,
  locale = "pt-BR",
  filename = "resultado",
  localTools = true,
  canExport = true,
  maxHeight = "460px",
}: Props) {
  const [sort, setSort] = useState<{ column: string; dir: "asc" | "desc" } | null>(null);
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<{ column: string; value: unknown } | null>(null);

  const visible = useMemo(() => {
    let out = rows;
    if (localTools && search.trim()) {
      const needle = search.trim().toLowerCase();
      out = out.filter((row) =>
        columns.some((c) => rawText(row[c.name]).toLowerCase().includes(needle)),
      );
    }
    if (localTools && sort) {
      const { column, dir } = sort;
      out = [...out].sort((a, b) => {
        const av = a[column];
        const bv = b[column];
        if (av === null || av === undefined) return bv === null || bv === undefined ? 0 : 1;
        if (bv === null || bv === undefined) return -1;
        const an = Number(av);
        const bn = Number(bv);
        const cmp =
          Number.isFinite(an) && Number.isFinite(bn)
            ? an - bn
            : rawText(av).localeCompare(rawText(bv), locale);
        return dir === "asc" ? cmp : -cmp;
      });
    }
    return out;
  }, [rows, columns, search, sort, localTools, locale]);

  const toggleSort = (column: string) => {
    if (!localTools) return;
    setSort((prev) =>
      prev?.column !== column
        ? { column, dir: "asc" }
        : prev.dir === "asc"
          ? { column, dir: "desc" }
          : null,
    );
  };

  const copyAll = async () => {
    const header = columns.map((c) => c.name).join("\t");
    const body = visible.map((r) => columns.map((c) => rawText(r[c.name])).join("\t")).join("\n");
    await navigator.clipboard.writeText(`${header}\n${body}`);
    toast.success("Resultado copiado para a área de transferência.");
  };

  if (columns.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhuma coluna retornada.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {localTools && (
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nos resultados…"
            className="h-8 w-56"
            aria-label="Buscar nos resultados"
          />
        )}
        <Badge variant="secondary">
          {visible.length} / {rows.length} linhas
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyAll}>
            <Copy className="mr-2 size-3.5" /> Copiar
          </Button>
          {canExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 size-3.5" /> Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportCsv(columns, visible, filename)}>
                  <FileSpreadsheet className="mr-2 size-4" /> CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void exportXlsx(columns, visible, filename)}>
                  <FileSpreadsheet className="mr-2 size-4" /> XLSX
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportJson(columns, visible, filename)}>
                  <FileJson className="mr-2 size-4" /> JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <ScrollArea className="rounded-md border" style={{ maxHeight }}>
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
            <tr>
              <th className="w-12 border-b px-3 py-2 text-right font-mono text-xs text-muted-foreground">
                #
              </th>
              {columns.map((column) => (
                <th key={column.name} className="border-b px-3 py-2 text-left">
                  <button
                    type="button"
                    onClick={() => toggleSort(column.name)}
                    className={cn(
                      "flex max-w-[280px] items-center gap-1.5 truncate font-medium",
                      localTools && "hover:text-primary",
                    )}
                    title={column.dataType ?? column.name}
                  >
                    <span className="truncate">{column.name}</span>
                    {sort?.column === column.name &&
                      (sort.dir === "asc" ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      ))}
                  </button>
                  {column.dataType && (
                    <span className="block truncate font-mono text-[10px] font-normal uppercase text-muted-foreground">
                      {column.dataType}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-3 py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhuma linha retornada.
                </td>
              </tr>
            )}
            {visible.map((row, index) => (
              <tr key={index} className="even:bg-muted/30 hover:bg-accent/50">
                <td className="border-b px-3 py-1.5 text-right font-mono text-xs text-muted-foreground">
                  {index + 1}
                </td>
                {columns.map((column) => {
                  const value = row[column.name];
                  const kind = classifyValue(value, column.name);
                  const expandable = kind === "json" || kind === "array" || kind === "longtext";
                  return (
                    <td
                      key={column.name}
                      className={cn(
                        "max-w-[320px] truncate border-b px-3 py-1.5",
                        kind === "null" && "italic text-muted-foreground",
                        (kind === "number" || kind === "currency") && "text-right font-mono",
                        kind === "json" && "font-mono text-xs",
                      )}
                      title={rawText(value)}
                      onDoubleClick={() =>
                        expandable ? setDetail({ column: column.name, value }) : undefined
                      }
                    >
                      {formatValue(value, kind, locale)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">{detail?.column}</DialogTitle>
          </DialogHeader>
          <pre className="max-h-[60vh] overflow-auto rounded-md bg-muted p-4 text-xs">
            {detail ? prettyJson(detail.value) : ""}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}