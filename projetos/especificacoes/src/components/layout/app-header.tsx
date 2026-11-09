import { Bell, Search, Sun, Moon, Languages, User, Shield, Lock, LogOut } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useThemeStore } from "@/stores/theme.store";
import { useI18nStore, useT } from "@/stores/i18n.store";
import { useUIStore } from "@/stores/ui.store";
import { Breadcrumb } from "./breadcrumb";
import { GlobalSearch } from "./global-search";

export function AppHeader() {
  const { mode, toggleMode } = useThemeStore();
  const { locale, setLocale } = useI18nStore();
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const t = useT();
  const navigate = useNavigate();
  const session = useAuthStore((s) => s.session);
  const lock = useAuthStore((s) => s.lock);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur">
      <Breadcrumb />
      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex h-9 min-w-[220px] items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-xs text-muted-foreground hover:bg-muted"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">{t("search.placeholder")}</span>
          <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px]">
            ⌘K
          </kbd>
        </button>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearchOpen(true)}>
          <Search className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" title="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Language">
              <Languages className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-36">
            <DropdownMenuLabel>{t("settings.language")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(["pt-BR", "en", "es"] as const).map((l) => (
              <DropdownMenuItem
                key={l}
                onClick={() => setLocale(l)}
                className={locale === l ? "font-semibold" : ""}
              >
                {l === "pt-BR" ? "Português" : l === "en" ? "English" : "Español"}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={toggleMode} title="Theme">
          {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-2" aria-label="Account">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {(session?.name ?? "SF").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuLabel className="truncate">
              {session?.name ?? "SpecForge"}
              <span className="block text-xs font-normal text-muted-foreground">{session?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
              <Shield className="mr-2 h-4 w-4" /> Admin
            </DropdownMenuItem>
            <DropdownMenuItem onClick={lock}>
              <Lock className="mr-2 h-4 w-4" /> Lock session
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void logout()} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <GlobalSearch />
    </header>
  );
}
