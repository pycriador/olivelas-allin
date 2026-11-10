export type IntegrationProvider = 'google_calendar' | 'outlook_calendar' | 'google_drive' | 'onedrive' | 'dropbox' | 'gmail' | 'outlook_mail' | 'zapier' | 'make' | 'n8n' | 'custom';

export interface Integration {
  id: string;
  userId: string;
  provider: IntegrationProvider;
  name: string;
  config: Record<string, unknown>;
  credentials: Record<string, unknown>;
  isActive: boolean;
  lastSyncAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationLog {
  id: string;
  integrationId: string;
  status: 'success' | 'error' | 'pending';
  action: string;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: string;
}

export const PROVIDER_LABELS: Record<IntegrationProvider, string> = {
  google_calendar: 'Google Calendar',
  outlook_calendar: 'Outlook Calendar',
  google_drive: 'Google Drive',
  onedrive: 'OneDrive',
  dropbox: 'Dropbox',
  gmail: 'Gmail',
  outlook_mail: 'Outlook Mail',
  zapier: 'Zapier',
  make: 'Make',
  n8n: 'n8n',
  custom: 'Personalizado',
};

export const PROVIDER_CATEGORIES: Record<string, IntegrationProvider[]> = {
  calendarios: ['google_calendar', 'outlook_calendar'],
  armazenamento: ['google_drive', 'onedrive', 'dropbox'],
  comunicacao: ['gmail', 'outlook_mail'],
  automacao: ['zapier', 'make', 'n8n'],
};
