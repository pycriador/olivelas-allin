import { useMemo, useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { parseNumbersExpression } from "@/lib/number-input";
import { cn } from "@/lib/utils";

export interface QuickNumberInputProps {
  maxNumber: number;
  onChange?: (numbers: number[]) => void;
  className?: string;
  id?: string;
  placeholder?: string;
}

export function QuickNumberInput({
  maxNumber,
  onChange,
  className,
  id,
  placeholder = "Ex.: 1, 5, 8 ou 10-20",
}: QuickNumberInputProps) {
  const [text, setText] = useState("");

  const result = useMemo(() => parseNumbersExpression(text, maxNumber), [text, maxNumber]);

  return (
    <div className={cn("space-y-2", className)}>
      <Textarea
        id={id}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          onChange?.(parseNumbersExpression(event.target.value, maxNumber).numbers);
        }}
        placeholder={placeholder}
        rows={2}
        aria-describedby={id ? `${id}-help` : undefined}
      />
      <p id={id ? `${id}-help` : undefined} className="text-xs text-muted-foreground">
        Use vírgulas para números avulsos e hífen para intervalos (ex.: 1-10).
      </p>
      {result.invalid.length > 0 ? (
        <p className="text-xs font-medium text-destructive">
          Inválido: {result.invalid.join(", ")}
        </p>
      ) : null}
      <p className="text-xs tabular-nums text-muted-foreground">
        {result.numbers.length > 0 ? `${result.numbers.length} números` : "Nenhum número"}
        {result.duplicates.length > 0 ? ` · ${result.duplicates.length} repetidos ignorados` : ""}
      </p>
    </div>
  );
}
