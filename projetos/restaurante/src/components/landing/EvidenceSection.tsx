import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChefHat,
  Receipt,
  Users,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function EvidenceSection() {
  const basePath = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  const highlights = [
    {
      step: '01',
      title: '5 Papéis Operacionais',
      subtitle: 'Admin, Gerente, Garçom, Cozinha e Caixa',
      image: `${basePath}evidence/01-team-management-all-roles.png`,
      icon: Users,
      badge: 'RBAC Completo',
      badgeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      step: '07',
      title: 'Cortes com Ponto da Carne',
      subtitle: 'Ancho Angus ao ponto para mal com adicionais',
      image: `${basePath}evidence/07-comanda-item-selection-with-doneness.png`,
      icon: ChefHat,
      badge: 'Cardápio & Salão',
      badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      step: '10',
      title: 'KDS Cozinha em Tempo Real',
      subtitle: 'Preparo no fogo e devolução ao garçom',
      image: `${basePath}evidence/10-kds-kitchen-queue.png`,
      icon: Sparkles,
      badge: 'Tempo Real',
      badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
    {
      step: '14',
      title: 'Comanda Digital & PIX',
      subtitle: 'QR Code dinâmico e liquidação no caixa',
      image: `${basePath}evidence/14-digital-comanda-customer-qrcode-pix.png`,
      icon: Receipt,
      badge: 'Caixa & Checkout',
      badgeColor: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <section id="evidencias" className="py-20 border-b border-border bg-muted/20 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              100% Homologado & Auditado
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              Testado na Prática da Operação Real
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              O fluxo operacional completo foi simulado e validado ponta a ponta com 15 capturas de tela em alta definição: da abertura de comanda com pontos de corte nobres até o pagamento no caixa.
            </p>
          </div>

          <div className="shrink-0">
            <Button asChild size="lg" className="gap-2 shadow-sm font-semibold">
              <Link to="/evidence">
                Ver Todas as 15 Telas de Evidências
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.step}
                to="/evidence"
                className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:border-primary/40 hover:shadow-lg transition-all duration-200"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-black/40 border-b border-border">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-black/70 backdrop-blur-xs text-white font-mono text-[11px] font-bold">
                      {item.step}
                    </span>
                    <Badge variant="outline" className={`text-[10px] py-0 px-2 font-medium ${item.badgeColor}`}>
                      {item.badge}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {item.subtitle}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center text-xs font-medium text-primary gap-1">
                    <span>Ver detalhes</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
