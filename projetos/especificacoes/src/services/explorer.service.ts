// Explorer orchestration: folders, documents, moves, relationships, history, search.
import { explorerRepo, relationRepo, historyRepo } from "@/repositories/explorer";
import { activityRepo, projectRepo } from "@/repositories";
import { uid } from "@/lib/id";
import { requirePermission, currentActor } from "./guard";
import { splitName } from "@/lib/file-types";
import { DOC_TEMPLATES } from "@/lib/explorer-templates";
import {
  DocumentStatus,
  type ChangeType,
  type DocumentHistoryEntry,
  type DocumentRelation,
  type ExplorerNode,
  type NodeKind,
  type RelationshipType,
  type TreeItem,
} from "@/types/explorer";

const DEFAULT_FOLDERS = ["Roadmap", "Especificações", "Código", "Diagramas", "APIs", "Prompts", "Assets"];

export class ConflictError extends Error {
  constructor(public serverNode: ExplorerNode) {
    super("Este documento foi alterado por outra sessão.");
    this.name = "ConflictError";
  }
}

function now() {
  return Date.now();
}

async function log(action: string, id: string, summary: string) {
  await activityRepo.put({
    id: uid(),
    at: now(),
    actor: currentActor().name,
    action,
    targetType: "project",
    targetId: id,
    summary,
  });
}

async function history(node: ExplorerNode, changeType: ChangeType, summary: string) {
  const actor = currentActor();
  const entry: DocumentHistoryEntry = {
    id: uid(),
    projectId: node.projectId,
    nodeId: node.id,
    version: 1,
    changeType,
    changedByName: actor.name,
    summary,
    changedAt: now(),
    ...(actor.id ? { changedBy: actor.id } : {}),
  };
  const previous = await historyRepo.byNode(node.id).catch(() => [] as DocumentHistoryEntry[]);
  entry.version = (previous[0]?.version ?? 0) + 1;
  await historyRepo.put(entry).catch(() => undefined);
}

function base(input: Partial<ExplorerNode> & { projectId: string; name: string; kind: NodeKind }): ExplorerNode {
  const t = now();
  const actor = currentActor();
  return {
    id: input.id ?? uid(),
    projectId: input.projectId,
    parentId: input.parentId ?? null,
    kind: input.kind,
    name: input.name,
    extension: input.extension,
    content: input.content ?? "",
    description: input.description,
    tags: input.tags ?? [],
    order: input.order ?? t,
    archived: input.archived ?? false,
    deleted: false,
    url: input.url,
    targetId: input.targetId,
    links: input.links ?? [],
    status: input.status ?? DocumentStatus.Draft,
    documentType: input.documentType,
    storagePath: input.storagePath,
    sizeBytes: input.sizeBytes,
    mimeType: input.mimeType,
    createdBy: input.createdBy ?? actor.id,
    updatedBy: actor.id,
    createdAt: t,
    updatedAt: t,
  };
}

export function buildTree(nodes: ExplorerNode[], opts?: { includeArchived?: boolean }): TreeItem[] {
  const visible = nodes.filter((n) => !n.deleted && (opts?.includeArchived || !n.archived));
  const byParent = new Map<string | null, ExplorerNode[]>();
  for (const n of visible) {
    const key = n.parentId ?? null;
    const arr = byParent.get(key) ?? [];
    arr.push(n);
    byParent.set(key, arr);
  }
  const sortFn = (a: ExplorerNode, b: ExplorerNode) => {
    if (a.kind === "folder" && b.kind !== "folder") return -1;
    if (b.kind === "folder" && a.kind !== "folder") return 1;
    if (a.order !== b.order) return a.order - b.order;
    return a.name.localeCompare(b.name);
  };
  const walk = (parentId: string | null, depth: number): TreeItem[] =>
    (byParent.get(parentId) ?? [])
      .slice()
      .sort(sortFn)
      .map((n) => ({ ...n, depth, children: walk(n.id, depth + 1) }));
  return walk(null, 0);
}

export function pathOf(nodes: ExplorerNode[], id: string): ExplorerNode[] {
  const map = new Map(nodes.map((n) => [n.id, n]));
  const out: ExplorerNode[] = [];
  let cur = map.get(id);
  let guard = 0;
  while (cur && guard++ < 100) {
    out.unshift(cur);
    cur = cur.parentId ? map.get(cur.parentId) : undefined;
  }
  return out;
}

