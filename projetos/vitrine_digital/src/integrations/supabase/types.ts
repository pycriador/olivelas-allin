export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_usage_logs: {
        Row: {
          created_at: string
          error_message: string | null
          estimated_cost_brl: number
          estimated_input_tokens: number | null
          estimated_output_tokens: number | null
          group_id: string | null
          group_name: string
          id: string
          model: string
          status: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          estimated_cost_brl?: number
          estimated_input_tokens?: number | null
          estimated_output_tokens?: number | null
          group_id?: string | null
          group_name?: string
          id?: string
          model?: string
          status?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          estimated_cost_brl?: number
          estimated_input_tokens?: number | null
          estimated_output_tokens?: number | null
          group_id?: string | null
          group_name?: string
          id?: string
          model?: string
          status?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "iam_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      art_submissions: {
        Row: {
          approved_by_email: string | null
          approved_by_user_id: string | null
          created_at: string
          id: string
          image_path: string
          image_url: string
          notes: string | null
          processed_analysis_id: string | null
          rejection_reason: string | null
          sender_name: string | null
          sender_phone: string | null
          status: string
          submitted_by_email: string
          submitted_by_name: string | null
          submitted_by_user_id: string
          target_group_id: string | null
          updated_at: string
        }
        Insert: {
          approved_by_email?: string | null
          approved_by_user_id?: string | null
          created_at?: string
          id?: string
          image_path: string
          image_url: string
          notes?: string | null
          processed_analysis_id?: string | null
          rejection_reason?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          status?: string
          submitted_by_email: string
          submitted_by_name?: string | null
          submitted_by_user_id: string
          target_group_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_by_email?: string | null
          approved_by_user_id?: string | null
          created_at?: string
          id?: string
          image_path?: string
          image_url?: string
          notes?: string | null
          processed_analysis_id?: string | null
          rejection_reason?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          status?: string
          submitted_by_email?: string
          submitted_by_name?: string | null
          submitted_by_user_id?: string
          target_group_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "art_submissions_processed_analysis_id_fkey"
            columns: ["processed_analysis_id"]
            isOneToOne: false
            referencedRelation: "image_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "art_submissions_target_group_id_fkey"
            columns: ["target_group_id"]
            isOneToOne: false
            referencedRelation: "iam_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      iam_api_tokens: {
        Row: {
          assigned_role: string
          created_at: string
          expires_at: string | null
          group_id: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          name: string
          quota_brl: number
          token_hash: string
          token_prefix: string
          used_brl: number
          user_id: string | null
        }
        Insert: {
          assigned_role?: string
          created_at?: string
          expires_at?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name: string
          quota_brl?: number
          token_hash: string
          token_prefix: string
          used_brl?: number
          user_id?: string | null
        }
        Update: {
          assigned_role?: string
          created_at?: string
          expires_at?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          name?: string
          quota_brl?: number
          token_hash?: string
          token_prefix?: string
          used_brl?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iam_api_tokens_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "iam_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iam_api_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "iam_users"
            referencedColumns: ["id"]
          },
        ]
      }
      iam_groups: {
        Row: {
          created_at: string
          description: string | null
          gemini_api_key: string | null
          gemini_model: string
          id: string
          max_requests_per_day: number | null
          name: string
          quota_brl: number
          slug: string
          updated_at: string
          used_brl: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          gemini_api_key?: string | null
          gemini_model?: string
          id?: string
          max_requests_per_day?: number | null
          name: string
          quota_brl?: number
          slug: string
          updated_at?: string
          used_brl?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          gemini_api_key?: string | null
          gemini_model?: string
          id?: string
          max_requests_per_day?: number | null
          name?: string
          quota_brl?: number
          slug?: string
          updated_at?: string
          used_brl?: number
        }
        Relationships: []
      }
      iam_prompts: {
        Row: {
          content: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_system_default: boolean
          model_target: string | null
          name: string
          type: string
          updated_at: string
          version: string
        }
        Insert: {
          content: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_default?: boolean
          model_target?: string | null
          name: string
          type?: string
          updated_at?: string
          version?: string
        }
        Update: {
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_system_default?: boolean
          model_target?: string | null
          name?: string
          type?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      iam_users: {
        Row: {
          created_at: string
          custom_quota_brl: number | null
          email: string
          full_name: string | null
          group_ids: string[] | null
          id: string
          is_active: boolean
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_quota_brl?: number | null
          email: string
          full_name?: string | null
          group_ids?: string[] | null
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_quota_brl?: number | null
          email?: string
          full_name?: string | null
          group_ids?: string[] | null
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      image_analysis: {
        Row: {
          analysis: Json | null
          business_name: string | null
          category: string | null
          confidence: number | null
          created_at: string
          error_message: string | null
          id: string
          image_path: string | null
          image_type: string | null
          image_url: string | null
          keywords: string[] | null
          model_used: string | null
          phash: string | null
          processing_version: string | null
          searchable_text: string | null
          status: string
          summary: string | null
          title: string | null
        }
        Insert: {
          analysis?: Json | null
          business_name?: string | null
          category?: string | null
          confidence?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          image_path?: string | null
          image_type?: string | null
          image_url?: string | null
          keywords?: string[] | null
          model_used?: string | null
          phash?: string | null
          processing_version?: string | null
          searchable_text?: string | null
          status?: string
          summary?: string | null
          title?: string | null
        }
        Update: {
          analysis?: Json | null
          business_name?: string | null
          category?: string | null
          confidence?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          image_path?: string | null
          image_type?: string | null
          image_url?: string | null
          keywords?: string[] | null
          model_used?: string | null
          phash?: string | null
          processing_version?: string | null
          searchable_text?: string | null
          status?: string
          summary?: string | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
