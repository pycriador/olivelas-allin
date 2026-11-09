import { cloudTable } from "@/lib/sb";
import type { DocumentHistoryEntry, DocumentRelation, ExplorerNode } from "@/types/explorer";

const nodes = cloudTable<ExplorerNode>("nodes");

export const explorerRepo = {
  ...nodes,
  byProject: (projectId: string) => nodes.where("projectId", projectId),
  byParent: (parentId: string) => nodes.where("parentId", parentId),
};

const relations = cloudTable<DocumentRelation>("document_relations");
export const relationRepo = {
  ...relations,
  byProject: (projectId: string) => relations.where("projectId", projectId),
};

const history = cloudTable<DocumentHistoryEntry>("document_history");
export const historyRepo = {
  ...history,
  byNode: (nodeId: string) =>
    history.query((q) => q.eq("node_id", nodeId).order("changed_at", { ascending: false }).limit(100)),
};
