import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wrench, Users, Package, BookOpen, DollarSign, ShoppingCart, Truck,
  HeartHandshake, Building, BarChart3, Brain, Workflow, Globe, Cable,
  MessageSquare, FileText, Zap, Shield, LayoutDashboard, Server, Award,
  Cpu, Tags, Download, Upload, CreditCard, FileSpreadsheet, UserCheck,
  Factory, Smartphone, ConciergeBell, Bug, Ruler, CalendarRange,
  Layers, Search, FileDigit, Inbox, Menu, X, Sparkles, ExternalLink, type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

/* ───── Módulos ───── */

interface FeatureGroup {
  title: string;
  icon: LucideIcon;
  items: { label: string; icon: LucideIcon; desc: string }[];
}

const BUSINESS_MODULES: FeatureGroup[] = [
  {
    title: "Ordens de Serviço",
    icon: Wrench,
    items: [
      { label: "Dashboard", icon: LayoutDashboard, desc: "KPIs, SLA, indicadores em tempo real" },
      { label: "Gestão de OS", icon: FileSpreadsheet, desc: "Abertura, acompanhamento e encerramento" },
      { label: "Técnico Mobile", icon: Smartphone, desc: "App móvel para técnicos em campo" },
    ],
  },
  {
    title: "Clientes",
    icon: Users,
    items: [
      { label: "Cadastro", icon: UserCheck, desc: "Perfil completo, histórico e contratos" },
      { label: "Importação/Exportação", icon: Download, desc: "CSV, Excel, APIs" },
      { label: "Portal do Cliente", icon: Globe, desc: "Acompanhamento de OS e chamados" },
    ],
  },
  {
    title: "Ativos & Equipamentos",
    icon: Package,
    items: [
      { label: "Equipamentos", icon: Server, desc: "Inventário completo por cliente" },
      { label: "Marcas & Modelos", icon: Award, desc: "Catálogo estruturado" },
      { label: "Categorias", icon: Tags, desc: "Classificação por tipo e segmento" },
    ],
  },
  {
    title: "Knowledge Base",
    icon: BookOpen,
    items: [
      { label: "Biblioteca Técnica", icon: Layers, desc: "Manuais, diagrams e soluções" },
      { label: "Busca Inteligente", icon: Search, desc: "Full-text com filtros" },
      { label: "Analytics", icon: BarChart3, desc: "Artigos mais acessados" },
    ],
  },
  {
    title: "Financeiro",
    icon: DollarSign,
    items: [
      { label: "Faturamento", icon: CreditCard, desc: "Notas fiscais e cobrança" },
      { label: "Comissões", icon: UserCheck, desc: "Cálculo automático por técnico" },
      { label: "Relatórios", icon: BarChart3, desc: "DRE, fluxo de caixa, conciliação" },
    ],
  },
  {
    title: "Estoque & Compras",
    icon: Package,
    items: [
      { label: "Inventário", icon: Server, desc: "Controle de peças e insumos" },
      { label: "Compras", icon: ShoppingCart, desc: "Cotação, pedido e recebimento" },
      { label: "Fornecedores", icon: Truck, desc: "Catálogo e avaliação" },
    ],
  },
  {
    title: "CRM",
    icon: HeartHandshake,
    items: [
      { label: "Pipeline", icon: Layers, desc: "Funil de vendas e oportunidades" },
      { label: "Automação", icon: Workflow, desc: "E-mails e lembretes automáticos" },
      { label: "Relatórios", icon: BarChart3, desc: "Conversão e forecast" },
    ],
  },
  {
    title: "RH",
    icon: Building,
    items: [
      { label: "Funcionários", icon: Users, desc: "Cadastro, jornada e ponto" },
      { label: "Folha & Benefícios", icon: CreditCard, desc: "Cálculo automático" },
      { label: "Agenda", icon: CalendarRange, desc: "Férias, ausências e escala" },
    ],
  },
];

const PLATFORM_MODULES: FeatureGroup[] = [
  {
    title: "Comunicação",
    icon: MessageSquare,
    items: [
      { label: "Central de Atendimento", icon: Inbox, desc: "Tickets multi-canal" },
      { label: "Notificações", icon: Zap, desc: "Push, e-mail, SMS, WhatsApp" },
      { label: "Relatórios", icon: BarChart3, desc: "NPS, CSAT, SLA" },
    ],
  },
  {
    title: "IA & Automação",
    icon: Brain,
    items: [
      { label: "OCR Inteligente", icon: FileText, desc: "Reconhecimento de documentos" },
      { label: "Workflows", icon: Workflow, desc: "Automação de processos" },
      { label: "Agendador", icon: CalendarRange, desc: "Jobs e tarefas recorrentes" },
    ],
  },
  {
    title: "Relatórios & BI",
    icon: BarChart3,
    items: [
      { label: "Dashboards", icon: LayoutDashboard, desc: "Painéis customizáveis" },
      { label: "Widgets", icon: Layers, desc: "Gráficos e tabelas dinâmicas" },
      { label: "Agendamento", icon: CalendarRange, desc: "Relatórios periódicos" },
    ],
  },
  {
    title: "Integrações & API",
    icon: Cable,
    items: [
      { label: "Conectores", icon: Cable, desc: "ERP, CRM, e-commerce" },
      { label: "Webhooks", icon: Zap, desc: "Eventos em tempo real" },
      { label: "APIs REST", icon: Globe, desc: "API pública documentada" },
    ],
  },
  {
    title: "Portal & ERP",
    icon: Globe,
    items: [
      { label: "Portal do Cliente", icon: Globe, desc: "Autosserviço e acompanhamento" },
      { label: "Portal do Técnico", icon: Wrench, desc: "OS, estoque, rota" },
      { label: "Módulo ERP", icon: Building, desc: "Gestão empresarial integrada" },
    ],
  },
];

