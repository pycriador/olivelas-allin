import { useState, useEffect, useCallback } from 'react';
import { Task, AppState, UserSettings, DayOfWeek, DAY_ORDER } from '@/types';
import {
  DEFAULT_MORNING_TASKS,
  DEFAULT_EVENING_TASKS,
  WEEKLY_TASKS,
  LAUNDRY_TASKS,
  PET_DAILY_TASKS,
  PET_WEEKLY_TASKS,
  BABY_DAILY_TASKS,
  generateId,
} from '@/data/defaultTasks';

const STORAGE_KEY = 'rotina-inteligente-state';

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getCurrentDayOfWeek(): DayOfWeek {
  const jsDay = new Date().getDay();
  return DAY_ORDER[jsDay === 0 ? 6 : jsDay - 1];
}

function createTaskFromTemplate(template: Omit<Task, 'id' | 'status' | 'date'>, date: string): Task {
  return { ...template, id: generateId(), status: 'pending', date };
}

const defaultSettings: UserSettings = {
  petMode: false,
  petType: 'dog',
  babyMode: false,
  userName: '',
};

function generateDailyTasks(settings: UserSettings, date: string): Task[] {
  const today = getCurrentDayOfWeek();
  const tasks: Task[] = [];

  DEFAULT_MORNING_TASKS.forEach(t => tasks.push(createTaskFromTemplate(t, date)));
  DEFAULT_EVENING_TASKS.forEach(t => tasks.push(createTaskFromTemplate(t, date)));

  const weeklyForToday = WEEKLY_TASKS[today] || [];
  weeklyForToday.forEach(t => tasks.push(createTaskFromTemplate(t, date)));

  const laundryForToday = LAUNDRY_TASKS[today] || [];
  laundryForToday.forEach(t => tasks.push(createTaskFromTemplate(t, date)));

  if (settings.petMode) {
    PET_DAILY_TASKS.forEach(t => tasks.push(createTaskFromTemplate(t, date)));
    const petWeekly = PET_WEEKLY_TASKS[today] || [];
    petWeekly.forEach(t => tasks.push(createTaskFromTemplate(t, date)));
  }

  if (settings.babyMode) {
    BABY_DAILY_TASKS.forEach(t => tasks.push(createTaskFromTemplate(t, date)));
  }

  return tasks;
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const state = JSON.parse(raw) as AppState;
      return state;
    }
  } catch (e) {
    console.error('Failed to load state', e);
  }
  const today = getTodayString();
  return {
    tasks: generateDailyTasks(defaultSettings, today),
    dailyLogs: [],
    settings: defaultSettings,
    streak: 0,
  };
}

export function useRoutine() {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Check if we need to generate tasks for today
  useEffect(() => {
    const today = getTodayString();
    const hasTodayTasks = state.tasks.some(t => t.date === today);
    if (!hasTodayTasks) {
      setState(prev => {
        const newTasks = generateDailyTasks(prev.settings, today);
        // Process chains from yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const yesterdayDone = prev.tasks.filter(t => t.date === yesterdayStr && t.status === 'done' && t.chainToNextDay);
        // chained tasks already in morning defaults, so just mark streak
        const yesterdayTasks = prev.tasks.filter(t => t.date === yesterdayStr);
        const allDone = yesterdayTasks.length > 0 && yesterdayTasks.every(t => t.status === 'done');
        return {
          ...prev,
          tasks: [...prev.tasks.filter(t => t.date === today || t.date === yesterdayStr), ...newTasks],
          streak: allDone ? prev.streak + 1 : 0,
        };
      });
    }
  }, []);

  const todayTasks = state.tasks.filter(t => t.date === getTodayString());
  const morningTasks = todayTasks.filter(t => t.category === 'morning');
  const eveningTasks = todayTasks.filter(t => t.category === 'evening');
  const weeklyTasks = todayTasks.filter(t => t.category === 'weekly');
  const laundryTasks = todayTasks.filter(t => t.category === 'laundry');
  const petTasks = todayTasks.filter(t => t.category === 'pet');
  const babyTasks = todayTasks.filter(t => t.category === 'baby');

  const completedCount = todayTasks.filter(t => t.status === 'done').length;
  const totalCount = todayTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleTask = useCallback((taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.id === taskId ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } : t
      ),
    }));
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'status'>) => {
    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, { ...task, id: generateId(), status: 'pending', date: task.date || getTodayString(), isCustom: true }],
    }));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
    }));
  }, []);

  const editTask = useCallback((taskId: string, updates: { title: string; estimatedMinutes: number; chainToNextDay?: string }) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setState(prev => {
      const settings = { ...prev.settings, ...newSettings };
      const today = getTodayString();
      let tasks = prev.tasks;

      // Regenerate pet/baby tasks based on new settings
      if ('petMode' in newSettings || 'babyMode' in newSettings) {
        tasks = tasks.filter(t => !(t.date === today && (t.category === 'pet' || t.category === 'baby') && !t.isCustom));
        if (settings.petMode) {
          PET_DAILY_TASKS.forEach(t => tasks.push(createTaskFromTemplate(t, today)));
          const todayDay = getCurrentDayOfWeek();
          (PET_WEEKLY_TASKS[todayDay] || []).forEach(t => tasks.push(createTaskFromTemplate(t, today)));
        }
        if (settings.babyMode) {
          BABY_DAILY_TASKS.forEach(t => tasks.push(createTaskFromTemplate(t, today)));
        }
      }

      return { ...prev, settings, tasks };
    });
  }, []);

  const getWeeklyTasksForDay = useCallback((day: DayOfWeek) => {
    return WEEKLY_TASKS[day] || [];
  }, []);

  const resetDay = useCallback(() => {
    const today = getTodayString();
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.date === today ? { ...t, status: 'pending' } : t
      ),
    }));
  }, []);

  return {
    state,
    todayTasks,
    morningTasks,
    eveningTasks,
    weeklyTasks,
    laundryTasks,
    petTasks,
    babyTasks,
    completedCount,
    totalCount,
    progressPercent,
    streak: state.streak,
    settings: state.settings,
    toggleTask,
    addTask,
    deleteTask,
    editTask,
    updateSettings,
    getWeeklyTasksForDay,
    resetDay,
    currentDay: getCurrentDayOfWeek(),
  };
}
