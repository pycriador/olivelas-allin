import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Coffee } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useSettings } from "@/hooks/use-settings";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function PublicShell({ children }: { children: ReactNode }) {
  const { data: settings } = useSettings();
  const { user } = useAuth();
  const brand = settings?.company_name ?? "Olivelas";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Coffee className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display text-lg leading-none">{brand}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Mug Gallery</p>
            </div>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/" activeProps={{ className: "font-semibold" }} activeOptions={{ exact: true }}>
                Início
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/collections" activeProps={{ className: "font-semibold" }}>
                Coleções
              </Link>
            </Button>
            <ThemeToggle />
            {user ? (
              <Button size="sm" variant="outline" asChild>
                <Link to="/admin">Painel</Link>
              </Button>
            ) : (
              <Button size="sm" variant="outline" asChild>
                <Link to="/auth">Entrar</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {brand}. Todas as artes exibidas.
      </footer>
    </div>
  );
}
