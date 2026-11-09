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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          ip: string | null
          metadata: Json
          new_value: Json | null
          old_value: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip?: string | null
          metadata?: Json
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip?: string | null
          metadata?: Json
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
        }
        Relationships: []
      }
      campaign_images: {
        Row: {
          alt_text: string | null
          campaign_id: string
          caption: string | null
          created_at: string
          display_order: number
          filename: string
          height: number | null
          id: string
          image_type: Database["public"]["Enums"]["campaign_image_type"]
          is_active: boolean
          is_cover: boolean
          mime_type: string | null
          size: number | null
          storage_path: string
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          campaign_id: string
          caption?: string | null
          created_at?: string
          display_order?: number
          filename: string
          height?: number | null
          id?: string
          image_type?: Database["public"]["Enums"]["campaign_image_type"]
          is_active?: boolean
          is_cover?: boolean
          mime_type?: string | null
          size?: number | null
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          campaign_id?: string
          caption?: string | null
          created_at?: string
          display_order?: number
          filename?: string
          height?: number | null
          id?: string
          image_type?: Database["public"]["Enums"]["campaign_image_type"]
          is_active?: boolean
          is_cover?: boolean
          mime_type?: string | null
          size?: number | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
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
            foreignKeyName: "campaign_images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_numbers: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          number: number
          purchase_id: string | null
          reservation_token: string | null
          reserved_by: string | null
          reserved_until: string | null
          status: Database["public"]["Enums"]["campaign_number_status"]
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          number: number
          purchase_id?: string | null
          reservation_token?: string | null
          reserved_by?: string | null
          reserved_until?: string | null
          status?: Database["public"]["Enums"]["campaign_number_status"]
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          number?: number
          purchase_id?: string | null
          reservation_token?: string | null
          reserved_by?: string | null
          reserved_until?: string | null
          status?: Database["public"]["Enums"]["campaign_number_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_numbers_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_settings: {
        Row: {
          allow_manual_selection: boolean
          allow_random_selection: boolean
          auto_reservation: boolean
          background_image: string | null
          banner_image: string | null
          button_color: string | null
          campaign_id: string
          campaign_logo: string | null
          canonical_url: string | null
          contact_email: string | null
          contact_hours: string | null
          contact_whatsapp: string | null
          created_at: string
          enable_comments: boolean
          enable_faq: boolean
          enable_pix: boolean
          enable_public_page: boolean
          enable_seo: boolean
          enable_share: boolean
          enable_whatsapp: boolean
          font_family: string | null
          id: string
          json_ld: string | null
          max_numbers_per_purchase: number | null
          og_description: string | null
          og_image: string | null
          og_title: string | null
          payment_gateway: Database["public"]["Enums"]["payment_gateway"] | null
          primary_color: string | null
          publish_status: Database["public"]["Enums"]["campaign_publish_status"]
          reservation_timeout_minutes: number
          secondary_color: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          share_image: string | null
          show_contact_information: boolean
          show_gallery: boolean
          show_percentage_sold: boolean
          show_product_description: boolean
          show_product_value: boolean
          show_progress: boolean
          show_progress_bar: boolean
          show_purchase_counter: boolean
          show_recent_buyers: boolean
          show_remaining_numbers: boolean
          show_rules: boolean
          show_statistics: boolean
          show_total_numbers: boolean
          theme: string
          twitter_description: string | null
          twitter_image: string | null
          twitter_title: string | null
          updated_at: string
        }
        Insert: {
          allow_manual_selection?: boolean
          allow_random_selection?: boolean
          auto_reservation?: boolean
          background_image?: string | null
          banner_image?: string | null
          button_color?: string | null
          campaign_id: string
          campaign_logo?: string | null
          canonical_url?: string | null
          contact_email?: string | null
          contact_hours?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          enable_comments?: boolean
          enable_faq?: boolean
          enable_pix?: boolean
          enable_public_page?: boolean
          enable_seo?: boolean
          enable_share?: boolean
          enable_whatsapp?: boolean
          font_family?: string | null
          id?: string
          json_ld?: string | null
          max_numbers_per_purchase?: number | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          payment_gateway?:
            | Database["public"]["Enums"]["payment_gateway"]
            | null
          primary_color?: string | null
          publish_status?: Database["public"]["Enums"]["campaign_publish_status"]
          reservation_timeout_minutes?: number
          secondary_color?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          share_image?: string | null
          show_contact_information?: boolean
          show_gallery?: boolean
          show_percentage_sold?: boolean
          show_product_description?: boolean
          show_product_value?: boolean
          show_progress?: boolean
          show_progress_bar?: boolean
          show_purchase_counter?: boolean
          show_recent_buyers?: boolean
          show_remaining_numbers?: boolean
          show_rules?: boolean
          show_statistics?: boolean
          show_total_numbers?: boolean
          theme?: string
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Update: {
          allow_manual_selection?: boolean
          allow_random_selection?: boolean
          auto_reservation?: boolean
          background_image?: string | null
          banner_image?: string | null
          button_color?: string | null
          campaign_id?: string
          campaign_logo?: string | null
          canonical_url?: string | null
          contact_email?: string | null
          contact_hours?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          enable_comments?: boolean
          enable_faq?: boolean
          enable_pix?: boolean
          enable_public_page?: boolean
          enable_seo?: boolean
          enable_share?: boolean
          enable_whatsapp?: boolean
          font_family?: string | null
          id?: string
          json_ld?: string | null
          max_numbers_per_purchase?: number | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          payment_gateway?:
            | Database["public"]["Enums"]["payment_gateway"]
            | null
          primary_color?: string | null
          publish_status?: Database["public"]["Enums"]["campaign_publish_status"]
          reservation_timeout_minutes?: number
          secondary_color?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          share_image?: string | null
          show_contact_information?: boolean
          show_gallery?: boolean
          show_percentage_sold?: boolean
          show_product_description?: boolean
          show_product_value?: boolean
          show_progress?: boolean
          show_progress_bar?: boolean
          show_purchase_counter?: boolean
          show_recent_buyers?: boolean
          show_remaining_numbers?: boolean
          show_rules?: boolean
          show_statistics?: boolean
          show_total_numbers?: boolean
          theme?: string
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_settings_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_whatsapp_messages: {
        Row: {
          campaign_id: string
          content: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          content: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          content?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_whatsapp_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          allow_random_selection: boolean
          contact_name: string | null
          contact_phone: string | null
          cover_image: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          draw_date: string | null
          end_date: string | null
          id: string
          is_featured: boolean
          max_numbers_per_purchase: number | null
          number_end: number
          number_start: number
          price_per_number: number
          product_description: string | null
          product_name: string
          purchase_mode: Database["public"]["Enums"]["campaign_purchase_mode"]
          reservation_timeout_minutes: number
          short_description: string | null
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          title: string
          total_numbers: number | null
          updated_at: string
          visibility: Database["public"]["Enums"]["campaign_visibility"]
          whatsapp_message_template: string | null
        }
        Insert: {
          allow_random_selection?: boolean
          contact_name?: string | null
          contact_phone?: string | null
          cover_image?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          draw_date?: string | null
          end_date?: string | null
          id?: string
          is_featured?: boolean
          max_numbers_per_purchase?: number | null
          number_end: number
          number_start: number
          price_per_number: number
          product_description?: string | null
          product_name: string
          purchase_mode?: Database["public"]["Enums"]["campaign_purchase_mode"]
          reservation_timeout_minutes?: number
          short_description?: string | null
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          title: string
          total_numbers?: number | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["campaign_visibility"]
          whatsapp_message_template?: string | null
        }
        Update: {
          allow_random_selection?: boolean
          contact_name?: string | null
          contact_phone?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          draw_date?: string | null
          end_date?: string | null
          id?: string
          is_featured?: boolean
          max_numbers_per_purchase?: number | null
          number_end?: number
          number_start?: number
          price_per_number?: number
          product_description?: string | null
          product_name?: string
          purchase_mode?: Database["public"]["Enums"]["campaign_purchase_mode"]
          reservation_timeout_minutes?: number
          short_description?: string | null
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          title?: string
          total_numbers?: number | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["campaign_visibility"]
          whatsapp_message_template?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          city: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          number: number
          order_id: string
          status: Database["public"]["Enums"]["campaign_number_status"]
          unit_price: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          number: number
          order_id: string
          status?: Database["public"]["Enums"]["campaign_number_status"]
          unit_price?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          number?: number
          order_id?: string
          status?: Database["public"]["Enums"]["campaign_number_status"]
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_receipts: {
        Row: {
          created_at: string
          filename: string
          id: string
          mime_type: string
          order_id: string
          size: number
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          mime_type?: string
          order_id: string
          size?: number
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          mime_type?: string
          order_id?: string
          size?: number
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_receipts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          campaign_id: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          discount: number
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          reservation_token: string | null
          source: Database["public"]["Enums"]["order_source"]
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount?: number
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          reservation_token?: string | null
          source?: Database["public"]["Enums"]["order_source"]
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount?: number
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          reservation_token?: string | null
          source?: Database["public"]["Enums"]["order_source"]
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string
          event_type: string
          gateway: Database["public"]["Enums"]["payment_gateway"]
          id: string
          payload: Json
          payment_id: string | null
          processed: boolean
          status: Database["public"]["Enums"]["payment_status"] | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id: string
          event_type: string
          gateway: Database["public"]["Enums"]["payment_gateway"]
          id?: string
          payload?: Json
          payment_id?: string | null
          processed?: boolean
          status?: Database["public"]["Enums"]["payment_status"] | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string
          event_type?: string
          gateway?: Database["public"]["Enums"]["payment_gateway"]
          id?: string
          payload?: Json
          payment_id?: string | null
          processed?: boolean
          status?: Database["public"]["Enums"]["payment_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateway_settings: {
        Row: {
          created_at: string
          credentials: Json
          enabled: boolean
          environment: Database["public"]["Enums"]["payment_environment"]
          gateway: Database["public"]["Enums"]["payment_gateway"]
          id: string
          last_test_ok: boolean | null
          last_tested_at: string | null
          pix_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          credentials?: Json
          enabled?: boolean
          environment?: Database["public"]["Enums"]["payment_environment"]
          gateway: Database["public"]["Enums"]["payment_gateway"]
          id?: string
          last_test_ok?: boolean | null
          last_tested_at?: string | null
          pix_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          credentials?: Json
          enabled?: boolean
          environment?: Database["public"]["Enums"]["payment_environment"]
          gateway?: Database["public"]["Enums"]["payment_gateway"]
          id?: string
          last_test_ok?: boolean | null
          last_tested_at?: string | null
          pix_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          attempt_number: number
          campaign_id: string
          cancelled_at: string | null
          created_at: string
          currency: string
          customer_id: string | null
          environment: Database["public"]["Enums"]["payment_environment"]
          expires_at: string | null
          failure_code: string | null
          failure_message: string | null
          gateway: Database["public"]["Enums"]["payment_gateway"]
          gateway_order_id: string | null
          gateway_payment_id: string | null
          id: string
          idempotency_key: string
          metadata: Json
          method: Database["public"]["Enums"]["payment_method_type"]
          order_id: string
          paid_at: string | null
          pix_copy_paste: string | null
          pix_qr_code: string | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          attempt_number?: number
          campaign_id: string
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          environment?: Database["public"]["Enums"]["payment_environment"]
          expires_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          gateway: Database["public"]["Enums"]["payment_gateway"]
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          id?: string
          idempotency_key: string
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method_type"]
          order_id: string
          paid_at?: string | null
          pix_copy_paste?: string | null
          pix_qr_code?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          attempt_number?: number
          campaign_id?: string
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          environment?: Database["public"]["Enums"]["payment_environment"]
          expires_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          gateway?: Database["public"]["Enums"]["payment_gateway"]
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          id?: string
          idempotency_key?: string
          metadata?: Json
          method?: Database["public"]["Enums"]["payment_method_type"]
          order_id?: string
          paid_at?: string | null
          pix_copy_paste?: string | null
          pix_qr_code?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          id: string
          max_campaigns: number
          max_cover_images_per_campaign: number
          max_gallery_images_per_campaign: number
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          id?: string
          max_campaigns?: number
          max_cover_images_per_campaign?: number
          max_gallery_images_per_campaign?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          max_campaigns?: number
          max_cover_images_per_campaign?: number
          max_gallery_images_per_campaign?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          default_language: string
          default_payment_gateway:
            | Database["public"]["Enums"]["payment_gateway"]
            | null
          default_theme: string
          default_timezone: string
          favicon: string | null
          footer_text: string | null
          id: string
          platform_logo: string | null
          platform_name: string
          primary_color: string
          privacy_policy: string | null
          secondary_color: string
          support_email: string | null
          support_phone: string | null
          terms_of_service: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_language?: string
          default_payment_gateway?:
            | Database["public"]["Enums"]["payment_gateway"]
            | null
          default_theme?: string
          default_timezone?: string
          favicon?: string | null
          footer_text?: string | null
          id?: string
          platform_logo?: string | null
          platform_name?: string
          primary_color?: string
          privacy_policy?: string | null
          secondary_color?: string
          support_email?: string | null
          support_phone?: string | null
          terms_of_service?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_language?: string
          default_payment_gateway?:
            | Database["public"]["Enums"]["payment_gateway"]
            | null
          default_theme?: string
          default_timezone?: string
          favicon?: string | null
          footer_text?: string | null
          id?: string
          platform_logo?: string | null
          platform_name?: string
          primary_color?: string
          privacy_policy?: string | null
          secondary_color?: string
          support_email?: string | null
          support_phone?: string | null
          terms_of_service?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          last_login: string | null
          name: string
          plan_id: string | null
          role_id: string | null
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          id: string
          last_login?: string | null
          name?: string
          plan_id?: string | null
          role_id?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          plan_id?: string | null
          role_id?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          permission: string
          role_id: string
        }
        Insert: {
          created_at?: string
          permission: string
          role_id: string
        }
        Update: {
          created_at?: string
          permission?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_system_role: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_system_role?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system_role?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      storage_files: {
        Row: {
          created_at: string
          filename: string
          folder: string
          id: string
          mime_type: string
          path: string
          size: number
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          filename: string
          folder?: string
          id?: string
          mime_type?: string
          path: string
          size?: number
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          filename?: string
          folder?: string
          id?: string
          mime_type?: string
          path?: string
          size?: number
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
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
      admin_payment_ledger: {
        Row: {
          amount: number | null
          attempt_number: number | null
          campaign_id: string | null
          cancelled_at: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          environment: Database["public"]["Enums"]["payment_environment"] | null
          expires_at: string | null
          failure_code: string | null
          failure_message: string | null
          gateway: Database["public"]["Enums"]["payment_gateway"] | null
          gateway_order_id: string | null
          gateway_payment_id: string | null
          id: string | null
          kind: string | null
          metadata: Json | null
          method: Database["public"]["Enums"]["payment_method_type"] | null
          order_id: string | null
          paid_at: string | null
          pix_copy_paste: string | null
          pix_qr_code: string | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_order_numbers: {
        Args: { p_numbers: number[]; p_order_id: string }
        Returns: Json
      }
      admin_manage_number: {
        Args: {
          p_campaign_id: string
          p_new_status: Database["public"]["Enums"]["campaign_number_status"]
          p_number: number
        }
        Returns: Json
      }
      can_manage_campaign: { Args: { p_campaign_id: string }; Returns: boolean }
      can_manage_order: { Args: { p_order_id: string }; Returns: boolean }
      cancel_campaign_reservation: {
        Args: { p_reserved_by: string; p_token: string }
        Returns: number
      }
      confirm_payment: {
        Args: {
          p_gateway_payment_id: string
          p_paid_at: string
          p_payment_id: string
        }
        Returns: Json
      }
      create_checkout_order: {
        Args: {
          p_campaign_id: string
          p_customer_email: string
          p_customer_name: string
          p_customer_phone: string
          p_reserved_by: string
          p_token: string
        }
        Returns: Json
      }
      create_manual_order:
        | {
            Args: {
              p_campaign_id: string
              p_customer_id: string
              p_discount: number
              p_notes: string
              p_numbers: number[]
              p_payment_method: Database["public"]["Enums"]["payment_method"]
            }
            Returns: Json
          }
        | {
            Args: {
              p_campaign_id: string
              p_customer_id: string
              p_discount: number
              p_initial_status?: Database["public"]["Enums"]["order_status"]
              p_notes: string
              p_numbers: number[]
              p_payment_method: Database["public"]["Enums"]["payment_method"]
            }
            Returns: Json
          }
      create_whatsapp_order: {
        Args: {
          p_campaign_id: string
          p_customer_name: string
          p_customer_phone: string
          p_reserved_by: string
          p_token: string
        }
        Returns: Json
      }
      expire_stale_payments: { Args: never; Returns: number }
      finalize_payment: {
        Args: {
          p_failure_code: string
          p_failure_message: string
          p_payment_id: string
          p_status: Database["public"]["Enums"]["payment_status"]
        }
        Returns: Json
      }
      get_user_role_code: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      import_sold_numbers: {
        Args: {
          p_campaign_id: string
          p_customer_id: string
          p_notes: string
          p_numbers: number[]
          p_payment_method: Database["public"]["Enums"]["payment_method"]
        }
        Returns: Json
      }
      is_admin_user: { Args: never; Returns: boolean }
      is_global_admin: { Args: never; Returns: boolean }
      is_global_admin_v2: { Args: never; Returns: boolean }
      log_order_audit: {
        Args: {
          p_action: string
          p_actor_id: string
          p_campaign_id: string
          p_metadata: Json
          p_order_id: string
        }
        Returns: undefined
      }
      log_reservation_audit: {
        Args: {
          p_action: string
          p_actor_id: string
          p_campaign_id: string
          p_metadata: Json
          p_token: string
        }
        Returns: undefined
      }
      release_expired_campaign_reservations: { Args: never; Returns: number }
      remove_order_numbers: {
        Args: { p_numbers: number[]; p_order_id: string }
        Returns: Json
      }
      reserve_campaign_numbers: {
        Args: {
          p_campaign_id: string
          p_numbers: number[]
          p_reserved_by: string
        }
        Returns: Json
      }
      set_order_status: {
        Args: {
          p_order_id: string
          p_status: Database["public"]["Enums"]["order_status"]
        }
        Returns: Json
      }
      swap_order_number: {
        Args: { p_new_number: number; p_old_number: number; p_order_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "GLOBAL_ADMIN" | "USER"
      campaign_image_type:
        | "COVER"
        | "GALLERY"
        | "SHARE"
        | "THUMBNAIL"
        | "BANNER"
      campaign_number_status:
        | "AVAILABLE"
        | "RESERVED"
        | "PENDING_PAYMENT"
        | "PAID"
        | "BLOCKED"
        | "CANCELLED"
        | "WINNER"
      campaign_publish_status:
        | "DRAFT"
        | "UNDER_REVIEW"
        | "PUBLISHED"
        | "PAUSED"
        | "FINISHED"
        | "ARCHIVED"
      campaign_purchase_mode: "MANUAL" | "AUTOMATIC"
      campaign_status:
        | "DRAFT"
        | "SCHEDULED"
        | "ACTIVE"
        | "PAUSED"
        | "FINISHED"
        | "CANCELLED"
        | "ARCHIVED"
      campaign_visibility: "PUBLIC" | "PRIVATE"
      order_source: "ONLINE" | "WHATSAPP" | "MANUAL"
      order_status:
        | "OPEN"
        | "WAITING_CONTACT"
        | "WAITING_PAYMENT"
        | "PAID"
        | "CANCELLED"
        | "EXPIRED"
        | "REFUNDED"
      payment_environment: "SANDBOX" | "PRODUCTION"
      payment_gateway:
        | "INFINITYPAY"
        | "MERCADO_PAGO"
        | "PAGBANK"
        | "MANUAL"
        | "ADVANCED_FEE"
      payment_method:
        | "PIX"
        | "DINHEIRO"
        | "CARTAO"
        | "TRANSFERENCIA"
        | "MERCADO_PAGO"
        | "PAGBANK"
        | "INFINITYPAY"
        | "OUTRO"
      payment_method_type: "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "BOLETO"
      payment_status:
        | "CREATED"
        | "PENDING"
        | "WAITING_PAYMENT"
        | "PAID"
        | "FAILED"
        | "CANCELLED"
        | "EXPIRED"
        | "REFUNDED"
      profile_status:
        | "ACTIVE"
        | "DISABLED"
        | "INACTIVE"
        | "PENDING"
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
      app_role: ["GLOBAL_ADMIN", "USER"],
      campaign_image_type: ["COVER", "GALLERY", "SHARE", "THUMBNAIL", "BANNER"],
      campaign_number_status: [
        "AVAILABLE",
        "RESERVED",
        "PENDING_PAYMENT",
        "PAID",
        "BLOCKED",
        "CANCELLED",
        "WINNER",
      ],
      campaign_publish_status: [
        "DRAFT",
        "UNDER_REVIEW",
        "PUBLISHED",
        "PAUSED",
        "FINISHED",
        "ARCHIVED",
      ],
      campaign_purchase_mode: ["MANUAL", "AUTOMATIC"],
      campaign_status: [
        "DRAFT",
        "SCHEDULED",
        "ACTIVE",
        "PAUSED",
        "FINISHED",
        "CANCELLED",
        "ARCHIVED",
      ],
      campaign_visibility: ["PUBLIC", "PRIVATE"],
      order_source: ["ONLINE", "WHATSAPP", "MANUAL"],
      order_status: [
        "OPEN",
        "WAITING_CONTACT",
        "WAITING_PAYMENT",
        "PAID",
        "CANCELLED",
        "EXPIRED",
        "REFUNDED",
      ],
      payment_environment: ["SANDBOX", "PRODUCTION"],
      payment_gateway: [
        "INFINITYPAY",
        "MERCADO_PAGO",
        "PAGBANK",
        "MANUAL",
        "ADVANCED_FEE",
      ],
      payment_method: [
        "PIX",
        "DINHEIRO",
        "CARTAO",
        "TRANSFERENCIA",
        "MERCADO_PAGO",
        "PAGBANK",
        "INFINITYPAY",
        "OUTRO",
      ],
      payment_method_type: ["PIX", "CREDIT_CARD", "DEBIT_CARD", "BOLETO"],
      payment_status: [
        "CREATED",
        "PENDING",
        "WAITING_PAYMENT",
        "PAID",
        "FAILED",
        "CANCELLED",
        "EXPIRED",
        "REFUNDED",
      ],
      profile_status: [
        "ACTIVE",
        "DISABLED",
        "INACTIVE",
        "PENDING",
        "SUSPENDED",
      ],
    },
  },
} as const
