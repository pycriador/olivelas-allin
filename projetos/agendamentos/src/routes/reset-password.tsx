import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z.string().min(6).max(72),
    confirm: z.string().min(6).max(72),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords must match",
  });

function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      toast.error(t("auth.genericError"));
      return;
    }
    toast.success(t("auth.passwordUpdated"));
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="text-xl font-semibold">{t("auth.resetPassword")}</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.newPassword")}</Label>
              <Input id="password" type="password" {...form.register("password")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">{t("auth.confirmPassword")}</Label>
              <Input id="confirm" type="password" {...form.register("confirm")} />
              {form.formState.errors.confirm && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.confirm.message}
                </p>
              )}
            </div>
            <Button className="w-full" disabled={form.formState.isSubmitting}>
              {t("common.save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
