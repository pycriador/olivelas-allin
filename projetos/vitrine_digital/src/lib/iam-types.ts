export type IamRole = "global_admin" | "analyst" | "consumer";

export interface IamGroup {
  id: string;
  name: string;
  slug: string;
  description?: string;
  gemini_api_key?: string;
  gemini_model?: string;
  quota_brl: number;
  used_brl: number;
  max_requests_per_day?: number;
  created_at: string;
  updated_at?: string;
}

export interface IamUser {
  id: string;
  email: string;
  full_name?: string;
  role: IamRole;
  group_ids: string[];
  is_active: boolean;
  custom_quota_brl?: number;
  created_at: string;
  updated_at?: string;
}

export interface IamApiToken {
  id: string;
  name: string;
  token_prefix: string;
  token_hash?: string;
  raw_token?: string; // Only displayed immediately after creation
  user_id?: string;
  group_id?: string;
  assigned_role: IamRole;
  quota_brl: number;
  used_brl: number;
  is_active: boolean;
  expires_at?: string | null;
  last_used_at?: string | null;
  created_at: string;
}

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface ArtSubmission {
  id: string;
  submitted_by_user_id: string;
  submitted_by_email: string;
  submitted_by_name?: string;
  image_path: string;
  image_url: string;
  notes?: string;
  sender_phone?: string;
  sender_name?: string;
  target_group_id?: string;
  status: SubmissionStatus;
  approved_by_user_id?: string;
  approved_by_email?: string;
  rejection_reason?: string;
  processed_analysis_id?: string;
  created_at: string;
  updated_at?: string;
}
