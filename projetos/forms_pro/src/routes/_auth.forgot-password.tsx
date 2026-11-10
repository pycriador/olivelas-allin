import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth-service";

export const Route = createFileRoute("/_auth/forgot-password")({
  head: () => ({ meta: [{ title: "Recuperar senha — IAM Pro Forms" }] }),
  component: ForgotPage,
});

const schema = z.object({ email: z.string().email("E-mail inválido") });

function ForgotPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const form = useForm<{ email: string }>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }: { email: string }) => {
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      toast.success(t("auth.resetSent"));
      form.reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-7 shadow-elegant">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("auth.forgotTitle")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("auth.forgotSubtitle")}</p>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("common.email")}</Label>
          <Input id="email" type="email" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("auth.sendResetLink")}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-foreground hover:underline">
          {t("common.signIn")}
        </Link>
      </p>
    </div>
  );
}
