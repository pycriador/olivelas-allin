import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({ component: ResetPage });

function ResetPage() {
  const { t } = useTranslation();
  const [recovery, setRecovery] = useState(false);
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) setRecovery(true);
  }, []);

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success(t("auth.resetSent"));
  };

  const updatePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success(t("auth.updated"));
  };

  return (
    <div className="grid min-h-screen place-items-center bg-aurora px-6">
      <Card className="w-full max-w-sm p-8 shadow-elevated">
        <h1 className="font-display text-2xl font-bold">
          {recovery ? t("auth.setNewPassword") : t("auth.resetTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{!recovery && t("auth.resetSub")}</p>

        {recovery ? (
          <form onSubmit={updatePwd} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pwd">{t("auth.password")}</Label>
              <Input id="pwd" type="password" required minLength={6} value={pwd} onChange={(e) => setPwd(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-brand">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("auth.update")}
            </Button>
          </form>
        ) : (
          <form onSubmit={sendLink} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-brand">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.confirm")}
            </Button>
          </form>
        )}
        <Link to="/login" className="mt-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> {t("auth.backToLogin")}
        </Link>
      </Card>
    </div>
  );
}
