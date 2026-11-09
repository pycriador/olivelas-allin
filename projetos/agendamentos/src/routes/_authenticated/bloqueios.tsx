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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/shared/components/page-header";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { BlockDialog, type BlockDialogInitial, type BlockRow } from "@/shared/components/block-dialog";

export const Route = createFileRoute("/_authenticated/bloqueios")({
  component: BlocksPage,
});

function BlocksPage() {
  const { t } = useTranslation();
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const pros = useProfessionalsList();
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<BlockDialogInitial | null>(null);

  const query = useQuery({
    queryKey: ["blocks", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("blocks").select("*").order("starts_at", { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as BlockRow[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("common.deleted"));
      qc.invalidateQueries({ queryKey: ["blocks"] });
      qc.invalidateQueries({ queryKey: ["agenda"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.blocks")}
        subtitle={t("blocks.subtitle")}
        actions={
          <Button onClick={() => { setInitial(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> {t("blocks.new")}
          </Button>
        }
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("blocks.fields.title")}</TableHead>
              <TableHead>{t("blocks.fields.reason")}</TableHead>
              <TableHead>{t("blocks.fields.professional")}</TableHead>
              <TableHead>{t("blocks.fields.startsAt")}</TableHead>
              <TableHead>{t("blocks.fields.endsAt")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t("common.loading")}</TableCell></TableRow>
            ) : (query.data ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
            ) : (query.data ?? []).map((b) => {
              const pro = (pros.data ?? []).find((p) => p.id === b.professional_id);
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.title ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline">{t(`blocks.reasons.${b.reason}`)}</Badge></TableCell>
                  <TableCell>{pro?.full_name ?? t("blocks.clinicWide")}</TableCell>
                  <TableCell>{dayjs(b.starts_at).format("DD/MM/YYYY HH:mm")}</TableCell>
                  <TableCell>{dayjs(b.ends_at).format("DD/MM/YYYY HH:mm")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setInitial(b); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <ConfirmDialog
                      trigger={<Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>}
                      title={t("common.confirmDelete")}
                      onConfirm={() => del.mutate(b.id)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <BlockDialog open={open} onOpenChange={setOpen} initial={initial} />
    </div>
  );
}
