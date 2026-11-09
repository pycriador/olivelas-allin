import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { rateLimitAiAnalysis, rateLimitSemanticSearch } from "@/lib/security/rate-limit-middleware";
import { z } from "zod";
import { chatCompletion, createEmbedding, parseJsonLoose } from "./gateway.server";
import {
  artworkMetadataSchema,
  buildEmbeddingText,
  renderPrompt,
  type ArtworkMetadata,
} from "./artwork-metadata-schema";

const inputSchema = z.object({
  artworkIds: z.array(z.string().uuid()).min(1).max(50),
  promptSlug: z.string().optional(),
  skipExisting: z.boolean().optional(),
});

interface JobOutcome {
  artworkId: string;
  ok: boolean;
  historyId?: string;
  error?: string;
  durationMs?: number;
}

export const analyzeArtworks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, rateLimitAiAnalysis])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Auth: only admins
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso negado.");

    // Load settings + prompt
    const { data: settings } = await supabase.from("ai_settings").select("*").maybeSingle();
    if (!settings || !settings.enabled) throw new Error("IA desativada nas configurações.");

    const slug = data.promptSlug ?? settings.active_prompt_slug;
    const { data: prompt, error: pErr } = await supabase
      .from("ai_prompts")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!prompt) throw new Error(`Prompt "${slug}" não encontrado.`);

    const rendered = renderPrompt(prompt.content, {
      language: settings.language,
      max_words: settings.max_words,
    });

    const maxRetries = settings.max_retries ?? 3;
    const outcomes: JobOutcome[] = [];

    for (const artworkId of data.artworkIds) {
      const startedAt = new Date();
      const t0 = Date.now();
      let historyId: string | undefined;
      try {
        // Skip existing?
        if (data.skipExisting) {
          const { data: existing } = await supabase
            .from("artwork_ai_metadata")
            .select("id")
            .eq("artwork_id", artworkId)
            .maybeSingle();
          if (existing) {
            outcomes.push({ artworkId, ok: true, error: "já existia (pulado)" });
            continue;
          }
        }

        // Load artwork + collection
        const { data: artwork, error: aErr } = await supabase
          .from("artworks")
          .select("*, collection:collections(name, slug)")
          .eq("id", artworkId)
          .single();
        if (aErr) throw aErr;

        // Public URL for image
        if (!artwork.image_url) throw new Error("Arte sem imagem.");
        const [bucket, path] = artwork.image_url.split("::");
        if (!bucket || !path) throw new Error("image_url malformada.");
        const imageUrl = `${supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl}`;
        if (!imageUrl) throw new Error("Falha ao gerar URL da imagem.");

        // Insert history row (processing)
        const { data: history, error: hErr } = await supabase
          .from("ai_processing_history")
          .insert({
            artwork_id: artworkId,
            user_id: userId,
            prompt_slug: slug,
            prompt_content: rendered,
            model: settings.chat_model,
            status: "processing",
            started_at: startedAt.toISOString(),
          })
          .select("id")
          .single();
        if (hErr) throw hErr;
        historyId = history.id;

        // Call gateway with retry
        let lastError: Error | null = null;
        let meta: ArtworkMetadata | null = null;
        let completion: Awaited<ReturnType<typeof chatCompletion>> | null = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            completion = await chatCompletion({
              model: settings.chat_model,
              temperature: Number(settings.temperature) + (attempt - 1) * 0.1 || 0.4,
              timeoutMs: settings.timeout_ms ?? 60_000,
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: rendered },
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `Analise esta arte. Título atual: "${artwork.title}". Coleção: "${artwork.collection?.name ?? "-"}".`,
                    },
                    { type: "image_url", image_url: { url: imageUrl } },
                  ],
                },
              ],
            });

            const raw = parseJsonLoose(completion.text);
            meta = artworkMetadataSchema.parse(raw);
            break; // success
          } catch (attemptErr) {
            lastError = attemptErr instanceof Error ? attemptErr : new Error(String(attemptErr));
            if (attempt < maxRetries) {
              const backoff = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
              await new Promise((r) => setTimeout(r, backoff));
            }
          }
        }
        if (!meta) throw lastError ?? new Error("Falha após todas as tentativas.");

        // Upsert metadata (preserve manually edited fields)
        const { data: existing } = await supabase
          .from("artwork_ai_metadata")
          .select("id, manually_edited")
          .eq("artwork_id", artworkId)
          .maybeSingle();

        const manuallyEdited = (existing?.manually_edited ?? {}) as Record<string, boolean>;
        const payload: Record<string, unknown> = {
          artwork_id: artworkId,
          raw_json: meta,
          last_generated_at: new Date().toISOString(),
          model: settings.chat_model,
        };
        for (const [key, value] of Object.entries(meta)) {
          if (manuallyEdited[key]) continue; // don't overwrite manual edits
          payload[key] = value;
        }

        if (existing) {
          const { error: uErr } = await supabase
            .from("artwork_ai_metadata")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .update(payload as any)
            .eq("id", existing.id);
          if (uErr) throw uErr;
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: iErr } = await supabase.from("artwork_ai_metadata").insert(payload as any);
          if (iErr) throw iErr;
        }

        // Update artwork title and description from AI suggestion
        if (meta.title_suggested || meta.description) {
          const { error: aUpErr } = await supabase
            .from("artworks")
            .update({
              ...(meta.title_suggested ? { title: meta.title_suggested } : {}),
              ...(meta.description ? { description: meta.description } : {}),
            })
            .eq("id", artworkId);
          if (aUpErr) console.warn("[ai] failed to update artwork title/desc", aUpErr);
        }

        // Embedding (best-effort, non-blocking failure)
        try {
          const embedText = buildEmbeddingText(meta, artwork.title);
          if (embedText) {
            const vector = await createEmbedding(settings.embedding_model, embedText);
            if (vector) {
              await supabase.from("artwork_embeddings").upsert(
                {
                  artwork_id: artworkId,
                  content: embedText,
                  embedding: vector as unknown as string,
                  model: settings.embedding_model,
                },
                { onConflict: "artwork_id" },
              );
            }
          }
        } catch (embedErr) {
          console.warn("[ai] embedding failed", embedErr);
        }

        // Update history: completed
        const durationMs = Date.now() - t0;
        await supabase
          .from("ai_processing_history")
          .update({
            status: "completed",
            result_json: meta,
            duration_ms: durationMs,
            tokens_prompt: completion?.usage?.prompt_tokens ?? null,
            tokens_completion: completion?.usage?.completion_tokens ?? null,
            finished_at: new Date().toISOString(),
          })
          .eq("id", historyId);

        outcomes.push({ artworkId, ok: true, historyId, durationMs });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        if (historyId) {
          await supabase
            .from("ai_processing_history")
            .update({
              status: "error",
              error_message: message,
              duration_ms: Date.now() - t0,
              finished_at: new Date().toISOString(),
            })
            .eq("id", historyId);
        } else {
          await supabase.from("ai_processing_history").insert({
            artwork_id: artworkId,
            user_id: userId,
            prompt_slug: slug,
            status: "error",
            error_message: message,
            model: settings.chat_model,
            started_at: startedAt.toISOString(),
            finished_at: new Date().toISOString(),
            duration_ms: Date.now() - t0,
          });
        }
        outcomes.push({ artworkId, ok: false, historyId, error: message });
      }
    }

    return { outcomes };
  });

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  limit: z.number().min(1).max(50).optional(),
});

export const semanticSearchArtworks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth, rateLimitSemanticSearch])
  .inputValidator((data: unknown) => searchSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: settings } = await supabase
      .from("ai_settings")
      .select("embedding_model")
      .maybeSingle();
    const model = settings?.embedding_model ?? "google/gemini-embedding-2";

    const vec = await createEmbedding(model, data.query);
    if (!vec) return { rows: [] as Array<{ artwork_id: string; similarity: number }> };

    const { data: rows, error } = await supabase.rpc("search_artworks_semantic", {
      query_embedding: vec as unknown as string,
      match_count: data.limit ?? 20,
    });
    if (error) throw error;
    return { rows: (rows ?? []) as Array<{ artwork_id: string; similarity: number }> };
  });
