import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useTenantId } from "@/shared/hooks/use-tenant-id";
import { PageHeader } from "@/shared/components/page-header";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type Row = Database["public"]["Tables"]["appointment_types"]["Row"];

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "hex"),
  duration_minutes: z.coerce.number().int().min(5).max(600),
  active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/_authenticated/tipos-atendimento")({
  component: AppointmentTypesPage,
});

function AppointmentTypesPage() {
  const { t } = useTranslation();
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ["appointment_types", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("appointment_types").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointment_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(t("common.deleted")); qc.invalidateQueries({ queryKey: ["appointment_types"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.appointmentTypes")}
        subtitle={t("appointmentTypes.subtitle")}
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> {t("common.new")}
          </Button>
        }
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("appointmentTypes.fields.name")}</TableHead>
              <TableHead>{t("appointmentTypes.fields.color")}</TableHead>
              <TableHead>{t("appointmentTypes.fields.duration")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead className="w-[100px] text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t("common.loading")}</TableCell></TableRow>}
            {query.data?.length === 0 && !query.isLoading && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>}
            {query.data?.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 rounded" style={{ backgroundColor: r.color }} />
                    <span className="text-xs text-muted-foreground">{r.color}</span>
                  </div>
                </TableCell>
                <TableCell>{r.duration_minutes} min</TableCell>
                <TableCell>{r.active ? t("common.active") : t("common.inactive")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <ConfirmDialog title={t("common.confirmDelete")} description={r.name} onConfirm={() => del.mutateAsync(r.id)}
                      trigger={<Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <TypeDialog open={open} onOpenChange={setOpen} editing={editing} tenantId={tenantId} />
    </div>
  );
}

function TypeDialog({ open, onOpenChange, editing, tenantId }: {
  open: boolean; onOpenChange: (v: boolean) => void; editing: Row | null; tenantId: string | null;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: editing?.name ?? "",
      color: editing?.color ?? "#6366f1",
      duration_minutes: editing?.duration_minutes ?? 50,
      active: editing?.active ?? true,
    },
  });

  const mut = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!tenantId) throw new Error("tenant");
      const payload = { tenant_id: tenantId, ...values };
      if (editing) {
        const { error } = await supabase.from("appointment_types").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("appointment_types").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(t(editing ? "common.updated" : "common.created"));
      qc.invalidateQueries({ queryKey: ["appointment_types"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? t("appointmentTypes.edit") : t("appointmentTypes.new")}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="flex flex-col gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>{t("appointmentTypes.fields.name")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="color" render={({ field }) => (
                <FormItem><FormLabel>{t("appointmentTypes.fields.color")}</FormLabel>
                  <FormControl><Input type="color" {...field} className="h-10 w-full p-1" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="duration_minutes" render={({ field }) => (
                <FormItem><FormLabel>{t("appointmentTypes.fields.duration")}</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="active" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                <FormLabel className="mb-0">{t("common.active")}</FormLabel>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={mut.isPending}>{t("common.save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
