// Specification versioning: snapshot per save, restore and diff support.
import { specVersionRepo } from "@/repositories/iam";
import { specificationRepo, documentRepo } from "@/repositories";
import { uid } from "@/lib/id";
import { auditService } from "./audit.service";
import { AuditEvent, type SpecVersion } from "@/types/iam";
import type { Block } from "@/types/domain";

export function blocksToText(blocks: Block[]): string {
  return blocks
    .map((b) => `<!-- block:${b.type} -->\n${b.content}`)
    .join("\n\n");
}

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  left?: string;
  right?: string;
  leftNo?: number;
  rightNo?: number;
}

/** Simple LCS-based line diff — deterministic and dependency free. */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split("\n");
  const b = after.split("\n");
  const n = a.length;
  const m = b.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i]![j] = a[i] === b[j] ? (lcs[i + 1]![j + 1] as number) + 1 : Math.max(lcs[i + 1]![j] as number, lcs[i]![j + 1] as number);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  let ln = 1;
  let rn = 1;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: "unchanged", left: a[i], right: b[j], leftNo: ln++, rightNo: rn++ });
      i++;
      j++;
    } else if ((lcs[i + 1]![j] as number) >= (lcs[i]![j + 1] as number)) {
      out.push({ type: "removed", left: a[i], leftNo: ln++ });
      i++;
    } else {
      out.push({ type: "added", right: b[j], rightNo: rn++ });
      j++;
    }
  }
  while (i < n) out.push({ type: "removed", left: a[i++], leftNo: ln++ });
  while (j < m) out.push({ type: "added", right: b[j++], rightNo: rn++ });
  return out;
}

export const versionService = {
  list: (specId: string) => specVersionRepo.bySpec(specId),
  byId: (id: string) => specVersionRepo.byId(id),

  async snapshot(input: {
    specificationId: string;
    blocks: Block[];
    title: string;
    version: number;
    authorId?: string;
    authorName: string;
    comment?: string;
  }): Promise<SpecVersion> {
    const row: SpecVersion = {
      id: uid(),
      specificationId: input.specificationId,
      version: input.version,
      blocks: input.blocks.map((b) => ({ ...b })),
      title: input.title,
      authorName: input.authorName,
      createdAt: Date.now(),
      ...(input.authorId ? { authorId: input.authorId } : {}),
      ...(input.comment ? { comment: input.comment } : {}),
    };
    await specVersionRepo.put(row);
    await auditService.log({
      event: AuditEvent.Version,
      entity: "spec",
      entityId: input.specificationId,
      detail: `v${input.version}`,
    });
    return row;
  },

  async restore(versionId: string, actor: { id?: string; name: string }): Promise<void> {
    const version = await specVersionRepo.byId(versionId);
    if (!version) throw new Error("Version not found");
    const spec = await specificationRepo.byId(version.specificationId);
    if (!spec) throw new Error("Specification not found");

    const docs = await documentRepo.all();
    const doc = docs.find((d) => d.specificationId === spec.id);
    const nextVersion = spec.version + 1;

    if (doc) await documentRepo.put({ ...doc, blocks: version.blocks });
    else await documentRepo.put({ id: uid(), specificationId: spec.id, blocks: version.blocks });

    await specificationRepo.put({ ...spec, title: version.title, version: nextVersion, updatedAt: Date.now() });
    await this.snapshot({
      specificationId: spec.id,
      blocks: version.blocks,
      title: version.title,
      version: nextVersion,
      authorName: actor.name,
      ...(actor.id ? { authorId: actor.id } : {}),
      comment: `Restored from v${version.version}`,
    });
    await auditService.log({
      event: AuditEvent.Restore,
      entity: "spec",
      entityId: spec.id,
      detail: `restored v${version.version} as v${nextVersion}`,
    });
  },

  async diff(leftId: string, rightId: string): Promise<DiffLine[]> {
    const [l, r] = await Promise.all([specVersionRepo.byId(leftId), specVersionRepo.byId(rightId)]);
    if (!l || !r) throw new Error("Version not found");
    return diffLines(blocksToText(l.blocks), blocksToText(r.blocks));
  },
};
