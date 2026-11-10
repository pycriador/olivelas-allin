import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { logAudit } from "@/lib/audit";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const orgSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  primary_color: z.string().min(4),
  default_locale: z.enum(["pt-BR", "en", "es"]),
  timezone: z.string().min(2),
  date_format: z.string().min(2),
  currency_format: z.string().min(2),
});
type OrgFormValues = z.infer<typeof orgSchema>;

export function AdminOrgTab() {
  const { t } = useTranslation();
  const { org } = useCurrentOrg();
  const qc = useQueryClient();
  const form = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: "",
      description: "",
      primary_color: "#6366f1",
      default_locale: "pt-BR",
      timezone: "America/Sao_Paulo",
      date_format: "DD/MM/YYYY",
      currency_format: "BRL",
    },
  });

  useEffect(() => {
    if (!org) return;
    form.reset({
      name: org.name ?? "",
      description: org.description ?? "",
      primary_color: org.primary_color ?? "#6366f1",
      default_locale: (org.default_locale as OrgFormValues["default_locale"]) ?? "pt-BR",
      timezone: org.timezone ?? "America/Sao_Paulo",
      date_format: org.date_format ?? "DD/MM/YYYY",
      currency_format: org.currency_format ?? "BRL",
    });
  }, [org, form]);

  const save = useMutation({
    mutationFn: async (values: OrgFormValues) => {
      if (!org) throw new Error("no org");
      const { error } = await supabase.from("organizations").update(values).eq("id", org.id);
      if (error) throw error;
      await logAudit({
        organizationId: org.id,
        action: "org.update",
        resource: "organizations",
        resourceId: org.id,
      });
    },
    onSuccess: () => {
      toast.success(t("admin.org.saved"));
      qc.invalidateQueries({ queryKey: ["current-org"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.org.title")}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.org.subtitle")}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit((values) => save.mutate(values))}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="org-name">{t("admin.org.name")}</Label>
              <Input id="org-name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{t("errors.required")}</p>
              )}
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="org-description">{t("admin.org.description")}</Label>
              <Textarea id="org-description" {...form.register("description")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-color">{t("admin.org.primaryColor")}</Label>
              <Input
                id="org-color"
                type="color"
                {...form.register("primary_color")}
                className="h-10 w-24"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-locale">{t("admin.org.locale")}</Label>
              <Select
                value={form.watch("default_locale")}
                onValueChange={(v) =>
                  form.setValue("default_locale", v as OrgFormValues["default_locale"], {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="org-locale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (BR)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-timezone">{t("admin.org.timezone")}</Label>
              <Input id="org-timezone" {...form.register("timezone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-date-format">{t("admin.org.dateFormat")}</Label>
              <Input id="org-date-format" {...form.register("date_format")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-currency">{t("admin.org.currency")}</Label>
              <Input id="org-currency" {...form.register("currency_format")} />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={save.isPending}>
              {t("common.save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
