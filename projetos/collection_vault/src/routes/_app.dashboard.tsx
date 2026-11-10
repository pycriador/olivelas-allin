import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Library, Trophy, Coins, Tag } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — RetroVault" }] }),
});

const COLORS = ["var(--neon-pink)", "var(--neon-cyan)", "var(--neon-yellow)", "var(--neon-green)", "var(--neon-purple)"];

function Dashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      const [colecao, jogos, cupons, links] = await Promise.all([
        supabase.from("colecao").select("*"),
        supabase.from("jogos").select("id"),
        supabase.from("cupons").select("id, ativo"),
        supabase.from("links_compra").select("id"),
      ]);
      return {
        colecao: colecao.data ?? [],
        jogos: jogos.data?.length ?? 0,
        cuponsAtivos: cupons.data?.filter((c) => c.ativo).length ?? 0,
        links: links.data?.length ?? 0,
      };
    },
    enabled: !!user,
  });

  const { data: plataformaData } = useQuery({
    queryKey: ["plataforma-dist", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("colecao").select("plataforma_id, plataformas(nome)");
      const counts = new Map<string, number>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const r of (data as any[]) ?? []) {
        const nome = r.plataformas?.nome ?? "Sem plataforma";
        counts.set(nome, (counts.get(nome) ?? 0) + 1);
      }
      return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
    },
    enabled: !!user,
  });

  const { data: gastoMensal } = useQuery({
    queryKey: ["gasto-mensal", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("colecao").select("data_compra, preco_pago").not("data_compra", "is", null);
      const map = new Map<string, number>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const r of (data as any[]) ?? []) {
        const d = new Date(r.data_compra);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        map.set(key, (map.get(key) ?? 0) + Number(r.preco_pago ?? 0));
      }
      return Array.from(map.entries()).sort().slice(-6).map(([mes, total]) => ({ mes, total: Number(total.toFixed(2)) }));
    },
    enabled: !!user,
  });

  const total = stats?.colecao.length ?? 0;
  const finalizados = stats?.colecao.filter((c) => c.status === "Finalizado").length ?? 0;
  const totalGasto = stats?.colecao.reduce((s, c) => s + Number(c.preco_pago ?? 0), 0) ?? 0;
  const progresso = total > 0 ? Math.round((finalizados / total) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-xl neon-text-pink">PLAYER STATS</h1>
        <p className="text-muted-foreground font-mono text-xl mt-1">► HIGH SCORE OVERVIEW</p>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Library} label="ITENS" value={total} color="neon-text-pink" />
        <StatCard icon={Trophy} label="FINALIZADOS" value={finalizados} color="neon-text-cyan" />
        <StatCard icon={Coins} label="INVESTIDO" value={`R$${totalGasto.toFixed(0)}`} color="neon-text-yellow" />
        <StatCard icon={Tag} label="CUPONS ATIVOS" value={stats?.cuponsAtivos ?? 0} color="neon-text-pink" />
      </div>

      {/* Backlog progress */}
      <div className="rounded-lg border-2 border-border bg-card p-6">
        <div className="flex justify-between mb-3">
          <h2 className="font-display text-sm neon-text-cyan">BACKLOG PROGRESS</h2>
          <span className="font-display text-sm neon-text-yellow">{progresso}%</span>
        </div>
        <Progress value={progresso} className="h-4" />
        <p className="font-mono text-lg text-muted-foreground mt-2">
          {finalizados} de {total} jogos finalizados
        </p>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-lg border-2 border-border bg-card p-6">
          <h2 className="font-display text-sm neon-text-pink mb-4">PLATAFORMAS</h2>
          {plataformaData && plataformaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={plataformaData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {plataformaData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "2px solid var(--primary)", fontFamily: "var(--font-mono)" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-12 font-mono text-xl text-muted-foreground">Sem dados</p>
          )}
        </div>

        <div className="rounded-lg border-2 border-border bg-card p-6">
          <h2 className="font-display text-sm neon-text-cyan mb-4">GASTOS MENSAIS</h2>
          {gastoMensal && gastoMensal.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={gastoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" style={{ fontFamily: "var(--font-mono)" }} />
                <YAxis stroke="var(--muted-foreground)" style={{ fontFamily: "var(--font-mono)" }} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "2px solid var(--accent)", fontFamily: "var(--font-mono)" }} />
                <Bar dataKey="total" fill="var(--neon-cyan)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-12 font-mono text-xl text-muted-foreground">Sem dados</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Library; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg border-2 border-border bg-card p-5 transition-all hover:border-primary hover:-translate-y-1">
      <Icon className={`h-6 w-6 ${color}`} />
      <p className={`font-display text-2xl mt-3 ${color}`}>{value}</p>
      <p className="font-mono text-lg text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
