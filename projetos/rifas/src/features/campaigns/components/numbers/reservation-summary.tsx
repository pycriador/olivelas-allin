import { formatGridNumber } from "@/services/campaign-number.service";

export interface ReservationSummaryProps {
  numbers: number[];
  maxNumber: number;
  maxVisible?: number;
}

export function ReservationSummary({
  numbers,
  maxNumber,
  maxVisible = 12,
}: ReservationSummaryProps) {
  if (numbers.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nenhum número selecionado ainda.
      </p>
    );
  }

  const visible = numbers.slice(0, maxVisible);
  const hidden = numbers.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Números selecionados">
      {visible.map((number) => (
        <span
          key={number}
          className="rounded-md border border-primary/30 bg-primary/5 px-2 py-0.5 text-xs font-medium tabular-nums text-foreground"
        >
          {formatGridNumber(number, maxNumber)}
        </span>
      ))}
      {hidden > 0 ? (
        <span className="px-1 text-xs text-muted-foreground">+{hidden} mais</span>
      ) : null}
    </div>
  );
}
