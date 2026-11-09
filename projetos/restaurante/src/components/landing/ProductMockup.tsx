import { Clock, ChefHat, CheckCircle2, Wifi, UtensilsCrossed } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-4xl select-none">
      {/* Subtle background glow effect (subdued, not neon) */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-primary/15 to-transparent blur-xl pointer-events-none -z-10" />

      {/* Main SaaS Window Frame */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg transition-all">
        {/* Terminal Header Bar */}
        <div className="flex h-11 items-center justify-between border-b border-border bg-muted/40 px-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-border" />
            <div className="h-3 w-3 rounded-full bg-border" />
            <div className="h-3 w-3 rounded-full bg-border" />
            <span className="ml-2 text-xs font-mono text-muted-foreground hidden sm:inline-block">
              app.olivelas.com/operacao
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Terminal Ativo
            </span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
              Sincronizado
            </span>
          </div>
        </div>

        {/* System Main Interface */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Quick Table Selector / Sidebar on Desktop */}
          <div className="hidden md:block md:col-span-4 p-4 space-y-3 bg-muted/15">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Salão Principal
              </span>
              <span className="text-xs font-mono text-muted-foreground">3 ativas</span>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 dark:bg-primary/10 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-foreground">Mesa 05</span>
                  <Badge variant="warning" className="text-[10px] font-medium py-0 px-2">
                    Em preparo
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Pedido #1042</span>
                  <span className="font-medium text-foreground">R$ 86,80</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card/50 hover:bg-muted/40 transition-colors opacity-75">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-foreground">Mesa 02</span>
                  <Badge variant="outline" className="text-[10px] py-0 px-2 text-muted-foreground">
                    Atendida
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Pedido #1041</span>
                  <span>R$ 142,50</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card/50 hover:bg-muted/40 transition-colors opacity-60">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-foreground">Mesa 08</span>
                  <Badge variant="outline" className="text-[10px] py-0 px-2 text-muted-foreground">
                    Nova mesa
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Aguardando pedido</span>
                  <span>—</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Order Details Panel */}
          <div className="p-5 md:p-6 md:col-span-8 flex flex-col justify-between">
            <div>
              {/* Order Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-xl font-bold tracking-tight text-foreground">
                      Mesa 05
                    </h4>
                    <span className="text-sm font-mono text-muted-foreground">
                      Pedido #1042
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      14 min atrás
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <UtensilsCrossed className="h-3.5 w-3.5" />
                      Salão interno
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    <ChefHat className="h-3.5 w-3.5" />
                    Em preparo
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="py-4 space-y-3.5">
                <div className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-start gap-3">
                    <span className="font-mono font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded text-xs">
                      2x
                    </span>
                    <div>
                      <p className="font-medium text-foreground">Hambúrguer Artesanal</p>
                      <p className="text-xs text-muted-foreground">Ponto da carne: ao ponto • Queijo cheddar</p>
                    </div>
                  </div>
                  <span className="font-mono text-foreground font-medium">R$ 72,00</span>
                </div>

                <div className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-start gap-3">
                    <span className="font-mono font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded text-xs">
                      1x
                    </span>
                    <div>
                      <p className="font-medium text-foreground">Coca-Cola Zero 350ml</p>
                      <p className="text-xs text-muted-foreground">Gelo e limão</p>
                    </div>
                  </div>
                  <span className="font-mono text-foreground font-medium">R$ 8,00</span>
                </div>

                <div className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-start gap-3">
                    <span className="font-mono font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded text-xs">
                      1x
                    </span>
                    <div>
                      <p className="font-medium text-foreground">Água Mineral sem Gás</p>
                      <p className="text-xs text-muted-foreground">Temperatura ambiente</p>
                    </div>
                  </div>
                  <span className="font-mono text-foreground font-medium">R$ 6,80</span>
                </div>
              </div>
            </div>

            {/* Total and Operational Status Bar */}
            <div className="pt-4 border-t border-border mt-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total do pedido</span>
                <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                  R$ 86,80
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Encaminhado para cozinha
                </span>
                <span className="font-mono text-[11px]">Cozinha KDS #01</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
