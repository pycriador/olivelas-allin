export const STATUS_BADGE_CLASSES: Record<string, string> = {
  AVAILABLE: "border-transparent bg-success text-success-foreground",
  RESERVED: "border-transparent bg-warning text-warning-foreground",
  PENDING_PAYMENT: "border-transparent bg-blue-500 text-white",
  PAID: "border-transparent bg-primary text-primary-foreground",
  BLOCKED: "text-muted-foreground",
  CANCELLED: "border-transparent bg-destructive text-destructive-foreground",
  WINNER: "border-transparent bg-amber-500 text-white",
};

export const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Disponível",
  RESERVED: "Reservado",
  PENDING_PAYMENT: "Pendente",
  PAID: "Pago",
  BLOCKED: "Bloqueado",
  CANCELLED: "Cancelado",
  WINNER: "Premiado",
};
