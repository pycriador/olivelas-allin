import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative selection:bg-primary/20 selection:text-primary">
      {/* Top Bar with Back Link & Theme Toggle */}
      <header className="w-full flex items-center justify-between p-4 sm:p-6 max-w-7xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md p-1"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Voltar para o início</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Centered Auth Card Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <Logo showSubtitle={false} />
          </div>
          {children}
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="w-full py-4 text-center text-xs text-muted-foreground border-t border-border/50">
        <p>© 2026 Olivelas Restaurant. Gestão inteligente para restaurantes.</p>
      </footer>
    </div>
  );
}
