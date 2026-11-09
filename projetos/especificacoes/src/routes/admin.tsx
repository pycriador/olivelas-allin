import { createFileRoute } from "@tanstack/react-router";
import { Shield, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/empty-state";
import { UsersPanel } from "@/components/admin/users-panel";
import { AccessRequestsPanel } from "@/components/admin/access-requests-panel";
import { WorkspacePanel } from "@/components/admin/workspace-panel";
import { RolesPanel } from "@/components/admin/roles-panel";
import { AuditPanel } from "@/components/admin/audit-panel";
import { BackupPanel } from "@/components/admin/backup-panel";
import { SecurityPanel } from "@/components/admin/security-panel";
import { useCan } from "@/hooks/iam";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const can = useCan();
  const canUsers = can("user", "read");
  const canRoles = can("role", "read") || can("permission", "read");
  const canAudit = can("audit", "read");
  const canBackup = can("backup", "read") || can("backup", "manage");
  const canSettings = can("settings", "update") || can("settings", "manage");

  if (!canUsers && !canRoles && !canAudit && !canBackup && !canSettings) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <EmptyState
          icon={<Lock className="h-6 w-6" />}
          title="403 — Access denied"
          description="Your role does not grant access to the administration console."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground">
            Users, roles and permissions, audit trail, backups and security policy.
          </p>
        </div>
      </div>

      <Tabs defaultValue={canUsers ? "requests" : canRoles ? "roles" : canAudit ? "audit" : canBackup ? "backup" : "security"}>
        <TabsList>
          {canUsers && <TabsTrigger value="requests">Solicitações de acesso</TabsTrigger>}
          {canUsers && <TabsTrigger value="users">Users</TabsTrigger>}
          {canUsers && <TabsTrigger value="workspace">Workspace</TabsTrigger>}
          {canRoles && <TabsTrigger value="roles">Roles & permissions</TabsTrigger>}
          {canAudit && <TabsTrigger value="audit">Audit</TabsTrigger>}
          {canBackup && <TabsTrigger value="backup">Backup</TabsTrigger>}
          {canSettings && <TabsTrigger value="security">Security</TabsTrigger>}
        </TabsList>

        {canUsers && <TabsContent value="requests" className="mt-4"><AccessRequestsPanel /></TabsContent>}
        {canUsers && <TabsContent value="users" className="mt-4"><UsersPanel /></TabsContent>}
        {canUsers && <TabsContent value="workspace" className="mt-4"><WorkspacePanel /></TabsContent>}
        {canRoles && <TabsContent value="roles" className="mt-4"><RolesPanel /></TabsContent>}
        {canAudit && <TabsContent value="audit" className="mt-4"><AuditPanel /></TabsContent>}
        {canBackup && <TabsContent value="backup" className="mt-4"><BackupPanel /></TabsContent>}
        {canSettings && <TabsContent value="security" className="mt-4"><SecurityPanel /></TabsContent>}
      </Tabs>
    </div>
  );
}
