import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileCode,
  FileText,
  Filter,
  Grid3X3,
  HelpCircle,
  History,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Phone,
  Printer,
  RefreshCw,
  Search,
  Share2,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Ticket,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { ArtCreationMockup } from "@/features/docs/components/art-creation-mockup";
import { ApprovalWorkflowMockup } from "@/features/docs/components/approval-workflow-mockup";
import { SearchEvidenceMockup } from "@/features/docs/components/search-evidence-mockup";
import { UserManagementMockup } from "@/features/docs/components/user-management-mockup";
import { ShowcaseCrmMockup } from "@/features/landing/components/showcase-crm-mockup";
import { ShowcaseDashboardMockup } from "@/features/landing/components/showcase-dashboard-mockup";
import { ShowcaseGridMockup } from "@/features/landing/components/showcase-grid-mockup";
import { ShowcaseWhatsappMockup } from "@/features/landing/components/showcase-whatsapp-mockup";
import { LandingFaq } from "@/features/landing/components/landing-faq";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como Funciona o Sistema & Manual Completo — RaffleHub" },
      {
        name: "description",
        content:
          "Manual completo, evidências de busca, criação de artes, fluxo de aprovação, gestão de usuários e guia operacional do RaffleHub.",
      },
      {
        property: "og:title",
        content: "Como Funciona o Sistema & Manual Completo — RaffleHub",
      },
      {
        property: "og:description",
        content:
          "Guia passo a passo com evidências de telas, busca inteligente, artes, usuários e manual de operações.",
      },
    ],
  }),
  component: ComoFuncionaPage,
});

