import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getActiveCollaborators = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ entity_type: z.string(), entity_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: sessions, error } = await context.supabase
      .from("collaboration_sessions")
      .select("user_id, status, last_seen_at, cursor_pos")
      .eq("entity_type", data.entity_type)
      .eq("entity_id", data.entity_id)
      .neq("status", "disconnected")
      .gte("last_seen_at", new Date(Date.now() - 60000).toISOString());
    if (error) throw new Error(error.message);
    if (!sessions || sessions.length === 0) return [];
    const userIds = sessions.map(s => s.user_id);
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, full_name, avatar_url, avatar_type")
      .in("id", userIds);
    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
    return sessions.map(s => ({
      userId: s.user_id,
      fullName: (profileMap.get(s.user_id) as { full_name?: string } | undefined)?.full_name ?? null,
      avatarUrl: (profileMap.get(s.user_id) as { avatar_url?: string } | undefined)?.avatar_url ?? null,
      avatarType: (profileMap.get(s.user_id) as { avatar_type?: string } | undefined)?.avatar_type ?? 'none',
      status: s.status,
      lastSeenAt: s.last_seen_at,
    }));
  });

export const updatePresence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      entity_type: z.string(),
      entity_id: z.string().uuid(),
      status: z.enum(['active','idle','away','disconnected']),
      cursor_pos: z.record(z.string(), z.unknown()).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (data.status === 'disconnected') {
      await context.supabase
        .from("collaboration_sessions")
        .delete()
        .eq("entity_type", data.entity_type)
        .eq("entity_id", data.entity_id)
        .eq("user_id", context.userId);
    } else {
      await context.supabase
        .from("collaboration_sessions")
        .upsert({
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          user_id: context.userId,
          status: data.status,
          cursor_pos: (data.cursor_pos ?? null) as never,
          last_seen_at: new Date().toISOString(),
        }, { onConflict: "entity_type,entity_id,user_id" });
    }
    return { ok: true };
  });

export const recordTimelineEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      entity_type: z.string(),
      entity_id: z.string().uuid(),
      action: z.string(),
      description: z.string().max(500).nullable().optional(),
      metadata: z.record(z.string(), z.unknown()).default({}),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("timeline_events")
      .insert({
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        user_id: context.userId,
        action: data.action,
        description: data.description ?? null,
        metadata: data.metadata as never,
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getTimeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      entity_type: z.string(),
      entity_id: z.string().uuid(),
      limit: z.number().int().min(1).max(100).default(50),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: events, error } = await context.supabase
      .from("timeline_events")
      .select("*, user:user_id(full_name, avatar_url, avatar_type)")
      .eq("entity_type", data.entity_type)
      .eq("entity_id", data.entity_id)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return events ?? [];
  });
