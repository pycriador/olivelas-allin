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
      acl: {
        Row: {
          actions: string[]
          effect: string
          id: string
          resource: string
          resource_id: string
          user_id: string
        }
        Insert: {
          actions?: string[]
          effect?: string
          id: string
          resource: string
          resource_id: string
          user_id: string
        }
        Update: {
          actions?: string[]
          effect?: string
          id?: string
          resource?: string
          resource_id?: string
          user_id?: string
        }
        Relationships: []
      }
      activities: {
        Row: {
          action: string
          actor: string
          at: number
          id: string
          summary: string
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          actor?: string
          at: number
          id: string
          summary?: string
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          actor?: string
          at?: number
          id?: string
          summary?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          at: number
          detail: string | null
          duration_ms: number
          entity: string
          entity_id: string | null
          event: string
          id: string
          ip: string | null
          result: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          at: number
          detail?: string | null
          duration_ms?: number
          entity: string
          entity_id?: string | null
          event: string
          id: string
          ip?: string | null
          result?: string
          user_id?: string | null
          user_name?: string
        }
        Update: {
          at?: number
          detail?: string | null
          duration_ms?: number
          entity?: string
          entity_id?: string | null
          event?: string
          id?: string
          ip?: string | null
          result?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          id: string
          order: number
          sprint_id: string
          status: string
          title: string
        }
        Insert: {
          id: string
          order?: number
          sprint_id: string
          status?: string
          title: string
        }
        Update: {
          id?: string
          order?: number
          sprint_id?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      document_history: {
        Row: {
          change_type: string
          changed_at: number
          changed_by: string | null
          changed_by_name: string
          id: string
          node_id: string
          project_id: string
          summary: string
          version: number
        }
        Insert: {
          change_type?: string
          changed_at?: number
          changed_by?: string | null
          changed_by_name?: string
          id: string
          node_id: string
          project_id: string
          summary?: string
          version?: number
        }
        Update: {
          change_type?: string
          changed_at?: number
          changed_by?: string | null
          changed_by_name?: string
          id?: string
          node_id?: string
          project_id?: string
          summary?: string
          version?: number
        }
        Relationships: []
      }
      document_relations: {
        Row: {
          created_at: number
          created_by: string | null
          id: string
          project_id: string
          relationship_type: string
          source_id: string
          target_id: string
        }
        Insert: {
          created_at?: number
          created_by?: string | null
          id: string
          project_id: string
          relationship_type?: string
          source_id: string
          target_id: string
        }
        Update: {
          created_at?: number
          created_by?: string | null
          id?: string
          project_id?: string
          relationship_type?: string
          source_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_relations_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_relations_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          blocks: Json
          id: string
          specification_id: string
        }
        Insert: {
          blocks?: Json
          id: string
          specification_id: string
        }
        Update: {
          blocks?: Json
          id?: string
          specification_id?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          created_at: number
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: number
          group_id: string
          id: string
          user_id: string
        }
        Update: {
          created_at?: number
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: number
          description: string | null
          id: string
          name: string
          role_id: string | null
          status: string
          system: boolean
          updated_at: number
          workspace_id: string | null
        }
        Insert: {
          created_at?: number
          description?: string | null
          id: string
          name: string
          role_id?: string | null
          status?: string
          system?: boolean
          updated_at?: number
          workspace_id?: string | null
        }
        Update: {
          created_at?: number
          description?: string | null
          id?: string
          name?: string
          role_id?: string | null
          status?: string
          system?: boolean
          updated_at?: number
          workspace_id?: string | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: number
          id: string
          joined_at: number
          role_id: string
          status: string
          updated_at: number
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: number
          id: string
          joined_at?: number
          role_id: string
          status?: string
          updated_at?: number
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: number
          id?: string
          joined_at?: number
          role_id?: string
          status?: string
          updated_at?: number
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      nodes: {
        Row: {
          archived: boolean
          content: string | null
          created_at: number
          created_by: string | null
          deleted: boolean
          description: string | null
          document_type: string | null
          extension: string | null
          id: string
          kind: string
          links: string[]
          mime_type: string | null
          name: string
          order: number
          parent_id: string | null
          project_id: string
          size_bytes: number | null
          status: string
          storage_path: string | null
          tags: string[]
          target_id: string | null
          updated_at: number
          updated_by: string | null
          url: string | null
        }
        Insert: {
          archived?: boolean
          content?: string | null
          created_at?: number
          created_by?: string | null
          deleted?: boolean
          description?: string | null
          document_type?: string | null
          extension?: string | null
          id: string
          kind?: string
          links?: string[]
          mime_type?: string | null
          name: string
          order?: number
          parent_id?: string | null
          project_id: string
          size_bytes?: number | null
          status?: string
          storage_path?: string | null
          tags?: string[]
          target_id?: string | null
          updated_at?: number
          updated_by?: string | null
          url?: string | null
        }
        Update: {
          archived?: boolean
          content?: string | null
          created_at?: number
          created_by?: string | null
          deleted?: boolean
          description?: string | null
          document_type?: string | null
          extension?: string | null
          id?: string
          kind?: string
          links?: string[]
          mime_type?: string | null
          name?: string
          order?: number
          parent_id?: string | null
          project_id?: string
          size_bytes?: number | null
          status?: string
          storage_path?: string | null
          tags?: string[]
          target_id?: string | null
          updated_at?: number
          updated_by?: string | null
          url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: number
          email: string
          failed_attempts: number
          group_ids: string[]
          id: string
          last_login: number | null
          locked_until: number | null
          mfa_enabled: boolean
          name: string
          role_id: string
          status: string
          updated_at: number
        }
        Insert: {
          avatar?: string | null
          created_at?: number
          email: string
          failed_attempts?: number
          group_ids?: string[]
          id: string
          last_login?: number | null
          locked_until?: number | null
          mfa_enabled?: boolean
          name?: string
          role_id?: string
          status?: string
          updated_at?: number
        }
        Update: {
          avatar?: string | null
          created_at?: number
          email?: string
          failed_attempts?: number
          group_ids?: string[]
          id?: string
          last_login?: number | null
          locked_until?: number | null
          mfa_enabled?: boolean
          name?: string
          role_id?: string
          status?: string
          updated_at?: number
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string | null
          created_at: number
          description: string | null
          id: string
          name: string
          owner_id: string | null
          slug: string | null
          status: string
          updated_at: number
          workspace_id: string
        }
        Insert: {
          color?: string | null
          created_at?: number
          description?: string | null
          id: string
          name: string
          owner_id?: string | null
          slug?: string | null
          status?: string
          updated_at?: number
          workspace_id: string
        }
        Update: {
          color?: string | null
          created_at?: number
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          slug?: string | null
          status?: string
          updated_at?: number
          workspace_id?: string
        }
        Relationships: []
      }
      roadmaps: {
        Row: {
          id: string
          name: string
          order: number
          project_id: string
        }
        Insert: {
          id: string
          name: string
          order?: number
          project_id: string
        }
        Update: {
          id?: string
          name?: string
          order?: number
          project_id?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          description: string
          id: string
          name: string
          permissions: string[]
          system: boolean
        }
        Insert: {
          description?: string
          id: string
          name: string
          permissions?: string[]
          system?: boolean
        }
        Update: {
          description?: string
          id?: string
          name?: string
          permissions?: string[]
          system?: boolean
        }
        Relationships: []
      }
      snippets: {
        Row: {
          content: string
          created_at: number
          description: string | null
          id: string
          language: string
          name: string
          tags: string[]
          updated_at: number
        }
        Insert: {
          content?: string
          created_at?: number
          description?: string | null
          id: string
          language?: string
          name: string
          tags?: string[]
          updated_at?: number
        }
        Update: {
          content?: string
          created_at?: number
          description?: string | null
          id?: string
          language?: string
          name?: string
          tags?: string[]
          updated_at?: number
        }
        Relationships: []
      }
      spec_versions: {
        Row: {
          author_id: string | null
          author_name: string
          blocks: Json
          comment: string | null
          created_at: number
          id: string
          specification_id: string
          title: string
          version: number
        }
        Insert: {
          author_id?: string | null
          author_name?: string
          blocks?: Json
          comment?: string | null
          created_at?: number
          id: string
          specification_id: string
          title: string
          version: number
        }
        Update: {
          author_id?: string | null
          author_name?: string
          blocks?: Json
          comment?: string | null
          created_at?: number
          id?: string
          specification_id?: string
          title?: string
          version?: number
        }
        Relationships: []
      }
      specifications: {
        Row: {
          created_at: number
          created_by: string
          deleted: boolean
          delivery_id: string
          description: string | null
          favorite: boolean
          id: string
          status: string
          tags: string[]
          title: string
          type: string
          updated_at: number
          version: number
        }
        Insert: {
          created_at?: number
          created_by?: string
          deleted?: boolean
          delivery_id: string
          description?: string | null
          favorite?: boolean
          id: string
          status?: string
          tags?: string[]
          title: string
          type?: string
          updated_at?: number
          version?: number
        }
        Update: {
          created_at?: number
          created_by?: string
          deleted?: boolean
          delivery_id?: string
          description?: string | null
          favorite?: boolean
          id?: string
          status?: string
          tags?: string[]
          title?: string
          type?: string
          updated_at?: number
          version?: number
        }
        Relationships: []
      }
      sprints: {
        Row: {
          end_date: number | null
          id: string
          order: number
          roadmap_id: string
          start_date: number | null
          status: string
          title: string
        }
        Insert: {
          end_date?: number | null
          id: string
          order?: number
          roadmap_id: string
          start_date?: number | null
          status?: string
          title: string
        }
        Update: {
          end_date?: number | null
          id?: string
          order?: number
          roadmap_id?: string
          start_date?: number | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          id: string
          name: string
        }
        Update: {
          color?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          blocks: Json
          description: string
          id: string
          name: string
          type: string
        }
        Insert: {
          blocks?: Json
          description?: string
          id: string
          name: string
          type?: string
        }
        Update: {
          blocks?: Json
          description?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          role: string
          user_id: string
        }
        Update: {
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          avatar: string | null
          created_at: number
          description: string | null
          id: string
          name: string
          owner_id: string | null
          slug: string | null
          status: string
          updated_at: number
        }
        Insert: {
          avatar?: string | null
          created_at?: number
          description?: string | null
          id: string
          name: string
          owner_id?: string | null
          slug?: string | null
          status?: string
          updated_at?: number
        }
        Update: {
          avatar?: string | null
          created_at?: number
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          slug?: string | null
          status?: string
          updated_at?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_user: {
        Args: { _role_id?: string; _user_id: string }
        Returns: undefined
      }
      has_app_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      is_approved: { Args: never; Returns: boolean }
      is_global_admin: { Args: never; Returns: boolean }
      is_group_visible: { Args: { _group_id: string }; Returns: boolean }
      is_project_member: { Args: { _project_id: string }; Returns: boolean }
      is_workspace_member: { Args: { _workspace_id: string }; Returns: boolean }
      register_or_bootstrap: {
        Args: { _avatar: string; _email: string; _name: string }
        Returns: {
          avatar: string | null
          created_at: number
          email: string
          failed_attempts: number
          group_ids: string[]
          id: string
          last_login: number | null
          locked_until: number | null
          mfa_enabled: boolean
          name: string
          role_id: string
          status: string
          updated_at: number
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
    Enums: {},
  },
} as const
