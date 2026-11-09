import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Logo } from "@/components/shared/logo";
import { APP_NAME } from "@/constants/app";

const NAV_ITEMS = [
  { label: "Recursos", href: "/#recursos" },
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Benefícios", href: "/#beneficios" },
  { label: "Segurança", href: "/#seguranca" },
  { label: "Planos", href: "/#planos" },
  { label: "FAQ", href: "/#faq" },
];

const FOOTER_LINKS = [
  {
    title: "Produto",
    links: [
      { label: "Recursos", href: "/#recursos" },
      { label: "Como funciona", href: "/#como-funciona" },
      { label: "Planos", href: "/#planos" },
      { label: "Segurança", href: "/#seguranca" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre", href: "/about" },
      { label: "Contato", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidade", href: "/privacy" },
      { label: "Termos", href: "/terms" },
    ],
  },
];

export function PublicLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="shrink-0">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link to="/login" className="hidden sm:inline-flex">
              <Button size="sm">
                Começar agora
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Abrir menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-border/60 bg-background lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3" aria-label="Mobile">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Entrar
                  </Button>
                </Link>
                <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Começar agora</Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2">
              <Logo />
              <p className="mt-4 max-w-sm text-sm text-muted-foreground">
                Plataforma de automação documental enterprise. Cada projeto é uma aplicação completa
                de geração de documentos.
              </p>
            </div>
            {FOOTER_LINKS.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold">{col.title}</h3>
                <ul className="mt-4 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {APP_NAME}. Todos os direitos reservados.
            </p>
            <p className="text-sm text-muted-foreground">
              Feito para equipes jurídicas e de automação.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
