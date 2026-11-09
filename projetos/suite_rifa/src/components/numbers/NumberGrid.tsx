import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { NumberStatus } from "@/services/types";
import { NUMBER_STATUS_LABEL, NUMBER_STATUS_TONE } from "@/services/types";

interface NumberGridProps {
  totalNumbers: number;
  /** Map of number → status from DB. Numbers not in the map are implicitly AVAILABLE. */
  numberStatuses?: Record<number, NumberStatus>;
  /** Numbers selected by the user (for reservation/purchase) */
  selected?: Set<number>;
  onToggle?: (number: number) => void;
  /** When true, selection is disabled (read-only mode) */
  readOnly?: boolean;
  className?: string;
}

export function NumberGrid({
  totalNumbers,
  numberStatuses = {},
  selected = new Set(),
  onToggle,
  readOnly = false,
  className,
}: NumberGridProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const numbers = useMemo(() => {
    return Array.from({ length: totalNumbers }, (_, i) => i + 1);
  }, [totalNumbers]);

  const getNumberStatus = (n: number): NumberStatus => {
    return numberStatuses[n] ?? "AVAILABLE";
  };

  const isUnavailable = (n: number): boolean => {
    const s = getNumberStatus(n);
    return s === "SOLD" || s === "RESERVED" || s === "BLOCKED";
  };

  const handleClick = (n: number) => {
    if (readOnly || isUnavailable(n) || !onToggle) return;
    onToggle(n);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-1">
        {numbers.map((n) => {
          const status = getNumberStatus(n);
          const isSelected = selected.has(n);
          const unavailable = isUnavailable(n);

          return (
            <button
              key={n}
              type="button"
              disabled={readOnly || unavailable}
              onClick={() => handleClick(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md border text-xs font-medium transition-all",
                readOnly || unavailable
                  ? "cursor-default opacity-60"
                  : "cursor-pointer hover:scale-105",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/30"
                  : status === "SOLD"
                    ? "border-sky-200 bg-sky-500/10 text-sky-700 dark:border-sky-800 dark:text-sky-400"
                    : status === "RESERVED"
                      ? "border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-800 dark:text-amber-400"
                      : status === "BLOCKED"
                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : "border-border bg-background hover:border-primary/50 hover:bg-primary/5",
              )}
              title={
                readOnly
                  ? `${n} — ${NUMBER_STATUS_LABEL[status]}`
                  : unavailable
                    ? `${n} — ${NUMBER_STATUS_LABEL[status]}`
                    : `Número ${n}`
              }
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* Tooltip */}
      {hovered && (
        <p className="text-xs text-muted-foreground">
          Nº {hovered} — {NUMBER_STATUS_LABEL[getNumberStatus(hovered)]}
        </p>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-emerald-500" /> Disponível
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-sky-500" /> Vendido
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-amber-500" /> Reservado
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-destructive" /> Bloqueado
        </span>
      </div>
    </div>
  );
}

/** Lightweight legend-only component for cards/dashboards */
export function NumberStatusLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {(["AVAILABLE", "SOLD", "RESERVED", "BLOCKED"] as NumberStatus[]).map((s) => (
        <span key={s} className="flex items-center gap-1">
          <span
            className={cn(
              "inline-block size-2 rounded-full",
              s === "AVAILABLE" && "bg-emerald-500",
              s === "SOLD" && "bg-sky-500",
              s === "RESERVED" && "bg-amber-500",
              s === "BLOCKED" && "bg-destructive",
            )}
          />{" "}
          {NUMBER_STATUS_LABEL[s]}
        </span>
      ))}
    </div>
  );
}
