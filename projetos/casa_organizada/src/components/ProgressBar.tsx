import { Flame, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  percent: number;
  completed: number;
  total: number;
  streak: number;
}

export default function ProgressBar({ percent, completed, total, streak }: ProgressBarProps) {
  const isComplete = percent === 100 && total > 0;

  return (
    <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Progresso diário</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-3xl font-heading font-bold text-foreground">{percent}%</span>
            {isComplete && (
              <span className="flex items-center gap-0.5 text-xs font-semibold text-success animate-fade-in">
                <Sparkles className="w-3.5 h-3.5" /> Completo
              </span>
            )}
          </div>
        </div>
        {streak > 0 && (
          <div className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-full border",
            isComplete ? "bg-accent/10 border-accent/20 text-accent" : "bg-secondary border-border/60 text-muted-foreground"
          )}>
            <Flame className={cn("w-4.5 h-4.5", isComplete && "icon-streak animate-streak-glow")} />
            <span className="font-bold text-sm">{streak}</span>
            <span className="text-[10px] font-medium opacity-70">dias</span>
          </div>
        )}
      </div>
      <div className="relative w-full h-2.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
        {percent > 0 && percent < 100 && (
          <div
            className="absolute top-0 bottom-0 w-6 h-full bg-white/20 blur-sm rounded-full animate-pulse-soft"
            style={{ left: `${percent - 2}%` }}
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground/70 mt-2 font-medium">
        {completed} de {total} tarefas concluídas
      </p>
    </div>
  );
}
