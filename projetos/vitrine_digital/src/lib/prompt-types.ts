export type PromptType = "vision_extraction" | "art_generation" | "custom";

export interface IamPrompt {
  id: string;
  name: string;
  type: PromptType;
  content: string;
  description?: string;
  is_active: boolean;
  is_system_default: boolean;
  version: string;
  model_target?: string;
  created_at: string;
  updated_at?: string;
}

export interface AiUsageLog {
  id: string;
  group_id?: string | null;
  group_name: string;
  user_id?: string | null;
  user_email?: string | null;
  model: string;
  estimated_input_tokens: number;
  estimated_output_tokens: number;
  estimated_cost_brl: number;
  status: "success" | "error";
  error_message?: string | null;
  created_at: string;
}

export interface AiUsageMetrics {
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  totalCostBrl: number;
  totalTokens: number;
  avgCostPerRequestBrl: number;
  byGroup: Record<
    string,
    {
      groupId: string;
      groupName: string;
      requests: number;
      costBrl: number;
      tokens: number;
    }
  >;
  byModel: Record<
    string,
    {
      model: string;
      requests: number;
      costBrl: number;
    }
  >;
  dailyTrend: Array<{
    date: string;
    requests: number;
    costBrl: number;
  }>;
}