/* ───── Landing Page ───── */

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <PlatformFeaturesSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}

/* ───── NavBar ───── */

function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition">
          <Wrench className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight">ServiceForge</span>
        </Link>

        {/* NAVEGAÇÃO DESKTOP */}
        <nav className="hidden items-center gap-6 md:flex">
          <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Funcionalidades
          </a>
          <a href="#platform" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Plataforma
          </a>
          <Link to="/how-it-works" className="text-sm font-medium text-primary flex items-center gap-1 hover:text-primary/80 transition-colors">
            <Sparkles className="h-4 w-4" />
            Como Funciona & Manual
          </Link>
          <a
            href="/manual-do-sistema.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Manual HTML
          </a>
        </nav>

        {/* AÇÕES DESKTOP */}
        <div className="hidden sm:flex items-center gap-3">
          <Link to="/login">
            <Button variant="outline" size="sm">
              Entrar
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm">
              Criar Conta
            </Button>
          </Link>
        </div>

        {/* BOTÃO MOBILE */}
        <div className="flex md:hidden items-center gap-2">
          <Link to="/login">
            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs">
              Entrar
            </Button>
          </Link>
          <button
            type="button"
            className="p-2 rounded-md border text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* MENU DROPDOWN MOBILE */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b bg-background px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-2">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              Funcionalidades
            </a>
            <a
              href="#platform"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              Plataforma
            </a>
            <Link
              to="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium rounded-md bg-primary/10 text-primary flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Como Funciona o Sistema
            </Link>
            <a
              href="/manual-do-sistema.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Manual em HTML Público
            </a>
          </nav>
          <div className="pt-2 border-t flex flex-col gap-2">
            <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full">
                Criar Conta Gratuita
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* ───── Hero ───── */

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,hsl(var(--primary)/.06),transparent)]" />
      <div className="mx-auto max-w-7xl text-center">
        <Badge variant="secondary" className="mb-6">
          v1.0.0-RC1 — Plataforma de Assistência Técnica
        </Badge>
        <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Gestão completa para
          {" "}
          <span className="text-primary">assistências técnicas</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
          ServiceForge é um SaaS modular que unifica OS, clientes, ativos, financeiro, estoque,
          RH e muito mais em uma única plataforma. Do atendimento ao pós-venda, tudo num só lugar.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link to="/login">
            <Button size="lg" className="px-8">
              Começar Grátis
            </Button>
          </Link>
          <Link to="/how-it-works">
            <Button variant="outline" size="lg" className="px-6 gap-2 border-primary/30 hover:bg-primary/5">
              <Sparkles className="h-4 w-4 text-primary" />
              Como Funciona o Sistema
            </Button>
          </Link>
          <a href="/manual-do-sistema.html" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="lg" className="px-4 gap-1.5 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              Manual HTML
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ───── Stats ───── */

const STATS = [
  { label: "Módulos", value: "30+" },
  { label: "Telas Implementadas", value: "133" },
  { label: "Anos de Mercado (simulado)", value: "10+" },
  { label: "Open Source", value: "100%" },
];

function StatsSection() {
  return (
    <section className="border-y bg-muted/40 px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-primary sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── Módulos de Negócio ───── */

function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Módulos de Negócio
          </h2>
          <p className="mt-4 text-muted-foreground">
            Tudo que sua assistência técnica precisa para operar com excelência
          </p>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {BUSINESS_MODULES.map((group) => (
            <FeatureCard key={group.title} group={group} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── Módulos de Plataforma ───── */

function PlatformFeaturesSection() {
  return (
    <section id="platform" className="bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Plataforma & Infraestrutura
          </h2>
          <p className="mt-4 text-muted-foreground">
            Recursos transversais que potencializam todos os módulos
          </p>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_MODULES.map((group) => (
            <FeatureCard key={group.title} group={group} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───── Feature Card ───── */

function FeatureCard({ group }: { group: FeatureGroup }) {
  const Icon = group.icon;
  return (
    <div className="group rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold">{group.title}</h3>
      </div>
      <ul className="mt-5 space-y-3">
        {group.items.map((item) => {
          const ItemIcon = item.icon;
          return (
            <li key={item.label} className="flex items-start gap-2 text-sm text-muted-foreground">
              <ItemIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
              <div>
                <span className="font-medium text-foreground">{item.label}</span>
                <span className="block text-xs text-muted-foreground">{item.desc}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ───── CTA ───── */

function CTASection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Pronto para transformar sua assistência técnica?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Crie sua conta gratuita e explore todos os módulos. Sem cartão de crédito.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="px-8">
              Criar Conta Gratuita
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="px-8">
              Fazer Login
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ───── Footer ───── */

function FooterSection() {
  return (
    <footer className="border-t bg-muted/40 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wrench className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">ServiceForge</span>
            <span>v1.0.0-RC1</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link to="/how-it-works" className="hover:text-primary transition-colors flex items-center gap-1 font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Como Funciona & Evidências
            </Link>
            <a
              href="/manual-do-sistema.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors flex items-center gap-1 font-medium text-foreground"
            >
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              Manual do Sistema (HTML)
            </a>
            <Link to="/login" className="hover:text-primary transition-colors">
              Login
            </Link>
            <Link to="/register" className="hover:text-primary transition-colors">
              Cadastrar
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ServiceForge. Projeto open source.
          </p>
        </div>
      </div>
    </footer>
  );
}
