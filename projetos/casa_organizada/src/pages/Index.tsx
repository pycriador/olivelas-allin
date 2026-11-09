import { Sun, Moon, CalendarDays, Shirt, Dog, Baby, Flame, Check, Clock } from 'lucide-react';
import { useRoutine } from '@/hooks/useRoutine';
import RoutineSection from '@/components/RoutineSection';
import AddTaskForm from '@/components/AddTaskForm';
import BottomNav from '@/components/BottomNav';
import { DAY_LABELS } from '@/types';
import { LAUNDRY_SCHEDULE } from '@/data/defaultTasks';
import heroImage from '@/assets/home-hero.jpg';

const greetingByTime = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const Index = () => {
  const {
    morningTasks, eveningTasks, weeklyTasks, laundryTasks, petTasks, babyTasks, todayTasks,
    completedCount, totalCount, progressPercent, streak, settings,
    toggleTask, addTask, deleteTask, editTask, currentDay,
  } = useRoutine();

  const dayLabel = DAY_LABELS[currentDay];
  const laundryLabel = LAUNDRY_SCHEDULE[currentDay];
  const isComplete = progressPercent === 100 && totalCount > 0;
  const remainingMinutes = todayTasks
    .filter((t) => t.status !== 'done')
    .reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <header className="relative">
        <img
          src={heroImage}
          alt="Sala de estar clara em tons de areia com sofá de linho, madeira e cerâmica"
          width={1536}
          height={1024}
          className="h-[300px] w-full object-cover sm:h-[380px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-lg px-6 pb-7">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
              {dayLabel}
            </p>
            <h1 className="mt-2 font-heading text-[2.1rem] font-light leading-[1.1] tracking-tight text-foreground">
              {greetingByTime()}
              {settings.userName && <span className="font-medium">, {settings.userName}</span>}
            </h1>
            <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
              {laundryLabel !== 'Descanso 😌'
                ? `Cuidado de hoje · ${laundryLabel}`
                : 'Hoje a lavanderia descansa'}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-6">
        {/* Progress panel */}
        <section className="border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Progresso de hoje
              </p>
              <p className="mt-1 font-heading text-5xl font-light tracking-tight text-foreground">
                {progressPercent}
                <span className="ml-1 text-xl text-muted-foreground">%</span>
              </p>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1.5 border border-border px-3 py-1.5">
                <Flame className="h-3.5 w-3.5 icon-streak" />
                <span className="font-heading text-sm font-semibold text-foreground">{streak}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">dias</span>
              </div>
            )}
          </div>

          <div className="mt-5 h-px w-full bg-border">
            <div
              className="h-px bg-primary transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <dl className="mt-5 grid grid-cols-3 divide-x divide-border border-t border-border pt-4 text-center">
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Feitas</dt>
              <dd className="mt-1 font-heading text-lg font-medium text-foreground">{completedCount}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</dt>
              <dd className="mt-1 font-heading text-lg font-medium text-foreground">{totalCount}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Restam</dt>
              <dd className="mt-1 flex items-center justify-center gap-1 font-heading text-lg font-medium text-foreground">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {remainingMinutes}min
              </dd>
            </div>
          </dl>
        </section>

        {isComplete && (
          <div className="flex items-center gap-3 border border-border bg-secondary p-4 animate-fade-in">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/15">
              <Check className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-foreground">Dia concluído</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Todas as tarefas de hoje estão feitas</p>
            </div>
          </div>
        )}

        <RoutineSection title="Rotina da Manhã" icon={Sun} tasks={morningTasks} onToggle={toggleTask} onDelete={deleteTask} onEdit={editTask} variant="morning" />
        <RoutineSection title="Tarefas da Semana" icon={CalendarDays} tasks={weeklyTasks} onToggle={toggleTask} onDelete={deleteTask} onEdit={editTask} variant="default" />
        <RoutineSection title="Ciclo de Lavanderia" icon={Shirt} tasks={laundryTasks} onToggle={toggleTask} onDelete={deleteTask} onEdit={editTask} variant="laundry" />
        {settings.petMode && (
          <RoutineSection title="Tarefas dos Pets" icon={Dog} tasks={petTasks} onToggle={toggleTask} onDelete={deleteTask} onEdit={editTask} variant="pet" />
        )}
        {settings.babyMode && (
          <RoutineSection title="Tarefas do Bebê" icon={Baby} tasks={babyTasks} onToggle={toggleTask} onDelete={deleteTask} onEdit={editTask} variant="baby" />
        )}
        <RoutineSection title="Rotina da Noite" icon={Moon} tasks={eveningTasks} onToggle={toggleTask} onDelete={deleteTask} onEdit={editTask} variant="evening" />

        <AddTaskForm onAdd={addTask} />
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
