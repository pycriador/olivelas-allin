/** Appointment Management — client-callable server functions. */
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  cancelSchema,
  confirmSchema,
  listSchema,
  noShowSchema,
  reserveSchema,
  rescheduleSchema,
  transitionSchema,
  waitingListSchema,
} from "../validators";
import { z } from "zod";

const idSchema = z.object({ appointmentId: z.string().uuid() });
const summarySchema = z.object({
  clientId: z.string().uuid().nullable().optional().default(null),
  professionalId: z.string().uuid().nullable().optional().default(null),
});
const waitingStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["waiting", "contacted", "scheduled", "cancelled"]),
});

export const reserveSlotFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => reserveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const svc = await import("./appointments.server");
    const tenantId = await svc.tenantOf(context.supabase, context.userId);
    return svc.reserveSlot(context.supabase, tenantId, context.userId, data);
  });

export const confirmAppointmentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => confirmSchema.parse(input))
  .handler(async ({ data, context }) => {
    const svc = await import("./appointments.server");
    const tenantId = await svc.tenantOf(context.supabase, context.userId);
    return svc.confirmAppointment(context.supabase, tenantId, context.userId, data);
  });

export const cancelAppointmentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => cancelSchema.parse(input))
  .handler(async ({ data, context }) => {
    const svc = await import("./appointments.server");
    const tenantId = await svc.tenantOf(context.supabase, context.userId);
    return svc.cancelAppointment(context.supabase, tenantId, context.userId, data);
  });

export const rescheduleAppointmentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => rescheduleSchema.parse(input))
  .handler(async ({ data, context }) => {
    const svc = await import("./appointments.server");
    const tenantId = await svc.tenantOf(context.supabase, context.userId);
    return svc.rescheduleAppointment(context.supabase, tenantId, context.userId, data);
  });

export const markNoShowFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => noShowSchema.parse(input))
  .handler(async ({ data, context }) => {
    const svc = await import("./appointments.server");
    const tenantId = await svc.tenantOf(context.supabase, context.userId);
    return svc.markNoShow(context.supabase, tenantId, context.userId, data);
  });

export const transitionAppointmentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => transitionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const svc = await import("./appointments.server");
    const tenantId = await svc.tenantOf(context.supabase, context.userId);
    return svc.transitionAppointment(context.supabase, tenantId, context.userId, data);
  });

export const retrySyncFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const svc = await import("./appointments.server");
    const tenantId = await svc.tenantOf(context.supabase, context.userId);
    return svc.retrySync(context.supabase, tenantId, context.userId, data.appointmentId);
  });

export const listAppointmentsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listSchema.parse(input))
  .handler(async ({ data, context }) => {
    const svc = await import("./appointments.server");
    const tenantId = await svc.tenantOf(context.supabase, context.userId);
    return svc.listAppointments(context.supabase, tenantId, data);
  });

export const appointmentDetailFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const svc = await import("./appointments.server");
    return svc.appointmentDetail(context.supabase, data.appointmentId);
  });

export const appointmentSummaryFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => summarySchema.parse(input))
  .handler(async ({ data, context }) => {
    const svc = await import("./appointments.server");
    const tenantId = await svc.tenantOf(context.supabase, context.userId);
    return svc.appointmentSummary(context.supabase, tenantId, data);
  });

export const addToWaitingListFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => waitingListSchema.parse(input))
  .handler(async ({ data, context }) => {
    const svc = await import("./appointments.server");
    const tenantId = await svc.tenantOf(context.supabase, context.userId);
    return svc.addToWaitingList(context.supabase, tenantId, context.userId, data);
  });

export const listWaitingListFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const svc = await import("./appointments.server");
    const tenantId = await svc.tenantOf(context.supabase, context.userId);
    return svc.listWaitingList(context.supabase, tenantId);
  });

export const updateWaitingListStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => waitingStatusSchema.parse(input))
  .handler(async ({ data, context }) => {
    const svc = await import("./appointments.server");
    const tenantId = await svc.tenantOf(context.supabase, context.userId);
    return svc.updateWaitingListStatus(
      context.supabase,
      tenantId,
      context.userId,
      data.id,
      data.status,
    );
  });
