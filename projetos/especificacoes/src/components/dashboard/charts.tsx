import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ActivityChart() {
  const data = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        day: `${i + 1}`,
        specs: Math.floor(4 + Math.random() * 18),
        deliveries: Math.floor(2 + Math.random() * 10),
      })),
    [],
  );

  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-semibold">Activity</h3>
          <p className="text-xs text-muted-foreground">Last 14 days</p>
        </div>
      </div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="specGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="specs"
              stroke="var(--color-chart-1)"
              fill="url(#specGrad)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TypeDistribution() {
  const data = useMemo(
    () =>
      [
        { type: "Frontend", n: 18 },
        { type: "Backend", n: 24 },
        { type: "Database", n: 9 },
        { type: "API", n: 12 },
        { type: "ADR", n: 6 },
        { type: "RFC", n: 4 },
        { type: "Prompt", n: 7 },
      ],
    [],
  );
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">Specs by type</h3>
        <p className="text-xs text-muted-foreground">Distribution across categories</p>
      </div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="type" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="n" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
