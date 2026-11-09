import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LanguageSwitcher } from "@/shared/components/language-switcher";
import { ThemeSwitcher } from "@/shared/components/theme-switcher";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — ClinicFlow" },
      { name: "description", content: "Acesse sua conta ClinicFlow." },
    ],
  }),
  component: AuthPage,
});

const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

const signUpSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  clinic_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(6).max(72),
});

function AuthPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="relative hidden bg-gradient-to-br from-primary/90 via-primary to-primary/70 p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-foreground/15">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">{t("app.name")}</span>
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold leading-tight">
            {t("app.tagline")}
          </h2>
          <p className="text-sm text-primary-foreground/80">
            Agenda, clientes, profissionais, bloqueios e configurações em uma
            plataforma preparada para escala.
          </p>
        </div>
        <div className="text-xs text-primary-foreground/70">© ClinicFlow</div>
      </div>

      <div className="flex flex-col p-6 sm:p-10">
        <div className="flex justify-end gap-1">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                {tab === "signin" ? t("auth.signInTitle") : t("auth.signUpTitle")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {tab === "signin" ? t("auth.signInSubtitle") : t("auth.signUpSubtitle")}
              </p>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
                  <TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
                </TabsList>
                <TabsContent value="signin" className="mt-4">
                  <SignInForm />
                </TabsContent>
                <TabsContent value="signup" className="mt-4">
                  <SignUpForm />
                </TabsContent>
              </Tabs>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  ou
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <GoogleSignInButton />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Não foi possível entrar com o Google.");
        return;
      }
      if (result.redirected) return;
      window.location.href = "/dashboard";
    } catch {
      toast.error("Não foi possível entrar com o Google.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={onClick}
      disabled={loading}
    >
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.24 1.42-1.72 4.16-5.5 4.16-3.31 0-6.01-2.74-6.01-6.12S8.69 6.02 12 6.02c1.88 0 3.15.8 3.87 1.49l2.64-2.54C16.83 3.42 14.63 2.5 12 2.5 6.98 2.5 2.9 6.58 2.9 11.6S6.98 20.7 12 20.7c5.3 0 8.8-3.72 8.8-8.96 0-.6-.06-1.06-.15-1.54H12z"
        />
      </svg>
      Continuar com Google
    </Button>
  );
}

function SignInForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof signInSchema>) {
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      toast.error(t("auth.invalidCredentials"));
      return;
    }
    toast.success(t("auth.signedIn"));
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Link
            to="/forgot-password"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t("auth.forgotPassword")}
          </Link>
        </div>
        <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
      </div>
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {t("auth.signIn")}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { full_name: "", clinic_name: "", email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof signUpSchema>) {
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: values.full_name,
          clinic_name: values.clinic_name,
          locale: i18n.language,
        },
      },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("auth.accountCreated"));
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="clinic_name">{t("auth.clinicName")}</Label>
        <Input id="clinic_name" {...form.register("clinic_name")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="full_name">{t("auth.fullName")}</Label>
        <Input id="full_name" autoComplete="name" {...form.register("full_name")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-email">{t("auth.email")}</Label>
        <Input id="su-email" type="email" autoComplete="email" {...form.register("email")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-password">{t("auth.password")}</Label>
        <Input id="su-password" type="password" autoComplete="new-password" {...form.register("password")} />
      </div>
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {t("auth.signUp")}
      </Button>
    </form>
  );
}
