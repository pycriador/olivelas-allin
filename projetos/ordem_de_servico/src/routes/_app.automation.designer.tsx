import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap, GitFork, ArrowLeftRight, Repeat, Clock, Timer, Webhook,
  Terminal, Link2, FileText, MessageSquare, Brain, Puzzle, Database,
  CheckCircle, StopCircle, ZoomIn, ZoomOut, Undo2, Redo2, Save,
} from "lucide-react";

export const Route = createFileRoute("/_app/automation/designer")({
  head: () => ({ meta: [{ title: "Workflow Designer — ServiceForge" }] }),
  component: DesignerPage,
});

const STEP_PALETTE = [
  { type: "trigger", label: "Trigger", icon: Zap },
  { type: "condition", label: "Condição", icon: GitFork },
  { type: "decision", label: "Decisão", icon: ArrowLeftRight },
  { type: "loop", label: "Loop", icon: Repeat },
  { type: "delay", label: "Atraso", icon: Clock },
  { type: "timer", label: "Timer", icon: Timer },
  { type: "event", label: "Evento", icon: Webhook },
  { type: "script", label: "Script", icon: Terminal },
  { type: "webhook", label: "Webhook", icon: Link2 },
  { type: "api", label: "API", icon: Terminal },
  { type: "document", label: "Documento", icon: FileText },
  { type: "communication", label: "Comunicação", icon: MessageSquare },
  { type: "ia", label: "IA", icon: Brain },
  { type: "integration", label: "Integração", icon: Puzzle },
  { type: "database", label: "Banco de Dados", icon: Database },
  { type: "approval", label: "Aprovação", icon: CheckCircle },
  { type: "end", label: "Fim", icon: StopCircle },
];

function DesignerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workflow Designer — ServiceForge</h1>
          <p className="text-sm text-muted-foreground">Crie e edite workflows visualmente</p>
        </div>
      </div>

      <div className="flex items-center gap-2 border rounded-lg p-2 bg-muted/30">
        <Button size="sm" variant="ghost" disabled>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" disabled>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground mx-1">100%</span>
        <div className="w-px h-6 bg-border mx-2" />
        <Button size="sm" variant="ghost" disabled>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" disabled>
          <Redo2 className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button size="sm">
          <Save className="h-4 w-4 mr-1" /> Salvar
        </Button>
      </div>

      <div className="flex gap-4 h-[calc(100vh-18rem)]">
        <aside className="w-56 shrink-0 border rounded-lg overflow-y-auto p-2 bg-background">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2">
            Paleta de Passos
          </h3>
          <div className="space-y-1">
            {STEP_PALETTE.map((step) => {
              const Icon = step.icon;
              return (
                <Card
                  key={step.type}
                  className="flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-muted transition-colors border-0 shadow-none"
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{step.label}</span>
                </Card>
              );
            })}
          </div>
        </aside>

        <div className="flex-1 border rounded-lg bg-background relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Arraste passos da paleta para o canvas</p>
              <Badge variant="outline" className="text-xs">Canvas vazio — comece adicionando um Trigger</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
