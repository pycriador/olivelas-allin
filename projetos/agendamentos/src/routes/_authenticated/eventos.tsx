import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/shared/hooks/use-tenant-id";
import { useProfessionalsList } from "@/shared/hooks/use-agenda-data";
import { dayjs } from "@/shared/lib/dayjs";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/shared/components/page-header";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { EventDialog, type EventDialogInitial, type EventRow } from "@/shared/components/event-dialog";

const ALL = "__all__";

export const Route = createFileRoute("/_authenticated/eventos")({
  component: EventsPage,
});

function EventsPage() {
  const { t } = useTranslation();
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const pros = useProfessionalsList();
  const [proFilter, setProFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<EventDialogInitial | null>(null);

  const query = useQuery({
    queryKey: ["events", tenantId, proFilter, statusFilter],
    enabled: !!tenantId,
    queryFn: async () => {
      let q = supabase.from("events").select("*").order("starts_at", { ascending: false }).limit(200);
      if (proFilter !== ALL) q = q.eq("professional_id", proFilter);
      if (statusFilter !== ALL) q = q.eq("status", statusFilter as EventRow["status"]);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("common.deleted"));
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["agenda"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.events")}
        subtitle={t("events.subtitle")}
        actions={
          <Button onClick={() => { setInitial(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> {t("events.new")}
          </Button>
        }
      />
      <div className="flex flex-wrap gap-2">
        <Select value={proFilter} onValueChange={setProFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("agenda.allProfessionals")}</SelectItem>
            {(pros.data ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("events.filters.allStatuses")}</SelectItem>
            {(["scheduled","confirmed","completed","cancelled","no_show"] as const).map((s) => (
              <SelectItem key={s} value={s}>{t(`events.status.${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("events.fields.title")}</TableHead>
              <TableHead>{t("events.fields.startsAt")}</TableHead>
              <TableHead>{t("events.fields.professional")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t("common.loading")}</TableCell></TableRow>
            ) : (query.data ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
            ) : (query.data ?? []).map((ev) => {
              const pro = (pros.data ?? []).find((p) => p.id === ev.professional_id);
              return (
                <TableRow key={ev.id}>
                  <TableCell className="font-medium">{ev.title}</TableCell>
                  <TableCell>{dayjs(ev.starts_at).format("DD/MM/YYYY HH:mm")}</TableCell>
                  <TableCell>{pro?.full_name ?? "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{t(`events.status.${ev.status}`)}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setInitial(ev); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <ConfirmDialog
                      trigger={<Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>}
                      title={t("common.confirmDelete")}
                      onConfirm={() => del.mutate(ev.id)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <EventDialog open={open} onOpenChange={setOpen} initial={initial} />
    </div>
  );
}
