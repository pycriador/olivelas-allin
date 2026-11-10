import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({ component: LoginPage });

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(72),
  fullName: z.string().trim().min(1).max(100).optional(),
});
type FormVals = z.infer<typeof schema>;

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (session) navigate({ to: "/dashboard" }); }, [session, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormVals>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (vals: FormVals) => {
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: vals.email, password: vals.password,
        });
        if (error) throw error;
        toast.success(t("auth.welcome"));
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signUp({
          email: vals.email, password: vals.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: vals.fullName ?? "" },
          },
        });
        if (error) throw error;
        toast.success("✓ " + t("auth.welcomeNew"));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("auth.invalid");
      toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden overflow-hidden bg-brand lg:block">
        <div className="absolute inset-0 bg-aurora opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30" />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <Shield className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold">{t("app.name")}</span>
          </div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="font-display text-4xl font-bold leading-tight">
              {t("app.tagline")}
            </h2>
            <p className="mt-3 max-w-md text-sm text-white/80">
              {t("auth.welcomeSub")}
            </p>
          </motion.div>
          <div className="text-xs text-white/60">© {new Date().getFullYear()} {t("app.name")}</div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center bg-background px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <Card className="border-border/60 shadow-elevated p-8">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {mode === "signin" ? t("auth.welcome") : t("auth.welcomeNew")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin" ? t("auth.welcomeSub") : t("auth.welcomeNewSub")}
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                  <Input id="fullName" autoComplete="name" {...register("fullName")} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("common.email")}</Label>
                <Input id="email" type="email" autoComplete="email" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  {mode === "signin" && (
                    <Link to="/reset-password" className="text-xs text-primary hover:underline">{t("auth.forgot")}</Link>
                  )}
                </div>
                <Input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} {...register("password")} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-brand shadow-glow">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading
                  ? (mode === "signin" ? t("auth.signingIn") : t("auth.creating"))
                  : (mode === "signin" ? t("auth.signIn") : t("auth.signUp"))}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
              <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="font-medium text-primary hover:underline">
                {mode === "signin" ? t("auth.signUp") : t("auth.signIn")}
              </button>
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
