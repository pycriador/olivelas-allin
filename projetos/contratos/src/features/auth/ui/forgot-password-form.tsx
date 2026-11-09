import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/schemas/auth";
import { useResetPassword } from "@/features/auth/hooks/use-reset-password";

export function ForgotPasswordForm() {
  const { sendReset, isLoading, sent } = useResetPassword();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    await sendReset(values.email);
  };

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-6" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Verifique seu email</h1>
          <p className="text-sm text-muted-foreground">
            Enviamos as instruções de recuperação de senha para seu email.
          </p>
        </div>
        <Link to="/login" search={{ view: "login" }}>
          <Button variant="outline" className="w-full">
            Voltar para o login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Recuperar senha</h1>
        <p className="text-sm text-muted-foreground">
          Informe seu email e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="reset-email">Email</Label>
                <FormControl>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="voce@empresa.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Enviar instruções
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link
          to="/login"
          search={{ view: "login" }}
          className="font-medium text-primary hover:underline"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
