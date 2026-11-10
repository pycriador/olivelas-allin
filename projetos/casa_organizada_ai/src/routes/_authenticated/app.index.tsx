import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  CheckSquare,
  FolderKanban,
  LibraryBig,
  MessageSquare,
  Sparkles,
  TrendingUp,
  FileText,
  Download,
  Bot,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { getDashboardStats } from "@/modules/smart-dashboard/insights.functions";
import { getUserProfile } from "@/modules/avatar/avatars.functions";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function formatDate(now: Date) {
  const wd = WEEKDAYS[now.getDay()];
  const d = now.getDate();
  const m = MONTHS[now.getMonth()];
  const y = now.getFullYear();
  return `${wd}, ${d} de ${m} de ${y}`;
}

function getTimeBasedGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { greeting: "Bom dia", emoji: "🌅" };
  if (h < 18) return { greeting: "Boa tarde", emoji: "☀️" };
  return { greeting: "Boa noite", emoji: "🌙" };
}

const QUICK_ACTIONS = [
  {
    to: "/app/assistant",
    icon: MessageSquare,
    label: "Nova conversa IA",
    desc: "Inicie um chat com o assistente",
  },
  {
    to: "/app/forms",
    icon: FileText,
    label: "Criar formulário",
    desc: "Monte um formulário personalizado",
  },
  {
    to: "/app/marketplace",
    icon: LibraryBig,
    label: "Explorar marketplace",
    desc: "Descubra templates e temas",
  },
  {
    to: "/app/perfil",
    icon: TrendingUp,
    label: "Ver insights",
    desc: "Acompanhe seu progresso",
  },
];

function Dashboard() {
  const profileFn = useServerFn(getUserProfile);
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => profileFn(),
  });

  const statsFn = useServerFn(getDashboardStats);
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => statsFn(),
  });

  const now = new Date();
  const { greeting, emoji } = getTimeBasedGreeting();
  const name = profile?.full_name ?? "";

  const suggestions = [
    {
      icon: Bot,
      title: "Converse com a IA",
      desc: "Tire dúvidas e gere ideias com o assistente inteligente",
      to: "/app/assistant",
    },
    {
      icon: Lightbulb,
      title: "Explore templates",
      desc: "Encontre o template perfeito para seu projeto",
      to: "/app/templates",
    },
    {
      icon: TrendingUp,
      title: "Acompanhe insights",
      desc: "Veja análises sobre seu uso da plataforma",
      to: "/app/perfil",
    },
  ];

  const statCards = [
    {
      icon: FileText,
      label: "Formulários",
      value: stats?.formsCount ?? 0,
      color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950",
    },
    {
      icon: MessageSquare,
      label: "Conversas IA",
      value: stats?.threadsCount ?? 0,
      color:
        "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-950",
    },
    {
      icon: Bot,
      label: "Ações IA",
      value: stats?.aiActionsCount ?? 0,
      color:
        "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950",
    },
    {
      icon: Download,
      label: "Templates baixados",
      value: stats?.downloadsCount ?? 0,
      color:
        "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-hero p-8">
        <Badge
          variant="outline"
          className="border-primary/20 bg-primary/5 text-primary"
        >
          <Sparkles className="mr-1 h-3 w-3" /> Dashboard
        </Badge>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {greeting}
          {name ? `, ${name}` : ""} {emoji}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(now)}
        </p>
        <p className="mt-2 max-w-xl text-muted-foreground">
          {statsLoading
            ? "Carregando..."
            : `Você tem ${stats?.formsCount ?? 0} formulário${(stats?.formsCount ?? 0) !== 1 ? "s" : ""} e ${stats?.threadsCount ?? 0} conversa${(stats?.threadsCount ?? 0) !== 1 ? "s" : ""} com IA.`}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-semibold">{s.value}</p>
                )}
              </div>
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}
              >
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold">
          Ações rápidas
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.to} to={action.to as "/app"}>
              <Card className="group p-5 transition-all hover:-translate-y-1 hover:shadow-card">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <action.icon className="h-5 w-5" />
                </div>
                <p className="font-semibold">{action.label}</p>
                <p className="text-sm text-muted-foreground">{action.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {stats?.recentInsights && stats.recentInsights.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">
                Insights recentes
              </h2>
              <Button size="sm" variant="ghost" asChild>
                <Link to="/app/perfil">
                  Ver todos <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {stats.recentInsights.map((insight: any) => (
                <div
                  key={insight.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm">{insight.summary}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(insight.generated_at).toLocaleDateString(
                          "pt-BR",
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold">
              Próximos eventos
            </h2>
            <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">
                Nenhum evento próximo
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Crie planejamentos com datas para ver eventos aqui.
              </p>
            </div>
          </Card>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">
                Últimos planejamentos
              </h2>
              <Button size="sm" variant="ghost" disabled>
                <FolderKanban className="mr-1 h-4 w-4" /> Novo
              </Button>
            </div>
            <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center">
              <FolderKanban className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">
                Nenhum planejamento ainda
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Crie seu primeiro formulário ou template para começar.
              </p>
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold">
              Próximos eventos
            </h2>
            <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium">
                Nenhum evento próximo
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Crie planejamentos com datas para ver eventos aqui.
              </p>
            </div>
          </Card>
        </section>
      )}

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold">
          Sugestões
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {suggestions.map((s) => (
            <Link key={s.title} to={s.to as "/app"}>
              <Card className="group p-5 transition-all hover:-translate-y-1 hover:shadow-card">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-brand/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="font-semibold">{s.title}</p>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
