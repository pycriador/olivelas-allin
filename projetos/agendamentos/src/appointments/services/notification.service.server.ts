/**
 * NotificationService — abstract queue for future channels.
 * Sprint 4.0 only persists intents; no external provider is called.
 */
export type NotificationChannel = "email" | "whatsapp" | "sms" | "push";

export interface NotificationIntent {
  tenantId: string;
  appointmentId: string | null;
  clientId?: string | null;
  professionalId?: string | null;
  type: string;
  channel?: NotificationChannel;
  scheduledAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface NotificationProvider {
  channel: NotificationChannel;
  send(intent: NotificationIntent): Promise<void>;
}

const providers = new Map<NotificationChannel, NotificationProvider>();

/** Future sprints register real providers here (WhatsApp, e-mail, SMS...). */
export function registerProvider(provider: NotificationProvider): void {
  providers.set(provider.channel, provider);
}

export const NotificationService = {
  /** Queues an intent. Delivery happens once a provider is registered. */
  async enqueue(intent: NotificationIntent): Promise<void> {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("notifications").insert({
        tenant_id: intent.tenantId,
        appointment_id: intent.appointmentId,
        client_id: intent.clientId ?? null,
        professional_id: intent.professionalId ?? null,
        type: intent.type,
        channel: (intent.channel ?? "email") as never,
        status: "pending" as never,
        scheduled_at: intent.scheduledAt ?? null,
        metadata: (intent.metadata ?? {}) as never,
      });
    } catch (err) {
      console.error("notification enqueue failed", err);
    }
  },

  hasProvider(channel: NotificationChannel): boolean {
    return providers.has(channel);
  },
};
