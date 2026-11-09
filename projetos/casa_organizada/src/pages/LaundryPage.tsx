import { DAY_LABELS, DAY_ORDER } from '@/types';
import { LAUNDRY_SCHEDULE, LAUNDRY_TASKS } from '@/data/defaultTasks';
import { Shirt, CheckCircle2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useRoutine } from '@/hooks/useRoutine';
import { cn } from '@/lib/utils';

export default function LaundryPage() {
  const { currentDay, laundryTasks, toggleTask } = useRoutine();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--laundry-bg)/0.3)_0%,_transparent_70%)] pb-24">
      <header className="px-5 pt-14 pb-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--laundry-bg))] flex items-center justify-center">
              <Shirt className="w-5.5 h-5.5 icon-laundry" />
            </div>
            Ciclos de Lavanderia
          </h1>
          <p className="text-sm text-muted-foreground/80 mt-2 ml-[3.25rem]">Plano semanal de roupas</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 space-y-3">
        {/* Today's active tasks */}
        {laundryTasks.length > 0 && (
          <div className="rounded-xl border border-[hsl(var(--laundry)/0.2)] bg-[hsl(var(--laundry-bg))] shadow-[var(--shadow-card)] p-4 animate-scale-in">
            <h3 className="font-heading font-bold text-sm flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-laundry inline-block" />
              Hoje — {LAUNDRY_SCHEDULE[currentDay]}
            </h3>
            <div className="space-y-1">
              {laundryTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="flex items-center gap-3 w-full text-left py-2 px-2 rounded-lg hover:bg-black/5 transition-colors"
                >
                  <CheckCircle2
                    className={cn(
                      "w-4.5 h-4.5 flex-shrink-0 transition-colors",
                      task.status === 'done' ? 'text-laundry' : 'text-muted-foreground/30'
                    )}
                  />
                  <span className={cn(
                    "text-sm flex-1",
                    task.status === 'done' ? 'line-through text-muted-foreground/60' : 'text-foreground'
                  )}>
                    {task.title}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground/60">{task.estimatedMinutes}min</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Full week overview */}
        {DAY_ORDER.map((day) => {
          const isToday = day === currentDay;
          const label = LAUNDRY_SCHEDULE[day];
          const tasks = LAUNDRY_TASKS[day] || [];

          return (
            <div
              key={day}
              className={cn(
                "rounded-xl border p-4 shadow-[var(--shadow-card)] transition-all duration-200",
                isToday ? "border-[hsl(var(--laundry)/0.3)] bg-[hsl(var(--laundry-bg)/0.5)] ring-1 ring-[hsl(var(--laundry)/0.1)]" : "bg-card"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading font-bold text-sm flex items-center gap-2">
                  {isToday && <span className="w-2 h-2 rounded-full bg-laundry inline-block" />}
                  <span className={cn(isToday && "text-laundry")}>{DAY_LABELS[day]}</span>
                </h3>
                <span className={cn(
                  "text-xs font-semibold px-2.5 py-1 rounded-full",
                  isToday ? "bg-laundry/10 text-laundry" : "bg-muted/50 text-muted-foreground"
                )}>
                  {label}
                </span>
              </div>
              {tasks.length > 0 ? (
                <div className="space-y-1.5">
                  {tasks.map((t, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-foreground/80">
                      <Shirt className="w-3.5 h-3.5 icon-laundry flex-shrink-0" />
                      <span>{t.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/60 italic">Descanso 😌</p>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
