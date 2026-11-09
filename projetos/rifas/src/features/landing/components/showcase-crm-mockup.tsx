import { useState } from "react";
import { ArrowLeftRight, Check, History, Phone, Plus, Search, Sparkles, User, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ShowcaseCrmMockup() {
  const [searchPhone, setSearchPhone] = useState("1198842");

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
            CRM de Compradores & Vendas Manuais Inteligentes
          </span>
        </div>
        <span className="text-xs text-primary font-medium flex items-center gap-1">
          <Sparkles className="size-3.5" />
          Reconhecimento Automático
        </span>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Search simulation */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Search className="size-3.5 text-primary" />
            Localização instantânea por Telefone ou Nome
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Digite o telefone ou DDD..."
              className="pl-9 h-10 font-mono text-sm"
            />
            <span className="absolute right-3 top-2.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Cliente Encontrado!
            </span>
          </div>
        </div>

        {/* Customer Card Found Simulation */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                MS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-foreground">Marcos Silva</h4>
                  <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                    Comprador VIP (Recorrente)
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">(11) 98842-1100 • São Paulo/SP</p>
              </div>
            </div>

            <Button size="sm" className="h-8 gap-1 text-xs">
              <Plus className="size-3.5" />
              Lançar Venda Manual
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-primary/20 pt-3 text-center">
            <div className="bg-background/80 rounded-lg p-2 border border-border">
              <span className="text-[10px] text-muted-foreground block">Total Comprado</span>
              <span className="text-xs font-bold text-foreground">18 cotas</span>
            </div>
            <div className="bg-background/80 rounded-lg p-2 border border-border">
              <span className="text-[10px] text-muted-foreground block">Valor Acumulado</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">R$ 450,00</span>
            </div>
            <div className="bg-background/80 rounded-lg p-2 border border-border">
              <span className="text-[10px] text-muted-foreground block">Última Participação</span>
              <span className="text-xs font-bold text-foreground">Hoje, 14:32</span>
            </div>
          </div>
        </div>

        {/* Action highlight: Swap Number */}
        <div className="rounded-xl border border-border bg-muted/20 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <ArrowLeftRight className="size-4" />
            </div>
            <div className="text-xs">
              <p className="font-semibold text-foreground">Troca Atômica de Cotas (Anti-Conflito)</p>
              <p className="text-muted-foreground text-[11px]">
                O comprador pediu para trocar a cota #042 pela #099? Troque em 1 clique mantendo o histórico de auditoria.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-500/40 text-amber-600 text-[10px] shrink-0 self-start sm:self-auto">
            Recurso Exclusivo
          </Badge>
        </div>
      </div>
    </div>
  );
}
