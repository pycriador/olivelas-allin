import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Database, Loader2, ShieldCheck, Sparkles, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Nexus Data" },
      { name: "description", content: "Sign in or create an account on Nexus Data." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup" | "forgot">("login");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: pitch */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-accent p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px, 60px 60px",
          }}
        />
        <div className="relative flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <Database className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">{t("app.name")}</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative max-w-lg"
        >
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            {t("auth.pitchTitle")}
          </h1>
          <p className="mt-4 text-primary-foreground/85">{t("auth.pitchDesc")}</p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              { icon: ShieldCheck, text: t("auth.benefits.one") },
              { icon: LayoutGrid, text: t("auth.benefits.two") },
              { icon: Sparkles, text: t("auth.benefits.three") },
            ].map((b, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15 backdrop-blur">
                  <b.icon className="h-4 w-4" />
                </span>
                {b.text}
              </li>
            ))}
          </ul>
        </motion.div>
        <div className="relative text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} {t("app.name")} · {t("app.tagline")}
        </div>
      </div>

      {/* Right: forms */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-md border-none p-8 shadow-none">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Database className="h-4 w-4" />
            </div>
            <span className="font-semibold">{t("app.name")}</span>
          </div>

          {tab === "forgot" ? (
            <ForgotForm onBack={() => setTab("login")} />
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
                <TabsTrigger value="signup">{t("auth.signup")}</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-6">
                <LoginForm onForgot={() => setTab("forgot")} />
              </TabsContent>
              <TabsContent value="signup" className="mt-6">
                <SignupForm />
              </TabsContent>
            </Tabs>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:underline">
              ← Home
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function LoginForm({ onForgot }: { onForgot: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const onSubmit = form.handleSubmit(async (values) => {
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) return toast.error(t("errors.signInFailed"));
    navigate({ to: "/" });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">{t("auth.welcome")}</h2>
      <div className="space-y-2">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...form.register("password")}
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onForgot}
          className="text-muted-foreground hover:text-foreground hover:underline"
        >
          {t("auth.forgotPassword")}
        </button>
      </div>
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("auth.login")}
      </Button>
      <SocialButtons />
    </form>
  );
}

const signupSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

function SignupForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });
  const onSubmit = form.handleSubmit(async (values) => {
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: values.fullName },
      },
    });
    if (error) return toast.error(t("errors.signUpFailed"));
    navigate({ to: "/" });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">{t("auth.createAccount")}</h2>
      <div className="space-y-2">
        <Label htmlFor="name">{t("auth.fullName")}</Label>
        <Input id="name" {...form.register("fullName")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">{t("errors.passwordShort")}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("auth.signup")}
      </Button>
      <SocialButtons />
    </form>
  );
}

const forgotSchema = z.object({ email: z.string().email() });

function ForgotForm({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const form = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });
  const onSubmit = form.handleSubmit(async (values) => {
    await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    toast.success(t("errors.resetSent"));
    onBack();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">{t("auth.resetPassword")}</h2>
      <div className="space-y-2">
        <Label htmlFor="femail">{t("auth.email")}</Label>
        <Input id="femail" type="email" {...form.register("email")} />
      </div>
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("auth.sendResetLink")}
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
        {t("auth.backToLogin")}
      </Button>
    </form>
  );
}

function SocialButtons() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(t("errors.signInFailed"));
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch {
      toast.error(t("errors.signInFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t("auth.orContinueWith")}
          </span>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={signInWithGoogle}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon className="mr-2 h-4 w-4" />
        )}
        Google
      </Button>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.2h6.6c-.1 1.1-.8 2.7-2.3 3.8l-.1.1 3.4 2.6.2.1c2.1-2 3.7-4.9 3.7-8.6"
      />
      <path
        fill="#34A853"
        d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.6-2.8c-1 .7-2.3 1.2-4 1.2a7 7 0 0 1-6.6-4.8H2l-.1.1C3.8 21 7.6 24 12 24"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.8A7 7 0 0 1 5 12c0-1 .2-1.9.4-2.8V9.1H1.8A11.9 11.9 0 0 0 .5 12c0 1.9.5 3.7 1.3 5.2z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c2 0 3.4.9 4.2 1.6l3.1-3C17.7 1.7 15.1.5 12 .5 7.6.5 3.8 3.5 1.8 7.5l3.6 2.8A7 7 0 0 1 12 4.8"
      />
    </svg>
  );
}
