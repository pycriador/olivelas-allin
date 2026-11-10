import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Inbox,
  BarChart3,
  Building2,
  FileCode,
  Users,
  KeyRound,
  Crown,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Clock,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { ArtSubmission, IamApiToken, IamGroup, IamUser } from "@/lib/iam-types";
import { listGroups, listSubmissions, listTokens, listUsers } from "@/lib/iam-service";
import type { AiUsageLog, AiUsageMetrics, IamPrompt } from "@/lib/prompt-types";
import { listPrompts, listAiUsageLogs, computeAiUsageMetrics } from "@/lib/prompt-service";
import { EnterpriseNavbar } from "@/components/EnterpriseNavbar";
import { IamUsersCrud } from "./IamUsersCrud";
import { IamGroupsCrud } from "./IamGroupsCrud";
import { IamTokensCrud } from "./IamTokensCrud";
import { ArtApprovalQueue } from "./ArtApprovalQueue";
import { IamPromptsCrud } from "./IamPromptsCrud";
import { AiUsageDashboard } from "./AiUsageDashboard";

export type IamTabKey = "overview" | "usage" | "prompts" | "groups" | "users" | "tokens" | "queue";

interface IamManagementPageProps {
  activeTab: IamTabKey;
  onTabChange: (tab: IamTabKey) => void;
  onBackToStore: () => void;
  onOpenAnalyzer: () => void;
  onNavigateView?: (view: "store" | "analyzer" | "iam") => void;
  onOpenAuthModal?: (tab: "login" | "register") => void;
  onOpenSubmitArt?: () => void;
}

