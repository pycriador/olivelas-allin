import { gatewayPermission, type Permission } from "@/lib/permissions";
import { PAYMENT_GATEWAY_VALUES, type PaymentGateway } from "@/types/payment";

async function loadUserRoleId(userId: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.role_id ?? null;
}

/**
 * Exige que o usuario tenha PELO MENOS UMA das permissoes informadas.
 * GLOBAL_ADMIN passa sempre (como nas politicas de RLS existentes).
 */
export async function requireAnyPermission(
  userId: string,
  permissions: readonly string[],
): Promise<void> {
  if (permissions.length === 0) return;

  const roleId = await loadUserRoleId(userId);
  if (!roleId) throw new Error("Forbidden: usuario sem role");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: role }, { data: perms }] = await Promise.all([
    supabaseAdmin.from("roles").select("code").eq("id", roleId).maybeSingle(),
    supabaseAdmin.from("role_permissions").select("permission").eq("role_id", roleId),
  ]);

  if (role?.code === "GLOBAL_ADMIN") return;

  const granted = new Set((perms ?? []).map((row) => row.permission));
  const allowed = permissions.some((permission) => granted.has(permission));
  if (!allowed) throw new Error("Forbidden: permissao insuficiente");
}

export async function requirePermission(
  userId: string,
  permission: Permission | string,
): Promise<void> {
  await requireAnyPermission(userId, [permission]);
}

/** Retorna o RoleCode do usuario (GLOBAL_ADMIN | ADMIN | PUBLISHER). */
export async function getUserRoleCode(userId: string): Promise<string | null> {
  const roleId = await loadUserRoleId(userId);
  if (!roleId) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: role } = await supabaseAdmin
    .from("roles")
    .select("code")
    .eq("id", roleId)
    .maybeSingle();
  return role?.code ?? null;
}

/** Exige que o usuario tenha o papel GLOBAL_ADMIN. */
export async function requireGlobalAdmin(userId: string): Promise<void> {
  const roleId = await loadUserRoleId(userId);
  if (!roleId) throw new Error("Forbidden: usuario sem role");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: role, error } = await supabaseAdmin
    .from("roles")
    .select("code")
    .eq("id", roleId)
    .maybeSingle();
  if (error) throw error;
  if (role?.code !== "GLOBAL_ADMIN") throw new Error("Forbidden: requer GLOBAL_ADMIN");
}

/** Acesso de leitura a um gateway: permissao do gateway (view/manage) ou payments.view. */
export async function requireGatewayView(userId: string, gateway: PaymentGateway): Promise<void> {
  await requireAnyPermission(userId, [
    gatewayPermission(gateway, "view"),
    gatewayPermission(gateway, "manage"),
    "payments.view",
  ]);
}

/** Gestao de um gateway: permissao de manage do gateway ou payments.manage (op global). */
export async function requireGatewayManage(userId: string, gateway: PaymentGateway): Promise<void> {
  await requireAnyPermission(userId, [gatewayPermission(gateway, "manage"), "payments.manage"]);
}

/** Qualquer acesso a area de pagamentos (ledger geral ou algum gateway). */
export async function requireAnyGatewayAccess(userId: string): Promise<void> {
  await requireAnyPermission(userId, [
    "payments.view",
    "payments.manage",
    ...PAYMENT_GATEWAY_VALUES.flatMap((gateway) => [
      gatewayPermission(gateway, "view"),
      gatewayPermission(gateway, "manage"),
    ]),
  ]);
}
