import {
  Bell,
  FolderOpen,
  LayoutDashboard,
  Megaphone,
  Receipt,
  Shield,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Permission } from "@/lib/permissions";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  available: boolean;
  permission?: Permission;
  adminOnly?: boolean;
  section?: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    available: true,
    permission: "dashboard.view",
  },
  {
    title: "Campanhas",
    url: "/campanhas",
    icon: Megaphone,
    available: true,
    permission: "campaigns.view",
  },
  {
    title: "Pedidos",
    url: "/pedidos",
    icon: Receipt,
    available: true,
    permission: "orders.view",
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: UserCheck,
    available: true,
    permission: "customers.view",
  },
  {
    title: "Arquivos",
    url: "/arquivos",
    icon: FolderOpen,
    available: true,
    permission: "files.view",
  },
  {
    title: "Notificacoes",
    url: "/notificacoes",
    icon: Bell,
    available: true,
    permission: "notifications.view",
  },
  {
    title: "Admin Console",
    url: "/admin/dashboard",
    icon: Shield,
    available: true,
    adminOnly: true,
    section: "admin",
  },
] as const;

export const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  campanhas: "Campanhas",
  pedidos: "Pedidos",
  clientes: "Clientes",
  arquivos: "Arquivos",
  usuarios: "Usuarios",
  auditoria: "Auditoria",
  pagamentos: "Pagamentos",
  notificacoes: "Notificacoes",
  configuracoes: "Configuracoes",
  admin: "Admin",
  users: "Usuarios",
  roles: "Roles",
  permissions: "Permissoes",
  campanha: "Campanha",
};