export function IamManagementPage({
  activeTab,
  onTabChange,
  onBackToStore,
  onOpenAnalyzer,
  onNavigateView,
  onOpenAuthModal,
  onOpenSubmitArt,
}: IamManagementPageProps) {
  const { user, isGlobalAdmin, isAnalyst, refreshIam, signOut } = useAuth();

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
    loadAllData();
  }, []);

  const pendingSubmissionsCount = submissions.filter((s) => s.status === "pending").length;
  const totalAllocatedQuota = groups.reduce((acc, g) => acc + (g.quota_brl || 0), 0);
  const totalUsedQuota = groups.reduce((acc, g) => acc + (g.used_brl || 0), 0);

  const handleNav = (v: "store" | "analyzer" | "iam") => {
    if (onNavigateView) {
      onNavigateView(v);
    } else if (v === "store") {
      onBackToStore();
    } else if (v === "analyzer") {
      onOpenAnalyzer();
    }
  };

  const tabClass = (tab: IamTabKey) =>
    `inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
      activeTab === tab
        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
    }`;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-canvas text-ink antialiased">
      <EnterpriseNavbar
        currentView="iam"
        onNavigateView={handleNav}
        availableGroups={groups}
        pendingSubmissionsCount={pendingSubmissionsCount}
        onOpenSubmitArt={() => onOpenSubmitArt?.()}
        onOpenAuthModal={(tab) => onOpenAuthModal?.(tab)}
      />

      <div className="relative mx-auto w-full max-w-[1280px] min-w-0 px-3.5 sm:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-6">
          <div className="flex items-center gap-3.5">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-sm">
              <Building2 className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Centro de Gestão & Governança
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-blue-300">
                  {isGlobalAdmin ? <Crown className="size-3 text-amber-400" /> : <ShieldCheck className="size-3 text-cyan-400" />}
                  {isGlobalAdmin ? "Administrador Global" : "Analista"}
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-slate-400">
                Gerencie permissões, cotas corporativas, provedores de IA, prompts e telemetria operacional.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadAllData()}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-lg border border-slate-700 bg-slate-900/80 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Atualizar dados</span>
          </button>
        </header>

        {/* Tab Navigation with dedicated enterprise styles */}
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/70 p-1.5 backdrop-blur-md">
          <button type="button" onClick={() => onTabChange("overview")} className={tabClass("overview")}>
            <LayoutDashboard className="size-4" />
            <span>Visão Geral</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("queue")}
            className={`relative ${tabClass("queue")}`}
          >
            <Inbox className="size-4" />
            <span>Fila de Moderação</span>
            {pendingSubmissionsCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                {pendingSubmissionsCount}
              </span>
            )}
          </button>

          <button type="button" onClick={() => onTabChange("usage")} className={tabClass("usage")}>
            <BarChart3 className="size-4" />
            <span>Telemetria & Custos</span>
          </button>

          {isGlobalAdmin && (
            <>
              <button type="button" onClick={() => onTabChange("groups")} className={tabClass("groups")}>
                <Building2 className="size-4" />
                <span>Workspaces & Modelos ({groups.length})</span>
              </button>

              <button type="button" onClick={() => onTabChange("prompts")} className={tabClass("prompts")}>
                <FileCode className="size-4" />
                <span>Prompts de Sistema ({prompts.length})</span>
              </button>

              <button type="button" onClick={() => onTabChange("users")} className={tabClass("users")}>
                <Users className="size-4" />
                <span>Usuários ({users.length})</span>
              </button>

              <button type="button" onClick={() => onTabChange("tokens")} className={tabClass("tokens")}>
                <KeyRound className="size-4" />
                <span>Chaves de API ({tokens.length})</span>
              </button>
            </>
          )}
        </nav>

        {/* Content Container (Full Page) */}
        <main className="rounded-2xl border border-slate-800 bg-surface/90 p-4 sm:p-7 backdrop-blur-md shadow-xl w-full max-w-full min-w-0 overflow-hidden">
          {loading ? (
            <div className="flex h-72 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="size-10 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
                <span className="font-mono text-xs text-slate-400">Carregando governança corporativa...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Tab 1: Visão Geral */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4.5 hover:border-slate-700 transition">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>Fila de Moderação</span>
                        <Inbox className="size-4 text-amber-400" />
                      </div>
                      <div className="mt-2 text-2xl sm:text-3xl font-bold text-amber-300">
                        {pendingSubmissionsCount}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">Artes aguardando aprovação</div>
                    </div>

                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4.5 hover:border-slate-700 transition">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>Usuários Ativos</span>
                        <Users className="size-4 text-blue-400" />
                      </div>
                      <div className="mt-2 text-2xl sm:text-3xl font-bold text-white">
                        {users.length}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        {users.filter((u) => u.role === "global_admin").length} admins,{" "}
                        {users.filter((u) => u.role === "analyst").length} analistas
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4.5 hover:border-slate-700 transition">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>Workspaces & Grupos</span>
                        <Building2 className="size-4 text-indigo-400" />
                      </div>
                      <div className="mt-2 text-2xl sm:text-3xl font-bold text-indigo-300">
                        {groups.length}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 truncate">
                        {groups.map((g) => g.name).join(", ") || "Nenhum workspace"}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4.5 hover:border-slate-700 transition">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>Cota Utilizada</span>
                        <Wallet className="size-4 text-emerald-400" />
                      </div>
                      <div className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">
                        R$ {totalUsedQuota.toFixed(2)}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        de R$ {totalAllocatedQuota.toFixed(2)} alocados
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 space-y-4">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <ShieldCheck className="size-4 text-blue-400" />
                        <span>Hierarquia de Governança & Cotas</span>
                      </h4>
                      <ul className="space-y-3 text-xs text-slate-400 leading-relaxed">
                        <li className="flex items-start gap-2.5">
                          <span className="font-semibold text-amber-400 shrink-0">Admin Global:</span>
                          <span>Controle unificado de prompts corporativos, orçamento de cotas, chaves de API e seleção do modelo de visão por workspace.</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="font-semibold text-cyan-400 shrink-0">Analista:</span>
                          <span>Revisa e modera artes submetidas, executando extrações estruturadas que debitam da cota do workspace vinculado.</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="font-semibold text-emerald-400 shrink-0">Telemetria & Custos:</span>
                          <span>Acompanhamento granular de gastos em BRL, tokens consumidos e assertividade por provedor em tempo real.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 space-y-4">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <TrendingUp className="size-4 text-indigo-400" />
                        <span>Ações Rápidas de Gestão</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => onTabChange("queue")}
                          className="group rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-left hover:border-blue-500/50 hover:bg-blue-500/5 transition cursor-pointer"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold text-white group-hover:text-blue-400 transition">
                            <span>Moderação</span>
                            <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-100 transition" />
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{pendingSubmissionsCount} pendente(s)</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => onTabChange("usage")}
                          className="group rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-left hover:border-blue-500/50 hover:bg-blue-500/5 transition cursor-pointer"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold text-white group-hover:text-blue-400 transition">
                            <span>Telemetria</span>
                            <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-100 transition" />
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{usageLogs.length} chamadas</div>
                        </button>
                        {isGlobalAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => onTabChange("groups")}
                              className="group rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-left hover:border-blue-500/50 hover:bg-blue-500/5 transition cursor-pointer"
                            >
                              <div className="flex items-center justify-between text-xs font-semibold text-white group-hover:text-blue-400 transition">
                                <span>Workspaces</span>
                                <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-100 transition" />
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{groups.length} ativos</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => onTabChange("prompts")}
                              className="group rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-left hover:border-blue-500/50 hover:bg-blue-500/5 transition cursor-pointer"
                            >
                              <div className="flex items-center justify-between text-xs font-semibold text-white group-hover:text-blue-400 transition">
                                <span>Prompts</span>
                                <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-100 transition" />
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{prompts.length} configurados</div>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Fila de Moderação */}
              {activeTab === "queue" && (
                <ArtApprovalQueue submissions={submissions} groups={groups} onRefresh={loadAllData} />
              )}

              {/* Tab 3: Monitoramento & Relatórios */}
              {activeTab === "usage" && (
                <AiUsageDashboard
                  logs={usageLogs}
                  groups={groups}
                  metrics={usageMetrics}
                  onRefresh={loadAllData}
                />
              )}

              {/* Tab 4: Grupos & Modelos */}
              {activeTab === "groups" && isGlobalAdmin && (
                <IamGroupsCrud groups={groups} users={users} onRefresh={loadAllData} />
              )}

              {/* Tab 5: Prompts */}
              {activeTab === "prompts" && isGlobalAdmin && (
                <IamPromptsCrud prompts={prompts} onRefresh={loadAllData} />
              )}

              {/* Tab 6: Usuários */}
              {activeTab === "users" && isGlobalAdmin && (
                <IamUsersCrud users={users} groups={groups} onRefresh={loadAllData} />
              )}

              {/* Tab 7: Tokens */}
              {activeTab === "tokens" && isGlobalAdmin && (
                <IamTokensCrud tokens={tokens} users={users} groups={groups} onRefresh={loadAllData} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
