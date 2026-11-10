import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  UsersRound,
  Shield,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { groupsApi, usersApi } from "@/services/iam-service";
import { ALL_PERMISSIONS } from "@/types/auth";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — IAM Pro Forms" }] }),
  component: DashboardPage,
});

const growthData = [
  { m: "Jan", users: 24 },
  { m: "Fev", users: 38 },
  { m: "Mar", users: 52 },
  { m: "Abr", users: 71 },
  { m: "Mai", users: 96 },
  { m: "Jun", users: 124 },
  { m: "Jul", users: 158 },
  { m: "Ago", users: 192 },
];

function DashboardPage() {
  const { t } = useTranslation();
  const usersQ = useQuery({ queryKey: ["users"], queryFn: usersApi.list });
  const groupsQ = useQuery({ queryKey: ["groups"], queryFn: groupsApi.list });

  const total = usersQ.data?.length ?? 0;
  const active = usersQ.data?.filter((u) => u.status === "active").length ?? 0;
  const groupsCount = groupsQ.data?.length ?? 0;
  const permsCount = ALL_PERMISSIONS.length;

  const byGroup =
    groupsQ.data?.map((g) => ({
      name: g.name,
      value: g.memberIds.length,
    })) ?? [];

  const COLORS = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("dashboard.totalUsers")}
          value={total}
          delta="+12%"
          icon={Users}
          loading={usersQ.isLoading}
        />
        <StatCard
          label={t("dashboard.activeUsers")}
          value={active}
          delta="+8%"
          icon={UserCheck}
          loading={usersQ.isLoading}
        />
        <StatCard
          label={t("dashboard.groups")}
          value={groupsCount}
          delta="+2"
          icon={UsersRound}
          loading={groupsQ.isLoading}
        />
        <StatCard
          label={t("dashboard.permissions")}
          value={permsCount}
          delta="estável"
          icon={Shield}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {t("dashboard.growth")}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData}>
                <XAxis
                  dataKey="m"
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                />
                <YAxis axisLine={false} tickLine={false} className="text-xs" />
                <Tooltip
                  cursor={{ fill: "var(--color-accent)" }}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="users"
                  fill="var(--color-primary)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {t("dashboard.byGroup")}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {groupsQ.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byGroup}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {byGroup.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-3 space-y-1.5">
              {byGroup.map((g, i) => (
                <div key={g.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-muted-foreground">{g.name}</span>
                  </div>
                  <span className="font-medium">{g.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {t("dashboard.recent")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {(usersQ.data ?? []).slice(0, 5).map((u) => (
              <li key={u.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleString()
                    : "—"}
                </span>
              </li>
            ))}
            {usersQ.isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="py-3">
                  <Skeleton className="h-10 w-full" />
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  delta?: string;
  icon: LucideIcon;
  loading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Icon className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="mt-3 h-8 w-20" />
          ) : (
            <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
          )}
          {delta && (
            <p className="mt-1 flex items-center gap-1 text-xs text-success">
              <ArrowUpRight className="h-3 w-3" /> {delta}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
