import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      unread_only: z.boolean().default(false),
      category: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.unread_only) query = query.eq("is_read", false);
    if (data.category) query = query.eq("category", data.category);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getUnreadCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count, error } = await context.supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .eq("is_read", false);
    if (error) throw new Error(error.message);
    return count ?? 0;
  });

export const markAsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markAllAsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .eq("is_read", false);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getNotificationPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? {
      user_id: context.userId,
      share_in_app: true, share_email: false,
      comment_in_app: true, comment_email: false,
      mention_in_app: true, mention_email: true,
      change_in_app: true,
      task_due_in_app: true, task_due_email: true,
      reminder_in_app: true, reminder_email: false,
      automation_in_app: true,
      digest_frequency: 'never',
      quiet_hours_start: null, quiet_hours_end: null,
    };
  });

export const saveNotificationPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      share_in_app: z.boolean().optional(),
      share_email: z.boolean().optional(),
      comment_in_app: z.boolean().optional(),
      comment_email: z.boolean().optional(),
      mention_in_app: z.boolean().optional(),
      mention_email: z.boolean().optional(),
      change_in_app: z.boolean().optional(),
      task_due_in_app: z.boolean().optional(),
      task_due_email: z.boolean().optional(),
      reminder_in_app: z.boolean().optional(),
      reminder_email: z.boolean().optional(),
      automation_in_app: z.boolean().optional(),
      digest_frequency: z.enum(['never','daily','weekly']).optional(),
      quiet_hours_start: z.string().nullable().optional(),
      quiet_hours_end: z.string().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notification_preferences")
      .upsert({ user_id: context.userId, ...data });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      user_id: z.string().uuid(),
      category: z.enum(['share','comment','mention','change','task_due','task_overdue','reminder','automation','integration','system']),
      title: z.string().min(1).max(300),
      body: z.string().max(500).nullable().optional(),
      link: z.string().max(500).nullable().optional(),
      metadata: z.record(z.string(), z.unknown()).default({}),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .insert({
        user_id: data.user_id,
        category: data.category,
        title: data.title,
        body: data.body ?? null,
        link: data.link ?? null,
        metadata: data.metadata as never,
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
