import { useState } from 'react';
import { Task } from '@/types';
import { Check, Trash2, Link2, Pencil, X, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, updates: { title: string; estimatedMinutes: number; chainToNextDay?: string }) => void;
}

export default function TaskItem({ task, onToggle, onDelete, onEdit }: TaskItemProps) {
  const isDone = task.status === 'done';
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editMinutes, setEditMinutes] = useState(task.estimatedMinutes);
  const [editChain, setEditChain] = useState(task.chainToNextDay || '');

  const handleSave = () => {
    if (!editTitle.trim()) return;
    onEdit?.(task.id, {
      title: editTitle.trim(),
      estimatedMinutes: editMinutes,
      chainToNextDay: editChain.trim() || undefined,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="py-2.5 px-3.5 rounded-lg bg-secondary/40 border border-border/60 space-y-2.5 animate-fade-in">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
          autoFocus
        />
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Minutos</label>
            <input
              type="number"
              value={editMinutes}
              onChange={(e) => setEditMinutes(Number(e.target.value))}
              min={1}
              max={30}
              className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
          <div className="flex-[2]">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Encadeia com</label>
            <input
              type="text"
              value={editChain}
              onChange={(e) => setEditChain(e.target.value)}
              placeholder="Tarefa do dia seguinte"
              className="w-full px-2.5 py-1.5 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
        </div>
        <div className="flex gap-1.5 justify-end">
          <button
            onClick={() => setEditing(false)}
            className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleSave}
            className="px-2.5 py-1.5 text-xs font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1"
          >
            <Save className="w-3.5 h-3.5" /> Salvar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2.5 px-3.5 rounded-lg transition-all duration-200 group",
        isDone ? "opacity-55" : "hover:bg-secondary/40"
      )}
    >
      <button
        onClick={() => onToggle(task.id)}
        className={cn(
          "flex-shrink-0 w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
          isDone
            ? "bg-primary border-primary animate-check-bounce"
            : "border-muted-foreground/35 hover:border-primary/60 hover:bg-primary/5"
        )}
      >
        {isDone && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium transition-all leading-snug",
            isDone ? "line-through text-muted-foreground/60" : "text-foreground"
          )}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2.5 mt-0.5">
          <span className="text-[11px] font-medium text-muted-foreground/70">{task.estimatedMinutes} min</span>
          {task.chainToNextDay && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-primary/70">
              <Link2 className="w-3 h-3" />
              encadeia
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {onEdit && (
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 text-muted-foreground/60 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
