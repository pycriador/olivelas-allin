import { Moon, Sun, MonitorSmartphone } from "lucide-react";
import { useTheme, type ThemeMode } from "@/lib/theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { mode, setMode, resolved } = useTheme();
  const Icon = resolved === "dark" ? Moon : Sun;
  const label = mode === "auto" ? "Automático" : mode === "dark" ? "Escuro" : "Claro";
  const options: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Escuro", icon: Moon },
    { value: "auto", label: "Automático", icon: MonitorSmartphone },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Tema: ${label}`}>
          <Icon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {options.map((o) => (
          <DropdownMenuItem key={o.value} onClick={() => setMode(o.value)} className="gap-2">
            <o.icon className="h-4 w-4" />
            <span className="flex-1">{o.label}</span>
            {mode === o.value && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}