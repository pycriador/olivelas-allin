import { cn } from "@/lib/utils";
import {
  NUMBER_FILTER_LABELS,
  NUMBER_FILTER_VALUES,
  type NumberFilterValue,
} from "../../hooks/use-number-grid";

export interface NumberFilterProps {
  value: NumberFilterValue;
  onChange: (value: NumberFilterValue) => void;
}

export function NumberFilter({ value, onChange }: NumberFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar números">
      {NUMBER_FILTER_VALUES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            value === option
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-muted",
          )}
        >
          {NUMBER_FILTER_LABELS[option]}
        </button>
      ))}
    </div>
  );
}
