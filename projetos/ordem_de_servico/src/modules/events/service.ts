import { getStorage } from "@/core/providers/storage";
import type {
  PlatformEvent, EventStoreEntry, Subscriber, Workflow,
  WorkflowExecution, WorkflowHistory, Condition, Action,
  TriggerConfig, EventCategory, EventStatus, ExecutionStatus, RecurrenceType,
} from "./types";

const EVT_COL = "evt_events";
const STORE_COL = "evt_store";
const SUB_COL = "evt_subscribers";
const WF_COL = "evt_workflows";
const EXEC_COL = "evt_executions";
const HIST_COL = "evt_history";

let _correlationId: string | null = null;

export function setCorrelationId(id: string | null) { _correlationId = id; }
export function getCorrelationId(): string | null { return _correlationId; }

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ───── Event Bus ───── */

const _handlers = new Map<string, Array<(event: PlatformEvent) => void | Promise<void>>>();

export const eventBus = {
  subscribe(eventName: string, handler: (event: PlatformEvent) => void | Promise<void>): () => void {
    if (!_handlers.has(eventName)) _handlers.set(eventName, []);
    _handlers.get(eventName)!.push(handler);
    return () => {
      const list = _handlers.get(eventName);
      if (list) {
        const idx = list.indexOf(handler);
        if (idx >= 0) list.splice(idx, 1);
      }
    };
  },

  unsubscribe(eventName: string, handler: (event: PlatformEvent) => void | Promise<void>): void {
    const list = _handlers.get(eventName);
    if (list) {
      const idx = list.indexOf(handler);
      if (idx >= 0) list.splice(idx, 1);
    }
  },

  clear(): void { _handlers.clear(); },

  async publish(
    name: string, category: EventCategory, source: string,
    payload: Record<string, unknown> = {},
    options?: { userId?: string; companyId?: string; correlationId?: string; causationId?: string; priority?: number; metadata?: Record<string, unknown> },
  ): Promise<PlatformEvent> {
    const event: PlatformEvent = {
      id: uid(),
      name, category, source,
      companyId: options?.companyId ?? null,
      userId: options?.userId ?? null,
      createdAt: new Date().toISOString(),
      payload,
      metadata: options?.metadata ?? {},
      version: 1,
      status: "created",
      correlationId: options?.correlationId ?? _correlationId ?? uid(),
      causationId: options?.causationId ?? null,
      priority: options?.priority ?? 5,
    };

    const storeEntry: EventStoreEntry = {
      id: uid(),
      eventId: event.id,
      eventName: event.name,
      category: event.category,
      source: event.source,
      payload: event.payload,
      createdAt: event.createdAt,
      duration: null,
      result: null,
      status: "created",
      userId: event.userId,
      companyId: event.companyId,
      attempts: 0,
      error: null,
    };

    await getStorage().create<PlatformEvent>(EVT_COL, event);
    await getStorage().create<EventStoreEntry>(STORE_COL, storeEntry);

    await dispatch(event);
    return event;
  },

  async history(eventName?: string): Promise<PlatformEvent[]> {
    const all = await getStorage().findAll<PlatformEvent>(EVT_COL);
    return eventName ? all.filter((e) => e.name === eventName) : all;
  },
};

async function dispatch(event: PlatformEvent): Promise<void> {
  const now = Date.now();

  const updateStatus = async (status: EventStatus, error?: string) => {
    await getStorage().update<PlatformEvent>(EVT_COL, event.id, { status });
    const entries = await getStorage().findAll<EventStoreEntry>(STORE_COL);
    const entry = entries.find((e) => e.eventId === event.id);
    if (entry) {
      const duration = Date.now() - now;
      await getStorage().update<EventStoreEntry>(STORE_COL, entry.id, {
        status, duration, error: error ?? null, result: status === "completed" ? "ok" : null,
        attempts: entry.attempts + (status === "failed" ? 1 : 0),
      });
    }
  };

  try {
    event = await getStorage().update<PlatformEvent>(EVT_COL, event.id, { status: "processing" });

    const handlers = _handlers.get(event.name) ?? [];
    const wildcard = _handlers.get("*") ?? [];
    const all = [...handlers, ...wildcard];

    for (const handler of all) {
      await handler(event);
    }

    const subscribers = await getStorage().findAll<Subscriber>(SUB_COL);
    const matching = subscribers.filter(
      (s) => s.active && (s.eventName === event.name || s.eventName === "*"),
    );

    for (const sub of matching) {
      try {
        await addWorkflowHistory("system", null, "subscriber-executed",
          `Subscriber ${sub.moduleName} executou para evento ${event.name}`,
          { subscriberId: sub.id, eventId: event.id });
      } catch { /* ignore subscriber errors */ }
    }

    const workflows = await getStorage().findAll<Workflow>(WF_COL);
    const matchingWf = workflows.filter(
      (w) => w.status === "published" && w.trigger.type === "event" && w.trigger.eventName === event.name,
    );

    for (const wf of matchingWf) {
      await evaluateAndExecute(wf, event);
    }

    await updateStatus("completed");
  } catch (err: any) {
    await updateStatus("failed", err.message);
    throw err;
  }
}

/* ───── Workflow Engine ───── */

async function evaluateConditions(conditions: Condition[], event: PlatformEvent): Promise<boolean> {
  if (conditions.length === 0) return true;

  return conditions.every((cond) => {
    const value = String(event.payload[cond.field] ?? "");
    const target = cond.value;

    switch (cond.operator) {
      case "=": return value === target;
      case "!=": return value !== target;
      case ">": return Number(value) > Number(target);
      case "<": return Number(value) < Number(target);
      case ">=": return Number(value) >= Number(target);
      case "<=": return Number(value) <= Number(target);
      case "contains": return value.includes(target);
      case "not-contains": return !value.includes(target);
      case "is-empty": return value === "";
      case "not-empty": return value !== "";
      case "in": return target.split(",").map((s) => s.trim()).includes(value);
      case "not-in": return !target.split(",").map((s) => s.trim()).includes(value);
      case "between": {
        const [min, max] = target.split(",").map(Number);
        const num = Number(value);
        return num >= min && num <= max;
      }
      default: return true;
    }
  });
}

export async function evaluateAndExecute(workflow: Workflow, event: PlatformEvent): Promise<WorkflowExecution | null> {
  const ok = await evaluateConditions(workflow.conditions, event);
  if (!ok) return null;

  const execution: WorkflowExecution = {
    id: uid(),
    workflowId: workflow.id,
    workflowName: workflow.name,
    triggerEventId: event.id,
    status: "running",
    startedAt: new Date().toISOString(),
    completedAt: null,
    error: null,
    attempts: 1,
    maxAttempts: 3,
    nextAttempt: null,
    companyId: event.companyId,
    actionsResults: {},
  };

  await getStorage().create<WorkflowExecution>(EXEC_COL, execution);
  await addWorkflowHistory(workflow.id, execution.id, "workflow-started",
    `Workflow ${workflow.name} iniciado pelo evento ${event.name}`, {});

  try {
    const sorted = [...workflow.actions].sort((a, b) => a.order - b.order);
    const results: Record<string, unknown> = {};

    for (const action of sorted) {
      if (action.type === "end") break;
      if (action.type === "wait") continue;

      results[`action_${action.order}`] = {
        type: action.type,
        executed: true,
        config: action.config,
        timestamp: new Date().toISOString(),
      };

      if (action.type === "create-event") {
        await eventBus.publish(
          String(action.config.eventName ?? "action.executed"),
          "workflow", "workflow-engine",
          action.config.payload as Record<string, unknown> ?? {},
          { correlationId: event.correlationId ?? undefined, causationId: event.id },
        );
      }

      if (action.type === "create-audit") {
        await addWorkflowHistory(workflow.id, execution.id, "audit-created",
          String(action.config.description ?? "Ação de auditoria executada"), action.config);
      }
    }

    execution.actionsResults = results;
    execution.status = "completed";
    execution.completedAt = new Date().toISOString();

    await getStorage().update<WorkflowExecution>(EXEC_COL, execution.id, {
      status: "completed", completedAt: execution.completedAt, actionsResults: results,
    });
    await addWorkflowHistory(workflow.id, execution.id, "workflow-completed",
      `Workflow ${workflow.name} concluído com sucesso`, { actionsCount: sorted.length });

    return execution;
  } catch (err: any) {
    execution.status = "failed";
    execution.error = err.message;
    execution.attempts += 1;
    if (execution.attempts <= execution.maxAttempts) {
      const next = new Date();
      next.setMinutes(next.getMinutes() + 5 * execution.attempts);
      execution.nextAttempt = next.toISOString();
    }

    await getStorage().update<WorkflowExecution>(EXEC_COL, execution.id, {
      status: "failed", error: err.message, attempts: execution.attempts, nextAttempt: execution.nextAttempt,
    });
    await addWorkflowHistory(workflow.id, execution.id, "workflow-failed",
      `Workflow ${workflow.name} falhou: ${err.message}`, { attempts: execution.attempts });

    if (execution.attempts <= execution.maxAttempts) {
      await addWorkflowHistory(workflow.id, execution.id, "workflow-retry",
        `Workflow ${workflow.name} será reprocessado (tentativa ${execution.attempts}/${execution.maxAttempts})`, {});
    }

    return execution;
  }
}

/* ───── CRUD Services ───── */

export const eventStoreService = {
  async list(): Promise<EventStoreEntry[]> { return getStorage().findAll<EventStoreEntry>(STORE_COL); },
  async find(eventId: string): Promise<EventStoreEntry | null> {
    const all = await this.list();
    return all.find((e) => e.eventId === eventId) ?? null;
  },
};

