/**
 * Appointment repository — all database access for the module.
 * Audit rows are system-owned, so they are written with the service client.
 */
type Db = { from: (table: string) => any };

export const APPOINTMENT_SELECT = `
  *,
  clients:client_id ( full_name ),
  professionals:professional_id ( full_name ),
  appointment_types:service_type_id ( name ),
  locations:location_id ( name )
`;

export function flatten(row: any) {
  const { clients, professionals, appointment_types, locations, ...rest } = row ?? {};
  return {
    ...rest,
    client_name: clients?.full_name ?? null,
    professional_name: professionals?.full_name ?? null,
    service_type_name: appointment_types?.name ?? null,
    location_name: locations?.name ?? null,
  };
}

export async function getAppointment(supabase: Db, id: string) {
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("appointment_not_found");
  return flatten(data);
}

export async function getHistory(supabase: Db, appointmentId: string) {
  const { data, error } = await supabase
    .from("appointment_status_history")
    .select("*")
    .eq("appointment_id", appointmentId)
    .order("changed_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Writes an audit trail entry (service role; never blocks the operation). */
export async function audit(input: {
  tenantId: string;
  appointmentId: string | null;
  action: string;
  userId: string | null;
  previous?: unknown;
  next?: unknown;
  source?: string;
}): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("appointment_audit_logs").insert({
      tenant_id: input.tenantId,
      appointment_id: input.appointmentId,
      action: input.action,
      user_id: input.userId,
      source: (input.source ?? "manual") as never,
      previous_data: (input.previous ?? null) as never,
      new_data: (input.next ?? null) as never,
    });
  } catch (err) {
    console.error("appointment audit failed", err);
  }
}

/** Frees temporary holds whose timer has elapsed. */
export async function releaseExpiredReservations(tenantId: string): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("appointments")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("status", "reserved")
      .lt("reserved_until", new Date().toISOString());
  } catch (err) {
    console.error("reservation cleanup failed", err);
  }
}
