import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { loginSchema, type LoginFormValues } from "@/schemas/auth";
import { useLogin } from "@/features/auth/hooks/use-login";
import { GoogleIcon } from "@/components/icons/google";

export function LoginForm() {
  const { loginWithEmail, loginWithGoogle, isLoading, googleLoading } = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    await loginWithEmail(values.email, values.password);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Entrar no ClauseForge</h1>
        <p className="text-sm text-muted-foreground">
          Acesse sua conta para gerenciar seus projetos documentais.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => loginWithGoogle()}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <GoogleIcon className="mr-2 size-4" />
        )}
        Entrar com Google
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">ou continue com email</span>
        <Separator className="flex-1" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="email">Email</Label>
                <FormControl>
                  <Input
                    id="email"
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    to="/login"
                    search={{ view: "forgot" }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
                <FormControl>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Entrar
          </Button>
        </form>
      </Form>

      <Separator />

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem uma conta?{" "}
        <Link
          to="/login"
          search={{ view: "signup" }}
          className="font-medium text-primary hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}
