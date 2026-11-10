export interface Webhook {
  id: string;
  userId: string;
  name: string;
  url: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers: Record<string, string>;
  authToken: string | null;
  events: string[];
  isActive: boolean;
  retryCount: number;
  timeoutMs: number;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  status: 'success' | 'error' | 'pending' | 'retrying';
  requestBody: Record<string, unknown>;
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  attempt: number;
  durationMs: number | null;
  createdAt: string;
}

export const WEBHOOK_EVENTS = [
  'form.created',
  'form.updated',
  'form.shared',
  'form.deleted',
  'comment.created',
  'task.completed',
  'template.published',
  'automation.executed',
  'integration.connected',
  'user.joined',
] as const;
