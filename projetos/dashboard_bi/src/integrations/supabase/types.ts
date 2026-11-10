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
      activities: {
        Row: {
          action: string
          created_at: string
          id: string
          organization_id: string
          target: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          organization_id: string
          target?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          organization_id?: string
          target?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          acquired_at: string | null
          category: string | null
          id: string
          name: string
          organization_id: string
          status: string
          value: number | null
        }
        Insert: {
          acquired_at?: string | null
          category?: string | null
          id?: string
          name: string
          organization_id: string
          status?: string
          value?: number | null
        }
        Update: {
          acquired_at?: string | null
          category?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_organization_id_fkey"
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
          created_at: string
          id: string
          ip: string | null
          metadata: Json
          organization_id: string
          resource: string | null
          resource_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json
          organization_id: string
          resource?: string | null
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json
          organization_id?: string
          resource?: string | null
          resource_id?: string | null
          user_agent?: string | null
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
      catalog_tags: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboards: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          project_id: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          project_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      data_source_permissions: {
        Row: {
          access_level: Database["public"]["Enums"]["ds_access_level"]
          created_at: string
          data_source_id: string
          group_id: string | null
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["ds_access_level"]
          created_at?: string
          data_source_id: string
          group_id?: string | null
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"] | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["ds_access_level"]
          created_at?: string
          data_source_id?: string
          group_id?: string | null
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "data_source_permissions_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_source_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_source_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          active: boolean
          column_count: number
          created_at: string
          created_by: string | null
          database_name: string | null
          default_schema: string | null
          description: string | null
          environment: Database["public"]["Enums"]["ds_environment"]
          extra_config: Json
          health: Database["public"]["Enums"]["ds_health"]
          health_checked_at: string | null
          health_message: string | null
          host: string | null
          id: string
          last_synced_at: string | null
          latency_ms: number | null
          name: string
          organization_id: string
          port: number | null
          schema_count: number
          secret_ciphertext: string | null
          server_version: string | null
          ssl_ca_certificate: string | null
          ssl_client_certificate: string | null
          ssl_client_key: string | null
          ssl_enabled: boolean
          sync_frequency: Database["public"]["Enums"]["ds_sync_frequency"]
          sync_mode: Database["public"]["Enums"]["ds_sync_mode"]
          table_count: number
          tags: string[]
          timeout_ms: number
          type: Database["public"]["Enums"]["ds_type"]
          updated_at: string
          username: string | null
          view_count: number
          workspace_id: string | null
        }
        Insert: {
          active?: boolean
          column_count?: number
          created_at?: string
          created_by?: string | null
          database_name?: string | null
          default_schema?: string | null
          description?: string | null
          environment?: Database["public"]["Enums"]["ds_environment"]
          extra_config?: Json
          health?: Database["public"]["Enums"]["ds_health"]
          health_checked_at?: string | null
          health_message?: string | null
          host?: string | null
          id?: string
          last_synced_at?: string | null
          latency_ms?: number | null
          name: string
          organization_id: string
          port?: number | null
          schema_count?: number
          secret_ciphertext?: string | null
          server_version?: string | null
          ssl_ca_certificate?: string | null
          ssl_client_certificate?: string | null
          ssl_client_key?: string | null
          ssl_enabled?: boolean
          sync_frequency?: Database["public"]["Enums"]["ds_sync_frequency"]
          sync_mode?: Database["public"]["Enums"]["ds_sync_mode"]
          table_count?: number
          tags?: string[]
          timeout_ms?: number
          type: Database["public"]["Enums"]["ds_type"]
          updated_at?: string
          username?: string | null
          view_count?: number
          workspace_id?: string | null
        }
        Update: {
          active?: boolean
          column_count?: number
          created_at?: string
          created_by?: string | null
          database_name?: string | null
          default_schema?: string | null
          description?: string | null
          environment?: Database["public"]["Enums"]["ds_environment"]
          extra_config?: Json
          health?: Database["public"]["Enums"]["ds_health"]
          health_checked_at?: string | null
          health_message?: string | null
          host?: string | null
          id?: string
          last_synced_at?: string | null
          latency_ms?: number | null
          name?: string
          organization_id?: string
          port?: number | null
          schema_count?: number
          secret_ciphertext?: string | null
          server_version?: string | null
          ssl_ca_certificate?: string | null
          ssl_client_certificate?: string | null
          ssl_client_key?: string | null
          ssl_enabled?: boolean
          sync_frequency?: Database["public"]["Enums"]["ds_sync_frequency"]
          sync_mode?: Database["public"]["Enums"]["ds_sync_mode"]
          table_count?: number
          tags?: string[]
          timeout_ms?: number
          type?: Database["public"]["Enums"]["ds_type"]
          updated_at?: string
          username?: string | null
          view_count?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_sources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_columns: {
        Row: {
          created_at: string
          data_type: string | null
          dataset_id: string
          description: string | null
          format: Json
          friendly_name: string | null
          id: string
          name: string
          nullable: boolean
          organization_id: string
          sort_order: number
          updated_at: string
          visible: boolean
          visual_type: Database["public"]["Enums"]["column_visual_type"]
        }
        Insert: {
          created_at?: string
          data_type?: string | null
          dataset_id: string
          description?: string | null
          format?: Json
          friendly_name?: string | null
          id?: string
          name: string
          nullable?: boolean
          organization_id: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
          visual_type?: Database["public"]["Enums"]["column_visual_type"]
        }
        Update: {
          created_at?: string
          data_type?: string | null
          dataset_id?: string
          description?: string | null
          format?: Json
          friendly_name?: string | null
          id?: string
          name?: string
          nullable?: boolean
          organization_id?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
          visual_type?: Database["public"]["Enums"]["column_visual_type"]
        }
        Relationships: [
          {
            foreignKeyName: "dataset_columns_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dataset_columns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_favorites: {
        Row: {
          created_at: string
          dataset_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dataset_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          dataset_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dataset_favorites_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      datasets: {
        Row: {
          cache_ttl_seconds: number
          created_at: string
          data_source_id: string | null
          database_name: string | null
          description: string | null
          duplicated_from: string | null
          execution_count: number
          id: string
          last_duration_ms: number | null
          last_row_count: number | null
          last_run_at: string | null
          name: string
          object_name: string | null
          organization_id: string
          owner_id: string
          row_limit: number
          saved_query_id: string | null
          schema_name: string | null
          source_kind: Database["public"]["Enums"]["dataset_source_kind"]
          sql: string
          status: Database["public"]["Enums"]["dataset_status"]
          tags: string[]
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          cache_ttl_seconds?: number
          created_at?: string
          data_source_id?: string | null
          database_name?: string | null
          description?: string | null
          duplicated_from?: string | null
          execution_count?: number
          id?: string
          last_duration_ms?: number | null
          last_row_count?: number | null
          last_run_at?: string | null
          name: string
          object_name?: string | null
          organization_id: string
          owner_id: string
          row_limit?: number
          saved_query_id?: string | null
          schema_name?: string | null
          source_kind?: Database["public"]["Enums"]["dataset_source_kind"]
          sql: string
          status?: Database["public"]["Enums"]["dataset_status"]
          tags?: string[]
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          cache_ttl_seconds?: number
          created_at?: string
          data_source_id?: string | null
          database_name?: string | null
          description?: string | null
          duplicated_from?: string | null
          execution_count?: number
          id?: string
          last_duration_ms?: number | null
          last_row_count?: number | null
          last_run_at?: string | null
          name?: string
          object_name?: string | null
          organization_id?: string
          owner_id?: string
          row_limit?: number
          saved_query_id?: string | null
          schema_name?: string | null
          source_kind?: Database["public"]["Enums"]["dataset_source_kind"]
          sql?: string
          status?: Database["public"]["Enums"]["dataset_status"]
          tags?: string[]
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "datasets_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "datasets_duplicated_from_fkey"
            columns: ["duplicated_from"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "datasets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "datasets_saved_query_id_fkey"
            columns: ["saved_query_id"]
            isOneToOne: false
            referencedRelation: "saved_queries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "datasets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          cost_center: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          cost_center?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          cost_center?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ds_columns: {
        Row: {
          character_max_length: number | null
          comment: string | null
          created_at: string
          data_source_id: string
          data_type: string
          default_value: string | null
          description: string | null
          friendly_name: string | null
          id: string
          is_foreign_key: boolean
          is_nullable: boolean
          is_primary_key: boolean
          is_unique: boolean
          name: string
          numeric_precision: number | null
          numeric_scale: number | null
          object_id: string
          ordinal_position: number
          organization_id: string
          references_column: string | null
          references_schema: string | null
          references_table: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          character_max_length?: number | null
          comment?: string | null
          created_at?: string
          data_source_id: string
          data_type: string
          default_value?: string | null
          description?: string | null
          friendly_name?: string | null
          id?: string
          is_foreign_key?: boolean
          is_nullable?: boolean
          is_primary_key?: boolean
          is_unique?: boolean
          name: string
          numeric_precision?: number | null
          numeric_scale?: number | null
          object_id: string
          ordinal_position?: number
          organization_id: string
          references_column?: string | null
          references_schema?: string | null
          references_table?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          character_max_length?: number | null
          comment?: string | null
          created_at?: string
          data_source_id?: string
          data_type?: string
          default_value?: string | null
          description?: string | null
          friendly_name?: string | null
          id?: string
          is_foreign_key?: boolean
          is_nullable?: boolean
          is_primary_key?: boolean
          is_unique?: boolean
          name?: string
          numeric_precision?: number | null
          numeric_scale?: number | null
          object_id?: string
          ordinal_position?: number
          organization_id?: string
          references_column?: string | null
          references_schema?: string | null
          references_table?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ds_columns_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ds_columns_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "ds_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ds_columns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ds_constraints: {
        Row: {
          columns: string[]
          constraint_type: string
          created_at: string
          data_source_id: string
          definition: string | null
          id: string
          name: string
          object_id: string
          organization_id: string
          referenced_columns: string[]
          referenced_schema: string | null
          referenced_table: string | null
        }
        Insert: {
          columns?: string[]
          constraint_type: string
          created_at?: string
          data_source_id: string
          definition?: string | null
          id?: string
          name: string
          object_id: string
          organization_id: string
          referenced_columns?: string[]
          referenced_schema?: string | null
          referenced_table?: string | null
        }
        Update: {
          columns?: string[]
          constraint_type?: string
          created_at?: string
          data_source_id?: string
          definition?: string | null
          id?: string
          name?: string
          object_id?: string
          organization_id?: string
          referenced_columns?: string[]
          referenced_schema?: string | null
          referenced_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ds_constraints_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ds_constraints_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "ds_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ds_constraints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ds_indexes: {
        Row: {
          columns: string[]
          created_at: string
          data_source_id: string
          definition: string | null
          id: string
          is_primary: boolean
          is_unique: boolean
          method: string | null
          name: string
          object_id: string
          organization_id: string
        }
        Insert: {
          columns?: string[]
          created_at?: string
          data_source_id: string
          definition?: string | null
          id?: string
          is_primary?: boolean
          is_unique?: boolean
          method?: string | null
          name: string
          object_id: string
          organization_id: string
        }
        Update: {
          columns?: string[]
          created_at?: string
          data_source_id?: string
          definition?: string | null
          id?: string
          is_primary?: boolean
          is_unique?: boolean
          method?: string | null
          name?: string
          object_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ds_indexes_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ds_indexes_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "ds_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ds_indexes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ds_objects: {
        Row: {
          comment: string | null
          created_at: string
          data_source_id: string
          definition: string | null
          description: string | null
          estimated_rows: number | null
          friendly_name: string | null
          id: string
          last_synced_at: string | null
          name: string
          object_type: Database["public"]["Enums"]["ds_object_type"]
          organization_id: string
          owner_user_id: string | null
          schema_id: string
          size_bytes: number | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          data_source_id: string
          definition?: string | null
          description?: string | null
          estimated_rows?: number | null
          friendly_name?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          object_type?: Database["public"]["Enums"]["ds_object_type"]
          organization_id: string
          owner_user_id?: string | null
          schema_id: string
          size_bytes?: number | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          data_source_id?: string
          definition?: string | null
          description?: string | null
          estimated_rows?: number | null
          friendly_name?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          object_type?: Database["public"]["Enums"]["ds_object_type"]
          organization_id?: string
          owner_user_id?: string | null
          schema_id?: string
          size_bytes?: number | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ds_objects_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ds_objects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ds_objects_schema_id_fkey"
            columns: ["schema_id"]
            isOneToOne: false
            referencedRelation: "ds_schemas"
            referencedColumns: ["id"]
          },
        ]
      }
      ds_schemas: {
        Row: {
          comment: string | null
          created_at: string
          data_source_id: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          data_source_id: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          data_source_id?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ds_schemas_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ds_schemas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ds_sync_runs: {
        Row: {
          data_source_id: string
          duration_ms: number | null
          error_message: string | null
          finished_at: string | null
          id: string
          objects_added: number
          objects_changed: number
          objects_removed: number
          organization_id: string
          started_at: string
          status: Database["public"]["Enums"]["ds_sync_status"]
          trigger_source: string
          triggered_by: string | null
        }
        Insert: {
          data_source_id: string
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          objects_added?: number
          objects_changed?: number
          objects_removed?: number
          organization_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["ds_sync_status"]
          trigger_source?: string
          triggered_by?: string | null
        }
        Update: {
          data_source_id?: string
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          objects_added?: number
          objects_changed?: number
          objects_removed?: number
          organization_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["ds_sync_status"]
          trigger_source?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ds_sync_runs_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ds_sync_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          department_id: string | null
          email: string | null
          full_name: string
          hired_at: string | null
          id: string
          organization_id: string
          role_title: string | null
          status: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          email?: string | null
          full_name: string
          hired_at?: string | null
          id?: string
          organization_id: string
          role_title?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          email?: string | null
          full_name?: string
          hired_at?: string | null
          id?: string
          organization_id?: string
          role_title?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          label: string
          organization_id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          organization_id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          organization_id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string | null
          currency: string
          description: string
          id: string
          kind: string
          occurred_at: string
          organization_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          currency?: string
          description: string
          id?: string
          kind: string
          occurred_at?: string
          organization_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          currency?: string
          description?: string
          id?: string
          kind?: string
          occurred_at?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          user_id: string
        }
        Insert: {
          group_id: string
          user_id: string
        }
        Update: {
          group_id?: string
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
      group_permissions: {
        Row: {
          group_id: string
          permission_key: string
        }
        Insert: {
          group_id: string
          permission_key: string
        }
        Update: {
          group_id?: string
          permission_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions_catalog"
            referencedColumns: ["key"]
          },
        ]
      }
      groups: {
        Row: {
          active: boolean
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          active?: boolean
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          active?: boolean
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          joined_at: string
          organization_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          organization_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          organization_id?: string
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
          created_at: string
          currency_format: string
          date_format: string
          default_locale: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_format?: string
          date_format?: string
          default_locale?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_format?: string
          date_format?: string
          default_locale?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      payroll: {
        Row: {
          created_at: string
          currency: string
          employee_id: string
          gross_amount: number
          id: string
          net_amount: number
          organization_id: string
          period: string
        }
        Insert: {
          created_at?: string
          currency?: string
          employee_id: string
          gross_amount: number
          id?: string
          net_amount: number
          organization_id: string
          period: string
        }
        Update: {
          created_at?: string
          currency?: string
          employee_id?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          organization_id?: string
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          description: string | null
          id: string
          key: string
          label: string
          organization_id: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          label: string
          organization_id: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          label?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions_catalog: {
        Row: {
          action: string
          description: string | null
          key: string
          label: string
          resource: string
        }
        Insert: {
          action: string
          description?: string | null
          key: string
          label: string
          resource: string
        }
        Update: {
          action?: string
          description?: string | null
          key?: string
          label?: string
          resource?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_organization_id: string | null
          department: string | null
          display_name: string | null
          first_name: string | null
          full_name: string | null
          id: string
          job_title: string | null
          last_name: string | null
          locale: string
          phone: string | null
          status: string
          theme: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_organization_id?: string | null
          department?: string | null
          display_name?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          last_name?: string | null
          locale?: string
          phone?: string | null
          status?: string
          theme?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_organization_id?: string | null
          department?: string | null
          display_name?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          locale?: string
          phone?: string | null
          status?: string
          theme?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_organization_id_fkey"
            columns: ["current_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      query_history: {
        Row: {
          column_count: number | null
          created_at: string
          data_source_id: string | null
          data_source_name: string | null
          database_name: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          organization_id: string
          row_count: number | null
          schema_name: string | null
          sql: string
          status: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          column_count?: number | null
          created_at?: string
          data_source_id?: string | null
          data_source_name?: string | null
          database_name?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          organization_id: string
          row_count?: number | null
          schema_name?: string | null
          sql: string
          status?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          column_count?: number | null
          created_at?: string
          data_source_id?: string | null
          data_source_name?: string | null
          database_name?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          organization_id?: string
          row_count?: number | null
          schema_name?: string | null
          sql?: string
          status?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "query_history_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "query_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "query_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      report_executions: {
        Row: {
          created_at: string
          dataset_id: string | null
          duration_ms: number | null
          error_message: string | null
          export_format: string | null
          filters: Json
          id: string
          kind: Database["public"]["Enums"]["report_exec_kind"]
          organization_id: string
          report_id: string | null
          row_count: number | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dataset_id?: string | null
          duration_ms?: number | null
          error_message?: string | null
          export_format?: string | null
          filters?: Json
          id?: string
          kind?: Database["public"]["Enums"]["report_exec_kind"]
          organization_id: string
          report_id?: string | null
          row_count?: number | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dataset_id?: string | null
          duration_ms?: number | null
          error_message?: string | null
          export_format?: string | null
          filters?: Json
          id?: string
          kind?: Database["public"]["Enums"]["report_exec_kind"]
          organization_id?: string
          report_id?: string | null
          row_count?: number | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_executions_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_executions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_executions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_favorites: {
        Row: {
          created_at: string
          report_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          report_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          report_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_favorites_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_filters: {
        Row: {
          column_name: string
          created_at: string
          default_value: Json | null
          filter_type: Database["public"]["Enums"]["report_filter_type"]
          id: string
          key: string
          label: string
          operator: string
          options: Json
          organization_id: string
          report_id: string
          required: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          column_name: string
          created_at?: string
          default_value?: Json | null
          filter_type?: Database["public"]["Enums"]["report_filter_type"]
          id?: string
          key: string
          label: string
          operator?: string
          options?: Json
          organization_id: string
          report_id: string
          required?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          column_name?: string
          created_at?: string
          default_value?: Json | null
          filter_type?: Database["public"]["Enums"]["report_filter_type"]
          id?: string
          key?: string
          label?: string
          operator?: string
          options?: Json
          organization_id?: string
          report_id?: string
          required?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_filters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_filters_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_permissions: {
        Row: {
          access: string
          created_at: string
          group_id: string | null
          id: string
          organization_id: string
          report_id: string
          user_id: string | null
        }
        Insert: {
          access?: string
          created_at?: string
          group_id?: string | null
          id?: string
          organization_id: string
          report_id: string
          user_id?: string | null
        }
        Update: {
          access?: string
          created_at?: string
          group_id?: string | null
          id?: string
          organization_id?: string
          report_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_permissions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_tags: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          report_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          report_id: string
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          report_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_tags_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_versions: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          dataset_id: string | null
          description: string | null
          filters: Json
          id: string
          name: string
          note: string | null
          organization_id: string
          report_id: string
          version: number
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          dataset_id?: string | null
          description?: string | null
          filters?: Json
          id?: string
          name: string
          note?: string | null
          organization_id: string
          report_id: string
          version: number
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          dataset_id?: string | null
          description?: string | null
          filters?: Json
          id?: string
          name?: string
          note?: string | null
          organization_id?: string
          report_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_versions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_versions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          archived_at: string | null
          avg_duration_ms: number | null
          cache_ttl_seconds: number
          category: string | null
          config: Json
          created_at: string
          created_by: string | null
          dataset_id: string | null
          description: string | null
          duplicated_from: string | null
          execution_count: number
          export_count: number
          id: string
          last_error: string | null
          last_run_at: string | null
          name: string
          organization_id: string
          owner_id: string | null
          project_id: string | null
          published_at: string | null
          status: Database["public"]["Enums"]["report_status"]
          tags: string[]
          updated_at: string
          version: number
          view_count: number
          visibility: Database["public"]["Enums"]["report_visibility"]
          workspace_id: string | null
        }
        Insert: {
          archived_at?: string | null
          avg_duration_ms?: number | null
          cache_ttl_seconds?: number
          category?: string | null
          config?: Json
          created_at?: string
          created_by?: string | null
          dataset_id?: string | null
          description?: string | null
          duplicated_from?: string | null
          execution_count?: number
          export_count?: number
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          name: string
          organization_id: string
          owner_id?: string | null
          project_id?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          tags?: string[]
          updated_at?: string
          version?: number
          view_count?: number
          visibility?: Database["public"]["Enums"]["report_visibility"]
          workspace_id?: string | null
        }
        Update: {
          archived_at?: string | null
          avg_duration_ms?: number | null
          cache_ttl_seconds?: number
          category?: string | null
          config?: Json
          created_at?: string
          created_by?: string | null
          dataset_id?: string | null
          description?: string | null
          duplicated_from?: string | null
          execution_count?: number
          export_count?: number
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          name?: string
          organization_id?: string
          owner_id?: string | null
          project_id?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          tags?: string[]
          updated_at?: string
          version?: number
          view_count?: number
          visibility?: Database["public"]["Enums"]["report_visibility"]
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_duplicated_from_fkey"
            columns: ["duplicated_from"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          permission_key?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions_catalog"
            referencedColumns: ["key"]
          },
        ]
      }
      saved_queries: {
        Row: {
          created_at: string
          data_source_id: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          owner_id: string
          schema_name: string | null
          sql: string
          status: string
          tags: string[]
          updated_at: string
          visibility: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          data_source_id?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          owner_id: string
          schema_name?: string | null
          sql: string
          status?: string
          tags?: string[]
          updated_at?: string
          visibility?: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          data_source_id?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          owner_id?: string
          schema_name?: string | null
          sql?: string
          status?: string
          tags?: string[]
          updated_at?: string
          visibility?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_queries_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_queries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_queries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_query_favorites: {
        Row: {
          created_at: string
          saved_query_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          saved_query_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          saved_query_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_query_favorites_saved_query_id_fkey"
            columns: ["saved_query_id"]
            isOneToOne: false
            referencedRelation: "saved_queries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          active: boolean
          color: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_organization_id_fkey"
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
      can_edit_dataset: {
        Args: { _dataset_id: string; _user_id: string }
        Returns: boolean
      }
      can_edit_report: {
        Args: { _report_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_datasources: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_report: {
        Args: { _report_id: string; _user_id: string }
        Returns: boolean
      }
      current_org_id: { Args: never; Returns: string }
      has_permission: {
        Args: { _key: string; _org_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "administrator" | "dba" | "developer" | "analyst" | "user"
      column_visual_type:
        | "text"
        | "number"
        | "integer"
        | "decimal"
        | "currency"
        | "percentage"
        | "date"
        | "datetime"
        | "boolean"
        | "json"
      dataset_source_kind: "sql" | "table" | "view" | "saved_query"
      dataset_status: "draft" | "published" | "archived"
      ds_access_level: "none" | "read" | "manage" | "full"
      ds_environment: "production" | "staging" | "development"
      ds_health:
        | "unknown"
        | "online"
        | "offline"
        | "unstable"
        | "timeout"
        | "invalid_credentials"
      ds_object_type:
        | "table"
        | "view"
        | "materialized_view"
        | "function"
        | "procedure"
      ds_sync_frequency:
        | "manual"
        | "every_5_min"
        | "every_15_min"
        | "hourly"
        | "daily"
      ds_sync_mode: "manual" | "automatic" | "scheduled"
      ds_sync_status: "running" | "success" | "failed"
      ds_type:
        | "postgresql"
        | "mysql"
        | "mariadb"
        | "sqlite"
        | "sqlserver"
        | "oracle"
        | "duckdb"
        | "snowflake"
        | "bigquery"
        | "redshift"
        | "clickhouse"
      report_exec_kind: "view" | "run" | "export"
      report_filter_type:
        | "text"
        | "number"
        | "date"
        | "datetime"
        | "boolean"
        | "select"
        | "multiselect"
      report_status: "draft" | "review" | "published" | "archived"
      report_visibility:
        | "private"
        | "workspace"
        | "organization"
        | "groups"
        | "users"
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
      app_role: ["administrator", "dba", "developer", "analyst", "user"],
      column_visual_type: [
        "text",
        "number",
        "integer",
        "decimal",
        "currency",
        "percentage",
        "date",
        "datetime",
        "boolean",
        "json",
      ],
      dataset_source_kind: ["sql", "table", "view", "saved_query"],
      dataset_status: ["draft", "published", "archived"],
      ds_access_level: ["none", "read", "manage", "full"],
      ds_environment: ["production", "staging", "development"],
      ds_health: [
        "unknown",
        "online",
        "offline",
        "unstable",
        "timeout",
        "invalid_credentials",
      ],
      ds_object_type: [
        "table",
        "view",
        "materialized_view",
        "function",
        "procedure",
      ],
      ds_sync_frequency: [
        "manual",
        "every_5_min",
        "every_15_min",
        "hourly",
        "daily",
      ],
      ds_sync_mode: ["manual", "automatic", "scheduled"],
      ds_sync_status: ["running", "success", "failed"],
      ds_type: [
        "postgresql",
        "mysql",
        "mariadb",
        "sqlite",
        "sqlserver",
        "oracle",
        "duckdb",
        "snowflake",
        "bigquery",
        "redshift",
        "clickhouse",
      ],
      report_exec_kind: ["view", "run", "export"],
      report_filter_type: [
        "text",
        "number",
        "date",
        "datetime",
        "boolean",
        "select",
        "multiselect",
      ],
      report_status: ["draft", "review", "published", "archived"],
      report_visibility: [
        "private",
        "workspace",
        "organization",
        "groups",
        "users",
      ],
    },
  },
} as const
