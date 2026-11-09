import { ShieldCheck, UserCheck, ChefHat, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function UserProfiles() {
  const profiles = [
    {
      role: 'Administrador',
      desc: 'Controle do restaurante e da operação.',
      details: 'Gestão de acessos, cardápios, mesas e relatórios de fluxo operacional.',
      icon: ShieldCheck,
      badge: 'Gestão Geral',
    },
    {
      role: 'Garçom',
      desc: 'Criação e acompanhamento de pedidos.',
      details: 'Abertura de mesas, adição de itens, observações de clientes e fechamento de contas.',
      icon: UserCheck,
      badge: 'Atendimento',
    },
    {
      role: 'Cozinha',
      desc: 'Visualização e atualização dos pedidos.',
      details: 'Display KDS para controle de filas de preparo e status de cada item em tempo real.',
      icon: ChefHat,
      badge: 'Produção',
    },
    {
      role: 'Cliente',
      desc: 'Cardápio e pedidos diretamente na mesa.',
      details: 'Consulta dinâmica do menu digital e envio ágil de pedidos quando habilitado.',
      icon: Users,
      badge: 'Experiência',
    },
  ];

  return (
    <section id="para-restaurantes" className="py-20 border-t border-border bg-background scroll-mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Para Todos os Papéis
          </h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            A visão exata para cada membro da sua equipe
          </p>
          <p className="mt-3 text-muted-foreground text-base">
            Interfaces desenhadas para a ergonomia e velocidade de cada estação de trabalho.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {profiles.map((profile) => {
            const Icon = profile.icon;
            return (
              <Card
                key={profile.role}
                className="border border-border bg-card hover:border-primary/40 transition-colors flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full border border-border/50">
                      {profile.badge}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {profile.role}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm font-medium text-foreground/90 leading-snug">
                    {profile.desc}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {profile.details}
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
