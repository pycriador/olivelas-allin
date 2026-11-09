import type { Database, Json } from "@/integrations/supabase/types";

export type { Database, Json } from "@/integrations/supabase/types";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];

export type AppRole = Enums<"app_role">;
export type ConnectorKind = Enums<"connector_kind">;
export type ExecutionStatus = Enums<"execution_status">;
export type MemberStatus = Enums<"member_status">;
export type ProjectStatus = Enums<"project_status">;
export type WorkspacePlan = Enums<"workspace_plan">;
export type WorkspaceStatus = Enums<"workspace_status">;
export type AiProviderKind = Enums<"ai_provider_kind">;
export type AiProviderStatus = Enums<"ai_provider_status">;
export type AiPromptStatus = Enums<"ai_prompt_status">;
export type AiAgentStatus = Enums<"ai_agent_status">;
export type AiExecutionStatus = Enums<"ai_execution_status">;
export type AiToolEngine = Enums<"ai_tool_engine">;
export type UploadFileKind = Enums<"upload_file_kind">;
export type UploadStatus = Enums<"upload_status">;
export type DocumentRiskLevel = Enums<"document_risk_level">;
export type KnowledgeSourceKind = Enums<"knowledge_source_kind">;
export type FlowNodeKind = Enums<"flow_node_kind">;
export type FlowConnectionKind = Enums<"flow_connection_kind">;
export type BuilderBlockKind = Enums<"builder_block_kind">;
export type DocumentStatus = Enums<"document_status">;
export type ValidationLevel = Enums<"validation_level">;
export type ValidationScope = Enums<"validation_scope">;
export type ExecutionLogLevel = Enums<"execution_log_level">;
export type MappingValueKind = Enums<"mapping_value_kind">;

export type Workspace = Tables<"workspaces">;
export type Profile = Tables<"profiles">;
export type WorkspaceMember = Tables<"workspace_members">;
export type UserRole = Tables<"user_roles">;
export type Group = Tables<"groups">;
export type GroupMember = Tables<"group_members">;
export type Permission = Tables<"permissions">;
export type RolePermission = Tables<"role_permissions">;
export type Project = Tables<"projects">;
export type ProjectVersion = Tables<"project_versions">;
export type Connector = Tables<"connectors">;
export type Credential = Tables<"credentials">;
export type DataSource = Tables<"data_sources">;
export type Variable = Tables<"variables">;
export type Builder = Tables<"builders">;
export type Rule = Tables<"rules">;
export type Execution = Tables<"executions">;
export type GeneratedDocument = Tables<"generated_documents">;
export type Library = Tables<"libraries">;
export type Clause = Tables<"clauses">;
export type AuditLog = Tables<"audit_logs">;
export type Notification = Tables<"notifications">;
export type Settings = Tables<"settings">;
export type AiProvider = Tables<"ai_providers">;
export type AiModel = Tables<"ai_models">;
export type AiPrompt = Tables<"ai_prompts">;
export type AiPromptVersion = Tables<"ai_prompt_versions">;
export type AiAgent = Tables<"ai_agents">;
export type AiExecution = Tables<"ai_executions">;
export type AiTool = Tables<"ai_tools">;
export type AiConversation = Tables<"ai_conversations">;
export type AiMessage = Tables<"ai_messages">;
export type DocumentUpload = Tables<"document_uploads">;
export type DocumentUploadChunk = Tables<"document_upload_chunks">;
export type DocumentAnalysis = Tables<"document_analyses">;
export type KnowledgeSource = Tables<"knowledge_sources">;
export type ProjectDataSource = Tables<"project_data_sources">;
export type VariableMapping = Tables<"variable_mappings">;
export type Flow = Tables<"flows">;
export type FlowNode = Tables<"flow_nodes">;
export type FlowConnection = Tables<"flow_connections">;
export type BuilderBlock = Tables<"builder_blocks">;
export type ValidationResult = Tables<"validation_results">;
export type ExecutionLog = Tables<"execution_logs">;

export interface AuthUser {
  id: string;
  email: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

export interface WorkspaceContext {
  workspace: Workspace;
  membership: WorkspaceMember;
  roles: UserRole[];
  permissions: string[];
}

export interface RouteParams {
  workspaceId: string;
  projectId?: string;
  itemId?: string;
}

export type Theme = "light" | "dark" | "system";

export interface RuleCondition {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "greater_than"
    | "less_than"
    | "is_empty"
    | "is_not_empty";
  value?: Json;
}

export interface RuleAction {
  kind: "set_variable" | "block" | "warn" | "skip_clause";
  field?: string;
  value?: Json;
  message?: string;
}

export interface RuleAst {
  if: RuleCondition[];
  then: RuleAction[];
}

export interface VariableMappingEntry {
  id: string;
  variable_id: string;
  source_id?: string | null;
  field_path?: string | null;
  value_kind: MappingValueKind;
  constant_value?: Json | null;
  expression?: string | null;
  transform?: string | null;
  fallback?: Json | null;
  is_required: boolean;
}

export interface FlowNodeData {
  label?: string;
  source_id?: string;
  mapping?: Record<string, string>;
  rule?: RuleAst;
  generate?: { format: string };
  export?: { format: string };
  [key: string]: unknown;
}

export interface FlowNodeDef {
  id: string;
  kind: FlowNodeKind;
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface FlowConnectionDef {
  id: string;
  from_node_id: string;
  to_node_id: string;
  kind: FlowConnectionKind;
  condition?: RuleAst;
}

export interface BuilderBlockDef {
  id: string;
  kind: BuilderBlockKind;
  content?: string;
  clause_id?: string;
  clause_version?: number;
  variable_key?: string;
  condition?: RuleAst;
  parent_id?: string | null;
  order_seq: number;
}

export interface ProjectDataSourceEntry {
  id: string;
  data_source_id: string;
  alias?: string | null;
  config?: Json;
}

export interface ValidationIssue {
  id: string;
  project_id: string;
  scope: ValidationScope;
  level: ValidationLevel;
  message: string;
  code?: string | null;
  context?: Json;
  created_at?: string;
}
