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
      admin_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          created_at: string
          id: string
          message_id: string | null
          model: string | null
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id?: string | null
          model?: string | null
          parts?: Json
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string | null
          model?: string | null
          parts?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "ai_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompts: {
        Row: {
          author_id: string | null
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          language: string
          name: string
          slug: string
          tags: string[]
          updated_at: string
          version: number
        }
        Insert: {
          author_id?: string | null
          category?: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          language?: string
          name: string
          slug: string
          tags?: string[]
          updated_at?: string
          version?: number
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          language?: string
          name?: string
          slug?: string
          tags?: string[]
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      ai_providers: {
        Row: {
          api_key: string | null
          base_url: string | null
          config: Json
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          models: Json
          name: string
          provider_type: string
          slug: string
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          base_url?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          models?: Json
          name: string
          provider_type?: string
          slug: string
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          base_url?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          models?: Json
          name?: string
          provider_type?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          created_at: string
          language: string
          max_history: number
          memory_enabled: boolean
          model: string
          system_prompt: string | null
          temperature: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          language?: string
          max_history?: number
          memory_enabled?: boolean
          model?: string
          system_prompt?: string | null
          temperature?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          language?: string
          max_history?: number
          memory_enabled?: boolean
          model?: string
          system_prompt?: string | null
          temperature?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_threads: {
        Row: {
          created_at: string
          id: string
          model: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          model?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          model?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_stats: {
        Row: {
          created_at: string
          date: string
          id: string
          model_used: string
          provider_slug: string
          requests_count: number
          total_execution_ms: number
          total_tokens: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          model_used: string
          provider_slug: string
          requests_count?: number
          total_execution_ms?: number
          total_tokens?: number
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          model_used?: string
          provider_slug?: string
          requests_count?: number
          total_execution_ms?: number
          total_tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          scopes: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          scopes?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          scopes?: string[]
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_actions: {
        Row: {
          action_type: string
          automation_id: string
          config: Json
          created_at: string
          id: string
          sort: number
        }
        Insert: {
          action_type: string
          automation_id: string
          config?: Json
          created_at?: string
          id?: string
          sort?: number
        }
        Update: {
          action_type?: string
          automation_id?: string
          config?: Json
          created_at?: string
          id?: string
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "automation_actions_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_conditions: {
        Row: {
          automation_id: string
          conditions: Json
          created_at: string
          id: string
          operator: string
          sort: number
        }
        Insert: {
          automation_id: string
          conditions?: Json
          created_at?: string
          id?: string
          operator?: string
          sort?: number
        }
        Update: {
          automation_id?: string
          conditions?: Json
          created_at?: string
          id?: string
          operator?: string
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "automation_conditions_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          automation_id: string
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          result: Json
          status: string
          trigger_data: Json
        }
        Insert: {
          automation_id: string
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          result?: Json
          status?: string
          trigger_data?: Json
        }
        Update: {
          automation_id?: string
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          result?: Json
          status?: string
          trigger_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_triggers: {
        Row: {
          automation_id: string
          config: Json
          created_at: string
          id: string
          sort: number
          trigger_type: string
        }
        Insert: {
          automation_id: string
          config?: Json
          created_at?: string
          id?: string
          sort?: number
          trigger_type: string
        }
        Update: {
          automation_id?: string
          config?: Json
          created_at?: string
          id?: string
          sort?: number
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_triggers_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          error_count: number
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          owner_id: string
          run_count: number
          updated_at: string
          version: number
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          error_count?: number
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          owner_id: string
          run_count?: number
          updated_at?: string
          version?: number
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          error_count?: number
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          owner_id?: string
          run_count?: number
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      avatars: {
        Row: {
          category: string
          colors: string[]
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          png_url: string | null
          slug: string
          sort: number
          style: string
          svg_content: string | null
          tags: string[]
        }
        Insert: {
          category?: string
          colors?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          png_url?: string | null
          slug: string
          sort?: number
          style?: string
          svg_content?: string | null
          tags?: string[]
        }
        Update: {
          category?: string
          colors?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          png_url?: string | null
          slug?: string
          sort?: number
          style?: string
          svg_content?: string | null
          tags?: string[]
        }
        Relationships: []
      }
      collaboration_sessions: {
        Row: {
          created_at: string
          cursor_pos: Json | null
          entity_id: string
          entity_type: string
          id: string
          last_seen_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cursor_pos?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          last_seen_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cursor_pos?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          last_seen_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      comment_mentions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          edited_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_resolved: boolean
          parent_id: string | null
          resolved_by: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          edited_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_resolved?: boolean
          parent_id?: string | null
          resolved_by?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          edited_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_resolved?: boolean
          parent_id?: string | null
          resolved_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      form_shares: {
        Row: {
          created_at: string
          expires_at: string | null
          form_id: string
          id: string
          mode: string
          permission: string
          target_user_id: string | null
          token: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          form_id: string
          id?: string
          mode: string
          permission?: string
          target_user_id?: string | null
          token?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          form_id?: string
          id?: string
          mode?: string
          permission?: string
          target_user_id?: string | null
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_shares_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          created_at: string
          data: Json
          form_id: string
          id: string
          submitter_id: string | null
          version_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          form_id: string
          id?: string
          submitter_id?: string | null
          version_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          form_id?: string
          id?: string
          submitter_id?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "form_versions"
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
          notes: string | null
          schema: Json
          version: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          form_id: string
          id?: string
          notes?: string | null
          schema: Json
          version: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          form_id?: string
          id?: string
          notes?: string | null
          schema?: Json
          version?: string
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
          banner_url: string | null
          base_template_id: string | null
          category: string | null
          cover_url: string | null
          created_at: string
          current_version_id: string | null
          description: string | null
          emoji: string | null
          icon: string | null
          id: string
          is_archived: boolean
          is_favorite: boolean
          owner_id: string
          planner_view: string
          privacy: string
          schema: Json
          status: string
          tags: string[]
          theme_overrides: Json
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          base_template_id?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          current_version_id?: string | null
          description?: string | null
          emoji?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean
          is_favorite?: boolean
          owner_id: string
          planner_view?: string
          privacy?: string
          schema?: Json
          status?: string
          tags?: string[]
          theme_overrides?: Json
          title?: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          base_template_id?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          current_version_id?: string | null
          description?: string | null
          emoji?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean
          is_favorite?: boolean
          owner_id?: string
          planner_view?: string
          privacy?: string
          schema?: Json
          status?: string
          tags?: string[]
          theme_overrides?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forms_base_template_id_fkey"
            columns: ["base_template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_logs: {
        Row: {
          action: string | null
          created_at: string
          id: string
          integration_id: string
          message: string | null
          payload: Json
          status: string
        }
        Insert: {
          action?: string | null
          created_at?: string
          id?: string
          integration_id: string
          message?: string | null
          payload?: Json
          status?: string
        }
        Update: {
          action?: string | null
          created_at?: string
          id?: string
          integration_id?: string
          message?: string | null
          payload?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json
          created_at: string
          credentials: Json
          id: string
          is_active: boolean
          last_sync_at: string | null
          name: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          credentials?: Json
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          name: string
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          credentials?: Json
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          name?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          automation_in_app: boolean
          change_in_app: boolean
          comment_email: boolean
          comment_in_app: boolean
          digest_frequency: string
          mention_email: boolean
          mention_in_app: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          reminder_email: boolean
          reminder_in_app: boolean
          share_email: boolean
          share_in_app: boolean
          task_due_email: boolean
          task_due_in_app: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          automation_in_app?: boolean
          change_in_app?: boolean
          comment_email?: boolean
          comment_in_app?: boolean
          digest_frequency?: string
          mention_email?: boolean
          mention_in_app?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_email?: boolean
          reminder_in_app?: boolean
          share_email?: boolean
          share_in_app?: boolean
          task_due_email?: boolean
          task_due_in_app?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          automation_in_app?: boolean
          change_in_app?: boolean
          comment_email?: boolean
          comment_in_app?: boolean
          digest_frequency?: string
          mention_email?: boolean
          mention_in_app?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          reminder_email?: boolean
          reminder_in_app?: boolean
          share_email?: boolean
          share_in_app?: boolean
          task_due_email?: boolean
          task_due_in_app?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          category: string
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          metadata: Json
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      pdf_layouts: {
        Row: {
          config: Json
          created_at: string
          form_id: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          form_id: string
          id?: string
          name?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          form_id?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_layouts_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_id: string | null
          avatar_type: string
          avatar_url: string | null
          banned_at: string | null
          banned_reason: string | null
          bio: string | null
          country: string
          created_at: string
          favorite_categories: string[]
          full_name: string | null
          id: string
          locale: string
          notifications: Json
          photo_url: string | null
          social_links: Json
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_id?: string | null
          avatar_type?: string
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          bio?: string | null
          country?: string
          created_at?: string
          favorite_categories?: string[]
          full_name?: string | null
          id: string
          locale?: string
          notifications?: Json
          photo_url?: string | null
          social_links?: Json
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_id?: string | null
          avatar_type?: string
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          bio?: string | null
          country?: string
          created_at?: string
          favorite_categories?: string[]
          full_name?: string | null
          id?: string
          locale?: string
          notifications?: Json
          photo_url?: string | null
          social_links?: Json
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "avatars"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_connectors: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          source_query: string
          source_table: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          source_query?: string
          source_table: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          source_query?: string
          source_table?: string
        }
        Relationships: []
      }
      sync_queue: {
        Row: {
          action: string
          conflict_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          payload: Json
          status: string
          synced_at: string | null
          user_id: string
        }
        Insert: {
          action: string
          conflict_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          payload?: Json
          status?: string
          synced_at?: string | null
          user_id: string
        }
        Update: {
          action?: string
          conflict_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          payload?: Json
          status?: string
          synced_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      template_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort?: number
        }
        Relationships: []
      }
      template_downloads: {
        Row: {
          created_at: string
          id: string
          template_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          template_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          template_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_downloads_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_ratings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          author_id: string | null
          category: string
          category_id: string | null
          content: Json
          cover_url: string | null
          created_at: string
          description: string
          downloads_count: number
          favorites_count: number
          icon: string | null
          id: string
          is_featured: boolean
          is_hidden: boolean
          is_public: boolean
          is_system: boolean
          language: string
          planner_view: string
          rating_avg: number
          rating_count: number
          schema: Json
          tags: string[]
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          author_id?: string | null
          category: string
          category_id?: string | null
          content?: Json
          cover_url?: string | null
          created_at?: string
          description: string
          downloads_count?: number
          favorites_count?: number
          icon?: string | null
          id?: string
          is_featured?: boolean
          is_hidden?: boolean
          is_public?: boolean
          is_system?: boolean
          language?: string
          planner_view?: string
          rating_avg?: number
          rating_count?: number
          schema?: Json
          tags?: string[]
          title: string
          updated_at?: string
          version?: string
        }
        Update: {
          author_id?: string | null
          category?: string
          category_id?: string | null
          content?: Json
          cover_url?: string | null
          created_at?: string
          description?: string
          downloads_count?: number
          favorites_count?: number
          icon?: string | null
          id?: string
          is_featured?: boolean
          is_hidden?: boolean
          is_public?: boolean
          is_system?: boolean
          language?: string
          planner_view?: string
          rating_avg?: number
          rating_count?: number
          schema?: Json
          tags?: string[]
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "template_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_favorites: {
        Row: {
          created_at: string
          theme_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          theme_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          theme_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_favorites_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          theme_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          theme_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          theme_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_ratings_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          author_id: string | null
          category: string
          cover_url: string | null
          created_at: string
          description: string
          downloads_count: number
          favorites_count: number
          id: string
          is_featured: boolean
          is_hidden: boolean
          is_public: boolean
          is_system: boolean
          language: string
          rating_avg: number
          rating_count: number
          tags: string[]
          title: string
          tokens: Json
          updated_at: string
          version: string
        }
        Insert: {
          author_id?: string | null
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string
          downloads_count?: number
          favorites_count?: number
          id?: string
          is_featured?: boolean
          is_hidden?: boolean
          is_public?: boolean
          is_system?: boolean
          language?: string
          rating_avg?: number
          rating_count?: number
          tags?: string[]
          title: string
          tokens?: Json
          updated_at?: string
          version?: string
        }
        Update: {
          author_id?: string | null
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string
          downloads_count?: number
          favorites_count?: number
          id?: string
          is_featured?: boolean
          is_hidden?: boolean
          is_public?: boolean
          is_system?: boolean
          language?: string
          rating_avg?: number
          rating_count?: number
          tags?: string[]
          title?: string
          tokens?: Json
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      timeline_events: {
        Row: {
          action: string
          created_at: string
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_actions: {
        Row: {
          action_type: string
          created_at: string
          execution_time_ms: number | null
          id: string
          input_data: Json
          model_used: string | null
          output_data: Json
          provider_slug: string | null
          source: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          execution_time_ms?: number | null
          id?: string
          input_data?: Json
          model_used?: string | null
          output_data?: Json
          provider_slug?: string | null
          source?: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          execution_time_ms?: number | null
          id?: string
          input_data?: Json
          model_used?: string | null
          output_data?: Json
          provider_slug?: string | null
          source?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_insights: {
        Row: {
          generated_at: string
          id: string
          indicators: Json
          period: string
          period_end: string
          period_start: string
          suggestions: Json
          summary: string
          user_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          indicators?: Json
          period: string
          period_end: string
          period_start: string
          suggestions?: Json
          summary?: string
          user_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          indicators?: Json
          period?: string
          period_end?: string
          period_start?: string
          suggestions?: Json
          summary?: string
          user_id?: string
        }
        Relationships: []
      }
      user_memory: {
        Row: {
          confidence: number
          created_at: string
          expires_at: string | null
          id: string
          key: string
          memory_type: string
          source: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          confidence?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          key: string
          memory_type: string
          source?: string
          updated_at?: string
          user_id: string
          value?: Json
        }
        Update: {
          confidence?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          key?: string
          memory_type?: string
          source?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          layout: Json
          theme_config: Json
          theme_mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          layout?: Json
          theme_config?: Json
          theme_mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          layout?: Json
          theme_config?: Json
          theme_mode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser: string | null
          created_at: string
          device: string | null
          id: string
          ip_address: string | null
          is_current: boolean
          last_active_at: string
          location: string | null
          os: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean
          last_active_at?: string
          location?: string | null
          os?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_address?: string | null
          is_current?: boolean
          last_active_at?: string
          location?: string | null
          os?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_template_favorites: {
        Row: {
          created_at: string
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          template_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_template_favorites_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          event: string
          id: string
          request_body: Json
          response_body: string | null
          status_code: number | null
          webhook_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event?: string
          id?: string
          request_body?: Json
          response_body?: string | null
          status_code?: number | null
          webhook_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event?: string
          id?: string
          request_body?: Json
          response_body?: string | null
          status_code?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          auth_token: string | null
          created_at: string
          events: string[]
          headers: Json
          http_method: string
          id: string
          is_active: boolean
          name: string
          retry_count: number
          timeout_ms: number
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          auth_token?: string | null
          created_at?: string
          events?: string[]
          headers?: Json
          http_method?: string
          id?: string
          is_active?: boolean
          name: string
          retry_count?: number
          timeout_ms?: number
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          auth_token?: string | null
          created_at?: string
          events?: string[]
          headers?: Json
          http_method?: string
          id?: string
          is_active?: boolean
          name?: string
          retry_count?: number
          timeout_ms?: number
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "global_admin" | "user"
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
      app_role: ["global_admin", "user"],
    },
  },
} as const
