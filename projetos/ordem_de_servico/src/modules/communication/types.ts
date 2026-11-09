export type MessageCategory =
  | "ordem-servico" | "financeiro" | "documentos" | "garantia"
  | "sistema" | "usuarios" | "marketing" | "alertas";

export const MESSAGE_CATEGORIES: MessageCategory[] = [
  "ordem-servico", "financeiro", "documentos", "garantia",
  "sistema", "usuarios", "marketing", "alertas",
];

export const MESSAGE_CATEGORY_LABELS: Record<MessageCategory, string> = {
  "ordem-servico": "Ordem de Serviço",
  financeiro: "Financeiro",
  documentos: "Documentos",
  garantia: "Garantia",
  sistema: "Sistema",
  usuarios: "Usuários",
  marketing: "Marketing",
  alertas: "Alertas",
};

export type ChannelType =
  | "email" | "whatsapp" | "internal" | "whatsapp-business"
  | "telegram" | "sms" | "push" | "slack" | "teams";

export const CHANNEL_TYPES: ChannelType[] = [
  "email", "whatsapp", "internal", "whatsapp-business",
  "telegram", "sms", "push", "slack", "teams",
];

export const CHANNEL_TYPE_LABELS: Record<ChannelType, string> = {
  email: "E-mail",
  whatsapp: "WhatsApp Manual",
  internal: "Notificação Interna",
  "whatsapp-business": "WhatsApp Business API",
  telegram: "Telegram",
  sms: "SMS",
  push: "Push Notification",
  slack: "Slack",
  teams: "Microsoft Teams",
};

export type MessageStatus =
  | "pending" | "processing" | "sent" | "delivered" | "read"
  | "failed" | "cancelled";

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  pending: "Pendente",
  processing: "Processando",
  sent: "Enviado",
  delivered: "Entregue",
  read: "Visualizado",
  failed: "Falhou",
  cancelled: "Cancelado",
};

export type TemplateStatus = "active" | "inactive" | "archived";

export type ScheduleStatus = "pending" | "sent" | "cancelled";

export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: "Único",
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

export type CommEventType =
  | "template-created" | "template-edited" | "template-archived"
  | "message-sent" | "message-cancelled" | "message-retried"
  | "rule-created" | "rule-edited" | "rule-activated" | "rule-deactivated"
  | "schedule-created" | "schedule-cancelled"
  | "preferences-updated"
  | "channel-status-changed"
  | "history-viewed";

export const COMM_EVENT_LABELS: Record<CommEventType, string> = {
  "template-created": "Template Criado",
  "template-edited": "Template Editado",
  "template-archived": "Template Arquivado",
  "message-sent": "Mensagem Enviada",
  "message-cancelled": "Envio Cancelado",
  "message-retried": "Reenvio Realizado",
  "rule-created": "Regra Criada",
  "rule-edited": "Regra Editada",
  "rule-activated": "Regra Ativada",
  "rule-deactivated": "Regra Desativada",
  "schedule-created": "Agendamento Criado",
  "schedule-cancelled": "Agendamento Cancelado",
  "preferences-updated": "Preferências Alteradas",
  "channel-status-changed": "Status do Canal Alterado",
  "history-viewed": "Histórico Visualizado",
};

export interface MessageTemplate {
  id: string;
  name: string;
  category: MessageCategory;
  channel: ChannelType;
  subject: string;
  content: string;
  variables: string[];
  status: TemplateStatus;
  companyId: string | null;
  version: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  companyId: string;
  clientId: string;
  clientName: string;
  clientContact: string;
  channel: ChannelType;
  templateId: string | null;
  subject: string;
  content: string;
  attachments: CommAttachment[];
  status: MessageStatus;
  attempts: number;
  maxAttempts: number;
  nextAttempt: string | null;
  error: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommAttachment {
  id: string;
  documentId: string | null;
  documentName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface CommunicationRule {
  id: string;
  name: string;
  event: string;
  condition: string;
  templateId: string;
  channel: ChannelType;
  active: boolean;
  companyId: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  clientId: string;
  clientName: string;
  clientContact: string;
  channel: ChannelType;
  templateId: string | null;
  subject: string;
  content: string;
  attachments: CommAttachment[];
  scheduledAt: string;
  recurrence: RecurrenceType;
  status: ScheduleStatus;
  sentAt: string | null;
  createdBy: string;
  createdAt: string;
}

export interface InboxMessage {
  id: string;
  sender: string;
  channel: ChannelType;
  message: string;
  receivedAt: string;
  status: "unread" | "read" | "archived";
  relatedEntity: string | null;
  relatedId: string | null;
  clientId: string | null;
  clientName: string | null;
}

export interface CommHistory {
  id: string;
  clientId: string;
  clientName: string;
  channel: ChannelType;
  event: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ClientPreferences {
  id: string;
  clientId: string;
  clientName: string;
  receiveWhatsApp: boolean;
  receiveEmail: boolean;
  receiveSMS: boolean;
  receiveNotifications: boolean;
  updatedAt: string;
}

export const DEFAULT_CLIENT_PREFERENCES: Omit<ClientPreferences, "id" | "clientId" | "clientName"> = {
  receiveWhatsApp: true,
  receiveEmail: true,
  receiveSMS: false,
  receiveNotifications: true,
  updatedAt: "",
};

export interface CompanyPreferences {
  id: string;
  companyId: string;
  defaultChannel: ChannelType;
  allowStartHour: string;
  allowEndHour: string;
  defaultSignature: string;
  maxRetries: number;
  retryIntervalMinutes: number;
  updatedAt: string;
}

export const DEFAULT_COMPANY_PREFERENCES: Omit<CompanyPreferences, "id" | "companyId"> = {
  defaultChannel: "email",
  allowStartHour: "08:00",
  allowEndHour: "18:00",
  defaultSignature: "Atenciosamente,\n{{empresa.nome}}",
  maxRetries: 3,
  retryIntervalMinutes: 30,
  updatedAt: "",
};

export interface CommAuditEvent {
  id: string;
  event: CommEventType;
  userId: string;
  userName: string;
  description: string;
  entityId: string | null;
  entityType: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ChannelStatus {
  id: string;
  channel: ChannelType;
  enabled: boolean;
  configured: boolean;
  lastTestAt: string | null;
  lastTestResult: "success" | "failure" | null;
}

export const CHANNEL_STATUSES: ChannelStatus[] = [
  { id: "email", channel: "email", enabled: true, configured: true, lastTestAt: null, lastTestResult: null },
  { id: "whatsapp", channel: "whatsapp", enabled: true, configured: true, lastTestAt: null, lastTestResult: null },
  { id: "internal", channel: "internal", enabled: true, configured: true, lastTestAt: null, lastTestResult: null },
  { id: "whatsapp-business", channel: "whatsapp-business", enabled: false, configured: false, lastTestAt: null, lastTestResult: null },
  { id: "telegram", channel: "telegram", enabled: false, configured: false, lastTestAt: null, lastTestResult: null },
  { id: "sms", channel: "sms", enabled: false, configured: false, lastTestAt: null, lastTestResult: null },
  { id: "push", channel: "push", enabled: false, configured: false, lastTestAt: null, lastTestResult: null },
  { id: "slack", channel: "slack", enabled: false, configured: false, lastTestAt: null, lastTestResult: null },
  { id: "teams", channel: "teams", enabled: false, configured: false, lastTestAt: null, lastTestResult: null },
];
