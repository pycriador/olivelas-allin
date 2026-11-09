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
import { useProfessionalsList } from "@/shared/hooks/use-agenda-data";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export type BlockRow = Database["public"]["Tables"]["blocks"]["Row"];
type BlockReason = Database["public"]["Enums"]["block_reason"];

const REASONS: BlockReason[] = ["vacation", "holiday", "sick_leave", "day_off", "training", "conference", "meeting", "manual"];
const NONE = "__none__";

const schema = z.object({
  title: z.string().trim().max(200).optional().or(z.literal("")),
  professional_id: z.string().uuid().nullable().optional(),
  reason: z.enum(["vacation", "holiday", "sick_leave", "day_off", "training", "conference", "meeting", "manual"]),
  all_day: z.boolean(),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  description: z.string().max(2000).optional().or(z.literal("")),
}).refine((v) => new Date(v.ends_at) > new Date(v.starts_at), {
  message: "End must be after start",
  path: ["ends_at"],
});
type FormValues = z.infer<typeof schema>;

export type BlockDialogInitial = Partial<Pick<BlockRow,
  "id" | "title" | "professional_id" | "reason" | "all_day" |
  "starts_at" | "ends_at" | "description"
>>;

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function BlockDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: BlockDialogInitial | null;
}) {
  const { t } = useTranslation();
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const pros = useProfessionalsList();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      professional_id: null,
      reason: "day_off",
      all_day: false,
      starts_at: "",
      ends_at: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      title: initial?.title ?? "",
      professional_id: initial?.professional_id ?? null,
      reason: (initial?.reason as BlockReason) ?? "day_off",
      all_day: initial?.all_day ?? false,
      starts_at: toLocalInput(initial?.starts_at),
      ends_at: toLocalInput(initial?.ends_at),
      description: initial?.description ?? "",
    });
  }, [open, initial, form]);

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!tenantId) throw new Error("No tenant");
      const payload = {
        tenant_id: tenantId,
        title: values.title?.trim() || null,
        professional_id: values.professional_id || null,
        reason: values.reason,
        all_day: values.all_day,
        starts_at: new Date(values.starts_at).toISOString(),
        ends_at: new Date(values.ends_at).toISOString(),
        description: values.description?.trim() || null,
      };
      if (initial?.id) {
        const { error } = await supabase.from("blocks").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blocks").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(initial?.id ? t("common.updated") : t("common.created"));
      qc.invalidateQueries({ queryKey: ["blocks"] });
      qc.invalidateQueries({ queryKey: ["agenda"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial?.id ? t("blocks.edit") : t("blocks.new")}</DialogTitle>
          <DialogDescription>{t("blocks.dialogDesc")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-3">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("blocks.fields.title")}</FormLabel>
                <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField control={form.control} name="professional_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("blocks.fields.professional")}</FormLabel>
                  <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>{t("blocks.clinicWide")}</SelectItem>
                      {(pros.data ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="reason" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("blocks.fields.reason")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {REASONS.map((r) => (
                        <SelectItem key={r} value={r}>{t(`blocks.reasons.${r}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="all_day" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border p-3">
                <FormLabel className="!m-0">{t("blocks.fields.allDay")}</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField control={form.control} name="starts_at" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("blocks.fields.startsAt")}</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="ends_at" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("blocks.fields.endsAt")}</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("blocks.fields.description")}</FormLabel>
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
