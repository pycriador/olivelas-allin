import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell, Divider } from "@/components/auth-layout";
import { GoogleLoginButton } from "@/components/google-login-button";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/supabase-errors";

const schema = z
  .object({
    name: z.string().trim().min(2, "Nome muito curto").max(80),
    email: z.string().min(1, "E-mail obrigatório").email("E-mail inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirm: z.string().min(1, "Confirme a senha"),
    accept: z.boolean().refine((v) => v, "Você precisa aceitar os termos"),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "As senhas não conferem",
  });
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { register, loginGoogle } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirm: "", accept: false },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await register(values.name, values.email, values.password);
      toast.success("Conta criada! Verifique seu e-mail se a confirmação estiver habilitada.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(friendlyAuthError(err));
    }
  });

  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Criar sua conta</CardTitle>
          <CardDescription>Preencha os dados para começar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" autoComplete="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input
                id="confirm"
                type={showPwd ? "text" : "password"}
                autoComplete="new-password"
                {...form.register("confirm")}
              />
              {form.formState.errors.confirm && (
                <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
              )}
            </div>
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={form.watch("accept")}
                onCheckedChange={(v) => form.setValue("accept", Boolean(v), { shouldValidate: true })}
              />
              <span>Aceito os termos de uso e a política de privacidade</span>
            </label>
            {form.formState.errors.accept && (
              <p className="text-xs text-destructive">{form.formState.errors.accept.message}</p>
            )}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar conta
            </Button>
          </form>

          <Divider />

          <GoogleLoginButton
            onClick={async () => {
              setGoogleLoading(true);
              try {
                await loginGoogle();
              } catch (e) {
                toast.error(friendlyAuthError(e));
                setGoogleLoading(false);
              }
            }}
            loading={googleLoading}
            variant="Continuar com Google"
          />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
