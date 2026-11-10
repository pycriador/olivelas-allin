import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Monitor, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme-provider";
import { SUPPORTED_LANGS, type SupportedLang } from "@/i18n";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Configurações — IAM Pro Forms" }] }),
  component: SettingsPage,
});

const LANG_LABELS: Record<SupportedLang, string> = {
  "pt-BR": "Português (Brasil)",
  en: "English",
  es: "Español",
};

function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const options = [
    { v: "light" as const, label: t("settings.light"), Icon: Sun },
    { v: "dark" as const, label: t("settings.dark"), Icon: Moon },
    { v: "system" as const, label: t("settings.system"), Icon: Monitor },
  ];

  const current = (SUPPORTED_LANGS.find((l) => i18n.language?.startsWith(l)) ??
    "pt-BR") as SupportedLang;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t("settings.appearance")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("settings.appearanceDesc")}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {options.map(({ v, label, Icon }) => (
              <button
                key={v}
                type="button"
                onClick={() => setTheme(v)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition",
                  theme === v
                    ? "border-primary bg-accent shadow-sm"
                    : "hover:border-foreground/20 hover:bg-accent/50",
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t("settings.language")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("settings.languageDesc")}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {SUPPORTED_LANGS.map((lng) => (
              <button
                key={lng}
                type="button"
                onClick={() => i18n.changeLanguage(lng)}
                className={cn(
                  "rounded-xl border p-4 text-left text-sm font-medium transition",
                  current === lng
                    ? "border-primary bg-accent shadow-sm"
                    : "hover:border-foreground/20 hover:bg-accent/50",
                )}
              >
                <p className="font-semibold">{LANG_LABELS[lng]}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {lng}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
