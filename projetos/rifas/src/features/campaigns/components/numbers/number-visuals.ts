import type { NumberGridStatus } from "@/types/campaign-number";

export const NUMBER_STATUS_CLASSES: Record<NumberGridStatus, string> = {
  AVAILABLE:
    "border-border bg-muted/60 text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-foreground",
  RESERVED: "border-yellow-500/60 bg-yellow-500/20 text-yellow-800",
  PENDING_PAYMENT: "border-blue-500/60 bg-blue-500/20 text-blue-800",
  PAID: "border-green-500/60 bg-green-500/20 text-green-800",
  BLOCKED: "border-neutral-700 bg-neutral-800 text-neutral-200",
  CANCELLED: "border-red-500/60 bg-red-500/20 text-red-800",
  WINNER: "border-amber-400/70 bg-amber-400/30 text-amber-800",
};

export const NUMBER_STATUS_DOT_CLASSES: Record<NumberGridStatus, string> = {
  AVAILABLE: "bg-muted-foreground",
  RESERVED: "bg-yellow-500",
  PENDING_PAYMENT: "bg-blue-500",
  PAID: "bg-green-500",
  BLOCKED: "bg-neutral-800",
  CANCELLED: "bg-red-500",
  WINNER: "bg-amber-400",
};
