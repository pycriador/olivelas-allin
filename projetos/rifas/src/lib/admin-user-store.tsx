import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { RoleCode, UserStatus } from "@/types/profile";
import { roleHasPermission } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: RoleCode;
  status: UserStatus;
  department?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  actorId: string | null;
  targetId?: string;
  targetName?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---- Seed data ----
const SEED_USERS: AdminUser[] = [
  {
    id: "seed-1",
    name: "Willian Rosa",
    email: "willian@example.com",
    role: "GLOBAL_ADMIN",
    status: "ACTIVE",
    department: "Tecnologia",
    lastLogin: new Date().toISOString(),
    createdAt: new Date("2025-01-15").toISOString(),
    updatedAt: new Date("2026-08-01").toISOString(),
  },
  {
    id: "seed-2",
    name: "Ana Beatriz Silva",
    email: "ana.silva@example.com",
    role: "ADMIN",
    status: "ACTIVE",
    department: "Operacoes",
    lastLogin: new Date(Date.now() - 86_400_000).toISOString(),
    createdAt: new Date("2025-03-10").toISOString(),
    updatedAt: new Date("2026-07-20").toISOString(),
  },
  {
    id: "seed-3",
    name: "Carlos Eduardo Lima",
    email: "carlos.lima@example.com",
    role: "PUBLISHER",
    status: "ACTIVE",
    department: "Marketing",
    lastLogin: new Date(Date.now() - 172_800_000).toISOString(),
    createdAt: new Date("2025-04-22").toISOString(),
    updatedAt: new Date("2026-06-15").toISOString(),
  },
  {
    id: "seed-4",
    name: "Daniela Souza",
    email: "daniela.souza@example.com",
    role: "PUBLISHER",
    status: "INACTIVE",
    department: "Vendas",
    lastLogin: new Date("2026-01-15").toISOString(),
    createdAt: new Date("2025-05-05").toISOString(),
    updatedAt: new Date("2026-05-30").toISOString(),
  },
  {
    id: "seed-5",
    name: "Eduardo Martins",
    email: "eduardo.m@example.com",
    role: "PUBLISHER",
    status: "SUSPENDED",
    department: "Financeiro",
    lastLogin: new Date("2026-02-20").toISOString(),
    createdAt: new Date("2025-06-18").toISOString(),
    updatedAt: new Date("2026-07-10").toISOString(),
  },
  {
    id: "seed-6",
    name: "Fernanda Oliveira",
    email: "fernanda.o@example.com",
    role: "PUBLISHER",
    status: "ACTIVE",
    department: "Marketing",
    lastLogin: new Date(Date.now() - 259_200_000).toISOString(),
    createdAt: new Date("2025-07-01").toISOString(),
    updatedAt: new Date("2026-08-01").toISOString(),
  },
  {
    id: "seed-7",
    name: "Gabriel Costa",
    email: "gabriel.c@example.com",
    role: "ADMIN",
    status: "ACTIVE",
    department: "Tecnologia",
    lastLogin: new Date(Date.now() - 432_000_000).toISOString(),
    createdAt: new Date("2025-08-12").toISOString(),
    updatedAt: new Date("2026-07-25").toISOString(),
  },
  {
    id: "seed-8",
    name: "Helena Barbosa",
    email: "helena.b@example.com",
    role: "PUBLISHER",
    status: "PENDING",
    department: "RH",
    createdAt: new Date("2025-09-20").toISOString(),
    updatedAt: new Date("2026-06-01").toISOString(),
  },
  {
    id: "seed-9",
    name: "Igor Nascimento",
    email: "igor.n@example.com",
    role: "PUBLISHER",
    status: "ACTIVE",
    department: "Design",
    lastLogin: new Date(Date.now() - 86_400_000 * 7).toISOString(),
    createdAt: new Date("2025-10-05").toISOString(),
    updatedAt: new Date("2026-08-05").toISOString(),
  },
  {
    id: "seed-10",
    name: "Juliana Torres",
    email: "juliana.t@example.com",
    role: "PUBLISHER",
    status: "ACTIVE",
    department: "Vendas",
    lastLogin: new Date(Date.now() - 86_400_000 * 3).toISOString(),
    createdAt: new Date("2025-11-18").toISOString(),
    updatedAt: new Date("2026-07-30").toISOString(),
  },
  {
    id: "seed-11",
    name: "Lucas Mendes",
    email: "lucas.m@example.com",
    role: "PUBLISHER",
    status: "INACTIVE",
    department: "Suporte",
    lastLogin: new Date("2026-04-01").toISOString(),
    createdAt: new Date("2026-01-10").toISOString(),
    updatedAt: new Date("2026-05-15").toISOString(),
  },
  {
    id: "seed-12",
    name: "Mariana Rocha",
    email: "mariana.r@example.com",
    role: "ADMIN",
    status: "ACTIVE",
    department: "Operacoes",
    lastLogin: new Date(Date.now() - 86_400_000 * 2).toISOString(),
    createdAt: new Date("2026-02-14").toISOString(),
    updatedAt: new Date("2026-08-08").toISOString(),
  },
];

