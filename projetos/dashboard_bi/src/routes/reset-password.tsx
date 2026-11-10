import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Nexus Data" }] }),
  component: ResetPasswordPage,
});

const schema = z.object({ password: z.string().min(8) });

function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "" },
  });
  const onSubmit = form.handleSubmit(async ({ password }) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast.error(error.message);
    toast.success(t("errors.passwordUpdated"));
    navigate({ to: "/" });
  });
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <h1 className="mb-6 text-2xl font-semibold">{t("auth.resetPassword")}</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="np">{t("auth.newPassword")}</Label>
            <Input id="np" type="password" {...form.register("password")} />
          </div>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {t("auth.updatePassword")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
