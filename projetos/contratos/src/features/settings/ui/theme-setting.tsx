import { Monitor, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useThemeStore } from "@/stores/theme";
import { cn } from "@/lib/utils";

const OPTIONS = [
  {
    value: "light",
    label: "Claro",
    icon: Sun,
    description: "Interface com cores claras",
  },
  {
    value: "dark",
    label: "Escuro",
    icon: Moon,
    description: "Interface com cores escuras",
  },
  {
    value: "system",
    label: "System",
    icon: Monitor,
    description: "Acompanha o sistema operacional",
  },
] as const;

export function ThemeSetting() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Tema da interface</CardTitle>
        <CardDescription>
          Escolha o tema preferido. A preferência é salva automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={cn(
                "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                theme === option.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border/60 hover:border-border hover:bg-muted/40",
              )}
              aria-pressed={theme === option.value}
            >
              <option.icon
                className={cn(
                  "size-5",
                  theme === option.value ? "text-primary" : "text-muted-foreground",
                )}
              />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
