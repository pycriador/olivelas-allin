import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type AccountStatus = Database["public"]["Enums"]["account_status"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type CatalogVersion = Database["public"]["Tables"]["catalog_versions"]["Row"];

export interface AccountMember {
  profile: Profile;
  roles: AppRole[];
}

export const ROLE_LABEL: Record<AppRole, string> = {
  administrador: "Administrador",
  estoque: "Estoque",
  financeiro: "Financeiro",
  consulta: "Consulta",
};

export const STATUS_LABEL: Record<AccountStatus, string> = {
  pendente: "Pendente de aprovação",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

export const ROLE_OPTIONS: AppRole[] = ["administrador", "estoque", "financeiro", "consulta"];
