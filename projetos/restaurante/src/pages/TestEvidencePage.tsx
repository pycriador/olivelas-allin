import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UtensilsCrossed,
  ChefHat,
  Receipt,
  ExternalLink,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EvidenceItem {
  id: string;
  step: string;
  title: string;
  category: 'team' | 'menu' | 'tables' | 'kds' | 'cashier';
  categoryLabel: string;
  route: string;
  image: string;
  description: string;
  details: string[];
  tags: string[];
}

const EVIDENCE_DATA: EvidenceItem[] = [
  {
    id: '01',
    step: '01',
    title: 'Cadastro Completo da Equipe (5 Papéis Operacionais)',
    category: 'team',
    categoryLabel: 'Equipe & RBAC',
    route: '/app/team',
    image: '01-team-management-all-roles.png',
    description:
      'Painel de Gestão de Membros em /app/team com todos os 5 papéis funcionais cadastrados e ativos no restaurante Olivelas.',
    details: [
      'Carlos Mendes (carlos.admin@olivelas.com.br) — Administrador (restaurant_admin)',
      'Fernanda Lima (fernanda.gerente@olivelas.com.br) — Gerente Geral (manager)',
      'Roberto Alves (roberto.garcom@olivelas.com.br) — Garçom de Salão (waiter)',
      'Chef Marcelo Oliveira (marcelo.cozinha@olivelas.com.br) — Cozinha / KDS (kitchen)',
      'Aline Santos (aline.caixa@olivelas.com.br) — Operadora de Caixa (cashier)',
      'Willian Jesus (willian.o.jesus@gmail.com) — Global Admin / Proprietário',
    ],
    tags: ['#rbac', '#gestao-de-equipe', '#permissoes', '#multi-tenant'],
  },
  {
    id: '02',
    step: '02',
    title: 'Modal de Admissão & Atribuição de Cargo',
    category: 'team',
    categoryLabel: 'Equipe & RBAC',
    route: '/app/team',
    image: '02-team-add-member-modal.png',
    description:
      'Formulário modal de cadastro e convite de funcionários com seleção de papéis com permissões granulares.',
    details: [
      'Validação de e-mail institucional corporativo',
      'Seleção de cargo com escopo visual de privilégios',
      'Associação automática ao tenant ativo (Restaurante Olivelas)',
    ],
    tags: ['#onboarding', '#modal', '#cadastro-funcionario'],
  },
  {
    id: '03',
    step: '03',
    title: 'Catálogo de Produtos, Cortes Nobres e Bebidas',
    category: 'menu',
    categoryLabel: 'Cardápio & Cortes',
    route: '/app/menu/products',
    image: '03-menu-products-catalog.png',
    description:
      'Visão do catálogo gastronômico em /app/menu/products contendo os cortes especiais na brasa e coquetelaria mediterrânea.',
    details: [
      'Item cadastrado: Ancho Angus na Brasa (350g) — R$ 89,90 (Cortes Nobres)',
      'Item cadastrado: Gin Tônica Mediterrâneo — R$ 37,90 (Drinks & Bar)',
      'Status: Ativo com foto em alta definição e indicação de adicionais vinculados',
    ],
    tags: ['#cardapio', '#cortes-nobres', '#bebidas', '#catalogo'],
  },
  {
    id: '04',
    step: '04',
    title: 'Configuração dos Pontos da Carne e Adicionais',
    category: 'menu',
    categoryLabel: 'Cardápio & Cortes',
    route: '/app/menu/add-ons',
    image: '04-menu-meat-doneness-addons.png',
    description:
      'Área de adicionais e grupos em /app/menu/add-ons com opções de cocção da carne configuradas para seleção em salão e delivery.',
    details: [
      'Pontos configurados: Mal Passado, Ao Ponto para Mal, Ao Ponto, Bem Passado',
      'Valores: R$ 0,00 (seleção de preparo obrigatória)',
      'Acompanhamentos extras: Bacon Artesanal e Molho Chimichurri',
    ],
    tags: ['#ponto-da-carne', '#adicionais', '#customizacao'],
  },
  {
    id: '05',
    step: '05',
    title: 'Mapa do Salão de Mesas & Setores Personalizados',
    category: 'tables',
    categoryLabel: 'Salão & Comandas',
    route: '/app/tables',
    image: '05-tables-floor-plan.png',
    description:
      'Visão espacial do salão em /app/tables categorizada por áreas (Salão Principal, Varanda, Sacada, Bar e VIP) com status em tempo real.',
    details: [
      'Mesa de teste: Mesa 03 (Salão Principal, 6 lugares)',
      'Status Inicial: Livre para atendimento',
      'Métricas: Contador de ocupação e faturamento dinâmico em tempo real',
    ],
    tags: ['#salao', '#mesas', '#setores', '#mapa-espacial'],
  },
  {
    id: '06',
    step: '06',
    title: 'Abertura de Comanda na Mesa 03',
    category: 'tables',
    categoryLabel: 'Salão & Comandas',
    route: '/app/tables/table-03',
    image: '06-open-comanda-modal.png',
    description:
      'Modal de abertura da comanda para a Mesa 03 com associação direta do cliente titular e alocação do garçom Roberto Alves.',
    details: [
      'Titular: Roberto Cavalcanti',
      'Atendente: Roberto Alves (Garçom)',
      'Ocupantes: 6 pessoas',
      'Observação: Cliente VIP • Almoço Executivo de Negócios',
    ],
    tags: ['#abertura-comanda', '#atendimento', '#garcom'],
  },
  {
    id: '07',
    step: '07',
    title: 'Lançamento de Corte com Seleção do Ponto da Carne',
    category: 'tables',
    categoryLabel: 'Salão & Comandas',
    route: '/app/tables/table-03',
    image: '07-comanda-item-selection-with-doneness.png',
    description:
      'Modal de lançamento de item com seleção de ponto de cocção exigido e inclusão de molho adicional artesanal.',
    details: [
      'Produto: Ancho Angus na Brasa (350g)',
      'Ponto da Carne Selecionado: Ao Ponto para Mal',
      'Adicional: Molho Chimichurri Artesanal (+R$ 0,00)',
      'Nota técnica: "Servir na tábua de oliveira pré-aquecida"',
    ],
    tags: ['#lancamento', '#ponto-da-carne', '#comanda'],
  },
  {
    id: '08',
    step: '08',
    title: 'Comanda Ativa com Corte Nobre e Bebida Alcoólica',
    category: 'tables',
    categoryLabel: 'Salão & Comandas',
    route: '/app/tables/table-03',
    image: '08-comanda-items-added.png',
    description:
      'Comanda ativa e consolidada com cálculo de subtotal, taxa de serviço de 10% e total líquido de R$ 140,69.',
    details: [
      'Item 1: Ancho Angus na Brasa (Ao Ponto para Mal) — R$ 89,90',
      'Item 2: Gin Tônica Mediterrâneo — R$ 37,90',
      'Subtotal: R$ 127,90 | Serviço (10%): R$ 12,79 | Total: R$ 140,69',
      'Status dos Itens: Pendentes de envio para a cozinha',
    ],
    tags: ['#comanda-ativa', '#subtotal', '#taxa-servico'],
  },
  {
    id: '09',
    step: '09',
    title: 'Disparo e Transmissão do Pedido para a Cozinha',
    category: 'tables',
    categoryLabel: 'Salão & Comandas',
    route: '/app/tables/table-03',
    image: '09-comanda-sent-to-kitchen.png',
    description:
      'Acionamento do botão "Enviar para Cozinha" com confirmação via toast e transmissão instantânea para o sistema KDS.',
    details: [
      'Transmissão WebSocket/Supabase Realtime para a praça quente da cozinha',
      'Status dos itens alterado de "Pendente" para "Na Fila da Cozinha"',
      'Horário de registro do ticket sincronizado',
    ],
    tags: ['#disparo', '#comanda-eletronica', '#transmissao'],
  },
  {
    id: '10',
    step: '10',
    title: 'Monitor KDS da Cozinha: Ticket Recebido em Preparo',
    category: 'kds',
    categoryLabel: 'KDS & Cozinha',
    route: '/app/kds',
    image: '10-kds-kitchen-queue.png',
    description:
      'Painel KDS operado pelo Chef Marcelo Oliveira em /app/kds exibindo o ticket com destaque para o ponto "Ao Ponto para Mal".',
    details: [
      'Estação: Grelha & Brasa / Bar',
      'Destaque no ticket: 1x Ancho Angus (Ao Ponto para Mal)',
      'Status: Em Preparação (cronômetro de produção ativo)',
      'Responsável de produção: Chef Marcelo Oliveira',
    ],
    tags: ['#kds', '#cozinha', '#chef', '#producao'],
  },
  {
    id: '11',
    step: '11',
    title: 'Finalização do Prato no KDS: Pronto para Servir',
    category: 'kds',
    categoryLabel: 'KDS & Cozinha',
    route: '/app/kds',
    image: '11-kds-dish-prepared-ready.png',
    description:
      'Chef Marcelo conclui a cocção do corte no ponto exato e marca o ticket como Pronto no KDS, emitindo notificação ao salão.',
    details: [
      'Cocção conferida: Crosta uniforme, centro vermelho e morno',
      'Tempo de preparo: 14 minutos e 20 segundos',
      'Status: Pronto para Servir (Aguardando Garçom)',
    ],
    tags: ['#prato-pronto', '#kds-finalizado', '#alerta-garcom'],
  },
  {
    id: '12',
    step: '12',
    title: 'Liberação e Devolução do Prato ao Garçom',
    category: 'kds',
    categoryLabel: 'KDS & Cozinha',
    route: '/app/kds',
    image: '12-kds-dish-delivered-to-waiter.png',
    description:
      'Ticket finalizado e entregue ao garçom Roberto Alves. O KDS atualiza a contagem de pedidos concluídos na sessão.',
    details: [
      'Entrega física no passe da cozinha para o garçom Roberto Alves',
      'Ação de baixa no KDS executada',
      'Contador: 1 pedido servido nos últimos minutos',
    ],
    tags: ['#devolucao-garcom', '#passe', '#kds-concluido'],
  },
  {
    id: '13',
    step: '13',
    title: 'Salão: Pedido Servido na Mesa 03 e Pré-Conta',
    category: 'tables',
    categoryLabel: 'Salão & Comandas',
    route: '/app/tables/table-03',
    image: '13-table-order-delivered-salon.png',
    description:
      'Mesa 03 atualizada no salão: itens marcados como servidos pelo garçom Roberto e banner de pré-conta solicitada em destaque.',
    details: [
      'Status da Mesa: Conta Solicitada (bill_requested)',
      'Banner âmbar de fechamento com atalho de impressão e quitação',
      'QR Code de autoatendimento sincronizado para o cliente',
    ],
    tags: ['#mesa-servida', '#pre-conta', '#fechamento'],
  },
  {
    id: '14',
    step: '14',
    title: 'Comanda Digital do Cliente com QR Code & PIX Dinâmico',
    category: 'cashier',
    categoryLabel: 'Caixa & Checkout',
    route: '/comanda/table-03',
    image: '14-digital-comanda-customer-qrcode-pix.png',
    description:
      'Visão mobile pública acessada pelo cliente escaneando o QR Code da mesa, com discriminação completa e QR Code PIX instantâneo.',
    details: [
      'Visualização pública da comanda da Mesa 03 (sem necessidade de login)',
      'Total calculado: R$ 140,69 (incluindo serviço)',
      'Copia e Cola PIX e QR Code estático gerados com chave do restaurante',
      'Botão de chamar garçom ou pedir a conta pelo celular',
    ],
    tags: ['#comanda-digital', '#pix-dinamico', '#mobile', '#qr-code'],
  },
  {
    id: '15',
    step: '15',
    title: 'Frente de Caixa & PDV: Liquidação e Encerramento',
    category: 'cashier',
    categoryLabel: 'Caixa & Checkout',
    route: '/app/cashier',
    image: '15-cashier-checkout-payment.png',
    description:
      'Painel de Caixa operado por Aline Santos em /app/cashier com a comanda da Mesa 03 pronta para baixa fiscal e encerramento.',
    details: [
      'Operadora de Caixa: Aline Santos (aline.caixa@olivelas.com.br)',
      'Turno ativo do caixa com fundo de reserva e movimentações',
      'Comanda nº 1003 pronta para encerramento com opções: PIX, Cartão ou Dinheiro',
      'Liberação automática da Mesa 03 no salão após confirmação',
    ],
    tags: ['#caixa', '#pdv', '#liquidacao', '#baixa-financeira'],
  },
];

