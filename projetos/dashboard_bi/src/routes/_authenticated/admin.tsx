import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/app/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Users,
  UsersRound,
  Layers,
  ShieldCheck,
  ClipboardList,
  LayoutDashboard,
  Send,
} from "lucide-react";
import { AdminDashboardTab } from "@/components/admin/tab-dashboard";
import { AdminUsersTab } from "@/components/admin/tab-users";
import { AdminGroupsTab } from "@/components/admin/tab-groups";
import { AdminWorkspacesTab } from "@/components/admin/tab-workspaces";
import { AdminPermissionsTab } from "@/components/admin/tab-permissions";
import { AdminInvitationsTab } from "@/components/admin/tab-invitations";
import { AdminAuditTab } from "@/components/admin/tab-audit";
import { AdminOrgTab } from "@/components/admin/tab-organization";
import { usePermissions } from "@/hooks/use-permissions";
import { EmptyState } from "@/components/app/empty-state";

export const Route = createFileRoute("/_authenticated/admin")({ component: Page });

function Page() {
  const { t } = useTranslation();
  const { isAdmin, isLoading } = usePermissions();

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={t("pages.admin.title")} subtitle={t("pages.admin.subtitle")} />
      {!isLoading && !isAdmin ? (
        <EmptyState
          icon={ShieldCheck}
          title={t("admin.notAllowed.title")}
          description={t("admin.notAllowed.desc")}
        />
      ) : (
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/40 p-1">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              {t("admin.tabs.dashboard")}
            </TabsTrigger>
            <TabsTrigger value="org" className="gap-2">
              <Building2 className="h-4 w-4" />
              {t("admin.tabs.org")}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              {t("admin.tabs.users")}
            </TabsTrigger>
            <TabsTrigger value="invitations" className="gap-2">
              <Send className="h-4 w-4" />
              {t("admin.tabs.invitations")}
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-2">
              <UsersRound className="h-4 w-4" />
              {t("admin.tabs.groups")}
            </TabsTrigger>
            <TabsTrigger value="workspaces" className="gap-2">
              <Layers className="h-4 w-4" />
              {t("admin.tabs.workspaces")}
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              {t("admin.tabs.permissions")}
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              {t("admin.tabs.audit")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <AdminDashboardTab />
          </TabsContent>
          <TabsContent value="org">
            <AdminOrgTab />
          </TabsContent>
          <TabsContent value="users">
            <AdminUsersTab />
          </TabsContent>
          <TabsContent value="invitations">
            <AdminInvitationsTab />
          </TabsContent>
          <TabsContent value="groups">
            <AdminGroupsTab />
          </TabsContent>
          <TabsContent value="workspaces">
            <AdminWorkspacesTab />
          </TabsContent>
          <TabsContent value="permissions">
            <AdminPermissionsTab />
          </TabsContent>
          <TabsContent value="audit">
            <AdminAuditTab />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
