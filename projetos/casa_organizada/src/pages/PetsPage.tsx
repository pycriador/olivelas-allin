import { Dog, Cat, PawPrint } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import RoutineSection from '@/components/RoutineSection';
import { useRoutine } from '@/hooks/useRoutine';
import AddTaskForm from '@/components/AddTaskForm';
import { cn } from '@/lib/utils';

export default function PetsPage() {
  const { settings, petTasks, toggleTask, deleteTask, editTask, updateSettings, addTask } = useRoutine();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--pet-bg)/0.4)_0%,_transparent_70%)] pb-24">
      <header className="px-5 pt-14 pb-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--pet-bg))] flex items-center justify-center">
              <PawPrint className="w-5.5 h-5.5 icon-pet" />
            </div>
            Módulo Pets
          </h1>
          <p className="text-sm text-muted-foreground/80 mt-2 ml-[3.25rem]">Cuidados diários com seus bichinhos</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 space-y-4">
        {/* Toggle card */}
        <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] p-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                settings.petMode ? "bg-[hsl(var(--pet-bg))]" : "bg-secondary"
              )}>
                <PawPrint className={cn("w-5 h-5 transition-colors", settings.petMode ? "icon-pet" : "text-muted-foreground/50")} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-foreground">Modo Pet</h3>
                <p className="text-xs text-muted-foreground/70 mt-0.5">Adiciona tarefas de pets à rotina</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ petMode: !settings.petMode })}
              className={cn(
                "w-12 h-7 rounded-full transition-all duration-300 relative flex-shrink-0",
                settings.petMode ? "bg-pet" : "bg-muted/70"
              )}
            >
              <div className={cn(
                "absolute top-0.5 w-6 h-6 rounded-full bg-card shadow-sm transition-all duration-300",
                settings.petMode ? "translate-x-5.5" : "translate-x-0.5"
              )} />
            </button>
          </div>

          {settings.petMode && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
              {(['dog', 'cat', 'both'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => updateSettings({ petType: type })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200",
                    settings.petType === type
                      ? "bg-[hsl(var(--pet))] text-white shadow-sm"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {type === 'dog' && <><Dog className="w-3.5 h-3.5" /> Cachorro</>}
                  {type === 'cat' && <><Cat className="w-3.5 h-3.5" /> Gato</>}
                  {type === 'both' && <><PawPrint className="w-3.5 h-3.5" /> Ambos</>}
                </button>
              ))}
            </div>
          )}
        </div>

        {settings.petMode ? (
          <>
            {petTasks.length > 0 && (
              <RoutineSection
                title="Tarefas dos Pets — Hoje"
                icon={PawPrint}
                tasks={petTasks}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onEdit={editTask}
                variant="pet"
              />
            )}
            <AddTaskForm onAdd={(t) => addTask({ ...t, category: 'pet', date: new Date().toISOString().split('T')[0] })} />
          </>
        ) : (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <PawPrint className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">Modo Pet desativado</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Ative acima para gerenciar tarefas dos pets</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
