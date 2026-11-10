import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const acceptSchema = z.object({ password: z.string().min(8) });
type AcceptValues = z.infer<typeof acceptSchema>;

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [
      { title: "Accept invitation — Nexus Data" },
      {
        name: "description",
        content: "Accept your invitation and join your organization on Nexus Data.",
      },
      { property: "og:title", content: "Accept invitation — Nexus Data" },
      {
        property: "og:description",
        content: "Accept your invitation and join your organization on Nexus Data.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const { t } = useTranslation();
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const form = useForm<AcceptValues>({
    resolver: zodResolver(acceptSchema),
    defaultValues: { password: "" },
  });

  const invitation = useQuery({
    queryKey: ["invitation", token],
    queryFn: async () =>
      (
        await supabase
          .from("invitations")
          .select("*, organizations(name)")
          .eq("token", token)
          .maybeSingle()
      ).data,
  });
  const inv = invitation.data;

  const accept = form.handleSubmit(async ({ password }) => {
    if (!inv) return;
    try {
      const { data: signup, error: signUpErr } = await supabase.auth.signUp({
        email: inv.email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (signUpErr && !signUpErr.message.toLowerCase().includes("already")) throw signUpErr;
      if (!signup?.session) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: inv.email,
          password,
        });
        if (signInErr) throw signInErr;
      }
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Sessão inválida");
      await supabase
        .from("organization_members")
        .upsert(
          { organization_id: inv.organization_id, user_id: user.user.id },
          { onConflict: "organization_id,user_id" },
        );
      await supabase
        .from("user_roles")
        .upsert(
          { organization_id: inv.organization_id, user_id: user.user.id, role: inv.role },
          { onConflict: "user_id,organization_id,role" },
        );
      await supabase
        .from("profiles")
        .update({ current_organization_id: inv.organization_id, status: "active" })
        .eq("id", user.user.id);
      await supabase
        .from("invitations")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", inv.id);
      await supabase.from("audit_logs").insert({
        organization_id: inv.organization_id,
        user_id: user.user.id,
        action: "invitation.accept",
        resource: "invitations",
        resource_id: inv.id,
      });
      toast.success(t("invite.accepted"));
      navigate({ to: "/" });
    } catch (e) {
      toast.error((e as Error).message);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("invite.title")}</CardTitle>
          {inv && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("invite.subtitle", { org: inv.organizations?.name ?? "" })}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {invitation.isLoading ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}...</p>
          ) : !inv ? (
            <p className="text-sm text-destructive">{t("invite.invalid")}</p>
          ) : inv.status !== "pending" ? (
            <Badge variant="outline" className="capitalize">
              {inv.status}
            </Badge>
          ) : new Date(inv.expires_at) < new Date() ? (
            <p className="text-sm text-destructive">{t("invite.expired")}</p>
          ) : (
            <>
              <form onSubmit={accept} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="invite-email">{t("auth.email")}</Label>
                  <Input id="invite-email" value={inv.email} disabled />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="invite-password">{t("auth.newPassword")}</Label>
                  <Input
                    id="invite-password"
                    type="password"
                    autoComplete="new-password"
                    {...form.register("password")}
                  />
                  {form.formState.errors.password && (
                    <p className="text-xs text-destructive">{t("errors.passwordShort")}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {t("invite.accept")}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
