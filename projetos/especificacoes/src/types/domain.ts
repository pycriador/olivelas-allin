// Core domain types & enums for SpecForge.

export type ID = string;

export const SpecType = {
  Sprint: "sprint",
  Backend: "backend",
  Frontend: "frontend",
  Database: "database",
  API: "api",
  Arquitetura: "architecture",
  PromptLovable: "prompt_lovable",
  PromptCursor: "prompt_cursor",
  ADR: "adr",
  RFC: "rfc",
  Checklist: "checklist",
  Teste: "test",
  Release: "release",
  Infraestrutura: "infrastructure",
  Seguranca: "security",
  DevOps: "devops",
} as const;
export type SpecType = (typeof SpecType)[keyof typeof SpecType];

export const SpecStatus = {
  Draft: "draft",
  Planning: "planning",
  InProgress: "in_progress",
  Review: "review",
  Approved: "approved",
  Done: "done",
  Archived: "archived",
} as const;
export type SpecStatus = (typeof SpecStatus)[keyof typeof SpecStatus];

export const ProjectStatus = {
  Active: "active",
  Paused: "paused",
  Completed: "completed",
  Archived: "archived",
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const SprintStatus = {
  Planned: "planned",
  Active: "active",
  Completed: "completed",
} as const;
export type SprintStatus = (typeof SprintStatus)[keyof typeof SprintStatus];

export const DeliveryStatus = {
  Todo: "todo",
  Doing: "doing",
  Done: "done",
  Blocked: "blocked",
} as const;
export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];

export const BlockType = {
  Markdown: "markdown",
  Code: "code",
  Table: "table",
  Checklist: "checklist",
  Image: "image",
  Mermaid: "mermaid",
  JSON: "json",
  YAML: "yaml",
  SQL: "sql",
  Text: "text",
  Prompt: "prompt",
} as const;
export type BlockType = (typeof BlockType)[keyof typeof BlockType];

export interface Timestamps {
  createdAt: number;
  updatedAt: number;
}

export interface Workspace extends Timestamps {
  id: ID;
  name: string;
  slug?: string;
  description?: string;
  avatar?: string;
  status?: string;
  ownerId?: ID;
}

export interface Project extends Timestamps {
  id: ID;
  workspaceId: ID;
  name: string;
  slug?: string;
  description?: string;
  status: ProjectStatus;
  color?: string;
  ownerId?: ID;
}

export interface Roadmap {
  id: ID;
  projectId: ID;
  name: string;
  order: number;
}

export interface Sprint {
  id: ID;
  roadmapId: ID;
  title: string;
  status: SprintStatus;
  startDate?: number;
  endDate?: number;
  order: number;
}

export interface Delivery {
  id: ID;
  sprintId: ID;
  title: string;
  status: DeliveryStatus;
  order: number;
}

export interface Specification extends Timestamps {
  id: ID;
  deliveryId: ID;
  title: string;
  description?: string;
  type: SpecType;
  status: SpecStatus;
  version: number;
  tags: string[];
  favorite: boolean;
  createdBy: string;
  deleted?: boolean;
}

export interface Block {
  id: ID;
  type: BlockType;
  content: string;
  meta?: Record<string, string | number | boolean>;
}

export interface DocumentEntity {
  id: ID;
  specificationId: ID;
  blocks: Block[];
}

export interface Tag {
  id: ID;
  name: string;
  color?: string;
}

export interface Template {
  id: ID;
  name: string;
  description: string;
  type: SpecType;
  blocks: Block[];
}

export interface ActivityEntry {
  id: ID;
  at: number;
  actor: string;
  action: string;
  targetType: "spec" | "project" | "sprint" | "workspace" | "delivery" | "snippet";
  targetId: ID;
  summary: string;
}

export interface Snippet extends Timestamps {
  id: ID;
  name: string;
  description?: string;
  language: string;
  content: string;
  tags: string[];
}
