import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface NumberSearchProps {
  onGoToNumber: (number: number) => void;
}

export function NumberSearch({ onGoToNumber }: NumberSearchProps) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed) && Number.isInteger(parsed)) {
      onGoToNumber(parsed);
      setValue("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Ir para número…"
          aria-label="Ir para número"
          className="h-9 w-36 pl-8 sm:w-44"
          min={0}
        />
      </div>
      <Button type="submit" variant="outline" size="sm">
        Ir
      </Button>
    </form>
  );
}
