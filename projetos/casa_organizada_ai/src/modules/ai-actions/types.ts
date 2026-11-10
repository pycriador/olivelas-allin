export type ActionType =
  | 'create_routine'
  | 'create_checklist'
  | 'create_form'
  | 'create_planner'
  | 'create_schedule'
  | 'create_goals'
  | 'create_calendar'
  | 'create_shopping_list'
  | 'create_cleaning_routine'
  | 'create_pet_routine'
  | 'create_kids_routine'
  | 'create_study_schedule'
  | 'create_travel_plan'
  | 'create_financial_plan'
  | 'suggest_organization'
  | 'suggest_times'
  | 'reorganize'
  | 'group_activities'
  | 'detect_conflicts'
  | 'prioritize'
  | 'balance_load'
  | 'suggest_breaks';

export type ActionSource = 'assistant' | 'suggestion' | 'auto' | 'insight' | 'action';

export interface ActionResult {
  actionType: ActionType;
  content: string;
  structuredData?: Record<string, unknown>;
  suggestions?: string[];
  executionTimeMs?: number;
  model?: string;
  provider?: string;
}

export interface ActionContext {
  userId: string;
  threadId?: string;
  input: string;
  providerSlug?: string;
  model?: string;
  temperature?: number;
}

// Planner view types used by the form builder
export type PlannerView =
  | 'checklist'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'agenda'
  | 'shopping'
  | 'medications'
  | 'vaccination'
  | 'kids_routine'
  | 'pet_routine'
  | 'study'
  | 'work';
