// Explorer domain: the document is the central unit of the platform.

export type NodeKind = "folder" | "file" | "link" | "shortcut";

export const DocumentStatus = {
  Draft: "draft",
  InReview: "in_review",
  Approved: "approved",
  Archived: "archived",
} as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Rascunho",
  in_review: "Em revisão",
  approved: "Aprovado",
  archived: "Arquivado",
};

export const RelationshipType = {
  Related: "related",
  DependsOn: "depends_on",
  Implements: "implements",
  References: "references",
  Supersedes: "supersedes",
} as const;
export type RelationshipType = (typeof RelationshipType)[keyof typeof RelationshipType];

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  related: "Relacionado",
  depends_on: "Depende de",
  implements: "Implementa",
  references: "Referencia",
  supersedes: "Substitui",
};

export const ChangeType = {
  Created: "created",
  Updated: "updated",
  Renamed: "renamed",
  Moved: "moved",
  Deleted: "deleted",
  Restored: "restored",
} as const;
export type ChangeType = (typeof ChangeType)[keyof typeof ChangeType];

export const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  created: "Criado",
  updated: "Atualizado",
  renamed: "Renomeado",
  moved: "Movido",
  deleted: "Excluído",
  restored: "Restaurado",
};

export interface ExplorerNode {
  id: string;
  projectId: string;
  parentId: string | null;
  kind: NodeKind;
  name: string;
  /** File extension without dot, e.g. "md", "sql". Empty for folders. */
  extension?: string;
  content?: string;
  description?: string;
  tags: string[];
  order: number;
  archived?: boolean;
  deleted?: boolean;
  /** External URL for kind === "link" */
  url?: string;
  /** Target node id for kind === "shortcut" */
  targetId?: string;
  /** Outgoing relationships to other node ids (legacy simple links) */
  links: string[];
  /** Informational lifecycle status */
  status?: DocumentStatus;
  /** Template / semantic type of the document */
  documentType?: string;
  /** Binary artifacts live in Storage */
  storagePath?: string;
  sizeBytes?: number;
  mimeType?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentRelation {
  id: string;
  projectId: string;
  sourceId: string;
  targetId: string;
  relationshipType: RelationshipType;
  createdBy?: string;
  createdAt: number;
}

export interface DocumentHistoryEntry {
  id: string;
  projectId: string;
  nodeId: string;
  version: number;
  changeType: ChangeType;
  changedBy?: string;
  changedByName: string;
  summary: string;
  changedAt: number;
}

export interface TreeItem extends ExplorerNode {
  children: TreeItem[];
  depth: number;
}
