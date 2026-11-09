import { supabase } from "@/integrations/supabase/client";
import type {
  Project,
  ProjectVersion,
  DataSource,
  ProjectDataSource,
  Variable,
  VariableMapping,
  Rule,
  Builder,
  BuilderBlock,
  Flow,
  FlowNode,
  FlowConnection,
  ValidationResult,
  Execution,
  ExecutionLog,
  GeneratedDocument,
  MappingValueKind,
  BuilderBlockKind,
  FlowNodeKind,
  ProjectStatus,
  Json,
} from "@/types";
import { auditService } from "@/services/audit";

function compact<T extends Record<PropertyKey, unknown>>(
  input: T,
): { [K in keyof T]: Exclude<T[K], undefined> } {
  const out: Partial<T> = {};
  for (const key in input) {
    if (input[key] !== undefined) out[key] = input[key];
  }
  return out as { [K in keyof T]: Exclude<T[K], undefined> };
}

export class ProjectService {
  async listByWorkspace(workspaceId: string) {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name");
    if (error) throw error;
    return data as Project[];
  }

  async getById(id: string) {
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
    if (error) return null;
    return data as Project;
  }

  async create(input: {
    workspaceId: string;
    name: string;
    description?: string | null;
    slug?: string;
    status?: ProjectStatus;
  }) {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        workspace_id: input.workspaceId,
        name: input.name,
        description: input.description ?? null,
        slug: input.slug ?? "",
        status: input.status ?? "draft",
      })
      .select("*")
      .single();
    if (error) throw error;
    void auditService.record({
      action: "create",
      entity: "project",
      entityId: data.id,
      workspaceId: input.workspaceId,
      metadata: { name: input.name },
    });
    return data as Project;
  }

  async update(
    id: string,
    input: Partial<{ name: string; description: string | null; status: ProjectStatus }>,
  ) {
    const { data, error } = await supabase
      .from("projects")
      .update(
        compact({
          name: input.name,
          description: input.description,
          status: input.status,
        }),
      )
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    void auditService.record({ action: "update", entity: "project", entityId: id });
    return data as Project;
  }

  async remove(id: string) {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
    void auditService.record({ action: "delete", entity: "project", entityId: id });
  }

  async listVersions(projectId: string) {
    const { data, error } = await supabase
      .from("project_versions")
      .select("*")
      .eq("project_id", projectId)
      .order("version", { ascending: false });
    if (error) throw error;
    return data as ProjectVersion[];
  }
}

export class DataSourceService {
  async listByWorkspace(workspaceId: string) {
    const { data, error } = await supabase
      .from("data_sources")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name");
    if (error) throw error;
    return data as DataSource[];
  }

  async listByProject(projectId: string) {
    const { data, error } = await supabase
      .from("project_data_sources")
      .select(
        `
        *,
        data_source:data_sources(*)
      `,
      )
      .eq("project_id", projectId);
    if (error) throw error;
    return data as (ProjectDataSource & { data_source: DataSource })[];
  }

  async createGlobal(input: {
    workspaceId: string;
    name: string;
    kind?: string;
    description?: string | null;
    config?: Json;
  }) {
    const { data, error } = await supabase
      .from("data_sources")
      .insert({
        workspace_id: input.workspaceId,
        name: input.name,
        kind: input.kind ?? "json",
        description: input.description ?? null,
        config: (input.config ?? {}) as Json,
        is_active: true,
      })
      .select("*")
      .single();
    if (error) throw error;
    void auditService.record({
      action: "create",
      entity: "data_source",
      entityId: data.id,
      workspaceId: input.workspaceId,
      metadata: { name: input.name, global: true },
    });
    return data as DataSource;
  }