export function pathString(nodes: ExplorerNode[], id: string): string {
  return `/${pathOf(nodes, id)
    .map((n) => (n.kind === "file" && n.extension ? `${n.name}.${n.extension}` : n.name))
    .join("/")}`;
}

function isDescendant(nodes: ExplorerNode[], candidateId: string, ancestorId: string): boolean {
  const map = new Map(nodes.map((n) => [n.id, n]));
  let cur = map.get(candidateId);
  let guard = 0;
  while (cur && guard++ < 100) {
    if (cur.id === ancestorId) return true;
    cur = cur.parentId ? map.get(cur.parentId) : undefined;
  }
  return false;
}

export const explorerService = {
  async ensureProjectTree(projectId: string): Promise<void> {
    const existing = await explorerRepo.byProject(projectId);
    if (existing.length > 0) return;
    const project = await projectRepo.byId(projectId);
    const rows: ExplorerNode[] = [];
    rows.push(
      base({
        projectId,
        kind: "file",
        name: "README",
        extension: "md",
        documentType: "readme",
        content: `# ${project?.name ?? "Projeto"}\n\n${project?.description ?? "Documentação do projeto."}\n`,
        order: 0,
        tags: ["docs"],
      }),
    );
    DEFAULT_FOLDERS.forEach((name, i) => {
      rows.push(base({ projectId, kind: "folder", name, order: i + 1 }));
    });
    await explorerRepo.bulkPut(rows);
  },

  async createFolder(projectId: string, parentId: string | null, name: string): Promise<ExplorerNode> {
    await requirePermission("project", "update", projectId);
    const node = base({ projectId, parentId, kind: "folder", name });
    await explorerRepo.put(node);
    await log("created", projectId, `Criou pasta "${name}"`);
    await history(node, "created", `Pasta "${name}" criada`);
    return node;
  },

  async createFile(input: {
    projectId: string;
    parentId: string | null;
    name: string;
    extension: string;
    content?: string;
    templateId?: string;
    description?: string;
    tags?: string[];
    status?: DocumentStatus;
    storagePath?: string;
    sizeBytes?: number;
    mimeType?: string;
  }): Promise<ExplorerNode> {
    await requirePermission("project", "update", input.projectId);
    const tpl = input.templateId ? DOC_TEMPLATES.find((t) => t.id === input.templateId) : undefined;
    const node = base({
      projectId: input.projectId,
      parentId: input.parentId,
      kind: "file",
      name: input.name,
      extension: input.extension,
      content: input.content ?? tpl?.content ?? "",
      description: input.description,
      tags: input.tags,
      status: input.status,
      documentType: input.templateId && input.templateId !== "blank" ? input.templateId : undefined,
      storagePath: input.storagePath,
      sizeBytes: input.sizeBytes,
      mimeType: input.mimeType,
    });
    await explorerRepo.put(node);
    await log("created", input.projectId, `Criou documento "${node.name}.${node.extension}"`);
    await history(node, "created", `Documento criado`);
    return node;
  },

  async createLink(projectId: string, parentId: string | null, name: string, url: string): Promise<ExplorerNode> {
    await requirePermission("project", "update", projectId);
    const node = base({ projectId, parentId, kind: "link", name, url });
    await explorerRepo.put(node);
    return node;
  },

  async createShortcut(targetId: string, parentId: string | null): Promise<ExplorerNode | undefined> {
    const target = await explorerRepo.byId(targetId);
    if (!target) return;
    await requirePermission("project", "update", target.projectId);
    const node = base({
      projectId: target.projectId,
      parentId,
      kind: "shortcut",
      name: `${target.name} (atalho)`,
      extension: target.extension,
      targetId,
    });
    await explorerRepo.put(node);
    return node;
  },

  async rename(id: string, fullName: string): Promise<void> {
    const node = await explorerRepo.byId(id);
    if (!node) return;
    await requirePermission("project", "update", node.projectId);
    const actor = currentActor();
    if (node.kind === "file") {
      const { name, extension } = splitName(fullName);
      await explorerRepo.put({ ...node, name, extension: extension ?? node.extension, updatedAt: now(), updatedBy: actor.id });
    } else {
      await explorerRepo.put({ ...node, name: fullName, updatedAt: now(), updatedBy: actor.id });
    }
    await history(node, "renamed", `Renomeado para "${fullName}"`);
  },

  async update(id: string, patch: Partial<ExplorerNode>): Promise<void> {
    const node = await explorerRepo.byId(id);
    if (!node) return;
    await requirePermission("project", "update", node.projectId);
    const safe: Partial<ExplorerNode> = {};
    for (const key of [
      "name",
      "extension",
      "content",
      "description",
      "tags",
      "links",
      "url",
      "order",
      "status",
      "documentType",
    ] as const) {
      if (patch[key] !== undefined) (safe as Record<string, unknown>)[key] = patch[key];
    }
    await explorerRepo.put({ ...node, ...safe, updatedAt: now(), updatedBy: currentActor().id });
    await history(node, "updated", "Metadados atualizados");
  },

  /**
   * Saves document content. When `expectedUpdatedAt` is provided and the server
   * copy is newer, a ConflictError is raised instead of overwriting silently.
   */
  async saveContent(id: string, content: string, expectedUpdatedAt?: number, force?: boolean): Promise<ExplorerNode> {
    const node = await explorerRepo.byId(id);
    if (!node) throw new Error("Documento não encontrado");
    await requirePermission("project", "update", node.projectId);
    if (!force && expectedUpdatedAt !== undefined && node.updatedAt > expectedUpdatedAt) {
      throw new ConflictError(node);
    }
    const updated: ExplorerNode = { ...node, content, updatedAt: now(), updatedBy: currentActor().id };
    await explorerRepo.put(updated);
    await history(node, "updated", "Conteúdo salvo");
    return updated;
  },

  async move(id: string, parentId: string | null, order?: number): Promise<void> {
    const node = await explorerRepo.byId(id);
    if (!node) return;
    await requirePermission("project", "update", node.projectId);
    if (parentId === id) throw new Error("Não é possível mover um item para dentro dele mesmo.");
    const all = await explorerRepo.byProject(node.projectId);
    if (parentId) {
      const parent = all.find((n) => n.id === parentId);
      if (!parent || parent.kind !== "folder") throw new Error("Destino inválido.");
      if (isDescendant(all, parentId, id)) throw new Error("Não é possível mover uma pasta para dentro dela mesma.");
    }
    await explorerRepo.put({ ...node, parentId, order: order ?? now(), updatedAt: now(), updatedBy: currentActor().id });
    await history(node, "moved", "Item movido");
  },

  async duplicate(id: string): Promise<void> {
    const node = await explorerRepo.byId(id);
    if (!node) return;
    await requirePermission("project", "update", node.projectId);
    const all = await explorerRepo.byProject(node.projectId);
    const clones: ExplorerNode[] = [];
    const cloneTree = (src: ExplorerNode, parentId: string | null, suffix: boolean) => {
      const copy = base({ ...src, id: uid(), parentId, name: suffix ? `${src.name} (cópia)` : src.name });
      copy.content = src.content;
      copy.links = [...src.links];
      clones.push(copy);
      all.filter((n) => n.parentId === src.id && !n.deleted).forEach((child) => cloneTree(child, copy.id, false));
    };
    cloneTree(node, node.parentId, true);
    await explorerRepo.bulkPut(clones);
  },

  async setArchived(id: string, archived: boolean): Promise<void> {
    const node = await explorerRepo.byId(id);
    if (!node) return;
    await requirePermission("project", "update", node.projectId);
    await explorerRepo.put({ ...node, archived, updatedAt: now(), updatedBy: currentActor().id });
  },

  async remove(id: string): Promise<void> {
    const node = await explorerRepo.byId(id);
    if (!node) return;
    await requirePermission("project", "delete", node.projectId);
    const all = await explorerRepo.byProject(node.projectId);
    const ids: string[] = [];
    const collect = (nid: string) => {
      ids.push(nid);
      all.filter((n) => n.parentId === nid).forEach((c) => collect(c.id));
    };
    collect(id);
    const t = now();
    await explorerRepo.bulkPut(all.filter((n) => ids.includes(n.id)).map((n) => ({ ...n, deleted: true, updatedAt: t })));
    await log("deleted", node.projectId, `Excluiu "${node.name}"`);
    await history(node, "deleted", "Item excluído");
  },

  async restore(id: string): Promise<void> {
    const node = await explorerRepo.byId(id);
    if (!node) return;
    await requirePermission("project", "update", node.projectId);
    await explorerRepo.put({ ...node, deleted: false, archived: false, updatedAt: now() });
    await history(node, "restored", "Item restaurado");
  },

  async purge(id: string): Promise<void> {
    const node = await explorerRepo.byId(id);
    if (!node) return;
    await requirePermission("project", "delete", node.projectId);
    await explorerRepo.remove(id);
  },

  async toggleLink(sourceId: string, targetId: string): Promise<void> {
    const node = await explorerRepo.byId(sourceId);
    if (!node || sourceId === targetId) return;
    await requirePermission("project", "update", node.projectId);
    const links = node.links.includes(targetId) ? node.links.filter((l) => l !== targetId) : [...node.links, targetId];
    await explorerRepo.put({ ...node, links, updatedAt: now() });
  },

  // ---- Tags -------------------------------------------------------------
  async setTags(id: string, tags: string[]): Promise<void> {
    const node = await explorerRepo.byId(id);
    if (!node) return;
    await requirePermission("project", "update", node.projectId);
    const clean = Array.from(new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean)));
    await explorerRepo.put({ ...node, tags: clean, updatedAt: now(), updatedBy: currentActor().id });
  },

  async setStatus(id: string, status: DocumentStatus): Promise<void> {
    const node = await explorerRepo.byId(id);
    if (!node) return;
    await requirePermission("project", "update", node.projectId);
    await explorerRepo.put({ ...node, status, updatedAt: now(), updatedBy: currentActor().id });
    await history(node, "updated", `Status alterado para ${status}`);
  },

  // ---- Relationships ----------------------------------------------------
  async relations(projectId: string): Promise<DocumentRelation[]> {
    return relationRepo.byProject(projectId);
  },

  async relate(sourceId: string, targetId: string, relationshipType: RelationshipType): Promise<void> {
    if (sourceId === targetId) throw new Error("Um documento não pode se relacionar consigo mesmo.");
    const source = await explorerRepo.byId(sourceId);
    const target = await explorerRepo.byId(targetId);
    if (!source || !target) throw new Error("Documento não encontrado.");
    if (source.projectId !== target.projectId) throw new Error("Documentos precisam ser do mesmo projeto.");
    await requirePermission("project", "update", source.projectId);
    const actor = currentActor();
    await relationRepo.put({
      id: uid(),
      projectId: source.projectId,
      sourceId,
      targetId,
      relationshipType,
      createdAt: now(),
      ...(actor.id ? { createdBy: actor.id } : {}),
    });
  },

  async unrelate(relationId: string): Promise<void> {
    const rel = await relationRepo.byId(relationId);
    if (!rel) return;
    await requirePermission("project", "update", rel.projectId);
    await relationRepo.remove(relationId);
  },

  // ---- History ----------------------------------------------------------
  historyOf(nodeId: string) {
    return historyRepo.byNode(nodeId);
  },
};

