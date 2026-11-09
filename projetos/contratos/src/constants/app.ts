import type { AppRole, Theme } from "@/types";

export const APP_NAME = "ClauseForge";
export const APP_DESCRIPTION =
  "Plataforma enterprise de automação documental. Crie projetos, gere documentos e automatize processos legais com segurança e escala.";

export const THEME_STORAGE_KEY = "clauseforge-theme";

export const THEMES: Theme[] = ["light", "dark", "system"];

export const ROLES: { value: AppRole; label: string; description: string }[] = [
  {
    value: "super_admin",
    label: "Super Admin",
    description: "Administra toda a plataforma",
  },
  {
    value: "workspace_admin",
    label: "Workspace Admin",
    description: "Administra um workspace",
  },
  {
    value: "manager",
    label: "Manager",
    description: "Gerencia projetos e equipes",
  },
  {
    value: "editor",
    label: "Editor",
    description: "Edita projetos e documentos",
  },
  {
    value: "reviewer",
    label: "Reviewer",
    description: "Revisa e aprova documentos",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Apenas visualiza conteúdo",
  },
];

export const MODULE_KEYS = {
  workspace: "workspace",
  projects: "projects",
  documents: "documents",
  executions: "executions",
  libraries: "libraries",
  users: "users",
  settings: "settings",
  audit: "audit",
  connectors: "connectors",
  validation: "validation",
  ai: "ai",
} as const;

export type ModuleKey = (typeof MODULE_KEYS)[keyof typeof MODULE_KEYS];

export const PUBLIC_ROUTES = ["/", "/login", "/about", "/privacy", "/terms", "/contact"];
