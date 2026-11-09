import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  CalendarCheck,
  CalendarDays,
  Link2,
  Link2Off,
  RefreshCw,
  RotateCw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/shared/hooks/use-auth";
import { useTenantId } from "@/shared/hooks/use-tenant-id";
import { PageHeader } from "@/shared/components/page-header";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { openOAuthPopup, waitForOAuthCompletion } from "@/shared/lib/oauth-popup";
import {
  startGoogleConnect,
  refreshGoogleCalendars,
  disconnectGoogleAccount,
  syncGoogleNow,
} from "@/integrations/google/google-calendar.functions";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/google-workspace")({
  head: () => ({
    meta: [
      { title: "Google Workspace — ClinicFlow" },
      {
        name: "description",
        content:
          "Conecte sua conta Google e sincronize os calendários da clínica com a agenda do ClinicFlow.",
      },
      { property: "og:title", content: "Google Workspace — ClinicFlow" },
      {
        property: "og:description",
        content: "Integração de calendários Google por profissional no ClinicFlow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GoogleWorkspacePage,
});

function GoogleWorkspacePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const tenantId = useTenantId();
  const qc = useQueryClient();

  const accountQuery = useQuery({
    queryKey: ["google-account", tenantId, user?.id],
    enabled: Boolean(tenantId && user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_accounts")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const account = accountQuery.data ?? null;

  const calendarsQuery = useQuery({
    queryKey: ["google-calendars", account?.id],
    enabled: Boolean(account?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("google_calendars")
        .select("*")
        .eq("account_id", account!.id)
        .order("is_primary", { ascending: false })
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const logsQuery = useQuery({
    queryKey: ["google-sync-logs", tenantId],
    enabled: Boolean(tenantId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_sync_logs")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("started_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidateAll = () => {
    void qc.invalidateQueries({ queryKey: ["google-account"] });
    void qc.invalidateQueries({ queryKey: ["google-calendars"] });
    void qc.invalidateQueries({ queryKey: ["google-sync-logs"] });
  };

  const connectMutation = useMutation({
    mutationFn: async () => {
      const popup = openOAuthPopup();
      try {
        const { authorizationUrl } = await startGoogleConnect();
        const completion = waitForOAuthCompletion(popup);
        popup.location.href = authorizationUrl;
        await completion;
      } catch (error) {
        popup.close();
        throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("google.toastConnected"));
      invalidateAll();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const refreshMutation = useMutation({
    mutationFn: () => refreshGoogleCalendars(),
    onSuccess: () => {
      toast.success(t("google.toastRefreshed"));
      invalidateAll();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const syncMutation = useMutation({
    mutationFn: (input?: { calendarRowId?: string }) =>
      syncGoogleNow({ data: { calendarRowId: input?.calendarRowId } }),
    onSuccess: (result) => {
      if (result?.error) toast.error(result.error);
      else toast.success(t("google.toastSynced"));
      invalidateAll();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const syncingCalendarId = syncMutation.isPending
    ? syncMutation.variables?.calendarRowId
    : undefined;


  const disconnectMutation = useMutation({
    mutationFn: () => disconnectGoogleAccount(),
    onSuccess: () => {
      toast.success(t("google.toastDisconnected"));
      invalidateAll();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      field: "sync_enabled" | "show_in_agenda";
      value: boolean;
    }) => {
      const { error } = await supabase
        .from("google_calendars")
        .update(
          input.field === "sync_enabled"
            ? { sync_enabled: input.value }
            : { show_in_agenda: input.value },
        )
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["google-calendars"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const connected = account?.status === "connected";

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("google.title")}
        subtitle={t("google.description")}
        actions={
          connected ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${refreshMutation.isPending ? "animate-spin" : ""}`}
                />
                {t("google.refresh")}
              </Button>
              <Button
                onClick={() => syncMutation.mutate(undefined)}
                disabled={syncMutation.isPending}
              >
                <RotateCw
                  className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`}
                />
                {t("google.syncNow")}
              </Button>
              <ConfirmDialog
                title={t("google.disconnectConfirmTitle")}
                description={t("google.disconnectConfirmDesc")}
                onConfirm={() => disconnectMutation.mutate()}
                trigger={
                  <Button variant="destructive" disabled={disconnectMutation.isPending}>
                    <Link2Off className="mr-2 h-4 w-4" />
                    {t("google.disconnect")}
                  </Button>
                }
              />
            </div>
          ) : (
            <Button
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending}
            >
              <Link2 className="mr-2 h-4 w-4" />
              {t("google.connect")}
            </Button>
          )
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {t("google.accountTitle")}
            </CardTitle>
            <CardDescription>{t("google.accountDesc")}</CardDescription>
          </div>
          {account ? (
            <Badge variant={connected ? "default" : "destructive"}>
              {t(`google.status.${account.status}`)}
            </Badge>
          ) : (
            <Badge variant="secondary">{t("google.status.disconnected")}</Badge>
          )}
        </CardHeader>
        <CardContent>
          {accountQuery.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : account ? (
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  {t("google.accountEmail")}
                </dt>
                <dd className="text-sm font-medium">{account.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  {t("google.lastSync")}
                </dt>
                <dd className="text-sm font-medium">
                  {account.last_sync
                    ? new Date(account.last_sync).toLocaleString()
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">
                  {t("google.scopes")}
                </dt>
                <dd className="text-sm font-medium">{account.scopes.length}</dd>
              </div>
              {account.last_error && (
                <div className="sm:col-span-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                  <TriangleAlert className="mt-0.5 h-4 w-4 text-destructive" />
                  <span>{account.last_error}</span>
                </div>
              )}
            </dl>
          ) : (
            <div className="flex flex-col items-start gap-3 py-4">
              <p className="text-sm text-muted-foreground">{t("google.emptyAccount")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-primary" />
            {t("google.calendarsTitle")}
          </CardTitle>
          <CardDescription>{t("google.calendarsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {!account ? (
            <p className="py-4 text-sm text-muted-foreground">{t("google.emptyCalendars")}</p>
          ) : calendarsQuery.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (calendarsQuery.data ?? []).length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">{t("google.emptyCalendars")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("google.calendarName")}</TableHead>
                  <TableHead>{t("google.calendarTimezone")}</TableHead>
                  <TableHead>{t("google.calendarAccess")}</TableHead>
                  <TableHead className="text-center">{t("google.syncEnabled")}</TableHead>
                  <TableHead className="text-center">{t("google.showInAgenda")}</TableHead>
                  <TableHead className="text-right">{t("google.syncActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(calendarsQuery.data ?? []).map((cal) => (
                  <TableRow key={cal.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full border"
                          style={{ backgroundColor: cal.color ?? "transparent" }}
                        />
                        <span className="font-medium">{cal.name}</span>
                        {cal.is_primary && (
                          <Badge variant="secondary" className="text-[10px]">
                            {t("google.primary")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cal.timezone ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cal.read_only ? t("google.readOnly") : t("google.readWrite")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={cal.sync_enabled}
                        onCheckedChange={(value) =>
                          toggleMutation.mutate({
                            id: cal.id,
                            field: "sync_enabled",
                            value,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={cal.show_in_agenda}
                        onCheckedChange={(value) =>
                          toggleMutation.mutate({
                            id: cal.id,
                            field: "show_in_agenda",
                            value,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => syncMutation.mutate({ calendarRowId: cal.id })}
                        disabled={syncMutation.isPending}
                      >
                        <RotateCw
                          className={`mr-2 h-4 w-4 ${
                            syncingCalendarId === cal.id ? "animate-spin" : ""
                          }`}
                        />
                        {t("google.syncCalendar")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="h-4 w-4 text-primary" />
            {t("google.logsTitle")}
          </CardTitle>
          <CardDescription>{t("google.logsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {(logsQuery.data ?? []).length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">{t("google.emptyLogs")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("google.logDate")}</TableHead>
                  <TableHead>{t("google.logType")}</TableHead>
                  <TableHead className="text-right">{t("google.logEvents")}</TableHead>
                  <TableHead>{t("google.logResult")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(logsQuery.data ?? []).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.started_at).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{log.sync_type}</TableCell>
                    <TableCell className="text-right">{log.events_total}</TableCell>
                    <TableCell>
                      <Badge variant={log.success ? "default" : "destructive"}>
                        {log.success ? t("google.logOk") : t("google.logFail")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