  async createProjectScoped(input: {
    projectId: string;
    name: string;
    kind?: string;
    description?: string | null;
    config?: Json;
  }) {
    const { data, error } = await supabase
      .from("data_sources")
      .insert({
        project_id: input.projectId,
        name: input.name,
        kind: input.kind ?? "json",
        description: input.description ?? null,
        config: (input.config ?? {}) as Json,
        is_active: true,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as DataSource;
  }

  async linkToProject(projectId: string, dataSourceId: string, alias?: string | null) {
    const { data, error } = await supabase
      .from("project_data_sources")
      .insert({ project_id: projectId, data_source_id: dataSourceId, alias: alias ?? null })
      .select("*")
      .single();
    if (error) throw error;
    return data as ProjectDataSource;
  }

  async listLinked(projectId: string) {
    return this.listByProject(projectId);
  }
}

export class VariableService {
  async listByProject(projectId: string) {
    const { data, error } = await supabase
      .from("variables")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at");
    if (error) throw error;
    return data as Variable[];
  }

  async create(input: {
    projectId: string;
    key: string;
    label?: string | null;
    dataType?: string;
    isRequired?: boolean;
    defaultValue?: Json | null;
  }) {
    const { data, error } = await supabase
      .from("variables")
      .insert({
        project_id: input.projectId,
        key: input.key,
        label: input.label ?? null,
        data_type: input.dataType ?? "text",
        is_required: input.isRequired ?? false,
        default_value: input.defaultValue ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as Variable;
  }

  async listMappings(projectId: string) {
    const { data, error } = await supabase
      .from("variable_mappings")
      .select(
        `
        *,
        variable:variables(*)
      `,
      )
      .eq("project_id", projectId);
    if (error) throw error;
    return data as (VariableMapping & { variable: Variable })[];
  }

  async upsertMapping(input: {
    projectId: string;
    variableId: string;
    sourceId?: string | null;
    fieldPath?: string | null;
    valueKind?: MappingValueKind;
    constantValue?: Json | null;
    expression?: string | null;
    transform?: string | null;
    fallback?: Json | null;
    isRequired?: boolean;
  }) {
    const existing = await supabase
      .from("variable_mappings")
      .select("id")
      .eq("project_id", input.projectId)
      .eq("variable_id", input.variableId)
      .maybeSingle();
    const payload = {
      project_id: input.projectId,
      variable_id: input.variableId,
      source_id: input.sourceId ?? null,
      field_path: input.fieldPath ?? null,
      value_kind: input.valueKind ?? "field",
      constant_value: input.constantValue ?? null,
      expression: input.expression ?? null,
      transform: input.transform ?? null,
      fallback: input.fallback ?? null,
      is_required: input.isRequired ?? false,
    };
    if (existing.data) {
      const { data, error } = await supabase
        .from("variable_mappings")
        .update(payload)
        .eq("id", existing.data.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as VariableMapping;
    }
    const { data, error } = await supabase
      .from("variable_mappings")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return data as VariableMapping;
  }
}

export class RuleService {
  async listByProject(projectId: string) {
    const { data, error } = await supabase
      .from("rules")
      .select("*")
      .eq("project_id", projectId)
      .order("order_seq");
    if (error) throw error;
    return data as Rule[];
  }

  async create(input: {
    projectId: string;
    name: string;
    expression: Json;
    description?: string | null;
    message?: string | null;
    severity?: string;
    isActive?: boolean;
    orderSeq?: number;
  }) {
    const { data, error } = await supabase
      .from("rules")
      .insert({
        project_id: input.projectId,
        name: input.name,
        expression: input.expression as Json,
        description: input.description ?? null,
        message: input.message ?? null,
        severity: input.severity ?? "warning",
        is_active: input.isActive ?? true,
        order_seq: input.orderSeq ?? 0,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as Rule;
  }
}

export class FlowService {
  async getByProject(projectId: string) {
    const { data, error } = await supabase
      .from("flows")
      .select("*")
      .eq("project_id", projectId)
      .single();
    if (error) return null;
    return data as Flow;
  }

  async upsert(projectId: string, name: string, description?: string | null) {
    const existing = await this.getByProject(projectId);
    const payload = { name, description: description ?? null };
    if (existing) {
      const { data, error } = await supabase
        .from("flows")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Flow;
    }
    const { data, error } = await supabase
      .from("flows")
      .insert({ project_id: projectId, ...payload })
      .select("*")
      .single();
    if (error) throw error;
    return data as Flow;
  }

  async listNodes(flowId: string) {
    const { data, error } = await supabase
      .from("flow_nodes")
      .select("*")
      .eq("flow_id", flowId)
      .order("created_at");
    if (error) throw error;
    return data as FlowNode[];
  }

  async upsertNode(input: {
    flowId: string;
    kind: FlowNodeKind;
    position: { x: number; y: number };
    data?: Json;
  }) {
    const existing = await supabase
      .from("flow_nodes")
      .select("id")
      .eq("flow_id", input.flowId)
      .eq("kind", input.kind)
      .maybeSingle();
    const payload = {
      flow_id: input.flowId,
      kind: input.kind,
      position_x: input.position.x,
      position_y: input.position.y,
      config: (input.data ?? {}) as Json,
    };
    if (existing.data) {
      const { data, error } = await supabase
        .from("flow_nodes")
        .update(payload)
        .eq("id", existing.data.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as FlowNode;
    }
    const { data, error } = await supabase.from("flow_nodes").insert(payload).select("*").single();
    if (error) throw error;
    return data as FlowNode;
  }

  async listConnections(flowId: string) {
    const { data, error } = await supabase
      .from("flow_connections")
      .select("*")
      .eq("flow_id", flowId);
    if (error) throw error;
    return data as FlowConnection[];
  }
}

export class BuilderService {
  async getByProject(projectId: string) {
    const { data, error } = await supabase
      .from("builders")
      .select("*")
      .eq("project_id", projectId)
      .single();
    if (error) return null;
    return data as Builder;
  }

  async upsert(projectId: string, layout?: Json) {
    const existing = await this.getByProject(projectId);
    if (existing) {
      const { data, error } = await supabase
        .from("builders")
        .update(compact({ layout: layout }))
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Builder;
    }
    const { data, error } = await supabase
      .from("builders")
      .insert({
        project_id: projectId,
        name: "Modelo padrão",
        layout: (layout ?? {}) as Json,
        status: "draft",
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as Builder;
  }

  async listBlocks(builderId: string) {
    const { data, error } = await supabase
      .from("builder_blocks")
      .select("*")
      .eq("builder_id", builderId)
      .order("order_seq");
    if (error) throw error;
    return data as BuilderBlock[];
  }

  async upsertBlock(input: {
    builderId: string;
    kind: BuilderBlockKind;
    orderSeq: number;
    content?: string;
    clauseId?: string;
    clauseVersion?: number;
    condition?: Json;
    parentId?: string | null;
  }) {
    const payload = {
      builder_id: input.builderId,
      kind: input.kind,
      order_seq: input.orderSeq,
      content: input.content ?? null,
      clause_id: input.clauseId ?? null,
      clause_version: input.clauseVersion ?? null,
      condition: (input.condition ?? null) as Json | null,
      parent_id: input.parentId ?? null,
    };
    const { data, error } = await supabase
      .from("builder_blocks")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return data as BuilderBlock;
  }
}

export class ValidationService {
  async listByProject(projectId: string) {
    const { data, error } = await supabase
      .from("validation_results")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as ValidationResult[];
  }

  async record(input: {
    projectId: string;
    scope: string;
    level: "error" | "warning" | "info";
    message: string;
    code?: string | null;
    context?: Json;
  }) {
    const { data, error } = await supabase
      .from("validation_results")
      .insert({
        project_id: input.projectId,
        scope: input.scope as ValidationResult["scope"],
        level: input.level,
        message: input.message,
        code: input.code ?? null,
        context: (input.context ?? {}) as Json,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as ValidationResult;
  }

  async clear(projectId: string) {
    const { error } = await supabase
      .from("validation_results")
      .delete()
      .eq("project_id", projectId);
    if (error) throw error;
  }
}

export class ExecutionService {
  async create(input: {
    workspaceId: string;
    projectId: string;
    sourceId?: string | null;
    recordId?: string | null;
  }) {
    const { data, error } = await supabase
      .from("executions")
      .insert({
        workspace_id: input.workspaceId,
        project_id: input.projectId,
        source_id: input.sourceId ?? null,
        record_id: input.recordId ?? null,
        status: "pending",
      })
      .select("*")
      .single();
    if (error) throw error;
    void auditService.record({
      action: "run",
      entity: "execution",
      entityId: data.id,
      workspaceId: input.workspaceId,
    });
    return data as Execution;
  }

  async getById(id: string) {
    const { data, error } = await supabase.from("executions").select("*").eq("id", id).single();
    if (error) return null;
    return data as Execution;
  }

  async listLogs(executionId: string) {
    const { data, error } = await supabase
      .from("execution_logs")
      .select("*")
      .eq("execution_id", executionId)
      .order("created_at");
    if (error) throw error;
    return data as ExecutionLog[];
  }

  async listDocuments(executionId: string) {
    const { data, error } = await supabase
      .from("generated_documents")
      .select("*")
      .eq("execution_id", executionId);
    if (error) throw error;
    return data as GeneratedDocument[];
  }
}

export const projectService = new ProjectService();
export const dataSourceService = new DataSourceService();
export const variableService = new VariableService();
export const ruleService = new RuleService();
export const flowService = new FlowService();
export const builderService = new BuilderService();
export const validationService = new ValidationService();
export const executionService = new ExecutionService();
