import type { RoleCode } from "@/types/profile";
import type { PaymentGateway } from "@/types/payment";

// Re-export role labels — backward compat: includes old "USER" label
export const ROLE_LABELS: Record<string, string> = {
  GLOBAL_ADMIN: "Global Admin",
  ADMIN: "Administrador",
  PUBLISHER: "Criador",
  USER: "Usuário",
};

export const PERMISSIONS = [
  "dashboard.view",
  "users.view",
  "users.view_all",
  "users.create",
  "users.edit",
  "users.update",
  "users.delete",
  "users.change_role",
  "users.change_status",
  "campaigns.view",
  "campaigns.manage",
  "campaigns.publish",
  "files.view",
  "files.view_all",
  "files.upload",
  "files.delete",
  "audit.view",
  "audit.view_all",
  "settings.view",
  "settings.edit",
  "reports.view",
  "reports.customer.view",
  "reports.payment.view",
  "reports.campaign.view",
  "reports.finance.view",
  "reports.orders.view",
  "customers.view",
  "customers.all",
  "customers.edit",
  "customers.delete",
  "orders.view",
  "notifications.view",
  "payments.view",
  "payments.manage",
  "payments.gateways.infinitypay.view",
  "payments.gateways.infinitypay.manage",
  "payments.gateways.mercado_pago.view",
  "payments.gateways.mercado_pago.manage",
  "payments.gateways.pagbank.view",
  "payments.gateways.pagbank.manage",
  "payments.gateways.advanced_fee.view",
  "payments.gateways.advanced_fee.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type GatewayPermissionAction = "view" | "manage";

/** Permissao de um gateway especifico: payments.gateways.<gateway>.<action> */
export function gatewayPermission(
  gateway: PaymentGateway,
  action: GatewayPermissionAction,
): Permission {
  return `payments.gateways.${gateway.toLowerCase()}.${action}` as Permission;
}

/** Todas as permissoes de gateway existentes no catalogo. */
export const ALL_GATEWAY_PERMISSIONS: readonly Permission[] = PERMISSIONS.filter((permission) =>
  permission.startsWith("payments.gateways."),
);

const PUBLISHER_PERMISSIONS: readonly Permission[] = [
  "dashboard.view",
  "users.view",
  "campaigns.view",
  "campaigns.manage",
  "campaigns.publish",
  "files.view",
  "files.upload",
  "files.delete",
  "audit.view",
  "settings.view",
  "customers.view",
  "customers.all",
  "customers.edit",
  "customers.delete",
  "orders.view",
];

const ADMIN_PERMISSIONS: readonly Permission[] = [
  "dashboard.view",
  "users.view",
  "users.create",
  "users.edit",
  "users.update",
  "users.delete",
  "users.change_role",
  "users.change_status",
  "campaigns.view",
  "campaigns.manage",
  "campaigns.publish",
  "files.view",
  "files.view_all",
  "files.upload",
  "files.delete",
  "audit.view",
  "audit.view_all",
  "settings.view",
  "settings.edit",
  "reports.view",
  "reports.customer.view",
  "reports.payment.view",
  "reports.campaign.view",
  "reports.finance.view",
  "reports.orders.view",
  "customers.view",
  "customers.all",
  "customers.edit",
  "customers.delete",
  "orders.view",
  "notifications.view",
  "payments.view",
  "payments.manage",
  ...ALL_GATEWAY_PERMISSIONS,
];

const GLOBAL_ADMIN_PERMISSIONS: readonly Permission[] = PERMISSIONS;

export const ROLE_PERMISSIONS: Record<RoleCode, readonly Permission[]> = {
  GLOBAL_ADMIN: GLOBAL_ADMIN_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  PUBLISHER: PUBLISHER_PERMISSIONS,
};

export function roleHasPermission(role: RoleCode | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function roleHasAnyPermission(
  role: RoleCode | null,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((permission) => roleHasPermission(role, permission));
}
