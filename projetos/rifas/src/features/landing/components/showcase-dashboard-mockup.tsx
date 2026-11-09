import { CheckCircle2, Clock, DollarSign, FileText, Receipt, User, ArrowUpRight, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ShowcaseDashboardMockup() {
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
            Painel de Operações • Campanha iPhone 15 Pro Max
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
          ● Ao Vivo (Realtime)
        </Badge>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* KPI Mini Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              Receita Confirmada
              <TrendingUp className="size-3.5 text-emerald-500" />
            </p>
            <p className="text-lg font-bold mt-1 text-foreground">R$ 14.850,00</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              +18.4% nas últimas 24h
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              Cotas Vendidas
              <CheckCircle2 className="size-3.5 text-primary" />
            </p>
            <p className="text-lg font-bold mt-1 text-foreground">594 / 1.000</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">59.4% da meta</p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              Aguardando Contato
              <Clock className="size-3.5 text-amber-500" />
            </p>
            <p className="text-lg font-bold mt-1 text-amber-600 dark:text-amber-400">18 pedidos</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">WhatsApp pendente</p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
              Ticket Médio
              <DollarSign className="size-3.5 text-blue-500" />
            </p>
            <p className="text-lg font-bold mt-1 text-foreground">R$ 75,00</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">3 cotas/pedido</p>
          </div>
        </div>

        {/* Orders Table Simulation */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-muted/40 px-3 py-2 border-b border-border flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Últimos Pedidos & Auditoria</span>
            <span className="font-normal text-[11px]">Sincronização em tempo real</span>
          </div>

          <div className="divide-y divide-border text-xs">
            <div className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                  MS
                </div>
                <div>
                  <p className="font-semibold text-foreground">Marcos Silva</p>
                  <p className="text-[11px] text-muted-foreground">Cotas: #042, #043, #044 • (11) 98842-1100</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                  PAGO (Pix)
                </Badge>
                <span className="font-mono font-bold text-foreground">R$ 75,00</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-[10px]">
                  CL
                </div>
                <div>
                  <p className="font-semibold text-foreground">Camila Lima</p>
                  <p className="text-[11px] text-muted-foreground">Cotas: #105, #106 • Pedido via WhatsApp</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">
                  AGUARDANDO CONTATO
                </Badge>
                <span className="font-mono font-bold text-foreground">R$ 50,00</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-[10px]">
                  RF
                </div>
                <div>
                  <p className="font-semibold text-foreground">Rodrigo Freitas</p>
                  <p className="text-[11px] text-muted-foreground">Cotas: #880 • Venda manual no balcão</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                  DINHEIRO
                </Badge>
                <span className="font-mono font-bold text-foreground">R$ 25,00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit event alert */}
        <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
          <FileText className="size-3.5 text-primary shrink-0" />
          <span>
            <strong className="text-foreground">Auditoria Imutável:</strong> Todas as alterações de números, trocas e recebimentos de comprovantes são registrados com carimbo de data e hora.
          </span>
        </div>
      </div>
    </div>
  );
}
