// Spec + document orchestration.
import { specificationRepo, documentRepo, activityRepo, templateRepo } from "@/repositories";
import { uid } from "@/lib/id";
import { requirePermission, currentActor } from "./guard";
import { versionService } from "./version.service";
import { auditService } from "./audit.service";
import { AuditEvent } from "@/types/iam";
import {
  BlockType,
  SpecStatus,
  type Block,
  type DocumentEntity,
  type Specification,
  type SpecType,
} from "@/types/domain";


async function log(action: string, id: string, summary: string) {
  await activityRepo.put({
    id: uid(),
    at: Date.now(),
    actor: "you",
    action,
    targetType: "spec",
    targetId: id,
    summary,
  });
}

export const specService = {
  async toggleFavorite(id: string): Promise<void> {
    const spec = await specificationRepo.byId(id);
    if (!spec) return;
    const updated: Specification = { ...spec, favorite: !spec.favorite, updatedAt: Date.now() };
    await specificationRepo.put(updated);
    await log(updated.favorite ? "favorited" : "unfavorited", id, `${updated.favorite ? "Favorited" : "Unfavorited"} "${spec.title}"`);
  },
  async softDelete(id: string): Promise<void> {
    await requirePermission("spec", "delete", id);
    const spec = await specificationRepo.byId(id);
    if (!spec) return;
    await specificationRepo.put({ ...spec, deleted: true, updatedAt: Date.now() });
    await log("deleted", id, `Moved "${spec.title}" to trash`);
  },
  async restore(id: string): Promise<void> {
    await requirePermission("spec", "update", id);
    const spec = await specificationRepo.byId(id);
    if (!spec) return;
    await specificationRepo.put({ ...spec, deleted: false, updatedAt: Date.now() });
    await log("restored", id, `Restored "${spec.title}"`);
  },
  async create(input: {
    deliveryId: string;
    title: string;
    description?: string;
    type: SpecType;
    tags?: string[];
    status?: SpecStatus;
    blocks?: Block[];
  }): Promise<Specification> {
    await requirePermission("spec", "create");
    const now = Date.now();
    const spec: Specification = {
      id: uid(),
      deliveryId: input.deliveryId,
      title: input.title,
      description: input.description,
      type: input.type,
      status: input.status ?? SpecStatus.Draft,
      version: 1,
      tags: input.tags ?? [],
      favorite: false,
      createdBy: "you",
      createdAt: now,
      updatedAt: now,
    };
    await specificationRepo.put(spec);
    const doc: DocumentEntity = {
      id: uid(),
      specificationId: spec.id,
      blocks: input.blocks ?? [
        { id: uid(), type: BlockType.Markdown, content: `# ${spec.title}\n\nDescribe the specification here.` },
      ],
    };
    await documentRepo.put(doc);
    await log("created", spec.id, `Created spec "${spec.title}"`);
    return spec;
  },
  async createFromTemplate(templateId: string, deliveryId: string, title?: string): Promise<Specification> {
    const tpl = await templateRepo.byId(templateId);
    if (!tpl) throw new Error("Template not found");
    const cloned: Block[] = tpl.blocks.map((b) => ({ ...b, id: uid() }));
    return this.create({
      deliveryId,
      title: title ?? `${tpl.name} draft`,
      type: tpl.type,
      blocks: cloned,
      description: tpl.description,
    });
  },
  async update(id: string, patch: Partial<Specification>): Promise<void> {
    await requirePermission("spec", "update", id);
    const spec = await specificationRepo.byId(id);
    if (!spec) return;
    const { title, description, type, status, tags, favorite, deleted } = patch;
    const safe: Partial<Specification> = {};
    if (title !== undefined) safe.title = title;
    if (description !== undefined) safe.description = description;
    if (type !== undefined) safe.type = type;
    if (status !== undefined) safe.status = status;
    if (tags !== undefined) safe.tags = tags;
    if (favorite !== undefined) safe.favorite = favorite;
    if (deleted !== undefined) safe.deleted = deleted;
    await specificationRepo.put({ ...spec, ...safe, updatedAt: Date.now() });
    await log("updated", id, `Updated "${spec.title}"`);
  },
  async getDocument(specId: string): Promise<DocumentEntity | undefined> {
    const all = await documentRepo.all();
    return all.find((d) => d.specificationId === specId);
  },
  async saveDocument(specId: string, blocks: Block[], comment?: string): Promise<void> {
    await requirePermission("spec", "update", specId);
    const existing = await this.getDocument(specId);
    if (existing) {
      await documentRepo.put({ ...existing, blocks });
    } else {
      await documentRepo.put({ id: uid(), specificationId: specId, blocks });
    }
    const spec = await specificationRepo.byId(specId);
    if (spec) {
      const nextVersion = spec.version + 1;
      await specificationRepo.put({ ...spec, updatedAt: Date.now(), version: nextVersion });
      const actor = currentActor();
      await versionService.snapshot({
        specificationId: specId,
        blocks,
        title: spec.title,
        version: nextVersion,
        authorName: actor.name,
        ...(actor.id ? { authorId: actor.id } : {}),
        ...(comment ? { comment } : {}),
      });
      await auditService.log({ event: AuditEvent.Update, entity: "spec", entityId: specId, detail: `saved v${nextVersion}` });
    }
  },

};
