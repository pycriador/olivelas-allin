import { Baby } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import RoutineSection from '@/components/RoutineSection';
import { useRoutine } from '@/hooks/useRoutine';
import AddTaskForm from '@/components/AddTaskForm';
import { cn } from '@/lib/utils';

export default function BabyPage() {
  const { settings, babyTasks, toggleTask, deleteTask, editTask, updateSettings, addTask } = useRoutine();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--baby-bg)/0.4)_0%,_transparent_70%)] pb-24">
      <header className="px-5 pt-14 pb-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--baby-bg))] flex items-center justify-center">
              <Baby className="w-5.5 h-5.5 icon-baby" />
            </div>
            Módulo Bebê
          </h1>
          <p className="text-sm text-muted-foreground/80 mt-2 ml-[3.25rem]">Higienização extra e cuidados com o bebê</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 space-y-4">
        {/* Toggle card */}
        <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] p-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                settings.babyMode ? "bg-[hsl(var(--baby-bg))]" : "bg-secondary"
              )}>
                <Baby className={cn("w-5 h-5 transition-colors", settings.babyMode ? "icon-baby" : "text-muted-foreground/50")} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-foreground">Modo Bebê</h3>
                <p className="text-xs text-muted-foreground/70 mt-0.5">Adiciona tarefas de cuidados com o bebê</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ babyMode: !settings.babyMode })}
              className={cn(
                "w-12 h-7 rounded-full transition-all duration-300 relative flex-shrink-0",
                settings.babyMode ? "bg-baby" : "bg-muted/70"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-6 h-6 rounded-full bg-card shadow-sm transition-all duration-300",
                settings.babyMode ? "translate-x-5.5" : "translate-x-0.5"
              )} />
            </button>
          </div>
        </div>

        {settings.babyMode ? (
          <>
            {babyTasks.length > 0 && (
              <RoutineSection
                title="Tarefas do Bebê — Hoje"
                icon={Baby}
                tasks={babyTasks}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onEdit={editTask}
                variant="baby"
              />
            )}
            <AddTaskForm onAdd={(t) => addTask({ ...t, category: 'baby', date: new Date().toISOString().split('T')[0] })} />
          </>
        ) : (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Baby className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">Modo Bebê desativado</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Ative acima para gerenciar tarefas do bebê</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
