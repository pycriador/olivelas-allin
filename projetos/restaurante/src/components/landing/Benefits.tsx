import { LayoutGrid, ClipboardList, ChefHat, WifiOff } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function Benefits() {
  const benefits = [
    {
      icon: LayoutGrid,
      title: 'Gestão de mesas',
      description: 'Controle as mesas e saiba o que está acontecendo em cada uma.',
      detail: 'Visualização de mesas ocupadas, livres e em fechamento.',
    },
    {
      icon: ClipboardList,
      title: 'Pedidos',
      description: 'Pedidos feitos pelo cliente ou pelo garçom chegam ao fluxo operacional do restaurante.',
      detail: 'Sem comandas de papel perdidas ou duplicação de lançamentos.',
    },
    {
      icon: ChefHat,
      title: 'Cozinha',
      description: 'Acompanhe os pedidos em preparação e saiba quando estão prontos.',
      detail: 'Organização por ordem de chegada e tempos de preparo.',
    },
    {
      icon: WifiOff,
      title: 'Offline',
      description: 'Continue operando mesmo quando a conexão com a internet estiver indisponível.',
      detail: 'Seus dados permanecem seguros no dispositivo e sincronizam depois.',
    },
  ];

  return (
    <section id="recursos" className="py-20 border-t border-border bg-card/25 scroll-mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Recursos Essenciais
          </h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            A estrutura certa para sua operação fluir sem atritos
          </p>
          <p className="mt-3 text-muted-foreground text-base">
            Projetado para eliminar gargalos entre o salão, a cozinha e a administração.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="relative overflow-hidden border border-border/80 bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-foreground/90 font-medium leading-relaxed">
                    {item.description}
                  </p>
                  <p className="text-xs text-muted-foreground leading-normal">
                    {item.detail}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
