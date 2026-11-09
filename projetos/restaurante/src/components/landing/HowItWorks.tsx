import { Settings, Utensils, Smartphone, ChefHat, CheckCheck } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Configure seu restaurante',
      desc: 'Defina informações básicas, horários e áreas de atendimento.',
      icon: Settings,
    },
    {
      num: '02',
      title: 'Cadastre mesas e cardápio',
      desc: 'Adicione suas mesas físicas e organize itens com fotos e preços.',
      icon: Utensils,
    },
    {
      num: '03',
      title: 'Clientes fazem pedidos',
      desc: 'Lançamentos rápidos via comanda do garçom ou pelo próprio cliente.',
      icon: Smartphone,
    },
    {
      num: '04',
      title: 'A cozinha recebe',
      desc: 'Notificação imediata no display da cozinha com ordem e tempo de preparo.',
      icon: ChefHat,
    },
    {
      num: '05',
      title: 'O garçom entrega',
      desc: 'Pratos prontos são sinalizados e levados direto à mesa correta.',
      icon: CheckCheck,
    },
  ];

  return (
    <section id="como-funciona" className="py-20 border-t border-border bg-background scroll-mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14 text-left">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Fluxo Operacional
          </h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Como funciona na prática
          </p>
          <p className="mt-3 text-muted-foreground text-base">
            Um fluxo contínuo e sem ruídos do pedido até a mesa.
          </p>
        </div>

        {/* Desktop / Tablet Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="relative rounded-lg border border-border bg-card p-5 flex flex-col justify-between hover:border-primary/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-2xl font-bold text-primary/80">
                      {step.num}
                    </span>
                    <div className="h-8 w-8 rounded-md bg-muted/70 flex items-center justify-center text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="font-semibold text-base text-foreground mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <span className="text-muted-foreground/40 font-mono text-xs">→</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