// ---- Store types ----
export interface AdminUserStore {
  users: AdminUser[];
  auditLogs: AuditEvent[];
  isLoading: boolean;
  isError: boolean;
  getActorRole: (actorId: string | null) => RoleCode | null;
  canPerform: (actorId: string | null, permission: Permission) => boolean;
  createUser: (
    input: Omit<AdminUser, "id" | "createdAt" | "updatedAt">,
    actorId?: string,
  ) => { user?: AdminUser; error?: string };
  updateUser: (
    id: string,
    input: Partial<Omit<AdminUser, "id" | "createdAt" | "updatedAt">>,
    actorId?: string,
  ) => { error?: string };
  deleteUser: (id: string, actorId?: string) => { error?: string };
  setStatus: (id: string, status: UserStatus, actorId?: string) => { error?: string };
  setRole: (id: string, role: RoleCode, actorId?: string) => { error?: string };
}

const AdminUserContext = createContext<AdminUserStore | undefined>(undefined);

export function AdminUserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AdminUser[]>(() => [...SEED_USERS]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [isLoading] = useState(false);
  const [isError] = useState(false);

  function addAudit(
    action: string,
    actorId: string | null,
    target?: AdminUser,
    metadata?: Record<string, unknown>,
  ) {
    const event: AuditEvent = {
      id: uid("audit"),
      action,
      actorId,
      timestamp: new Date().toISOString(),
      ...(target?.id ? { targetId: target.id } : {}),
      ...(target?.name ? { targetName: target.name } : {}),
      ...(metadata ? { metadata } : {}),
    };
    setAuditLogs((prev) => [...prev, event]);
  }

  const store = useMemo<AdminUserStore>(
    () => ({
      users,
      auditLogs,
      isLoading,
      isError,

      getActorRole(actorId) {
        if (!actorId) return null;
        const actor = users.find((u) => u.id === actorId);
        return actor?.role ?? null;
      },

      canPerform(actorId, permission) {
        const role = users.find((u) => u.id === actorId)?.role ?? null;
        return roleHasPermission(role, permission);
      },

      createUser(input, actorId) {
        if (!roleHasPermission(this.getActorRole(actorId ?? null), "users.create")) {
          toast.error("Acao nao permitida para o usuario atual.");
          return { error: "unauthorized" };
        }
        const normalized = input.email.trim().toLowerCase();
        if (users.some((u) => u.email.toLowerCase() === normalized)) {
          toast.error("Ja existe um usuario com este e-mail.");
          return { error: "duplicate_email" };
        }
        const now = new Date().toISOString();
        const user: AdminUser = {
          ...input,
          email: normalized,
          id: uid("user"),
          createdAt: now,
          updatedAt: now,
        };
        setUsers((prev) => [...prev, user]);
        addAudit("USER_CREATED", actorId ?? null, user);
        toast.success("Usuario criado com sucesso.");
        return { user };
      },

      updateUser(id, input, actorId) {
        if (!roleHasPermission(this.getActorRole(actorId ?? null), "users.update")) {
          toast.error("Acao nao permitida para o usuario atual.");
          return { error: "unauthorized" };
        }
        const target = users.find((u) => u.id === id);
        if (!target) return { error: "not_found" };

        if (input.email) {
          const normalized = input.email.trim().toLowerCase();
          if (users.some((u) => u.email.toLowerCase() === normalized && u.id !== id)) {
            toast.error("Ja existe um usuario com este e-mail.");
            return { error: "duplicate_email" };
          }
          input.email = normalized;
        }

        setUsers((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, ...input, updatedAt: new Date().toISOString() } : u,
          ),
        );
        addAudit("USER_UPDATED", actorId ?? null, target, { changes: input });
        toast.success("Usuario atualizado com sucesso.");
        return {};
      },

      deleteUser(id, actorId) {
        if (!roleHasPermission(this.getActorRole(actorId ?? null), "users.delete")) {
          toast.error("Acao nao permitida para o usuario atual.");
          return { error: "unauthorized" };
        }
        const target = users.find((u) => u.id === id);
        if (!target) return { error: "not_found" };

        if (actorId === id) {
          toast.error("Voce nao pode excluir sua propria conta.");
          return { error: "self_action" };
        }
        if (
          target.role === "GLOBAL_ADMIN" &&
          users.filter((u) => u.role === "GLOBAL_ADMIN").length <= 1
        ) {
          toast.error("Nao e possivel excluir o ultimo Global Admin ativo.");
          return { error: "last_global_admin" };
        }

        setUsers((prev) => prev.filter((u) => u.id !== id));
        addAudit("USER_DELETED", actorId ?? null, target);
        toast.success("Usuario excluido com sucesso.");
        return {};
      },

      setStatus(id, status, actorId) {
        if (!roleHasPermission(this.getActorRole(actorId ?? null), "users.change_status")) {
          toast.error("Acao nao permitida para o usuario atual.");
          return { error: "unauthorized" };
        }
        const target = users.find((u) => u.id === id);
        if (!target) return { error: "not_found" };

        if (actorId === id && status !== "ACTIVE") {
          toast.error("Voce nao pode desativar sua propria conta.");
          return { error: "self_action" };
        }
        if (
          target.role === "GLOBAL_ADMIN" &&
          status !== "ACTIVE" &&
          users.filter((u) => u.role === "GLOBAL_ADMIN" && u.status === "ACTIVE").length <= 1
        ) {
          toast.error("O sistema precisa manter pelo menos um Global Admin ativo.");
          return { error: "last_global_admin" };
        }

        setUsers((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, status, updatedAt: new Date().toISOString() } : u,
          ),
        );
        addAudit(
          status === "ACTIVE" ? "USER_ACTIVATED" : "USER_DEACTIVATED",
          actorId ?? null,
          target,
          { newStatus: status },
        );
        toast.success(
          status === "ACTIVE" ? "Usuario ativado com sucesso." : "Usuario desativado com sucesso.",
        );
        return {};
      },

      setRole(id, role, actorId) {
        if (!roleHasPermission(this.getActorRole(actorId ?? null), "users.change_role")) {
          toast.error("Acao nao permitida para o usuario atual.");
          return { error: "unauthorized" };
        }
        const target = users.find((u) => u.id === id);
        if (!target) return { error: "not_found" };

        if (actorId === id) {
          toast.error("Voce nao pode alterar sua propria role.");
          return { error: "self_action" };
        }
        if (
          target.role === "GLOBAL_ADMIN" &&
          role !== "GLOBAL_ADMIN" &&
          users.filter((u) => u.role === "GLOBAL_ADMIN" && u.status === "ACTIVE").length <= 1
        ) {
          toast.error("O sistema precisa manter pelo menos um Global Admin ativo.");
          return { error: "last_global_admin" };
        }

        const oldRole = target.role;
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, role, updatedAt: new Date().toISOString() } : u)),
        );
        addAudit("ROLE_CHANGED", actorId ?? null, target, { oldRole, newRole: role });
        toast.success("Role do usuario alterada com sucesso.");
        return {};
      },
    }),
    [users, auditLogs],
  );

  return <AdminUserContext.Provider value={store}>{children}</AdminUserContext.Provider>;
}

export function useAdminUsers(): AdminUserStore {
  const ctx = useContext(AdminUserContext);
  if (!ctx) throw new Error("useAdminUsers must be used within AdminUserProvider");
  return ctx;
}
