import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listComments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      entity_type: z.string(),
      entity_id: z.string().uuid(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: comments, error } = await context.supabase
      .from("comments")
      .select("*, author:author_id(full_name, avatar_url, avatar_type), mentions:comment_mentions(user_id)")
      .eq("entity_type", data.entity_type)
      .eq("entity_id", data.entity_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return comments ?? [];
  });

export const createComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      entity_type: z.string(),
      entity_id: z.string().uuid(),
      parent_id: z.string().uuid().nullable().optional(),
      content: z.string().min(1).max(5000),
      mentions: z.array(z.string().uuid()).default([]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: comment, error } = await context.supabase
      .from("comments")
      .insert({
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        parent_id: data.parent_id ?? null,
        author_id: context.userId,
        content: data.content,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Insert mentions
    if (data.mentions.length > 0) {
      await context.supabase
        .from("comment_mentions")
        .insert(data.mentions.map(userId => ({
          comment_id: comment.id,
          user_id: userId,
        })));
    }

    // Create notifications for mentioned users
    for (const userId of data.mentions) {
      await context.supabase
        .from("notifications")
        .insert({
          user_id: userId,
          category: 'mention',
          title: 'Você foi mencionado',
          body: data.content.slice(0, 200),
          link: `/${data.entity_type}/${data.entity_id}`,
          metadata: { comment_id: comment.id, entity_type: data.entity_type, entity_id: data.entity_id },
        }).maybeSingle();
    }

    return comment;
  });

export const updateComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      content: z.string().min(1).max(5000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("comments")
      .update({ content: data.content, edited_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("author_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("comments")
      .delete()
      .eq("id", data.id)
      .eq("author_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resolveComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), resolved: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("comments")
      .update({
        is_resolved: data.resolved,
        resolved_by: data.resolved ? context.userId : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Helper: extract @mentions from text
export function extractMentions(text: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const matches = [...text.matchAll(mentionRegex)];
  return matches.map(m => m[1]);
}
