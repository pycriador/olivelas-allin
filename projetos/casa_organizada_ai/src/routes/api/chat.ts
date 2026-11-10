import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { getModel, DEFAULT_MODEL } from "@/modules/ai/provider";
import { buildSystemPrompt } from "@/modules/ai/prompts";
import type { Database } from "@/integrations/supabase/types";

type ChatBody = {
  messages?: UIMessage[];
  id?: string;
  threadId?: string;
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatBody;
        const messages = body.messages;
        const threadId = body.threadId ?? body.id;

        if (!Array.isArray(messages)) {
          return new Response("Missing messages", { status: 400 });
        }
        if (!threadId) {
          return new Response("Missing threadId", { status: 400 });
        }

        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice("Bearer ".length);

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Supabase not configured", { status: 500 });
        }
        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: userData, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !userData.user) {
          return new Response("Unauthorized", { status: 401 });
        }
        const userId = userData.user.id;

        // Ensure thread belongs to user
        const { data: thread, error: threadErr } = await supabase
          .from("ai_threads")
          .select("id, title, model")
          .eq("id", threadId)
          .eq("user_id", userId)
          .maybeSingle();
        if (threadErr || !thread) {
          return new Response("Thread not found", { status: 404 });
        }

        // Load user settings
        const { data: settings } = await supabase
          .from("ai_settings")
          .select("model, temperature, system_prompt")
          .eq("user_id", userId)
          .maybeSingle();

        const modelId = settings?.model ?? DEFAULT_MODEL;
        const model = getModel(modelId);
        const systemPrompt = buildSystemPrompt(settings?.system_prompt);

        // Persist the last user message (assumes AI SDK appended it)
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        if (lastUser) {
          await supabase.from("ai_messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "user",
            parts: lastUser.parts as unknown as never,
            message_id: lastUser.id,
          });
        }

        // Auto-title: if thread is still "Nova conversa" and we have a user msg, use its first ~50 chars
        if (thread.title === "Nova conversa" && lastUser) {
          const text = lastUser.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join(" ")
            .trim();
          if (text) {
            const title = text.slice(0, 60);
            await supabase
              .from("ai_threads")
              .update({ title, model: modelId })
              .eq("id", threadId);
          }
        }

        const result = streamText({
          model,
          system: systemPrompt,
          messages: await convertToModelMessages(messages),
          temperature: Number(settings?.temperature ?? 0.7),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ responseMessage }) => {
            try {
              await supabase.from("ai_messages").insert({
                thread_id: threadId,
                user_id: userId,
                role: "assistant",
                parts: responseMessage.parts as unknown as never,
                model: modelId,
                message_id: responseMessage.id,
              });
              await supabase
                .from("ai_threads")
                .update({ updated_at: new Date().toISOString(), model: modelId })
                .eq("id", threadId);
            } catch (err) {
              console.error("[chat] failed to persist assistant msg", err);
            }
          },
        });
      },
    },
  },
});