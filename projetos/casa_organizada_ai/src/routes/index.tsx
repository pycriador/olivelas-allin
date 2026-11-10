import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CheckSquare,
  FileText,
  Palette,
  Share2,
  Printer,
  Repeat,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-home.jpg";
import familyImage from "@/assets/scene-family.jpg";
import deskImage from "@/assets/scene-desk.jpg";
import petsImage from "@/assets/scene-pets.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "HomeFlow — Planejamento elegante para casa, família e trabalho" },
      {
        name: "description",
        content:
          "Crie planners, checklists e rotinas sob medida. Templates prontos, personalização completa e exportação em PDF para casa, família e trabalho.",
      },
      { property: "og:title", content: "HomeFlow — Planejamento elegante para a vida real" },
      {
        property: "og:description",
        content:
          "Planners, checklists e rotinas personalizadas para casa, família e trabalho. Comece grátis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const pillars = [
  {
    icon: CalendarDays,
    title: "Rotinas com ritmo",
    desc: "Semana, mês e ano em uma leitura clara — sem ruído, sem excesso.",
  },
  {
    icon: CheckSquare,
    title: "Checklists sob medida",
    desc: "Construa qualquer formulário ou lista com o editor visual.",
  },
  {
    icon: Palette,
    title: "Identidade própria",
    desc: "Cores, tipografia e layout ajustados ao seu gosto no Theme Builder.",
  },
  {
    icon: Printer,
    title: "Impressão impecável",
    desc: "Exporte em PDF com margens, capa e cabeçalhos de nível editorial.",
  },
  {
    icon: Share2,
    title: "Feito a várias mãos",
    desc: "Compartilhe com a família ou com o time e acompanhe junto.",
  },
  {
    icon: Repeat,
    title: "Automatize o repetitivo",
    desc: "Rotinas recorrentes e lembretes que seguem sozinhos.",
  },
];

const scenes = [
  {
    img: familyImage,
    kicker: "Em casa",
    title: "A casa em ordem, sem planilhas",
    desc: "Limpeza, contas, compras e a agenda das crianças em um único quadro que todos entendem.",
    items: ["Faxina semanal", "Rotina escolar", "Lista de compras", "Contas do mês"],
  },
  {
    img: deskImage,
    kicker: "No trabalho",
    title: "Projetos com começo, meio e entrega",
    desc: "Do briefing ao follow-up: checklists reutilizáveis que mantêm o time no mesmo compasso.",
    items: ["Projetos", "Reuniões", "Entregas", "Metas do trimestre"],
  },
  {
    img: petsImage,
    kicker: "Nos detalhes",
    title: "Cuidados que não podem passar",
    desc: "Pets, saúde, medicamentos e lembretes recorrentes — anotados uma vez, lembrados sempre.",
    items: ["Vacinação", "Banho e tosa", "Medicamentos", "Consultas"],
  },
];

const steps = [
  { n: "01", title: "Escolha um ponto de partida", desc: "Comece do zero ou por um dos templates da biblioteca." },
  { n: "02", title: "Modele do seu jeito", desc: "Campos, páginas e seções no editor visual de formulários." },
  { n: "03", title: "Compartilhe e imprima", desc: "Convide pessoas, gere PDF ou publique um link." },
];

