import { useMemo, useState } from "react";
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
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type Row = Database["public"]["Tables"]["schedules"]["Row"];

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

const schema = z.object({
  professional_id: z.string().uuid(),
  schedule_group_id: z.string().uuid().nullable().optional(),
  weekday: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  interval_minutes: z.coerce.number().int().min(5).max(240),
  active: z.boolean(),
}).refine((v) => v.start_time < v.end_time, { message: "start<end", path: ["end_time"] });
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/_authenticated/horarios")({
  component: SchedulesPage,
});

function SchedulesPage() {
  const { t } = useTranslation();
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const [profFilter, setProfFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);

  const professionals = useQuery({
    queryKey: ["professionals-lookup", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("professionals").select("id, full_name").order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const groups = useQuery({
    queryKey: ["schedule_groups-lookup", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("schedule_groups").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const query = useQuery({
    queryKey: ["schedules", tenantId, profFilter],
    enabled: !!tenantId,
    queryFn: async () => {
      let q = supabase.from("schedules").select("*").order("weekday").order("start_time");
      if (profFilter !== "all") q = q.eq("professional_id", profFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(t("common.deleted")); qc.invalidateQueries({ queryKey: ["schedules"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const profMap = useMemo(() => new Map(professionals.data?.map((p) => [p.id, p.full_name])), [professionals.data]);
  const groupMap = useMemo(() => new Map(groups.data?.map((g) => [g.id, g.name])), [groups.data]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.schedules")} subtitle={t("schedules.subtitle")}
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }} disabled={!professionals.data?.length}>
          <Plus className="h-4 w-4" /> {t("common.new")}
        </Button>} />
      <div className="max-w-xs">
        <Select value={profFilter} onValueChange={setProfFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("schedules.allProfessionals")}</SelectItem>
            {professionals.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("schedules.fields.professional")}</TableHead>
            <TableHead>{t("schedules.fields.weekday")}</TableHead>
            <TableHead>{t("schedules.fields.start")}</TableHead>
            <TableHead>{t("schedules.fields.end")}</TableHead>
            <TableHead>{t("schedules.fields.interval")}</TableHead>
            <TableHead>{t("schedules.fields.group")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead className="w-[100px] text-right">{t("common.actions")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {query.isLoading && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">{t("common.loading")}</TableCell></TableRow>}
            {query.data?.length === 0 && !query.isLoading && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>}
            {query.data?.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{profMap.get(r.professional_id) ?? "—"}</TableCell>
                <TableCell>{t(`schedules.weekdays.${r.weekday}`)}</TableCell>
                <TableCell>{r.start_time.slice(0, 5)}</TableCell>
                <TableCell>{r.end_time.slice(0, 5)}</TableCell>
                <TableCell>{r.interval_minutes} min</TableCell>
                <TableCell className="text-muted-foreground">{r.schedule_group_id ? groupMap.get(r.schedule_group_id) ?? "—" : "—"}</TableCell>
                <TableCell>{r.active ? t("common.active") : t("common.inactive")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <ConfirmDialog title={t("common.confirmDelete")} onConfirm={() => del.mutateAsync(r.id)}
                      trigger={<Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <ScheduleDialog open={open} onOpenChange={setOpen} editing={editing} tenantId={tenantId}
        professionals={professionals.data ?? []} groups={groups.data ?? []} defaultProf={profFilter !== "all" ? profFilter : undefined} />
    </div>
  );
}

function ScheduleDialog({ open, onOpenChange, editing, tenantId, professionals, groups, defaultProf }: {
  open: boolean; onOpenChange: (v: boolean) => void; editing: Row | null; tenantId: string | null;
  professionals: { id: string; full_name: string }[];
  groups: { id: string; name: string }[];
  defaultProf?: string;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      professional_id: editing?.professional_id ?? defaultProf ?? professionals[0]?.id ?? "",
      schedule_group_id: editing?.schedule_group_id ?? null,
      weekday: editing?.weekday ?? 1,
      start_time: editing?.start_time?.slice(0, 5) ?? "08:00",
      end_time: editing?.end_time?.slice(0, 5) ?? "18:00",
      interval_minutes: editing?.interval_minutes ?? 50,
      active: editing?.active ?? true,
    },
  });

  const mut = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!tenantId) throw new Error("tenant");
      const payload = {
        tenant_id: tenantId,
        professional_id: values.professional_id,
        schedule_group_id: values.schedule_group_id || null,
        weekday: values.weekday,
        start_time: values.start_time,
        end_time: values.end_time,
        interval_minutes: values.interval_minutes,
        active: values.active,
      };
      if (editing) {
        const { error } = await supabase.from("schedules").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("schedules").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(t(editing ? "common.updated" : "common.created"));
      qc.invalidateQueries({ queryKey: ["schedules"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{editing ? t("schedules.edit") : t("schedules.new")}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="professional_id" render={({ field }) => (
              <FormItem className="sm:col-span-2"><FormLabel>{t("schedules.fields.professional")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{professionals.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="weekday" render={({ field }) => (
              <FormItem><FormLabel>{t("schedules.fields.weekday")}</FormLabel>
                <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{WEEKDAYS.map((w) => <SelectItem key={w} value={String(w)}>{t(`schedules.weekdays.${w}`)}</SelectItem>)}</SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="schedule_group_id" render={({ field }) => (
              <FormItem><FormLabel>{t("schedules.fields.group")}</FormLabel>
                <Select value={field.value ?? "__none"} onValueChange={(v) => field.onChange(v === "__none" ? null : v)}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="__none">—</SelectItem>
                    {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="start_time" render={({ field }) => (
              <FormItem><FormLabel>{t("schedules.fields.start")}</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="end_time" render={({ field }) => (
              <FormItem><FormLabel>{t("schedules.fields.end")}</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="interval_minutes" render={({ field }) => (
              <FormItem><FormLabel>{t("schedules.fields.interval")}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="active" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                <FormLabel className="mb-0">{t("common.active")}</FormLabel>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={mut.isPending}>{t("common.save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
