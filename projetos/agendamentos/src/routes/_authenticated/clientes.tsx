import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
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
import { Badge } from "@/components/ui/badge";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type ClientStatus = Database["public"]["Enums"]["client_status"];

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  cpf: z.string().trim().max(20).optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  guardian_name: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "archived"]),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/_authenticated/clientes")({
  component: ClientsPage,
});

function ClientsPage() {
  const { t } = useTranslation();
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Client | null>(null);
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ["clients", tenantId, search],
    enabled: !!tenantId,
    queryFn: async () => {
      let q = supabase.from("clients").select("*").order("full_name");
      if (search.trim()) q = q.ilike("full_name", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("common.deleted"));
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("nav.clients")}
        subtitle={t("clients.subtitle")}
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> {t("common.new")}
          </Button>
        }
      />
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.search")} className="pl-8" />
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("clients.fields.fullName")}</TableHead>
              <TableHead>{t("clients.fields.email")}</TableHead>
              <TableHead>{t("clients.fields.phone")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead className="w-[100px] text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t("common.loading")}</TableCell></TableRow>
            )}
            {query.data?.length === 0 && !query.isLoading && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
            )}
            {query.data?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                <TableCell><StatusBadge status={c.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <ConfirmDialog
                      title={t("common.confirmDelete")}
                      description={c.full_name}
                      onConfirm={() => del.mutateAsync(c.id)}
                      trigger={<Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ClientDialog open={open} onOpenChange={setOpen} editing={editing} tenantId={tenantId} />
    </div>
  );
}

function StatusBadge({ status }: { status: ClientStatus }) {
  const { t } = useTranslation();
  const variant = status === "active" ? "default" : status === "inactive" ? "secondary" : "outline";
  return <Badge variant={variant}>{t(`clients.status.${status}`)}</Badge>;
}

function ClientDialog({
  open, onOpenChange, editing, tenantId,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; editing: Client | null; tenantId: string | null;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      full_name: editing?.full_name ?? "",
      email: editing?.email ?? "",
      phone: editing?.phone ?? "",
      cpf: editing?.cpf ?? "",
      birth_date: editing?.birth_date ?? "",
      guardian_name: editing?.guardian_name ?? "",
      notes: editing?.notes ?? "",
      status: (editing?.status ?? "active") as ClientStatus,
    },
  });

  const mut = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!tenantId) throw new Error("tenant");
      const payload = {
        tenant_id: tenantId,
        full_name: values.full_name,
        email: values.email || null,
        phone: values.phone || null,
        cpf: values.cpf || null,
        birth_date: values.birth_date || null,
        guardian_name: values.guardian_name || null,
        notes: values.notes || null,
        status: values.status,
      };
      if (editing) {
        const { error } = await supabase.from("clients").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(t(editing ? "common.updated" : "common.created"));
      qc.invalidateQueries({ queryKey: ["clients"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? t("clients.edit") : t("clients.new")}</DialogTitle>
          <DialogDescription>{t("clients.dialogDesc")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>{t("clients.fields.fullName")}</FormLabel>
                <FormControl><Input {...field} /></FormControl><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>{t("clients.fields.email")}</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem><FormLabel>{t("clients.fields.phone")}</FormLabel>
                <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="cpf" render={({ field }) => (
              <FormItem><FormLabel>{t("clients.fields.cpf")}</FormLabel>
                <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="birth_date" render={({ field }) => (
              <FormItem><FormLabel>{t("clients.fields.birthDate")}</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="guardian_name" render={({ field }) => (
              <FormItem className="sm:col-span-2"><FormLabel>{t("clients.fields.guardian")}</FormLabel>
                <FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem><FormLabel>{t("common.status")}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="active">{t("clients.status.active")}</SelectItem>
                    <SelectItem value="inactive">{t("clients.status.inactive")}</SelectItem>
                    <SelectItem value="archived">{t("clients.status.archived")}</SelectItem>
                  </SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem className="sm:col-span-2"><FormLabel>{t("clients.fields.notes")}</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
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
