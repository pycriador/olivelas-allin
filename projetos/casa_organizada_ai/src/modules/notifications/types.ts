export type NotificationCategory = 'share' | 'comment' | 'mention' | 'change' | 'task_due' | 'task_overdue' | 'reminder' | 'automation' | 'integration' | 'system';
export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms';

export interface AppNotification {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown>;
  channel: NotificationChannel;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  shareInApp: boolean;
  shareEmail: boolean;
  commentInApp: boolean;
  commentEmail: boolean;
  mentionInApp: boolean;
  mentionEmail: boolean;
  changeInApp: boolean;
  taskDueInApp: boolean;
  taskDueEmail: boolean;
  reminderInApp: boolean;
  reminderEmail: boolean;
  automationInApp: boolean;
  digestFrequency: 'never' | 'daily' | 'weekly';
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  share: 'Compartilhamentos',
  comment: 'Comentários',
  mention: 'Menções',
  change: 'Alterações',
  task_due: 'Tarefas próximas',
  task_overdue: 'Tarefas atrasadas',
  reminder: 'Lembretes',
  automation: 'Automações',
  integration: 'Integrações',
  system: 'Sistema',
};

export const CATEGORY_ICONS: Record<NotificationCategory, string> = {
  share: '🔗',
  comment: '💬',
  mention: '@',
  change: '📝',
  task_due: '⏰',
  task_overdue: '🔴',
  reminder: '🔔',
  automation: '🤖',
  integration: '🔌',
  system: '⚙️',
};
