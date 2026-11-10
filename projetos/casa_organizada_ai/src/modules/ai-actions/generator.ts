import type { ActionResult, ActionContext, ActionType, PlannerView } from './types';
import { getSystemPrompt } from '@/modules/prompt-manager/prompts.functions';
import { PROMPT_TEMPLATES } from '@/modules/prompt-manager/prompts.functions';

export async function generateRoutine(context: ActionContext): Promise<ActionResult> {
  const prompt = PROMPT_TEMPLATES.createRoutine
    .replace('{tipo}', extractType(context.input))
    .replace('{contexto}', context.input);
  return executeAction('create_routine', context, prompt);
}

export async function generateChecklist(context: ActionContext): Promise<ActionResult> {
  const prompt = PROMPT_TEMPLATES.createChecklist
    .replace('{contexto}', context.input)
    .replace('{categoria}', extractCategory(context.input));
  return executeAction('create_checklist', context, prompt);
}

export async function generateForm(context: ActionContext): Promise<ActionResult> {
  const viewType = extractPlannerView(context.input);
  const prompt = PROMPT_TEMPLATES.createForm
    .replace('{contexto}', context.input)
    .replace('{planner_view}', viewType);
  return executeAction('create_form', context, prompt);
}

export async function generatePlanner(context: ActionContext): Promise<ActionResult> {
  const period = extractPeriod(context.input);
  const prompt = PROMPT_TEMPLATES.createPlanner
    .replace('{periodo}', period)
    .replace('{contexto}', context.input);
  return executeAction('create_planner', context, prompt);
}

export async function suggestOrganization(context: ActionContext): Promise<ActionResult> {
  const prompt = PROMPT_TEMPLATES.suggestOrganization
    .replace('{tarefas}', context.input);
  return executeAction('suggest_organization', context, prompt);
}

export async function generateInsights(context: ActionContext, period: string, data: string): Promise<ActionResult> {
  const prompt = PROMPT_TEMPLATES.generateInsights
    .replace('{periodo}', period)
    .replace('{dados}', data);
  return executeAction('suggest_organization', context, prompt);
}

// Map natural language to action type
export function detectAction(input: string): ActionType {
  const lower = input.toLowerCase();

  if (lower.includes('rotina') && lower.includes('crian') || lower.includes('infant')) return 'create_kids_routine';
  if (lower.includes('rotina') && lower.includes('pet') || lower.includes('cachorro') || lower.includes('gato')) return 'create_pet_routine';
  if (lower.includes('rotina') && lower.includes('limpeza')) return 'create_cleaning_routine';
  if (lower.includes('rotina')) return 'create_routine';
  if (lower.includes('checklist') || lower.includes('lista')) return 'create_checklist';
  if (lower.includes('formulário') || lower.includes('formulario') || lower.includes('planejamento')) return 'create_form';
  if (lower.includes('cronograma') || lower.includes('agenda') || lower.includes('calendário')) return 'create_calendar';
  if (lower.includes('meta') || lower.includes('objetivo')) return 'create_goals';
  if (lower.includes('compras') || lower.includes('mercado') || lower.includes('supermercado')) return 'create_shopping_list';
  if (lower.includes('viagem')) return 'create_travel_plan';
  if (lower.includes('financeiro') || lower.includes('orçamento') || lower.includes('orcamento')) return 'create_financial_plan';
  if (lower.includes('estudo') || lower.includes('escola') || lower.includes('faculdade')) return 'create_study_schedule';
  if (lower.includes('organize') || lower.includes('distribua') || lower.includes('reorganize')) return 'reorganize';
  if (lower.includes('prioridade') || lower.includes('importante') || lower.includes('urgente')) return 'prioritize';
  if (lower.includes('conflito') || lower.includes('sobrecarga')) return 'detect_conflicts';
  if (lower.includes('pausa') || lower.includes('descanso')) return 'suggest_breaks';
  if (lower.includes('horário') || lower.includes('horario') || lower.includes('quando')) return 'suggest_times';

  return 'create_routine';
}

