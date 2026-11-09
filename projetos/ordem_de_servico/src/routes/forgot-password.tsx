import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/auth-layout";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/supabase-errors";

const schema = z.object({
  email: z.string().min(1, "E-mail obrigatório").email("E-mail inválido"),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    try {
      await resetPassword(email);
      toast.success("Enviamos um e-mail com o link para redefinir sua senha.");
      form.reset();
    } catch (err) {
      toast.error(friendlyAuthError(err));
    }
  });

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recuperar acesso</CardTitle>
          <CardDescription>Enviaremos um link para redefinir a senha</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar link
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">
              Voltar para o login
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
