// Encrypted .specforge backup export/import (full and incremental).
import {
  workspaceRepo,
  projectRepo,
  roadmapRepo,
  sprintRepo,
  deliveryRepo,
  specificationRepo,
  documentRepo,
  templateRepo,
  tagRepo,
  activityRepo,
  snippetRepo,
  metaRepo,
} from "@/repositories";
import { userRepo, groupRepo, roleRepo, membershipRepo, aclRepo, auditRepo, specVersionRepo } from "@/repositories/iam";
import { encryptBackup, decryptBackup, isValidEnvelope, type BackupEnvelope } from "@/lib/backup-crypto";
import { auditService } from "./audit.service";
import { AuditEvent } from "@/types/iam";

const LAST_BACKUP_KEY = "backup:lastAt";

export interface BackupPayload {
  exportedAt: number;
  incremental: boolean;
  since?: number;
  data: {
    workspaces: unknown[];
    projects: unknown[];
    roadmaps: unknown[];
    sprints: unknown[];
    deliveries: unknown[];
    specifications: unknown[];
    documents: unknown[];
    specVersions: unknown[];
    templates: unknown[];
    tags: unknown[];
    snippets: unknown[];
    activities: unknown[];
    users: unknown[];
    groups: unknown[];
    roles: unknown[];
    memberships: unknown[];
    acl: unknown[];
    auditLogs: unknown[];
  };
}

const REQUIRED_KEYS: Array<keyof BackupPayload["data"]> = [
  "workspaces",
  "projects",
  "specifications",
  "documents",
  "users",
  "roles",
];

function since<T extends Record<string, unknown>>(rows: T[], ts: number | undefined, fields: string[]): T[] {
  if (!ts) return rows;
  return rows.filter((r) => fields.some((f) => typeof r[f] === "number" && (r[f] as number) > ts));
}

