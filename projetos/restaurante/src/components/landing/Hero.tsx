import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductMockup } from './ProductMockup';

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12 md:mb-16">
          {/* Subtle top indicator */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1 text-xs font-medium text-foreground mb-6 shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-primary" />
            <span>Gestão inteligente para restaurantes</span>
            <span className="text-border">|</span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3 text-primary" /> Online &amp; Offline
            </span>
          </div>

          {/* Section 6 Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.15] mb-6">
            O restaurante no controle.{' '}
            <span className="text-primary block sm:inline">
              O pedido no lugar certo.
            </span>
          </h1>

          {/* Section 6 Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mb-8">
            Gerencie seu restaurante, mesas, cardápio, pedidos e cozinha em uma única plataforma.
          </p>

          {/* Section 6 CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/register" className="flex items-center justify-center gap-2">
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/login">Entrar</Link>
            </Button>
          </div>

          <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Sem necessidade de cartão para começar</span>
            </div>
            <span>•</span>
            <div>
              <span>Pronto para operação em tablets</span>
            </div>
          </div>
        </div>

        {/* Section 6 Visual representation */}
        <div className="mt-4">
          <ProductMockup />
        </div>
      </div>
    </section>
  );
}
