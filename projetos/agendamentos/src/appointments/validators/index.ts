/** Appointment Management — input validation (client + server share these). */
import { z } from "zod";

const uuid = z.string().uuid();
const iso = z.string().min(10).max(40);

export const reserveSchema = z.object({
  clientId: uuid.nullable().optional().default(null),
  professionalId: uuid,
  serviceTypeId: uuid.nullable().optional().default(null),
  locationId: uuid.nullable().optional().default(null),
  startAt: iso,
  endAt: iso,
  date: z.string().length(10),
  modality: z.enum(["in_person", "online", "hybrid"]).default("in_person"),
  bookingType: z.enum(["regular", "fit_in"]).default("regular"),
  title: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).nullable().optional().default(null),
  allowRuleViolation: z.boolean().optional().default(false),
});
export type ReserveInput = z.infer<typeof reserveSchema>;

export const confirmSchema = z.object({
  appointmentId: uuid,
  createMeet: z.boolean().optional().default(false),
  notes: z.string().trim().max(2000).nullable().optional().default(null),
});
export type ConfirmInput = z.infer<typeof confirmSchema>;

export const cancelSchema = z.object({
  appointmentId: uuid,
  reason: z.enum([
    "client_request",
    "professional_request",
    "conflict",
    "illness",
    "holiday",
    "emergency",
    "other",
  ]),
  notes: z.string().trim().max(2000).nullable().optional().default(null),
});
export type CancelInput = z.infer<typeof cancelSchema>;

export const rescheduleSchema = z.object({
  appointmentId: uuid,
  professionalId: uuid,
  date: z.string().length(10),
  startAt: iso,
  endAt: iso,
  allowRuleViolation: z.boolean().optional().default(false),
  notes: z.string().trim().max(2000).nullable().optional().default(null),
});
export type RescheduleInput = z.infer<typeof rescheduleSchema>;

export const noShowSchema = z.object({
  appointmentId: uuid,
  party: z.enum(["client", "professional", "both"]),
  notes: z.string().trim().max(2000).nullable().optional().default(null),
});
export type NoShowInput = z.infer<typeof noShowSchema>;

export const transitionSchema = z.object({
  appointmentId: uuid,
  action: z.enum(["start", "complete", "release"]),
});
export type TransitionInput = z.infer<typeof transitionSchema>;

export const listSchema = z.object({
  from: z.string().length(10),
  to: z.string().length(10),
  professionalId: uuid.nullable().optional().default(null),
  clientId: uuid.nullable().optional().default(null),
  status: z.string().nullable().optional().default(null),
  serviceTypeId: uuid.nullable().optional().default(null),
  modality: z.string().nullable().optional().default(null),
  locationId: uuid.nullable().optional().default(null),
  source: z.string().nullable().optional().default(null),
  limit: z.number().int().min(1).max(500).optional().default(200),
});
export type ListInput = z.infer<typeof listSchema>;

export const waitingListSchema = z.object({
  clientId: uuid,
  serviceTypeId: uuid.nullable().optional().default(null),
  preferredProfessionalId: uuid.nullable().optional().default(null),
  preferredDate: z.string().length(10).nullable().optional().default(null),
  preferredTimeStart: z.string().max(8).nullable().optional().default(null),
  preferredTimeEnd: z.string().max(8).nullable().optional().default(null),
  modality: z.enum(["in_person", "online", "hybrid"]).default("in_person"),
  priority: z.number().int().min(0).max(10).default(0),
  notes: z.string().trim().max(1000).nullable().optional().default(null),
});
export type WaitingListInput = z.infer<typeof waitingListSchema>;
