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
      api_tokens: {
        Row: {
          created_at: string
          id: string
          last_used_at: string | null
          nome: string
          prefix: string
          revoked_at: string | null
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          nome: string
          prefix: string
          revoked_at?: string | null
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          nome?: string
          prefix?: string
          revoked_at?: string | null
          token_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      colecao: {
        Row: {
          completo: boolean | null
          condicao: string | null
          created_at: string
          data_compra: string | null
          edicao: string | null
          formato: string | null
          id: string
          item_id: string | null
          jogo_id: string | null
          local_compra: string | null
          localizacao_fisica: string | null
          midia: string | null
          nota_pessoal: number | null
          observacoes: string | null
          plataforma_id: string | null
          preco_pago: number | null
          regiao: string | null
          status: string | null
          tipo_item: string
          user_id: string
        }
        Insert: {
          completo?: boolean | null
          condicao?: string | null
          created_at?: string
          data_compra?: string | null
          edicao?: string | null
          formato?: string | null
          id?: string
          item_id?: string | null
          jogo_id?: string | null
          local_compra?: string | null
          localizacao_fisica?: string | null
          midia?: string | null
          nota_pessoal?: number | null
          observacoes?: string | null
          plataforma_id?: string | null
          preco_pago?: number | null
          regiao?: string | null
          status?: string | null
          tipo_item: string
          user_id: string
        }
        Update: {
          completo?: boolean | null
          condicao?: string | null
          created_at?: string
          data_compra?: string | null
          edicao?: string | null
          formato?: string | null
          id?: string
          item_id?: string | null
          jogo_id?: string | null
          local_compra?: string | null
          localizacao_fisica?: string | null
          midia?: string | null
          nota_pessoal?: number | null
          observacoes?: string | null
          plataforma_id?: string | null
          preco_pago?: number | null
          regiao?: string | null
          status?: string | null
          tipo_item?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "colecao_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colecao_jogo_id_fkey"
            columns: ["jogo_id"]
            isOneToOne: false
            referencedRelation: "jogos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colecao_plataforma_id_fkey"
            columns: ["plataforma_id"]
            isOneToOne: false
            referencedRelation: "plataformas"
            referencedColumns: ["id"]
          },
        ]
      }
      cupons: {
        Row: {
          ativo: boolean | null
          codigo: string
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          loja_id: string | null
          tipo_desconto: string
          user_id: string
          valor_desconto: number
          valor_minimo: number | null
        }
        Insert: {
          ativo?: boolean | null
          codigo: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          loja_id?: string | null
          tipo_desconto: string
          user_id: string
          valor_desconto: number
          valor_minimo?: number | null
        }
        Update: {
          ativo?: boolean | null
          codigo?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          loja_id?: string | null
          tipo_desconto?: string
          user_id?: string
          valor_desconto?: number
          valor_minimo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cupons_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          created_at: string
          id: string
          nome: string
          pais: string | null
          tipo: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          pais?: string | null
          tipo?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          pais?: string | null
          tipo?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      filtros_salvos: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_last: boolean
          nome: string
          tabela: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_last?: boolean
          nome: string
          tabela: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_last?: boolean
          nome?: string
          tabela?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generos: {
        Row: {
          created_at: string
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      itens: {
        Row: {
          ano_lancamento: number | null
          created_at: string
          descricao: string | null
          id: string
          imagem_url: string | null
          marca: string | null
          modelo: string | null
          nome: string
          plataforma_id: string | null
          tipo: string | null
          user_id: string
        }
        Insert: {
          ano_lancamento?: number | null
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          marca?: string | null
          modelo?: string | null
          nome: string
          plataforma_id?: string | null
          tipo?: string | null
          user_id: string
        }
        Update: {
          ano_lancamento?: number | null
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          marca?: string | null
          modelo?: string | null
          nome?: string
          plataforma_id?: string | null
          tipo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_plataforma_id_fkey"
            columns: ["plataforma_id"]
            isOneToOne: false
            referencedRelation: "plataformas"
            referencedColumns: ["id"]
          },
        ]
      }
      jogo_imagens: {
        Row: {
          created_at: string
          id: string
          jogo_id: string
          ordem: number
          storage_path: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          jogo_id: string
          ordem?: number
          storage_path?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          jogo_id?: string
          ordem?: number
          storage_path?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jogo_imagens_jogo_id_fkey"
            columns: ["jogo_id"]
            isOneToOne: false
            referencedRelation: "jogos"
            referencedColumns: ["id"]
          },
        ]
      }
      jogos: {
        Row: {
          ano_lancamento: number | null
          capa_url: string | null
          classificacao_indicativa: string | null
          created_at: string
          descricao: string | null
          desenvolvedora_id: string | null
          genero_id: string | null
          id: string
          id_externo_igdb: string | null
          idiomas: string[] | null
          link_wikipedia: string | null
          nota_metacritic: number | null
          numero_jogadores: string | null
          possui_online: boolean | null
          publicadora_id: string | null
          serie_id: string | null
          subgenero_id: string | null
          tempo_medio_jogo: number | null
          thumb_url: string | null
          titulo: string
          titulo_alternativo: string | null
          user_id: string
        }
        Insert: {
          ano_lancamento?: number | null
          capa_url?: string | null
          classificacao_indicativa?: string | null
          created_at?: string
          descricao?: string | null
          desenvolvedora_id?: string | null
          genero_id?: string | null
          id?: string
          id_externo_igdb?: string | null
          idiomas?: string[] | null
          link_wikipedia?: string | null
          nota_metacritic?: number | null
          numero_jogadores?: string | null
          possui_online?: boolean | null
          publicadora_id?: string | null
          serie_id?: string | null
          subgenero_id?: string | null
          tempo_medio_jogo?: number | null
          thumb_url?: string | null
          titulo: string
          titulo_alternativo?: string | null
          user_id: string
        }
        Update: {
          ano_lancamento?: number | null
          capa_url?: string | null
          classificacao_indicativa?: string | null
          created_at?: string
          descricao?: string | null
          desenvolvedora_id?: string | null
          genero_id?: string | null
          id?: string
          id_externo_igdb?: string | null
          idiomas?: string[] | null
          link_wikipedia?: string | null
          nota_metacritic?: number | null
          numero_jogadores?: string | null
          possui_online?: boolean | null
          publicadora_id?: string | null
          serie_id?: string | null
          subgenero_id?: string | null
          tempo_medio_jogo?: number | null
          thumb_url?: string | null
          titulo?: string
          titulo_alternativo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jogos_desenvolvedora_id_fkey"
            columns: ["desenvolvedora_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jogos_genero_id_fkey"
            columns: ["genero_id"]
            isOneToOne: false
            referencedRelation: "generos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jogos_publicadora_id_fkey"
            columns: ["publicadora_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jogos_serie_id_fkey"
            columns: ["serie_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jogos_subgenero_id_fkey"
            columns: ["subgenero_id"]
            isOneToOne: false
            referencedRelation: "subgeneros"
            referencedColumns: ["id"]
          },
        ]
      }
      links_compra: {
        Row: {
          created_at: string
          data_verificacao: string
          disponibilidade: boolean | null
          frete: number | null
          id: string
          item_id: string | null
          jogo_id: string | null
          loja_id: string | null
          preco: number
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_verificacao?: string
          disponibilidade?: boolean | null
          frete?: number | null
          id?: string
          item_id?: string | null
          jogo_id?: string | null
          loja_id?: string | null
          preco: number
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_verificacao?: string
          disponibilidade?: boolean | null
          frete?: number | null
          id?: string
          item_id?: string | null
          jogo_id?: string | null
          loja_id?: string | null
          preco?: number
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_compra_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_compra_jogo_id_fkey"
            columns: ["jogo_id"]
            isOneToOne: false
            referencedRelation: "jogos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_compra_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      lojas: {
        Row: {
          created_at: string
          id: string
          nome: string
          tipo: string | null
          url_base: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          tipo?: string | null
          url_base?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          tipo?: string | null
          url_base?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plataformas: {
        Row: {
          ano_lancamento: number | null
          created_at: string
          fabricante: string | null
          geracao: number | null
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          ano_lancamento?: number | null
          created_at?: string
          fabricante?: string | null
          geracao?: number | null
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          ano_lancamento?: number | null
          created_at?: string
          fabricante?: string | null
          geracao?: number | null
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      series: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      subgeneros: {
        Row: {
          created_at: string
          genero_id: string | null
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          created_at?: string
          genero_id?: string | null
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          created_at?: string
          genero_id?: string | null
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subgeneros_genero_id_fkey"
            columns: ["genero_id"]
            isOneToOne: false
            referencedRelation: "generos"
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