export const backupService = {
  async lastBackupAt(): Promise<number | undefined> {
    const row = await metaRepo.get(LAST_BACKUP_KEY);
    return row ? Number(row.value) : undefined;
  },

  async collect(incremental: boolean): Promise<BackupPayload> {
    const from = incremental ? await this.lastBackupAt() : undefined;
    const [
      workspaces, projects, roadmaps, sprints, deliveries, specifications, documents,
      specVersions, templates, tags, snippets, activities, users, groups, roles,
      memberships, acl, auditLogs,
    ] = await Promise.all([
      workspaceRepo.all(), projectRepo.all(), roadmapRepo.all(), sprintRepo.all(),
      deliveryRepo.all(), specificationRepo.all(), documentRepo.all(), specVersionRepo.all(),
      templateRepo.all(), tagRepo.all(), snippetRepo.all(), activityRepo.all(),
      userRepo.all(), groupRepo.all(), roleRepo.all(), membershipRepo.all(), aclRepo.all(),
      auditRepo.all(),
    ]);

    return {
      exportedAt: Date.now(),
      incremental,
      ...(from ? { since: from } : {}),
      data: {
        workspaces: since(workspaces as never, from, ["updatedAt"]),
        projects: since(projects as never, from, ["updatedAt"]),
        roadmaps,
        sprints,
        deliveries,
        specifications: since(specifications as never, from, ["updatedAt"]),
        documents,
        specVersions: since(specVersions as never, from, ["createdAt"]),
        templates,
        tags,
        snippets: since(snippets as never, from, ["updatedAt"]),
        activities: since(activities as never, from, ["at"]),
        users: since(users as never, from, ["updatedAt"]),
        groups,
        roles,
        memberships,
        acl,
        auditLogs: since(auditLogs as never, from, ["at"]),
      },
    };
  },

  async exportEncrypted(masterPassword: string, incremental = false): Promise<Blob> {
    if (masterPassword.length < 8) throw new Error("Master password must be at least 8 characters");
    const payload = await this.collect(incremental);
    const envelope = await encryptBackup(payload, masterPassword, {
      incremental,
      ...(payload.since ? { since: payload.since } : {}),
    });
    await metaRepo.set(LAST_BACKUP_KEY, String(payload.exportedAt));
    await auditService.log({
      event: AuditEvent.Export,
      entity: "backup",
      detail: incremental ? "incremental" : "full",
    });
    return new Blob([JSON.stringify(envelope)], { type: "application/octet-stream" });
  },

  validateEnvelope: isValidEnvelope,

  async importEncrypted(fileText: string, masterPassword: string): Promise<{ restored: number }> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(fileText) as BackupEnvelope;
    } catch {
      throw new Error("Not a valid .specforge file");
    }
    const payload = await decryptBackup<BackupPayload>(parsed, masterPassword);
    if (!payload?.data || REQUIRED_KEYS.some((k) => !Array.isArray(payload.data[k]))) {
      throw new Error("Backup structure is invalid — import aborted");
    }

    const d = payload.data;
    let restored = 0;
    const put = async (fn: (rows: never[]) => Promise<unknown>, rows: unknown[]) => {
      if (!Array.isArray(rows) || rows.length === 0) return;
      await fn(rows as never[]);
      restored += rows.length;
    };

    await put((r) => workspaceRepo.bulkPut(r), d.workspaces);
    await put((r) => projectRepo.bulkPut(r), d.projects);
    await put((r) => roadmapRepo.bulkPut(r), d.roadmaps);
    await put((r) => sprintRepo.bulkPut(r), d.sprints);
    await put((r) => deliveryRepo.bulkPut(r), d.deliveries);
    await put((r) => specificationRepo.bulkPut(r), d.specifications);
    await put((r) => documentRepo.bulkPut(r), d.documents);
    await put((r) => specVersionRepo.bulkPut(r), d.specVersions ?? []);
    await put((r) => templateRepo.bulkPut(r), d.templates);
    await put((r) => tagRepo.bulkPut(r), d.tags);
    await put((r) => snippetRepo.bulkPut(r), d.snippets ?? []);
    await put((r) => activityRepo.bulkPut(r), d.activities ?? []);
    await put((r) => roleRepo.bulkPut(r), d.roles);
    await put((r) => groupRepo.bulkPut(r), d.groups ?? []);
    await put((r) => userRepo.bulkPut(r), d.users);
    await put((r) => membershipRepo.bulkPut(r), d.memberships ?? []);
    await put((r) => aclRepo.bulkPut(r), d.acl ?? []);
    await put((r) => auditRepo.bulkPut(r), d.auditLogs ?? []);

    await auditService.log({ event: AuditEvent.Import, entity: "backup", detail: `${restored} records` });
    return { restored };
  },

  /** Database integrity / corruption check. */
  async healthCheck() {
    const started = performance.now();
    const [specs, docs, deliveries, sprints, projects, users, roles] = await Promise.all([
      specificationRepo.all(),
      documentRepo.all(),
      deliveryRepo.all(),
      sprintRepo.all(),
      projectRepo.all(),
      userRepo.all(),
      roleRepo.all(),
    ]);
    const issues: string[] = [];
    const deliveryIds = new Set(deliveries.map((d) => d.id));
    const sprintIds = new Set(sprints.map((s) => s.id));
    const specIds = new Set(specs.map((s) => s.id));
    const roleIds = new Set(roles.map((r) => r.id));

    specs.filter((s) => !deliveryIds.has(s.deliveryId)).forEach((s) => issues.push(`Spec "${s.title}" points to a missing delivery`));
    deliveries.filter((d) => !sprintIds.has(d.sprintId)).forEach((d) => issues.push(`Delivery "${d.title}" points to a missing sprint`));
    docs.filter((d) => !specIds.has(d.specificationId)).forEach(() => issues.push("Orphan document found"));
    users.filter((u) => !roleIds.has(u.roleId)).forEach((u) => issues.push(`User ${u.email} has an unknown role`));
    if (users.length === 0) issues.push("No users registered");

    const result = {
      ok: issues.length === 0,
      issues,
      counts: {
        projects: projects.length,
        specs: specs.length,
        documents: docs.length,
        users: users.length,
      },
      durationMs: Math.round(performance.now() - started),
    };
    await auditService.log({
      event: AuditEvent.HealthCheck,
      entity: "database",
      result: result.ok ? "success" : "failure",
      durationMs: result.durationMs,
      detail: issues.slice(0, 3).join("; "),
    });
    return result;
  },

  async storageEstimate(): Promise<{ usage: number; quota: number }> {
    if (typeof navigator === "undefined" || !navigator.storage?.estimate) return { usage: 0, quota: 0 };
    const e = await navigator.storage.estimate();
    return { usage: e.usage ?? 0, quota: e.quota ?? 0 };
  },
};
