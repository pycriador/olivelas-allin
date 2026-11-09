import { DAY_LABELS, DAY_ORDER } from '@/types';
import { WEEKLY_TASKS, LAUNDRY_SCHEDULE, LAUNDRY_TASKS } from '@/data/defaultTasks';
import { CalendarDays, Shirt, CheckCircle2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useRoutine } from '@/hooks/useRoutine';
import { cn } from '@/lib/utils';

export default function WeeklyPage() {
  const { currentDay } = useRoutine();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary-light)/0.3)_0%,_transparent_70%)] pb-24">
      <header className="px-5 pt-14 pb-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-5.5 h-5.5 text-primary" />
            </div>
            Rotina Semanal
          </h1>
          <p className="text-sm text-muted-foreground/80 mt-2 ml-[3.25rem]">Visão geral de tarefas da semana</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 space-y-3">
        {DAY_ORDER.map((day) => {
          const isToday = day === currentDay;
          const weeklyForDay = WEEKLY_TASKS[day] || [];
          const laundryForDay = LAUNDRY_TASKS[day] || [];
          const laundryLabel = LAUNDRY_SCHEDULE[day];

          return (
            <div
              key={day}
              className={cn(
                "rounded-xl border p-4 transition-all duration-200 shadow-[var(--shadow-card)]",
                isToday
                  ? "border-primary/30 bg-primary/[0.03] ring-1 ring-primary/10"
                  : "bg-card hover:shadow-[var(--shadow-elevated)]"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-sm flex items-center gap-2">
                  {isToday && (
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
                  )}
                  <span className={cn(isToday && "text-primary")}>{DAY_LABELS[day]}</span>
                </h3>
                <span className={cn(
                  "text-[11px] font-semibold px-2.5 py-1 rounded-full border",
                  isToday ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/50 text-muted-foreground border-border/60"
                )}>
                  <Shirt className="w-3 h-3 inline mr-1 -mt-0.5" />
                  {laundryLabel}
                </span>
              </div>

              {weeklyForDay.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {weeklyForDay.map((t, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-foreground/80">
                      <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />
                      <span>{t.title}</span>
                      <span className="text-[11px] font-medium text-muted-foreground/60 ml-auto">{t.estimatedMinutes}min</span>
                    </div>
                  ))}
                </div>
              )}

              {laundryForDay.length > 0 && (
                <div className={cn("pt-2 space-y-1.5", weeklyForDay.length > 0 && "border-t border-border/50")}>
                  {laundryForDay.map((t, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-foreground/80">
                      <Shirt className="w-3.5 h-3.5 text-laundry flex-shrink-0" />
                      <span>{t.title}</span>
                      <span className="text-[11px] font-medium text-muted-foreground/60 ml-auto">{t.estimatedMinutes}min</span>
                    </div>
                  ))}
                </div>
              )}

              {weeklyForDay.length === 0 && laundryForDay.length === 0 && (
                <p className="text-sm text-muted-foreground/60 italic">Dia mais leve 🌿</p>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
