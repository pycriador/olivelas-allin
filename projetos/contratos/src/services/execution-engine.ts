import { supabase } from "@/integrations/supabase/client";
import type {
  Project,
  DataSource,
  ProjectDataSource,
  Variable,
  VariableMapping,
  Rule,
  Builder,
  BuilderBlock,
  Clause,
  Flow,
  FlowNode,
  FlowConnection,
  Execution,
  ValidationResult,
  Json,
} from "@/types";
import {
  variableService,
  dataSourceService,
  ruleService,
  builderService,
  flowService,
  validationService,
} from "@/services/document-engine";
import { documentExporter } from "@/services/exporters";
import { auditService } from "@/services/audit";

export interface ResolvedVariable {
  key: string;
  value: unknown;
}

export interface BuildSection {
  heading?: string;
  body: string;
}

export interface ExecutionResult {
  execution: Execution;
  variableValues: Record<string, unknown>;
  sections: BuildSection[];
  content: string;
  format: string;
  errors: string[];
  warnings: string[];
}

function getNestedPath(source: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = source;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function resolvePlaceholders(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, name: string) => {
    const raw = variables[name];
    if (raw === undefined || raw === null) return "";
    return String(raw);
  });
}

export class RuleEngine {
  private scalar(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return String(value);
  }

  evaluate(node: unknown, variables: Record<string, unknown>): boolean {
    if (!node || typeof node !== "object") return true;
    const n = node as Record<string, unknown>;

    if (Array.isArray(n["all"])) {
      return n["all"].every((child) => this.evaluate(child, variables));
    }
    if (Array.isArray(n["any"])) {
      return n["any"].some((child) => this.evaluate(child, variables));
    }
    if (n["if"]) {
      const conditionMeta = n["if"] as Record<string, unknown>;
      const matches = this.testCondition(conditionMeta, variables);
      return matches ? this.evaluate(n["then"], variables) : true;
    }
    if (n["field"] !== undefined && n["op"] !== undefined) {
      return this.testCondition(n, variables);
    }
    return true;
  }

  private testCondition(
    cond: Record<string, unknown>,
    variables: Record<string, unknown>,
  ): boolean {
    const field = String(cond["field"] ?? "");
    const op = String(cond["op"] ?? "");
    const actual = getNestedPath(variables, field);
    const expected = cond["value"];

    switch (op) {
      case "not_empty":
        return actual !== null && actual !== undefined && String(actual) !== "";
      case "empty":
        return actual === null || actual === undefined || String(actual) === "";
      case "eq":
        return this.scalar(actual) === this.scalar(expected);
      case "neq":
        return this.scalar(actual) !== this.scalar(expected);
      case "contains":
        return String(actual).includes(String(expected));
      case "lte":
        return Number(actual) <= Number(expected);
      case "lt":
        return Number(actual) < Number(expected);
      case "gte":
        return Number(actual) >= Number(expected);
      case "gt":
        return Number(actual) > Number(expected);
      default:
        return true;
    }
  }
}

export const ruleEngine = new RuleEngine();

