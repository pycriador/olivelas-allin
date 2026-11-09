import { useState } from "react";
import { Check, Hash, RefreshCw, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ShowcaseGridMockup() {
  const [activeFilter, setActiveFilter] = useState<"ALL" | "AVAILABLE" | "RESERVED" | "PAID">("ALL");
  const [selectedNumber, setSelectedNumber] = useState<number | null>(42);

  // Generate 48 mock numbers
  const mockNumbers = [
    { num: 1, status: "PAID" },
    { num: 2, status: "AVAILABLE" },
    { num: 3, status: "AVAILABLE" },
    { num: 4, status: "RESERVED" },
    { num: 5, status: "PAID" },
    { num: 6, status: "AVAILABLE" },
    { num: 7, status: "AVAILABLE" },
    { num: 8, status: "PENDING" },
    { num: 9, status: "AVAILABLE" },
    { num: 10, status: "PAID" },
    { num: 11, status: "AVAILABLE" },
    { num: 12, status: "AVAILABLE" },
    { num: 13, status: "RESERVED" },
    { num: 14, status: "PAID" },
    { num: 15, status: "AVAILABLE" },
    { num: 16, status: "AVAILABLE" },
    { num: 17, status: "AVAILABLE" },
    { num: 18, status: "PAID" },
    { num: 19, status: "AVAILABLE" },
    { num: 20, status: "PENDING" },
    { num: 21, status: "AVAILABLE" },
    { num: 22, status: "PAID" },
    { num: 23, status: "AVAILABLE" },
    { num: 24, status: "AVAILABLE" },
    { num: 25, status: "AVAILABLE" },
    { num: 26, status: "RESERVED" },
    { num: 27, status: "PAID" },
    { num: 28, status: "AVAILABLE" },
    { num: 29, status: "AVAILABLE" },
    { num: 30, status: "PAID" },
    { num: 31, status: "AVAILABLE" },
    { num: 32, status: "AVAILABLE" },
    { num: 33, status: "PENDING" },
    { num: 34, status: "AVAILABLE" },
    { num: 35, status: "PAID" },
    { num: 36, status: "AVAILABLE" },
    { num: 37, status: "AVAILABLE" },
    { num: 38, status: "PAID" },
    { num: 39, status: "AVAILABLE" },
    { num: 40, status: "RESERVED" },
    { num: 41, status: "AVAILABLE" },
    { num: 42, status: "SELECTED" },
    { num: 43, status: "AVAILABLE" },
    { num: 44, status: "PAID" },
    { num: 45, status: "AVAILABLE" },
    { num: 46, status: "AVAILABLE" },
    { num: 47, status: "PENDING" },
    { num: 48, status: "PAID" },
  ];

  const filtered = mockNumbers.filter((n) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "AVAILABLE") return n.status === "AVAILABLE" || n.num === selectedNumber;
    if (activeFilter === "RESERVED") return n.status === "RESERVED" || n.status === "PENDING";
    if (activeFilter === "PAID") return n.status === "PAID";
    return true;
  });

  return (
    <div className="rounded-2xl border border-border bg-card/90 shadow-2xl backdrop-blur overflow-hidden transition-all duration-300">
      {/* Top Header Mockup */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-destructive/60" />
            <span className="size-3 rounded-full bg-amber-500/60" />
            <span className="size-3 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-xs font-medium text-muted-foreground ml-2">
            Grade Visual em Tempo Real • 001 a 1.000
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-emerald-500 font-medium">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Conectado ao vivo
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar número (ex: 42)..."
              value={selectedNumber ? String(selectedNumber) : ""}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setSelectedNumber(isNaN(val) ? null : val);
              }}
              className="h-9 pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <Button
              size="sm"
              variant={activeFilter === "ALL" ? "default" : "outline"}
              className="h-8 text-xs"
              onClick={() => setActiveFilter("ALL")}
            >
              Todos (1.000)
            </Button>
            <Button
              size="sm"
              variant={activeFilter === "AVAILABLE" ? "default" : "outline"}
              className="h-8 text-xs"
              onClick={() => setActiveFilter("AVAILABLE")}
            >
              Disponíveis (640)
            </Button>
            <Button
              size="sm"
              variant={activeFilter === "RESERVED" ? "default" : "outline"}
              className="h-8 text-xs"
              onClick={() => setActiveFilter("RESERVED")}
            >
              Reservados (120)
            </Button>
            <Button
              size="sm"
              variant={activeFilter === "PAID" ? "default" : "outline"}
              className="h-8 text-xs"
              onClick={() => setActiveFilter("PAID")}
            >
              Pagos (240)
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground border-y border-border/60 py-2.5">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-muted border border-border" />
            Livre (R$ 10,00)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-[8px]">
              ✓
            </span>
            Selecionado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-amber-500/20 border border-amber-500/40" />
            Reservado (WhatsApp)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-600" />
            Pago / Confirmado
          </span>
        </div>

        {/* Numbers Grid Grid simulation */}
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1.5 max-h-56 overflow-y-auto p-1">
          {filtered.map((item) => {
            const isSelected = item.num === selectedNumber;
            let bgClass = "bg-muted/60 text-foreground hover:bg-primary/20 hover:border-primary/50 cursor-pointer";
            if (isSelected) {
              bgClass = "bg-primary text-primary-foreground font-bold shadow-md ring-2 ring-primary/40";
            } else if (item.status === "PAID") {
              bgClass = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 cursor-not-allowed opacity-80";
            } else if (item.status === "RESERVED" || item.status === "PENDING") {
              bgClass = "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 cursor-not-allowed opacity-80";
            }

            return (
              <button
                key={item.num}
                type="button"
                onClick={() => {
                  if (item.status === "AVAILABLE" || isSelected) {
                    setSelectedNumber(isSelected ? null : item.num);
                  }
                }}
                className={`h-9 rounded-lg border text-xs font-mono flex items-center justify-center transition-all ${bgClass}`}
              >
                {String(item.num).padStart(3, "0")}
              </button>
            );
          })}
        </div>

        {/* Selection Bar simulation */}
        <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 p-3">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="font-mono">
              {selectedNumber ? `1 cota (#${String(selectedNumber).padStart(3, "0")})` : "0 cotas"}
            </Badge>
            <span className="text-xs text-muted-foreground">Total:</span>
            <span className="text-sm font-bold">{selectedNumber ? "R$ 10,00" : "R$ 0,00"}</span>
          </div>
          <Button size="sm" className="h-8 gap-1.5 text-xs" disabled={!selectedNumber}>
            <Sparkles className="size-3.5" />
            Reservar via WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
