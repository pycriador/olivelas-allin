export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

export type CalendarEventCategory =
  | 'party_hall'
  | 'barbecue'
  | 'sports'
  | 'leisure'
  | 'work'
  | 'wellness'
  | 'assembly'
  | 'maintenance';

export interface CalendarEvent {
  id: string;
  title: string;
  category: CalendarEventCategory;
  categoryLabel: string;
  resourceId?: string;
  resourceName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  userName?: string;
  userUnit?: string;
  status: 'confirmed' | 'pending' | 'in_use' | 'completed' | 'cancelled';
  description?: string;
  location?: string;
  isMyEvent?: boolean;
}
