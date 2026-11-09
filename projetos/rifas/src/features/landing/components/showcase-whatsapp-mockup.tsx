import { Check, MessageSquare, Send, ShieldCheck, Smartphone, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ShowcaseWhatsappMockup() {
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
            Fluxo de Checkout Nativo via WhatsApp
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
          Sem Gateway Obrigatório
        </Badge>
      </div>

      <div className="p-4 sm:p-6 grid gap-5 md:grid-cols-2">
        {/* Left Side: Public Buyer Dialog Simulation */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">1. O Participante escolhe as cotas</span>
              <Badge variant="secondary" className="text-[10px]">
                Link /r/iphone-15
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-background rounded-lg p-2.5 border border-border">
                <span className="text-[11px] text-muted-foreground block">Nome do Participante</span>
                <span className="font-semibold text-foreground">Carolina Mendes</span>
              </div>
              <div className="bg-background rounded-lg p-2.5 border border-border">
                <span className="text-[11px] text-muted-foreground block">WhatsApp com DDD</span>
                <span className="font-semibold text-foreground">(21) 97755-4321</span>
              </div>
              <div className="bg-background rounded-lg p-2.5 border border-border flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Cotas Selecionadas</span>
                  <span className="font-mono font-bold text-primary">#014, #088 (2 números)</span>
                </div>
                <span className="font-bold text-sm">R$ 50,00</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="size-3.5" />
              Token de reserva expira em 10 minutos
            </div>
            <Button size="sm" className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-semibold">
              <MessageSquare className="size-4" />
              Enviar Reserva no WhatsApp
            </Button>
          </div>
        </div>

        {/* Right Side: Generated WhatsApp Chat Simulation */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 dark:bg-emerald-950/40 p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                  RH
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">RaffleHub Organizador</p>
                  <p className="text-[10px] text-muted-foreground">Online agora</p>
                </div>
              </div>
              <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30 text-[9px]">
                wa.me Direct
              </Badge>
            </div>

            {/* Chat Bubble */}
            <div className="bg-card/90 rounded-2xl rounded-tl-none p-3.5 border border-border/80 shadow-sm space-y-2 text-xs">
              <p className="font-medium text-foreground">
                Olá, meu nome é <strong>Carolina Mendes</strong>! 👋
              </p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Gostaria de reservar os números da campanha <strong>iPhone 15 Pro Max</strong>:
              </p>
              <div className="bg-muted/60 p-2 rounded-lg font-mono text-[11px] text-primary font-bold">
                Cotas: 014, 088
              </div>
              <p className="text-muted-foreground text-[11px]">
                Valor Total: <strong className="text-foreground">R$ 50,00</strong>. Como posso efetuar o pagamento?
              </p>
              <div className="flex justify-end text-[9px] text-muted-foreground pt-1">
                14:40 ✓✓
              </div>
            </div>
          </div>

          <div className="bg-background/80 rounded-lg p-2 border border-border text-[11px] text-muted-foreground flex items-center gap-2">
            <Check className="size-3.5 text-emerald-500 shrink-0" />
            <span>O pedido é criado automaticamente no status <strong>WAITING_CONTACT</strong>.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
