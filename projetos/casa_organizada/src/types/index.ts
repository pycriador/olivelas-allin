export type TaskCategory = 'morning' | 'evening' | 'weekly' | 'laundry' | 'pet' | 'baby';
export type TaskStatus = 'pending' | 'done' | 'chained';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  estimatedMinutes: number;
  dayOfWeek?: DayOfWeek;
  chainToNextDay?: string; // title of task to generate next day
  isCustom?: boolean;
  date?: string; // YYYY-MM-DD
}

export interface DailyLog {
  date: string;
  completedCount: number;
  totalCount: number;
}

export interface UserSettings {
  petMode: boolean;
  petType: 'dog' | 'cat' | 'both';
  babyMode: boolean;
  userName: string;
}

export interface AppState {
  tasks: Task[];
  dailyLogs: DailyLog[];
  settings: UserSettings;
  streak: number;
}

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export const DAY_ORDER: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
