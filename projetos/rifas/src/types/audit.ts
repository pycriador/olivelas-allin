import type { Json } from "@/integrations/supabase/types";
export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "STATUS_CHANGE"
  | "ROLE_CHANGE"
  | "UPLOAD"
  | "DOWNLOAD"
  | "DUPLICATE"
  | "ARCHIVE"
  | "PUBLISH"
  | "RESTORE"
  | "ERROR"
  | "RESERVATION_CREATED"
  | "RESERVATION_CANCELLED"
  | "RESERVATION_EXPIRED"
  | "RESERVATION_INVALID"
  | "ORDER_CREATED"
  | "ORDER_STATUS_CHANGED"
  | "ORDER_PAYMENT_CONFIRMED"
  | "ORDER_REFUNDED"
  | "ORDER_CANCELLED"
  | "ORDER_EXPIRED"
  | "ORDER_NUMBER_ADDED"
  | "ORDER_NUMBER_REMOVED"
  | "ORDER_NUMBER_SWAPPED"
  | "ORDER_NUMBER_IMPORTED"
  | "CUSTOMER_CREATED"
  | "CUSTOMER_UPDATED"
  | "CUSTOMER_DELETED"
  | "RECEIPT_UPLOADED"
  | "PLAN_CHANGE";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  LOGIN: "Login",
  LOGOUT: "Logout",
  CREATE: "Criação",
  UPDATE: "Edição",
  DELETE: "Exclusão",
  STATUS_CHANGE: "Alteração de status",
  ROLE_CHANGE: "Alteração de papel",
  UPLOAD: "Upload",
  DOWNLOAD: "Download",
  DUPLICATE: "Duplicação",
  ARCHIVE: "Arquivamento",
  PUBLISH: "Publicação",
  RESTORE: "Restauração",
  ERROR: "Erro crítico",
  RESERVATION_CREATED: "Reserva criada",
  RESERVATION_CANCELLED: "Reserva cancelada",
  RESERVATION_EXPIRED: "Reserva expirada",
  RESERVATION_INVALID: "Tentativa inválida",
  ORDER_CREATED: "Pedido criado",
  ORDER_STATUS_CHANGED: "Status do pedido alterado",
  ORDER_PAYMENT_CONFIRMED: "Pagamento confirmado",
  ORDER_REFUNDED: "Reembolso",
  ORDER_CANCELLED: "Pedido cancelado",
  ORDER_EXPIRED: "Pedido expirado",
  ORDER_NUMBER_ADDED: "Número adicionado ao pedido",
  ORDER_NUMBER_REMOVED: "Número removido do pedido",
  ORDER_NUMBER_SWAPPED: "Número trocado no pedido",
  ORDER_NUMBER_IMPORTED: "Números importados",
  CUSTOMER_CREATED: "Cliente criado",
  CUSTOMER_UPDATED: "Cliente atualizado",
  CUSTOMER_DELETED: "Cliente excluído",
  RECEIPT_UPLOADED: "Comprovante enviado",
  PLAN_CHANGE: "Plano alterado",
};

export type AuditEntity =
  | "profile"
  | "user_role"
  | "setting"
  | "storage_file"
  | "session"
  | "campaign"
  | "campaign_image"
  | "campaign_number"
  | "customer"
  | "order"
  | "order_item"
  | "order_receipt"
  | "app";

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  old_value: Json;
  new_value: Json;
  ip: string | null;
  user_agent: string | null;
  metadata: Json;
  created_at: string;
}

export interface AuditLogWithActor extends AuditLog {
  actor_name: string | null;
  actor_email: string | null;
}
