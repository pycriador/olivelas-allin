import {
  LayoutDashboard,
  FolderKanban,
  Library,
  PlaySquare,
  Plug,
  ScrollText,
  Users,
  Settings,
  Shield,
  FileType,
  BrainCircuit,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface NavConfig {
  sections: NavSection[];
}

export const APP_NAV: NavConfig = {
  sections: [
    {
      title: "Geral",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Automação",
      items: [
        {
          title: "Projetos",
          href: "/projects",
          icon: FolderKanban,
          permission: "projects.read",
        },
        {
          title: "Execuções",
          href: "/executions",
          icon: PlaySquare,
          permission: "executions.read",
        },
        {
          title: "Documentos",
          href: "/documents",
          icon: FileType,
          permission: "documents.read",
        },
        {
          title: "Biblioteca",
          href: "/libraries",
          icon: Library,
          permission: "libraries.read",
        },
        {
          title: "Conectores",
          href: "/connectors",
          icon: Plug,
          permission: "connectors.read",
        },
        {
          title: "Validação",
          href: "/validation",
          icon: Shield,
          permission: "validation.read",
        },
      ],
    },
    {
      title: "Inteligência",
      items: [
        {
          title: "AI Dashboard",
          href: "/ai",
          icon: BrainCircuit,
          permission: "ai.read",
        },
        {
          title: "AI Providers",
          href: "/ai/providers",
          icon: BrainCircuit,
          permission: "ai.read",
        },
        {
          title: "Prompt Library",
          href: "/ai/prompts",
          icon: BrainCircuit,
          permission: "ai.read",
        },
        {
          title: "Prompt Builder",
          href: "/ai/prompt-builder",
          icon: BrainCircuit,
          permission: "ai.read",
        },
        {
          title: "AI Agents",
          href: "/ai/agents",
          icon: BrainCircuit,
          permission: "ai.read",
        },
        {
          title: "AI Executions",
          href: "/ai/executions",
          icon: BrainCircuit,
          permission: "ai.read",
        },
        {
          title: "AI Logs",
          href: "/ai/logs",
          icon: BrainCircuit,
          permission: "ai.read",
        },
        {
          title: "AI Costs",
          href: "/ai/costs",
          icon: BrainCircuit,
          permission: "ai.read",
        },
        {
          title: "AI Settings",
          href: "/ai/settings",
          icon: BrainCircuit,
          permission: "ai.read",
        },
      ],
    },
    {
      title: "Administração",
      items: [
        {
          title: "Usuários",
          href: "/users",
          icon: Users,
          permission: "users.read",
        },
        {
          title: "Auditoria",
          href: "/audit",
          icon: ScrollText,
          permission: "audit.read",
        },
        {
          title: "Configurações",
          href: "/settings",
          icon: Settings,
          permission: "settings.read",
        },
      ],
    },
  ],
};
