import { Task } from '@/types';
import TaskItem from './TaskItem';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoutineSectionProps {
  title: string;
  icon: LucideIcon;
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, updates: { title: string; estimatedMinutes: number; chainToNextDay?: string }) => void;
  variant: 'morning' | 'evening' | 'pet' | 'baby' | 'laundry' | 'default';
}

const variantStyles: Record<string, string> = {
  morning: 'card-morning',
  evening: 'card-evening',
  pet: 'card-pet',
  baby: 'card-baby',
  laundry: 'card-laundry',
  default: 'bg-card border-border',
};

const iconStyles: Record<string, string> = {
  morning: 'icon-morning',
  evening: 'icon-evening',
  pet: 'icon-pet',
  baby: 'icon-baby',
  laundry: 'icon-laundry',
  default: 'text-primary',
};

export default function RoutineSection({ title, icon: Icon, tasks, onToggle, onDelete, onEdit, variant }: RoutineSectionProps) {
  const completed = tasks.filter((t) => t.status === 'done').length;

  if (tasks.length === 0) return null;

  return (
    <div className={cn("border p-5 animate-slide-up shadow-[var(--shadow-card)]", variantStyles[variant])}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <Icon className={cn("w-4 h-4", iconStyles[variant])} />
          <h3 className="font-heading text-xs font-semibold uppercase tracking-[0.18em] text-foreground">{title}</h3>
        </div>
        <span className="font-heading text-[11px] font-medium tabular-nums text-muted-foreground">
          {completed}/{tasks.length}
        </span>
      </div>
      <div className="space-y-0.5">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}
