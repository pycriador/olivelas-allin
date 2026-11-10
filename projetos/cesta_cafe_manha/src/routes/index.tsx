import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Boxes, ChartNoAxesCombined, Check, Mail, ShieldCheck, Sparkles } from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

const TITLE = "Olivelas | Gestão para cestas de café";
const DESCRIPTION =
  "Produtos, estoque, custos e catálogo versionado em um só lugar para sua operação de cestas de café da manhã.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PLANS = [
  {
    name: "Essencial",
    price: "R$ 89",
    note: "por mês",
    features: ["Produtos e categorias", "Estoque básico", "1 usuário administrador"],
    highlight: false,
  },
  {
    name: "Operação",
    price: "R$ 189",
    note: "por mês",
    features: ["Lotes e movimentações", "Compras e fornecedores", "Até 5 usuários", "Catálogo versionado"],
    highlight: true,
  },
  {
    name: "Sob medida",
    price: "Combinar",
    note: "conforme o volume",
    features: ["Usuários ilimitados", "Relatórios financeiros", "Apoio na migração"],
    highlight: false,
  },
];


function Index() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 aurora-field opacity-80" aria-hidden />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
        <Logo />
        <Link
          to="/auth"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Entrar na plataforma
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-16 lg:px-8 lg:pt-24">
        <section className="max-w-3xl fade-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-accent" />
            Feito para quem monta cestas de café
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-7xl">
            Uma operação mais leve, da compra ao catálogo.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
            O Olivelas organiza produtos, estoque e custos para você montar cestas com clareza e
            publicar o catálogo certo para o seu time.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="gap-2 rounded-xl px-5">
              <Link to="/auth">
                Começar agora <ArrowRight className="size-4" />
              </Link>
            </Button>
            <span className="text-sm text-muted-foreground">
              Acesso por aprovação. Sem configuração complicada.
            </span>
          </div>
        </section>

        <section
          className="mt-24 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3"
          aria-label="Benefícios"
        >
          {[
            {
              icon: Boxes,
              title: "Estoque que acompanha o ritmo",
              text: "Produtos, lotes e movimentações organizados para a rotina real da montagem.",
            },
            {
              icon: ChartNoAxesCombined,
              title: "Custos à vista",
              text: "Compras e preços reunidos para decisões melhores, sem planilhas espalhadas.",
            },
            {
              icon: ShieldCheck,
              title: "Catálogo confiável",
              text: "Cada publicação é uma versão rastreável, comparável e compatível com seu montador.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <article key={title} className="bg-card/90 p-7 transition-colors hover:bg-card">
              <Icon className="size-5 text-accent" />
              <h2 className="mt-12 text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </section>

        <section className="mt-24" id="planos" aria-label="Planos">
          <h2 className="text-3xl font-semibold tracking-tight">Planos simples</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Comece pequeno e cresça conforme sua produção de cestas aumenta.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-2xl border p-7 ${
                  plan.highlight ? "border-accent bg-card glow" : "border-border bg-card/80"
                }`}
              >
                <h3 className="text-base font-semibold">{plan.name}</h3>
                <p className="mt-4 text-3xl font-semibold tracking-tight">{plan.price}</p>
                <p className="text-xs text-muted-foreground">{plan.note}</p>
                <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={plan.highlight ? "default" : "outline"}
                  className="mt-7 w-full rounded-xl"
                >
                  <Link to="/auth">Solicitar acesso</Link>
                </Button>
              </article>
            ))}
          </div>
        </section>

        <section
          className="mt-24 rounded-2xl border border-border bg-card/80 p-8 sm:p-10"
          id="contato"
          aria-label="Contato"
        >
          <h2 className="text-3xl font-semibold tracking-tight">Vamos conversar</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Conte como sua operação monta as cestas hoje e mostramos como o Olivelas se encaixa.
          </p>
          <Button asChild size="lg" className="mt-7 gap-2 rounded-xl">
            <a href="mailto:contato@olivelas.com.br">
              <Mail className="size-4" /> contato@olivelas.com.br
            </a>
          </Button>
        </section>
      </main>

      <footer className="relative z-10 mx-auto max-w-6xl px-6 pb-10 text-xs text-muted-foreground lg:px-8">
        © {new Date().getFullYear()} Olivelas · Cestas de café da manhã
      </footer>
    </div>
  );
}

