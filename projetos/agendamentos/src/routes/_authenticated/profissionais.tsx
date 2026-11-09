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
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type Row = Database["public"]["Tables"]["professionals"]["Row"];

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  crp: z.string().trim().max(40).optional().or(z.literal("")),
  specialty: z.string().trim().max(120).optional().or(z.literal("")),
  agenda_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "hex"),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  default_session_minutes: z.coerce.number().int().min(5).max(600),
  default_interval_minutes: z.coerce.number().int().min(0).max(120),
  accepts_online: z.boolean(),
  accepts_in_person: z.boolean(),
  active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/_authenticated/profissionais")({
  component: ProfessionalsPage,
});

function ProfessionalsPage() {
  const { t } = useTranslation();
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ["professionals", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase.from("professionals").select("*").order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("professionals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(t("common.deleted")); qc.invalidateQueries({ queryKey: ["professionals"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.professionals")} subtitle={t("professionals.subtitle")}
        actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> {t("common.new")}</Button>} />
      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("professionals.fields.fullName")}</TableHead>
            <TableHead>{t("professionals.fields.crp")}</TableHead>
            <TableHead>{t("professionals.fields.specialty")}</TableHead>
            <TableHead>{t("professionals.fields.color")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead className="w-[100px] text-right">{t("common.actions")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {query.isLoading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t("common.loading")}</TableCell></TableRow>}
            {query.data?.length === 0 && !query.isLoading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>}
            {query.data?.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{r.crp ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{r.specialty ?? "—"}</TableCell>
                <TableCell><span className="inline-block h-4 w-4 rounded" style={{ backgroundColor: r.agenda_color }} /></TableCell>
                <TableCell>{r.active ? t("common.active") : t("common.inactive")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <ConfirmDialog title={t("common.confirmDelete")} description={r.full_name} onConfirm={() => del.mutateAsync(r.id)}
                      trigger={<Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <ProfessionalDialog open={open} onOpenChange={setOpen} editing={editing} tenantId={tenantId} />
    </div>
  );
}

function ProfessionalDialog({ open, onOpenChange, editing, tenantId }: {
  open: boolean; onOpenChange: (v: boolean) => void; editing: Row | null; tenantId: string | null;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      full_name: editing?.full_name ?? "",
      crp: editing?.crp ?? "",
      specialty: editing?.specialty ?? "",
      agenda_color: editing?.agenda_color ?? "#10b981",
      bio: editing?.bio ?? "",
      default_session_minutes: editing?.default_session_minutes ?? 50,
      default_interval_minutes: editing?.default_interval_minutes ?? 10,
      accepts_online: editing?.accepts_online ?? true,
      accepts_in_person: editing?.accepts_in_person ?? true,
      active: editing?.active ?? true,
    },
  });

  const mut = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!tenantId) throw new Error("tenant");
      const payload = {
        tenant_id: tenantId,
        full_name: values.full_name,
        crp: values.crp || null,
        specialty: values.specialty || null,
        agenda_color: values.agenda_color,
        bio: values.bio || null,
        default_session_minutes: values.default_session_minutes,
        default_interval_minutes: values.default_interval_minutes,
        accepts_online: values.accepts_online,
        accepts_in_person: values.accepts_in_person,
        active: values.active,
      };
      if (editing) {
        const { error } = await supabase.from("professionals").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("professionals").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(t(editing ? "common.updated" : "common.created"));
      qc.invalidateQueries({ queryKey: ["professionals"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{editing ? t("professionals.edit") : t("professionals.new")}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem className="sm:col-span-2"><FormLabel>{t("professionals.fields.fullName")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="crp" render={({ field }) => (
              <FormItem><FormLabel>{t("professionals.fields.crp")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="specialty" render={({ field }) => (
              <FormItem><FormLabel>{t("professionals.fields.specialty")}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="agenda_color" render={({ field }) => (
              <FormItem><FormLabel>{t("professionals.fields.color")}</FormLabel><FormControl><Input type="color" {...field} className="h-10 w-full p-1" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="default_session_minutes" render={({ field }) => (
              <FormItem><FormLabel>{t("professionals.fields.session")}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="default_interval_minutes" render={({ field }) => (
              <FormItem><FormLabel>{t("professionals.fields.interval")}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="accepts_online" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                <FormLabel className="mb-0">{t("professionals.fields.online")}</FormLabel>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="accepts_in_person" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                <FormLabel className="mb-0">{t("professionals.fields.inPerson")}</FormLabel>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="bio" render={({ field }) => (
              <FormItem className="sm:col-span-2"><FormLabel>{t("professionals.fields.bio")}</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="active" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-md border p-3 sm:col-span-2">
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