export interface SearchHit {
  node: ExplorerNode;
  matchedIn: ("name" | "content" | "tag" | "extension" | "description" | "status")[];
  excerpt?: string;
}

export function searchNodes(nodes: ExplorerNode[], term: string): SearchHit[] {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];
  for (const node of nodes) {
    if (node.deleted) continue;
    const matchedIn: SearchHit["matchedIn"] = [];
    let excerpt: string | undefined;
    if (node.name.toLowerCase().includes(q)) matchedIn.push("name");
    if (node.extension?.toLowerCase() === q.replace(/^\./, "")) matchedIn.push("extension");
    if (node.tags.some((t) => t.toLowerCase().includes(q))) matchedIn.push("tag");
    if (node.description?.toLowerCase().includes(q)) matchedIn.push("description");
    if (node.status?.toLowerCase().includes(q)) matchedIn.push("status");
    const content = node.content ?? "";
    const idx = content.toLowerCase().indexOf(q);
    if (idx >= 0) {
      matchedIn.push("content");
      excerpt = content.slice(Math.max(0, idx - 40), idx + q.length + 40).replace(/\n/g, " ");
    }
    if (matchedIn.length) hits.push({ node, matchedIn, excerpt });
  }
  return hits.slice(0, 100);
}

export function backlinksOf(nodes: ExplorerNode[], id: string): ExplorerNode[] {
  return nodes.filter((n) => !n.deleted && n.links.includes(id));
}

export function allTags(nodes: ExplorerNode[]): string[] {
  return Array.from(new Set(nodes.flatMap((n) => n.tags))).sort();
}