const stats = [
  { v: "25+", l: "Templates curados" },
  { v: "14", l: "Categorias de rotina" },
  { v: "PDF", l: "Exportação em A4, A5 e Letter" },
  { v: "100%", l: "Personalizável" },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-hero">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8 lg:pt-24 lg:pb-28">
            <div className="lg:col-span-5">
              <span className="inline-flex items-center gap-2 border-b border-primary/30 pb-1 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-primary">
                <Sparkles className="h-3 w-3" /> Planejamento sob medida
              </span>
              <h1 className="mt-6 font-display text-[2.75rem] leading-[1.05] tracking-tight text-foreground sm:text-6xl">
                A vida organizada
                <span className="block italic text-primary">com elegância.</span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
                HomeFlow reúne casa, família, estudos e trabalho em planners e checklists
                desenhados por você — bonitos na tela e no papel.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="rounded-full px-7">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Começar gratuitamente <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="rounded-full px-6">
                  <Link to="/recursos">Conhecer os recursos</Link>
                </Button>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                Sem cartão de crédito · Cancele quando quiser
              </p>
            </div>

            <div className="lg:col-span-7">
              <figure className="relative">
                <img
                  src={heroImage}
                  alt="Planner impresso e caderno sobre bancada de pedra em cozinha iluminada pela manhã"
                  width={1600}
                  height={1200}
                  className="w-full rounded-[1.75rem] object-cover shadow-elegant"
                />
                <figcaption className="absolute -bottom-6 left-6 hidden max-w-[16rem] rounded-2xl border border-border bg-card/95 p-5 shadow-card backdrop-blur sm:block">
                  <p className="font-display text-sm text-foreground">
                    “Um sistema que cabe no seu dia, não o contrário.”
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Filosofia HomeFlow
                  </p>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="border-y border-border bg-secondary/50">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
            {stats.map((s) => (
              <div key={s.l} className="px-4 py-8 text-center">
                <div className="font-display text-3xl text-foreground">{s.v}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PILLARS */}
        <section id="recursos" className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                O essencial
              </p>
              <h2 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
                Poucas ferramentas. Bem feitas.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Cada recurso existe para reduzir decisões — não para adicionar mais uma tela.
              </p>
            </div>
            <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {pillars.map((f) => (
                <div key={f.title} className="group bg-card p-8 transition-colors hover:bg-secondary/60">
                  <f.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  <h3 className="mt-5 font-display text-xl">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SCENES */}
        <section id="categorias" className="border-t border-border bg-secondary/40 py-24">
          <div className="mx-auto max-w-7xl space-y-24 px-4 sm:px-6 lg:px-8">
            {scenes.map((s, i) => (
              <div
                key={s.title}
                className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20"
              >
                <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
                  <img
                    src={s.img}
                    alt={s.title}
                    loading="lazy"
                    width={1200}
                    height={1408}
                    className="aspect-4/5 w-full rounded-[1.5rem] object-cover shadow-card sm:aspect-3/2 lg:aspect-4/5"
                  />
                </div>
                <div>
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-primary">
                    {s.kicker}
                  </p>
                  <h3 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">{s.title}</h3>
                  <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">{s.desc}</p>
                  <ul className="mt-7 grid max-w-md grid-cols-2 gap-x-6 gap-y-3">
                    {s.items.map((it) => (
                      <li key={it} className="flex items-center gap-2 border-b border-border/70 pb-2 text-sm">
                        <CheckSquare className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.5} /> {it}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* STEPS */}
        <section className="border-t border-border py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Como funciona
                </p>
                <h2 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
                  Três passos, do vazio ao pronto.
                </h2>
              </div>
              <div className="lg:col-span-8">
                <ol className="divide-y divide-border border-t border-border">
                  {steps.map((s) => (
                    <li key={s.n} className="flex gap-8 py-8">
                      <span className="font-display text-2xl text-primary/60">{s.n}</span>
                      <div>
                        <h3 className="font-display text-xl">{s.title}</h3>
                        <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* TEMPLATES */}
        <section id="templates" className="border-t border-border bg-secondary/40 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-xl">
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Biblioteca
                </p>
                <h2 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
                  Templates para começar hoje
                </h2>
              </div>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/recursos">
                  Ver todos <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Casa", items: ["Limpeza semanal", "Faxina mensal", "Compras", "Manutenção"] },
                { title: "Família", items: ["Rotina escolar", "Atividades", "Vacinas", "Alimentação"] },
                { title: "Pets", items: ["Banho", "Vacinação", "Medicamentos", "Passeios"] },
                { title: "Estudos", items: ["Cronograma", "Provas", "Leitura", "Metas"] },
                { title: "Trabalho", items: ["Projetos", "Reuniões", "Entregas", "Follow-up"] },
                { title: "Bem-estar", items: ["Treinos", "Hidratação", "Sono", "Nutrição"] },
              ].map((cat) => (
                <div key={cat.title} className="bg-card p-8">
                  <h3 className="font-display text-xl">{cat.title}</h3>
                  <ul className="mt-4 space-y-2">
                    {cat.items.map((i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border py-28">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <FileText className="mx-auto h-6 w-6 text-primary" strokeWidth={1.5} />
            <h2 className="mt-6 font-display text-4xl tracking-tight sm:text-5xl">
              Comece a sua primeira rotina hoje
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Leva menos de um minuto para criar sua conta e montar o primeiro planner.
            </p>
            <div className="mt-9 flex justify-center gap-3">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Criar minha conta <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="rounded-full px-6">
                <Link to="/auth">Já tenho conta</Link>
              </Button>
            </div>
            <div className="mt-10 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <LayoutDashboard className="h-3.5 w-3.5" /> Para famílias, autônomos e times
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
