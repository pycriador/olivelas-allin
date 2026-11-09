import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FinalCta() {
  return (
    <section className="py-20 border-t border-border bg-card/60">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
          Pronto para organizar a operação do seu restaurante?
        </h2>
        <p className="text-base text-muted-foreground max-w-xl mx-auto mb-8">
          Inicie sua conta no Olivelas Restaurant e experimente um fluxo integrado entre salão, cozinha e gestão.
        </p>
        <Button asChild size="lg" className="px-8">
          <Link to="/register" className="flex items-center gap-2">
            Começar agora
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
