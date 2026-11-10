import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PdfLayout } from "./layout";

const layoutJson = z.custom<PdfLayout>((v) => typeof v === "object" && v !== null);

export const listPdfLayouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ formId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("pdf_layouts")
      .select("id, name, config, updated_at")
      .eq("form_id", data.formId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const savePdfLayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid().optional(),
      formId: z.string().uuid(),
      name: z.string().min(1).max(120),
      config: layoutJson,
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("pdf_layouts")
        .update({ name: data.name, config: data.config as unknown as never })
        .eq("id", data.id)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await context.supabase
      .from("pdf_layouts")
      .insert({
        form_id: data.formId,
        owner_id: context.userId,
        name: data.name,
        config: data.config as unknown as never,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deletePdfLayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("pdf_layouts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });