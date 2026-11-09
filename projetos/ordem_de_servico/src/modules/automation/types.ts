export type TriggerType =
  | "event" | "statusChange" | "newCustomer" | "newServiceOrder" | "documentGenerated"
  | "webhook" | "api" | "schedule" | "upload" | "timer" | "manual" | "featureFlag";

export type ActionType =
  | "updateRecord" | "createDocument" | "sendCommunication" | "executeWorkflow"
  | "executeAI" | "executeIntegration" | "updateMetadata" | "createEvent"
  | "createAudit" | "executeScript" | "executeQuery" | "updateDashboard"
  | "generateReport" | "createTask";

export type WorkflowStatus = "draft" | "active" | "paused" | "archived";
export type ExecutionStatus = "pending" | "running" | "completed" | "failed" | "cancelled" | "retrying";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled" | "escalated" | "delegated";
export type RuleOperator = "equals" | "notEquals" | "greaterThan" | "lessThan" | "greaterOrEqual" | "lessOrEqual" | "contains" | "notContains" | "startsWith" | "endsWith" | "isEmpty" | "isNotEmpty" | "in" | "notIn" | "between" | "regex";
export type LogicOperator = "and" | "or" | "not";
export type VariableType = "string" | "number" | "boolean" | "object" | "array" | "document" | "image" | "json" | "date" | "time" | "company" | "user" | "workflow";
export type ScheduleType = "manual" | "daily" | "weekly" | "monthly" | "cron" | "event";
export type LoopType = "forLoop" | "whileLoop" | "forEach";

export interface WorkflowStep {
  id: string;
  type: "trigger" | "condition" | "decision" | "loop" | "delay" | "timer" | "event" | "script" | "webhook" | "api" | "document" | "communication" | "ai" | "integration" | "database" | "approval" | "action" | "end";
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[];
  errorHandler?: { action: "stop" | "skip" | "retry" | "gotoStep"; stepId?: string; maxRetries?: number };
}

export interface WorkflowCondition {
  id: string;
  field: string;
  operator: RuleOperator;
  value: string;
  logicOperator?: LogicOperator;
  leftValue?: string;
  rightValue?: string;
}

export interface WorkflowDecision {
  id: string;
  label: string;
  conditions: WorkflowCondition[][];
  defaultBranch: string;
}

export interface WorkflowTrigger {
  type: TriggerType;
  eventName?: string;
  cronExpression?: string;
  scheduleConfig?: { type: ScheduleType; time?: string; dayOfWeek?: number[]; dayOfMonth?: number; interval?: number };
  webhookConfig?: { url: string; method: "GET" | "POST" | "PUT" | "DELETE" };
  featureFlag?: string;
  statusChangedFrom?: string[];
  statusChangedTo?: string[];
}

export interface WorkflowAction {
  id: string;
  type: ActionType;
  label: string;
  config: Record<string, any>;
  order: number;
  enabled: boolean;
}