function ComoFuncionaPage() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const sections = [
    { id: "visao-geral", title: "1. Visão Geral & Arquitetura", icon: Zap },
    { id: "busca", title: "2. Evidências de Busca & Filtros", icon: Search },
    { id: "artes", title: "3. Criação de Artes & Galeria", icon: ImageIcon },
    { id: "aprovacao", title: "4. Fluxo de Aprovação & Auditoria", icon: ShieldCheck },
    { id: "usuarios", title: "5. Cadastro de Usuários & RBAC", icon: Users },
    { id: "manual", title: "6. Manual Operacional Completo", icon: BookOpen },
    { id: "duvidas", title: "7. Perguntas Frequentes (FAQ)", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
              <Link to="/">
                <ArrowLeft className="size-4" />
                Início
              </Link>
            </Button>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <Link to="/" className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                <Ticket className="size-4" />
              </span>
              <span className="font-bold text-sm tracking-tight hidden sm:inline">RaffleHub</span>
              <Badge variant="outline" className="text-[10px] ml-1">Manual do Sistema</Badge>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
              <a href="/docs/index.html" target="_blank" rel="noopener noreferrer">
                <FileCode className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Versão HTML Pública</span>
                <ExternalLink className="size-3 opacity-60" />
              </a>
            </Button>

            <Button asChild size="sm" className="font-semibold text-xs shadow-sm">
              <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                {isAuthenticated ? "Ir para o Painel" : "Acessar Plataforma"}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Sticky Sidebar Navigation (Desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Índice do Manual
                </h4>
                <p className="text-[11px] text-muted-foreground">Navegue pelos módulos e evidências</p>
              </div>

              <nav className="space-y-1 text-xs">
                {sections.map((sec) => {
                  const Icon = sec.icon;
                  return (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors font-medium"
                    >
                      <Icon className="size-3.5 text-primary shrink-0" />
                      <span className="truncate">{sec.title}</span>
                    </a>
                  );
                })}
              </nav>

              <div className="pt-2 border-t border-border">
                <Button asChild variant="ghost" size="sm" className="w-full justify-start text-[11px] gap-2 text-muted-foreground">
                  <a href="/docs/index.html" target="_blank" rel="noopener noreferrer">
                    <Download className="size-3.5" />
                    Baixar Manual (HTML)
                  </a>
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Article */}
          <main className="space-y-16 lg:max-w-4xl">
            {/* Header Hero Banner */}
            <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/15 p-6 sm:p-10 space-y-4 shadow-sm">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <BookOpen className="size-3.5" />
                Documentação Oficial & Guia de Uso
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance">
                Como Funciona a Plataforma RaffleHub
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl text-balance">
                Este documento apresenta a arquitetura, telas, evidências de busca, fluxos de artes, aprovações, cadastro de usuários e o manual operacional completo do sistema.
              </p>

              {/* Quick Action Badges */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary" className="gap-1 text-xs py-1">
                  <Zap className="size-3 text-primary" /> Tempo Real
                </Badge>
                <Badge variant="secondary" className="gap-1 text-xs py-1">
                  <Lock className="size-3 text-emerald-500" /> PostgreSQL Locks
                </Badge>
                <Badge variant="secondary" className="gap-1 text-xs py-1">
                  <MessageSquare className="size-3 text-emerald-600" /> WhatsApp Direct
                </Badge>
                <Badge variant="secondary" className="gap-1 text-xs py-1">
                  <ShieldCheck className="size-3 text-blue-500" /> RBAC & RLS
                </Badge>
              </div>
            </section>

            {/* SEÇÃO 1: VISÃO GERAL */}
            <section id="visao-geral" className="space-y-6 scroll-mt-24">
              <div className="space-y-2 border-b border-border pb-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Zap className="size-4" /> Módulo 01
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  1. Visão Geral & Arquitetura da Plataforma
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  O RaffleHub foi projetado para eliminar problemas crônicos da gestão de rifas tradicionais: conflitos de cotas duplicadas, perdas de comprovantes, atrasos no WhatsApp e falta de auditoria.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-card/60 p-4 space-y-2">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Grid3X3 className="size-4 text-primary" />
                    Grade Reativa
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Sincronização em tempo real via Supabase Realtime Channels. Quando um número é selecionado ou pago, todos os participantes veem a mudança instantaneamente.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/60 p-4 space-y-2">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Lock className="size-4 text-emerald-500" />
                    Lock Anti-Conflito
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Garantia transacional de consistência com <code className="text-[11px] font-mono">pg_advisory_xact_lock</code>. Zero possibilidade de cotas duplicadas.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/60 p-4 space-y-2">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <FileCheck2 className="size-4 text-blue-500" />
                    Arquitetura em Pedidos
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Toda venda (manual, online ou WhatsApp) gera obrigatoriamente um registro <code className="text-[11px] font-mono">Order</code> com rastreabilidade total.
                  </p>
                </div>
              </div>
            </section>

            {/* SEÇÃO 2: EVIDÊNCIAS DE BUSCA */}
            <section id="busca" className="space-y-6 scroll-mt-24">
              <div className="space-y-2 border-b border-border pb-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Search className="size-4" /> Módulo 02
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  2. Evidências de Busca & Filtros Inteligentes
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  O sistema conta com três motores de busca de alta velocidade desenvolvidos para agilizar o atendimento presencial e digital:
                </p>
              </div>

              <div className="space-y-4">
                <SearchEvidenceMockup />
                
                <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3 text-xs">
                  <h4 className="font-bold text-sm text-foreground">Destaques Técnicos do Motor de Busca:</h4>
                  <ul className="grid sm:grid-cols-2 gap-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Interpretação de Intervalos:</strong> Suporta entradas compostas como <code className="font-mono">1-10, 50, 70-90</code> com ordenação e deduplicação automática.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Sanitização de Telefone:</strong> Limpa caracteres especiais automaticamente (<code className="font-mono">(11) 98842-1100</code> ➔ <code className="font-mono">11988421100</code>).</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* SEÇÃO 3: CRIAÇÃO DE ARTES */}
            <section id="artes" className="space-y-6 scroll-mt-24">
              <div className="space-y-2 border-b border-border pb-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <ImageIcon className="size-4" /> Módulo 03
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  3. Criação de Artes, Galeria & Metatags SEO
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Gerenciador completo de arquivos e mídias visuais para atrair compradores nas redes sociais e garantir links atraentes no WhatsApp.
                </p>
              </div>

              <div className="space-y-4">
                <ArtCreationMockup />

                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                    <strong className="text-foreground block">Compressão Automática</strong>
                    <span className="text-muted-foreground">Otimização de tamanho sem perda de nitidez para carregamento instantâneo em 3G/4G.</span>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                    <strong className="text-foreground block">OpenGraph Dinâmico</strong>
                    <span className="text-muted-foreground">Geração automática de cards para WhatsApp com foto de capa e valor da cota em destaque.</span>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                    <strong className="text-foreground block">Reordenação Intuitiva</strong>
                    <span className="text-muted-foreground">Arraste as fotos para definir a imagem principal da rifa e os detalhes do produto.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SEÇÃO 4: FLUXO DE APROVAÇÃO */}
            <section id="aprovacao" className="space-y-6 scroll-mt-24">
              <div className="space-y-2 border-b border-border pb-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="size-4" /> Módulo 04
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  4. Fluxo de Aprovação de Artes & Ciclo de Vida da Campanha
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Para garantir segurança jurídica e transparência aos compradores, as campanhas seguem uma máquina de estados estrita com auditoria:
                </p>
              </div>

              <div className="space-y-4">
                <ApprovalWorkflowMockup />

                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-sm text-foreground">Regras de Bloqueio e Validação:</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Uma campanha não pode ser publicada (<code className="font-mono">ACTIVE</code>) sem ter sua arte de capa carregada, valor unitário maior que zero, limite máximo de cotas por participante e número de WhatsApp de atendimento válido.
                  </p>
                </div>
              </div>
            </section>

            {/* SEÇÃO 5: CADASTRO DE USUÁRIOS & RBAC */}
            <section id="usuarios" className="space-y-6 scroll-mt-24">
              <div className="space-y-2 border-b border-border pb-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Users className="size-4" /> Módulo 05
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  5. Cadastro de Usuários, Perfis & Permissões (RBAC)
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Gestão multi-usuário com controle granular de acesso, ideal para equipes com atendentes, operadores de balcão e administradores:
                </p>
              </div>

              <div className="space-y-4">
                <UserManagementMockup />

                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 text-xs">
                  <h4 className="font-bold text-sm text-foreground">Segurança em Camadas:</h4>
                  <ul className="space-y-1.5 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      <span><strong>Autenticação Segura:</strong> JWT Tokens criptografados com expiração controlada e refresh automático.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      <span><strong>Proteção RLS no PostgreSQL:</strong> Cada consulta SQL é filtrada pelo ID e permissão do usuário conectado.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* SEÇÃO 6: MANUAL OPERACIONAL COMPLETO */}
            <section id="manual" className="space-y-8 scroll-mt-24">
              <div className="space-y-2 border-b border-border pb-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <BookOpen className="size-4" /> Módulo 06
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  6. Manual Operacional Completo da Aplicação
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Guia passo a passo para as operações diárias dos organizadores e operadores de campanha:
                </p>
              </div>

              <Tabs defaultValue="grid-op" className="w-full space-y-6">
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto p-1">
                  <TabsTrigger value="grid-op" className="text-xs py-2 gap-1.5">
                    <Grid3X3 className="size-3.5" />
                    Grade Visual
                  </TabsTrigger>
                  <TabsTrigger value="orders-op" className="text-xs py-2 gap-1.5">
                    <LayoutDashboard className="size-3.5" />
                    Gestão de Pedidos
                  </TabsTrigger>
                  <TabsTrigger value="crm-op" className="text-xs py-2 gap-1.5">
                    <Users className="size-3.5" />
                    CRM & Venda Manual
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp-op" className="text-xs py-2 gap-1.5">
                    <MessageSquare className="size-3.5" />
                    WhatsApp & Checkout
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="grid-op" className="space-y-4">
                  <ShowcaseGridMockup />
                  <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-sm text-foreground">Como operar a Grade Visual:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground leading-relaxed">
                      <li>Acesse a campanha no painel administrativo e clique na aba <strong>Grade Visual</strong>.</li>
                      <li>Utilize a busca rápida para localizar números específicos ou visualize a legenda de cores (Livre, Reservado, Pago).</li>
                      <li>Clique nos números livres para selecionar e clique no botão <strong>Nova Venda Manual</strong> para registrar uma compra de balcão.</li>
                    </ol>
                  </div>
                </TabsContent>

                <TabsContent value="orders-op" className="space-y-4">
                  <ShowcaseDashboardMockup />
                  <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-sm text-foreground">Como gerenciar pedidos e comprovantes:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground leading-relaxed">
                      <li>Acesse o menu <strong>Pedidos</strong> para ver a lista de reservas online e solicitações via WhatsApp.</li>
                      <li>Clique no pedido para abrir os detalhes, visualizar cotas reservadas e anexar o comprovante Pix enviado pelo cliente.</li>
                      <li>Ao confirmar o recebimento do valor, altere o status para <strong>PAID (Confirmado)</strong> para liberar as cotas em verde.</li>
                    </ol>
                  </div>
                </TabsContent>

                <TabsContent value="crm-op" className="space-y-4">
                  <ShowcaseCrmMockup />
                  <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-sm text-foreground">Como usar o CRM e fazer Vendas Manuais:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground leading-relaxed">
                      <li>No menu <strong>Clientes</strong> ou no diálogo de <strong>Nova Venda Manual</strong>, digite o telefone do comprador.</li>
                      <li>O sistema carrega os dados cadastrados, histórico de compras e cotas acumuladas.</li>
                      <li>Digite a lista de cotas (ex: <code className="font-mono">10, 20, 30-50</code>), selecione a forma de pagamento (Dinheiro, Pix, Cartão) e salve.</li>
                      <li>Caso o cliente deseje substituir uma cota, use a opção <strong>Trocar Número</strong> sem precisar cancelar o pedido.</li>
                    </ol>
                  </div>
                </TabsContent>

                <TabsContent value="whatsapp-op" className="space-y-4">
                  <ShowcaseWhatsappMockup />
                  <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-sm text-foreground">Como funciona o fluxo pelo WhatsApp:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground leading-relaxed">
                      <li>O participante acessa o link público <code className="font-mono">/r/sua-campanha</code> e escolhe os números na grade.</li>
                      <li>O participante informa seu Nome e WhatsApp e clica em <strong>Enviar WhatsApp</strong>.</li>
                      <li>O sistema gera um Token de Reserva que bloqueia as cotas por 10 minutos (status <code className="font-mono">WAITING_CONTACT</code>).</li>
                      <li>O WhatsApp do organizador recebe a mensagem formatada com o resumo do pedido e chave Pix para pagamento.</li>
                    </ol>
                  </div>
                </TabsContent>
              </Tabs>
            </section>

            {/* SEÇÃO 7: FAQ */}
            <section id="duvidas" className="space-y-6 scroll-mt-24">
              <div className="space-y-2 border-b border-border pb-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <HelpCircle className="size-4" /> Módulo 07
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  7. Perguntas Frequentes & Dúvidas Rápidas
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Respostas para dúvidas frequentes sobre concorrência de cotas, pagamentos e uso em smartphones:
                </p>
              </div>

              <LandingFaq />
            </section>

            {/* CTA Final */}
            <section className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-accent/20 p-8 text-center space-y-4 shadow-xl">
              <h3 className="text-2xl font-bold text-foreground">
                Pronto para colocar sua campanha no ar?
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
                Acesse o painel agora mesmo e aproveite todas as ferramentas de vendas, CRM e auditoria em tempo real.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button asChild size="lg" className="font-semibold shadow-md gap-2">
                  <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                    {isAuthenticated ? "Ir para o Painel" : "Acessar Plataforma"}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <a href="/docs/index.html" target="_blank" rel="noopener noreferrer">
                    <FileCode className="size-4 text-primary" />
                    Abrir Documentação HTML
                  </a>
                </Button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
