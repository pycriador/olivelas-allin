import { getStorage } from "@/core/providers/storage";
import { mockProvider, getAIProvider } from "./providers";
import { aiHistoryService } from "./ai-history";
import { aiAuditService } from "./ai-audit";
import type { PlaygroundSession, AIProviderType, AIModelType, AIPlaygroundHistory } from "./types";

const COLLECTION = "ai_playground_history";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const aiPlayground = {
  async run(data: {
    provider: AIProviderType;
    model: AIModelType;
    prompt: string;
    temperature?: number;
    maxTokens?: number;
    type?: PlaygroundSession["status"];
    userId?: string;
  }): Promise<PlaygroundSession> {
    const session: PlaygroundSession = {
      id: uid(),
      provider: data.provider,
      model: data.model,
      prompt: data.prompt,
      temperature: data.temperature ?? 0.7,
      maxTokens: data.maxTokens ?? 1000,
      response: "",
      processingTime: 0,
      tokensUsed: 0,
      status: "processing",
      createdAt: new Date().toISOString(),
    };

    const startTime = Date.now();

    try {
      const provider = getAIProvider(data.provider);
      const result = await provider.generate(data.prompt, {
        temperature: session.temperature,
        maxTokens: session.maxTokens,
      });

      session.response = result.text;
      session.processingTime = Date.now() - startTime;
      session.tokensUsed = result.tokensUsed;
      session.status = "completed";

      await aiHistoryService.create({
        type: "prompt",
        provider: data.provider,
        model: data.model,
        prompt: data.prompt,
        response: result.text,
        processingTime: session.processingTime,
        tokensUsed: result.tokensUsed,
        confidence: result.confidence,
        userId: data.userId,
        status: "success",
      });

      await aiAuditService.create({
        type: "prompt",
        provider: data.provider,
        model: data.model,
        processingTime: session.processingTime,
        userId: data.userId,
        result: "Playground execution completed",
        confidence: result.confidence,
        status: "success",
      });

      const historyEntry: AIPlaygroundHistory = {
        id: uid(),
        provider: data.provider,
        model: data.model,
        prompt: data.prompt,
        response: result.text,
        temperature: session.temperature,
        processingTime: session.processingTime,
        tokensUsed: result.tokensUsed,
        createdAt: new Date().toISOString(),
      };

      await getStorage().create<AIPlaygroundHistory>(COLLECTION, historyEntry);
    } catch (error) {
      session.status = "error";
      session.error = error instanceof Error ? error.message : "Playground execution failed";
      session.processingTime = Date.now() - startTime;
    }

    return session;
  },

  async history(limit = 50): Promise<AIPlaygroundHistory[]> {
    const all = await getStorage().findAll<AIPlaygroundHistory>(COLLECTION);
    return all
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .slice(0, limit);
  },

  async clearHistory(): Promise<void> {
    const all = await getStorage().findAll<AIPlaygroundHistory>(COLLECTION);
    for (const item of all) {
      await getStorage().delete(COLLECTION, item.id);
    }
  },
};
