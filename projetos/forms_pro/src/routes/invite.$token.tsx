import { useEffect, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { useOrgStore } from "@/stores/org-store";
import { invitationsApi } from "@/services/org-service";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [
      { title: "Convite — IAM Pro Forms" },
      { name: "description", content: "Aceite seu convite e entre na organização no IAM Pro Forms." },
      { property: "og:title", content: "Convite — IAM Pro Forms" },
      { property: "og:description", content: "Você foi convidado para uma organização no IAM Pro Forms." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isHydrated, init } = useAuthStore();
  const { reload, setCurrent } = useOrgStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void init();
  }, [init]);

  const accept = async () => {
    setLoading(true);
    try {
      const org = await invitationsApi.accept(token);
      await reload();
      await setCurrent(org.id);
      toast.success(t("org.accept.success"));
      router.navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("org.accept.invalid"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-5 p-8 text-center">
          <div className="flex justify-center">
            <Logo size="sm" />
          </div>
          <MailCheck className="mx-auto h-8 w-8 text-muted-foreground" />
          <h1 className="text-xl font-semibold">{t("org.accept.title")}</h1>

          {!isHydrated ? (
            <p className="text-sm text-muted-foreground">{t("org.accept.loading")}</p>
          ) : !user ? (
            <>
              <p className="text-sm text-muted-foreground">{t("org.accept.signIn")}</p>
              <Button asChild className="w-full">
                <Link to="/login">{t("common.signIn")}</Link>
              </Button>
            </>
          ) : (
            <Button className="w-full" onClick={() => void accept()} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("org.accept.cta")}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
