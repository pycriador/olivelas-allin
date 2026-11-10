import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { LANGS } from "@/i18n";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const themes = [
    { v: "light", label: t("common.light"), icon: Sun },
    { v: "dark", label: t("common.dark"), icon: Moon },
    { v: "system", label: t("common.system"), icon: Monitor },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />
      <div className="grid max-w-3xl gap-4">
        <Card className="border-border/60 p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold">{t("settings.appearance")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("settings.appearanceDesc")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {themes.map((th) => (
              <Button key={th.v} variant={theme === th.v ? "default" : "outline"} onClick={() => setTheme(th.v)}
                className={theme === th.v ? "bg-brand" : ""}>
                <th.icon className="mr-2 h-4 w-4" /> {th.label}
              </Button>
            ))}
          </div>
        </Card>
        <Card className="border-border/60 p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold">{t("common.language")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("settings.languageDesc")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {LANGS.map((l) => (
              <Button key={l.code} variant={i18n.language === l.code ? "default" : "outline"}
                onClick={() => i18n.changeLanguage(l.code)} className={i18n.language === l.code ? "bg-brand" : ""}>
                <span className="mr-2">{l.flag}</span> {l.label}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
