import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Flame,
  Grid3X3,
  Hash,
  HelpCircle,
  ImageOff,
  Layers,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Pin,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Tag,
  Ticket,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { CampaignStatusBadge } from "@/features/campaigns/components/campaign-status-badge";
import {
  listPublicCampaigns,
  type PublicCampaignCard,
} from "@/features/campaigns/public-campaign.functions";
import { ShowcaseCrmMockup } from "@/features/landing/components/showcase-crm-mockup";
import { ShowcaseDashboardMockup } from "@/features/landing/components/showcase-dashboard-mockup";
import { ShowcaseGridMockup } from "@/features/landing/components/showcase-grid-mockup";
import { ShowcaseWhatsappMockup } from "@/features/landing/components/showcase-whatsapp-mockup";
import { LandingFaq } from "@/features/landing/components/landing-faq";
import { formatCurrency, formatNumberRange } from "@/lib/format";
import { campaignMediaPublicUrl } from "@/services/campaign.service";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RaffleHub — Plataforma Completa de Rifas e Campanhas Digitais" },
      {
        name: "description",
        content:
          "Crie, gerencie e acompanhe rifas digitais com grade em tempo real, pedidos automáticos, fluxo nativo no WhatsApp, CRM de clientes e auditoria total.",
      },
      { property: "og:title", content: "RaffleHub — Plataforma Completa de Rifas Digitais" },
      {
        property: "og:description",
        content:
          "Grade em tempo real, bloqueio anti-conflito, fluxo WhatsApp e painel administrativo completo para rifas e ações digitais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  // The landing page must render even if the backend is unreachable (e.g. paused);
  // fall back to an empty campaign list instead of crashing the whole page.
  loader: async (): Promise<PublicCampaignCard[]> => {
    try {
      return await listPublicCampaigns();
    } catch (error) {
      console.error("[landing] failed to load public campaigns", error);
      return [];
    }
  },
  component: LandingPage,
});

const CAROUSEL_STEP = 3;

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = arr[i] as T;
    const b = arr[j] as T;
    arr[i] = b;
    arr[j] = a;
  }
  return arr;
}

function CoverImage({ campaign, className }: { campaign: PublicCampaignCard; className?: string }) {
  const coverUrl = campaignMediaPublicUrl(campaign.cover_image);
  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt={`Capa da campanha ${campaign.title}`}
        loading="lazy"
        className={`size-full object-cover ${className ?? ""}`}
      />
    );
  }
  return (
    <div
      className={`flex size-full items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-accent/20 ${
        className ?? ""
      }`}
    >
      <ImageOff aria-hidden="true" className="size-10 text-muted-foreground/60" />
    </div>
  );
}

