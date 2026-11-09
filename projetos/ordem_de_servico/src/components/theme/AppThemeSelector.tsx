import { Check } from "lucide-react";
import { APP_THEMES, type ThemeOption } from "@/lib/appThemes";
import { useTheme } from "@/core/providers/theme/ThemeProvider";

interface AppThemeSelectorProps {
  onSelect?: () => void;
}

export function AppThemeSelector({ onSelect }: AppThemeSelectorProps) {
  const { colorTheme, setColorTheme, resolved } = useTheme();

  const renderThemes = (mode: "light" | "dark") => (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
      {APP_THEMES.filter((theme) => theme.mode === mode).map((theme) => {
        const isSelected = colorTheme === theme.id || (!colorTheme && theme.id === `ocean-${resolved}`);
        const surface = mode === "dark" ? `hsl(${theme.hue} 20% 12%)` : `hsl(${theme.hue} 28% 97%)`;
        const foreground = mode === "dark" ? `hsl(${theme.hue} 12% 94%)` : `hsl(${theme.hue} 24% 12%)`;
        const primary = `hsl(${theme.hue} 72% ${mode === "dark" ? 62 : 43}%)`;

        return (
          <button
            key={theme.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => {
              setColorTheme(theme.id);
              onSelect?.();
            }}
            className={`flex min-w-0 items-center gap-2 rounded-xl border p-2 text-left transition-all ${
              isSelected
                ? "border-primary bg-primary/10 ring-2 ring-primary/40 font-semibold"
                : "border-border hover:bg-accent/60"
            }`}
          >
            <span
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/80 shadow-xs"
              style={{ backgroundColor: surface, color: foreground }}
              aria-hidden="true"
            >
              <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: primary }} />
              {isSelected && (
                <Check className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground p-0.5" />
              )}
            </span>
            <span className="min-w-0 truncate text-xs text-foreground">
              {theme.name}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Temas Claros · 15</h3>
        </div>
        {renderThemes("light")}
      </section>

      <section className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Temas Escuros · 15</h3>
        </div>
        {renderThemes("dark")}
      </section>
    </div>
  );
}
