import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth.service";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/auth-layout";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/supabase-errors";

const schema = z
  .object({
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirm: z.string().min(1, "Confirme a senha"),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "As senhas não conferem" });
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = async () => {
      const session = await authService.getSession();
      if (session) setReady(true);
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  const onSubmit = form.handleSubmit(async ({ password }) => {
    try {
      await updatePassword(password);
      toast.success("Senha atualizada. Faça login novamente.");
      await authService.logout();
      navigate({ to: "/login" });
    } catch (err) {
      toast.error(friendlyAuthError(err));
    }
  });

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nova senha</CardTitle>
          <CardDescription>Defina uma nova senha para sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          {!ready ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Validando link...
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <Input id="confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
                {form.formState.errors.confirm && (
                  <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Atualizar senha
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
