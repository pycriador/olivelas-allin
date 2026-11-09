import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
  "aria-label"?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Pesquisar…",
  className,
  debounceMs = 300,
  "aria-label": ariaLabel = "Pesquisar",
}: SearchInputProps) {
  const [internal, setInternal] = useState(value);

  useEffect(() => setInternal(value), [value]);

  useEffect(() => {
    if (internal === value) return;
    const timeout = setTimeout(() => onChange(internal), debounceMs);
    return () => clearTimeout(timeout);
  }, [internal, value, onChange, debounceMs]);

  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        value={internal}
        onChange={(event) => setInternal(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="pl-9 pr-9"
      />
      {internal ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Limpar pesquisa"
          className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
          onClick={() => {
            setInternal("");
            onChange("");
          }}
        >
          <X aria-hidden="true" className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
