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
      app_user_connections: {
        Row: {
          connection_key_ciphertext: string
          connector_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_key_ciphertext: string
          connector_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_key_ciphertext?: string
          connector_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      appointment_audit_logs: {
        Row: {
          action: string
          appointment_id: string | null
          created_at: string
          id: string
          new_data: Json | null
          previous_data: Json | null
          source: Database["public"]["Enums"]["appointment_source"]
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          appointment_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          previous_data?: Json | null
          source?: Database["public"]["Enums"]["appointment_source"]
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          appointment_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          previous_data?: Json | null
          source?: Database["public"]["Enums"]["appointment_source"]
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_audit_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_status_history: {
        Row: {
          appointment_id: string
          changed_at: string
          changed_by: string | null
          id: string
          new_status: Database["public"]["Enums"]["appointment_status"]
          notes: string | null
          previous_status:
            | Database["public"]["Enums"]["appointment_status"]
            | null
          reason: string | null
          tenant_id: string
        }
        Insert: {
          appointment_id: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["appointment_status"]
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["appointment_status"]
            | null
          reason?: string | null
          tenant_id: string
        }
        Update: {
          appointment_id?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["appointment_status"]
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["appointment_status"]
            | null
          reason?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_status_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_status_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_types: {
        Row: {
          active: boolean
          color: string
          created_at: string
          duration_minutes: number
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          booking_type: Database["public"]["Enums"]["appointment_booking_type"]
          calendar_id: string | null
          cancellation_notes: string | null
          cancellation_reason:
            | Database["public"]["Enums"]["appointment_cancellation_reason"]
            | null
          cancelled_at: string | null
          cancelled_by: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number
          end_at: string
          event_id: string | null
          google_event_id: string | null
          id: string
          location_id: string | null
          meet_id: string | null
          meet_url: string | null
          modality: Database["public"]["Enums"]["appointment_modality"]
          no_show_at: string | null
          no_show_notes: string | null
          no_show_party: Database["public"]["Enums"]["no_show_party"] | null
          notes: string | null
          previous_end_at: string | null
          previous_start_at: string | null
          professional_id: string
          rescheduled_from: string | null
          reserved_by: string | null
          reserved_until: string | null
          service_type_id: string | null
          source: Database["public"]["Enums"]["appointment_source"]
          start_at: string
          started_at: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          sync_error: string | null
          sync_status: Database["public"]["Enums"]["appointment_sync_status"]
          tenant_id: string
          timezone: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          booking_type?: Database["public"]["Enums"]["appointment_booking_type"]
          calendar_id?: string | null
          cancellation_notes?: string | null
          cancellation_reason?:
            | Database["public"]["Enums"]["appointment_cancellation_reason"]
            | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes: number
          end_at: string
          event_id?: string | null
          google_event_id?: string | null
          id?: string
          location_id?: string | null
          meet_id?: string | null
          meet_url?: string | null
          modality?: Database["public"]["Enums"]["appointment_modality"]
          no_show_at?: string | null
          no_show_notes?: string | null
          no_show_party?: Database["public"]["Enums"]["no_show_party"] | null
          notes?: string | null
          previous_end_at?: string | null
          previous_start_at?: string | null
          professional_id: string
          rescheduled_from?: string | null
          reserved_by?: string | null
          reserved_until?: string | null
          service_type_id?: string | null
          source?: Database["public"]["Enums"]["appointment_source"]
          start_at: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          sync_error?: string | null
          sync_status?: Database["public"]["Enums"]["appointment_sync_status"]
          tenant_id: string
          timezone?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          booking_type?: Database["public"]["Enums"]["appointment_booking_type"]
          calendar_id?: string | null
          cancellation_notes?: string | null
          cancellation_reason?:
            | Database["public"]["Enums"]["appointment_cancellation_reason"]
            | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          end_at?: string
          event_id?: string | null
          google_event_id?: string | null
          id?: string
          location_id?: string | null
          meet_id?: string | null
          meet_url?: string | null
          modality?: Database["public"]["Enums"]["appointment_modality"]
          no_show_at?: string | null
          no_show_notes?: string | null
          no_show_party?: Database["public"]["Enums"]["no_show_party"] | null
          notes?: string | null
          previous_end_at?: string | null
          previous_start_at?: string | null
          professional_id?: string
          rescheduled_from?: string | null
          reserved_by?: string | null
          reserved_until?: string | null
          service_type_id?: string | null
          source?: Database["public"]["Enums"]["appointment_source"]
          start_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          sync_error?: string | null
          sync_status?: Database["public"]["Enums"]["appointment_sync_status"]
          tenant_id?: string
          timezone?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "google_calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_audit_logs: {
        Row: {
          created_at: string
          criteria: Json
          duration_ms: number
          id: string
          result_count: number
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          criteria?: Json
          duration_ms?: number
          id?: string
          result_count?: number
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          criteria?: Json
          duration_ms?: number
          id?: string
          result_count?: number
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_cache: {
        Row: {
          available: boolean
          created_at: string
          date: string
          duration_minutes: number
          id: string
          professional_id: string
          reason: string | null
          slot_time: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          available?: boolean
          created_at?: string
          date: string
          duration_minutes?: number
          id?: string
          professional_id: string
          reason?: string | null
          slot_time: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          available?: boolean
          created_at?: string
          date?: string
          duration_minutes?: number
          id?: string
          professional_id?: string
          reason?: string | null
          slot_time?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_cache_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_cache_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_rules: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          params: Json
          priority: number
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          params?: Json
          priority?: number
          tenant_id: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          params?: Json
          priority?: number
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_settings: {
        Row: {
          cache_ttl_seconds: number
          created_at: string
          lunch_end: string
          lunch_start: string
          max_daily_appointments: number
          max_daily_minutes: number
          max_weekly_minutes: number
          min_minutes_between_appointments: number
          overbooking_margin_minutes: number
          slot_granularity_minutes: number
          tenant_id: string
          updated_at: string
          weight_almost_full: number
          weight_available: number
          weight_conflict: number
          weight_lower_workload: number
          weight_near_lunch: number
          weight_overbooking: number
          weight_preferred_period: number
          weight_same_professional: number
          weight_specialty: number
        }
        Insert: {
          cache_ttl_seconds?: number
          created_at?: string
          lunch_end?: string
          lunch_start?: string
          max_daily_appointments?: number
          max_daily_minutes?: number
          max_weekly_minutes?: number
          min_minutes_between_appointments?: number
          overbooking_margin_minutes?: number
          slot_granularity_minutes?: number
          tenant_id: string
          updated_at?: string
          weight_almost_full?: number
          weight_available?: number
          weight_conflict?: number
          weight_lower_workload?: number
          weight_near_lunch?: number
          weight_overbooking?: number
          weight_preferred_period?: number
          weight_same_professional?: number
          weight_specialty?: number
        }
        Update: {
          cache_ttl_seconds?: number
          created_at?: string
          lunch_end?: string
          lunch_start?: string
          max_daily_appointments?: number
          max_daily_minutes?: number
          max_weekly_minutes?: number
          min_minutes_between_appointments?: number
          overbooking_margin_minutes?: number
          slot_granularity_minutes?: number
          tenant_id?: string
          updated_at?: string
          weight_almost_full?: number
          weight_available?: number
          weight_conflict?: number
          weight_lower_workload?: number
          weight_near_lunch?: number
          weight_overbooking?: number
          weight_preferred_period?: number
          weight_same_professional?: number
          weight_specialty?: number
        }
        Relationships: [
          {
            foreignKeyName: "availability_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          all_day: boolean
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          id: string
          professional_id: string | null
          reason: Database["public"]["Enums"]["block_reason"]
          starts_at: string
          tenant_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          id?: string
          professional_id?: string | null
          reason?: Database["public"]["Enums"]["block_reason"]
          starts_at: string
          tenant_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          professional_id?: string | null
          reason?: Database["public"]["Enums"]["block_reason"]
          starts_at?: string
          tenant_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_sync_logs: {
        Row: {
          account_id: string | null
          calendar_id: string | null
          conflicts: number
          created_at: string
          direction: string
          duration_ms: number | null
          error_message: string | null
          events_created: number
          events_deleted: number
          events_total: number
          events_updated: number
          finished_at: string | null
          id: string
          response: Json | null
          started_at: string
          success: boolean
          sync_type: string
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          calendar_id?: string | null
          conflicts?: number
          created_at?: string
          direction?: string
          duration_ms?: number | null
          error_message?: string | null
          events_created?: number
          events_deleted?: number
          events_total?: number
          events_updated?: number
          finished_at?: string | null
          id?: string
          response?: Json | null
          started_at?: string
          success?: boolean
          sync_type?: string
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          calendar_id?: string | null
          conflicts?: number
          created_at?: string
          direction?: string
          duration_ms?: number | null
          error_message?: string | null
          events_created?: number
          events_deleted?: number
          events_total?: number
          events_updated?: number
          finished_at?: string | null
          id?: string
          response?: Json | null
          started_at?: string
          success?: boolean
          sync_type?: string
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "google_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_logs_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "google_calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          guardian_name: string | null
          id: string
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["client_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          guardian_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          guardian_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          appointment_type_id: string | null
          client_id: string | null
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          google_event_id: string | null
          id: string
          professional_id: string | null
          source: Database["public"]["Enums"]["event_source"]
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          appointment_type_id?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          google_event_id?: string | null
          id?: string
          professional_id?: string | null
          source?: Database["public"]["Enums"]["event_source"]
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          appointment_type_id?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          google_event_id?: string | null
          id?: string
          professional_id?: string | null
          source?: Database["public"]["Enums"]["event_source"]
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      google_accounts: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          google_user_id: string | null
          id: string
          last_error: string | null
          last_sync: string | null
          picture: string | null
          professional_id: string | null
          scopes: string[]
          status: Database["public"]["Enums"]["google_account_status"]
          sync_token: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          google_user_id?: string | null
          id?: string
          last_error?: string | null
          last_sync?: string | null
          picture?: string | null
          professional_id?: string | null
          scopes?: string[]
          status?: Database["public"]["Enums"]["google_account_status"]
          sync_token?: string | null
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          google_user_id?: string | null
          id?: string
          last_error?: string | null
          last_sync?: string | null
          picture?: string | null
          professional_id?: string | null
          scopes?: string[]
          status?: Database["public"]["Enums"]["google_account_status"]
          sync_token?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_accounts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendars: {
        Row: {
          access_role: string | null
          account_id: string
          calendar_id: string
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_primary: boolean
          last_sync: string | null
          name: string
          read_only: boolean
          selected: boolean
          show_in_agenda: boolean
          sync_enabled: boolean
          sync_token: string | null
          tenant_id: string
          timezone: string | null
          updated_at: string
          watch_channel_id: string | null
          watch_expiration: string | null
          watch_resource_id: string | null
        }
        Insert: {
          access_role?: string | null
          account_id: string
          calendar_id: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_primary?: boolean
          last_sync?: string | null
          name: string
          read_only?: boolean
          selected?: boolean
          show_in_agenda?: boolean
          sync_enabled?: boolean
          sync_token?: string | null
          tenant_id: string
          timezone?: string | null
          updated_at?: string
          watch_channel_id?: string | null
          watch_expiration?: string | null
          watch_resource_id?: string | null
        }
        Update: {
          access_role?: string | null
          account_id?: string
          calendar_id?: string
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_primary?: boolean
          last_sync?: string | null
          name?: string
          read_only?: boolean
          selected?: boolean
          show_in_agenda?: boolean
          sync_enabled?: boolean
          sync_token?: string | null
          tenant_id?: string
          timezone?: string | null
          updated_at?: string
          watch_channel_id?: string | null
          watch_expiration?: string | null
          watch_resource_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_calendars_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "google_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_calendars_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          room: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          room?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          room?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          appointment_id: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          client_id: string | null
          created_at: string
          error: string | null
          id: string
          metadata: Json
          professional_id: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          client_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          metadata?: Json
          professional_id?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          tenant_id: string
          type: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          client_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          metadata?: Json
          professional_id?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_appointment_types: {
        Row: {
          appointment_type_id: string
          professional_id: string
        }
        Insert: {
          appointment_type_id: string
          professional_id: string
        }
        Update: {
          appointment_type_id?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_appointment_types_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_appointment_types_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_workload: {
        Row: {
          appointments: number
          created_at: string
          date: string
          free_minutes: number
          id: string
          occupancy_percent: number
          overbookings: number
          professional_id: string
          tenant_id: string
          updated_at: string
          worked_minutes: number
        }
        Insert: {
          appointments?: number
          created_at?: string
          date: string
          free_minutes?: number
          id?: string
          occupancy_percent?: number
          overbookings?: number
          professional_id: string
          tenant_id: string
          updated_at?: string
          worked_minutes?: number
        }
        Update: {
          appointments?: number
          created_at?: string
          date?: string
          free_minutes?: number
          id?: string
          occupancy_percent?: number
          overbookings?: number
          professional_id?: string
          tenant_id?: string
          updated_at?: string
          worked_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_workload_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_workload_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          accepts_in_person: boolean
          accepts_online: boolean
          active: boolean
          agenda_color: string
          bio: string | null
          created_at: string
          crp: string | null
          default_interval_minutes: number
          default_session_minutes: number
          full_name: string
          id: string
          specialty: string | null
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accepts_in_person?: boolean
          accepts_online?: boolean
          active?: boolean
          agenda_color?: string
          bio?: string | null
          created_at?: string
          crp?: string | null
          default_interval_minutes?: number
          default_session_minutes?: number
          full_name: string
          id?: string
          specialty?: string | null
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accepts_in_person?: boolean
          accepts_online?: boolean
          active?: boolean
          agenda_color?: string
          bio?: string | null
          created_at?: string
          crp?: string | null
          default_interval_minutes?: number
          default_session_minutes?: number
          full_name?: string
          id?: string
          specialty?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_login_at: string | null
          locale: string
          phone: string | null
          status: Database["public"]["Enums"]["user_status"]
          tenant_id: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_login_at?: string | null
          locale?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          tenant_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          locale?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          tenant_id?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_groups: {
        Row: {
          active: boolean
          color: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["schedule_group_kind"]
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["schedule_group_kind"]
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["schedule_group_kind"]
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          active: boolean
          created_at: string
          end_time: string
          id: string
          interval_minutes: number
          professional_id: string
          schedule_group_id: string | null
          start_time: string
          tenant_id: string
          updated_at: string
          weekday: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_time: string
          id?: string
          interval_minutes?: number
          professional_id: string
          schedule_group_id?: string | null
          start_time: string
          tenant_id: string
          updated_at?: string
          weekday: number
        }
        Update: {
          active?: boolean
          created_at?: string
          end_time?: string
          id?: string
          interval_minutes?: number
          professional_id?: string
          schedule_group_id?: string | null
          start_time?: string
          tenant_id?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "schedules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_schedule_group_id_fkey"
            columns: ["schedule_group_id"]
            isOneToOne: false
            referencedRelation: "schedule_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          created_at: string
          date_format: string
          locale: string
          logo_url: string | null
          tenant_id: string
          theme: string
          time_format: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_format?: string
          locale?: string
          logo_url?: string | null
          tenant_id: string
          theme?: string
          time_format?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_format?: string
          locale?: string
          logo_url?: string | null
          tenant_id?: string
          theme?: string
          time_format?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          locale: string
          logo_url: string | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          locale?: string
          logo_url?: string | null
          name: string
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          locale?: string
          logo_url?: string | null
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      waiting_list: {
        Row: {
          appointment_id: string | null
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          modality: Database["public"]["Enums"]["appointment_modality"]
          notes: string | null
          preferred_date: string | null
          preferred_professional_id: string | null
          preferred_time_end: string | null
          preferred_time_start: string | null
          priority: number
          service_type_id: string | null
          status: Database["public"]["Enums"]["waiting_list_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          modality?: Database["public"]["Enums"]["appointment_modality"]
          notes?: string | null
          preferred_date?: string | null
          preferred_professional_id?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          priority?: number
          service_type_id?: string | null
          status?: Database["public"]["Enums"]["waiting_list_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          modality?: Database["public"]["Enums"]["appointment_modality"]
          notes?: string | null
          preferred_date?: string | null
          preferred_professional_id?: string | null
          preferred_time_end?: string | null
          preferred_time_start?: string | null
          priority?: number
          service_type_id?: string | null
          status?: Database["public"]["Enums"]["waiting_list_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiting_list_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_list_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_list_preferred_professional_id_fkey"
            columns: ["preferred_professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_list_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_list_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role:
        | "global_admin"
        | "clinic_admin"
        | "receptionist"
        | "psychologist"
        | "supervisor"
        | "read_only"
      appointment_booking_type: "regular" | "fit_in"
      appointment_cancellation_reason:
        | "client_request"
        | "professional_request"
        | "conflict"
        | "illness"
        | "holiday"
        | "emergency"
        | "other"
      appointment_modality: "in_person" | "online" | "hybrid"
      appointment_source:
        | "manual"
        | "client_portal"
        | "google"
        | "api"
        | "waiting_list"
      appointment_status:
        | "draft"
        | "requested"
        | "reserved"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
        | "rescheduled"
      appointment_sync_status: "not_synced" | "pending" | "synced" | "error"
      block_reason:
        | "vacation"
        | "sick_leave"
        | "meeting"
        | "training"
        | "conference"
        | "day_off"
        | "holiday"
        | "manual"
      client_status: "active" | "inactive" | "archived"
      event_source: "manual" | "google" | "client_portal" | "api"
      event_status:
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      google_account_status: "connected" | "disconnected" | "expired" | "error"
      no_show_party: "client" | "professional" | "both"
      notification_channel: "email" | "whatsapp" | "sms" | "push"
      notification_status:
        | "pending"
        | "scheduled"
        | "sent"
        | "failed"
        | "cancelled"
      schedule_group_kind:
        | "full"
        | "morning"
        | "afternoon"
        | "evening"
        | "on_call"
        | "custom"
      tenant_status: "active" | "suspended" | "trial"
      user_status: "active" | "inactive" | "invited"
      waiting_list_status: "waiting" | "contacted" | "scheduled" | "cancelled"
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
      app_role: [
        "global_admin",
        "clinic_admin",
        "receptionist",
        "psychologist",
        "supervisor",
        "read_only",
      ],
      appointment_booking_type: ["regular", "fit_in"],
      appointment_cancellation_reason: [
        "client_request",
        "professional_request",
        "conflict",
        "illness",
        "holiday",
        "emergency",
        "other",
      ],
      appointment_modality: ["in_person", "online", "hybrid"],
      appointment_source: [
        "manual",
        "client_portal",
        "google",
        "api",
        "waiting_list",
      ],
      appointment_status: [
        "draft",
        "requested",
        "reserved",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
        "rescheduled",
      ],
      appointment_sync_status: ["not_synced", "pending", "synced", "error"],
      block_reason: [
        "vacation",
        "sick_leave",
        "meeting",
        "training",
        "conference",
        "day_off",
        "holiday",
        "manual",
      ],
      client_status: ["active", "inactive", "archived"],
      event_source: ["manual", "google", "client_portal", "api"],
      event_status: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      google_account_status: ["connected", "disconnected", "expired", "error"],
      no_show_party: ["client", "professional", "both"],
      notification_channel: ["email", "whatsapp", "sms", "push"],
      notification_status: [
        "pending",
        "scheduled",
        "sent",
        "failed",
        "cancelled",
      ],
      schedule_group_kind: [
        "full",
        "morning",
        "afternoon",
        "evening",
        "on_call",
        "custom",
      ],
      tenant_status: ["active", "suspended", "trial"],
      user_status: ["active", "inactive", "invited"],
      waiting_list_status: ["waiting", "contacted", "scheduled", "cancelled"],
    },
  },
} as const
