import { snippetRepo, activityRepo } from "@/repositories";
import { uid } from "@/lib/id";
import { requirePermission } from "./guard";
import type { Snippet } from "@/types/domain";

export const snippetService = {
  async create(input: { name: string; description?: string; language: string; content: string; tags?: string[] }): Promise<Snippet> {
    await requirePermission("snippet", "create");
    const now = Date.now();
    const s: Snippet = {
      id: uid(),
      name: input.name,
      description: input.description,
      language: input.language,
      content: input.content,
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };
    await snippetRepo.put(s);
    await activityRepo.put({
      id: uid(),
      at: now,
      actor: "you",
      action: "created",
      targetType: "snippet",
      targetId: s.id,
      summary: `Created snippet "${s.name}"`,
    });
    return s;
  },
  async update(id: string, patch: Partial<Snippet>): Promise<void> {
    await requirePermission("snippet", "update");
    const s = await snippetRepo.byId(id);
    if (!s) return;
    const { name, description, language, content, tags } = patch;
    const safe: Partial<Snippet> = {};
    if (name !== undefined) safe.name = name;
    if (description !== undefined) safe.description = description;
    if (language !== undefined) safe.language = language;
    if (content !== undefined) safe.content = content;
    if (tags !== undefined) safe.tags = tags;
    await snippetRepo.put({ ...s, ...safe, updatedAt: Date.now() });
  },
  async remove(id: string): Promise<void> {
    await requirePermission("snippet", "delete");
    await snippetRepo.remove(id);
  },
};
