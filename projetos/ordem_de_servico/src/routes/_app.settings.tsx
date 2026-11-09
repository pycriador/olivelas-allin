import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/core/providers/theme/ThemeProvider";
import { useTranslation } from "@/core/i18n/I18nProvider";
import type { Language, ThemeMode } from "@/core/services/configuration";
import { AppThemeSelector } from "@/components/theme/AppThemeSelector";
import { Palette, Globe } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — ServiceForge" },
      { name: "description", content: "Preferências globais de aparência e personalização." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-4xl min-w-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">Personalize as cores, tema e preferências da aplicação.</p>
      </div>

      <div className="grid gap-6">
        {/* Color Palette (Olivelas Style 30 Presets) */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Paleta de Cores e Estilos (30 Presets)
            </CardTitle>
            <CardDescription>
              Escolha uma família de cores para customizar a interface, cards, botões e barras de navegação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppThemeSelector />
          </CardContent>
        </Card>

        {/* Mode and Language */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Preferências Gerais do Sistema
            </CardTitle>
            <CardDescription>Defina o modo de contraste e idioma padrão.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("settings.theme")}</Label>
              <Select value={theme} onValueChange={(v) => setTheme(v as ThemeMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t("settings.theme.light")}</SelectItem>
                  <SelectItem value="dark">{t("settings.theme.dark")}</SelectItem>
                  <SelectItem value="system">{t("settings.theme.system")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("settings.language")}</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (BR)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
