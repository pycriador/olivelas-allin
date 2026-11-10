import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listAutomations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("automations")
      .select("*, triggers:automation_triggers(*), conditions:automation_conditions(*), actions:automation_actions(*)")
      .eq("owner_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAutomation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("automations")
      .select("*, triggers:automation_triggers(*), conditions:automation_conditions(*), actions:automation_actions(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const createAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      name: z.string().min(1).max(200),
      description: z.string().max(1000).nullable().optional(),
      triggers: z.array(z.object({
        trigger_type: z.string(),
        config: z.record(z.string(), z.unknown()).default({}),
      })).default([]),
      conditions: z.array(z.object({
        operator: z.enum(['and','or','not']).default('and'),
        conditions: z.array(z.record(z.string(), z.unknown())).default([]),
      })).default([]),
      actions: z.array(z.object({
        action_type: z.string(),
        config: z.record(z.string(), z.unknown()).default({}),
      })).default([]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: auto, error } = await context.supabase
      .from("automations")
      .insert({
        owner_id: context.userId,
        name: data.name,
        description: data.description ?? null,
        config: {},
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    if (data.triggers.length > 0) {
      await context.supabase.from("automation_triggers").insert(
        data.triggers.map((t, i) => ({ automation_id: auto.id, trigger_type: t.trigger_type, config: t.config, sort: i }) as never)
      );
    }
    if (data.conditions.length > 0) {
      await context.supabase.from("automation_conditions").insert(
        data.conditions.map((c, i) => ({ automation_id: auto.id, operator: c.operator, conditions: c.conditions, sort: i }) as never)
      );
    }
    if (data.actions.length > 0) {
      await context.supabase.from("automation_actions").insert(
        data.actions.map((a, i) => ({ automation_id: auto.id, action_type: a.action_type, config: a.config, sort: i }) as never)
      );
    }
    return auto;
  });

export const updateAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(1000).nullable().optional(),
      is_active: z.boolean().optional(),
      config: z.record(z.string(), z.unknown()).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.is_active !== undefined) update.is_active = data.is_active;
    if (data.config !== undefined) update.config = data.config;
    const { error } = await context.supabase
      .from("automations")
      .update(update as never)
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("automations")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAutomationLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ automation_id: z.string().uuid(), limit: z.number().int().min(1).max(100).default(20) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: logs, error } = await context.supabase
      .from("automation_logs")
      .select("*")
      .eq("automation_id", data.automation_id)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return logs ?? [];
  });

export const toggleAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("automations")
      .update({ is_active: data.active })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
