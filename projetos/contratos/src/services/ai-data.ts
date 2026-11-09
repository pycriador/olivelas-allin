import { supabase } from "@/integrations/supabase/client";
import type {
  AiProvider,
  AiProviderKind,
  AiProviderStatus,
  AiModel,
  AiPrompt,
  AiPromptStatus,
  AiAgent,
  AiExecution,
  AiTool,
  AiConversation,
  AiMessage,
  DocumentUpload,
  DocumentAnalysis,
  KnowledgeSource,
  Json,
} from "@/types";
import { auditService } from "@/services/audit";
import { randomUUID } from "@/utils/random";

function compact<T extends Record<PropertyKey, unknown>>(
  input: T,
): { [K in keyof T]: Exclude<T[K], undefined> } {
  const out: Partial<T> = {};
  for (const key in input) {
    if (input[key] !== undefined) out[key] = input[key];
  }
  return out as { [K in keyof T]: Exclude<T[K], undefined> };
}

export class AIProvidersService {
  async listByWorkspace(workspaceId?: string | null) {
    let query = supabase.from("ai_providers").select("*").order("name");
    if (workspaceId) query = query.eq("workspace_id", workspaceId);
    else query = query.is("workspace_id", null);
    const { data, error } = await query;
    if (error) throw error;
    return data as AiProvider[];
  }

  async getById(id: string) {
    const { data, error } = await supabase.from("ai_providers").select("*").eq("id", id).single();
    if (error) return null;
    return data as AiProvider;
  }

  async create(input: {
    workspaceId?: string | null;
    name: string;
    kind: AiProviderKind;
    status?: AiProviderStatus;
    baseUrl?: string | null;
    defaultModel?: string | null;
    apiKeyEncrypted?: string | null;
    apiKeyFingerprint?: string | null;
    timeoutMs?: number;
    defaultTemperature?: number;
    maxTokens?: number;
    isDefault?: boolean;
  }) {
    const { data, error } = await supabase
      .from("ai_providers")
      .insert({
        workspace_id: input.workspaceId ?? null,
        name: input.name,
        kind: input.kind,
        status: input.status ?? "active",
        base_url: input.baseUrl ?? null,
        default_model: input.defaultModel ?? null,
        api_key_encrypted: input.apiKeyEncrypted ?? null,
        api_key_fingerprint: input.apiKeyFingerprint ?? null,
        timeout_ms: input.timeoutMs ?? 30000,
        default_temperature: input.defaultTemperature ?? 0.7,
        max_tokens: input.maxTokens ?? 4096,
        is_default: input.isDefault ?? false,
      })
      .select("*")
      .single();
    if (error) throw error;
    void auditService.record({
      action: "create",
      entity: "ai_provider",
      entityId: data.id,
      workspaceId: input.workspaceId ?? null,
      metadata: { name: input.name, kind: input.kind },
    });
    return data as AiProvider;
  }

  async update(
    id: string,
    input: Partial<{
      name: string;
      status: AiProviderStatus;
      baseUrl: string | null;
      defaultModel: string | null;
      timeoutMs: number;
      defaultTemperature: number;
      maxTokens: number;
      isDefault: boolean;
    }>,
  ) {
    const { data, error } = await supabase
      .from("ai_providers")
      .update(
        compact({
          name: input.name,
          status: input.status,
          base_url: input.baseUrl,
          default_model: input.defaultModel,
          timeout_ms: input.timeoutMs,
          default_temperature: input.defaultTemperature,
          max_tokens: input.maxTokens,
          is_default: input.isDefault,
        }),
      )
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    void auditService.record({ action: "update", entity: "ai_provider", entityId: id });
    return data as AiProvider;
  }

  async rotateKey(id: string, apiKeyEncrypted: string, apiKeyFingerprint: string) {
    const { data, error } = await supabase
      .from("ai_providers")
      .update({ api_key_encrypted: apiKeyEncrypted, api_key_fingerprint: apiKeyFingerprint })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    void auditService.record({ action: "rotate_key", entity: "ai_provider", entityId: id });
    return data as AiProvider;
  }

