import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { toast } from "sonner";

const profileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  display_name: z.string().min(2),
  job_title: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({ password: z.string().min(8) });
type PasswordValues = z.infer<typeof passwordSchema>;

export const Route = createFileRoute("/_authenticated/profile")({ component: Page });

function Page() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { roles } = usePermissions();
  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () =>
      (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      display_name: "",
      job_title: "",
      department: "",
      phone: "",
    },
  });
  useEffect(() => {
    if (!profile.data) return;
    form.reset({
      first_name: profile.data.first_name ?? "",
      last_name: profile.data.last_name ?? "",
      display_name: profile.data.display_name ?? profile.data.full_name ?? "",
      job_title: profile.data.job_title ?? "",
      department: profile.data.department ?? "",
      phone: profile.data.phone ?? "",
    });
  }, [profile.data, form]);

  const save = useMutation({
    mutationFn: async (values: ProfileValues) => {
      if (!user) throw new Error("no user");
      const { error } = await supabase.from("profiles").update(values).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("profile.saved"));
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });
  const changePass = useMutation({
    mutationFn: async (values: PasswordValues) => {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("errors.passwordUpdated"));
      passwordForm.reset({ password: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t("pages.profile.title")} subtitle={t("pages.profile.subtitle")} />
      <Card className="mb-6">
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-lg font-semibold">{form.watch("display_name") || user?.email}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {roles.map((r) => (
                <Badge key={r} variant="secondary" className="capitalize">
                  {r}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">{t("profile.tabs.info")}</TabsTrigger>
          <TabsTrigger value="security">{t("profile.tabs.security")}</TabsTrigger>
          <TabsTrigger value="permissions">{t("profile.tabs.permissions")}</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>{t("profile.info")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit((values) => save.mutate(values))}
                className="grid gap-4 md:grid-cols-2"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="first-name">{t("profile.firstName")}</Label>
                  <Input id="first-name" {...form.register("first_name")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last-name">{t("profile.lastName")}</Label>
                  <Input id="last-name" {...form.register("last_name")} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="display-name">{t("profile.displayName")}</Label>
                  <Input id="display-name" {...form.register("display_name")} />
                  {form.formState.errors.display_name && (
                    <p className="text-xs text-destructive">{t("errors.required")}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="job-title">{t("profile.jobTitle")}</Label>
                  <Input id="job-title" {...form.register("job_title")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="department">{t("profile.department")}</Label>
                  <Input id="department" {...form.register("department")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">{t("profile.phone")}</Label>
                  <Input id="phone" {...form.register("phone")} />
                </div>
                <div className="flex justify-end md:col-span-2">
                  <Button type="submit" disabled={save.isPending}>
                    {t("common.save")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>{t("profile.security")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={passwordForm.handleSubmit((values) => changePass.mutate(values))}
                className="max-w-md space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">{t("auth.newPassword")}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    {...passwordForm.register("password")}
                  />
                  {passwordForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{t("errors.passwordShort")}</p>
                  )}
                </div>
                <Button type="submit" disabled={changePass.isPending}>
                  {t("auth.updatePassword")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>{t("profile.permissions")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {roles.length ? (
                  roles.map((r) => (
                    <Badge key={r} variant="default" className="capitalize">
                      {r}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
