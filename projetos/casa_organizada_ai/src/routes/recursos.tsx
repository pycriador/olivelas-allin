import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import {
  CalendarDays,
  CheckSquare,
  Palette,
  Share2,
  FileText,
  Sparkles,
  Repeat,
  LayoutDashboard,
  Baby,
  Dog,
  Smartphone,
  Moon,
  Zap,
  Search,
} from "lucide-react";

export const Route = createFileRoute("/recursos")({
  head: () => ({
    meta: [
      { title: "Recursos — HomeFlow" },
      {
        name: "description",
        content:
          "Todos os recursos do HomeFlow: planejamento, templates, Theme Builder, colaboração e muito mais.",
      },
      { property: "og:title", content: "Recursos — HomeFlow" },
      { property: "og:description", content: "Conheça a plataforma completa para planejar sua vida." },
    ],
  }),
  component: RecursosPage,
});

const groups = [
  {
    title: "Planejamento",
    items: [
      { icon: CalendarDays, title: "Semanal e mensal", desc: "Visões flexíveis para curto e longo prazo." },
      { icon: Repeat, title: "Rotinas recorrentes", desc: "Configure uma vez e deixe rolar." },
      { icon: LayoutDashboard, title: "Dashboard", desc: "Panorama visual do que importa." },
    ],
  },
  {
    title: "Personalização",
    items: [
      { icon: Palette, title: "Theme Builder", desc: "Cores, tipografia, logo, banner e layout." },
      { icon: Sparkles, title: "Templates", desc: "Modelos por categoria prontos para usar." },
      { icon: Moon, title: "Modo escuro", desc: "Claro, escuro ou automático." },
    ],
  },
  {
    title: "Colaboração",
    items: [
      { icon: Share2, title: "Compartilhamento", desc: "Envolva família ou time." },
      { icon: Baby, title: "Planner familiar", desc: "Um planner para toda a casa." },
      { icon: Dog, title: "Pets", desc: "Vacinas, banhos e passeios sob controle." },
    ],
  },
  {
    title: "Produtividade",
    items: [
      { icon: CheckSquare, title: "Checklists", desc: "Foco no que precisa ser feito hoje." },
      { icon: Search, title: "Busca poderosa", desc: "Encontre tudo em segundos." },
      { icon: Zap, title: "Atalhos", desc: "Fluxo rápido de teclado." },
    ],
  },
  {
    title: "Portabilidade",
    items: [
      { icon: FileText, title: "Exportar PDF", desc: "Leve seu plano offline." },
      { icon: Smartphone, title: "Mobile", desc: "100% responsivo." },
    ],
  },
];

function RecursosPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
            Recursos que <span className="text-gradient-brand">simplificam</span> sua rotina
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Do planejamento diário à personalização visual completa da sua plataforma.
          </p>
        </div>
        <div className="mt-16 space-y-12">
          {groups.map((g) => (
            <section key={g.title}>
              <h2 className="font-display text-2xl font-semibold">{g.title}</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((i) => (
                  <Card key={i.title} className="p-6 transition-all hover:-translate-y-1 hover:shadow-card">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <i.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold">{i.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{i.desc}</p>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}