export interface WorkflowVariable {
  id: string;
  name: string;
  type: VariableType;
  value: any;
  required: boolean;
  description?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  status: WorkflowStatus;
  version: number;
  steps: WorkflowStep[];
  actions: WorkflowAction[];
  trigger: WorkflowTrigger;
  variables: WorkflowVariable[];
  tags: string[];
  isGlobal: boolean;
  isTemplate: boolean;
  companyId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  lastExecutedAt?: string;
  executionCount: number;
  avgDuration: number;
  favorite: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  workflow: Omit<Workflow, "id" | "createdAt" | "updatedAt" | "createdBy" | "status" | "version" | "executionCount" | "avgDuration" | "lastExecutedAt" | "publishedAt">;
  isPublished: boolean;
  isArchived: boolean;
  version: number;
  usageCount: number;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  category: string;
  type: "simple" | "switch" | "composite";
  conditions: RuleConditionGroup[];
  actions: RuleAction[];
  priority: number;
  enabled: boolean;
  version: number;
  tags: string[];
  isGlobal: boolean;
  companyId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuleConditionGroup {
  id: string;
  logic: "and" | "or";
  conditions: RuleConditionItem[];
}

export interface RuleConditionItem {
  id: string;
  field: string;
  operator: RuleOperator;
  value: string;
  valueType: "string" | "number" | "boolean" | "date" | "expression" | "variable";
  fieldType?: string;
}

export interface RuleAction {
  id: string;
  type: ActionType;
  label: string;
  config: Record<string, any>;
  order: number;
}

export interface StateMachine {
  id: string;
  name: string;
  description: string;
  entityType: string;
  states: StateDefinition[];
  transitions: StateTransition[];
  initialStatus: string;
  finalStatuses: string[];
  version: number;
  isGlobal: boolean;
  companyId?: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StateDefinition {
  id: string;
  name: string;
  label: string;
  color: string;
  icon: string;
  order: number;
  isFinal: boolean;
  permissions: string[];
  validations: StateValidation[];
  autoActions: StateAutoAction[];
}

export interface StateValidation {
  id: string;
  field: string;
  operator: RuleOperator;
  value: string;
  errorMessage: string;
}

export interface StateAutoAction {
  id: string;
  type: ActionType;
  config: Record<string, any>;
  order: number;
}

export interface StateTransition {
  id: string;
  fromStatus: string;
  toStatus: string;
  label: string;
  conditions: WorkflowCondition[];
  permissions: string[];
  requiresApproval: boolean;
  approvalId?: string;
  onTransitionActions: StateAutoAction[];
  rollbackAction?: string;
}

export interface ApprovalFlow {
  id: string;
  name: string;
  description: string;
  type: "sequential" | "parallel" | "majority" | "unanimous";
  steps: ApprovalStep[];
  timeoutMinutes?: number;
  escalationMinutes?: number;
  escalationUserId?: string;
  canCancel: boolean;
  allowDelegation: boolean;
  tags: string[];
  isGlobal: boolean;
  companyId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalStep {
  id: string;
  order: number;
  userIds: string[];
  roleIds: string[];
  label: string;
  requiredApprovals: number;
}

export interface ApprovalRequest {
  id: string;
  approvalFlowId: string;
  approvalFlowName: string;
  referenceType: string;
  referenceId: string;
  referenceName: string;
  status: ApprovalStatus;
  currentStep: number;
  totalSteps: number;
  requestedBy: string;
  requestedAt: string;
  completedAt?: string;
  responses: ApprovalResponse[];
  timeoutAt?: string;
  escalatedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  delegation?: { fromUserId: string; toUserId: string; expiresAt: string };
}

export interface ApprovalResponse {
  id: string;
  stepId: string;
  userId: string;
  userName: string;
  status: "approved" | "rejected" | "delegated";
  comment?: string;
  respondedAt: string;
}

export interface SlaDefinition {
  id: string;
  name: string;
  description: string;
  entityType: string;
  maxTimeMinutes: number;
  minTimeMinutes?: number;
  priority: "low" | "medium" | "high" | "critical";
  escalationRules: SlaEscalationRule[];
  alertRules: SlaAlertRule[];
  pauseConditions: WorkflowCondition[];
  enabled: boolean;
  tags: string[];
  isGlobal: boolean;
  companyId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SlaEscalationRule {
  id: string;
  afterMinutes: number;
  notifyUserIds: string[];
  action: "notify" | "reassign" | "changePriority" | "escalate";
  targetUserId?: string;
  targetPriority?: string;
}

export interface SlaAlertRule {
  id: string;
  atPercentage: number;
  action: "notify" | "alert" | "escalate";
  notifyUserIds: string[];
  message: string;
}

export interface JobDefinition {
  id: string;
  name: string;
  description: string;
  type: "script" | "workflow" | "integration" | "report" | "maintenance" | "backup" | "cleanup" | "sync" | "custom";
  config: Record<string, any>;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  priority: "low" | "medium" | "high" | "critical";
  enabled: boolean;
  tags: string[];
  isGlobal: boolean;
  companyId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobExecution {
  id: string;
  jobId: string;
  jobName: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  retryCount: number;
  error?: string;
  result?: string;
  triggeredBy: "manual" | "schedule" | "event" | "dependency";
  logs: string[];
}

export interface ScheduleDefinition {
  id: string;
  name: string;
  description: string;
  scheduleType: ScheduleType;
  cronExpression?: string;
  time?: string;
  dayOfWeek?: number[];
  dayOfMonth?: number;
  intervalMinutes?: number;
  startDate?: string;
  endDate?: string;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  triggerType: "workflow" | "job" | "script" | "report";
  triggerId: string;
  triggerName: string;
  tags: string[];
  companyId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimerDefinition {
  id: string;
  name: string;
  description: string;
  type: "once" | "recurring" | "delayed";
  delayMs: number;
  intervalMs?: number;
  maxExecutions?: number;
  startAt: string;
  endAt?: string;
  enabled: boolean;
  executionCount: number;
  triggerType: "workflow" | "job" | "script";
  triggerId: string;
  triggerName: string;
  tags: string[];
  companyId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScriptDefinition {
  id: string;
  name: string;
  description: string;
  language: "javascript" | "python" | "expression";
  code: string;
  parameters: ScriptParameter[];
  returnType: VariableType;
  timeoutMs: number;
  version: number;
  enabled: boolean;
  isSystem: boolean;
  tags: string[];
  isGlobal: boolean;
  companyId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScriptParameter {
  id: string;
  name: string;
  type: VariableType;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

export interface Variable {
  id: string;
  name: string;
  type: VariableType;
  value: any;
  scope: "global" | "company" | "workflow" | "local";
  isSystem: boolean;
  description?: string;
  category?: string;
  tags: string[];
  companyId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionLog {
  id: string;
  workflowId: string;
  workflowName: string;
  workflowVersion: number;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  triggeredBy: string;
  triggerDetail: string;
  variables: Record<string, any>;
  steps: ExecutionStepLog[];
  error?: string;
  retryCount: number;
  userId?: string;
  companyId?: string;
  tags: string[];
}

export interface ExecutionStepLog {
  stepId: string;
  stepLabel: string;
  stepType: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  input?: any;
  output?: any;
  error?: string;
  retryCount: number;
}

export interface AuditEntry {
  id: string;
  action: "created" | "updated" | "deleted" | "executed" | "cancelled" | "failed" | "retried" | "rolledBack" | "published" | "archived" | "restored" | "duplicated" | "approved" | "rejected" | "escalated" | "delegated" | "paused" | "resumed";
  entityType: "workflow" | "template" | "rule" | "stateMachine" | "approvalFlow" | "approvalRequest" | "sla" | "job" | "schedule" | "timer" | "script" | "variable" | "execution";
  entityId: string;
  entityName: string;
  userId: string;
  companyId?: string;
  details: Record<string, any>;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

export const AUTOMATION_CONSTANTS = {
  TRIGGER_TYPES: ["event","statusChange","newCustomer","newServiceOrder","documentGenerated","webhook","api","schedule","upload","timer","manual","featureFlag"] as TriggerType[],
  ACTION_TYPES: ["updateRecord","createDocument","sendCommunication","executeWorkflow","executeAI","executeIntegration","updateMetadata","createEvent","createAudit","executeScript","executeQuery","updateDashboard","generateReport","createTask"] as ActionType[],
  WORKFLOW_CATEGORIES: ["serviceOrder","warranty","return","registration","import","integration","communication","ai","backup","reports","audit","custom"],
  WORKFLOW_STATUS: ["draft","active","paused","archived"] as WorkflowStatus[],
  EXECUTION_STATUS: ["pending","running","completed","failed","cancelled","retrying"] as ExecutionStatus[],
  APPROVAL_STATUS: ["pending","approved","rejected","cancelled","escalated","delegated"] as ApprovalStatus[],
  STEP_TYPES: ["trigger","condition","decision","loop","delay","timer","event","script","webhook","api","document","communication","ai","integration","database","approval","action","end"],
  SCHEDULE_TYPES: ["manual","daily","weekly","monthly","cron","event"] as ScheduleType[],
  VARIABLE_TYPES: ["string","number","boolean","object","array","document","image","json","date","time","company","user","workflow"] as VariableType[],
  SCRIPT_LANGUAGES: ["javascript","python","expression"],
  JOB_TYPES: ["script","workflow","integration","report","maintenance","backup","cleanup","sync","custom"],
  JOB_PRIORITIES: ["low","medium","high","critical"],
  SLA_PRIORITIES: ["low","medium","high","critical"],
  AUDIT_ACTIONS: ["created","updated","deleted","executed","cancelled","failed","retried","rolledBack","published","archived","restored","duplicated","approved","rejected","escalated","delegated","paused","resumed"],
  AUDIT_ENTITY_TYPES: ["workflow","template","rule","stateMachine","approvalFlow","approvalRequest","sla","job","schedule","timer","script","variable","execution"],
};