async function executeAction(
  actionType: ActionType,
  context: ActionContext,
  prompt: string,
): Promise<ActionResult> {
  const start = Date.now();
  try {
    const { chat } = await import('@/modules/ai-provider/registry');
    const systemPrompts = await getSystemPrompt();
    const systemPrompt = systemPrompts?.length > 0
      ? systemPrompts.map(p => p.content).join('\n')
      : 'Você é um assistente especializado em organização pessoal e familiar. Responda em português do Brasil.';

    const result = await chat({
      providerSlug: context.providerSlug ?? 'lovable',
      model: context.model ?? 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      temperature: context.temperature ?? 0.7,
      systemPrompt,
    });

    return {
      actionType,
      content: result.content,
      executionTimeMs: Date.now() - start,
      model: result.model,
      provider: result.provider,
    };
  } catch (err) {
    return {
      actionType,
      content: '',
      executionTimeMs: Date.now() - start,
    };
  }
}

// Helper: extract context type from input
function extractType(input: string): string {
  if (input.toLowerCase().includes('diária') || input.toLowerCase().includes('dia')) return 'diária';
  if (input.toLowerCase().includes('semanal') || input.toLowerCase().includes('semana')) return 'semanal';
  if (input.toLowerCase().includes('mensal') || input.toLowerCase().includes('mês')) return 'mensal';
  return 'personalizada';
}

// Helper: extract planner view type from input
function extractPlannerView(input: string): PlannerView {
  const lower = input.toLowerCase();
  if (lower.includes('checklist')) return 'checklist';
  if (lower.includes('semanal') || lower.includes('semana')) return 'weekly';
  if (lower.includes('mensal') || lower.includes('mês')) return 'monthly';
  if (lower.includes('diário') || lower.includes('diario') || lower.includes('dia')) return 'daily';
  if (lower.includes('compras') || lower.includes('mercado')) return 'shopping';
  if (lower.includes('medicamento') || lower.includes('remédio')) return 'medications';
  if (lower.includes('estudo') || lower.includes('escola')) return 'study';
  if (lower.includes('pet') || lower.includes('cachorro') || lower.includes('gato')) return 'pet_routine';
  if (lower.includes('crian') || lower.includes('infant')) return 'kids_routine';
  if (lower.includes('viagem')) return 'agenda';
  if (lower.includes('trabalho') || lower.includes('empresa')) return 'work';
  return 'checklist';
}

// Helper: extract period from input
function extractPeriod(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('semanal') || lower.includes('semana')) return 'semanal';
  if (lower.includes('mensal') || lower.includes('mês') || lower.includes('mes')) return 'mensal';
  if (lower.includes('diário') || lower.includes('diario') || lower.includes('dia')) return 'diário';
  if (lower.includes('anual') || lower.includes('ano')) return 'anual';
  return 'semanal';
}

// Helper: extract category from input
function extractCategory(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('casa') || lower.includes('doméstico')) return 'casa';
  if (lower.includes('pet') || lower.includes('cachorro') || lower.includes('gato')) return 'pets';
  if (lower.includes('crian') || lower.includes('infant') || lower.includes('filho')) return 'crianças';
  if (lower.includes('estudo') || lower.includes('escola') || lower.includes('faculdade')) return 'estudos';
  if (lower.includes('trabalho') || lower.includes('empresa') || lower.includes('profissional')) return 'trabalho';
  if (lower.includes('saúde') || lower.includes('saude') || lower.includes('medicamento')) return 'saúde';
  if (lower.includes('viagem')) return 'viagens';
  if (lower.includes('compras') || lower.includes('mercado')) return 'compras';
  if (lower.includes('academia') || lower.includes('treino')) return 'academia';
  return 'geral';
}
