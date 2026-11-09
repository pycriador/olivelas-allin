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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
          organization_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          organization_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_images: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          organization_id: string
          sort_order: number
          storage_path: string
          type: Database["public"]["Enums"]["campaign_image_type"]
          updated_at: string
          url: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          organization_id: string
          sort_order?: number
          storage_path: string
          type?: Database["public"]["Enums"]["campaign_image_type"]
          updated_at?: string
          url: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          sort_order?: number
          storage_path?: string
          type?: Database["public"]["Enums"]["campaign_image_type"]
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_images_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_images_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          archived_at: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string
          currency: string
          description: string | null
          end_at: string | null
          id: string
          name: string
          number_price: number
          organization_id: string
          product_description: string | null
          product_name: string
          published_at: string | null
          slug: string
          start_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          total_numbers: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          end_at?: string | null
          id?: string
          name: string
          number_price?: number
          organization_id: string
          product_description?: string | null
          product_name: string
          published_at?: string | null
          slug: string
          start_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          total_numbers?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          end_at?: string | null
          id?: string
          name?: string
          number_price?: number
          organization_id?: string
          product_description?: string | null
          product_name?: string
          published_at?: string | null
          slug?: string
          start_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          total_numbers?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          id: string
          last_sent_at: string
          message: string | null
          organization_id: string
          resend_count: number
          role: Database["public"]["Enums"]["org_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          expires_at: string
          id?: string
          last_sent_at?: string
          message?: string | null
          organization_id: string
          resend_count?: number
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          last_sent_at?: string
          message?: string | null
          organization_id?: string
          resend_count?: number
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_usage: {
        Row: {
          id: string
          organization_id: string
          updated_at: string
          usage_key: string
          usage_value: number
        }
        Insert: {
          id?: string
          organization_id: string
          updated_at?: string
          usage_key: string
          usage_value?: number
        }
        Update: {
          id?: string
          organization_id?: string
          updated_at?: string
          usage_key?: string
          usage_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "organization_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          date_format: string
          document: string | null
          email: string | null
          id: string
          legal_name: string | null
          locale: string
          logo_url: string | null
          name: string
          phone: string | null
          primary_color: string
          secondary_color: string
          slug: string
          status: Database["public"]["Enums"]["org_status"]
          timezone: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          date_format?: string
          document?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          locale?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          primary_color?: string
          secondary_color?: string
          slug: string
          status?: Database["public"]["Enums"]["org_status"]
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          date_format?: string
          document?: string | null
          email?: string | null
          id?: string
          legal_name?: string | null
          locale?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          primary_color?: string
          secondary_color?: string
          slug?: string
          status?: Database["public"]["Enums"]["org_status"]
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      plan_features: {
        Row: {
          enabled: boolean
          feature_key: string
          id: string
          plan_id: string
        }
        Insert: {
          enabled?: boolean
          feature_key: string
          id?: string
          plan_id: string
        }
        Update: {
          enabled?: boolean
          feature_key?: string
          id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_limits: {
        Row: {
          id: string
          limit_key: string
          limit_value: number
          plan_id: string
        }
        Insert: {
          id?: string
          limit_key: string
          limit_value?: number
          plan_id: string
        }
        Update: {
          id?: string
          limit_key?: string
          limit_value?: number
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_limits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          name: string
          price_monthly: number
          price_yearly: number
          slug: string
          status: Database["public"]["Enums"]["plan_status"]
          trial_days: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name: string
          price_monthly?: number
          price_yearly?: number
          slug: string
          status?: Database["public"]["Enums"]["plan_status"]
          trial_days?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name?: string
          price_monthly?: number
          price_yearly?: number
          slug?: string
          status?: Database["public"]["Enums"]["plan_status"]
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["platform_role"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_seen_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_seen_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_seen_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          id: string
          permission_key: string
          role: Database["public"]["Enums"]["org_role"]
        }
        Insert: {
          id?: string
          permission_key: string
          role: Database["public"]["Enums"]["org_role"]
        }
        Update: {
          id?: string
          permission_key?: string
          role?: Database["public"]["Enums"]["org_role"]
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          organization_id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_end: string | null
          trial_start: string | null
          updated_at: string
        }
        Insert: {
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Update: {
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { _token: string }; Returns: string }
      add_campaign_image: {
        Args: {
          _as_cover?: boolean
          _campaign: string
          _path: string
          _url: string
        }
        Returns: string
      }
      app_setting_int: {
        Args: { _default: number; _key: string }
        Returns: number
      }
      bootstrap_session: { Args: never; Returns: Json }
      campaign_metrics: { Args: { _org: string }; Returns: Json }
      change_member_role: {
        Args: {
          _membership_id: string
          _role: Database["public"]["Enums"]["org_role"]
        }
        Returns: undefined
      }
      create_campaign: {
        Args: {
          _currency?: string
          _description?: string
          _end_at?: string
          _name: string
          _number_price: number
          _org: string
          _product_description?: string
          _product_name: string
          _slug: string
          _start_at?: string
          _total_numbers: number
        }
        Returns: string
      }
      create_organization: {
        Args: { _email?: string; _name: string; _phone?: string; _slug: string }
        Returns: string
      }
      delete_campaign_image: { Args: { _image: string }; Returns: string }
      has_org_role: {
        Args: {
          _org_id: string
          _roles: Database["public"]["Enums"]["org_role"][]
          _user_id?: string
        }
        Returns: boolean
      }
      has_permission: {
        Args: { _org: string; _permission: string; _user_id?: string }
        Returns: boolean
      }
      invite_member:
        | {
            Args: {
              _email: string
              _org: string
              _role?: Database["public"]["Enums"]["org_role"]
            }
            Returns: string
          }
        | {
            Args: {
              _email: string
              _message?: string
              _org: string
              _role?: Database["public"]["Enums"]["org_role"]
            }
            Returns: Json
          }
      is_global_admin: { Args: { _user_id?: string }; Returns: boolean }
      is_org_member: {
        Args: { _org_id: string; _user_id?: string }
        Returns: boolean
      }
      list_audit_logs: {
        Args: {
          _action?: string
          _actor?: string
          _entity?: string
          _from?: string
          _limit?: number
          _offset?: number
          _org: string
          _to?: string
        }
        Returns: Json
      }
      list_campaigns: {
        Args: {
          _created_from?: string
          _created_to?: string
          _direction?: string
          _include_archived?: boolean
          _limit?: number
          _offset?: number
          _org: string
          _published_from?: string
          _published_to?: string
          _search?: string
          _sort?: string
          _status?: string
        }
        Returns: Json
      }
      list_organization_members: {
        Args: {
          _limit?: number
          _offset?: number
          _org: string
          _role?: string
          _search?: string
          _status?: string
        }
        Returns: Json
      }
      my_permissions: { Args: { _org: string }; Returns: string[] }
      normalize_slug: { Args: { _input: string }; Returns: string }
      org_feature_enabled: {
        Args: { _key: string; _org: string }
        Returns: boolean
      }
      org_is_active: { Args: { _org_id: string }; Returns: boolean }
      org_limit: { Args: { _key: string; _org: string }; Returns: number }
      org_role_of: {
        Args: { _org_id: string; _user_id?: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
      platform_list_organizations: {
        Args: {
          _limit?: number
          _offset?: number
          _search?: string
          _status?: string
        }
        Returns: Json
      }
      platform_list_users: {
        Args: { _limit?: number; _offset?: number; _search?: string }
        Returns: Json
      }
      platform_metrics: { Args: never; Returns: Json }
      platform_organization_detail: { Args: { _org: string }; Returns: Json }
      preview_invitation: { Args: { _token: string }; Returns: Json }
      public_campaign: { Args: { _slug: string }; Returns: Json }
      remove_member: { Args: { _membership_id: string }; Returns: undefined }
      reorder_campaign_images: {
        Args: { _campaign: string; _ids: string[] }
        Returns: undefined
      }
      resend_invitation: { Args: { _invitation_id: string }; Returns: Json }
      revoke_invitation: {
        Args: { _invitation_id: string }
        Returns: undefined
      }
      set_campaign_cover: { Args: { _image: string }; Returns: undefined }
      set_campaign_status: {
        Args: {
          _campaign: string
          _status: Database["public"]["Enums"]["campaign_status"]
        }
        Returns: undefined
      }
      set_member_status: {
        Args: {
          _membership_id: string
          _status: Database["public"]["Enums"]["membership_status"]
        }
        Returns: undefined
      }
      set_organization_logo: {
        Args: { _org: string; _path: string }
        Returns: undefined
      }
      set_organization_status: {
        Args: {
          _org: string
          _status: Database["public"]["Enums"]["org_status"]
        }
        Returns: undefined
      }
      storage_org_id: { Args: { _name: string }; Returns: string }
      suspend_own_organization: {
        Args: { _confirmation: string; _org: string }
        Returns: undefined
      }
      sync_campaign_usage: { Args: { _org: string }; Returns: undefined }
      transfer_ownership: {
        Args: { _confirmation: string; _membership_id: string }
        Returns: undefined
      }
      unaccent_fallback: { Args: { _input: string }; Returns: string }
      update_campaign: {
        Args: {
          _campaign: string
          _clear_end_at?: boolean
          _clear_start_at?: boolean
          _description?: string
          _end_at?: string
          _name?: string
          _number_price?: number
          _product_description?: string
          _product_name?: string
          _slug?: string
          _start_at?: string
          _total_numbers?: number
        }
        Returns: undefined
      }
      write_audit: {
        Args: {
          _action: string
          _entity_id: string
          _entity_type: string
          _metadata?: Json
          _org: string
        }
        Returns: undefined
      }
    }
    Enums: {
      billing_interval: "MONTHLY" | "YEARLY"
      campaign_image_type: "COVER" | "GALLERY"
      campaign_status:
        | "DRAFT"
        | "PUBLISHED"
        | "PAUSED"
        | "FINISHED"
        | "ARCHIVED"
      invitation_status: "INVITED" | "ACCEPTED" | "EXPIRED" | "REVOKED"
      membership_status: "ACTIVE" | "INVITED" | "REMOVED" | "SUSPENDED"
      org_role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
      org_status: "ACTIVE" | "SUSPENDED" | "INACTIVE"
      plan_status: "ACTIVE" | "INACTIVE"
      platform_role: "GLOBAL_ADMIN"
      subscription_status:
        | "TRIALING"
        | "ACTIVE"
        | "PAST_DUE"
        | "CANCELLED"
        | "EXPIRED"
        | "SUSPENDED"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      billing_interval: ["MONTHLY", "YEARLY"],
      campaign_image_type: ["COVER", "GALLERY"],
      campaign_status: ["DRAFT", "PUBLISHED", "PAUSED", "FINISHED", "ARCHIVED"],
      invitation_status: ["INVITED", "ACCEPTED", "EXPIRED", "REVOKED"],
      membership_status: ["ACTIVE", "INVITED", "REMOVED", "SUSPENDED"],
      org_role: ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
      org_status: ["ACTIVE", "SUSPENDED", "INACTIVE"],
      plan_status: ["ACTIVE", "INACTIVE"],
      platform_role: ["GLOBAL_ADMIN"],
      subscription_status: [
        "TRIALING",
        "ACTIVE",
        "PAST_DUE",
        "CANCELLED",
        "EXPIRED",
        "SUSPENDED",
      ],
    },
  },
} as const
