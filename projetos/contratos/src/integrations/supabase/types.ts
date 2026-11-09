export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_email: string | null;
          actor_id: string | null;
          created_at: string;
          entity: string | null;
          entity_id: string | null;
          id: string;
          ip_address: string | null;
          metadata: Json;
          workspace_id: string | null;
        };
        Insert: {
          action: string;
          actor_email?: string | null;
          actor_id?: string | null;
          created_at?: string;
          entity?: string | null;
          entity_id?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json;
          workspace_id?: string | null;
        };
        Update: {
          action?: string;
          actor_email?: string | null;
          actor_id?: string | null;
          created_at?: string;
          entity?: string | null;
          entity_id?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      builder_blocks: {
        Row: {
          builder_id: string;
          clause_id: string | null;
          clause_version: number | null;
          condition: Json | null;
          content: string | null;
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["builder_block_kind"];
          meta: Json;
          order_seq: number;
          parent_id: string | null;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          builder_id: string;
          clause_id?: string | null;
          clause_version?: number | null;
          condition?: Json | null;
          content?: string | null;
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["builder_block_kind"];
          meta?: Json;
          order_seq?: number;
          parent_id?: string | null;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          builder_id?: string;
          clause_id?: string | null;
          clause_version?: number | null;
          condition?: Json | null;
          content?: string | null;
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["builder_block_kind"];
          meta?: Json;
          order_seq?: number;
          parent_id?: string | null;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "builder_blocks_builder_id_fkey";
            columns: ["builder_id"];
            isOneToOne: false;
            referencedRelation: "builders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "builder_blocks_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "builder_blocks";
            referencedColumns: ["id"];
          },
        ];
      };
      builders: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          layout: Json;
          name: string;
          project_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          layout?: Json;
          name: string;
          project_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          layout?: Json;
          name?: string;
          project_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "builders_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      clauses: {
        Row: {
          content: string | null;
          created_at: string;
          id: string;
          library_id: string;
          tags: string[];
          title: string;
          version: number;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          id?: string;
          library_id: string;
          tags?: string[];
          title: string;
          version?: number;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          id?: string;
          library_id?: string;
          tags?: string[];
          title?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "clauses_library_id_fkey";
            columns: ["library_id"];
            isOneToOne: false;
            referencedRelation: "libraries";
            referencedColumns: ["id"];
          },
        ];
      };
      connectors: {
        Row: {
          config: Json;
          created_at: string;
          id: string;
          is_enabled: boolean;
          kind: Database["public"]["Enums"]["connector_kind"];
          name: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          id?: string;
          is_enabled?: boolean;
          kind: Database["public"]["Enums"]["connector_kind"];
          name: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          id?: string;
          is_enabled?: boolean;
          kind?: Database["public"]["Enums"]["connector_kind"];
          name?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "connectors_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      credentials: {
        Row: {
          created_at: string;
          created_by: string | null;
          encrypted_payload: string | null;
          fingerprint: string | null;
          id: string;
          name: string;
          provider: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          encrypted_payload?: string | null;
          fingerprint?: string | null;
          id?: string;
          name: string;
          provider: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          encrypted_payload?: string | null;
          fingerprint?: string | null;
          id?: string;
          name?: string;
          provider?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credentials_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      data_sources: {
        Row: {
          config: Json;
          connector_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          kind: string | null;
          name: string;
          project_id: string | null;
          updated_at: string;
          workspace_id: string | null;
        };
        Insert: {
          config?: Json;
          connector_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          kind?: string | null;
          name: string;
          project_id?: string | null;
          updated_at?: string;
          workspace_id?: string | null;
        };
        Update: {
          config?: Json;
          connector_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          kind?: string | null;
          name?: string;
          project_id?: string | null;
          updated_at?: string;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "data_sources_connector_id_fkey";
            columns: ["connector_id"];
            isOneToOne: false;
            referencedRelation: "connectors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "data_sources_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      execution_logs: {
        Row: {
          created_at: string;
          data: Json | null;
          execution_id: string;
          id: string;
          level: Database["public"]["Enums"]["execution_log_level"];
          message: string | null;
          step: string;
        };
        Insert: {
          created_at?: string;
          data?: Json | null;
          execution_id: string;
          id?: string;
          level?: Database["public"]["Enums"]["execution_log_level"];
          message?: string | null;
          step: string;
        };
        Update: {
          created_at?: string;
          data?: Json | null;
          execution_id?: string;
          id?: string;
          level?: Database["public"]["Enums"]["execution_log_level"];
          message?: string | null;
          step?: string;
        };
        Relationships: [
          {
            foreignKeyName: "execution_logs_execution_id_fkey";
            columns: ["execution_id"];
            isOneToOne: false;
            referencedRelation: "executions";
            referencedColumns: ["id"];
          },
        ];
      };
      executions: {
        Row: {
          context: Json;
          created_at: string;
          duration_ms: number | null;
          error: string | null;
          finished_at: string | null;
          id: string;
          input: Json;
          output: Json | null;
          project_id: string | null;
          record_id: string | null;
          source_id: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["execution_status"];
          triggered_by: string | null;
          version_number: number | null;
          workspace_id: string;
        };
        Insert: {
          context?: Json;
          created_at?: string;
          duration_ms?: number | null;
          error?: string | null;
          finished_at?: string | null;
          id?: string;
          input?: Json;
          output?: Json | null;
          project_id?: string | null;
          record_id?: string | null;
          source_id?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["execution_status"];
          triggered_by?: string | null;
          version_number?: number | null;
          workspace_id: string;
        };
        Update: {
          context?: Json;
          created_at?: string;
          duration_ms?: number | null;
          error?: string | null;
          finished_at?: string | null;
          id?: string;
          input?: Json;
          output?: Json | null;
          project_id?: string | null;
          record_id?: string | null;
          source_id?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["execution_status"];
          triggered_by?: string | null;
          version_number?: number | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "executions_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "executions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      flow_connections: {
        Row: {
          condition: Json | null;
          created_at: string;
          flow_id: string;
          from_node_id: string;
          id: string;
          kind: Database["public"]["Enums"]["flow_connection_kind"];
          to_node_id: string;
        };
        Insert: {
          condition?: Json | null;
          created_at?: string;
          flow_id: string;
          from_node_id: string;
          id?: string;
          kind?: Database["public"]["Enums"]["flow_connection_kind"];
          to_node_id: string;
        };
        Update: {
          condition?: Json | null;
          created_at?: string;
          flow_id?: string;
          from_node_id?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["flow_connection_kind"];
          to_node_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flow_connections_flow_id_fkey";
            columns: ["flow_id"];
            isOneToOne: false;
            referencedRelation: "flows";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flow_connections_from_node_id_fkey";
            columns: ["from_node_id"];
            isOneToOne: false;
            referencedRelation: "flow_nodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flow_connections_to_node_id_fkey";
            columns: ["to_node_id"];
            isOneToOne: false;
            referencedRelation: "flow_nodes";
            referencedColumns: ["id"];
          },
        ];
      };
      flow_nodes: {
        Row: {
          config: Json;
          created_at: string;
          flow_id: string;
          id: string;
          kind: Database["public"]["Enums"]["flow_node_kind"];
          position_x: number;
          position_y: number;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          flow_id: string;
          id?: string;
          kind: Database["public"]["Enums"]["flow_node_kind"];
          position_x?: number;
          position_y?: number;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          flow_id?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["flow_node_kind"];
          position_x?: number;
          position_y?: number;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flow_nodes_flow_id_fkey";
            columns: ["flow_id"];
            isOneToOne: false;
            referencedRelation: "flows";
            referencedColumns: ["id"];
          },
        ];
      };
      flows: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          project_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          project_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          project_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flows_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      generated_documents: {
        Row: {
          content: string | null;
          content_format: string;
          created_at: string;
          document_status: Database["public"]["Enums"]["document_status"];
          edited_at: string | null;
          execution_id: string | null;
          format: string;
          id: string;
          name: string;
          project_id: string | null;
          project_version: number | null;
          size_bytes: number | null;
          storage_path: string | null;
          version: number;
          workspace_id: string;
        };
        Insert: {
          content?: string | null;
          content_format?: string;
          created_at?: string;
          document_status?: Database["public"]["Enums"]["document_status"];
          edited_at?: string | null;
          execution_id?: string | null;
          format?: string;
          id?: string;
          name: string;
          project_id?: string | null;
          project_version?: number | null;
          size_bytes?: number | null;
          storage_path?: string | null;
          version?: number;
          workspace_id: string;
        };
        Update: {
          content?: string | null;
          content_format?: string;
          created_at?: string;
          document_status?: Database["public"]["Enums"]["document_status"];
          edited_at?: string | null;
          execution_id?: string | null;
          format?: string;
          id?: string;
          name?: string;
          project_id?: string | null;
          project_version?: number | null;
          size_bytes?: number | null;
          storage_path?: string | null;
          version?: number;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generated_documents_execution_id_fkey";
            columns: ["execution_id"];
            isOneToOne: false;
            referencedRelation: "executions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generated_documents_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generated_documents_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      group_members: {
        Row: {
          created_at: string;
          group_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          group_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          group_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      groups: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_system: boolean;
          key: string;
          name: string;
          workspace_id: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_system?: boolean;
          key: string;
          name: string;
          workspace_id?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_system?: boolean;
          key?: string;
          name?: string;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "groups_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      libraries: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "libraries_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          level: string;
          read_at: string | null;
          title: string;
          user_id: string;
          workspace_id: string | null;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          level?: string;
          read_at?: string | null;
          title: string;
          user_id: string;
          workspace_id?: string | null;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          level?: string;
          read_at?: string | null;
          title?: string;
          user_id?: string;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      permissions: {
        Row: {
          description: string | null;
          key: string;
          module: string;
        };
        Insert: {
          description?: string | null;
          key: string;
          module: string;
        };
        Update: {
          description?: string | null;
          key?: string;
          module?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          job_title: string | null;
          last_seen_at: string | null;
          locale: string;
          mfa_enabled: boolean;
          status: Database["public"]["Enums"]["member_status"];
          theme: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          job_title?: string | null;
          last_seen_at?: string | null;
          locale?: string;
          mfa_enabled?: boolean;
          status?: Database["public"]["Enums"]["member_status"];
          theme?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          job_title?: string | null;
          last_seen_at?: string | null;
          locale?: string;
          mfa_enabled?: boolean;
          status?: Database["public"]["Enums"]["member_status"];
          theme?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_data_sources: {
        Row: {
          alias: string | null;
          config: Json;
          created_at: string;
          data_source_id: string;
          id: string;
          project_id: string;
        };
        Insert: {
          alias?: string | null;
          config?: Json;
          created_at?: string;
          data_source_id: string;
          id?: string;
          project_id: string;
        };
        Update: {
          alias?: string | null;
          config?: Json;
          created_at?: string;
          data_source_id?: string;
          id?: string;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_data_sources_data_source_id_fkey";
            columns: ["data_source_id"];
            isOneToOne: false;
            referencedRelation: "data_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_data_sources_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_versions: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          project_id: string;
          published_at: string | null;
          snapshot: Json;
          version: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          project_id: string;
          published_at?: string | null;
          snapshot?: Json;
          version?: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          project_id?: string;
          published_at?: string | null;
          snapshot?: Json;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "project_versions_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          status: Database["public"]["Enums"]["project_status"];
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          status?: Database["public"]["Enums"]["project_status"];
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["project_status"];
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      role_permissions: {
        Row: {
          id: string;
          permission_key: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          id?: string;
          permission_key: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          id?: string;
          permission_key?: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey";
            columns: ["permission_key"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["key"];
          },
        ];
      };
      rules: {
        Row: {
          created_at: string;
          description: string | null;
          expression: Json;
          id: string;
          is_active: boolean;
          message: string | null;
          name: string;
          order_seq: number;
          project_id: string;
          severity: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          expression?: Json;
          id?: string;
          is_active?: boolean;
          message?: string | null;
          name: string;
          order_seq?: number;
          project_id: string;
          severity?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          expression?: Json;
          id?: string;
          is_active?: boolean;
          message?: string | null;
          name?: string;
          order_seq?: number;
          project_id?: string;
          severity?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rules_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: {
          id: string;
          key: string;
          scope: string;
          updated_at: string;
          value: Json;
          workspace_id: string | null;
        };
        Insert: {
          id?: string;
          key: string;
          scope?: string;
          updated_at?: string;
          value?: Json;
          workspace_id?: string | null;
        };
        Update: {
          id?: string;
          key?: string;
          scope?: string;
          updated_at?: string;
          value?: Json;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "settings_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
          workspace_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
          workspace_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      validation_results: {
        Row: {
          code: string | null;
          context: Json;
          created_at: string;
          id: string;
          level: Database["public"]["Enums"]["validation_level"];
          message: string;
          project_id: string;
          scope: Database["public"]["Enums"]["validation_scope"];
        };
        Insert: {
          code?: string | null;
          context?: Json;
          created_at?: string;
          id?: string;
          level?: Database["public"]["Enums"]["validation_level"];
          message: string;
          project_id: string;
          scope: Database["public"]["Enums"]["validation_scope"];
        };
        Update: {
          code?: string | null;
          context?: Json;
          created_at?: string;
          id?: string;
          level?: Database["public"]["Enums"]["validation_level"];
          message?: string;
          project_id?: string;
          scope?: Database["public"]["Enums"]["validation_scope"];
        };
        Relationships: [
          {
            foreignKeyName: "validation_results_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      variable_mappings: {
        Row: {
          constant_value: Json | null;
          created_at: string;
          expression: string | null;
          fallback: Json | null;
          field_path: string | null;
          id: string;
          is_required: boolean;
          project_id: string;
          source_id: string | null;
          transform: string | null;
          value_kind: Database["public"]["Enums"]["mapping_value_kind"];
          variable_id: string;
        };
        Insert: {
          constant_value?: Json | null;
          created_at?: string;
          expression?: string | null;
          fallback?: Json | null;
          field_path?: string | null;
          id?: string;
          is_required?: boolean;
          project_id: string;
          source_id?: string | null;
          transform?: string | null;
          value_kind?: Database["public"]["Enums"]["mapping_value_kind"];
          variable_id: string;
        };
        Update: {
          constant_value?: Json | null;
          created_at?: string;
          expression?: string | null;
          fallback?: Json | null;
          field_path?: string | null;
          id?: string;
          is_required?: boolean;
          project_id?: string;
          source_id?: string | null;
          transform?: string | null;
          value_kind?: Database["public"]["Enums"]["mapping_value_kind"];
          variable_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "variable_mappings_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "variable_mappings_variable_id_fkey";
            columns: ["variable_id"];
            isOneToOne: false;
            referencedRelation: "variables";
            referencedColumns: ["id"];
          },
        ];
      };
      variables: {
        Row: {
          created_at: string;
          data_type: string;
          default_value: Json | null;
          id: string;
          is_required: boolean;
          key: string;
          label: string | null;
          project_id: string;
        };
        Insert: {
          created_at?: string;
          data_type?: string;
          default_value?: Json | null;
          id?: string;
          is_required?: boolean;
          key: string;
          label?: string | null;
          project_id: string;
        };
        Update: {
          created_at?: string;
          data_type?: string;
          default_value?: Json | null;
          id?: string;
          is_required?: boolean;
          key?: string;
          label?: string | null;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "variables_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_members: {
        Row: {
          id: string;
          invited_by: string | null;
          is_default: boolean;
          joined_at: string;
          status: Database["public"]["Enums"]["member_status"];
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          id?: string;
          invited_by?: string | null;
          is_default?: boolean;
          joined_at?: string;
          status?: Database["public"]["Enums"]["member_status"];
          user_id: string;
          workspace_id: string;
        };
        Update: {
          id?: string;
          invited_by?: string | null;
          is_default?: boolean;
          joined_at?: string;
          status?: Database["public"]["Enums"]["member_status"];
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspaces: {
        Row: {
          branding: Json;
          created_at: string;
          domain: string | null;
          id: string;
          locale: string;
          logo_url: string | null;
          name: string;
          plan: Database["public"]["Enums"]["workspace_plan"];
          settings: Json;
          slug: string;
          status: Database["public"]["Enums"]["workspace_status"];
          timezone: string;
          updated_at: string;
        };
        Insert: {
          branding?: Json;
          created_at?: string;
          domain?: string | null;
          id?: string;
          locale?: string;
          logo_url?: string | null;
          name: string;
          plan?: Database["public"]["Enums"]["workspace_plan"];
          settings?: Json;
          slug: string;
          status?: Database["public"]["Enums"]["workspace_status"];
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          branding?: Json;
          created_at?: string;
          domain?: string | null;
          id?: string;
          locale?: string;
          logo_url?: string | null;
          name?: string;
          plan?: Database["public"]["Enums"]["workspace_plan"];
          settings?: Json;
          slug?: string;
          status?: Database["public"]["Enums"]["workspace_status"];
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_agents: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          is_system: boolean;
          key: string;
          model: string | null;
          name: string;
          objective: string | null;
          status: Database["public"]["Enums"]["ai_agent_status"];
          system_prompt: string;
          temperature: number;
          tools: Json;
          updated_at: string;
          workspace_id: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_system?: boolean;
          key: string;
          model?: string | null;
          name: string;
          objective?: string | null;
          status?: Database["public"]["Enums"]["ai_agent_status"];
          system_prompt?: string;
          temperature?: number;
          tools?: Json;
          updated_at?: string;
          workspace_id?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_system?: boolean;
          key?: string;
          model?: string | null;
          name?: string;
          objective?: string | null;
          status?: Database["public"]["Enums"]["ai_agent_status"];
          system_prompt?: string;
          temperature?: number;
          tools?: Json;
          updated_at?: string;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_agents_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_conversations: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          is_favorite: boolean;
          pinned: boolean;
          project_id: string | null;
          title: string;
          updated_at: string;
          workspace_id: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_favorite?: boolean;
          pinned?: boolean;
          project_id?: string | null;
          title?: string;
          updated_at?: string;
          workspace_id?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_favorite?: boolean;
          pinned?: boolean;
          project_id?: string | null;
          title?: string;
          updated_at?: string;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_conversations_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_conversations_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_executions: {
        Row: {
          agent_id: string | null;
          completion_tokens: number | null;
          conversation_id: string | null;
          cost_estimate: number | null;
          created_at: string;
          created_by: string | null;
          document_id: string | null;
          error: string | null;
          finished_at: string | null;
          id: string;
          input: Json;
          latency_ms: number | null;
          model: string | null;
          output: Json | null;
          project_id: string | null;
          prompt_id: string | null;
          prompt_tokens: number | null;
          provider_id: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["ai_execution_status"];
          total_tokens: number | null;
          workspace_id: string | null;
        };
        Insert: {
          agent_id?: string | null;
          completion_tokens?: number | null;
          conversation_id?: string | null;
          cost_estimate?: number | null;
          created_at?: string;
          created_by?: string | null;
          document_id?: string | null;
          error?: string | null;
          finished_at?: string | null;
          id?: string;
          input?: Json;
          latency_ms?: number | null;
          model?: string | null;
          output?: Json | null;
          project_id?: string | null;
          prompt_id?: string | null;
          prompt_tokens?: number | null;
          provider_id?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["ai_execution_status"];
          total_tokens?: number | null;
          workspace_id?: string | null;
        };
        Update: {
          agent_id?: string | null;
          completion_tokens?: number | null;
          conversation_id?: string | null;
          cost_estimate?: number | null;
          created_at?: string;
          created_by?: string | null;
          document_id?: string | null;
          error?: string | null;
          finished_at?: string | null;
          id?: string;
          input?: Json;
          latency_ms?: number | null;
          model?: string | null;
          output?: Json | null;
          project_id?: string | null;
          prompt_id?: string | null;
          prompt_tokens?: number | null;
          provider_id?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["ai_execution_status"];
          total_tokens?: number | null;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_executions_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_executions_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "ai_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_executions_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "document_uploads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_executions_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_executions_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "ai_prompts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_executions_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "ai_providers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_executions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_messages: {
        Row: {
          content: string;
          conversation_id: string;
          cost_estimate: number | null;
          created_at: string;
          id: string;
          input_tokens: number | null;
          model: string | null;
          output_tokens: number | null;
          provider_id: string | null;
          role: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
          cost_estimate?: number | null;
          created_at?: string;
          id?: string;
          input_tokens?: number | null;
          model?: string | null;
          output_tokens?: number | null;
          provider_id?: string | null;
          role: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          cost_estimate?: number | null;
          created_at?: string;
          id?: string;
          input_tokens?: number | null;
          model?: string | null;
          output_tokens?: number | null;
          provider_id?: string | null;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "ai_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_messages_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "ai_providers";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_models: {
        Row: {
          context_tokens: number | null;
          display_name: string;
          id: string;
          input_price_1m: number | null;
          is_beta: boolean;
          model_key: string;
          output_price_1m: number | null;
          provider_kind: Database["public"]["Enums"]["ai_provider_kind"];
          supports_embeddings: boolean;
          supports_moderation: boolean;
          supports_streaming: boolean;
        };
        Insert: {
          context_tokens?: number | null;
          display_name: string;
          id?: string;
          input_price_1m?: number | null;
          is_beta?: boolean;
          model_key: string;
          output_price_1m?: number | null;
          provider_kind: Database["public"]["Enums"]["ai_provider_kind"];
          supports_embeddings?: boolean;
          supports_moderation?: boolean;
          supports_streaming?: boolean;
        };
        Update: {
          context_tokens?: number | null;
          display_name?: string;
          id?: string;
          input_price_1m?: number | null;
          is_beta?: boolean;
          model_key?: string;
          output_price_1m?: number | null;
          provider_kind?: Database["public"]["Enums"]["ai_provider_kind"];
          supports_embeddings?: boolean;
          supports_moderation?: boolean;
          supports_streaming?: boolean;
        };
        Relationships: [];
      };
      ai_prompt_versions: {
        Row: {
          content: Json;
          created_at: string;
          created_by: string | null;
          id: string;
          prompt_id: string;
          version: number;
        };
        Insert: {
          content?: Json;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          prompt_id: string;
          version: number;
        };
        Update: {
          content?: Json;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          prompt_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ai_prompt_versions_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "ai_prompts";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_prompts: {
        Row: {
          author_id: string | null;
          category: string | null;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          prompt: string;
          slug: string;
          status: Database["public"]["Enums"]["ai_prompt_status"];
          suggested_model: string | null;
          system_prompt: string | null;
          tags: Json;
          temperature: number;
          updated_at: string;
          version: number;
          workspace_id: string | null;
        };
        Insert: {
          author_id?: string | null;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          prompt: string;
          slug: string;
          status?: Database["public"]["Enums"]["ai_prompt_status"];
          suggested_model?: string | null;
          system_prompt?: string | null;
          tags?: Json;
          temperature?: number;
          updated_at?: string;
          version?: number;
          workspace_id?: string | null;
        };
        Update: {
          author_id?: string | null;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          prompt?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["ai_prompt_status"];
          suggested_model?: string | null;
          system_prompt?: string | null;
          tags?: Json;
          temperature?: number;
          updated_at?: string;
          version?: number;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_prompts_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_providers: {
        Row: {
          api_key_encrypted: string | null;
          api_key_fingerprint: string | null;
          base_url: string | null;
          created_at: string;
          created_by: string | null;
          default_model: string | null;
          default_temperature: number;
          id: string;
          is_default: boolean;
          kind: Database["public"]["Enums"]["ai_provider_kind"];
          max_tokens: number;
          name: string;
          status: Database["public"]["Enums"]["ai_provider_status"];
          timeout_ms: number;
          updated_at: string;
          workspace_id: string | null;
        };
        Insert: {
          api_key_encrypted?: string | null;
          api_key_fingerprint?: string | null;
          base_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          default_model?: string | null;
          default_temperature?: number;
          id?: string;
          is_default?: boolean;
          kind: Database["public"]["Enums"]["ai_provider_kind"];
          max_tokens?: number;
          name: string;
          status?: Database["public"]["Enums"]["ai_provider_status"];
          timeout_ms?: number;
          updated_at?: string;
          workspace_id?: string | null;
        };
        Update: {
          api_key_encrypted?: string | null;
          api_key_fingerprint?: string | null;
          base_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          default_model?: string | null;
          default_temperature?: number;
          id?: string;
          is_default?: boolean;
          kind?: Database["public"]["Enums"]["ai_provider_kind"];
          max_tokens?: number;
          name?: string;
          status?: Database["public"]["Enums"]["ai_provider_status"];
          timeout_ms?: number;
          updated_at?: string;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_providers_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_tools: {
        Row: {
          description: string | null;
          engine: Database["public"]["Enums"]["ai_tool_engine"];
          id: string;
          is_system: boolean;
          key: string;
          name: string;
        };
        Insert: {
          description?: string | null;
          engine?: Database["public"]["Enums"]["ai_tool_engine"];
          id?: string;
          is_system?: boolean;
          key: string;
          name: string;
        };
        Update: {
          description?: string | null;
          engine?: Database["public"]["Enums"]["ai_tool_engine"];
          id?: string;
          is_system?: boolean;
          key?: string;
          name?: string;
        };
        Relationships: [];
      };
      document_analyses: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          model: string | null;
          project_id: string | null;
          report: Json;
          risk_level: Database["public"]["Enums"]["document_risk_level"];
          summary: string | null;
          upload_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          model?: string | null;
          project_id?: string | null;
          report?: Json;
          risk_level?: Database["public"]["Enums"]["document_risk_level"];
          summary?: string | null;
          upload_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          model?: string | null;
          project_id?: string | null;
          report?: Json;
          risk_level?: Database["public"]["Enums"]["document_risk_level"];
          summary?: string | null;
          upload_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_analyses_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_analyses_upload_id_fkey";
            columns: ["upload_id"];
            isOneToOne: false;
            referencedRelation: "document_uploads";
            referencedColumns: ["id"];
          },
        ];
      };
      document_upload_chunks: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          seq: number;
          token_count: number | null;
          upload_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          seq: number;
          token_count?: number | null;
          upload_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          seq?: number;
          token_count?: number | null;
          upload_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_upload_chunks_upload_id_fkey";
            columns: ["upload_id"];
            isOneToOne: false;
            referencedRelation: "document_uploads";
            referencedColumns: ["id"];
          },
        ];
      };
      document_uploads: {
        Row: {
          created_at: string;
          created_by: string | null;
          error: string | null;
          extracted_text: string | null;
          file_kind: Database["public"]["Enums"]["upload_file_kind"];
          id: string;
          library_id: string | null;
          mime_type: string | null;
          original_name: string;
          project_id: string | null;
          size_bytes: number | null;
          status: Database["public"]["Enums"]["upload_status"];
          storage_path: string | null;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          error?: string | null;
          extracted_text?: string | null;
          file_kind: Database["public"]["Enums"]["upload_file_kind"];
          id?: string;
          library_id?: string | null;
          mime_type?: string | null;
          original_name: string;
          project_id?: string | null;
          size_bytes?: number | null;
          status?: Database["public"]["Enums"]["upload_status"];
          storage_path?: string | null;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          error?: string | null;
          extracted_text?: string | null;
          file_kind?: Database["public"]["Enums"]["upload_file_kind"];
          id?: string;
          library_id?: string | null;
          mime_type?: string | null;
          original_name?: string;
          project_id?: string | null;
          size_bytes?: number | null;
          status?: Database["public"]["Enums"]["upload_status"];
          storage_path?: string | null;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_uploads_library_id_fkey";
            columns: ["library_id"];
            isOneToOne: false;
            referencedRelation: "libraries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_uploads_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_uploads_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_sources: {
        Row: {
          content: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          kind: Database["public"]["Enums"]["knowledge_source_kind"];
          status: string;
          title: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["knowledge_source_kind"];
          status?: string;
          title: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["knowledge_source_kind"];
          status?: string;
          title?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_sources_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
          _workspace_id?: string;
        };
        Returns: boolean;
      };
      is_global_admin: { Args: { _user_id: string }; Returns: boolean };
      is_workspace_admin: {
        Args: { _user_id: string; _workspace_id: string };
        Returns: boolean;
      };
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "super_admin" | "workspace_admin" | "manager" | "editor" | "reviewer" | "viewer";
      connector_kind: "google_sheets" | "google_docs" | "rest_api" | "csv" | "xlsx" | "json";
      execution_status: "pending" | "running" | "succeeded" | "failed" | "cancelled";
      member_status: "active" | "invited" | "suspended";
      project_status: "draft" | "active" | "archived";
      workspace_plan: "free" | "starter" | "business" | "enterprise";
      workspace_status: "active" | "trial" | "suspended" | "archived";
      ai_agent_status: "enabled" | "disabled";
      ai_execution_status: "pending" | "running" | "succeeded" | "failed" | "cancelled";
      ai_provider_kind: "openai" | "gemini" | "claude" | "openrouter" | "azure_openai" | "local";
      ai_provider_status: "active" | "disabled" | "error";
      ai_prompt_status: "draft" | "published" | "archived";
      ai_tool_engine: "native" | "llm";
      document_risk_level: "low" | "medium" | "high";
      knowledge_source_kind: "manual" | "law" | "regulation" | "policy" | "internal";
      upload_file_kind: "pdf" | "docx" | "markdown" | "txt" | "rtf" | "odt";
      upload_status: "uploaded" | "processing" | "analyzed" | "failed";
      flow_node_kind: "start" | "load_data" | "validate" | "transform" | "rules" | "build_document" | "human_review" | "approval" | "generate" | "export" | "end";
      flow_connection_kind: "default" | "condition" | "success" | "failure";
      builder_block_kind: "clause" | "section" | "text" | "variable" | "conditional";
      document_status: "generated" | "edited" | "exported";
      validation_level: "error" | "warning" | "info";
      validation_scope: "data" | "variables" | "rules" | "clauses" | "builder" | "workflow";
      execution_log_level: "info" | "warning" | "error";
      mapping_value_kind: "field" | "constant" | "expression";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "workspace_admin", "manager", "editor", "reviewer", "viewer"],
      connector_kind: ["google_sheets", "google_docs", "rest_api", "csv", "xlsx", "json"],
      execution_status: ["pending", "running", "succeeded", "failed", "cancelled"],
      member_status: ["active", "invited", "suspended"],
      project_status: ["draft", "active", "archived"],
      workspace_plan: ["free", "starter", "business", "enterprise"],
      workspace_status: ["active", "trial", "suspended", "archived"],
      flow_node_kind: ["start", "load_data", "validate", "transform", "rules", "build_document", "human_review", "approval", "generate", "export", "end"],
      flow_connection_kind: ["default", "condition", "success", "failure"],
      builder_block_kind: ["clause", "section", "text", "variable", "conditional"],
      document_status: ["generated", "edited", "exported"],
      validation_level: ["error", "warning", "info"],
      validation_scope: ["data", "variables", "rules", "clauses", "builder", "workflow"],
      execution_log_level: ["info", "warning", "error"],
      mapping_value_kind: ["field", "constant", "expression"],
    },
  },
} as const;
