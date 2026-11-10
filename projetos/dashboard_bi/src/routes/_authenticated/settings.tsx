import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/app/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUIStore, type ThemeMode } from "@/lib/stores/ui-store";
import { useLocale } from "@/i18n/use-locale";
import type { Locale } from "@/i18n";

export const Route = createFileRoute("/_authenticated/settings")({ component: Page });

function Page() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />
      <Tabs defaultValue="general">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="general">{t("settings.tabs.general")}</TabsTrigger>
          <TabsTrigger value="theme">{t("settings.tabs.theme")}</TabsTrigger>
          <TabsTrigger value="language">{t("settings.tabs.language")}</TabsTrigger>
          <TabsTrigger value="notifications">{t("settings.tabs.notifications")}</TabsTrigger>
          <TabsTrigger value="ai">{t("settings.tabs.ai")}</TabsTrigger>
          <TabsTrigger value="integrations">{t("settings.tabs.integrations")}</TabsTrigger>
          <TabsTrigger value="security">{t("settings.tabs.security")}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Preferências gerais da conta.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme">
          <Card>
            <CardContent className="p-6">
              <RadioGroup
                value={theme}
                onValueChange={(v) => setTheme(v as ThemeMode)}
                className="grid gap-3"
              >
                {(["light", "dark", "system"] as ThemeMode[]).map((v) => (
                  <label
                    key={v}
                    className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-accent/40"
                  >
                    <RadioGroupItem value={v} id={`theme-${v}`} />
                    <Label htmlFor={`theme-${v}`} className="cursor-pointer">
                      {t(`common.theme${v.charAt(0).toUpperCase()}${v.slice(1)}`)}
                    </Label>
                  </label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language">
          <Card>
            <CardContent className="p-6">
              <RadioGroup
                value={locale}
                onValueChange={(v) => setLocale(v as Locale)}
                className="grid gap-3"
              >
                {(
                  [
                    { v: "pt-BR", l: "Português (Brasil)" },
                    { v: "en", l: "English" },
                    { v: "es", l: "Español" },
                  ] as { v: Locale; l: string }[]
                ).map((o) => (
                  <label
                    key={o.v}
                    className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-accent/40"
                  >
                    <RadioGroupItem value={o.v} id={`lang-${o.v}`} />
                    <Label htmlFor={`lang-${o.v}`} className="cursor-pointer">
                      {o.l}
                    </Label>
                  </label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        {["notifications", "ai", "integrations", "security"].map((k) => (
          <TabsContent value={k} key={k}>
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                {t("settings.placeholder")}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
