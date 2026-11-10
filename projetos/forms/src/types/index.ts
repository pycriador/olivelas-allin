// ========================================================
// Olivelas IAM Forms - TypeScript Core Definitions
// ========================================================

export type UserRole = 'admin' | 'creator' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  auth_id?: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  created_at: string;
  updated_at: string;
  groups?: Group[];
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  members?: User[];
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'integer'
  | 'decimal'
  | 'radio'
  | 'checkbox'
  | 'dropdown'
  | 'info_text'
  | 'file_upload'
  | 'rating'
  | 'scale'
  | 'date'
  | 'time'
  | 'switch';

export interface FieldValidation {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  allowedTypes?: string[];
  maxFileSizeMB?: number;
  maxRating?: number;
  scaleStart?: number;
  scaleEnd?: number;
  scaleStartLabel?: string;
  scaleEndLabel?: string;
}

export interface ConditionalLogic {
  enabled?: boolean;
  dependsOnFieldId?: string;
  operator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value?: any;
  action?: 'show' | 'hide';
}

export interface FormField {
  id: string;
  form_id: string;
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  order_index: number;
  options?: string[];
  validation?: FieldValidation;
  conditional_logic?: ConditionalLogic;
  settings?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export type FormStatus = 'draft' | 'published' | 'archived' | 'closed';

export interface Form {
  id: string;
  title: string;
  description?: string;
  owner_id: string;
  owner_name?: string;
  owner_email?: string;
  status: FormStatus;
  theme_id: string;
  header_image_url?: string;
  logo_url?: string;
  is_public: boolean;
  share_code: string;
  requires_login: boolean;
  allow_anonymous: boolean;
  limit_one_response: boolean;
  show_progress_bar: boolean;
  shuffle_questions: boolean;
  confirmation_message: string;
  redirect_url?: string;
  password_protect: boolean;
  password_hash?: string;
  expires_at?: string;
  max_responses?: number;
  created_at: string;
  updated_at: string;
  fields_count?: number;
  responses_count?: number;
  user_role?: 'owner' | 'editor' | 'viewer';
}

export interface FormCollaborator {
  id: string;
  form_id: string;
  user_id?: string;
  user_email: string;
  role: 'editor' | 'viewer';
  invited_by?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

export interface FormResponse {
  id: string;
  form_id: string;
  respondent_id?: string;
  respondent_email?: string;
  respondent_ip?: string;
  user_agent?: string;
  submitted_at: string;
  status: 'completed' | 'partial' | 'flagged';
  answers?: FormAnswer[];
}

export interface FormAnswer {
  id: string;
  response_id: string;
  field_id: string;
  value_text?: string;
  value_number?: number;
  value_json?: any;
  created_at?: string;
  field_label?: string;
  field_type?: FieldType;
}

export type WidgetType =
  | 'pie'
  | 'doughnut'
  | 'bar'
  | 'bar_horizontal'
  | 'line'
  | 'area'
  | 'metric'
  | 'table';

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  title: string;
  widget_type: WidgetType;
  field_id?: string;
  data_source: 'form' | 'google_sheet' | 'custom';
  config: {
    metricType?: 'count_responses' | 'avg_number' | 'avg_rating' | 'sum_number' | 'min_number' | 'max_number';
    fieldMatch?: string;
    chartType?: string;
    prefix?: string;
    suffix?: string;
    colors?: string[];
    showLegend?: boolean;
    metricValue?: string;
    metricSubtitle?: string;
    columns?: string;
    xAxis?: string;
    yAxis?: string;
    [key: string]: any;
  };
  position?: { x: number; y: number; w: number; h: number };
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface Dashboard {
  id: string;
  title: string;
  description?: string;
  owner_id: string;
  owner_name?: string;
  is_public: boolean;
  share_code: string;
  form_id?: string;
  form_title?: string;
  google_sheet_source?: {
    spreadsheetId: string;
    sheetName?: string;
    sheetTitle?: string;
    range?: string;
    gid?: string;
    connectedAt?: string;
    autoSync?: boolean;
    syncIntervalSec?: number;
    lastSyncAt?: string;
  };
  refresh_interval_sec: number;
  theme_id: string;
  created_at: string;
  updated_at: string;
  widgets_count?: number;
  widgets?: DashboardWidget[];
}

export interface ApiToken {
  id: string;
  user_id: string;
  group_id?: string;
  group_name?: string;
  group_color?: string;
  name: string;
  token_prefix: string;
  raw_token?: string;
  scopes: string[];
  expires_at?: string;
  last_used_at?: string;
  is_active: boolean;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export interface GoogleIntegration {
  id: string;
  user_id: string;
  service_type: 'google_drive' | 'google_sheets' | 'google_forms';
  auth_mode: 'oauth' | 'service_account';
  connected_email?: string;
  status: 'connected' | 'disconnected' | 'error';
  last_sync_at?: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  category: 'classic' | 'modern' | 'vibrant' | 'dark' | 'pastel';
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  bgGradient: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  badgeBg: string;
}

export type SupportedLocale = 'pt-BR' | 'en' | 'es';
