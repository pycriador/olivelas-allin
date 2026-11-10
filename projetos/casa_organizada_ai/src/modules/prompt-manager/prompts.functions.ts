import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listPrompts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ai_prompts")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getPrompt = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("ai_prompts")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const createPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      name: z.string().min(1).max(200),
      slug: z.string().min(1).max(200),
      content: z.string().min(1).max(10000),
      category: z.enum(['system','personal','template','action','insight','general']).default('general'),
      language: z.string().min(2).max(10).default('pt-BR'),
      tags: z.array(z.string()).default([]),
      is_system: z.boolean().default(false),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("ai_prompts")
      .insert({
        name: data.name,
        slug: data.slug,
        content: data.content,
        category: data.category,
        language: data.language,
        tags: data.tags,
        is_system: data.is_system,
        author_id: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updatePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(200).optional(),
      content: z.string().min(1).max(10000).optional(),
      category: z.enum(['system','personal','template','action','insight','general']).optional(),
      language: z.string().min(2).max(10).optional(),
      tags: z.array(z.string()).optional(),
      is_active: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.content !== undefined) {
      const { data: current } = await context.supabase
        .from("ai_prompts")
        .select("version")
        .eq("id", data.id)
        .maybeSingle();
      update.content = data.content;
      update.version = (current?.version ?? 0) + 1;
    }
    if (data.category !== undefined) update.category = data.category;
    if (data.language !== undefined) update.language = data.language;
    if (data.tags !== undefined) update.tags = data.tags;
    if (data.is_active !== undefined) update.is_active = data.is_active;
    const { error } = await context.supabase
      .from("ai_prompts")
      .update(update as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ai_prompts")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getPromptsByCategory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ category: z.enum(['system','personal','template','action','insight','general']) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("ai_prompts")
      .select("*")
      .eq("category", data.category)
      .eq("is_active", true)
      .order("name");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getSystemPrompt = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("ai_prompts")
      .select("*")
      .eq("category", "system")
      .eq("is_active", true)
      .eq("language", "pt-BR")
      .order("version", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// Prompt templates for common use cases
export const PROMPT_TEMPLATES = {
  createRoutine: `Crie uma rotina {tipo} para {contexto}.
A rotina deve incluir:
- Horários sugeridos
- Atividades principais
- Duração estimada
- Dicas de organização

Formato: checklist ou cronograma semanal.
Idioma: português do Brasil.`,

  createChecklist: `Crie uma checklist para {contexto}.
Inclua:
- Itens essenciais
- Itens opcionais
- Frequência sugerida
- Categoria: {categoria}

Formato: lista organizada por prioridade.`,

  createForm: `Crie um formulário/planejamento para {contexto}.
O formulário deve ter:
- Título sugestivo
- Campos relevantes
- Organização lógica
- Tipo de visualização: {planner_view}

Gere o schema JSON seguindo este formato:
{"pages":[{"id":"p1","title":"...","fields":[...]}],"logic":[],"settings":{"autosave":true}}`,

  createPlanner: `Crie um planejamento {periodo} para {contexto}.
Inclua:
- Metas principais
- Tarefas diárias/semanais
- Prioridades
- Horários sugeridos
- Pausas recomendadas`,

  suggestOrganization: `Analise estas tarefas e sugira uma organização:
{tarefas}
Considere:
- Melhor distribuição ao longo da semana
- Agrupamento por similaridade
- Identificação de conflitos
- Priorização
- Balanceamento da carga diária`,

  generateInsights: `Analise os seguintes dados do usuário e gere um resumo {periodo}:
Dados: {dados}
Gere:
- Resumo das atividades
- Indicadores de produtividade
- Pendências identificadas
- Sugestões de melhoria
- Categorias mais utilizadas`,
} as const;
