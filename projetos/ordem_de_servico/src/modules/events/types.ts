export type EventCategory =
  | "system" | "user" | "company" | "document" | "communication"
  | "workflow" | "financial" | "inventory" | "service-order" | "audit" | "ai"
  | "entity" | "integration" | "automation" | "report" | "knowledge" | "purchasing"
  | "crm" | "hr" | "erp" | "portal" | "metadata" | "storage" | "security";

export const EVENT_CATEGORIES: EventCategory[] = [
  "system", "user", "company", "document", "communication",
  "workflow", "financial", "inventory", "service-order", "audit", "ai",
  "entity", "integration", "automation", "report", "knowledge", "purchasing",
  "crm", "hr", "erp", "portal", "metadata", "storage", "security",
];

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  system: "Sistema", user: "Usuário", company: "Empresa", document: "Documento",
  communication: "Comunicação", workflow: "Workflow", financial: "Financeiro",
  inventory: "Estoque", "service-order": "Ordem de Serviço", audit: "Auditoria", ai: "IA",
  entity: "Cadastro", integration: "Integração", automation: "Automação", report: "Relatório",
  knowledge: "Conhecimento", purchasing: "Compras", crm: "CRM", hr: "RH", erp: "ERP",
  portal: "Portal", metadata: "Metadados", storage: "Armazenamento", security: "Segurança",
};

export type EventStatus = "created" | "processing" | "completed" | "failed" | "retrying";

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  created: "Criado", processing: "Processando", completed: "Concluído",
  failed: "Falhou", retrying: "Tentando Novamente",
};

export type TriggerType =
  | "event" | "manual" | "schedule" | "field-change"
  | "creation" | "update" | "deletion" | "import" | "export";

export const TRIGGER_TYPE_LABELS: Record<TriggerType, string> = {
  event: "Evento", manual: "Manual", schedule: "Agendamento",
  "field-change": "Mudança de Campo", creation: "Criação",
  update: "Atualização", deletion: "Exclusão", import: "Importação", export: "Exportação",
};

export type WorkflowStatus = "draft" | "published" | "archived" | "disabled";

export type ActionType =
  | "create-document" | "send-communication" | "update-record"
  | "create-event" | "execute-script" | "add-timeline"
  | "create-audit" | "create-notification" | "update-status"
  | "wait" | "end";

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  "create-document": "Criar Documento", "send-communication": "Enviar Comunicação",
  "update-record": "Atualizar Registro", "create-event": "Criar Evento",
  "execute-script": "Executar Script", "add-timeline": "Adicionar Timeline",
  "create-audit": "Criar Auditoria", "create-notification": "Criar Notificação",
  "update-status": "Atualizar Status", wait: "Esperar", end: "Fim",
};

export type Operator =
  | "=" | "!=" | ">" | "<" | ">=" | "<=" | "contains"
  | "not-contains" | "is-empty" | "not-empty" | "between" | "in" | "not-in";

export const OPERATOR_LABELS: Record<Operator, string> = {
  "=": "Igual a", "!=": "Diferente de", ">": "Maior que", "<": "Menor que",
  ">=": "Maior ou igual", "<=": "Menor ou igual", contains: "Contém",
  "not-contains": "Não contém", "is-empty": "Está vazio",
  "not-empty": "Não está vazio", between: "Entre", in: "EM", "not-in": "NÃO EM",
};

export type RecurrenceType = "once" | "daily" | "weekly" | "monthly" | "yearly" | "cron";

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  once: "Uma vez", daily: "Diário", weekly: "Semanal",
  monthly: "Mensal", yearly: "Anual", cron: "Cron",
};

export type ExecutionStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export const EXECUTION_STATUS_LABELS: Record<ExecutionStatus, string> = {
  pending: "Pendente", running: "Executando", completed: "Concluído",
  failed: "Falhou", cancelled: "Cancelado",
};

export interface PlatformEvent {
  id: string;
  name: string;
  category: EventCategory;
  source: string;
  companyId: string | null;
  userId: string | null;
  createdAt: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  version: number;
  status: EventStatus;
  correlationId: string | null;
  causationId: string | null;
  priority: number;
}

export interface EventStoreEntry {
  id: string;
  eventId: string;
  eventName: string;
  category: EventCategory;
  source: string;
  payload: Record<string, unknown>;
  createdAt: string;
  duration: number | null;
  result: string | null;
  status: EventStatus;
  userId: string | null;
  companyId: string | null;
  attempts: number;
  error: string | null;
}

export interface Subscriber {
  id: string;
  moduleName: string;
  eventName: string;
  handler: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TriggerConfig {
  type: TriggerType;
  eventName?: string;
  schedule?: ScheduleConfig;
  fieldEntity?: string;
  fieldName?: string;
}

export interface ScheduleConfig {
  recurrence: RecurrenceType;
  cronExpression?: string;
  startAt?: string;
  endAt?: string;
  dayOfWeek?: number[];
  dayOfMonth?: number;
}

export interface Condition {
  field: string;
  operator: Operator;
  value: string;
}

export interface Action {
  type: ActionType;
  config: Record<string, unknown>;
  order: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: EventCategory;
  trigger: TriggerConfig;
  conditions: Condition[];
  actions: Action[];
  status: WorkflowStatus;
  version: number;
  companyId: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  triggerEventId: string | null;
  status: ExecutionStatus;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  nextAttempt: string | null;
  companyId: string | null;
  actionsResults: Record<string, unknown>;
}

export interface WorkflowHistory {
  id: string;
  workflowId: string;
  executionId: string | null;
  event: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export const DEFAULT_SUBSCRIBERS: Omit<Subscriber, "id" | "createdAt" | "updatedAt">[] = [
  { moduleName: "Document Platform", eventName: "document.generate", handler: "documentService.create", description: "Gera um novo documento", active: true },
  { moduleName: "Document Platform", eventName: "document.archive", handler: "documentService.update", description: "Arquiva um documento", active: true },
  { moduleName: "Communication Platform", eventName: "message.send", handler: "messageService.create", description: "Envia uma mensagem", active: true },
  { moduleName: "Communication Platform", eventName: "message.cancel", handler: "messageService.update", description: "Cancela uma mensagem", active: true },
  { moduleName: "Audit Service", eventName: "*", handler: "auditService.create", description: "Registra todos os eventos na auditoria", active: true },
  { moduleName: "Core Platform", eventName: "system.startup", handler: "system.init", description: "Inicializa o sistema", active: true },
  { moduleName: "Core Platform", eventName: "system.shutdown", handler: "system.cleanup", description: "Limpeza do sistema", active: true },
  { moduleName: "Communication Platform", eventName: "notification.create", handler: "notificationService.create", description: "Cria notificação interna", active: true },
  { moduleName: "Metadata Platform", eventName: "entity.updated", handler: "metadataService.update", description: "Atualiza entidade de metadados", active: true },
  { moduleName: "Workflow Engine", eventName: "workflow.triggered", handler: "workflowExecutor.execute", description: "Executa workflow quando acionado", active: true },
];
