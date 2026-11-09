import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface BookingPayload {
  date: string;
  professionalId: string;
  clientId?: string | null;
  appointmentTypeId?: string | null;
  startsAt: string;
  endsAt: string;
  title?: string;
  description?: string | null;
  modality?: "online" | "in_person" | "any";
  allowOverbooking?: boolean;
}

function normalize(input: BookingPayload) {
  if (!input?.professionalId) throw new Error("Profissional obrigatório.");
  if (!input?.startsAt || !input?.endsAt) throw new Error("Horário obrigatório.");
  return {
    date: input.date ?? input.startsAt.slice(0, 10),
    professionalId: String(input.professionalId),
    clientId: input.clientId ?? null,
    appointmentTypeId: input.appointmentTypeId ?? null,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    title: String(input.title ?? "").trim().slice(0, 200) || "Atendimento",
    description: (input.description ?? null)?.toString().slice(0, 2000) ?? null,
    modality: input.modality ?? "any",
    allowOverbooking: Boolean(input.allowOverbooking),
  };
}

/** Dry-run: runs the engine rules against a chosen slot. */
export const validateBookingFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(normalize)
  .handler(async ({ data, context }) => {
    const { tenantOf, validateBooking } = await import("./booking.server");
    const tenantId = await tenantOf(context.supabase, context.userId);
    return validateBooking(context.supabase, tenantId, data);
  });

/** Creates the appointment after re-validating conflicts server-side. */
export const bookAppointmentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(normalize)
  .handler(async ({ data, context }) => {
    const { tenantOf, createBooking } = await import("./booking.server");
    const tenantId = await tenantOf(context.supabase, context.userId);
    try {
      const result = await createBooking(context.supabase, tenantId, context.userId, data);
      return { ok: true as const, ...result };
    } catch (e) {
      const validation = (e as any)?.validation;
      if (validation) return { ok: false as const, eventId: null, validation };
      throw e;
    }
  });
