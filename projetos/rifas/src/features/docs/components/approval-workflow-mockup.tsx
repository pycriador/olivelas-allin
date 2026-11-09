import { CheckCircle2, AlertCircle, Clock, ShieldCheck, ArrowRight, User, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ApprovalWorkflowMockup() {
  return (
    <div className="rounded-2xl border border-border bg-card/90 shadow-xl overflow-hidden backdrop-blur">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-destructive/60" />
            <span className="size-3 rounded-full bg-amber-500/60" />
            <span className="size-3 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-xs font-semibold text-foreground ml-2">
            Fluxo de Aprovação de Artes & Ciclo de Vida da Campanha
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
          Auditoria Ativa
        </Badge>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Status Lifecycle Flow Visualizer */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-foreground">Máquina de Estados da Rifa:</span>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
              <Badge variant="secondary" className="text-[9px] font-bold">1. RASCUNHO</Badge>
              <p className="text-[11px] font-semibold text-foreground">DRAFT</p>
              <p className="text-[10px] text-muted-foreground">Upload de artes e regras</p>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1">
              <Badge className="bg-amber-500 text-white text-[9px] font-bold">2. REVISÃO</Badge>
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">PENDING_REVIEW</p>
              <p className="text-[10px] text-muted-foreground">Validação das artes & cotas</p>
            </div>

            <div className="rounded-xl border-2 border-emerald-500 bg-emerald-500/10 p-3 space-y-1 shadow-sm">
              <Badge className="bg-emerald-600 text-white text-[9px] font-bold">3. ATIVA (NO AR)</Badge>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">ACTIVE</p>
              <p className="text-[10px] text-muted-foreground">Vendas abertas no link</p>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
              <Badge variant="outline" className="text-[9px] font-bold">4. PAUSADA</Badge>
              <p className="text-[11px] font-semibold text-foreground">PAUSED</p>
              <p className="text-[10px] text-muted-foreground">Interrupção temporária</p>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
              <Badge variant="secondary" className="text-[9px] font-bold">5. FINALIZADA</Badge>
              <p className="text-[11px] font-semibold text-foreground">COMPLETED</p>
              <p className="text-[10px] text-muted-foreground">Sorteio realizado</p>
            </div>
          </div>
        </div>

        {/* Validation Checklist */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <h5 className="font-bold text-xs text-foreground">Checklist de Aprovação Pré-Publicação</h5>
            </div>

            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Arte de Capa em alta resolução configurada</span>
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Intervalo e Preço por Cota válidos (ex: 1-1000 / R$ 25)</span>
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>WhatsApp de Atendimento e Template cadastrados</span>
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span>Termos, regulamento e data prevista do sorteio</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <History className="size-4 text-primary" />
              <h5 className="font-bold text-xs text-foreground">Registro de Auditoria Imutável</h5>
            </div>

            <div className="space-y-2 text-xs divide-y divide-border">
              <div className="pt-1.5 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">Transição: DRAFT ➔ ACTIVE</p>
                  <p className="text-[10px] text-muted-foreground">Aprovado por: admin@rafflehub.com.br</p>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">14:22:01</span>
              </div>
              <div className="pt-1.5 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">Criação da Campanha</p>
                  <p className="text-[10px] text-muted-foreground">Iniciado por: organizador@gmail.com</p>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">13:50:18</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
