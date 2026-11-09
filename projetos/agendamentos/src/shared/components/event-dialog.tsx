import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useTenantId } from "@/shared/hooks/use-tenant-id";
import {
  useAppointmentTypesList,
  useClientsList,
  useProfessionalsList,
} from "@/shared/hooks/use-agenda-data";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export type EventRow = Database["public"]["Tables"]["events"]["Row"];
type EventStatus = Database["public"]["Enums"]["event_status"];

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  professional_id: z.string().uuid().nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  appointment_type_id: z.string().uuid().nullable().optional(),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]),
  description: z.string().max(2000).optional().or(z.literal("")),
}).refine((v) => new Date(v.ends_at) > new Date(v.starts_at), {
  message: "End must be after start",
  path: ["ends_at"],
});
type FormValues = z.infer<typeof schema>;

export type EventDialogInitial = Partial<Pick<EventRow,
  "id" | "title" | "professional_id" | "client_id" | "appointment_type_id" |
  "starts_at" | "ends_at" | "status" | "description"
>>;

const NONE = "__none__";
const STATUSES: EventStatus[] = ["scheduled", "confirmed", "completed", "cancelled", "no_show"];

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: EventDialogInitial | null;
  onSaved?: () => void;
}) {
  const { t } = useTranslation();
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const pros = useProfessionalsList();
  const clients = useClientsList();
  const types = useAppointmentTypesList();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      professional_id: null,
      client_id: null,
      appointment_type_id: null,
      starts_at: "",
      ends_at: "",
      status: "scheduled",
      description: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      title: initial?.title ?? "",
      professional_id: initial?.professional_id ?? null,
      client_id: initial?.client_id ?? null,
      appointment_type_id: initial?.appointment_type_id ?? null,
      starts_at: toLocalInput(initial?.starts_at),
      ends_at: toLocalInput(initial?.ends_at),
      status: (initial?.status as EventStatus) ?? "scheduled",
      description: initial?.description ?? "",
    });
  }, [open, initial, form]);

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!tenantId) throw new Error("No tenant");
      const payload = {
        tenant_id: tenantId,
        title: values.title.trim(),
        professional_id: values.professional_id || null,
        client_id: values.client_id || null,
        appointment_type_id: values.appointment_type_id || null,
        starts_at: new Date(values.starts_at).toISOString(),
        ends_at: new Date(values.ends_at).toISOString(),
        status: values.status,
        description: values.description?.trim() || null,
      };
      if (initial?.id) {
        const { error } = await supabase.from("events").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(initial?.id ? t("common.updated") : t("common.created"));
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["agenda"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onOpenChange(false);
      onSaved?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial?.id ? t("events.edit") : t("events.new")}</DialogTitle>
          <DialogDescription>{t("events.dialogDesc")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-3">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("events.fields.title")}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField control={form.control} name="starts_at" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("events.fields.startsAt")}</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="ends_at" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("events.fields.endsAt")}</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField control={form.control} name="professional_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("events.fields.professional")}</FormLabel>
                  <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>—</SelectItem>
                      {(pros.data ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="client_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("events.fields.client")}</FormLabel>
                  <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>—</SelectItem>
                      {(clients.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField control={form.control} name="appointment_type_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("events.fields.appointmentType")}</FormLabel>
                  <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>—</SelectItem>
                      {(types.data ?? []).map((tp) => (
                        <SelectItem key={tp.id} value={tp.id}>{tp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.status")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{t(`events.status.${s}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("events.fields.description")}</FormLabel>
                <FormControl><Textarea rows={3} {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={save.isPending}>{t("common.save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
