import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { TaskCategory } from '@/types';
import { cn } from '@/lib/utils';

interface AddTaskFormProps {
  onAdd: (task: { title: string; category: TaskCategory; estimatedMinutes: number; chainToNextDay?: string }) => void;
}

const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: 'morning', label: 'Manhã' },
  { value: 'evening', label: 'Noite' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'laundry', label: 'Lavanderia' },
  { value: 'pet', label: 'Pet' },
  { value: 'baby', label: 'Bebê' },
];

export default function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('morning');
  const [minutes, setMinutes] = useState(5);
  const [chain, setChain] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      category,
      estimatedMinutes: minutes,
      chainToNextDay: chain.trim() || undefined,
    });
    setTitle('');
    setChain('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3.5 border-2 border-dashed border-muted-foreground/25 rounded-xl text-muted-foreground font-medium text-sm flex items-center justify-center gap-2 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-200"
      >
        <Plus className="w-4.5 h-4.5" />
        Adicionar tarefa personalizada
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card shadow-[var(--shadow-card)] p-5 space-y-4 animate-scale-in">
      <div className="flex items-center justify-between">
        <h4 className="font-heading font-bold text-sm text-foreground">Nova tarefa</h4>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <input
        type="text"
        placeholder="O que precisa ser feito?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
        autoFocus
      />
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setCategory(cat.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
              category === cat.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Tempo (min)</label>
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            min={1}
            max={30}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
          />
        </div>
        <div className="flex-[2]">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Encadeia com</label>
          <input
            type="text"
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            placeholder="Tarefa do dia seguinte"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
      >
        Adicionar à rotina
      </button>
    </form>
  );
}