  async setStatus(id: string, status: AiProviderStatus) {
    const { data, error } = await supabase
      .from("ai_providers")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    void auditService.record({
      action: "set_status",
      entity: "ai_provider",
      entityId: id,
      metadata: { status },
    });
    return data as AiProvider;
  }

  async delete(id: string) {
    const { error } = await supabase.from("ai_providers").delete().eq("id", id);
    if (error) throw error;
    void auditService.record({ action: "delete", entity: "ai_provider", entityId: id });
  }
}

export class AIModelsService {
  async list(kind?: AiProviderKind) {
    let query = supabase.from("ai_models").select("*").order("provider_kind").order("display_name");
    if (kind) query = query.eq("provider_kind", kind);
    const { data, error } = await query;
    if (error) throw error;
    return data as AiModel[];
  }
}

export class AIPromptsService {
  async listByWorkspace(workspaceId?: string | null) {
    let query = supabase.from("ai_prompts").select("*").order("name");
    if (workspaceId) query = query.eq("workspace_id", workspaceId);
    else query = query.is("workspace_id", null);
    const { data, error } = await query;
    if (error) throw error;
    return data as AiPrompt[];
  }

  async getById(id: string) {
    const { data, error } = await supabase.from("ai_prompts").select("*").eq("id", id).single();
    if (error) return null;
    return data as AiPrompt;
  }

  private buildVersion(
    prompt: Pick<
      AiPrompt,
      | "system_prompt"
      | "prompt"
      | "temperature"
      | "suggested_model"
      | "name"
      | "description"
      | "tags"
    >,
  ) {
    return {
      system_prompt: prompt.system_prompt ?? "",
      prompt: prompt.prompt ?? "",
      temperature: prompt.temperature ?? 0.7,
      suggested_model: prompt.suggested_model ?? null,
      name: prompt.name,
      description: prompt.description ?? null,
      tags: prompt.tags ?? [],
    };
  }

  async create(input: {
    workspaceId?: string | null;
    name: string;
    slug?: string;
    description?: string | null;
    category?: string | null;
    systemPrompt?: string | null;
    prompt: string;
    temperature?: number;
    suggestedModel?: string | null;
    tags?: string[];
    status?: AiPromptStatus;
    authorId?: string | null;
  }) {
    const slug =
      input.slug ??
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const { data, error } = await supabase
      .from("ai_prompts")
      .insert({
        workspace_id: input.workspaceId ?? null,
        name: input.name,
        slug,
        description: input.description ?? null,
        category: input.category ?? null,
        system_prompt: input.systemPrompt ?? "",
        prompt: input.prompt,
        temperature: input.temperature ?? 0.7,
        suggested_model: input.suggestedModel ?? null,
        tags: input.tags ?? [],
        status: input.status ?? "draft",
        author_id: input.authorId ?? null,
        version: 1,
      })
      .select("*")
      .single();
    if (error) throw error;
    const versionContent = this.buildVersion({
      system_prompt: data.system_prompt,
      prompt: data.prompt,
      temperature: data.temperature,
      suggested_model: data.suggested_model,
      name: data.name,
      description: data.description,
      tags: data.tags,
    });
    await supabase.from("ai_prompt_versions").insert({
      prompt_id: data.id,
      version: 1,
      content: versionContent as unknown as Json,
      created_by: input.authorId ?? null,
    });
    void auditService.record({
      action: "create",
      entity: "ai_prompt",
      entityId: data.id,
      workspaceId: input.workspaceId ?? null,
    });
    return data as AiPrompt;
  }

