import { Wifi, WifiOff, RefreshCw, HardDrive, CheckCircle2, ArrowDown } from 'lucide-react';

export function OfflineSection() {
  return (
    <section className="py-20 border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text Content */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <HardDrive className="h-3.5 w-3.5" />
              Arquitetura Local-First
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
              Seu restaurante não pode parar porque a internet caiu.
            </h2>

            <p className="text-base text-muted-foreground leading-relaxed">
              O Olivelas Restaurant foi projetado para continuar funcionando mesmo quando a conexão estiver indisponível.
            </p>

            <p className="text-sm text-muted-foreground/90 leading-relaxed">
              Em momentos de instabilidade no sinal da operadora, seu atendimento não é interrompido: o garçom continua emitindo comandas no salão e a cozinha segue preparando pedidos sem perda de dados operacionais.
            </p>

            <div className="pt-2 text-xs text-muted-foreground/75 border-l-2 border-border pl-3 italic">
              Operação local resiliente com reconciliação segura assim que o enlace de rede for restabelecido.
            </div>
          </div>

          {/* Flow Diagram */}
          <div className="lg:col-span-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Ciclo de Sincronização e Resiliência
              </h3>

              {/* State 1: Online */}
              <div className="flex items-center gap-4 rounded-lg border border-border/80 bg-background/60 p-4">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Wifi className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-foreground">Online</span>
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pedido sincronizado em tempo real com o servidor e terminais.
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center text-muted-foreground/40">
                <ArrowDown className="h-4 w-4" />
              </div>

              {/* State 2: Offline */}
              <div className="flex items-center gap-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <WifiOff className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-foreground">Offline</span>
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pedido armazenado com segurança no dispositivo local.
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center text-muted-foreground/40">
                <ArrowDown className="h-4 w-4" />
              </div>

              {/* State 3: Restored */}
              <div className="flex items-center gap-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-foreground">Conexão restaurada</span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sincronização automática e resolução de pendências sem duplicidade.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