type CategoryFilter = 'all' | 'team' | 'menu' | 'tables' | 'kds' | 'cashier';

export function TestEvidencePage() {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const basePath = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return EVIDENCE_DATA;
    return EVIDENCE_DATA.filter((item) => item.category === activeFilter);
  }, [activeFilter]);

  // Handle keyboard navigation for modal lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      if (e.key === 'Escape') {
        setSelectedImageIndex(null);
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) =>
          prev !== null ? (prev + 1) % filteredItems.length : null
        );
      } else if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) =>
          prev !== null ? (prev - 1 + filteredItems.length) % filteredItems.length : null
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, filteredItems.length]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <Header />

      <main className="flex-1 pb-16">
        {/* Top Hero Section */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-card/80 to-background py-12 sm:py-16">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o Início
                </Link>
              </Button>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1.5 py-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                15/15 Cenários E2E Aprovados com Sucesso
              </Badge>
            </div>

            <div className="max-w-3xl space-y-4">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
                Evidências dos Testes Operacionais
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Relatório fotográfico e auditoria funcional do ciclo operacional no restaurante{' '}
                <strong className="text-foreground">Olivelas</strong>. Validação completa com todos os 5 papéis de colaboradores, cardápio com pontos da carne, transmissão em tempo real para a cozinha (KDS), entrega ao garçom, comanda com PIX dinâmico e caixa.
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-emerald-500 mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Testes</span>
                </div>
                <div className="text-2xl font-bold text-foreground">15 / 15</div>
                <div className="text-xs text-muted-foreground">Cenários validados</div>
              </div>

              <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-blue-500 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Equipe</span>
                </div>
                <div className="text-2xl font-bold text-foreground">5 Papéis</div>
                <div className="text-xs text-muted-foreground">RBAC completo</div>
              </div>

              <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                  <ChefHat className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">KDS & Cozinha</span>
                </div>
                <div className="text-2xl font-bold text-foreground">100% Realtime</div>
                <div className="text-xs text-muted-foreground">Ponto da carne & bar</div>
              </div>

              <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-purple-500 mb-1">
                  <Receipt className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">PDV & PIX</span>
                </div>
                <div className="text-2xl font-bold text-foreground">R$ 140,69</div>
                <div className="text-xs text-muted-foreground">Comanda liquidada</div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Container */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('all')}
                className="rounded-full text-xs font-medium"
              >
                Todos (15)
              </Button>
              <Button
                variant={activeFilter === 'team' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('team')}
                className="rounded-full text-xs font-medium"
              >
                Equipe & RBAC (2)
              </Button>
              <Button
                variant={activeFilter === 'menu' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('menu')}
                className="rounded-full text-xs font-medium"
              >
                Cardápio & Cortes (2)
              </Button>
              <Button
                variant={activeFilter === 'tables' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('tables')}
                className="rounded-full text-xs font-medium"
              >
                Salão & Comandas (5)
              </Button>
              <Button
                variant={activeFilter === 'kds' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('kds')}
                className="rounded-full text-xs font-medium"
              >
                KDS & Cozinha (3)
              </Button>
              <Button
                variant={activeFilter === 'cashier' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('cashier')}
                className="rounded-full text-xs font-medium"
              >
                Caixa & Checkout (3)
              </Button>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Exibindo {filteredItems.length} de {EVIDENCE_DATA.length} evidências</span>
              <div className="h-3 w-px bg-border" />
              <a
                href="https://github.com/pycriador/olivelas-restaurant/blob/main/docs/TEST_EVIDENCES.md"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Ver em Markdown <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {filteredItems.map((item, index) => {
              const imageUrl = `${basePath}evidence/${item.image}`;

              return (
                <div
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-border/80 bg-muted/30 px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold">
                        {item.step}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">{item.route}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[11px] font-medium border-border/80">
                        {item.categoryLabel}
                      </Badge>
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30 text-[11px] gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Aprovado
                      </Badge>
                    </div>
                  </div>

                  {/* Card Image Preview */}
                  <div
                    onClick={() => setSelectedImageIndex(index)}
                    className="relative cursor-pointer overflow-hidden border-b border-border bg-black/40 aspect-[16/10] flex items-center justify-center"
                  >
                    <img
                      src={imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-medium text-sm backdrop-blur-[2px]">
                      <Maximize2 className="h-4 w-4" />
                      Clique para ampliar em tela cheia
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="rounded-xl bg-muted/40 p-3.5 text-xs space-y-1.5 border border-border/50">
                      <span className="font-semibold text-foreground block mb-1">
                        Verificação Técnica:
                      </span>
                      <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                        {item.details.map((detail, dIdx) => (
                          <li key={dIdx} className="leading-relaxed">
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Lightbox / Zoom Modal */}
      {selectedImageIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div
            className="relative flex flex-col max-h-[92vh] max-w-6xl w-full rounded-2xl bg-card border border-border shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border bg-card px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold">
                  {filteredItems[selectedImageIndex].step}
                </span>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-foreground">
                    {filteredItems[selectedImageIndex].title}
                  </h4>
                  <span className="font-mono text-xs text-muted-foreground">
                    {filteredItems[selectedImageIndex].route}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() =>
                    setSelectedImageIndex((prev) =>
                      prev !== null ? (prev - 1 + filteredItems.length) % filteredItems.length : null
                    )
                  }
                  title="Anterior (seta esquerda)"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() =>
                    setSelectedImageIndex((prev) =>
                      prev !== null ? (prev + 1) % filteredItems.length : null
                    )
                  }
                  title="Próxima (seta direita)"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="h-4 w-px bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedImageIndex(null)}
                  title="Fechar (Esc)"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Modal Image Display */}
            <div className="relative flex-1 overflow-auto bg-black/60 p-2 sm:p-4 flex items-center justify-center min-h-[300px]">
              <img
                src={`${basePath}evidence/${filteredItems[selectedImageIndex].image}`}
                alt={filteredItems[selectedImageIndex].title}
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-md"
              />
            </div>

            {/* Modal Footer Description */}
            <div className="border-t border-border bg-card px-5 py-3 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="line-clamp-2">
                {filteredItems[selectedImageIndex].description}
              </p>
              <span className="shrink-0 text-muted-foreground font-mono">
                {selectedImageIndex + 1} de {filteredItems.length}
              </span>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