  async update(
    id: string,
    input: Partial<{
      name: string;
      description: string | null;
      category: string | null;
      systemPrompt: string;
      prompt: string;
      temperature: number;
      suggestedModel: string | null;
      tags: string[];
      status: AiPromptStatus;
      authorId?: string | null;
    }>,
  ) {
    const { data, error } = await supabase
      .from("ai_prompts")
      .update(
        compact({
          name: input.name,
          description: input.description,
          category: input.category,
          system_prompt: input.systemPrompt,
          prompt: input.prompt,
          temperature: input.temperature,
          suggested_model: input.suggestedModel,
          tags: input.tags,
          status: input.status,
        }),
      )
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;

    const version = (data.version ?? 1) + 1;
    const versionContent = this.buildVersion({
      system_prompt: data.system_prompt,
      prompt: data.prompt,
      temperature: data.temperature,
      suggested_model: data.suggested_model,
      name: data.name,
      description: data.description,
      tags: data.tags,
    });
    await supabase.from("ai_prompt_versions").insert({
      prompt_id: id,
      version,
      content: versionContent as unknown as Json,
      created_by: input.authorId ?? null,
    });
    await supabase.from("ai_prompts").update({ version }).eq("id", id);

    void auditService.record({ action: "update", entity: "ai_prompt", entityId: id });
    return data as AiPrompt;
  }

  async listVersions(promptId: string) {
    const { data, error } = await supabase
      .from("ai_prompt_versions")
      .select("*")
      .eq("prompt_id", promptId)
      .order("version", { ascending: false });
    if (error) throw error;
    return data;
  }

  async setStatus(id: string, status: AiPromptStatus) {
    const { data, error } = await supabase
      .from("ai_prompts")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    void auditService.record({
      action: "set_status",
      entity: "ai_prompt",
      entityId: id,
      metadata: { status },
    });
    return data as AiPrompt;
  }

  async delete(id: string) {
    const { error } = await supabase.from("ai_prompts").delete().eq("id", id);
    if (error) throw error;
    void auditService.record({ action: "delete", entity: "ai_prompt", entityId: id });
  }
}

export class AIAgentsService {
  async listForWorkspace(workspaceId?: string | null) {
    let query = supabase.from("ai_agents").select("*").order("name");
    if (workspaceId) query = query.eq("workspace_id", workspaceId);
    else query = query.is("workspace_id", null);
    const { data, error } = await query;
    if (error) throw error;
    return data as AiAgent[];
  }

  async getById(id: string) {
    const { data, error } = await supabase.from("ai_agents").select("*").eq("id", id).single();
    if (error) return null;
    return data as AiAgent;
  }

  async create(input: {
    workspaceId?: string | null;
    name: string;
    key: string;
    objective?: string | null;
    systemPrompt?: string | null;
    tools?: string[];
    model?: string | null;
    temperature?: number;
    status?: "enabled" | "disabled";
  }) {
    const { data, error } = await supabase
      .from("ai_agents")
      .insert({
        workspace_id: input.workspaceId ?? null,
        name: input.name,
        key: input.key,
        objective: input.objective ?? null,
        system_prompt: input.systemPrompt ?? "",
        tools: (input.tools ?? []) as unknown as Json,
        model: input.model ?? null,
        temperature: input.temperature ?? 0.7,
        status: input.status ?? "enabled",
        is_system: false,
      })
      .select("*")
      .single();
    if (error) throw error;
    void auditService.record({
      action: "create",
      entity: "ai_agent",
      entityId: data.id,
      workspaceId: input.workspaceId ?? null,
    });
    return data as AiAgent;
  }

  async update(
    id: string,
    input: Partial<{
      name: string;
      objective: string | null;
      systemPrompt: string;
      tools: string[];
      model: string | null;
      temperature: number;
      status: "enabled" | "disabled";
    }>,
  ) {
    const { data, error } = await supabase
      .from("ai_agents")
      .update(
        compact({
          name: input.name,
          objective: input.objective,
          system_prompt: input.systemPrompt,
          tools: (input.tools ?? []) as unknown as Json,
          model: input.model,
          temperature: input.temperature,
          status: input.status,
        }),
      )
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    void auditService.record({ action: "update", entity: "ai_agent", entityId: id });
    return data as AiAgent;
  }

