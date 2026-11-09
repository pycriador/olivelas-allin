import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Building2, Palette, Save } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/shared/hooks/use-tenant-id";
import { useCurrentProfile } from "@/shared/hooks/use-current-profile";
import { PageHeader } from "@/shared/components/page-header";
import { SUPPORTED_LOCALES } from "@/shared/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: SettingsPage,
});

const TIMEZONES = [
  "America/Sao_Paulo", "America/Fortaleza", "America/Manaus", "America/Rio_Branco",
  "America/New_York", "America/Los_Angeles", "America/Mexico_City", "America/Bogota",
  "America/Buenos_Aires", "America/Santiago", "Europe/Lisbon", "Europe/Madrid",
  "Europe/London", "Europe/Paris", "UTC",
];

const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] as const;
const TIME_FORMATS = ["HH:mm", "hh:mm A"] as const;

const clinicSchema = z.object({
  name: z.string().trim().min(2).max(120),
  logo_url: z.string().trim().url().or(z.literal("")).optional(),
});

const prefsSchema = z.object({
  timezone: z.string().min(1),
  locale: z.enum(SUPPORTED_LOCALES),
  date_format: z.enum(DATE_FORMATS),
  time_format: z.enum(TIME_FORMATS),
});

type ClinicValues = z.infer<typeof clinicSchema>;
type PrefsValues = z.infer<typeof prefsSchema>;

function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("nav.settings")} subtitle={t("settings.subtitle")} />
      <Tabs defaultValue="clinic" className="w-full">
        <TabsList>
          <TabsTrigger value="clinic"><Building2 className="mr-2 h-4 w-4" />{t("settings.tabs.clinic")}</TabsTrigger>
          <TabsTrigger value="prefs"><Palette className="mr-2 h-4 w-4" />{t("settings.tabs.prefs")}</TabsTrigger>
        </TabsList>
        <TabsContent value="clinic" className="mt-4"><ClinicSection /></TabsContent>
        <TabsContent value="prefs" className="mt-4"><PreferencesSection /></TabsContent>
      </Tabs>
    </div>
  );
}

function ClinicSection() {
  const { t } = useTranslation();
  const tenantId = useTenantId();
  const { data: profile } = useCurrentProfile();
  const qc = useQueryClient();

  const form = useForm<ClinicValues>({
    resolver: zodResolver(clinicSchema),
    defaultValues: { name: "", logo_url: "" },
  });

  useEffect(() => {
    if (profile?.tenant) {
      form.reset({
        name: profile.tenant.name ?? "",
        logo_url: profile.tenant.logo_url ?? "",
      });
    }
  }, [profile?.tenant, form]);

  const mut = useMutation({
    mutationFn: async (values: ClinicValues) => {
      if (!tenantId) throw new Error("tenant");
      const logo = values.logo_url?.trim() || null;
      const { error: e1 } = await supabase
        .from("tenants")
        .update({ name: values.name, logo_url: logo })
        .eq("id", tenantId);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("tenant_settings")
        .update({ logo_url: logo })
        .eq("tenant_id", tenantId);
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success(t("common.updated"));
      qc.invalidateQueries({ queryKey: ["current-profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const logo = form.watch("logo_url");
  const name = form.watch("name");
  const initials = (name || "C").trim().slice(0, 2).toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.clinic.title")}</CardTitle>
        <CardDescription>{t("settings.clinic.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-lg">
                {logo ? <AvatarImage src={logo} alt={name} /> : null}
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="text-sm text-muted-foreground">{t("settings.clinic.logoPreview")}</div>
            </div>
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.clinicName")}</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="logo_url" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("settings.clinic.logoUrl")}</FormLabel>
                <FormControl><Input placeholder="https://..." {...field} value={field.value ?? ""} /></FormControl>
                <FormDescription>{t("settings.clinic.logoHint")}</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end">
              <Button type="submit" disabled={mut.isPending}>
                <Save className="h-4 w-4" /> {t("common.save")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function PreferencesSection() {
  const { t, i18n } = useTranslation();
  const tenantId = useTenantId();
  const qc = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["tenant_settings", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_settings").select("*").eq("tenant_id", tenantId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<PrefsValues>({
    resolver: zodResolver(prefsSchema),
    defaultValues: {
      timezone: "America/Sao_Paulo",
      locale: "pt-BR",
      date_format: "DD/MM/YYYY",
      time_format: "HH:mm",
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      form.reset({
        timezone: settingsQuery.data.timezone ?? "America/Sao_Paulo",
        locale: (settingsQuery.data.locale as PrefsValues["locale"]) ?? "pt-BR",
        date_format: (settingsQuery.data.date_format as PrefsValues["date_format"]) ?? "DD/MM/YYYY",
        time_format: (settingsQuery.data.time_format as PrefsValues["time_format"]) ?? "HH:mm",
      });
    }
  }, [settingsQuery.data, form]);

  const mut = useMutation({
    mutationFn: async (values: PrefsValues) => {
      if (!tenantId) throw new Error("tenant");
      const { error } = await supabase
        .from("tenant_settings")
        .update({
          timezone: values.timezone,
          locale: values.locale,
          date_format: values.date_format,
          time_format: values.time_format,
        })
        .eq("tenant_id", tenantId);
      if (error) throw error;
      const { error: e2 } = await supabase
        .from("tenants")
        .update({ timezone: values.timezone, locale: values.locale })
        .eq("id", tenantId);
      if (e2) throw e2;
    },
    onSuccess: (_d, values) => {
      toast.success(t("common.updated"));
      void i18n.changeLanguage(values.locale);
      qc.invalidateQueries({ queryKey: ["tenant_settings"] });
      qc.invalidateQueries({ queryKey: ["current-profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.prefs.title")}</CardTitle>
        <CardDescription>{t("settings.prefs.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="timezone" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("settings.prefs.timezone")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="locale" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("language.label")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {SUPPORTED_LOCALES.map((l) => <SelectItem key={l} value={l}>{t(`language.${l}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="date_format" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("settings.prefs.dateFormat")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {DATE_FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="time_format" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("settings.prefs.timeFormat")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {TIME_FORMATS.map((f) => (
                        <SelectItem key={f} value={f}>{f === "HH:mm" ? "24h (HH:mm)" : "12h (hh:mm AM/PM)"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={mut.isPending}>
                <Save className="h-4 w-4" /> {t("common.save")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
