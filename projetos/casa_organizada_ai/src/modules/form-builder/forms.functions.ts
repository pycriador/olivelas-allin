// Server functions for the Form Builder — the ONLY writeable surface.
// Every call runs through requireSupabaseAuth so RLS scopes to owner_id.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { FormSchema } from "./types";

const schemaJson = z.custom<FormSchema>((v) => typeof v === "object" && v !== null);

export const listForms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("forms")
      .select("id, title, description, category, emoji, planner_view, status, privacy, is_favorite, is_archived, updated_at, created_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getForm = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("forms")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Formulário não encontrado");
    return row;
  });

export const createForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ title: z.string().min(1).max(200).default("Sem título") }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("forms")
      .insert({ owner_id: context.userId, title: data.title })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const saveForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(200),
      schema: schemaJson,
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("forms")
      .update({ title: data.title, schema: data.schema as unknown as never })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("forms").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const duplicateForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: src, error } = await context.supabase
      .from("forms")
      .select("title, description, category, emoji, planner_view, schema, theme_overrides")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!src) throw new Error("Formulário não encontrado");
    const { data: row, error: insErr } = await context.supabase
      .from("forms")
      .insert({ ...src, owner_id: context.userId, title: `${src.title} (cópia)` })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);
    return row;
  });

export const publishFormVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      version: z.string().min(1).max(32),
      notes: z.string().max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: form, error } = await context.supabase
      .from("forms")
      .select("schema")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!form) throw new Error("Formulário não encontrado");
    const { data: v, error: vErr } = await context.supabase
      .from("form_versions")
      .insert({
        form_id: data.id,
        version: data.version,
        schema: form.schema,
        notes: data.notes ?? null,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (vErr) throw new Error(vErr.message);
    await context.supabase
      .from("forms")
      .update({ current_version_id: v.id, status: "published" })
      .eq("id", data.id);
    return v;
  });