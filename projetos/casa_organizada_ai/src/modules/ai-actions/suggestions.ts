import type { ActionContext, ActionResult } from './types';

export interface Suggestion {
  id: string;
  type: 'routine' | 'checklist' | 'planner' | 'organization' | 'insight';
  title: string;
  description: string;
  context: string;
  action: () => Promise<ActionResult>;
}

export function getContextualSuggestions(input: string): Suggestion[] {
  const lower = input.toLowerCase();
  const suggestions: Suggestion[] = [];

  if (lower.includes('crian') || lower.includes('filho')) {
    suggestions.push({
      id: 'kids-morning',
      type: 'routine',
      title: 'Rotina matutina infantil',
      description: 'Rotina para crianças antes da escola',
      context: 'Rotina matutina para crianças em idade escolar',
      action: async () => ({ actionType: 'create_kids_routine', content: '' }),
    });
  }

  if (lower.includes('pet') || lower.includes('cachorro') || lower.includes('gato')) {
    suggestions.push({
      id: 'pet-daily',
      type: 'routine',
      title: 'Rotina diária para pets',
      description: 'Alimentação, passeios e cuidados',
      context: 'Rotina diária para pets',
      action: async () => ({ actionType: 'create_pet_routine', content: '' }),
    });
  }

  if (lower.includes('tarefa') || lower.includes('atividade') || lower.includes('afazer')) {
    suggestions.push({
      id: 'organize-tasks',
      type: 'organization',
      title: 'Organizar tarefas',
      description: 'Distribuir atividades pela semana',
      context: input,
      action: async () => ({ actionType: 'reorganize', content: '' }),
    });
  }

  if (lower.includes('compras') || lower.includes('mercado') || lower.includes('supermercado')) {
    suggestions.push({
      id: 'shopping-list',
      type: 'checklist',
      title: 'Lista de compras',
      description: 'Lista organizada por categoria',
      context: input,
      action: async () => ({ actionType: 'create_shopping_list', content: '' }),
    });
  }

  if (lower.includes('viagem')) {
    suggestions.push({
      id: 'travel-plan',
      type: 'planner',
      title: 'Planejamento de viagem',
      description: 'Roteiro e checklists para viagem',
      context: input,
      action: async () => ({ actionType: 'create_travel_plan', content: '' }),
    });
  }

  if (lower.includes('estudo') || lower.includes('escola') || lower.includes('prova')) {
    suggestions.push({
      id: 'study-plan',
      type: 'planner',
      title: 'Cronograma de estudos',
      description: 'Plano de estudos organizado por matéria',
      context: input,
      action: async () => ({ actionType: 'create_study_schedule', content: '' }),
    });
  }

  if (lower.includes('limpeza') || lower.includes('faxina') || lower.includes('casa')) {
    suggestions.push({
      id: 'cleaning-routine',
      type: 'routine',
      title: 'Rotina de limpeza',
      description: 'Organização da limpeza doméstica',
      context: input,
      action: async () => ({ actionType: 'create_cleaning_routine', content: '' }),
    });
  }

  return suggestions;
}

export function getSmartSuggestions(context: {
  recentActions?: string[];
  favoriteCategories?: string[];
  timeOfDay?: string;
}): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const hour = context.timeOfDay ? parseInt(context.timeOfDay) : new Date().getHours();

  if (hour < 12) {
    suggestions.push({
      id: 'plan-day',
      type: 'routine',
      title: 'Planejar o dia',
      description: 'Organize suas tarefas para hoje',
      context: 'Planejamento diário',
      action: async () => ({ actionType: 'create_routine', content: '' }),
    });
  }

  if (hour >= 18) {
    suggestions.push({
      id: 'review-day',
      type: 'insight',
      title: 'Revisar o dia',
      description: 'Veja o que foi feito hoje',
      context: 'Resumo diário',
      action: async () => ({ actionType: 'suggest_organization', content: '' }),
    });
  }

  if (context.favoriteCategories?.includes('estudos')) {
    suggestions.push({
      id: 'study-plan',
      type: 'planner',
      title: 'Plano de estudos',
      description: 'Organize seus estudos da semana',
      context: 'Cronograma de estudos semanal',
      action: async () => ({ actionType: 'create_study_schedule', content: '' }),
    });
  }

  if (context.favoriteCategories?.includes('pets')) {
    suggestions.push({
      id: 'pet-care',
      type: 'routine',
      title: 'Cuidados com pet',
      description: 'Rotina de cuidados para seu pet',
      context: 'Rotina de cuidados com pet',
      action: async () => ({ actionType: 'create_pet_routine', content: '' }),
    });
  }

  return suggestions;
}
