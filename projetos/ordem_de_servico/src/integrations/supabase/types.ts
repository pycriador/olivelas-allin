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
      audit_log: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          id: string
          ip: string | null
          metadata: Json | null
          resource: string | null
          result: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json | null
          resource?: string | null
          result?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json | null
          resource?: string | null
          result?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          logo: string | null
          manufacturer_id: string | null
          name: string
          notes: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          logo?: string | null
          manufacturer_id?: string | null
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          logo?: string | null
          manufacturer_id?: string | null
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brands_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          active: boolean
          cnpj: string | null
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_email_domains: {
        Row: {
          company_id: string
          created_at: string
          default_role: Database["public"]["Enums"]["app_role"]
          domain: string
          id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          default_role?: Database["public"]["Enums"]["app_role"]
          domain: string
          id?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          default_role?: Database["public"]["Enums"]["app_role"]
          domain?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_email_domains_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          addresses: Json
          attachments: Json
          birth_date: string | null
          cellphone: string | null
          classification: string | null
          cnpj: string | null
          comments: Json
          company_id: string
          company_name: string | null
          contacts: Json
          cpf: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json
          deleted_at: string | null
          documents: Json
          email: string | null
          fantasy_name: string | null
          favorite: boolean
          id: string
          municipal_registration: string | null
          name: string
          notes: string | null
          observations: Json
          origin: string | null
          phone: string | null
          photo: string | null
          profession: string | null
          relationships: Json
          responsible_user_id: string | null
          rg: string | null
          secondary_email: string | null
          state_registration: string | null
          status: string
          tags: string[]
          timeline: Json
          type: string
          updated_at: string
          updated_by: string | null
          warranties: Json
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          addresses?: Json
          attachments?: Json
          birth_date?: string | null
          cellphone?: string | null
          classification?: string | null
          cnpj?: string | null
          comments?: Json
          company_id: string
          company_name?: string | null
          contacts?: Json
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          deleted_at?: string | null
          documents?: Json
          email?: string | null
          fantasy_name?: string | null
          favorite?: boolean
          id?: string
          municipal_registration?: string | null
          name: string
          notes?: string | null
          observations?: Json
          origin?: string | null
          phone?: string | null
          photo?: string | null
          profession?: string | null
          relationships?: Json
          responsible_user_id?: string | null
          rg?: string | null
          secondary_email?: string | null
          state_registration?: string | null
          status?: string
          tags?: string[]
          timeline?: Json
          type?: string
          updated_at?: string
          updated_by?: string | null
          warranties?: Json
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          addresses?: Json
          attachments?: Json
          birth_date?: string | null
          cellphone?: string | null
          classification?: string | null
          cnpj?: string | null
          comments?: Json
          company_id?: string
          company_name?: string | null
          contacts?: Json
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          deleted_at?: string | null
          documents?: Json
          email?: string | null
          fantasy_name?: string | null
          favorite?: boolean
          id?: string
          municipal_registration?: string | null
          name?: string
          notes?: string | null
          observations?: Json
          origin?: string | null
          phone?: string | null
          photo?: string | null
          profession?: string | null
          relationships?: Json
          responsible_user_id?: string | null
          rg?: string | null
          secondary_email?: string | null
          state_registration?: string | null
          status?: string
          tags?: string[]
          timeline?: Json
          type?: string
          updated_at?: string
          updated_by?: string | null
          warranties?: Json
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      defects: {
        Row: {
          category_id: string | null
          code: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          severity: string | null
          solution: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category_id?: string | null
          code?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          severity?: string | null
          solution?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category_id?: string | null
          code?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          severity?: string | null
          solution?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "defects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "defects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          accessories: Json
          asset_number: string | null
          brand_id: string | null
          category_id: string | null
          checklist: Json | null
          color: string | null
          company_id: string
          condition: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json
          customer_id: string | null
          deleted_at: string | null
          device_documents: Json
          equipment_type_id: string | null
          favorite: boolean
          files: Json
          id: string
          imei: string | null
          invoice_number: string | null
          manufacturer_id: string | null
          manufacturer_warranty: string | null
          model_id: string | null
          notes: string | null
          password: string | null
          photos: Json
          purchase_date: string | null
          serial_number: string | null
          status: string
          timeline: Json
          transfers: Json
          type: string | null
          updated_at: string
          updated_by: string | null
          voltage: string | null
          warranty_id: string | null
        }
        Insert: {
          accessories?: Json
          asset_number?: string | null
          brand_id?: string | null
          category_id?: string | null
          checklist?: Json | null
          color?: string | null
          company_id: string
          condition?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          customer_id?: string | null
          deleted_at?: string | null
          device_documents?: Json
          equipment_type_id?: string | null
          favorite?: boolean
          files?: Json
          id?: string
          imei?: string | null
          invoice_number?: string | null
          manufacturer_id?: string | null
          manufacturer_warranty?: string | null
          model_id?: string | null
          notes?: string | null
          password?: string | null
          photos?: Json
          purchase_date?: string | null
          serial_number?: string | null
          status?: string
          timeline?: Json
          transfers?: Json
          type?: string | null
          updated_at?: string
          updated_by?: string | null
          voltage?: string | null
          warranty_id?: string | null
        }
        Update: {
          accessories?: Json
          asset_number?: string | null
          brand_id?: string | null
          category_id?: string | null
          checklist?: Json | null
          color?: string | null
          company_id?: string
          condition?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json
          customer_id?: string | null
          deleted_at?: string | null
          device_documents?: Json
          equipment_type_id?: string | null
          favorite?: boolean
          files?: Json
          id?: string
          imei?: string | null
          invoice_number?: string | null
          manufacturer_id?: string | null
          manufacturer_warranty?: string | null
          model_id?: string | null
          notes?: string | null
          password?: string | null
          photos?: Json
          purchase_date?: string | null
          serial_number?: string | null
          status?: string
          timeline?: Json
          transfers?: Json
          type?: string | null
          updated_at?: string
          updated_by?: string | null
          voltage?: string | null
          warranty_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_equipment_type_id_fkey"
            columns: ["equipment_type_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_warranty_id_fkey"
            columns: ["warranty_id"]
            isOneToOne: false
            referencedRelation: "warranties"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_types: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturers: {
        Row: {
          company_id: string
          country: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          notes: string | null
          status: string
          support_email: string | null
          support_phone: string | null
          updated_at: string
          updated_by: string | null
          website: string | null
        }
        Insert: {
          company_id: string
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          notes?: string | null
          status?: string
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          company_id?: string
          country?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          status?: string
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manufacturers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_units: {
        Row: {
          abbreviation: string
          active: boolean
          category: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          abbreviation: string
          active?: boolean
          category?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          abbreviation?: string
          active?: boolean
          category?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "measurement_units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          brand_id: string | null
          category_id: string | null
          code: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          notes: string | null
          specifications: Json
          status: string
          updated_at: string
          updated_by: string | null
          year: number | null
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          code?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          notes?: string | null
          specifications?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
          year?: number | null
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          code?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          specifications?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "models_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "models_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          barcode: string | null
          brand_id: string | null
          category_id: string | null
          code: string | null
          company_id: string
          cost_price: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          location: string | null
          measurement_unit_id: string | null
          min_stock: number
          name: string
          sale_price: number
          status: string
          stock_quantity: number
          supplier_id: string | null
          updated_at: string
          updated_by: string | null
          warranty_id: string | null
        }
        Insert: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          code?: string | null
          company_id: string
          cost_price?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          measurement_unit_id?: string | null
          min_stock?: number
          name: string
          sale_price?: number
          status?: string
          stock_quantity?: number
          supplier_id?: string | null
          updated_at?: string
          updated_by?: string | null
          warranty_id?: string | null
        }
        Update: {
          barcode?: string | null
          brand_id?: string | null
          category_id?: string | null
          code?: string | null
          company_id?: string
          cost_price?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          measurement_unit_id?: string | null
          min_stock?: number
          name?: string
          sale_price?: number
          status?: string
          stock_quantity?: number
          supplier_id?: string | null
          updated_at?: string
          updated_by?: string | null
          warranty_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_measurement_unit_id_fkey"
            columns: ["measurement_unit_id"]
            isOneToOne: false
            referencedRelation: "measurement_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_warranty_id_fkey"
            columns: ["warranty_id"]
            isOneToOne: false
            referencedRelation: "warranties"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          active: boolean
          code: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          fee_percent: number
          id: string
          name: string
          type: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          code?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          fee_percent?: number
          id?: string
          name: string
          type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          code?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          fee_percent?: number
          id?: string
          name?: string
          type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_terms: {
        Row: {
          active: boolean
          code: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          first_due_days: number
          id: string
          installments: number
          interest_percent: number
          interval_days: number
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          code?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          first_due_days?: number
          id?: string
          installments?: number
          interest_percent?: number
          interval_days?: number
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          code?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          first_due_days?: number
          id?: string
          installments?: number
          interest_percent?: number
          interval_days?: number
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_terms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_orders: {
        Row: {
          attachments: Json
          category_id: string | null
          comments: Json
          communications: Json
          company_id: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_name: string
          deadline: string | null
          defect_id: string | null
          defect_name: string | null
          deleted_at: string | null
          delivery_date: string | null
          description: string
          device_id: string | null
          device_info: string | null
          diagnosis: string | null
          documents: Json
          entry_date: string
          estimated_value: number
          final_value: number
          id: string
          notes: string | null
          number: string
          parts: Json
          pinned: boolean
          priority: string
          services: Json
          status: string
          status_label: string
          tags: string[]
          technician_id: string | null
          technician_name: string | null
          timeline: Json
          updated_at: string
          updated_by: string | null
          warranty_id: string | null
        }
        Insert: {
          attachments?: Json
          category_id?: string | null
          comments?: Json
          communications?: Json
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string
          deadline?: string | null
          defect_id?: string | null
          defect_name?: string | null
          deleted_at?: string | null
          delivery_date?: string | null
          description?: string
          device_id?: string | null
          device_info?: string | null
          diagnosis?: string | null
          documents?: Json
          entry_date?: string
          estimated_value?: number
          final_value?: number
          id?: string
          notes?: string | null
          number: string
          parts?: Json
          pinned?: boolean
          priority?: string
          services?: Json
          status?: string
          status_label?: string
          tags?: string[]
          technician_id?: string | null
          technician_name?: string | null
          timeline?: Json
          updated_at?: string
          updated_by?: string | null
          warranty_id?: string | null
        }
        Update: {
          attachments?: Json
          category_id?: string | null
          comments?: Json
          communications?: Json
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string
          deadline?: string | null
          defect_id?: string | null
          defect_name?: string | null
          deleted_at?: string | null
          delivery_date?: string | null
          description?: string
          device_id?: string | null
          device_info?: string | null
          diagnosis?: string | null
          documents?: Json
          entry_date?: string
          estimated_value?: number
          final_value?: number
          id?: string
          notes?: string | null
          number?: string
          parts?: Json
          pinned?: boolean
          priority?: string
          services?: Json
          status?: string
          status_label?: string
          tags?: string[]
          technician_id?: string | null
          technician_name?: string | null
          timeline?: Json
          updated_at?: string
          updated_by?: string | null
          warranty_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_defect_id_fkey"
            columns: ["defect_id"]
            isOneToOne: false
            referencedRelation: "defects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_warranty_id_fkey"
            columns: ["warranty_id"]
            isOneToOne: false
            referencedRelation: "warranties"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category_id: string | null
          code: string | null
          company_id: string
          cost: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          estimated_time: number | null
          id: string
          name: string
          price: number
          status: string
          updated_at: string
          updated_by: string | null
          warranty_id: string | null
        }
        Insert: {
          category_id?: string | null
          code?: string | null
          company_id: string
          cost?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          estimated_time?: number | null
          id?: string
          name: string
          price?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
          warranty_id?: string | null
        }
        Update: {
          category_id?: string | null
          code?: string | null
          company_id?: string
          cost?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          estimated_time?: number | null
          id?: string
          name?: string
          price?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
          warranty_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_warranty_id_fkey"
            columns: ["warranty_id"]
            isOneToOne: false
            referencedRelation: "warranties"
            referencedColumns: ["id"]
          },
        ]
      }
      so_approvals: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          budget_id: string | null
          company_id: string
          created_at: string
          id: string
          notes: string | null
          origin: string
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          sent_at: string | null
          service_order_id: string
          status: string
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          budget_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          origin?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          service_order_id: string
          status?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          budget_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          origin?: string
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          service_order_id?: string
          status?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "so_approvals_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "so_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_approvals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_approvals_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      so_budgets: {
        Row: {
          approval_date: string | null
          approval_user: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deadline: string | null
          discount_authorized_by: string | null
          discount_reason: string | null
          discount_total: number
          discount_type: string
          final_value: number
          id: string
          items: Json
          markup_total: number
          notes: string
          rejection_reason: string | null
          service_order_id: string
          shipping: number
          status: string
          subtotal: number
          taxes: number
          updated_at: string
          validity_days: number
          version: number
          warranty_description: string
        }
        Insert: {
          approval_date?: string | null
          approval_user?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          discount_authorized_by?: string | null
          discount_reason?: string | null
          discount_total?: number
          discount_type?: string
          final_value?: number
          id?: string
          items?: Json
          markup_total?: number
          notes?: string
          rejection_reason?: string | null
          service_order_id: string
          shipping?: number
          status?: string
          subtotal?: number
          taxes?: number
          updated_at?: string
          validity_days?: number
          version?: number
          warranty_description?: string
        }
        Update: {
          approval_date?: string | null
          approval_user?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          discount_authorized_by?: string | null
          discount_reason?: string | null
          discount_total?: number
          discount_type?: string
          final_value?: number
          id?: string
          items?: Json
          markup_total?: number
          notes?: string
          rejection_reason?: string | null
          service_order_id?: string
          shipping?: number
          status?: string
          subtotal?: number
          taxes?: number
          updated_at?: string
          validity_days?: number
          version?: number
          warranty_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "so_budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_budgets_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      so_checklist_templates: {
        Row: {
          active: boolean
          company_id: string
          created_at: string
          description: string
          id: string
          items: Json
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string
          description?: string
          id?: string
          items?: Json
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          items?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "so_checklist_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      so_checklists: {
        Row: {
          company_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          items: Json
          service_order_id: string
          template_id: string | null
          template_name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          items?: Json
          service_order_id: string
          template_id?: string | null
          template_name?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          items?: Json
          service_order_id?: string
          template_id?: string | null
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "so_checklists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_checklists_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_checklists_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "so_checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      so_costs: {
        Row: {
          company_id: string
          created_at: string
          data: Json
          id: string
          service_order_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          data?: Json
          id?: string
          service_order_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data?: Json
          id?: string
          service_order_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "so_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_costs_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      so_deliveries: {
        Row: {
          checklist: Json
          company_id: string
          completed_at: string | null
          created_at: string
          date: string | null
          documents_delivered: Json
          exit_photos: Json
          id: string
          notes: string | null
          payment_confirmed: boolean
          responsable: string
          service_order_id: string
          signature_id: string | null
          time: string | null
          updated_at: string
          warranty_delivered: boolean
        }
        Insert: {
          checklist?: Json
          company_id: string
          completed_at?: string | null
          created_at?: string
          date?: string | null
          documents_delivered?: Json
          exit_photos?: Json
          id?: string
          notes?: string | null
          payment_confirmed?: boolean
          responsable?: string
          service_order_id: string
          signature_id?: string | null
          time?: string | null
          updated_at?: string
          warranty_delivered?: boolean
        }
        Update: {
          checklist?: Json
          company_id?: string
          completed_at?: string | null
          created_at?: string
          date?: string | null
          documents_delivered?: Json
          exit_photos?: Json
          id?: string
          notes?: string | null
          payment_confirmed?: boolean
          responsable?: string
          service_order_id?: string
          signature_id?: string | null
          time?: string | null
          updated_at?: string
          warranty_delivered?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "so_deliveries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_deliveries_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      so_diagnostics: {
        Row: {
          company_id: string
          created_at: string
          current_version: number
          id: string
          revisions: Json
          service_order_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          current_version?: number
          id?: string
          revisions?: Json
          service_order_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          current_version?: number
          id?: string
          revisions?: Json
          service_order_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "so_diagnostics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_diagnostics_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      so_execution_activities: {
        Row: {
          attachments: Json
          comments: Json
          company_id: string
          created_at: string
          date: string | null
          description: string
          id: string
          name: string
          notes: string
          photos: Json
          responsible_id: string | null
          responsible_name: string | null
          service_order_id: string
          status: string
          time: string | null
          time_spent: number
          updated_at: string
        }
        Insert: {
          attachments?: Json
          comments?: Json
          company_id: string
          created_at?: string
          date?: string | null
          description?: string
          id?: string
          name: string
          notes?: string
          photos?: Json
          responsible_id?: string | null
          responsible_name?: string | null
          service_order_id: string
          status?: string
          time?: string | null
          time_spent?: number
          updated_at?: string
        }
        Update: {
          attachments?: Json
          comments?: Json
          company_id?: string
          created_at?: string
          date?: string | null
          description?: string
          id?: string
          name?: string
          notes?: string
          photos?: Json
          responsible_id?: string | null
          responsible_name?: string | null
          service_order_id?: string
          status?: string
          time?: string | null
          time_spent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "so_execution_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_execution_activities_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      so_financial_history: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          new_balance: number | null
          previous_balance: number | null
          service_order_id: string
          type: string
          user_id: string | null
          user_name: string | null
          value: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string
          id?: string
          new_balance?: number | null
          previous_balance?: number | null
          service_order_id: string
          type: string
          user_id?: string | null
          user_name?: string | null
          value?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          new_balance?: number | null
          previous_balance?: number | null
          service_order_id?: string
          type?: string
          user_id?: string | null
          user_name?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "so_financial_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_financial_history_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      so_payments: {
        Row: {
          company_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          date: string | null
          document_id: string | null
          id: string
          installment_detail: Json
          installments: number
          method: string
          method_label: string
          notes: string | null
          receipt_url: string | null
          responsible: string | null
          service_order_id: string
          status: string
          time: string | null
          updated_at: string
          value: number
        }
        Insert: {
          company_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          date?: string | null
          document_id?: string | null
          id?: string
          installment_detail?: Json
          installments?: number
          method?: string
          method_label?: string
          notes?: string | null
          receipt_url?: string | null
          responsible?: string | null
          service_order_id: string
          status?: string
          time?: string | null
          updated_at?: string
          value?: number
        }
        Update: {
          company_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          date?: string | null
          document_id?: string | null
          id?: string
          installment_detail?: Json
          installments?: number
          method?: string
          method_label?: string
          notes?: string | null
          receipt_url?: string | null
          responsible?: string | null
          service_order_id?: string
          status?: string
          time?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "so_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_payments_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      so_photos: {
        Row: {
          caption: string
          category: string
          company_id: string
          favorite: boolean
          file_url: string
          id: string
          order: number
          return_id: string | null
          service_order_id: string
          thumbnail_url: string | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string
          category?: string
          company_id: string
          favorite?: boolean
          file_url: string
          id?: string
          order?: number
          return_id?: string | null
          service_order_id: string
          thumbnail_url?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string
          category?: string
          company_id?: string
          favorite?: boolean
          file_url?: string
          id?: string
          order?: number
          return_id?: string | null
          service_order_id?: string
          thumbnail_url?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "so_photos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_photos_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "so_returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_photos_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      so_portal_access: {
        Row: {
          company_id: string
          created_at: string
          documents: Json
          hash: string
          id: string
          public_code: string
          public_url: string
          qr_data: string
          service_order_id: string
          status: string
          status_label: string
          timeline: Json
          updated_at: string
          warranty: string
        }
        Insert: {
          company_id: string
          created_at?: string
          documents?: Json
          hash?: string
          id?: string
          public_code: string
          public_url?: string
          qr_data?: string
          service_order_id: string
          status?: string
          status_label?: string
          timeline?: Json
          updated_at?: string
          warranty?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          documents?: Json
          hash?: string
          id?: string
          public_code?: string
          public_url?: string
          qr_data?: string
          service_order_id?: string
          status?: string
          status_label?: string
          timeline?: Json
          updated_at?: string
          warranty?: string
        }
        Relationships: [
          {
            foreignKeyName: "so_portal_access_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_portal_access_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      so_quality_control: {
        Row: {
          company_id: string
          created_at: string
          data: Json
          id: string
          service_order_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          data?: Json
          id?: string
          service_order_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data?: Json
          id?: string
          service_order_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "so_quality_control_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_quality_control_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      so_receipts: {
        Row: {
          company_id: string
          created_at: string
          document_id: string | null
          generated_at: string
          generated_by: string | null
          id: string
          number: string
          service_order_id: string
          type: string
        }
        Insert: {
          company_id: string
          created_at?: string
          document_id?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          number?: string
          service_order_id: string
          type?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          document_id?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          number?: string
          service_order_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "so_receipts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_receipts_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      so_returns: {
        Row: {
          charged: boolean
          comments: Json
          company_id: string
          created_at: string
          date: string
          delivery_date: string | null
          diagnosis: string
          documents: Json
          id: string
          number: string
          photos: Json
          reason: string
          reported_defect: string
          responsible_id: string | null
          responsible_name: string | null
          service_order_id: string
          solution: string
          timeline: Json
          updated_at: string
          warranty_applied: boolean
        }
        Insert: {
          charged?: boolean
          comments?: Json
          company_id: string
          created_at?: string
          date?: string
          delivery_date?: string | null
          diagnosis?: string
          documents?: Json
          id?: string
          number?: string
          photos?: Json
          reason?: string
          reported_defect?: string
          responsible_id?: string | null
          responsible_name?: string | null
          service_order_id: string
          solution?: string
          timeline?: Json
          updated_at?: string
          warranty_applied?: boolean
        }
        Update: {
          charged?: boolean
          comments?: Json
          company_id?: string
          created_at?: string
          date?: string
          delivery_date?: string | null
          diagnosis?: string
          documents?: Json
          id?: string
          number?: string
          photos?: Json
          reason?: string
          reported_defect?: string
          responsible_id?: string | null
          responsible_name?: string | null
          service_order_id?: string
          solution?: string
          timeline?: Json
          updated_at?: string
          warranty_applied?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "so_returns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_returns_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      so_signatures: {
        Row: {
          collected_at: string
          company_id: string
          created_at: string
          delivery_id: string | null
          id: string
          ip_address: string | null
          service_order_id: string
          signatory_id: string | null
          signatory_name: string
          signature_data: string
          type: string
        }
        Insert: {
          collected_at?: string
          company_id: string
          created_at?: string
          delivery_id?: string | null
          id?: string
          ip_address?: string | null
          service_order_id: string
          signatory_id?: string | null
          signatory_name?: string
          signature_data?: string
          type?: string
        }
        Update: {
          collected_at?: string
          company_id?: string
          created_at?: string
          delivery_id?: string | null
          id?: string
          ip_address?: string | null
          service_order_id?: string
          signatory_id?: string | null
          signatory_name?: string
          signature_data?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "so_signatures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_signatures_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "so_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_signatures_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      so_tests: {
        Row: {
          company_id: string
          created_at: string
          data: Json
          id: string
          service_order_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          data?: Json
          id?: string
          service_order_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data?: Json
          id?: string
          service_order_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "so_tests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_tests_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      so_time_tracking: {
        Row: {
          activity_id: string | null
          awaiting_parts_time: number
          company_id: string
          completion_time: string | null
          created_at: string
          id: string
          pause_time: string | null
          productive_time: number
          resume_time: string | null
          service_order_id: string
          start_time: string | null
          stopped_time: number
          technician_id: string | null
          technician_name: string | null
          total_time: number
          updated_at: string
        }
        Insert: {
          activity_id?: string | null
          awaiting_parts_time?: number
          company_id: string
          completion_time?: string | null
          created_at?: string
          id?: string
          pause_time?: string | null
          productive_time?: number
          resume_time?: string | null
          service_order_id: string
          start_time?: string | null
          stopped_time?: number
          technician_id?: string | null
          technician_name?: string | null
          total_time?: number
          updated_at?: string
        }
        Update: {
          activity_id?: string | null
          awaiting_parts_time?: number
          company_id?: string
          completion_time?: string | null
          created_at?: string
          id?: string
          pause_time?: string | null
          productive_time?: number
          resume_time?: string | null
          service_order_id?: string
          start_time?: string | null
          stopped_time?: number
          technician_id?: string | null
          technician_name?: string | null
          total_time?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "so_time_tracking_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "so_execution_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_time_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_time_tracking_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      so_warranties: {
        Row: {
          company_id: string
          coverage: string
          created_at: string
          days: number
          end_date: string
          id: string
          notes: string
          return_id: string | null
          service_item_id: string | null
          service_order_id: string
          start_date: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          coverage?: string
          created_at?: string
          days?: number
          end_date?: string
          id?: string
          notes?: string
          return_id?: string | null
          service_item_id?: string | null
          service_order_id: string
          start_date?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          coverage?: string
          created_at?: string
          days?: number
          end_date?: string
          id?: string
          notes?: string
          return_id?: string | null
          service_item_id?: string | null
          service_order_id?: string
          start_date?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "so_warranties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_warranties_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "so_returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "so_warranties_service_order_id_fkey"
            columns: ["service_order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: Json
          cellphone: string | null
          company_id: string
          contact_name: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          document: string | null
          email: string | null
          fantasy_name: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          type: string
          updated_at: string
          updated_by: string | null
          website: string | null
        }
        Insert: {
          address?: Json
          cellphone?: string | null
          company_id: string
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          document?: string | null
          email?: string | null
          fantasy_name?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          type?: string
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          address?: Json
          cellphone?: string | null
          company_id?: string
          contact_name?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          document?: string | null
          email?: string | null
          fantasy_name?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          type?: string
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          cellphone: string | null
          certifications: Json
          commission_rate: number
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          document: string | null
          email: string | null
          hire_date: string | null
          hourly_rate: number
          id: string
          name: string
          notes: string | null
          phone: string | null
          photo: string | null
          role: string | null
          specialties: string[]
          status: string
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          cellphone?: string | null
          certifications?: Json
          commission_rate?: number
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          document?: string | null
          email?: string | null
          hire_date?: string | null
          hourly_rate?: number
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          photo?: string | null
          role?: string | null
          specialties?: string[]
          status?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          cellphone?: string | null
          certifications?: Json
          commission_rate?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          document?: string | null
          email?: string | null
          hire_date?: string | null
          hourly_rate?: number
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          photo?: string | null
          role?: string | null
          specialties?: string[]
          status?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technicians_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_companies: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_default: boolean
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      warranties: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          duration_days: number
          id: string
          name: string
          status: string
          terms: string | null
          type: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          name: string
          status?: string
          terms?: string | null
          type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          name?: string
          status?: string
          terms?: string | null
          type?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warranties_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_company_access: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_admin: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_global_admin: { Args: { _user_id: string }; Returns: boolean }
      link_user_by_verified_domain: {
        Args: { _email: string; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "global_admin" | "admin" | "editor" | "viewer"
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
      app_role: ["global_admin", "admin", "editor", "viewer"],
    },
  },
} as const
