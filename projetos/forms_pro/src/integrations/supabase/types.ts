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
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          key_hash: string
          last_used_at: string | null
          name: string
          organization_id: string
          prefix: string
          scopes: string[]
          status: Database["public"]["Enums"]["api_key_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          last_used_at?: string | null
          name: string
          organization_id: string
          prefix: string
          scopes?: string[]
          status?: Database["public"]["Enums"]["api_key_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          last_used_at?: string | null
          name?: string
          organization_id?: string
          prefix?: string
          scopes?: string[]
          status?: Database["public"]["Enums"]["api_key_status"]
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage: {
        Row: {
          api_key_id: string | null
          created_at: string
          duration_ms: number | null
          endpoint: string
          id: string
          method: string
          organization_id: string
          status_code: number
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          duration_ms?: number | null
          endpoint: string
          id?: string
          method?: string
          organization_id: string
          status_code?: number
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          duration_ms?: number | null
          endpoint?: string
          id?: string
          method?: string
          organization_id?: string
          status_code?: number
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_name: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_name?: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_name?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          user_id?: string | null
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
      automation_executions: {
        Row: {
          context: Json
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          organization_id: string
          result: Json
          rule_id: string
          status: Database["public"]["Enums"]["execution_status"]
          trigger_type: string
        }
        Insert: {
          context?: Json
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          organization_id: string
          result?: Json
          rule_id: string
          status?: Database["public"]["Enums"]["execution_status"]
          trigger_type: string
        }
        Update: {
          context?: Json
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          organization_id?: string
          result?: Json
          rule_id?: string
          status?: Database["public"]["Enums"]["execution_status"]
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_executions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          created_by: string | null
          description: string
          form_id: string | null
          id: string
          last_run_at: string | null
          name: string
          organization_id: string
          run_count: number
          status: Database["public"]["Enums"]["automation_status"]
          trigger_type: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string
          form_id?: string | null
          id?: string
          last_run_at?: string | null
          name: string
          organization_id: string
          run_count?: number
          status?: Database["public"]["Enums"]["automation_status"]
          trigger_type: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string
          form_id?: string | null
          id?: string
          last_run_at?: string | null
          name?: string
          organization_id?: string
          run_count?: number
          status?: Database["public"]["Enums"]["automation_status"]
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string
          enabled: boolean
          id: string
          key: string
          organization_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string
          enabled?: boolean
          id?: string
          key: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          enabled?: boolean
          id?: string
          key?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      form_responses: {
        Row: {
          answers: Json
          completed_at: string | null
          duration_ms: number | null
          form_id: string
          form_version: number
          id: string
          metadata: Json
          organization_id: string | null
          respondent_id: string | null
          schema_snapshot: Json
          started_at: string | null
          status: Database["public"]["Enums"]["response_status"]
          submitted_at: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          duration_ms?: number | null
          form_id: string
          form_version?: number
          id?: string
          metadata?: Json
          organization_id?: string | null
          respondent_id?: string | null
          schema_snapshot?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["response_status"]
          submitted_at?: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          duration_ms?: number | null
          form_id?: string
          form_version?: number
          id?: string
          metadata?: Json
          organization_id?: string | null
          respondent_id?: string | null
          schema_snapshot?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["response_status"]
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string
          id: string
          name: string
          organization_id: string | null
          schema: Json
          thumbnail: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          id?: string
          name: string
          organization_id?: string | null
          schema?: Json
          thumbnail?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          organization_id?: string | null
          schema?: Json
          thumbnail?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      form_versions: {
        Row: {
          created_at: string
          created_by: string | null
          form_id: string
          id: string
          label: string
          schema: Json
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          form_id: string
          id?: string
          label?: string
          schema: Json
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          form_id?: string
          id?: string
          label?: string
          schema?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "form_versions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          category: string
          created_at: string
          description: string
          group_id: string | null
          id: string
          name: string
          organization_id: string | null
          owner_id: string
          pages: Json
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["form_status"]
          theme: Json
          updated_at: string
          version: number
          visibility: Database["public"]["Enums"]["form_visibility"]
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          group_id?: string | null
          id?: string
          name: string
          organization_id?: string | null
          owner_id: string
          pages?: Json
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["form_status"]
          theme?: Json
          updated_at?: string
          version?: number
          visibility?: Database["public"]["Enums"]["form_visibility"]
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          group_id?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          owner_id?: string
          pages?: Json
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["form_status"]
          theme?: Json
          updated_at?: string
          version?: number
          visibility?: Database["public"]["Enums"]["form_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "forms_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      group_permissions: {
        Row: {
          group_id: string
          id: string
          permission: Database["public"]["Enums"]["app_permission"]
        }
        Insert: {
          group_id: string
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
        }
        Update: {
          group_id?: string
          id?: string
          permission?: Database["public"]["Enums"]["app_permission"]
        }
        Relationships: [
          {
            foreignKeyName: "group_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          organization_id: string | null
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          name: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          category: string
          config: Json
          connected_at: string | null
          connected_by: string | null
          created_at: string
          id: string
          organization_id: string
          provider: string
          secret_ref: string | null
          status: Database["public"]["Enums"]["integration_status"]
          updated_at: string
        }
        Insert: {
          category?: string
          config?: Json
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          id?: string
          organization_id: string
          provider: string
          secret_ref?: string | null
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
        }
        Update: {
          category?: string
          config?: Json
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          provider?: string
          secret_ref?: string | null
          status?: Database["public"]["Enums"]["integration_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          kind: string
          organization_id: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          kind?: string
          organization_id?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          kind?: string
          organization_id?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_role_permissions: {
        Row: {
          id: string
          permission: Database["public"]["Enums"]["org_permission"]
          role: Database["public"]["Enums"]["org_role"]
        }
        Insert: {
          id?: string
          permission: Database["public"]["Enums"]["org_permission"]
          role: Database["public"]["Enums"]["org_role"]
        }
        Update: {
          id?: string
          permission?: Database["public"]["Enums"]["org_permission"]
          role?: Database["public"]["Enums"]["org_role"]
        }
        Relationships: []
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string
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
      organization_limits: {
        Row: {
          max_api_calls: number
          max_automations: number
          max_forms: number
          max_responses: number
          max_storage_mb: number
          max_users: number
          max_webhooks: number
          organization_id: string
          updated_at: string
        }
        Insert: {
          max_api_calls?: number
          max_automations?: number
          max_forms?: number
          max_responses?: number
          max_storage_mb?: number
          max_users?: number
          max_webhooks?: number
          organization_id: string
          updated_at?: string
        }
        Update: {
          max_api_calls?: number
          max_automations?: number
          max_forms?: number
          max_responses?: number
          max_storage_mb?: number
          max_users?: number
          max_webhooks?: number
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_limits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          audit_retention_days: number
          created_at: string
          created_by: string | null
          id: string
          legal_name: string
          logo_url: string | null
          name: string
          plan: Database["public"]["Enums"]["plan_tier"]
          response_retention_days: number
          slug: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          audit_retention_days?: number
          created_at?: string
          created_by?: string | null
          id?: string
          legal_name?: string
          logo_url?: string | null
          name: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          response_retention_days?: number
          slug: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          audit_retention_days?: number
          created_at?: string
          created_by?: string | null
          id?: string
          legal_name?: string
          logo_url?: string | null
          name?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          response_retention_days?: number
          slug?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          description: string
          features: string[]
          id: string
          limits: Json
          name: string
          tier: Database["public"]["Enums"]["plan_tier"]
        }
        Insert: {
          created_at?: string
          description?: string
          features?: string[]
          id?: string
          limits?: Json
          name: string
          tier: Database["public"]["Enums"]["plan_tier"]
        }
        Update: {
          created_at?: string
          description?: string
          features?: string[]
          id?: string
          limits?: Json
          name?: string
          tier?: Database["public"]["Enums"]["plan_tier"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          group_id: string | null
          id: string
          last_login: string | null
          name: string
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          group_id?: string | null
          id: string
          last_login?: string | null
          name?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          group_id?: string | null
          id?: string
          last_login?: string | null
          name?: string
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: string
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: string
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      system_events: {
        Row: {
          context: Json
          created_at: string
          id: string
          message: string
          organization_id: string | null
          severity: Database["public"]["Enums"]["severity"]
          source: string
        }
        Insert: {
          context?: Json
          created_at?: string
          id?: string
          message: string
          organization_id?: string | null
          severity?: Database["public"]["Enums"]["severity"]
          source: string
        }
        Update: {
          context?: Json
          created_at?: string
          id?: string
          message?: string
          organization_id?: string | null
          severity?: Database["public"]["Enums"]["severity"]
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempt: number
          created_at: string
          duration_ms: number | null
          error: string | null
          event: string
          http_status: number | null
          id: string
          next_retry_at: string | null
          organization_id: string
          payload: Json
          response_body: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          webhook_id: string
        }
        Insert: {
          attempt?: number
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          event: string
          http_status?: number | null
          id?: string
          next_retry_at?: string | null
          organization_id: string
          payload?: Json
          response_body?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          webhook_id: string
        }
        Update: {
          attempt?: number
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          event?: string
          http_status?: number | null
          id?: string
          next_retry_at?: string | null
          organization_id?: string
          payload?: Json
          response_body?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          created_by: string | null
          events: string[]
          id: string
          max_retries: number
          name: string
          organization_id: string
          secret: string
          status: Database["public"]["Enums"]["webhook_status"]
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          events?: string[]
          id?: string
          max_retries?: number
          name?: string
          organization_id: string
          secret?: string
          status?: Database["public"]["Enums"]["webhook_status"]
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          events?: string[]
          id?: string
          max_retries?: number
          name?: string
          organization_id?: string
          secret?: string
          status?: Database["public"]["Enums"]["webhook_status"]
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_form: {
        Args: { _form_id: string; _user_id: string }
        Returns: boolean
      }
      has_org_permission: {
        Args: {
          _org_id: string
          _perm: Database["public"]["Enums"]["org_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["app_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      org_member_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
      shares_org: { Args: { _a: string; _b: string }; Returns: boolean }
      user_group: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      api_key_status: "active" | "revoked" | "expired"
      app_permission:
        | "manage_users"
        | "manage_groups"
        | "manage_permissions"
        | "view_dashboard"
        | "create_forms"
        | "edit_forms"
        | "delete_forms"
        | "publish_forms"
        | "view_responses"
        | "export_responses"
        | "view_analytics"
        | "manage_templates"
        | "view_audit_logs"
        | "manage_settings"
      app_role: "admin" | "manager" | "user"
      automation_status: "active" | "paused" | "draft"
      delivery_status: "pending" | "success" | "failed" | "retrying"
      entity_status: "active" | "inactive"
      execution_status: "success" | "failed" | "skipped"
      form_status: "draft" | "published" | "archived"
      form_visibility: "public" | "private"
      integration_status: "connected" | "disconnected" | "error"
      invitation_status: "pending" | "accepted" | "cancelled" | "expired"
      member_status: "active" | "invited" | "suspended"
      org_permission:
        | "manage_organization"
        | "manage_members"
        | "manage_roles"
        | "manage_forms"
        | "publish_forms"
        | "view_responses"
        | "export_responses"
        | "view_analytics"
        | "manage_templates"
        | "manage_integrations"
        | "manage_api_keys"
        | "manage_webhooks"
        | "manage_automations"
        | "view_audit_logs"
      org_role: "owner" | "admin" | "manager" | "editor" | "viewer"
      plan_tier: "free" | "pro" | "business" | "enterprise"
      response_status: "complete" | "partial"
      severity: "info" | "success" | "warning" | "error"
      webhook_status: "active" | "paused" | "disabled"
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
      api_key_status: ["active", "revoked", "expired"],
      app_permission: [
        "manage_users",
        "manage_groups",
        "manage_permissions",
        "view_dashboard",
        "create_forms",
        "edit_forms",
        "delete_forms",
        "publish_forms",
        "view_responses",
        "export_responses",
        "view_analytics",
        "manage_templates",
        "view_audit_logs",
        "manage_settings",
      ],
      app_role: ["admin", "manager", "user"],
      automation_status: ["active", "paused", "draft"],
      delivery_status: ["pending", "success", "failed", "retrying"],
      entity_status: ["active", "inactive"],
      execution_status: ["success", "failed", "skipped"],
      form_status: ["draft", "published", "archived"],
      form_visibility: ["public", "private"],
      integration_status: ["connected", "disconnected", "error"],
      invitation_status: ["pending", "accepted", "cancelled", "expired"],
      member_status: ["active", "invited", "suspended"],
      org_permission: [
        "manage_organization",
        "manage_members",
        "manage_roles",
        "manage_forms",
        "publish_forms",
        "view_responses",
        "export_responses",
        "view_analytics",
        "manage_templates",
        "manage_integrations",
        "manage_api_keys",
        "manage_webhooks",
        "manage_automations",
        "view_audit_logs",
      ],
      org_role: ["owner", "admin", "manager", "editor", "viewer"],
      plan_tier: ["free", "pro", "business", "enterprise"],
      response_status: ["complete", "partial"],
      severity: ["info", "success", "warning", "error"],
      webhook_status: ["active", "paused", "disabled"],
    },
  },
} as const