export class ExecutionEngine {
  async run(input: {
    project: Project;
    sourceId?: string | null;
    recordId?: string | null;
    format?: "pdf" | "markdown" | "txt";
  }): Promise<ExecutionResult> {
    const format = input.format ?? "pdf";
    const errors: string[] = [];
    const warnings: string[] = [];

    const execution = await this.createExecution(
      input.project.workspace_id,
      input.project.id,
      input.sourceId ?? null,
      input.recordId ?? null,
    );
    const executionId = execution.id;

    try {
      const variableValues = await this.resolveVariables(input.project.id, input.sourceId ?? null);

      const variables = await variableService.listByProject(input.project.id);
      for (const variable of variables) {
        if (variable.is_required) {
          const value = variableValues[variable.key];
          if (value === undefined || value === null || value === "") {
            errors.push(`Variável obrigatória ausente: ${variable.key}`);
          }
        }
      }

      const rules = await ruleService.listByProject(input.project.id);
      for (const rule of rules) {
        const passes = ruleEngine.evaluate(rule.expression, variableValues);
        if (!passes && rule.is_active) {
          const message = rule.message || `Regra não atendida: ${rule.name}`;
          if (rule.severity === "error") errors.push(message);
          else warnings.push(message);
        }
      }

      const sections = await this.buildDocument(input.project.id, variableValues);
      const content = documentExporter.export(input.project.name, format, sections);

      const error = await this.persistDocument(
        input.project,
        executionId,
        input.project.name,
        format,
        content,
        variableValues,
      );
      if (error) throw error;

      await supabase
        .from("executions")
        .update({ status: "succeeded", error: null })
        .eq("id", executionId);

      void auditService.record({
        action: "run",
        entity: "execution",
        entityId: executionId,
        workspaceId: input.project.workspace_id,
        metadata: {
          project: input.project.name,
          format,
          errors: errors.length,
          warnings: warnings.length,
        },
      });

      return {
        execution: { ...execution, status: "succeeded" },
        variableValues,
        sections,
        content,
        format,
        errors,
        warnings,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(message);
      await supabase
        .from("executions")
        .update({ status: "failed", error: message })
        .eq("id", executionId);
      throw err;
    }
  }

  private async createExecution(
    workspaceId: string,
    projectId: string,
    sourceId: string | null,
    recordId: string | null,
  ) {
    const { data, error } = await supabase
      .from("executions")
      .insert({
        workspace_id: workspaceId,
        project_id: projectId,
        source_id: sourceId,
        record_id: recordId,
        status: "running",
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as Execution;
  }

  async validateProject(project: Project): Promise<ValidationResult[]> {
    const variableValues = await this.resolveVariables(project.id);
    const variables = await variableService.listByProject(project.id);
    const rules = await ruleService.listByProject(project.id);
    const issues: ValidationResult[] = [];

    for (const variable of variables) {
      if (!variable.is_required) continue;
      const value = variableValues[variable.key];
      if (value === undefined || value === null || value === "") {
        issues.push(
          await validationService.record({
            projectId: project.id,
            scope: "variables",
            level: "error",
            message: `Variável obrigatória ausente: ${variable.key}`,
            code: "MISSING_REQUIRED_VARIABLE",
            context: { key: variable.key } as Json,
          }),
        );
      }
    }

    for (const rule of rules) {
      if (!rule.is_active) continue;
      const passes = ruleEngine.evaluate(rule.expression, variableValues);
      if (passes) continue;
      const message = rule.message || `Regra não atendida: ${rule.name}`;
      issues.push(
        await validationService.record({
          projectId: project.id,
          scope: "rules",
          level: (rule.severity as "error" | "warning") ?? "warning",
          message,
          code: "RULE_FAILED",
          context: { rule: rule.name, name: rule.name } as Json,
        }),
      );
    }

    void auditService.record({
      action: "validate",
      entity: "project",
      entityId: project.id,
      workspaceId: project.workspace_id,
      metadata: { issues: issues.length },
    });

    return issues;
  }

  async resolveVariables(
    projectId: string,
    sourceId?: string | null,
  ): Promise<Record<string, unknown>> {
    const variables = await variableService.listByProject(projectId);
    const mappings = await variableService.listMappings(projectId);
    const linked = await dataSourceService.listLinked(projectId);
    const values: Record<string, unknown> = {};

    for (const variable of variables) {
      const defaultValue = variable.default_value;
      if (this.hasValue(defaultValue)) {
        values[variable.key] = defaultValue;
      } else {
        values[variable.key] = "";
      }
    }

    const sourcesById = new Map<string, DataSource>();
    for (const link of linked) {
      sourcesById.set(link.data_source_id, link.data_source);
    }

    for (const mapping of mappings) {
      const sourced = mapping.source_id ? sourcesById.get(mapping.source_id) : undefined;
      if (!sourced) continue;
      const records = this.extractRecords(sourced.config);
      const first = records[0];
      const selected: Record<string, unknown>[] | undefined = sourceId
        ? records
        : first
          ? [first]
          : records;

      let found = false;
      for (const record of selected || []) {
        const value = mapping.field_path ? getNestedPath(record, mapping.field_path) : undefined;
        if (value !== undefined && value !== null && String(value) !== "") {
          values[mapping.variable?.key ?? mapping.field_path ?? ""] = value;
          found = true;
          break;
        }
      }
      if (!found && mapping.fallback !== null && mapping.fallback !== undefined) {
        values[mapping.variable?.key ?? ""] = mapping.fallback;
      }
    }

    return values;
  }

  private hasValue(value: unknown): boolean {
    return value !== null && value !== undefined && String(value) !== "";
  }

  private extractRecords(config: Json | null | undefined): Record<string, unknown>[] {
    if (!config) return [];
    const c = config as Record<string, unknown>;
    const records = c["records"];
    if (Array.isArray(records)) return records as Record<string, unknown>[];
    return [];
  }

  private async buildDocument(
    projectId: string,
    variables: Record<string, unknown>,
  ): Promise<BuildSection[]> {
    const builder = await builderService.getByProject(projectId);
    if (!builder) return [{ body: "[Nenhum modelo configurado]" }];

    const blocks = await builderService.listBlocks(builder.id);
    const clauses = await this.loadClauses(blocks);

    const sections: BuildSection[] = [];
    for (const block of blocks) {
      if (block.kind === "conditional") {
        const passes = block.condition ? ruleEngine.evaluate(block.condition, variables) : true;
        if (!passes) continue;
      }
      const clause =
        block.kind === "clause" && block.clause_id ? clauses.get(block.clause_id) : undefined;
      const raw = clause?.content || block.content || "";
      const section: BuildSection = { body: resolvePlaceholders(raw, variables) };
      if (block.title) section.heading = block.title;
      sections.push(section);
    }
    return sections;
  }

  private async loadClauses(blocks: BuilderBlock[]): Promise<Map<string, Clause>> {
    const ids = new Set<string>();
    for (const block of blocks) {
      if (block.kind === "clause" && block.clause_id) ids.add(block.clause_id);
    }
    const map = new Map<string, Clause>();
    if (ids.size === 0) return map;
    const { data, error } = await supabase
      .from("clauses")
      .select("*")
      .in("id", [...ids]);
    if (error) throw error;
    for (const clause of data) map.set(clause.id, clause as Clause);
    return map;
  }

  private async persistDocument(
    project: Project,
    executionId: string,
    name: string,
    format: string,
    content: string,
    variables: Record<string, unknown>,
  ) {
    const { error } = await supabase.from("generated_documents").insert({
      workspace_id: project.workspace_id,
      project_id: project.id,
      execution_id: executionId,
      name: `${name}.${format === "markdown" ? "md" : format}`,
      format,
      content_format: format,
      content,
      size_bytes: new TextEncoder().encode(content).length,
    });
    return error;
  }
}

export const executionEngine = new ExecutionEngine();

export { ruleEngine as _ruleEngine, resolvePlaceholders, getNestedPath };
