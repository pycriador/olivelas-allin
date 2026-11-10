import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getSyncQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sync_queue")
      .select("*")
      .eq("user_id", context.userId)
      .neq("status", "synced")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addToSyncQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      entity_type: z.string(),
      entity_id: z.string().uuid().nullable().optional(),
      action: z.enum(['create','update','delete']),
      payload: z.record(z.string(), z.unknown()),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("sync_queue")
      .insert({
        user_id: context.userId,
        entity_type: data.entity_type,
        entity_id: data.entity_id ?? null,
        action: data.action,
        payload: data.payload as never,
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markSyncComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(['synced','conflict','error']),
      conflict_data: z.record(z.string(), z.unknown()).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const update: Record<string, unknown> = {
      status: data.status,
      synced_at: data.status === 'synced' ? new Date().toISOString() : null,
    };
    if (data.conflict_data !== undefined) update.conflict_data = data.conflict_data;
    await context.supabase
      .from("sync_queue")
      .update(update as never)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    return { ok: true };
  });