function CampaignCardLink({
  campaign,
  className,
}: {
  campaign: PublicCampaignCard;
  className?: string;
}) {
  return (
    <article className={`surface-card group overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/40 ${className ?? ""}`}>
      <Link to="/r/$slug" params={{ slug: campaign.slug }} className="block">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <CoverImage
            campaign={campaign}
            className="transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3">
            <CampaignStatusBadge status={campaign.status} />
          </div>
        </div>
      </Link>

      <div className="space-y-3 p-5">
        <div>
          <Link
            to="/r/$slug"
            params={{ slug: campaign.slug }}
            className="line-clamp-1 text-base font-semibold hover:text-primary transition-colors"
          >
            {campaign.title}
          </Link>
          <p className="line-clamp-2 mt-1 text-xs text-muted-foreground">
            {campaign.short_description ?? campaign.product_name}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-2 text-xs border-t border-border/60 pt-3">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Tag aria-hidden="true" className="size-3.5 text-primary" />
            <span>{formatCurrency(campaign.price_per_number)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
            <Hash aria-hidden="true" className="size-3.5" />
            <span>{formatNumberRange(campaign.number_start, campaign.number_end)}</span>
          </div>
        </dl>

        <Button asChild size="sm" className="w-full gap-1.5 font-medium">
          <Link to="/r/$slug" params={{ slug: campaign.slug }}>
            Escolher Números
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

function FeaturedCampaign({ campaign }: { campaign: PublicCampaignCard }) {
  return (
    <section aria-label="Campanha em destaque" className="relative">
      <div className="surface-card grid overflow-hidden rounded-2xl border-primary/30 shadow-2xl lg:grid-cols-2">
        <Link
          to="/r/$slug"
          params={{ slug: campaign.slug }}
          className="relative block aspect-video overflow-hidden bg-muted lg:aspect-auto group"
        >
          <CoverImage
            campaign={campaign}
            className="transition-transform duration-700 group-hover:scale-105 lg:absolute lg:inset-0 lg:h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent lg:hidden" />
        </Link>

        <div className="flex flex-col justify-center gap-5 p-6 lg:p-10">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Flame aria-hidden="true" className="size-3.5 text-amber-500 animate-pulse" />
              Campanha em Destaque
            </span>
            <CampaignStatusBadge status={campaign.status} />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {campaign.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {campaign.short_description ?? campaign.product_name}
            </p>
          </div>

          <dl className="grid max-w-sm grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-border bg-card/60 p-3.5">
              <dt className="text-xs text-muted-foreground">Numeração</dt>
              <dd className="font-semibold font-mono text-sm mt-0.5">
                {formatNumberRange(campaign.number_start, campaign.number_end)}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-3.5">
              <dt className="text-xs text-muted-foreground">Valor por cota</dt>
              <dd className="font-bold text-primary text-base mt-0.5">
                {formatCurrency(campaign.price_per_number)}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg" className="gap-2 font-semibold shadow-lg">
              <Link to="/r/$slug" params={{ slug: campaign.slug }}>
                Participar da Rifa
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CampaignCarousel({ campaigns }: { campaigns: PublicCampaignCard[] }) {
  const [pool, setPool] = useState<PublicCampaignCard[]>([]);
  const [start, setStart] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPool(shuffle(campaigns));
    setStart(0);
    setReady(true);
  }, [campaigns]);

  const visible = useMemo(() => {
    if (ready && pool.length > 0) {
      return Array.from(
        { length: CAROUSEL_STEP },
        (_, i) => pool[(start + i) % pool.length],
      ).filter((item): item is PublicCampaignCard => Boolean(item));
    }
    return campaigns.slice(0, CAROUSEL_STEP);
  }, [ready, pool, start, campaigns]);

  const canNavigate = campaigns.length > CAROUSEL_STEP;

  const handleNext = () => {
    if (!canNavigate) return;
    const nextStart = start + CAROUSEL_STEP;
    if (nextStart >= pool.length) {
      setPool(shuffle(pool));
      setStart(0);
    } else {
      setStart(nextStart);
    }
  };

  const handlePrev = () => {
    if (!canNavigate) return;
    const prevStart = start - CAROUSEL_STEP;
    if (prevStart < 0) {
      setPool(shuffle(pool));
      setStart(Math.max(0, pool.length - CAROUSEL_STEP));
    } else {
      setStart(prevStart);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-xl font-bold tracking-tight">
            {campaigns.length > 0 ? "Todas as Campanhas Ativas" : "Campanhas Disponíveis"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {campaigns.length > 0
              ? `Acompanhe e participe das ações ativas na plataforma.`
              : "Nenhuma outra campanha aberta no momento."}
          </p>
        </div>
        {canNavigate ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Campanhas anteriores"
              onClick={handlePrev}
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Próximas campanhas"
              onClick={handleNext}
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((campaign) => (
          <CampaignCardLink key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </div>
  );
}

const EMPTY_CAMPAIGNS: PublicCampaignCard[] = [];

function LandingPage() {
  const { isAuthenticated } = useAuth();
  const campaigns = Route.useLoaderData() ?? EMPTY_CAMPAIGNS;

  const featured = useMemo(() => campaigns.find((campaign) => campaign.is_featured), [campaigns]);
  const carouselItems = useMemo(
    () => campaigns.filter((campaign) => campaign.id !== featured?.id),
    [campaigns, featured],
  );

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-105">
              <Ticket aria-hidden="true" className="size-5" />
            </span>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight">RaffleHub</span>
              <span className="text-[10px] text-muted-foreground -mt-1">Gestão de Rifas</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#recursos" className="hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#telas" className="hover:text-foreground transition-colors">
              Showcase & Telas
            </a>
            <Link to="/como-funciona" className="hover:text-primary transition-colors text-foreground font-semibold flex items-center gap-1">
              <span>Como Funciona</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/40 text-primary">Manual</Badge>
            </Link>
            <a href="#campanhas" className="hover:text-foreground transition-colors">
              Campanhas
            </a>
            <a href="#duvidas" className="hover:text-foreground transition-colors">
              Dúvidas
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild size="sm" className="font-semibold shadow-sm">
              <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                {isAuthenticated ? "Ir para o Painel" : "Acessar Plataforma"}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="space-y-24 sm:space-y-32">
        {/* 2. Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="size-[600px] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
          </div>

          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6 shadow-sm">
              <Sparkles className="size-3.5" />
              Plataforma SaaS Profissional de Rifas Digitais
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-balance">
              Crie, gerencie e escale suas rifas com{" "}
              <span className="bg-gradient-to-r from-primary via-emerald-500 to-primary bg-clip-text text-transparent">
                controle em tempo real
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto text-balance leading-relaxed">
              Grade interativa com bloqueio anti-conflito, fluxo nativo no WhatsApp sem complicação,
              CRM de compradores e auditoria imutável para organizadores e participantes.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="h-12 px-8 text-base font-semibold shadow-lg gap-2">
                <a href="#campanhas">
                  Ver Rifas Abertas
                  <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
                <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                  {isAuthenticated ? "Painel Administrativo" : "Criar Minha Campanha"}
                </Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div className="rounded-xl border border-border/80 bg-card/50 p-4 backdrop-blur">
                <Zap className="size-5 text-primary mb-2" />
                <h4 className="text-xs font-bold text-foreground">Grade em Tempo Real</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Sincronização instantânea das cotas</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-card/50 p-4 backdrop-blur">
                <Lock className="size-5 text-emerald-500 mb-2" />
                <h4 className="text-xs font-bold text-foreground">Anti-Conflito Atômico</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">PostgreSQL locks contra duplicidades</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-card/50 p-4 backdrop-blur">
                <MessageSquare className="size-5 text-emerald-600 mb-2" />
                <h4 className="text-xs font-bold text-foreground">Checkout WhatsApp</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Mensagens automáticas prontas</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-card/50 p-4 backdrop-blur">
                <ShieldCheck className="size-5 text-blue-500 mb-2" />
                <h4 className="text-xs font-bold text-foreground">Auditoria & CRM</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Histórico completo de cada pedido</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Showcase & Interactive Mockups */}
        <section id="telas" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-24">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="outline" className="text-primary border-primary/30">
              Usabilidade & Interfaces
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              Conheça a plataforma por dentro
            </h2>
            <p className="text-sm text-muted-foreground">
              Projetado para ser simples para o comprador no celular e extremamente poderoso para o organizador no computador.
            </p>
          </div>

          <Tabs defaultValue="grid" className="w-full space-y-6">
            <div className="flex justify-center">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1.5 max-w-2xl w-full">
                <TabsTrigger value="grid" className="py-2 text-xs sm:text-sm gap-2">
                  <Grid3X3 className="size-4" />
                  Grade Realtime
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="py-2 text-xs sm:text-sm gap-2">
                  <LayoutDashboard className="size-4" />
                  Painel de Pedidos
                </TabsTrigger>
                <TabsTrigger value="crm" className="py-2 text-xs sm:text-sm gap-2">
                  <Users className="size-4" />
                  CRM & Clientes
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="py-2 text-xs sm:text-sm gap-2">
                  <MessageSquare className="size-4" />
                  Fluxo WhatsApp
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="grid" className="space-y-4 outline-none">
              <ShowcaseGridMockup />
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-4 outline-none">
              <ShowcaseDashboardMockup />
            </TabsContent>

            <TabsContent value="crm" className="space-y-4 outline-none">
              <ShowcaseCrmMockup />
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4 outline-none">
              <ShowcaseWhatsappMockup />
            </TabsContent>
          </Tabs>
        </section>

        {/* 4. Advanced Features Grid */}
        <section id="recursos" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 scroll-mt-24">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <Badge variant="outline" className="text-primary border-primary/30">
              Recursos Avançados
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Tudo o que você precisa para gerenciar rifas de sucesso
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Desenvolvido com tecnologia de ponta para eliminar erros operacionais, perdas de vendas e cotas vendidas duas vezes.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur space-y-3 hover:border-primary/40 transition-colors">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Zap className="size-5" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Grade Virtualizada de Alta Performance</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Suporta desde rifas pequenas de 100 números até mega ações de 100.000 números sem travar o navegador ou consumir memória excessiva.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur space-y-3 hover:border-primary/40 transition-colors">
              <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <Lock className="size-5" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Bloqueios Atômicos Anti-Conflito</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Quando um comprador seleciona uma cota, o banco de dados aplica um lock seguro. Dois compradores nunca conseguem pegar o mesmo número.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur space-y-3 hover:border-primary/40 transition-colors">
              <div className="size-10 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold">
                <MessageSquare className="size-5" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Atendimento Direto no WhatsApp</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gera links e mensagens dinâmicas personalizadas com substituição automática de nome, produto, cotas e valor a pagar via Pix.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur space-y-3 hover:border-primary/40 transition-colors">
              <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                <UserCheck className="size-5" />
              </div>
              <h3 className="font-bold text-lg text-foreground">CRM de Compradores Inteligente</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Identificação automática pelo telefone, histórico de todas as participações, detecção de compradores VIP e ticket médio acumulado.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur space-y-3 hover:border-primary/40 transition-colors">
              <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <RefreshCw className="size-5" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Troca e Edição Flexível de Cotas</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O cliente mudou de ideia? Adicione, remova ou troque cotas de um pedido aberto em 1 clique sem precisar cancelar ou recriar a venda.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur space-y-3 hover:border-primary/40 transition-colors">
              <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                <FileCheck2 className="size-5" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Auditoria & Gestão de Comprovantes</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Anexe fotos de comprovantes Pix e PDFs aos pedidos e acompanhe a linha do tempo imutável de quem criou, confirmou ou alterou cada registro.
              </p>
            </div>
          </div>
        </section>

        {/* 5. How It Works Section */}
        <section id="como-funciona" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12 scroll-mt-24">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="outline" className="text-primary border-primary/30">
              Passo a Passo
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              Como funciona o ciclo do RaffleHub?
            </h2>
            <p className="text-sm text-muted-foreground">
              Fluxo claro e otimizado tanto para quem organiza quanto para quem participa.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* For Organizers */}
            <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-lg">Para o Organizador</h3>
                  <p className="text-xs text-muted-foreground">Controle total do início ao sorteio</p>
                </div>
              </div>

              <ol className="space-y-4 text-xs">
                <li className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                    1
                  </span>
                  <div>
                    <strong className="text-foreground block text-sm">Crie a Campanha</strong>
                    <span className="text-muted-foreground">
                      Defina o título, produto, valor por cota, quantidade de números e fotos do prêmio.
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                    2
                  </span>
                  <div>
                    <strong className="text-foreground block text-sm">Divulgue o Link Público</strong>
                    <span className="text-muted-foreground">
                      Compartilhe o link <code className="text-primary">/r/sua-campanha</code> no Instagram, WhatsApp e redes sociais.
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                    3
                  </span>
                  <div>
                    <strong className="text-foreground block text-sm">Acompanhe Pedidos no Painel</strong>
                    <span className="text-muted-foreground">
                      Veja as reservas chegando em tempo real, anexe comprovantes e confirme os pagamentos.
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                    4
                  </span>
                  <div>
                    <strong className="text-foreground block text-sm">Realize o Sorteio com Segurança</strong>
                    <span className="text-muted-foreground">
                      Com todos os números auditados e clientes cadastrados no CRM, faça o sorteio com total transparência.
                    </span>
                  </div>
                </li>
              </ol>
            </div>

            {/* For Buyers */}
            <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="size-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-lg">Para o Participante</h3>
                  <p className="text-xs text-muted-foreground">Compra rápida sem criar conta obrigatória</p>
                </div>
              </div>

              <ol className="space-y-4 text-xs">
                <li className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[11px]">
                    1
                  </span>
                  <div>
                    <strong className="text-foreground block text-sm">Escolha seus Números da Sorte</strong>
                    <span className="text-muted-foreground">
                      Navegue na grade visual interativa e selecione as cotas desejadas ou use a seleção aleatória.
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[11px]">
                    2
                  </span>
                  <div>
                    <strong className="text-foreground block text-sm">Informe Nome e WhatsApp</strong>
                    <span className="text-muted-foreground">
                      O sistema bloqueia suas cotas temporariamente para garantir que ninguém pegue antes.
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[11px]">
                    3
                  </span>
                  <div>
                    <strong className="text-foreground block text-sm">Envie a Mensagem Pré-Pronta</strong>
                    <span className="text-muted-foreground">
                      Com 1 toque, seu WhatsApp abre com o pedido montado e você combina o Pix com o organizador.
                    </span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[11px]">
                    4
                  </span>
                  <div>
                    <strong className="text-foreground block text-sm">Cotas Confirmadas</strong>
                    <span className="text-muted-foreground">
                      Assim que o organizador confirma o Pix, seus números mudam para verde (PAGO) na grade oficial.
                    </span>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* 6. Active Campaigns Section (Vitrine) */}
        <section id="campanhas" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 scroll-mt-24">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="outline" className="text-primary border-primary/30">
              Vitrine Oficial
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Campanhas Abertas Agora
            </h2>
            <p className="text-sm text-muted-foreground">
              Confira as rifas ativas na plataforma e garanta seus números da sorte.
            </p>
          </div>

          <div className="space-y-12">
            {featured ? <FeaturedCampaign campaign={featured} /> : null}

            {carouselItems.length > 0 ? (
              <CampaignCarousel campaigns={carouselItems} />
            ) : !featured ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center max-w-md mx-auto space-y-4">
                <Ticket className="size-10 text-muted-foreground mx-auto" />
                <h3 className="font-semibold text-base">Nenhuma campanha pública no momento</h3>
                <p className="text-xs text-muted-foreground">
                  Seja o primeiro a publicar uma rifa profissional e começar a vender hoje mesmo!
                </p>
                <Button asChild size="sm">
                  <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                    Criar Primeira Rifa
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </section>

        {/* 7. FAQ Section */}
        <section id="duvidas" className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10 scroll-mt-24">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="outline" className="text-primary border-primary/30">
              Perguntas Frequentes
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              Tire suas dúvidas sobre o RaffleHub
            </h2>
            <p className="text-sm text-muted-foreground">
              Respostas diretas sobre como funcionam as vendas, reservas, segurança e pagamentos.
            </p>
          </div>

          <LandingFaq />
        </section>

        {/* 8. High-Converting CTA Banner */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-12">
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-background to-accent/20 p-8 sm:p-14 text-center shadow-2xl space-y-6">
            <div className="size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto shadow-md">
              <Ticket className="size-6" />
            </div>

            <div className="space-y-3 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Pronto para profissionalizar suas rifas e ações digitais?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Comece agora mesmo com grade em tempo real, fluxo integrado ao WhatsApp e CRM completo para seus clientes.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button asChild size="lg" className="h-12 px-8 text-base font-semibold shadow-xl">
                <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                  {isAuthenticated ? "Acessar Painel do Organizador" : "Criar Minha Campanha Agora"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* 9. Modern Footer */}
      <footer className="border-t border-border bg-card/40 py-12 text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
              <Ticket className="size-3.5" />
            </span>
            <span className="font-bold text-foreground text-sm">RaffleHub</span>
            <span className="text-[11px]">— Plataforma de Rifas & Campanhas Digitais</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#recursos" className="hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#telas" className="hover:text-foreground transition-colors">
              Usabilidade
            </a>
            <Link to="/como-funciona" className="hover:text-foreground transition-colors font-medium">
              Como Funciona & Manual
            </Link>
            <a href="/docs/index.html" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Manual HTML
            </a>
            <a href="#duvidas" className="hover:text-foreground transition-colors">
              FAQ
            </a>
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Login
            </Link>
          </div>

          <div>
            <p>© {new Date().getFullYear()} RaffleHub. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
