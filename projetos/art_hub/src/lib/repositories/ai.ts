import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AISettingsRow = Database["public"]["Tables"]["ai_settings"]["Row"];
export type AIPromptRow = Database["public"]["Tables"]["ai_prompts"]["Row"];
export type AIPromptVersionRow = Database["public"]["Tables"]["ai_prompt_versions"]["Row"];
export type AIHistoryRow = Database["public"]["Tables"]["ai_processing_history"]["Row"];
export type AIMetadataRow = Database["public"]["Tables"]["artwork_ai_metadata"]["Row"];
export type AIQueueRow = Database["public"]["Tables"]["ai_queue"]["Row"];

export const aiSettingsRepo = {
  async get() {
    const { data, error } = await supabase.from("ai_settings").select("*").maybeSingle();
    if (error) throw error;
    return data;
  },
  async update(patch: Partial<AISettingsRow>) {
    const current = await this.get();
    if (!current) throw new Error("Configurações de IA não inicializadas.");
    const { data, error } = await supabase
      .from("ai_settings")
      .update(patch)
      .eq("id", current.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

export const aiPromptsRepo = {
  async list() {
    const { data, error } = await supabase.from("ai_prompts").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },
  async getBySlug(slug: string) {
    const { data, error } = await supabase.from("ai_prompts").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return data;
  },
  async create(fields: { name: string; slug: string; content: string; default_content?: string; created_by?: string | null }) {
    const { data, error } = await supabase
      .from("ai_prompts")
      .insert({
        name: fields.name,
        slug: fields.slug,
        content: fields.content,
        default_content: fields.default_content ?? fields.content,
        current_version: 1,
      })
      .select()
      .single();
    if (error) throw error;
    const { error: vErr } = await supabase.from("ai_prompt_versions").insert({
      prompt_id: data.id,
      version: 1,
      content: fields.content,
      note: "Versão inicial",
      created_by: fields.created_by ?? null,
    });
    if (vErr) throw vErr;
    return data;
  },
  async remove(id: string) {
    const { error } = await supabase.from("ai_prompts").delete().eq("id", id);
    if (error) throw error;
  },
  async update(id: string, patch: Partial<{ name: string; slug: string }>) {
    const { data, error } = await supabase.from("ai_prompts").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  async versions(promptId: string) {
    const { data, error } = await supabase
      .from("ai_prompt_versions")
      .select("*")
      .eq("prompt_id", promptId)
      .order("version", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  async saveNewVersion(promptId: string, content: string, note: string | null, userId: string | undefined) {
    const { data: prompt, error: pErr } = await supabase
      .from("ai_prompts")
      .select("current_version")
      .eq("id", promptId)
      .single();
    if (pErr) throw pErr;
    const nextVersion = (prompt.current_version ?? 0) + 1;
    const { error: vErr } = await supabase.from("ai_prompt_versions").insert({
      prompt_id: promptId,
      version: nextVersion,
      content,
      note,
      created_by: userId ?? null,
    });
    if (vErr) throw vErr;
    const { data, error } = await supabase
      .from("ai_prompts")
      .update({ content, current_version: nextVersion, updated_by: userId ?? null })
      .eq("id", promptId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async restoreVersion(promptId: string, versionId: string, userId: string | undefined) {
    const { data: version, error: vErr } = await supabase
      .from("ai_prompt_versions")
      .select("content")
      .eq("id", versionId)
      .single();
    if (vErr) throw vErr;
    return this.saveNewVersion(promptId, version.content, "Restaurada de versão anterior", userId);
  },
  async resetToDefault(promptId: string, userId: string | undefined) {
    const { data: prompt } = await supabase
      .from("ai_prompts")
      .select("default_content")
      .eq("id", promptId)
      .single();
    if (!prompt) throw new Error("Prompt não encontrado.");
    return this.saveNewVersion(promptId, prompt.default_content, "Restaurado ao padrão", userId);
  },
};

export const aiHistoryRepo = {
  async list(params: { page?: number; pageSize?: number; status?: string | null; artworkId?: string | null } = {}) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let q = supabase
      .from("ai_processing_history")
      .select("*, artwork:artworks(id, title, code)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (params.status) q = q.eq("status", params.status as Database["public"]["Enums"]["ai_job_status"]);
    if (params.artworkId) q = q.eq("artwork_id", params.artworkId);
    const { data, error, count } = await q;
    if (error) throw error;
    return { rows: data ?? [], total: count ?? 0 };
  },
  async statsLast24h() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("ai_processing_history")
      .select("status, duration_ms, tokens_prompt, tokens_completion")
      .gte("created_at", since);
    if (error) throw error;
    const rows = data ?? [];
    const total = rows.length;
    const ok = rows.filter((r) => r.status === "completed").length;
    const err = rows.filter((r) => r.status === "error").length;
    const avgMs = rows.length
      ? Math.round(rows.reduce((acc, r) => acc + (r.duration_ms ?? 0), 0) / rows.length)
      : 0;
    const tokens = rows.reduce(
      (acc, r) => acc + (r.tokens_prompt ?? 0) + (r.tokens_completion ?? 0),
      0,
    );
    return { total, ok, err, avgMs, tokens, successRate: total ? Math.round((ok / total) * 100) : 0 };
  },
};

export const aiMetadataRepo = {
  async getByArtwork(artworkId: string) {
    const { data, error } = await supabase
      .from("artwork_ai_metadata")
      .select("*")
      .eq("artwork_id", artworkId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  async update(id: string, patch: Partial<AIMetadataRow>) {
    const { data, error } = await supabase
      .from("artwork_ai_metadata")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
