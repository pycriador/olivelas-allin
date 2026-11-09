import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import type { ArtSubmission, IamApiToken, IamGroup, IamUser } from "@/lib/iam-types";
import { listGroups, listSubmissions, listTokens, listUsers } from "@/lib/iam-service";
import type { AiUsageLog, AiUsageMetrics, IamPrompt } from "@/lib/prompt-types";
import { listPrompts, listAiUsageLogs, computeAiUsageMetrics } from "@/lib/prompt-service";
import { IamUsersCrud } from "./IamUsersCrud";
import { IamGroupsCrud } from "./IamGroupsCrud";
import { IamTokensCrud } from "./IamTokensCrud";
import { ArtApprovalQueue } from "./ArtApprovalQueue";
import { IamPromptsCrud } from "./IamPromptsCrud";
import { AiUsageDashboard } from "./AiUsageDashboard";

interface IamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "overview" | "users" | "groups" | "tokens" | "queue" | "prompts" | "usage";
}

export function IamManagementModal({
  isOpen,
  onClose,
  initialTab = "overview",
}: IamManagementModalProps) {
  const { isGlobalAdmin, isAnalyst, refreshIam } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  const [users, setUsers] = useState<IamUser[]>([]);
  const [groups, setGroups] = useState<IamGroup[]>([]);
  const [tokens, setTokens] = useState<IamApiToken[]>([]);
  const [submissions, setSubmissions] = useState<ArtSubmission[]>([]);
  const [prompts, setPrompts] = useState<IamPrompt[]>([]);
  const [usageLogs, setUsageLogs] = useState<AiUsageLog[]>([]);
  const [usageMetrics, setUsageMetrics] = useState<AiUsageMetrics>({
    totalRequests: 0,
    successfulRequests: 0,
    errorRequests: 0,
    totalCostBrl: 0,
    totalTokens: 0,
    avgCostPerRequestBrl: 0,
    byGroup: {},
    byModel: {},
    dailyTrend: [],
  });
  const [loading, setLoading] = useState(true);

  async function loadAllData() {
    setLoading(true);
    try {
      const [u, g, t, s, p, logs] = await Promise.all([
        listUsers(),
        listGroups(),
        listTokens(),
        listSubmissions(),
        listPrompts(),
        listAiUsageLogs(),
      ]);
      setUsers(u);
      setGroups(g);
      setTokens(t);
      setSubmissions(s);
      setPrompts(p);
      setUsageLogs(logs);
      const metrics = await computeAiUsageMetrics(logs);
      setUsageMetrics(metrics);
      await refreshIam();
    } catch (err) {
      console.warn("Erro ao carregar dados IAM:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadAllData();
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const pendingSubmissionsCount = submissions.filter((s) => s.status === "pending").length;
  const totalAllocatedQuota = groups.reduce((acc, g) => acc + (g.quota_brl || 0), 0);
  const totalUsedQuota = groups.reduce((acc, g) => acc + (g.used_brl || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-white/10 bg-[#0d0f17] shadow-2xl overflow-hidden text-ink animate-in fade-in zoom-in-95">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-signal/10 text-signal">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-ink">Centro de gerenciamento</h2>
                <span className="rounded-full bg-signal/10 px-2 py-0.5 text-[10px] font-semibold text-signal ring-1 ring-signal/30">
                  {isGlobalAdmin ? "Admin Global" : "Analista"}
                </span>
              </div>
              <p className="text-xs text-dim">
                Gerencie permissões, grupos, cotas de IA, chaves do Gemini, prompts do sistema e relatórios de telemetria.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-dim hover:bg-white/10 hover:text-ink transition"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Barra de Abas */}
        <div className="flex flex-wrap items-center gap-1 border-b border-white/10 px-6 py-2 bg-white/[0.01]">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
              activeTab === "overview"
                ? "bg-signal text-canvas font-semibold"
                : "text-dim hover:text-ink hover:bg-white/5"
            }`}
          >
            📊 Visão Geral
          </button>

          {/* Aba de Monitoramento de IA */}
          <button
            onClick={() => setActiveTab("usage")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
              activeTab === "usage"
                ? "bg-signal text-canvas font-semibold"
                : "text-dim hover:text-ink hover:bg-white/5"
            }`}
          >
            📈 Monitoramento & Relatórios
          </button>

          {isGlobalAdmin && (
            <>
              {/* Aba de Gestão de Prompts */}
              <button
                onClick={() => setActiveTab("prompts")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                  activeTab === "prompts"
                    ? "bg-signal text-canvas font-semibold"
                    : "text-dim hover:text-ink hover:bg-white/5"
                }`}
              >
                📝 Prompts de IA ({prompts.length})
              </button>

              <button
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                  activeTab === "users"
                    ? "bg-signal text-canvas font-semibold"
                    : "text-dim hover:text-ink hover:bg-white/5"
                }`}
              >
                👥 Usuários ({users.length})
              </button>

              <button
                onClick={() => setActiveTab("groups")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                  activeTab === "groups"
                    ? "bg-signal text-canvas font-semibold"
                    : "text-dim hover:text-ink hover:bg-white/5"
                }`}
              >
                🏢 Grupos & Cotas ({groups.length})
              </button>

              <button
                onClick={() => setActiveTab("tokens")}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                  activeTab === "tokens"
                    ? "bg-signal text-canvas font-semibold"
                    : "text-dim hover:text-ink hover:bg-white/5"
                }`}
              >
                🔑 Tokens de API ({tokens.length})
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab("queue")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
              activeTab === "queue"
                ? "bg-signal text-canvas font-semibold"
                : "text-dim hover:text-ink hover:bg-white/5"
            }`}
          >
            📥 Fila de Aprovação
            {pendingSubmissionsCount > 0 && (
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "queue" ? "bg-canvas text-signal" : "bg-amber-500 text-canvas"
              }`}>
                {pendingSubmissionsCount}
              </span>
            )}
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="size-8 animate-spin rounded-full border-2 border-signal border-t-transparent" />
                <span className="font-mono text-xs text-dim">Carregando dados IAM...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Aba: Visão Geral */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Grid de Cards Métricas */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-surface/40 p-4">
                      <div className="text-xs text-dim">Fila Pendente</div>
                      <div className="mt-1 text-2xl font-bold text-amber-300">
                        {pendingSubmissionsCount}
                      </div>
                      <div className="mt-1 text-[11px] text-dim">
                        Artes aguardando moderação
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-surface/40 p-4">
                      <div className="text-xs text-dim">Total de Usuários</div>
                      <div className="mt-1 text-2xl font-bold text-ink">
                        {users.length}
                      </div>
                      <div className="mt-1 text-[11px] text-dim">
                        {users.filter((u) => u.role === "global_admin").length} admins,{" "}
                        {users.filter((u) => u.role === "analyst").length} analistas
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-surface/40 p-4">
                      <div className="text-xs text-dim">Grupos & Unidades</div>
                      <div className="mt-1 text-2xl font-bold text-signal">
                        {groups.length}
                      </div>
                      <div className="mt-1 text-[11px] text-dim">
                        {groups.map((g) => g.name).join(", ")}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-surface/40 p-4">
                      <div className="text-xs text-dim">Cota Total Utilizada</div>
                      <div className="mt-1 text-2xl font-bold text-emerald-400 font-mono">
                        R$ {totalUsedQuota.toFixed(2)}
                      </div>
                      <div className="mt-1 text-[11px] text-dim">
                        de R$ {totalAllocatedQuota.toFixed(2)} alocados
                      </div>
                    </div>
                  </div>

                  {/* Resumo HBAC e Arquitetura */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-surface/40 p-5 space-y-3">
                      <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                        <span>🛡️</span> Hierarquia de Papéis & Prompts
                      </h4>
                      <ul className="space-y-2 text-xs text-dim">
                        <li className="flex items-start gap-2">
                          <span className="font-semibold text-amber-300">👑 Administrador Global:</span>
                          <span>Acesso total ao gerenciador de prompts, criação de tokens, alteração de cotas e gestão de usuários.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-semibold text-cyan-300">🔍 Analista de Postagem:</span>
                          <span>Aprova artes enviadas por consumidores e executa extrações de IA consumindo a cota do seu grupo (ex: Monumento).</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-semibold text-emerald-400">📈 Telemetria & Monitoramento:</span>
                          <span>Acompanhamento em tempo real de custo por grupo, tokens processados e taxa de assertividade.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-surface/40 p-5 space-y-3">
                      <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                        <span>⚡</span> Acesso Rápido
                      </h4>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => setActiveTab("usage")}
                          className="rounded-lg border border-white/10 bg-white/5 p-3 text-left hover:border-signal/50 hover:bg-signal/5 transition"
                        >
                          <div className="text-xs font-semibold text-ink">Relatórios de IA</div>
                          <div className="text-[11px] text-dim">{usageLogs.length} execuções registradas</div>
                        </button>
                        {isGlobalAdmin && (
                          <button
                            onClick={() => setActiveTab("prompts")}
                            className="rounded-lg border border-white/10 bg-white/5 p-3 text-left hover:border-signal/50 hover:bg-signal/5 transition"
                          >
                            <div className="text-xs font-semibold text-ink">Prompts do Sistema</div>
                            <div className="text-[11px] text-dim">{prompts.length} modelo(s) cadastrados</div>
                          </button>
                        )}
                        <button
                          onClick={() => setActiveTab("queue")}
                          className="rounded-lg border border-white/10 bg-white/5 p-3 text-left hover:border-signal/50 hover:bg-signal/5 transition"
                        >
                          <div className="text-xs font-semibold text-ink">Fila de Moderação</div>
                          <div className="text-[11px] text-dim">{pendingSubmissionsCount} pendente(s)</div>
                        </button>
                        {isGlobalAdmin && (
                          <button
                            onClick={() => setActiveTab("groups")}
                            className="rounded-lg border border-white/10 bg-white/5 p-3 text-left hover:border-signal/50 hover:bg-signal/5 transition"
                          >
                            <div className="text-xs font-semibold text-ink">Grupos & Cotas</div>
                            <div className="text-[11px] text-dim">Gerenciar chaves Gemini</div>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Aba: Monitoramento & Relatórios */}
              {activeTab === "usage" && (
                <AiUsageDashboard
                  logs={usageLogs}
                  groups={groups}
                  metrics={usageMetrics}
                  onRefresh={loadAllData}
                />
              )}

              {/* Aba: Prompts de IA */}
              {activeTab === "prompts" && isGlobalAdmin && (
                <IamPromptsCrud prompts={prompts} onRefresh={loadAllData} />
              )}

              {/* Aba: Usuários */}
              {activeTab === "users" && isGlobalAdmin && (
                <IamUsersCrud users={users} groups={groups} onRefresh={loadAllData} />
              )}

              {/* Aba: Grupos */}
              {activeTab === "groups" && isGlobalAdmin && (
                <IamGroupsCrud groups={groups} users={users} onRefresh={loadAllData} />
              )}

              {/* Aba: Tokens */}
              {activeTab === "tokens" && isGlobalAdmin && (
                <IamTokensCrud tokens={tokens} users={users} groups={groups} onRefresh={loadAllData} />
              )}

              {/* Aba: Fila de Moderação */}
              {activeTab === "queue" && (
                <ArtApprovalQueue submissions={submissions} groups={groups} onRefresh={loadAllData} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