export const subscriberService = {
  async list(): Promise<Subscriber[]> { return getStorage().findAll<Subscriber>(SUB_COL); },
  async get(id: string): Promise<Subscriber | null> { return getStorage().find<Subscriber>(SUB_COL, id); },
  async create(data: Omit<Subscriber, "id">): Promise<Subscriber> {
    const created = await getStorage().create<Subscriber>(SUB_COL, data);
    eventBus.publish(EVENT_NAMES.EVT_SUBSCRIBER_CREATED, "system", "events", { id: created.id, moduleName: created.moduleName, eventName: created.eventName }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<Subscriber>): Promise<Subscriber> {
    const updated = await getStorage().update<Subscriber>(SUB_COL, id, patch);
    eventBus.publish(EVENT_NAMES.EVT_SUBSCRIBER_UPDATED, "system", "events", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(SUB_COL, id);
    eventBus.publish(EVENT_NAMES.EVT_SUBSCRIBER_DELETED, "system", "events", { id }).catch(() => {});
  },
};

export const workflowService = {
  async list(): Promise<Workflow[]> { return getStorage().findAll<Workflow>(WF_COL); },
  async get(id: string): Promise<Workflow | null> { return getStorage().find<Workflow>(WF_COL, id); },
  async create(data: Omit<Workflow, "id">): Promise<Workflow> {
    const created = await getStorage().create<Workflow>(WF_COL, data);
    eventBus.publish(EVENT_NAMES.EVT_WORKFLOW_CREATED, "workflow", "events", { id: created.id, name: created.name, triggerType: created.trigger.type }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<Workflow>): Promise<Workflow> {
    const updated = await getStorage().update<Workflow>(WF_COL, id, patch);
    eventBus.publish(EVENT_NAMES.EVT_WORKFLOW_UPDATED, "workflow", "events", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(WF_COL, id);
    eventBus.publish(EVENT_NAMES.EVT_WORKFLOW_DELETED, "workflow", "events", { id }).catch(() => {});
  },
};

export const executionService = {
  async list(): Promise<WorkflowExecution[]> { return getStorage().findAll<WorkflowExecution>(EXEC_COL); },
  async get(id: string): Promise<WorkflowExecution | null> { return getStorage().find<WorkflowExecution>(EXEC_COL, id); },
  async update(id: string, patch: Partial<WorkflowExecution>): Promise<WorkflowExecution> { return getStorage().update<WorkflowExecution>(EXEC_COL, id, patch); },
};

export const workflowHistoryService = {
  async list(workflowId?: string): Promise<WorkflowHistory[]> {
    const all = await getStorage().findAll<WorkflowHistory>(HIST_COL);
    return workflowId ? all.filter((h) => h.workflowId === workflowId) : all;
  },
  async create(data: Omit<WorkflowHistory, "id">): Promise<WorkflowHistory> { return getStorage().create<WorkflowHistory>(HIST_COL, data); },
};

/* ───── Helpers ───── */

export async function addWorkflowHistory(
  workflowId: string, executionId: string | null, event: string, description: string, metadata: Record<string, unknown> = {},
): Promise<WorkflowHistory> {
  return workflowHistoryService.create({
    workflowId, executionId, event, description, metadata, createdAt: new Date().toISOString(),
  });
}

export async function publishWorkflowEvent(
  name: string, category: EventCategory, source: string,
  payload: Record<string, unknown> = {},
  options?: { userId?: string; companyId?: string },
): Promise<PlatformEvent> {
  return eventBus.publish(name, category, source, payload, options);
}

export async function retryExecution(id: string): Promise<WorkflowExecution> {
  const exec = await executionService.get(id);
  if (!exec) throw new Error("Execution not found");
  if (exec.status !== "failed") throw new Error("Only failed executions can be retried");

  await addWorkflowHistory(exec.workflowId, exec.id, "workflow-retry",
    `Reprocessando execução do workflow ${exec.workflowName}`, {});

  return executionService.update(id, {
    status: "running", error: null, attempts: exec.attempts + 1,
    startedAt: new Date().toISOString(),
  });
}

export const EVENT_NAMES = {
  /* Document */
  DOCUMENT_CREATED: "document.created",
  DOCUMENT_UPDATED: "document.updated",
  DOCUMENT_DELETED: "document.deleted",
  DOCUMENT_GENERATED: "document.generated",
  DOCUMENT_ARCHIVED: "document.archived",
  DOCUMENT_RESTORED: "document.restored",
  DOCUMENT_SIGNED: "document.signed",
  DOCUMENT_TEMPLATE_CREATED: "document.template.created",
  DOCUMENT_TEMPLATE_UPDATED: "document.template.updated",
  DOCUMENT_TEMPLATE_DELETED: "document.template.deleted",
  DOCUMENT_TEMPLATE_PUBLISHED: "document.template.published",
  DOCUMENT_TEMPLATE_ARCHIVED: "document.template.archived",
  DOCUMENT_TEMPLATE_RESTORED: "document.template.restored",
  DOCUMENT_TEMPLATE_DUPLICATED: "document.template.duplicated",

  /* Communication */
  MESSAGE_SENT: "message.sent",
  MESSAGE_CANCELLED: "message.cancelled",
  MESSAGE_RETRIED: "message.retried",
  MESSAGE_FAILED: "message.failed",
  MESSAGE_CREATED: "message.created",
  MESSAGE_UPDATED: "message.updated",
  MESSAGE_DELETED: "message.deleted",
  COMM_TEMPLATE_CREATED: "communication.template.created",
  COMM_TEMPLATE_UPDATED: "communication.template.updated",
  COMM_TEMPLATE_DELETED: "communication.template.deleted",
  COMM_RULE_CREATED: "communication.rule.created",
  COMM_RULE_UPDATED: "communication.rule.updated",
  COMM_RULE_DELETED: "communication.rule.deleted",
  COMM_SCHEDULE_CREATED: "communication.schedule.created",
  COMM_SCHEDULE_UPDATED: "communication.schedule.updated",
  COMM_SCHEDULE_DELETED: "communication.schedule.deleted",
  COMM_INBOX_NEW: "communication.inbox.new",
  COMM_INBOX_READ: "communication.inbox.read",
  COMM_PREFERENCES_UPDATED: "communication.preferences.updated",
  COMM_COMPANY_PREFERENCES_UPDATED: "communication.company.preferences.updated",

  /* Admin */
  ADMIN_USER_CREATED: "admin.user.created",
  ADMIN_USER_UPDATED: "admin.user.updated",
  ADMIN_USER_DELETED: "admin.user.deleted",
  ADMIN_ROLE_CREATED: "admin.role.created",
  ADMIN_ROLE_UPDATED: "admin.role.updated",
  ADMIN_ROLE_DELETED: "admin.role.deleted",
  ADMIN_CONFIG_UPDATED: "admin.config.updated",
  ADMIN_IMPERSONATION_STARTED: "admin.impersonation.started",
  ADMIN_IMPERSONATION_ENDED: "admin.impersonation.ended",
  ADMIN_GROUP_CREATED: "admin.group.created",
  ADMIN_GROUP_UPDATED: "admin.group.updated",
  ADMIN_GROUP_DELETED: "admin.group.deleted",
  ADMIN_POLICY_CREATED: "admin.policy.created",
  ADMIN_POLICY_UPDATED: "admin.policy.updated",
  ADMIN_POLICY_DELETED: "admin.policy.deleted",
  ADMIN_FEATURE_FLAG_CREATED: "admin.feature.flag.created",
  ADMIN_FEATURE_FLAG_UPDATED: "admin.feature.flag.updated",
  ADMIN_FEATURE_FLAG_DELETED: "admin.feature.flag.deleted",
  ADMIN_THEME_CREATED: "admin.theme.created",
  ADMIN_THEME_UPDATED: "admin.theme.updated",
  ADMIN_THEME_DELETED: "admin.theme.deleted",
  ADMIN_LANGUAGE_CREATED: "admin.language.created",
  ADMIN_LANGUAGE_UPDATED: "admin.language.updated",
  ADMIN_LANGUAGE_DELETED: "admin.language.deleted",
  ADMIN_PROVIDER_CREATED: "admin.provider.created",
  ADMIN_PROVIDER_UPDATED: "admin.provider.updated",
  ADMIN_PROVIDER_DELETED: "admin.provider.deleted",
  ADMIN_DATASOURCE_CREATED: "admin.datasource.created",
  ADMIN_DATASOURCE_UPDATED: "admin.datasource.updated",
  ADMIN_DATASOURCE_DELETED: "admin.datasource.deleted",
  ADMIN_BACKUP_CREATED: "admin.backup.created",
  ADMIN_BACKUP_UPDATED: "admin.backup.updated",
  ADMIN_BACKUP_RESTORED: "admin.backup.restored",
  ADMIN_HEALTH_CHECKED: "admin.health.checked",
  ADMIN_JOB_CREATED: "admin.job.created",
  ADMIN_JOB_UPDATED: "admin.job.updated",
  ADMIN_JOB_DELETED: "admin.job.deleted",
  ADMIN_SCHEDULE_CREATED: "admin.schedule.created",
  ADMIN_SCHEDULE_UPDATED: "admin.schedule.updated",
  ADMIN_SCHEDULE_DELETED: "admin.schedule.deleted",

  /* Demo Environment */
  ADMIN_DEMO_RESTORED: "demo-env.restored",
  ADMIN_DEMO_CLEANED: "demo-env.cleaned",
  ADMIN_DEMO_GENERATED: "demo-env.generated",
  ADMIN_DEMO_IMPORTED: "demo-env.imported",
  ADMIN_DEMO_EXPORTED: "demo-env.exported",
  DEMO_SEED_EXECUTED: "demo-env.seed.executed",

  ADMIN_MAINTENANCE_UPDATED: "admin.maintenance.updated",
  ADMIN_ENV_CREATED: "admin.env.created",
  ADMIN_ENV_UPDATED: "admin.env.updated",
  ADMIN_ENV_DELETED: "admin.env.deleted",
  ADMIN_SECRET_CREATED: "admin.secret.created",
  ADMIN_SECRET_UPDATED: "admin.secret.updated",
  ADMIN_SECRET_DELETED: "admin.secret.deleted",
  ADMIN_MONITORING_CREATED: "admin.monitoring.created",
  ADMIN_MONITORING_RESOLVED: "admin.monitoring.resolved",
  ADMIN_LICENSE_CREATED: "admin.license.created",
  ADMIN_LICENSE_UPDATED: "admin.license.updated",

  /* Company */
  COMPANY_CREATED: "company.created",
  COMPANY_UPDATED: "company.updated",
  COMPANY_DELETED: "company.deleted",

  /* Metadata */
  METADATA_ENTITY_CREATED: "metadata.entity.created",
  METADATA_ENTITY_UPDATED: "metadata.entity.updated",
  METADATA_ENTITY_DELETED: "metadata.entity.deleted",
  METADATA_FIELD_CREATED: "metadata.field.created",
  METADATA_FIELD_UPDATED: "metadata.field.updated",
  METADATA_FIELD_DELETED: "metadata.field.deleted",
  METADATA_FORM_CREATED: "metadata.form.created",
  METADATA_FORM_UPDATED: "metadata.form.updated",
  METADATA_FORM_DELETED: "metadata.form.deleted",
  METADATA_VIEW_CREATED: "metadata.view.created",
  METADATA_VIEW_UPDATED: "metadata.view.updated",
  METADATA_VIEW_DELETED: "metadata.view.deleted",
  METADATA_DASHBOARD_CREATED: "metadata.dashboard.created",
  METADATA_DASHBOARD_UPDATED: "metadata.dashboard.updated",
  METADATA_DASHBOARD_DELETED: "metadata.dashboard.deleted",
  METADATA_TEMPLATE_CREATED: "metadata.template.created",
  METADATA_TEMPLATE_UPDATED: "metadata.template.updated",
  METADATA_TEMPLATE_DELETED: "metadata.template.deleted",
  METADATA_CONFIG_UPDATED: "metadata.config.updated",
  METADATA_PUBLISHED: "metadata.published",

  /* Database */
  DATABASE_CONNECTION_CREATED: "database.connection.created",
  DATABASE_CONNECTION_UPDATED: "database.connection.updated",
  DATABASE_CONNECTION_DELETED: "database.connection.deleted",
  DATABASE_CONNECTION_ACTIVATED: "database.connection.activated",

  /* Events Module */
  EVT_SUBSCRIBER_CREATED: "events.subscriber.created",
  EVT_SUBSCRIBER_UPDATED: "events.subscriber.updated",
  EVT_SUBSCRIBER_DELETED: "events.subscriber.deleted",
  EVT_WORKFLOW_CREATED: "events.workflow.created",
  EVT_WORKFLOW_UPDATED: "events.workflow.updated",
  EVT_WORKFLOW_DELETED: "events.workflow.deleted",

  /* Core */
  WORKFLOW_TRIGGERED: "workflow.triggered",
  SYSTEM_STARTUP: "system.startup",
  SYSTEM_SHUTDOWN: "system.shutdown",
  USER_LOGIN: "user.login",
  USER_LOGOUT: "user.logout",
  AUDIT_CREATED: "audit.created",
  SCHEDULE_TRIGGERED: "schedule.triggered",
  REPORT_EXECUTED: "report.executed",
  REPORT_EXPORTED: "report.exported",

  /* Customers */
  CUSTOMER_CREATED: "customer.created",
  CUSTOMER_UPDATED: "customer.updated",
  CUSTOMER_DELETED: "customer.deleted",
  CUSTOMER_RESTORED: "customer.restored",
  CUSTOMER_MERGED: "customer.merged",
  CUSTOMER_COPIED: "customer.copied",
  CUSTOMER_MIGRATED: "customer.migrated",
  CUSTOMER_LINKED: "customer.linked",
  CUSTOMER_UNLINKED: "customer.unlinked",
  CUSTOMER_DUPLICITY_DETECTED: "customer.duplicity.detected",
  CUSTOMER_SHARED: "customer.shared",
  CUSTOMER_IMPORTED: "customer.imported",
  CUSTOMER_EXPORTED: "customer.exported",
  CUSTOMER_LINKED_TO_COMPANY: "customer.linkedToCompany",
  CUSTOMER_UNLINKED_FROM_COMPANY: "customer.unlinkedFromCompany",
  CUSTOMER_OBSERVATION_ADDED: "customer.observation.added",
  CUSTOMER_ATTACHMENT_ADDED: "customer.attachment.added",
  CUSTOMER_COMMUNICATION_SENT: "customer.communication.sent",
  CUSTOMER_RELATIONSHIP_LINKED: "customer.relationship.linked",
  CUSTOMER_RELATIONSHIP_UNLINKED: "customer.relationship.unlinked",

  /* Devices */
  DEVICE_CREATED: "device.created",
  DEVICE_UPDATED: "device.updated",
  DEVICE_DELETED: "device.deleted",
  DEVICE_RESTORED: "device.restored",

  /* Asset Management */
  ASSET_CREATED: "asset.created",
  ASSET_UPDATED: "asset.updated",
  ASSET_DELETED: "asset.deleted",
  ASSET_TRANSFERRED: "asset.transferred",
  ASSET_PHOTO_UPLOADED: "asset.photo.uploaded",
  ASSET_DOCUMENT_ATTACHED: "asset.document.attached",
  ASSET_IMPORTED: "asset.imported",
  ASSET_EXPORTED: "asset.exported",

  /* Technicians */
  TECHNICIAN_CREATED: "technician.created",
  TECHNICIAN_UPDATED: "technician.updated",
  TECHNICIAN_DELETED: "technician.deleted",

  /* Manufacturers */
  MANUFACTURER_CREATED: "manufacturer.created",
  MANUFACTURER_UPDATED: "manufacturer.updated",
  MANUFACTURER_DELETED: "manufacturer.deleted",

  /* Brands */
  BRAND_CREATED: "brand.created",
  BRAND_UPDATED: "brand.updated",
  BRAND_DELETED: "brand.deleted",

  /* Models */
  MODEL_CREATED: "model.created",
  MODEL_UPDATED: "model.updated",
  MODEL_DELETED: "model.deleted",

  /* Categories */
  CATEGORY_CREATED: "category.created",
  CATEGORY_UPDATED: "category.updated",
  CATEGORY_DELETED: "category.deleted",

  /* Equipment Types */
  EQUIPMENT_TYPE_CREATED: "equipment_type.created",
  EQUIPMENT_TYPE_UPDATED: "equipment_type.updated",
  EQUIPMENT_TYPE_DELETED: "equipment_type.deleted",

  /* Defects */
  DEFECT_CREATED: "defect.created",
  DEFECT_UPDATED: "defect.updated",
  DEFECT_DELETED: "defect.deleted",

  /* Services */
  SERVICE_CREATED: "service.created",
  SERVICE_UPDATED: "service.updated",
  SERVICE_DELETED: "service.deleted",

  /* Parts */
  PART_CREATED: "part.created",
  PART_UPDATED: "part.updated",
  PART_DELETED: "part.deleted",

  /* Suppliers */
  SUPPLIER_CREATED: "supplier.created",
  SUPPLIER_UPDATED: "supplier.updated",
  SUPPLIER_DELETED: "supplier.deleted",

  /* Payment Methods */
  PAYMENT_METHOD_CREATED: "payment.method.created",
  PAYMENT_METHOD_UPDATED: "payment.method.updated",
  PAYMENT_METHOD_DELETED: "payment.method.deleted",

  /* Payment Terms */
  PAYMENT_TERM_CREATED: "payment.term.created",
  PAYMENT_TERM_UPDATED: "payment.term.updated",
  PAYMENT_TERM_DELETED: "payment.term.deleted",

  /* Warranties */
  WARRANTY_CREATED: "warranty.created",
  WARRANTY_UPDATED: "warranty.updated",
  WARRANTY_DELETED: "warranty.deleted",

  /* Measurement Units */
  MEASUREMENT_UNIT_CREATED: "measurement.unit.created",
  MEASUREMENT_UNIT_UPDATED: "measurement.unit.updated",
  MEASUREMENT_UNIT_DELETED: "measurement.unit.deleted",

  /* Service Orders */
  SERVICE_ORDER_CREATED: "service-order.created",
  SERVICE_ORDER_UPDATED: "service-order.updated",
  SERVICE_ORDER_DELETED: "service-order.deleted",
  SERVICE_ORDER_STATUS_CHANGED: "service-order.status.changed",
  SERVICE_ORDER_ASSIGNED: "service-order.assigned",
  SERVICE_ORDER_COMMENT_ADDED: "service-order.comment.added",
  SERVICE_ORDER_ATTACHMENT_ADDED: "service-order.attachment.added",
  SERVICE_ORDER_DOCUMENT_GENERATED: "service-order.document.generated",
  SERVICE_ORDER_REOPENED: "service-order.reopened",
  SERVICE_ORDER_DIAGNOSTIC_CREATED: "service-order.diagnostic.created",
  SERVICE_ORDER_DIAGNOSTIC_UPDATED: "service-order.diagnostic.updated",
  SERVICE_ORDER_CHECKLIST_COMPLETED: "service-order.checklist.completed",
  SERVICE_ORDER_EXECUTION_STARTED: "service-order.execution.started",
  SERVICE_ORDER_EXECUTION_PAUSED: "service-order.execution.paused",
  SERVICE_ORDER_EXECUTION_RESUMED: "service-order.execution.resumed",
  SERVICE_ORDER_EXECUTION_COMPLETED: "service-order.execution.completed",
  SERVICE_ORDER_EXECUTION_ACTIVITY_CREATED: "service-order.execution.activity.created",
  SERVICE_ORDER_EXECUTION_ACTIVITY_UPDATED: "service-order.execution.activity.updated",
  SERVICE_ORDER_EXECUTION_ACTIVITY_CANCELLED: "service-order.execution.activity.cancelled",
  SERVICE_ORDER_SERVICE_ADDED: "service-order.service.added",
  SERVICE_ORDER_SERVICE_REMOVED: "service-order.service.removed",
  SERVICE_ORDER_PART_ADDED: "service-order.part.added",
  SERVICE_ORDER_PART_REMOVED: "service-order.part.removed",
  SERVICE_ORDER_WARRANTY_CREATED: "service-order.warranty.created",
  SERVICE_ORDER_WARRANTY_UPDATED: "service-order.warranty.updated",
  SERVICE_ORDER_WARRANTY_EXPIRED: "service-order.warranty.expired",
  SERVICE_ORDER_RETURN_CREATED: "service-order.return.created",
  SERVICE_ORDER_RETURN_UPDATED: "service-order.return.updated",
  SERVICE_ORDER_PHOTO_ADDED: "service-order.photo.added",
  SERVICE_ORDER_PHOTO_REMOVED: "service-order.photo.removed",
  SERVICE_ORDER_TIMELINE_CREATED: "service-order.timeline.created",
  SERVICE_ORDER_TECHNICIAN_DASHBOARD_UPDATED: "service-order.technician.dashboard.updated",
  SERVICE_ORDER_BUDGET_CREATED: "service-order.budget.created",
  SERVICE_ORDER_BUDGET_UPDATED: "service-order.budget.updated",
  SERVICE_ORDER_BUDGET_APPROVED: "service-order.budget.approved",
  SERVICE_ORDER_BUDGET_REJECTED: "service-order.budget.rejected",
  SERVICE_ORDER_TEST_CREATED: "service-order.test.created",
  SERVICE_ORDER_TEST_COMPLETED: "service-order.test.completed",
  SERVICE_ORDER_QUALITY_CREATED: "service-order.quality.created",
  SERVICE_ORDER_QUALITY_APPROVED: "service-order.quality.approved",
  SERVICE_ORDER_QUALITY_REJECTED: "service-order.quality.rejected",
  SERVICE_ORDER_COSTS_CALCULATED: "service-order.costs.calculated",
  SERVICE_ORDER_COSTS_UPDATED: "service-order.costs.updated",
  SERVICE_ORDER_ANALYTICS_GENERATED: "service-order.analytics.generated",
  SERVICE_ORDER_PAYMENT_CREATED: "service-order.payment.created",
  SERVICE_ORDER_PAYMENT_CONFIRMED: "service-order.payment.confirmed",
  SERVICE_ORDER_RECEIPT_GENERATED: "service-order.receipt.generated",
  SERVICE_ORDER_SIGNATURE_COLLECTED: "service-order.signature.collected",
  SERVICE_ORDER_DELIVERY_COMPLETED: "service-order.delivery.completed",
  SERVICE_ORDER_CLOSED: "service-order.closed",
  SERVICE_ORDER_CANCELLED: "service-order.cancelled",
  SERVICE_ORDER_DELIVERED: "service-order.delivered",
  SERVICE_ORDER_RETURNED: "service-order.returned",

  /* Knowledge Platform (9 events) */
  KNOWLEDGE_CREATED: "knowledge.created",
  KNOWLEDGE_UPDATED: "knowledge.updated",
  KNOWLEDGE_PUBLISHED: "knowledge.published",
  KNOWLEDGE_ARCHIVED: "knowledge.archived",
  KNOWLEDGE_VERSION_CREATED: "knowledge.version.created",
  KNOWLEDGE_IMPORTED: "knowledge.imported",
  KNOWLEDGE_EXPORTED: "knowledge.exported",
  KNOWLEDGE_LINKED: "knowledge.linked",
  KNOWLEDGE_INDEXED: "knowledge.indexed",

  /* AI Platform (26 events) */
  AI_PROCESSING_STARTED: "ai.processing.started",
  AI_PROCESSING_COMPLETED: "ai.processing.completed",
  AI_PROCESSING_FAILED: "ai.processing.failed",
  AI_PROVIDER_CREATED: "ai.provider.created",
  AI_PROVIDER_UPDATED: "ai.provider.updated",
  AI_PROVIDER_DELETED: "ai.provider.deleted",
  AI_PROVIDER_TESTED: "ai.provider.tested",
  PROMPT_CREATED: "ai.prompt.created",
  PROMPT_UPDATED: "ai.prompt.updated",
  PROMPT_DELETED: "ai.prompt.deleted",
  PROMPT_DUPLICATED: "ai.prompt.duplicated",
  PROMPT_ARCHIVED: "ai.prompt.archived",
  PROMPT_RESTORED: "ai.prompt.restored",
  PROMPT_PUBLISHED: "ai.prompt.published",
  OCR_PROCESSING_STARTED: "ai.ocr.processing.started",
  OCR_PROCESSING_COMPLETED: "ai.ocr.processing.completed",
  OCR_PROCESSING_FAILED: "ai.ocr.processing.failed",
  VISION_PROCESSING_STARTED: "ai.vision.processing.started",
  VISION_PROCESSING_COMPLETED: "ai.vision.processing.completed",
  VISION_PROCESSING_FAILED: "ai.vision.processing.failed",
  AI_QUEUE_ITEM_CREATED: "ai.queue.item.created",
  AI_QUEUE_ITEM_UPDATED: "ai.queue.item.updated",
  AI_HISTORY_CREATED: "ai.history.created",
  AI_CONFIG_UPDATED: "ai.config.updated",
  AI_CONFERENCE_STARTED: "ai.conference.started",
  AI_CONFERENCE_CONFIRMED: "ai.conference.confirmed",
  AI_CONFERENCE_REJECTED: "ai.conference.rejected",

  /* Inventory (14 events) */
  PRODUCT_CREATED: "inventory.product.created",
  PRODUCT_UPDATED: "inventory.product.updated",
  PRODUCT_DELETED: "inventory.product.deleted",
  WAREHOUSE_CREATED: "inventory.warehouse.created",
  WAREHOUSE_UPDATED: "inventory.warehouse.updated",
  WAREHOUSE_DELETED: "inventory.warehouse.deleted",
  STOCK_MOVEMENT_CREATED: "inventory.stock.movement.created",
  STOCK_ADJUSTMENT_CREATED: "inventory.stock.adjustment.created",
  STOCK_COUNT_CREATED: "inventory.stock.count.created",
  STOCK_COUNT_COMPLETED: "inventory.stock.count.completed",
  STOCK_ALERT_TRIGGERED: "inventory.stock.alert.triggered",
  TRANSFER_ORDER_CREATED: "inventory.transfer.order.created",
  TRANSFER_ORDER_COMPLETED: "inventory.transfer.order.completed",

  /* Purchasing (12 events) */
  PURCHASE_ORDER_CREATED: "purchasing.order.created",
  PURCHASE_ORDER_UPDATED: "purchasing.order.updated",
  PURCHASE_ORDER_SENT: "purchasing.order.sent",
  PURCHASE_ORDER_CONFIRMED: "purchasing.order.confirmed",
  PURCHASE_ORDER_RECEIVED: "purchasing.order.received",
  PURCHASE_ORDER_CANCELLED: "purchasing.order.cancelled",
  PURCHASE_SUPPLIER_CREATED: "purchasing.supplier.created",
  PURCHASE_SUPPLIER_UPDATED: "purchasing.supplier.updated",
  PURCHASE_SUPPLIER_DELETED: "purchasing.supplier.deleted",
  PURCHASE_RECEIVING_CREATED: "purchasing.receiving.created",
  PURCHASE_RECEIVING_COMPLETED: "purchasing.receiving.completed",

  /* Financial (18 events) */
  FINANCIAL_ACCOUNT_CREATED: "financial.account.created",
  FINANCIAL_ACCOUNT_UPDATED: "financial.account.updated",
  FINANCIAL_ACCOUNT_DELETED: "financial.account.deleted",
  COST_CENTER_CREATED: "financial.cost.center.created",
  COST_CENTER_UPDATED: "financial.cost.center.updated",
  COST_CENTER_DELETED: "financial.cost.center.deleted",
  ACCOUNT_PAYABLE_CREATED: "financial.payable.created",
  ACCOUNT_PAYABLE_UPDATED: "financial.payable.updated",
  ACCOUNT_PAYABLE_PAID: "financial.payable.paid",
  ACCOUNT_PAYABLE_CANCELLED: "financial.payable.cancelled",
  ACCOUNT_RECEIVABLE_CREATED: "financial.receivable.created",
  ACCOUNT_RECEIVABLE_UPDATED: "financial.receivable.updated",
  ACCOUNT_RECEIVABLE_RECEIVED: "financial.receivable.received",
  ACCOUNT_RECEIVABLE_CANCELLED: "financial.receivable.cancelled",
  FINANCIAL_TRANSACTION_CREATED: "financial.transaction.created",
  INVOICE_CREATED: "financial.invoice.created",
  INVOICE_ISSUED: "financial.invoice.issued",
  INVOICE_CANCELLED: "financial.invoice.cancelled",

  /* ERP (8 events) */
  ERP_COMPANY_CREATED: "erp.company.created",
  ERP_COMPANY_UPDATED: "erp.company.updated",
  ERP_COMPANY_DELETED: "erp.company.deleted",
  ERP_DEPARTMENT_CREATED: "erp.department.created",
  ERP_DEPARTMENT_UPDATED: "erp.department.updated",
  ERP_CONTRACT_CREATED: "erp.contract.created",
  ERP_CONTRACT_UPDATED: "erp.contract.updated",
  ERP_RULE_UPDATED: "erp.rule.updated",

  /* HR (10 events) */
  HR_EMPLOYEE_CREATED: "hr.employee.created",
  HR_EMPLOYEE_UPDATED: "hr.employee.updated",
  HR_EMPLOYEE_DELETED: "hr.employee.deleted",
  HR_TIMESHEET_CREATED: "hr.timesheet.created",
  HR_TIMESHEET_UPDATED: "hr.timesheet.updated",
  HR_PAYROLL_CREATED: "hr.payroll.created",
  HR_PAYROLL_UPDATED: "hr.payroll.updated",
  HR_COMMISSION_CREATED: "hr.commission.created",
  HR_COMMISSION_UPDATED: "hr.commission.updated",
  HR_SHIFT_UPDATED: "hr.shift.updated",

  /* CRM (10 events) */
  CRM_LEAD_CREATED: "crm.lead.created",
  CRM_LEAD_UPDATED: "crm.lead.updated",
  CRM_LEAD_DELETED: "crm.lead.deleted",
  CRM_OPPORTUNITY_CREATED: "crm.opportunity.created",
  CRM_OPPORTUNITY_UPDATED: "crm.opportunity.updated",
  CRM_OPPORTUNITY_DELETED: "crm.opportunity.deleted",
  CRM_AGREEMENT_CREATED: "crm.agreement.created",
  CRM_AGREEMENT_UPDATED: "crm.agreement.updated",
  CRM_CAMPAIGN_CREATED: "crm.campaign.created",
  CRM_CAMPAIGN_UPDATED: "crm.campaign.updated",

  /* Reporting / BI (11 events) */
  REPORT_CREATED: "rpt.report.created",
  REPORT_UPDATED: "rpt.report.updated",
  REPORT_DELETED: "rpt.report.deleted",
  EXECUTION_COMPLETED: "rpt.execution.completed",
  KPI_CREATED: "rpt.kpi.created",
  KPI_UPDATED: "rpt.kpi.updated",
  KPI_DELETED: "rpt.kpi.deleted",
  DASHBOARD_CREATED: "rpt.dashboard.created",
  DASHBOARD_UPDATED: "rpt.dashboard.updated",
  DASHBOARD_DELETED: "rpt.dashboard.deleted",
  EXPORT_CREATED: "rpt.export.created",

  /* Reporting / BI Platform */
  RPT_DASHBOARD_CREATED: "rpt.dashboard.created",
  RPT_DASHBOARD_UPDATED: "rpt.dashboard.updated",
  RPT_DASHBOARD_DELETED: "rpt.dashboard.deleted",
  RPT_DASHBOARD_SHARED: "rpt.dashboard.shared",
  RPT_WIDGET_CREATED: "rpt.widget.created",
  RPT_WIDGET_UPDATED: "rpt.widget.updated",
  RPT_WIDGET_DELETED: "rpt.widget.deleted",
  RPT_REPORT_CREATED: "rpt.report.created",
  RPT_REPORT_UPDATED: "rpt.report.updated",
  RPT_REPORT_DELETED: "rpt.report.deleted",
  RPT_REPORT_EXECUTED: "rpt.report.executed",
  RPT_REPORT_EXPORTED: "rpt.report.exported",
  RPT_TEMPLATE_CREATED: "rpt.template.created",
  RPT_TEMPLATE_UPDATED: "rpt.template.updated",
  RPT_TEMPLATE_DELETED: "rpt.template.deleted",
  RPT_TEMPLATE_PUBLISHED: "rpt.template.published",
  RPT_DATASET_CREATED: "rpt.dataset.created",
  RPT_DATASET_UPDATED: "rpt.dataset.updated",
  RPT_DATASET_DELETED: "rpt.dataset.deleted",
  RPT_DATASET_EXECUTED: "rpt.dataset.executed",
  RPT_KPI_CREATED: "rpt.kpi.created",
  RPT_KPI_UPDATED: "rpt.kpi.updated",
  RPT_KPI_DELETED: "rpt.kpi.deleted",

  /* Automation Platform (22 events) */
  AUT_WORKFLOW_CREATED: "automation.workflow.created",
  AUT_WORKFLOW_UPDATED: "automation.workflow.updated",
  AUT_WORKFLOW_DELETED: "automation.workflow.deleted",
  AUT_WORKFLOW_EXECUTED: "automation.workflow.executed",
  AUT_WORKFLOW_COMPLETED: "automation.workflow.completed",
  AUT_WORKFLOW_FAILED: "automation.workflow.failed",
  AUT_TEMPLATE_CREATED: "automation.template.created",
  AUT_TEMPLATE_UPDATED: "automation.template.updated",
  AUT_TEMPLATE_DELETED: "automation.template.deleted",
  AUT_RULE_CREATED: "automation.rule.created",
  AUT_RULE_UPDATED: "automation.rule.updated",
  AUT_RULE_DELETED: "automation.rule.deleted",
  AUT_RULE_EXECUTED: "automation.rule.executed",
  AUT_STATE_MACHINE_CREATED: "automation.state.machine.created",
  AUT_STATE_MACHINE_UPDATED: "automation.state.machine.updated",
  AUT_STATE_MACHINE_DELETED: "automation.state.machine.deleted",
  AUT_STATE_CHANGED: "automation.state.changed",
  AUT_APPROVAL_STARTED: "automation.approval.started",
  AUT_APPROVAL_COMPLETED: "automation.approval.completed",
  AUT_JOB_EXECUTED: "automation.job.executed",
  AUT_SCHEDULER_EXECUTED: "automation.scheduler.executed",
  AUT_SLA_VIOLATED: "automation.sla.violated",

  /* Public Portal (10 events) */
  PORTAL_ACCESSED: "portal.accessed",
  PORTAL_DOCUMENT_DOWNLOADED: "portal.document.downloaded",
  PORTAL_FILE_UPLOADED: "portal.file.uploaded",
  PORTAL_APPROVAL_ACCEPTED: "portal.approval.accepted",
  PORTAL_APPROVAL_REJECTED: "portal.approval.rejected",
  PORTAL_SIGNATURE_COMPLETED: "portal.signature.completed",
  PORTAL_LINK_GENERATED: "portal.link.generated",
  PORTAL_LINK_EXPIRED: "portal.link.expired",
  PORTAL_LINK_REVOKED: "portal.link.revoked",
  PORTAL_GUARANTEE_REQUESTED: "portal.guarantee.requested",

  /* Integration Platform (14 events) */
  CONNECTOR_CREATED: "integration.connector.created",
  CONNECTOR_UPDATED: "integration.connector.updated",
  CONNECTOR_DELETED: "integration.connector.deleted",
  CONNECTION_TESTED: "integration.connection.tested",
  WEBHOOK_CREATED: "integration.webhook.created",
  WEBHOOK_DELETED: "integration.webhook.deleted",
  WEBHOOK_PROCESSED: "integration.webhook.processed",
  WEBHOOK_RECEIVED: "integration.webhook.received",
  SYNC_STARTED: "integration.sync.started",
  SYNC_COMPLETED: "integration.sync.completed",
  SYNC_FAILED: "integration.sync.failed",
  API_REQUESTED: "integration.api.requested",
  API_COMPLETED: "integration.api.completed",
  INTEGRATION_HEALTH_CHECKED: "integration.health.checked",
};
