import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { AiUsageLog, AiUsageMetrics } from "@/lib/prompt-types";
import type { IamGroup } from "@/lib/iam-types";

interface AiUsageDashboardProps {
  logs: AiUsageLog[];
  groups: IamGroup[];
  metrics: AiUsageMetrics;
  onRefresh: () => void;
}

export function AiUsageDashboard({ logs, groups, metrics }: AiUsageDashboardProps) {
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchGroup =
        selectedGroupFilter === "all" ||
        l.group_id === selectedGroupFilter ||
        (!l.group_id && selectedGroupFilter === "geral");
      const matchModel = selectedModelFilter === "all" || l.model === selectedModelFilter;
      const matchStatus = selectedStatusFilter === "all" || l.status === selectedStatusFilter;
      const matchSearch =
        !searchTerm.trim() ||
        l.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.user_email && l.user_email.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchGroup && matchModel && matchStatus && matchSearch;
    });
  }, [logs, selectedGroupFilter, selectedModelFilter, selectedStatusFilter, searchTerm]);

  function exportCsv() {
    if (filteredLogs.length === 0) {
      toast.error("Nenhum registro para exportar.");
      return;
    }

    const headers = ["Data/Hora", "Grupo", "Modelo", "Tokens Input", "Tokens Output", "Custo Estimado (BRL)", "Status", "Usuário"];
    const rows = filteredLogs.map((l) => [
      new Date(l.created_at).toLocaleString("pt-BR"),
      `"${l.group_name}"`,
      `"${l.model}"`,
      l.estimated_input_tokens,
      l.estimated_output_tokens,
      l.estimated_cost_brl.toFixed(4),
      l.status,
      `"${l.user_email || "Sistema"}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-consumo-ia-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório CSV exportado!");
  }

  function exportJson() {
    if (filteredLogs.length === 0) {
      toast.error("Nenhum registro para exportar.");
      return;
    }

    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-consumo-ia-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório JSON exportado!");
  }

  const uniqueModels = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.model));
    return Array.from(set);
  }, [logs]);

  // Cálculos de max para os gráficos de barra
  const maxDailyRequests = useMemo(() => {
    return Math.max(...metrics.dailyTrend.map((d) => d.requests), 1);
  }, [metrics.dailyTrend]);

  return (
    <div className="space-y-6">
      {/* 1. Cards de Métricas Principais (KPIs) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-surface/40 p-4">
          <div className="flex items-center justify-between text-xs text-dim font-mono">
            <span>CUSTO ESTIMADO TOTAL</span>
            <span className="text-emerald-400">BRL</span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            R$ {metrics.totalCostBrl.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-dim">
            Investimento acumulado em IA
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-surface/40 p-4">
          <div className="flex items-center justify-between text-xs text-dim font-mono">
            <span>TOTAL DE REQUISIÇÕES</span>
            <span className="text-signal">IA</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-ink">
            {metrics.totalRequests}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-dim">
            <span className="text-emerald-400">{metrics.successfulRequests} sucessos</span>
            <span>·</span>
            <span className="text-rose-400">{metrics.errorRequests} falhas</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-surface/40 p-4">
          <div className="flex items-center justify-between text-xs text-dim font-mono">
            <span>MÉDIA POR ANÁLISE</span>
            <span className="text-amber-300">AVG</span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-300">
            R$ {metrics.avgCostPerRequestBrl.toFixed(4)}
          </div>
          <div className="mt-1 text-[11px] text-dim">
            Custo médio por extração OCR
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-surface/40 p-4">
          <div className="flex items-center justify-between text-xs text-dim font-mono">
            <span>TOKENS ESTIMADOS</span>
            <span className="text-cyan">TOKENS</span>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan">
            {metrics.totalTokens.toLocaleString("pt-BR")}
          </div>
          <div className="mt-1 text-[11px] text-dim">
            Processamento de entrada + saída
          </div>
        </div>
      </div>

      {/* 2. Detalhamento de Grupos & Cotas e Gráficos */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Card: Consumo por Grupo */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-surface/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-ink flex items-center gap-2">
              <span>🏢</span> Consumo Financeiro por Grupo
            </h4>
            <span className="font-mono text-xs text-dim">
              {groups.length} grupo(s) ativos
            </span>
          </div>

          <div className="space-y-3.5">
            {groups.map((g) => {
              const groupMetric = metrics.byGroup[g.id] || { requests: 0, costBrl: g.used_brl, tokens: 0 };
              const percentUsed = Math.min(100, (g.used_brl / Math.max(1, g.quota_brl)) * 100);
              const remaining = Math.max(0, g.quota_brl - g.used_brl);

              return (
                <div key={g.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-xs text-ink">{g.name}</span>
                      <span className="ml-2 font-mono text-[10px] text-dim">
                        ({groupMetric.requests} análises realizadas)
                      </span>
                    </div>
                    <div className="font-mono text-xs font-semibold text-ink">
                      R$ {g.used_brl.toFixed(2)} / <span className="text-dim">R$ {g.quota_brl.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full transition-all duration-300 ${
                        percentUsed > 90 ? "bg-rose-500" : percentUsed > 70 ? "bg-amber-500" : "bg-signal"
                      }`}
                      style={{ width: `${percentUsed}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-dim font-mono">
                    <span>{percentUsed.toFixed(0)}% da cota utilizada</span>
                    <span>Restante: <strong className="text-ink">R$ {remaining.toFixed(2)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card: Modelos de IA Utilizados */}
        <div className="rounded-xl border border-white/10 bg-surface/40 p-5 space-y-4">
          <h4 className="text-sm font-bold text-ink flex items-center gap-2">
            <span>🧠</span> Modelos Utilizados
          </h4>

          {Object.keys(metrics.byModel).length === 0 ? (
            <p className="text-xs text-dim italic">Nenhum log registrado ainda.</p>
          ) : (
            <div className="space-y-3">
              {Object.values(metrics.byModel).map((m) => {
                const percent = metrics.totalRequests > 0 ? (m.requests / metrics.totalRequests) * 100 : 0;

                return (
                  <div key={m.model} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-medium text-ink truncate max-w-[140px]">{m.model}</span>
                      <span className="font-mono font-semibold text-signal">{m.requests} reqs ({percent.toFixed(0)}%)</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-dim font-mono">
                      <span>Custo total:</span>
                      <span className="text-emerald-400">R$ {m.costBrl.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Gráfico de Tendência Diária */}
      {metrics.dailyTrend.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-surface/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-ink flex items-center gap-2">
              <span>📊</span> Histórico de Requisições Diárias
            </h4>
            <span className="text-[11px] text-dim font-mono">Últimos {metrics.dailyTrend.length} dia(s)</span>
          </div>

          <div className="flex items-end gap-2 h-36 pt-4 overflow-x-auto">
            {metrics.dailyTrend.map((d) => {
              const heightPercent = Math.max(8, (d.requests / maxDailyRequests) * 100);

              return (
                <div key={d.date} className="flex flex-col items-center flex-1 min-w-[48px] h-full justify-end group">
                  <div className="text-[10px] font-mono text-dim mb-1 opacity-0 group-hover:opacity-100 transition">
                    {d.requests}
                  </div>
                  <div
                    className="w-full rounded-t-md bg-signal/70 hover:bg-signal transition-all shadow-sm"
                    style={{ height: `${heightPercent}%` }}
                    title={`${d.date}: ${d.requests} requisições (R$ ${d.costBrl.toFixed(2)})`}
                  />
                  <span className="mt-2 text-[10px] font-mono text-dim whitespace-nowrap">
                    {d.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Tabela de Logs e Relatório Detalhado */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <input
              type="text"
              placeholder="Buscar em logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-56 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink placeholder:text-dim focus:border-signal focus:outline-none"
            />

            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-surface px-3 py-1.5 text-xs text-ink focus:border-signal focus:outline-none"
            >
              <option value="all">Todos os Grupos</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>

            <select
              value={selectedModelFilter}
              onChange={(e) => setSelectedModelFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-surface px-3 py-1.5 text-xs text-ink focus:border-signal focus:outline-none"
            >
              <option value="all">Todos os Modelos</option>
              {uniqueModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-surface px-3 py-1.5 text-xs text-ink focus:border-signal focus:outline-none"
            >
              <option value="all">Todos os Status</option>
              <option value="success">Apenas Sucessos</option>
              <option value="error">Apenas Erros</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-white/10 transition"
              title="Exportar para planilha CSV"
            >
              <span>📥</span>
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={exportJson}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-white/10 transition"
              title="Exportar JSON bruto"
            >
              <span>📄</span>
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-surface/50">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-white/[0.02] text-dim uppercase tracking-wider font-mono">
              <tr>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Grupo</th>
                <th className="px-4 py-3">Modelo</th>
                <th className="px-4 py-3">Tokens Est.</th>
                <th className="px-4 py-3">Custo (BRL)</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-dim font-sans">
                    Nenhum log de consumo encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3 text-dim">
                      {new Date(l.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 font-sans font-semibold text-ink">
                      {l.group_name}
                    </td>
                    <td className="px-4 py-3 text-signal">
                      {l.model}
                    </td>
                    <td className="px-4 py-3 text-dim">
                      {l.estimated_input_tokens + l.estimated_output_tokens}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">
                      R$ {l.estimated_cost_brl.toFixed(4)}
                    </td>
                    <td className="px-4 py-3">
                      {l.status === "success" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-sans font-medium">
                          ✓ Sucesso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-sans font-medium" title={l.error_message || "Falha"}>
                          ✕ Erro
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
