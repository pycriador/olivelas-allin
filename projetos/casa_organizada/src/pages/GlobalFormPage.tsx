import { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardList, Plus, Trash2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GlobalTask {
  id: string;
  title: string;
  category: string;
  estimated_minutes: number;
  day_of_week: string | null;
  chain_to_next_day: string | null;
}

const CATEGORIES = ['morning', 'evening', 'weekly', 'laundry', 'pet', 'baby'];
const CATEGORY_LABEL: Record<string, string> = {
  morning: 'Manhã', evening: 'Noite', weekly: 'Semanal',
  laundry: 'Lavanderia', pet: 'Pet', baby: 'Bebê',
};
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABEL: Record<string, string> = {
  monday: 'Seg', tuesday: 'Ter', wednesday: 'Qua', thursday: 'Qui',
  friday: 'Sex', saturday: 'Sáb', sunday: 'Dom',
};

export default function GlobalFormPage() {
  const { isEditor, loading: roleLoading } = useUserRole();
  const [tasks, setTasks] = useState<GlobalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('morning');
  const [newMinutes, setNewMinutes] = useState(5);
  const [newDay, setNewDay] = useState<string>('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('global_default_tasks')
      .select('*')
      .order('category')
      .order('day_of_week', { nullsFirst: true });
    setTasks((data ?? []) as GlobalTask[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isEditor) load();
  }, [isEditor]);

  if (roleLoading) return <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>;
  if (!isEditor) return <Navigate to="/settings" replace />;

  const addTask = async () => {
    if (!newTitle.trim()) return;
    const needsDay = newCategory === 'weekly' || newCategory === 'laundry';
    const { error } = await supabase.from('global_default_tasks').insert({
      title: newTitle.trim(),
      category: newCategory,
      estimated_minutes: newMinutes,
      day_of_week: needsDay ? newDay || 'monday' : null,
    });
    if (error) return toast.error(error.message);
    toast.success('Tarefa adicionada');
    setNewTitle('');
    load();
  };

  const updateTask = async (id: string, updates: Partial<GlobalTask>) => {
    const { error } = await supabase.from('global_default_tasks').update(updates).eq('id', id);
    if (error) return toast.error(error.message);
    load();
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Remover esta tarefa do formulário global?')) return;
    const { error } = await supabase.from('global_default_tasks').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Removida');
    load();
  };

  const grouped = CATEGORIES.map((c) => ({ category: c, items: tasks.filter((t) => t.category === c) }));

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary-light)/0.3)_0%,_transparent_70%)] pb-12">
      <header className="px-5 pt-14 pb-6">
        <div className="max-w-2xl mx-auto">
          <Link to="/settings" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </Link>
          <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardList className="w-5.5 h-5.5 text-primary" />
            </div>
            Tarefas Globais
          </h1>
          <p className="text-sm text-muted-foreground/80 mt-2 ml-[3.25rem]">
            Tarefas padrão usadas como base do aplicativo. Apenas editores e administradores podem alterar.
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 space-y-4">
        {/* Add new task */}
        <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] p-5 space-y-4 animate-fade-in">
          <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
            <Plus className="w-4.5 h-4.5 text-primary" />
            Adicionar tarefa
          </h3>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Título da tarefa"
            className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
          />
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
            <input
              type="number"
              min={1}
              value={newMinutes}
              onChange={(e) => setNewMinutes(Number(e.target.value))}
              className="w-20 text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
            />
            {(newCategory === 'weekly' || newCategory === 'laundry') && (
              <select
                value={newDay}
                onChange={(e) => setNewDay(e.target.value)}
                className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
              >
                <option value="">Dia...</option>
                {DAYS.map((d) => <option key={d} value={d}>{DAY_LABEL[d]}</option>)}
              </select>
            )}
            <button
              onClick={addTask}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        )}

        {/* Grouped tasks by category */}
        {grouped.map(({ category, items }) =>
          items.length > 0 && (
            <div key={category} className="rounded-xl border bg-card shadow-[var(--shadow-card)] p-5 space-y-3 animate-fade-in">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                {category === 'morning' && <span className="w-2 h-2 rounded-full bg-morning" />}
                {category === 'evening' && <span className="w-2 h-2 rounded-full bg-evening" />}
                {category === 'weekly' && <span className="w-2 h-2 rounded-full bg-primary/50" />}
                {category === 'laundry' && <span className="w-2 h-2 rounded-full bg-laundry" />}
                {category === 'pet' && <span className="w-2 h-2 rounded-full bg-pet" />}
                {category === 'baby' && <span className="w-2 h-2 rounded-full bg-baby" />}
                {CATEGORY_LABEL[category]}
              </h3>
              {items.map((t) => (
                <div key={t.id} className="flex items-center gap-2.5 border-t border-border/50 pt-2.5 first:border-t-0 first:pt-0">
                  <input
                    type="text"
                    defaultValue={t.title}
                    onBlur={(e) => e.target.value !== t.title && updateTask(t.id, { title: e.target.value })}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                  />
                  <input
                    type="number"
                    min={1}
                    defaultValue={t.estimated_minutes}
                    onBlur={(e) => Number(e.target.value) !== t.estimated_minutes && updateTask(t.id, { estimated_minutes: Number(e.target.value) })}
                    className="w-16 px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                  />
                  {t.day_of_week && (
                    <select
                      defaultValue={t.day_of_week}
                      onChange={(e) => updateTask(t.id, { day_of_week: e.target.value })}
                      className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
                    >
                      {DAYS.map((d) => <option key={d} value={d}>{DAY_LABEL[d]}</option>)}
                    </select>
                  )}
                  <button
                    onClick={() => deleteTask(t.id)}
                    className="p-2 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
