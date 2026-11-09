import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navLinks = [
    { label: 'Recursos', href: '#recursos' },
    { label: 'Como funciona', href: '#como-funciona' },
    { label: 'Para restaurantes', href: '#para-restaurantes' },
    { label: 'Evidências E2E', href: '/evidence', isRoute: true },
  ];

  const handleNavClick = (link: { label: string; href: string; isRoute?: boolean }) => {
    setMobileMenuOpen(false);
    if (link.isRoute) {
      navigate(link.href);
      return;
    }
    if (location.pathname === '/') {
      const element = document.querySelector(link.href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/' + link.href);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md border-b border-border shadow-xs transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => handleNavClick(link)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <Button asChild size="sm">
              <Link to="/app">
                Acessar Restaurante
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Começar agora</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:bg-accent focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Abrir menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background/95 backdrop-blur-md px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => handleNavClick(link)}
                className="text-left text-base font-medium text-foreground/80 hover:text-foreground py-1 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="pt-3 border-t border-border flex flex-col gap-2.5">
            {user ? (
              <Button asChild className="w-full">
                <Link to="/app" onClick={() => setMobileMenuOpen(false)}>
                  Acessar Restaurante
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" className="w-full justify-center">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    Entrar
                  </Link>
                </Button>
                <Button asChild className="w-full justify-center">
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    Começar agora
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
