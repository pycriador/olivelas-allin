// Audit logging service. UI-independent; every service writes through here.
import { auditRepo } from "@/repositories/iam";
import { uid } from "@/lib/id";
import type { AuditLog } from "@/types/iam";

let currentActor: { id?: string; name: string } = { name: "system" };

export function setAuditActor(actor: { id?: string; name: string } | null) {
  currentActor = actor ?? { name: "anonymous" };
}

function localIp(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.location.hostname;
}

export interface AuditInput {
  event: string;
  entity: string;
  entityId?: string;
  result?: "success" | "failure";
  durationMs?: number;
  detail?: string;
  userId?: string;
  userName?: string;
}

export const auditService = {
  async log(input: AuditInput): Promise<void> {
    const entry: AuditLog = {
      id: uid(),
      at: Date.now(),
      event: input.event,
      entity: input.entity,
      result: input.result ?? "success",
      durationMs: input.durationMs ?? 0,
      userName: input.userName ?? currentActor.name,
      ...(input.entityId ? { entityId: input.entityId } : {}),
      ...(input.userId ?? currentActor.id ? { userId: input.userId ?? currentActor.id } : {}),
      ...(input.detail ? { detail: input.detail } : {}),
      ...(localIp() ? { ip: localIp() } : {}),
    };
    await auditRepo.put(entry);
  },

  /** Times an operation and records the outcome. */
  async track<T>(input: Omit<AuditInput, "result" | "durationMs">, fn: () => Promise<T>): Promise<T> {
    const started = performance.now();
    try {
      const out = await fn();
      await this.log({ ...input, result: "success", durationMs: Math.round(performance.now() - started) });
      return out;
    } catch (e) {
      await this.log({
        ...input,
        result: "failure",
        durationMs: Math.round(performance.now() - started),
        detail: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
  },

  list: (limit = 200) => auditRepo.recent(limit),
  purgeOlderThanDays: (days: number) => auditRepo.purgeOlderThan(Date.now() - days * 86_400_000),
};
