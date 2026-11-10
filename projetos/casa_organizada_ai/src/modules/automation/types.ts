export type TriggerType = 'task_created' | 'task_completed' | 'form_submitted' | 'form_created' | 'form_shared' | 'calendar_event' | 'specific_date' | 'specific_time' | 'recurrence' | 'webhook';
export type ActionType = 'create_task' | 'update_task' | 'complete_task' | 'move_form' | 'send_notification' | 'create_event' | 'duplicate_form' | 'generate_pdf' | 'call_ai' | 'log_audit' | 'webhook';

export interface Automation {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  version: number;
  config: Record<string, unknown>;
  lastRunAt: string | null;
  runCount: number;
  errorCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationTrigger {
  id: string;
  automationId: string;
  triggerType: TriggerType;
  config: Record<string, unknown>;
  sort: number;
}

export interface AutomationCondition {
  id: string;
  automationId: string;
  operator: 'and' | 'or' | 'not';
  conditions: ConditionRule[];
  sort: number;
}

export interface ConditionRule {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'startsWith' | 'endsWith' | 'empty' | 'notEmpty';
  value?: unknown;
}

export interface AutomationAction {
  id: string;
  automationId: string;
  actionType: ActionType;
  config: Record<string, unknown>;
  sort: number;
}

export interface AutomationLog {
  id: string;
  automationId: string;
  status: 'running' | 'success' | 'error' | 'skipped';
  triggerData: Record<string, unknown>;
  result: Record<string, unknown>;
  errorMessage: string | null;
  executionTimeMs: number | null;
  createdAt: string;
}

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  task_created: 'Tarefa criada',
  task_completed: 'Tarefa concluída',
  form_submitted: 'Formulário enviado',
  form_created: 'Planejamento criado',
  form_shared: 'Planejamento compartilhado',
  calendar_event: 'Evento do calendário',
  specific_date: 'Data específica',
  specific_time: 'Horário específico',
  recurrence: 'Recorrência',
  webhook: 'Webhook externo',
};

export const ACTION_LABELS: Record<ActionType, string> = {
  create_task: 'Criar tarefa',
  update_task: 'Atualizar tarefa',
  complete_task: 'Concluir tarefa',
  move_form: 'Mover planejamento',
  send_notification: 'Enviar notificação',
  create_event: 'Criar evento',
  duplicate_form: 'Duplicar formulário',
  generate_pdf: 'Gerar PDF',
  call_ai: 'Chamar IA',
  log_audit: 'Registrar auditoria',
  webhook: 'Webhook',
};

export const CONDITION_OPERATORS = [
  { value: 'eq', label: 'Igual' },
  { value: 'neq', label: 'Diferente' },
  { value: 'gt', label: 'Maior que' },
  { value: 'lt', label: 'Menor que' },
  { value: 'contains', label: 'Contém' },
  { value: 'startsWith', label: 'Começa com' },
  { value: 'endsWith', label: 'Termina com' },
  { value: 'empty', label: 'Vazio' },
  { value: 'notEmpty', label: 'Não vazio' },
] as const;