  async delete(id: string) {
    const { error } = await supabase.from("ai_agents").delete().eq("id", id);
    if (error) throw error;
    void auditService.record({ action: "delete", entity: "ai_agent", entityId: id });
  }
}

export class AIToolsService {
  async list() {
    const { data, error } = await supabase.from("ai_tools").select("*").order("key");
    if (error) throw error;
    return data as AiTool[];
  }
}

export class AIExecutionsService {
  async list(workspaceId?: string | null, limit = 100) {
    let query = supabase
      .from("ai_executions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (workspaceId) query = query.eq("workspace_id", workspaceId);
    const { data, error } = await query;
    if (error) throw error;
    return data as AiExecution[];
  }

  async getById(id: string) {
    const { data, error } = await supabase.from("ai_executions").select("*").eq("id", id).single();
    if (error) return null;
    return data as AiExecution;
  }

  async create(input: {
    workspaceId?: string | null;
    providerId?: string | null;
    agentId?: string | null;
    promptId?: string | null;
    projectId?: string | null;
    documentId?: string | null;
    conversationId?: string | null;
    model?: string;
    input?: Json;
  }) {
    const { data, error } = await supabase
      .from("ai_executions")
      .insert({
        workspace_id: input.workspaceId ?? null,
        provider_id: input.providerId ?? null,
        agent_id: input.agentId ?? null,
        prompt_id: input.promptId ?? null,
        project_id: input.projectId ?? null,
        document_id: input.documentId ?? null,
        conversation_id: input.conversationId ?? null,
        model: input.model ?? null,
        input: input.input ?? ({} as Json),
        status: "pending",
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as AiExecution;
  }

  async finish(
    id: string,
    input: {
      output?: Json;
      status?: AiExecution["status"];
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
      costEstimate?: number;
      latencyMs?: number;
      error?: string | null;
    },
  ) {
    const { data, error } = await supabase
      .from("ai_executions")
      .update(
        compact({
          output: input.output ?? undefined,
          status: input.status,
          prompt_tokens: input.promptTokens ?? undefined,
          completion_tokens: input.completionTokens ?? undefined,
          total_tokens: input.totalTokens ?? undefined,
          cost_estimate: input.costEstimate ?? undefined,
          latency_ms: input.latencyMs ?? undefined,
          error: input.error ?? undefined,
          finished_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
        }),
      )
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as AiExecution;
  }
}

export class AIConversationsService {
  async listForWorkspace(workspaceId?: string | null, projectId?: string | null) {
    let query = supabase
      .from("ai_conversations")
      .select("*")
      .order("updated_at", { ascending: false });
    if (workspaceId) query = query.eq("workspace_id", workspaceId);
    if (projectId) query = query.eq("project_id", projectId);
    else query = query.is("project_id", null);
    const { data, error } = await query;
    if (error) throw error;
    return data as AiConversation[];
  }

  async create(input: {
    workspaceId?: string | null;
    projectId?: string | null;
    title?: string;
    userId?: string;
  }) {
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({
        workspace_id: input.workspaceId ?? null,
        project_id: input.projectId ?? null,
        title: input.title ?? "Nova conversa",
        created_by: input.userId ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as AiConversation;
  }

  async update(
    id: string,
    input: Partial<{ title: string; pinned: boolean; isFavorite: boolean }>,
  ) {
    const { data, error } = await supabase
      .from("ai_conversations")
      .update(
        compact({
          title: input.title,
          pinned: input.pinned,
          is_favorite: input.isFavorite,
        }),
      )
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as AiConversation;
  }

  async delete(id: string) {
    const { error } = await supabase.from("ai_conversations").delete().eq("id", id);
    if (error) throw error;
  }

  async messages(conversationId: string) {
    const { data, error } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data as AiMessage[];
  }

  async addMessage(input: {
    conversationId: string;
    role: "user" | "assistant";
    content: string;
    providerId?: string | null;
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    costEstimate?: number;
  }) {
    const { data, error } = await supabase
      .from("ai_messages")
      .insert({
        conversation_id: input.conversationId,
        role: input.role,
        content: input.content,
        provider_id: input.providerId ?? null,
        model: input.model ?? null,
        input_tokens: input.inputTokens ?? null,
        output_tokens: input.outputTokens ?? null,
        cost_estimate: input.costEstimate ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    await supabase
      .from("ai_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", input.conversationId);
    return data as AiMessage;
  }
}

export class DocumentUploadsService {
  async list(workspaceId: string) {
    const { data, error } = await supabase
      .from("document_uploads")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as DocumentUpload[];
  }

  async listByProject(projectId: string) {
    const { data, error } = await supabase
      .from("document_uploads")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as DocumentUpload[];
  }

  async create(input: {
    workspaceId: string;
    projectId?: string | null;
    libraryId?: string | null;
    storagePath?: string;
    originalName: string;
    mimeType?: string;
    fileKind: DocumentUpload["file_kind"];
    sizeBytes?: number;
    userId?: string;
  }) {
    const { data, error } = await supabase
      .from("document_uploads")
      .insert({
        workspace_id: input.workspaceId,
        project_id: input.projectId ?? null,
        library_id: input.libraryId ?? null,
        storage_path: input.storagePath ?? null,
        original_name: input.originalName,
        mime_type: input.mimeType ?? null,
        file_kind: input.fileKind,
        size_bytes: input.sizeBytes ?? null,
        status: "uploaded",
        created_by: input.userId ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    void auditService.record({
      action: "upload",
      entity: "document_upload",
      entityId: data.id,
      workspaceId: input.workspaceId,
    });
    return data as DocumentUpload;
  }

  async update(
    id: string,
    input: Partial<{
      status: DocumentUpload["status"];
      extractedText: string | null;
      storagePath: string | null;
      error: string | null;
    }>,
  ) {
    const { data, error } = await supabase
      .from("document_uploads")
      .update(
        compact({
          status: input.status,
          extracted_text: input.extractedText,
          storage_path: input.storagePath,
          error: input.error,
        }),
      )
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as DocumentUpload;
  }

  async analyses(uploadId: string) {
    const { data, error } = await supabase
      .from("document_analyses")
      .select("*")
      .eq("upload_id", uploadId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as DocumentAnalysis[];
  }
}

export class KnowledgeSourcesService {
  async listByWorkspace(workspaceId: string) {
    const { data, error } = await supabase
      .from("knowledge_sources")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("title");
    if (error) throw error;
    return data as KnowledgeSource[];
  }

  async create(input: {
    workspaceId: string;
    title: string;
    kind: KnowledgeSource["kind"];
    content?: string;
    userId?: string;
  }) {
    const { data, error } = await supabase
      .from("knowledge_sources")
      .insert({
        workspace_id: input.workspaceId,
        title: input.title,
        kind: input.kind,
        content: input.content ?? null,
        created_by: input.userId ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    void auditService.record({
      action: "create",
      entity: "knowledge_source",
      entityId: data.id,
      workspaceId: input.workspaceId,
    });
    return data as KnowledgeSource;
  }

  async delete(id: string) {
    const { error } = await supabase.from("knowledge_sources").delete().eq("id", id);
    if (error) throw error;
  }
}

export const aiProvidersService = new AIProvidersService();
export const aiModelsService = new AIModelsService();
export const aiPromptsService = new AIPromptsService();
export const aiAgentsService = new AIAgentsService();
export const aiToolsService = new AIToolsService();
export const aiExecutionsService = new AIExecutionsService();
export const aiConversationsService = new AIConversationsService();
export const documentUploadsService = new DocumentUploadsService();
export const knowledgeSourcesService = new KnowledgeSourcesService();

export { randomUUID };
