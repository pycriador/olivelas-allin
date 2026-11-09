import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useThemeStore, type ThemePalette, type ThemeMode } from "@/stores/theme.store";
import { useI18nStore, useT, type Locale } from "@/stores/i18n.store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const palettes: Array<{ id: ThemePalette; label: string; swatches: string[] }> = [
  { id: "corporate-blue", label: "Corporate Blue", swatches: ["#1e3a8a", "#3b82f6", "#dbeafe"] },
  { id: "emerald", label: "Emerald", swatches: ["#064e3b", "#10b981", "#d1fae5"] },
  { id: "purple", label: "Purple", swatches: ["#4c1d95", "#8b5cf6", "#ede9fe"] },
  { id: "orange", label: "Orange", swatches: ["#7c2d12", "#f97316", "#ffedd5"] },
  { id: "dark-graphite", label: "Dark Graphite", swatches: ["#0b0f19", "#1f2937", "#374151"] },
  { id: "light", label: "Light", swatches: ["#ffffff", "#f3f4f6", "#111827"] },
];

const modes: Array<{ id: ThemeMode; label: string }> = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

const locales: Array<{ id: Locale; label: string }> = [
  { id: "pt-BR", label: "Português" },
  { id: "en", label: "English" },
  { id: "es", label: "Español" },
];

function SettingsPage() {
  const t = useT();
  const { palette, setPalette, mode, setMode } = useThemeStore();
  const { locale, setLocale } = useI18nStore();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Customize your SpecForge experience.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {locales.map((l) => (
              <button
                key={l.id}
                onClick={() => setLocale(l.id)}
                className={cn(
                  "rounded-md border border-border px-4 py-2 text-sm hover:bg-accent",
                  locale === l.id && "border-primary bg-primary/10 text-primary",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.mode")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  "rounded-md border border-border px-4 py-2 text-sm hover:bg-accent",
                  mode === m.id && "border-primary bg-primary/10 text-primary",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.theme")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {palettes.map((p) => (
              <button
                key={p.id}
                onClick={() => setPalette(p.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-accent",
                  palette === p.id && "border-primary bg-primary/5",
                )}
              >
                <div className="flex -space-x-2">
                  {p.swatches.map((c, i) => (
                    <span
                      key={i}
                      className="h-6 w-6 rounded-full border border-background"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{p.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
