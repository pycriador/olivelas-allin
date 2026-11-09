import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme.store";

export function ThemeApplier() {
  const mode = useThemeStore((s) => s.mode);
  const palette = useThemeStore((s) => s.palette);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark" || palette === "dark-graphite");
    root.setAttribute("data-palette", palette);
  }, [mode, palette]);
  return null;
}
