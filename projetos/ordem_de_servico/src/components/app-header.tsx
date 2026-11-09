import { Link } from "@tanstack/react-router";
import { Moon, Sun, Laptop, Globe, User, ShieldCheck, Palette, LogOut, Check } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/core/providers/theme/ThemeProvider";
import { useTranslation } from "@/core/i18n/I18nProvider";
import type { Language } from "@/core/services/configuration";
import { AppBreadcrumb } from "./app-breadcrumb";
import { HelpButton } from "./help-button";
import { AppThemeSelector } from "@/components/theme/AppThemeSelector";
import { useState } from "react";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "pt-BR", label: "Português (BR)" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

export function AppHeader() {
  const { user, logout } = useAuth();
  const { theme, setTheme, resolved } = useTheme();
  const { language, setLanguage } = useTranslation();
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-14 min-w-0 w-full items-center justify-between gap-2 border-b bg-background/80 px-3 sm:px-4 backdrop-blur">
      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
        <SidebarTrigger className="shrink-0" />
        <Separator orientation="vertical" className="h-5 shrink-0 hidden sm:block" />
        <div className="min-w-0 overflow-hidden truncate">
          <AppBreadcrumb />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="hidden md:inline-flex gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-600/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
        >
          <Link to="/system-tests">
            <ShieldCheck className="h-3.5 w-3.5" /> Testes & Evidências
          </Link>
        </Button>

        <HelpButton />

        {/* 30 Color Themes Dialog (Olivelas Style) */}
        <Dialog open={themeModalOpen} onOpenChange={setThemeModalOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Personalizar Cores e Tema"
              aria-label="Personalizar Cores e Tema"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Catálogo de Cores & Temas (30 Presets)
              </DialogTitle>
              <DialogDescription>
                Selecione sua paleta favorita inspirada no design system da plataforma.
              </DialogDescription>
            </DialogHeader>
            <div className="pt-2">
              <AppThemeSelector onSelect={() => setThemeModalOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick Light/Dark/System Toggle (Olivelas Style) */}
        <div className="hidden sm:flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setTheme("light")}
            title="Tema Claro"
            className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
              theme === "light"
                ? "bg-background text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            title="Tema Escuro"
            className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
              theme === "dark"
                ? "bg-background text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setTheme("system")}
            title="Tema do Sistema"
            className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
              theme === "system"
                ? "bg-background text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Laptop className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Language selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Idioma">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {LANGUAGES.map((l) => (
              <DropdownMenuItem
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className="flex items-center justify-between"
              >
                <span className={language === l.code ? "font-semibold text-primary" : ""}>{l.label}</span>
                {language === l.code && <Check className="h-3.5 w-3.5 text-primary ml-2" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User profile menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 h-8 px-2">
              <div className="h-6 w-6 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center uppercase">
                {user?.name?.slice(0, 2) || user?.email?.slice(0, 2) || "US"}
              </div>
              <span className="hidden lg:inline text-xs font-medium max-w-[120px] truncate">{user?.name ?? "Usuário"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer">
                Configurações & Tema
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/system-tests" className="cursor-pointer">
                Evidências do Sistema
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout()}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair da conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
