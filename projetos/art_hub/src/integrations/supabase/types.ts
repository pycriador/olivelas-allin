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
      ai_processing_history: {
        Row: {
          artwork_id: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          finished_at: string | null
          id: string
          model: string | null
          prompt_content: string | null
          prompt_slug: string | null
          result_json: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["ai_job_status"]
          tokens_completion: number | null
          tokens_prompt: number | null
          user_id: string | null
        }
        Insert: {
          artwork_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          model?: string | null
          prompt_content?: string | null
          prompt_slug?: string | null
          result_json?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ai_job_status"]
          tokens_completion?: number | null
          tokens_prompt?: number | null
          user_id?: string | null
        }
        Update: {
          artwork_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          model?: string | null
          prompt_content?: string | null
          prompt_slug?: string | null
          result_json?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ai_job_status"]
          tokens_completion?: number | null
          tokens_prompt?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_processing_history_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompt_versions: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          prompt_id: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          prompt_id: string
          version: number
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          prompt_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompt_versions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "ai_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompts: {
        Row: {
          content: string
          created_at: string
          current_version: number
          default_content: string
          id: string
          name: string
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string
          current_version?: number
          default_content: string
          id?: string
          name: string
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          current_version?: number
          default_content?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_queue: {
        Row: {
          artwork_id: string
          attempts: number
          created_at: string
          history_id: string | null
          id: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          priority: number
          scheduled_at: string
          status: Database["public"]["Enums"]["ai_job_status"]
          updated_at: string
        }
        Insert: {
          artwork_id: string
          attempts?: number
          created_at?: string
          history_id?: string | null
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          priority?: number
          scheduled_at?: string
          status?: Database["public"]["Enums"]["ai_job_status"]
          updated_at?: string
        }
        Update: {
          artwork_id?: string
          attempts?: number
          created_at?: string
          history_id?: string | null
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          priority?: number
          scheduled_at?: string
          status?: Database["public"]["Enums"]["ai_job_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_queue_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: false
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_queue_history_id_fkey"
            columns: ["history_id"]
            isOneToOne: false
            referencedRelation: "ai_processing_history"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_settings: {
        Row: {
          active_prompt_slug: string
          auto_process_on_upload: boolean
          chat_model: string
          created_at: string
          embedding_model: string
          enabled: boolean
          id: string
          language: string
          max_retries: number
          max_words: number
          singleton: boolean
          temperature: number
          timeout_ms: number
          updated_at: string
        }
        Insert: {
          active_prompt_slug?: string
          auto_process_on_upload?: boolean
          chat_model?: string
          created_at?: string
          embedding_model?: string
          enabled?: boolean
          id?: string
          language?: string
          max_retries?: number
          max_words?: number
          singleton?: boolean
          temperature?: number
          timeout_ms?: number
          updated_at?: string
        }
        Update: {
          active_prompt_slug?: string
          auto_process_on_upload?: boolean
          chat_model?: string
          created_at?: string
          embedding_model?: string
          enabled?: boolean
          id?: string
          language?: string
          max_retries?: number
          max_words?: number
          singleton?: boolean
          temperature?: number
          timeout_ms?: number
          updated_at?: string
        }
        Relationships: []
      }
      artwork_ai_metadata: {
        Row: {
          artwork_id: string
          commemorative_date: string | null
          compatible_products: string[]
          created_at: string
          decorative_elements: string[]
          description: string | null
          emotion: string | null
          has_animals: boolean | null
          has_people: boolean | null
          id: string
          illustration_type: string | null
          keywords: string[]
          last_generated_at: string | null
          manually_edited: Json
          model: string | null
          objects: string[]
          occasion: string | null
          predominant_colors: string[]
          raw_json: Json | null
          short_summary: string | null
          style: string | null
          suggested_category: string | null
          suggested_collection: string | null
          tags: string[]
          target_audience: string | null
          theme: string | null
          title_suggested: string | null
          typography_type: string | null
          updated_at: string
        }
        Insert: {
          artwork_id: string
          commemorative_date?: string | null
          compatible_products?: string[]
          created_at?: string
          decorative_elements?: string[]
          description?: string | null
          emotion?: string | null
          has_animals?: boolean | null
          has_people?: boolean | null
          id?: string
          illustration_type?: string | null
          keywords?: string[]
          last_generated_at?: string | null
          manually_edited?: Json
          model?: string | null
          objects?: string[]
          occasion?: string | null
          predominant_colors?: string[]
          raw_json?: Json | null
          short_summary?: string | null
          style?: string | null
          suggested_category?: string | null
          suggested_collection?: string | null
          tags?: string[]
          target_audience?: string | null
          theme?: string | null
          title_suggested?: string | null
          typography_type?: string | null
          updated_at?: string
        }
        Update: {
          artwork_id?: string
          commemorative_date?: string | null
          compatible_products?: string[]
          created_at?: string
          decorative_elements?: string[]
          description?: string | null
          emotion?: string | null
          has_animals?: boolean | null
          has_people?: boolean | null
          id?: string
          illustration_type?: string | null
          keywords?: string[]
          last_generated_at?: string | null
          manually_edited?: Json
          model?: string | null
          objects?: string[]
          occasion?: string | null
          predominant_colors?: string[]
          raw_json?: Json | null
          short_summary?: string | null
          style?: string | null
          suggested_category?: string | null
          suggested_collection?: string | null
          tags?: string[]
          target_audience?: string | null
          theme?: string | null
          title_suggested?: string | null
          typography_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artwork_ai_metadata_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: true
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
        ]
      }
      artwork_embeddings: {
        Row: {
          artwork_id: string
          content: string
          created_at: string
          embedding: string | null
          id: string
          model: string
          updated_at: string
        }
        Insert: {
          artwork_id: string
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          model: string
          updated_at?: string
        }
        Update: {
          artwork_id?: string
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          model?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artwork_embeddings_artwork_id_fkey"
            columns: ["artwork_id"]
            isOneToOne: true
            referencedRelation: "artworks"
            referencedColumns: ["id"]
          },
        ]
      }
      artworks: {
        Row: {
          code: string | null
          collection_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          collection_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          collection_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artworks_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          banner_image: string | null
          cover_image: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          banner_image?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          banner_image?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          company_name: string | null
          created_at: string
          home_collection_id: string | null
          home_subtitle: string | null
          home_tagline: string | null
          home_title: string | null
          id: string
          logo_url: string | null
          singleton: boolean
          theme: string
          updated_at: string
          whatsapp_message: string | null
          whatsapp_number: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          home_collection_id?: string | null
          home_subtitle?: string | null
          home_tagline?: string | null
          home_title?: string | null
          id?: string
          logo_url?: string | null
          singleton?: boolean
          theme?: string
          updated_at?: string
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          home_collection_id?: string | null
          home_subtitle?: string | null
          home_tagline?: string | null
          home_title?: string | null
          id?: string
          logo_url?: string | null
          singleton?: boolean
          theme?: string
          updated_at?: string
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_home_collection_id_fkey"
            columns: ["home_collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      search_artworks_semantic: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          artwork_id: string
          similarity: number
        }[]
      }
    }
    Enums: {
      ai_job_status:
        | "queued"
        | "sending"
        | "processing"
        | "completed"
        | "error"
        | "cancelled"
      app_role: "admin" | "user"
      content_status: "active" | "inactive" | "draft"
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
    Enums: {
      ai_job_status: [
        "queued",
        "sending",
        "processing",
        "completed",
        "error",
        "cancelled",
      ],
      app_role: ["admin", "user"],
      content_status: ["active", "inactive", "draft"],
    },
  },
} as const
