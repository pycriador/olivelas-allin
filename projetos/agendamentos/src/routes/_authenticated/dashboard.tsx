import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCog,
  CalendarClock,
  CalendarCheck2,
  CalendarDays,
  CalendarOff,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { dayjs } from "@/shared/lib/dayjs";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

interface DashboardStats {
  clients: number;
  professionals: number;
  todayAppointments: number;
  upcoming: number;
  events: number;
  blocks: number;
}

async function fetchStats(): Promise<DashboardStats> {
  const startOfDay = dayjs().startOf("day").toISOString();
  const endOfDay = dayjs().endOf("day").toISOString();
  const now = new Date().toISOString();

  const [clients, professionals, today, upcoming, events, blocks] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("professionals").select("*", { count: "exact", head: true }),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("starts_at", startOfDay)
      .lte("starts_at", endOfDay),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gt("starts_at", now),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("blocks").select("*", { count: "exact", head: true }),
  ]);

  return {
    clients: clients.count ?? 0,
    professionals: professionals.count ?? 0,
    todayAppointments: today.count ?? 0,
    upcoming: upcoming.count ?? 0,
    events: events.count ?? 0,
    blocks: blocks.count ?? 0,
  };
}

const weekMock = [
  { day: "Seg", count: 8 },
  { day: "Ter", count: 12 },
  { day: "Qua", count: 10 },
  { day: "Qui", count: 15 },
  { day: "Sex", count: 9 },
  { day: "Sáb", count: 4 },
  { day: "Dom", count: 0 },
];
const typeMock = [
  { name: "Primeira consulta", value: 18 },
  { name: "Retorno", value: 42 },
  { name: "Casal", value: 8 },
  { name: "Online", value: 22 },
];
const pieColors = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
];

function DashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchStats,
  });

  const cards = [
    { key: "clients", value: data?.clients, icon: Users },
    { key: "professionals", value: data?.professionals, icon: UserCog },
    { key: "todayAppointments", value: data?.todayAppointments, icon: CalendarCheck2 },
    { key: "upcoming", value: data?.upcoming, icon: CalendarClock },
    { key: "events", value: data?.events, icon: CalendarDays },
    { key: "blocks", value: data?.blocks, icon: CalendarOff },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ key, value, icon: Icon }) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {t(`dashboard.cards.${key}` as const)}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {isLoading ? "—" : (value ?? 0)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("dashboard.charts.weekly")}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekMock}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("dashboard.charts.byType")}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeMock}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {typeMock.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
