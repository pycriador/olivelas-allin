import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type {
  MessageTemplate, Message, CommunicationRule, Schedule, InboxMessage,
  CommHistory, ClientPreferences, CompanyPreferences, CommAuditEvent,
  ChannelStatus, ChannelType,
} from "./types";
import { CHANNEL_STATUSES } from "./types";

const TPL_COL = "comm_templates";
const MSG_COL = "comm_messages";
const RULE_COL = "comm_rules";
const SCHED_COL = "comm_schedules";
const INBOX_COL = "comm_inbox";
const HIST_COL = "comm_history";
const CLI_PREF_COL = "comm_client_prefs";
const COM_PREF_COL = "comm_company_prefs";
const AUDIT_COL = "comm_audit";
const CHAN_COL = "comm_channels";

export const templateService = {
  async list(): Promise<MessageTemplate[]> { return getStorage().findAll<MessageTemplate>(TPL_COL); },
  async get(id: string): Promise<MessageTemplate | null> { return getStorage().find<MessageTemplate>(TPL_COL, id); },
  async create(data: Omit<MessageTemplate, "id">): Promise<MessageTemplate> {
    const created = await getStorage().create<MessageTemplate>(TPL_COL, data);
    eventBus.publish(EVENT_NAMES.COMM_TEMPLATE_CREATED, "communication", "communication", { id: created.id, name: created.name, channel: created.channel }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<MessageTemplate>): Promise<MessageTemplate> {
    const updated = await getStorage().update<MessageTemplate>(TPL_COL, id, patch);
    eventBus.publish(EVENT_NAMES.COMM_TEMPLATE_UPDATED, "communication", "communication", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(TPL_COL, id);
    eventBus.publish(EVENT_NAMES.COMM_TEMPLATE_DELETED, "communication", "communication", { id }).catch(() => {});
  },
};

export const messageService = {
  async list(): Promise<Message[]> { return getStorage().findAll<Message>(MSG_COL); },
  async get(id: string): Promise<Message | null> { return getStorage().find<Message>(MSG_COL, id); },
  async create(data: Omit<Message, "id">): Promise<Message> {
    const created = await getStorage().create<Message>(MSG_COL, data);
    eventBus.publish(EVENT_NAMES.MESSAGE_CREATED, "communication", "communication", { id: created.id, subject: created.subject, channel: created.channel, clientId: created.clientId }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<Message>): Promise<Message> {
    const updated = await getStorage().update<Message>(MSG_COL, id, patch);
    eventBus.publish(EVENT_NAMES.MESSAGE_UPDATED, "communication", "communication", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(MSG_COL, id);
    eventBus.publish(EVENT_NAMES.MESSAGE_DELETED, "communication", "communication", { id }).catch(() => {});
  },
};

export const ruleService = {
  async list(): Promise<CommunicationRule[]> { return getStorage().findAll<CommunicationRule>(RULE_COL); },
  async get(id: string): Promise<CommunicationRule | null> { return getStorage().find<CommunicationRule>(RULE_COL, id); },
  async create(data: Omit<CommunicationRule, "id">): Promise<CommunicationRule> {
    const created = await getStorage().create<CommunicationRule>(RULE_COL, data);
    eventBus.publish(EVENT_NAMES.COMM_RULE_CREATED, "communication", "communication", { id: created.id, name: created.name }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<CommunicationRule>): Promise<CommunicationRule> {
    const updated = await getStorage().update<CommunicationRule>(RULE_COL, id, patch);
    eventBus.publish(EVENT_NAMES.COMM_RULE_UPDATED, "communication", "communication", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(RULE_COL, id);
    eventBus.publish(EVENT_NAMES.COMM_RULE_DELETED, "communication", "communication", { id }).catch(() => {});
  },
};

export const scheduleService = {
  async list(): Promise<Schedule[]> { return getStorage().findAll<Schedule>(SCHED_COL); },
  async get(id: string): Promise<Schedule | null> { return getStorage().find<Schedule>(SCHED_COL, id); },
  async create(data: Omit<Schedule, "id">): Promise<Schedule> {
    const created = await getStorage().create<Schedule>(SCHED_COL, data);
    eventBus.publish(EVENT_NAMES.COMM_SCHEDULE_CREATED, "communication", "communication", { id: created.id, clientId: created.clientId, channel: created.channel }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<Schedule>): Promise<Schedule> {
    const updated = await getStorage().update<Schedule>(SCHED_COL, id, patch);
    eventBus.publish(EVENT_NAMES.COMM_SCHEDULE_UPDATED, "communication", "communication", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(SCHED_COL, id);
    eventBus.publish(EVENT_NAMES.COMM_SCHEDULE_DELETED, "communication", "communication", { id }).catch(() => {});
  },
};

export const inboxService = {
  async list(): Promise<InboxMessage[]> { return getStorage().findAll<InboxMessage>(INBOX_COL); },
  async get(id: string): Promise<InboxMessage | null> { return getStorage().find<InboxMessage>(INBOX_COL, id); },
  async create(data: Omit<InboxMessage, "id">): Promise<InboxMessage> {
    const created = await getStorage().create<InboxMessage>(INBOX_COL, data);
    eventBus.publish(EVENT_NAMES.COMM_INBOX_NEW, "communication", "communication", { id: created.id, clientId: created.clientId, subject: created.message }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<InboxMessage>): Promise<InboxMessage> {
    const updated = await getStorage().update<InboxMessage>(INBOX_COL, id, patch);
    if (patch.status === "read") {
      eventBus.publish(EVENT_NAMES.COMM_INBOX_READ, "communication", "communication", { id, clientId: updated.clientId }).catch(() => {});
    }
    return updated;
  },
};

export const historyService = {
  async list(clientId?: string): Promise<CommHistory[]> {
    const all = await getStorage().findAll<CommHistory>(HIST_COL);
    return clientId ? all.filter((h) => h.clientId === clientId) : all;
  },
  async create(data: Omit<CommHistory, "id">): Promise<CommHistory> { return getStorage().create<CommHistory>(HIST_COL, data); },
};

export const clientPreferencesService = {
  async get(clientId: string): Promise<ClientPreferences | null> { return getStorage().find<ClientPreferences>(CLI_PREF_COL, clientId); },
  async upsert(clientId: string, data: Partial<ClientPreferences> & { clientName: string }): Promise<ClientPreferences> {
    const existing = await this.get(clientId);
    let result: ClientPreferences;
    if (existing) {
      result = await getStorage().update<ClientPreferences>(CLI_PREF_COL, clientId, { ...data, updatedAt: new Date().toISOString() });
    } else {
      result = await getStorage().create<ClientPreferences>(CLI_PREF_COL, {
        clientId,
        receiveWhatsApp: true,
        receiveEmail: true,
        receiveSMS: false,
        receiveNotifications: true,
        ...data,
        updatedAt: new Date().toISOString(),
      } as unknown as ClientPreferences);
    }
    eventBus.publish(EVENT_NAMES.COMM_PREFERENCES_UPDATED, "communication", "communication", { clientId, clientName: data.clientName }).catch(() => {});
    return result;
  },
  async list(): Promise<ClientPreferences[]> { return getStorage().findAll<ClientPreferences>(CLI_PREF_COL); },
};

export const companyPreferencesService = {
  async get(companyId: string): Promise<CompanyPreferences | null> { return getStorage().find<CompanyPreferences>(COM_PREF_COL, companyId); },
  async upsert(companyId: string, data: Partial<CompanyPreferences>): Promise<CompanyPreferences> {
    const existing = await this.get(companyId);
    let result: CompanyPreferences;
    if (existing) {
      result = await getStorage().update<CompanyPreferences>(COM_PREF_COL, companyId, { ...data, updatedAt: new Date().toISOString() });
    } else {
      const { DEFAULT_COMPANY_PREFERENCES } = await import("./types");
      result = await getStorage().create<CompanyPreferences>(COM_PREF_COL, {
        ...DEFAULT_COMPANY_PREFERENCES,
        companyId,
        ...data,
        updatedAt: new Date().toISOString(),
      } as unknown as CompanyPreferences);
    }
    eventBus.publish(EVENT_NAMES.COMM_COMPANY_PREFERENCES_UPDATED, "communication", "communication", { companyId }).catch(() => {});
    return result;
  },
};

export const auditService = {
  async list(): Promise<CommAuditEvent[]> { return getStorage().findAll<CommAuditEvent>(AUDIT_COL); },
  async create(data: Omit<CommAuditEvent, "id">): Promise<CommAuditEvent> { return getStorage().create<CommAuditEvent>(AUDIT_COL, data); },
};

export const channelService = {
  async list(): Promise<ChannelStatus[]> {
    const stored = await getStorage().findAll<ChannelStatus>(CHAN_COL);
    if (stored.length === 0) {
      const defaults = CHANNEL_STATUSES.map((c) => ({ ...c }));
      for (const cs of defaults) {
        await getStorage().create<ChannelStatus>(CHAN_COL, cs as ChannelStatus);
      }
      return defaults;
    }
    return stored;
  },
  async update(channel: ChannelType, patch: Partial<ChannelStatus>): Promise<ChannelStatus> {
    const all = await this.list();
    const existing = all.find((c) => c.channel === channel);
    if (existing) {
      return getStorage().update<ChannelStatus>(CHAN_COL, existing.id, patch);
    }
    const cs: ChannelStatus = { id: channel, channel, enabled: false, configured: false, lastTestAt: null, lastTestResult: null, ...patch };
    return getStorage().create<ChannelStatus>(CHAN_COL, cs);
  },
};

export async function addAuditEvent(
  event: CommAuditEvent["event"], userId: string, userName: string,
  description: string, entityId?: string | null, entityType?: string | null,
  metadata?: Record<string, unknown>,
): Promise<CommAuditEvent> {
  return auditService.create({
    event, userId, userName, description,
    entityId: entityId ?? null, entityType: entityType ?? null,
    metadata: metadata ?? {}, createdAt: new Date().toISOString(),
  });
}

export async function sendMessage(msg: Omit<Message, "id" | "status" | "attempts" | "createdAt" | "updatedAt" | "sentAt" | "deliveredAt" | "readAt" | "nextAttempt">): Promise<Message> {
  const now = new Date().toISOString();
  const message = await messageService.create({
    ...msg,
    status: "processing",
    attempts: 0,
    sentAt: null, deliveredAt: null, readAt: null,
    nextAttempt: null,
    createdAt: now, updatedAt: now,
  });
  await addAuditEvent("message-sent", msg.createdBy, "Sistema", `Mensagem enviada para ${msg.clientName} via ${msg.channel}`, message.id, "message");
  await historyService.create({
    clientId: msg.clientId, clientName: msg.clientName, channel: msg.channel,
    event: "Mensagem enviada", description: msg.subject,
    metadata: { messageId: message.id, templateId: msg.templateId }, createdAt: now,
  });
  const sent = await messageService.update(message.id, { status: "sent", sentAt: new Date().toISOString() });
  eventBus.publish(EVENT_NAMES.MESSAGE_SENT, "communication", "communication", { id: sent.id, clientId: sent.clientId, channel: sent.channel, subject: sent.subject }, { userId: msg.createdBy }).catch(() => {});
  return sent;
}

export async function cancelMessage(id: string, userId: string): Promise<Message> {
  const msg = await messageService.get(id);
  if (!msg) throw new Error("Message not found");
  const updated = await messageService.update(id, { status: "cancelled", updatedAt: new Date().toISOString() });
  await addAuditEvent("message-cancelled", userId, "Sistema", `Envio cancelado: ${msg.subject}`, id, "message");
  eventBus.publish(EVENT_NAMES.MESSAGE_CANCELLED, "communication", "communication", { id, subject: msg.subject, clientId: msg.clientId }, { userId }).catch(() => {});
  return updated;
}

export async function retryMessage(id: string, userId: string): Promise<Message> {
  const msg = await messageService.get(id);
  if (!msg) throw new Error("Message not found");
  const attempts = msg.attempts + 1;
  const now = new Date().toISOString();
  const updated = await messageService.update(id, {
    status: "processing", attempts, error: null, updatedAt: now,
  });
  await addAuditEvent("message-retried", userId, "Sistema", `Reenvio tentativa ${attempts}: ${msg.subject}`, id, "message");
  const sent = await messageService.update(id, { status: "sent", sentAt: new Date().toISOString() });
  eventBus.publish(EVENT_NAMES.MESSAGE_RETRIED, "communication", "communication", { id, subject: msg.subject, attempts, clientId: msg.clientId }, { userId }).catch(() => {});
  return sent;
}

export function generateMessageId(): string {
  return `MSG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}
