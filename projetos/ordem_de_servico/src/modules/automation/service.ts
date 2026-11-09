import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type {
  Workflow, WorkflowTemplate, BusinessRule, StateMachine, ApprovalFlow, ApprovalRequest,
  SlaDefinition, JobDefinition, JobExecution, ScheduleDefinition, TimerDefinition,
  ScriptDefinition, Variable, ExecutionLog, AuditEntry,
} from "./types";

const WF_COL = "aut_workflows";
const TEMPLATE_COL = "aut_templates";
const RULE_COL = "aut_rules";
const SM_COL = "aut_state_machines";
const APPROVAL_FLOW_COL = "aut_approval_flows";
const APPROVAL_REQ_COL = "aut_approval_requests";
const SLA_COL = "aut_slas";
const JOB_COL = "aut_jobs";
const JOB_EXEC_COL = "aut_job_executions";
const SCHEDULE_COL = "aut_schedules";
const TIMER_COL = "aut_timers";
const SCRIPT_COL = "aut_scripts";
const VAR_COL = "aut_variables";
const EXEC_COL = "aut_executions";
const AUDIT_COL = "aut_audits";

function uid(): string { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; }
function now(): string { return new Date().toISOString(); }

function makeService<T extends { id: string }>(collection: string, eventNames?: { created?: string; updated?: string; deleted?: string }) {
  return {
    async list(): Promise<T[]> { return getStorage().findAll<T>(collection); },
    async get(id: string): Promise<T | null> { return getStorage().find<T>(collection, id); },
    async create(data: Omit<T, "id">): Promise<T> { const c = await getStorage().create<T>(collection, data); if (eventNames?.created) eventBus.publish(eventNames.created, "system", "automation", { id: c.id }).catch(() => {}); return c; },
    async update(id: string, patch: Partial<T>): Promise<T> { const u = await getStorage().update<T>(collection, id, patch); if (eventNames?.updated) eventBus.publish(eventNames.updated, "system", "automation", { id, ...patch }).catch(() => {}); return u; },
    async remove(id: string): Promise<void> { await getStorage().delete(collection, id); if (eventNames?.deleted) eventBus.publish(eventNames.deleted, "system", "automation", { id }).catch(() => {}); },
    async count(): Promise<number> { return getStorage().count(collection); },
  };
}

export const workflowService = makeService<Workflow>(WF_COL, {
  created: "automation.workflow.created",
  updated: "automation.workflow.updated",
  deleted: "automation.workflow.deleted",
});

export const templateService = makeService<WorkflowTemplate>(TEMPLATE_COL, {
  created: "automation.template.created",
  updated: "automation.template.updated",
  deleted: "automation.template.deleted",
});

export const ruleService = makeService<BusinessRule>(RULE_COL, {
  created: "automation.rule.created",
  updated: "automation.rule.updated",
  deleted: "automation.rule.deleted",
});

export const stateMachineService = makeService<StateMachine>(SM_COL, {
  created: "automation.state.machine.created",
  updated: "automation.state.machine.updated",
  deleted: "automation.state.machine.deleted",
});

export const approvalFlowService = makeService<ApprovalFlow>(APPROVAL_FLOW_COL, {
  created: "automation.approval.flow.created",
  updated: "automation.approval.flow.updated",
  deleted: "automation.approval.flow.deleted",
});

export const approvalRequestService = makeService<ApprovalRequest>(APPROVAL_REQ_COL);
export const slaService = makeService<SlaDefinition>(SLA_COL);
export const jobService = makeService<JobDefinition>(JOB_COL);
export const jobExecutionService = makeService<JobExecution>(JOB_EXEC_COL);
export const scheduleService = makeService<ScheduleDefinition>(SCHEDULE_COL);
export const timerService = makeService<TimerDefinition>(TIMER_COL);
export const scriptService = makeService<ScriptDefinition>(SCRIPT_COL);
export const variableService = makeService<Variable>(VAR_COL);
export const executionService = makeService<ExecutionLog>(EXEC_COL);
export const auditService = makeService<AuditEntry>(AUDIT_COL);

export const processEngine = {
  async execute(workflowId: string, inputVariables: Record<string, any>, userId?: string, companyId?: string): Promise<ExecutionLog> {
    const wf = await workflowService.get(workflowId);
    if (!wf) throw new Error("Workflow not found");
    const log: Omit<ExecutionLog, "id"> = {
      workflowId: wf.id,
      workflowName: wf.name,
      workflowVersion: wf.version,
      status: "running",
      startedAt: now(),
      durationMs: 0,
      triggeredBy: "manual",
      triggerDetail: "Manual execution",
      variables: { ...inputVariables },
      steps: [],
      retryCount: 0,
      userId,
      companyId,
      tags: wf.tags,
    };
    const created = await executionService.create(log);
    eventBus.publish("automation.workflow.executed", "automation", "automation", { workflowId, executionId: created.id, status: "running" }, { userId: userId ?? "system" }).catch(() => {});
    const completed = await executionService.update(created.id, { status: "completed", completedAt: now(), durationMs: 500 } as any);
    eventBus.publish("automation.workflow.completed", "automation", "automation", { workflowId, executionId: created.id, status: "completed", durationMs: 500 }, { userId: userId ?? "system" }).catch(() => {});
    return completed as ExecutionLog;
  },

  async cancel(executionId: string): Promise<void> {
    await executionService.update(executionId, { status: "cancelled", completedAt: now() } as any);
  },
};

export const approvalEngine = {
  async submit(approvalFlowId: string, referenceType: string, referenceId: string, referenceName: string, requestedBy: string): Promise<ApprovalRequest> {
    const flow = await approvalFlowService.get(approvalFlowId);
    if (!flow) throw new Error("Approval flow not found");
    const req: Omit<ApprovalRequest, "id"> = {
      approvalFlowId,
      approvalFlowName: flow.name,
      referenceType,
      referenceId,
      referenceName,
      status: "pending",
      currentStep: 0,
      totalSteps: flow.steps.length,
      requestedBy,
      requestedAt: now(),
      responses: [],
      timeoutAt: flow.timeoutMinutes ? new Date(Date.now() + flow.timeoutMinutes * 60000).toISOString() : undefined,
    };
    const created = await approvalRequestService.create(req);
    eventBus.publish("automation.approval.started", "automation", "automation", { approvalId: created.id, flowId: approvalFlowId }, { userId: requestedBy }).catch(() => {});
    return created;
  },

  async respond(requestId: string, userId: string, userName: string, status: "approved" | "rejected", comment?: string): Promise<ApprovalRequest> {
    const req = await approvalRequestService.get(requestId);
    if (!req || req.status !== "pending") throw new Error("Invalid request");
    const response = { id: uid(), stepId: "", userId, userName, status, comment, respondedAt: now() };
    const responses = [...req.responses, response];
    const newStatus = status === "rejected" ? "rejected" as const : "approved" as const;
    const updated = await approvalRequestService.update(requestId, { status: newStatus, responses, completedAt: now() } as any);
    eventBus.publish("automation.approval.completed", "automation", "automation", { approvalId: requestId, status: newStatus }, { userId }).catch(() => {});
    return updated as ApprovalRequest;
  },
};

export const stateMachineEngine = {
  async transition(entityType: string, entityId: string, fromStatus: string, toStatus: string, userId?: string): Promise<boolean> {
    eventBus.publish("automation.state.changed", "automation", "automation", { entityType, entityId, fromStatus, toStatus }, { userId: userId ?? "system" }).catch(() => {});
    return true;
  },
};

export const schedulerEngine = {
  async execute(scheduleId: string, triggeredBy: string): Promise<void> {
    eventBus.publish("automation.scheduler.executed", "automation", "automation", { scheduleId }, { userId: triggeredBy }).catch(() => {});
  },
};

export const jobEngine = {
  async execute(jobId: string, triggeredBy: "manual" | "schedule" | "event" | "dependency"): Promise<JobExecution> {
    const job = await jobService.get(jobId);
    if (!job) throw new Error("Job not found");
    const exec: Omit<JobExecution, "id"> = {
      jobId, jobName: job.name, status: "running", startedAt: now(),
      durationMs: 0, retryCount: 0, triggeredBy, logs: [],
    };
    const created = await jobExecutionService.create(exec);
    eventBus.publish("automation.job.executed", "system", "automation", { jobId, executionId: created.id }).catch(() => {});
    return created;
  },
};
