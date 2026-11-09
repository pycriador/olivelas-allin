import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { analyzeImage } from "@/lib/analysis.functions";
import type { ArtSubmission, IamGroup } from "@/lib/iam-types";
import { updateSubmissionStatus, deductGroupQuota } from "@/lib/iam-service";
import { useAuth } from "@/lib/auth-context";
import {
  getClientPortfolioByPhone,
  formatPhoneNumber,
  generateClientId,
  type ClientPortfolio,
} from "@/lib/client-aggregation";
import { ClientServicesPagination } from "@/components/ClientServicesPagination";

interface ArtApprovalQueueProps {
  submissions: ArtSubmission[];
  groups: IamGroup[];
  onRefresh: () => void;
}

export function ArtApprovalQueue({ submissions, groups, onRefresh }: ArtApprovalQueueProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const analyze = useServerFn(analyzeImage);

  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal de Recusa
  const [rejectingSub, setRejectingSub] = useState<ArtSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Modal e Dados de Paginação de Serviços do Cliente (Client ID / WhatsApp)
  const [selectedClientPortfolio, setSelectedClientPortfolio] = useState<ClientPortfolio | null>(null);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);

  // Grupo selecionado por item para análise
  const [selectedGroupMap, setSelectedGroupMap] = useState<Record<string, string>>({});

  const filtered = submissions.filter((s) => {
    if (filterStatus === "all") return true;
    return s.status === filterStatus;
  });

  function getGroupForItem(sub: ArtSubmission): IamGroup | null {
    const customGid = selectedGroupMap[sub.id];
    if (customGid) {
      return groups.find((g) => g.id === customGid) || null;
    }
    if (sub.target_group_id) {
      return groups.find((g) => g.id === sub.target_group_id) || null;
    }
    return groups[0] || null;
  }

  async function handleApproveAndAnalyze(sub: ArtSubmission) {
    const targetGroup = getGroupForItem(sub);
    if (!targetGroup) {
      toast.error("Nenhum grupo com cota disponível para realizar a análise.");
      return;
    }

    if (targetGroup.used_brl >= targetGroup.quota_brl) {
      toast.error(`A cota do grupo "${targetGroup.name}" está esgotada (R$ ${targetGroup.quota_brl.toFixed(2)}). Adicione mais créditos ou selecione outro grupo.`);
      return;
    }

    setProcessingId(sub.id);
    const toastId = toast.loading(`Aprovando e analisando com IA (Grupo: ${targetGroup.name})...`);

    try {
      // 1. Cria registro no image_analysis
      const { data: inserted, error: insertErr } = await supabase
        .from("image_analysis")
        .insert({
          image_path: sub.image_path,
          image_url: sub.image_url,
          status: "pending",
        })
        .select()
        .single();

      if (insertErr || !inserted) {
        throw new Error(insertErr?.message || "Falha ao registrar imagem na fila de análise.");
      }

      // 2. Executa IA com o provedor (Gemini ou Lovable) e cota do grupo
      const result = await analyze({
        data: {
          id: inserted.id,
          path: sub.image_path,
          provider: targetGroup.gemini_api_key?.trim() ? "gemini" : "lovable",
          groupId: targetGroup.id,
          groupApiKey: targetGroup.gemini_api_key || undefined,
          geminiModel: targetGroup.gemini_model || (targetGroup.gemini_api_key?.trim() ? "gemini-2.5-flash" : "openai/gpt-6-astra"),
        },
      });

      if (!result.ok) {
        throw new Error(result.message);
      }

      // 3. Atualiza status da submissão para approved
      await updateSubmissionStatus(sub.id, {
        status: "approved",
        reviewerUserId: user?.id,
        reviewerEmail: user?.email ?? undefined,
        processedAnalysisId: inserted.id,
      });

      // 4. Abata cota no IAM service
      await deductGroupQuota(targetGroup.id, 0.05);

      toast.success("Arte aprovada e catálogo atualizado com sucesso pela IA!", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["history"] });
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro no processamento da aprovação.";
      toast.error(`Falha: ${msg}`, { id: toastId });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleConfirmReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingSub) return;

    try {
      await updateSubmissionStatus(rejectingSub.id, {
        status: "rejected",
        reviewerUserId: user?.id,
        reviewerEmail: user?.email ?? undefined,
        rejectionReason: rejectionReason.trim() || "Imagem não atende aos requisitos do catálogo.",
      });

      toast.info("Arte recusada com sucesso.");
      setRejectingSub(null);
      setRejectionReason("");
      onRefresh();
    } catch {
      toast.error("Erro ao recusar arte.");
    }
  }

  async function handleOpenClientPortfolio(phone: string | null | undefined) {
    if (!phone) {
      toast.error("Nenhum telefone de WhatsApp informado nesta submissão.");
      return;
    }
    setIsLoadingPortfolio(true);
    const toastId = toast.loading(`Verificando histórico do WhatsApp ${phone}...`);

    try {
      const portfolio = await getClientPortfolioByPhone(phone);
      if (!portfolio || (portfolio.arts.length === 0 && portfolio.services.length === 0)) {
        toast.info(
          `Nenhum serviço anterior encontrado para ${formatPhoneNumber(phone) || phone}. Este é o primeiro registro deste estabelecimento.`,
          { id: toastId }
        );
      } else {
        toast.success(
          `Cliente identificado! ${portfolio.totalArts} artes e ${portfolio.totalServices} serviços/produtos catalogados.`,
          { id: toastId }
        );
        setSelectedClientPortfolio(portfolio);
      }
    } catch {
      toast.error("Erro ao buscar portfólio de serviços do cliente.", { id: toastId });
    } finally {
      setIsLoadingPortfolio(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-white/10 bg-surface px-3 py-1.5 text-xs text-ink focus:border-signal focus:outline-none"
          >
            <option value="pending">Apenas Pendentes ({submissions.filter((s) => s.status === "pending").length})</option>
            <option value="approved">Aprovadas</option>
            <option value="rejected">Recusadas</option>
            <option value="all">Todas as Submissões</option>
          </select>
        </div>

        <div className="text-xs text-dim">
          Total: <span className="font-semibold text-ink">{filtered.length}</span> item(ns)
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-surface/40 p-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white/5 text-dim mb-3">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-ink">Fila Zerada!</h4>
            <p className="mt-1 text-xs text-dim">
              Nenhuma submissão aguardando revisão no momento.
            </p>
          </div>
        ) : (
          filtered.map((sub) => {
            const currentGrp = getGroupForItem(sub);
            const isProcessing = processingId === sub.id;

            return (
              <div
                key={sub.id}
                className="flex flex-col sm:flex-row items-start gap-4 rounded-xl border border-white/10 bg-surface/60 p-4 backdrop-blur-sm hover:border-white/20 transition"
              >
                {/* Thumbnail */}
                <div className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                  <img
                    src={sub.image_url}
                    alt="Arte enviada"
                    className="size-full object-cover"
                  />
                  <a
                    href={sub.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition text-[10px] text-white font-medium"
                  >
                    Ver cheia
                  </a>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm text-ink">
                      {sub.submitted_by_name || sub.submitted_by_email}
                    </span>
                    <span className="font-mono text-[11px] text-dim">({sub.submitted_by_email})</span>

                    {sub.status === "pending" && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-500/30">
                        ⏳ Aguardando Aprovação
                      </span>
                    )}
                    {sub.status === "approved" && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                        ✓ Aprovada & Publicada
                      </span>
                    )}
                    {sub.status === "rejected" && (
                      <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300 ring-1 ring-rose-500/30">
                        ✕ Recusada
                      </span>
                    )}
                  </div>

                  {sub.notes && (
                    <p className="mt-1.5 text-xs text-ink/90 bg-white/5 rounded p-2 border border-white/5">
                      <span className="text-dim font-mono text-[10px] block">Observações do Consumidor:</span>
                      "{sub.notes}"
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-dim">
                    {sub.sender_phone && (
                      <span className="flex items-center gap-1">
                        📞 Contato: <strong className="text-ink font-mono">{sub.sender_phone}</strong>
                      </span>
                    )}
                    {sub.sender_name && <span>👤 Responsável: {sub.sender_name}</span>}
                    <span>📅 {new Date(sub.created_at).toLocaleString("pt-BR")}</span>

                    {/* Botão de Verificação de WhatsApp & Client ID */}
                    {sub.sender_phone && (
                      <button
                        type="button"
                        onClick={() => handleOpenClientPortfolio(sub.sender_phone)}
                        disabled={isLoadingPortfolio}
                        className="inline-flex items-center gap-1 rounded-md bg-signal/15 border border-signal/30 px-2 py-0.5 text-[10px] font-bold text-signal hover:bg-signal/25 transition cursor-pointer"
                        title="Verificar se este WhatsApp já possui outros serviços/artes cadastradas"
                      >
                        <span>⚡</span>
                        <span>Ver Histórico & Serviços ({generateClientId(sub.sender_phone)})</span>
                      </button>
                    )}
                  </div>

                  {sub.rejection_reason && (
                    <div className="mt-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded p-2">
                      <strong className="font-semibold">Motivo da Recusa:</strong> {sub.rejection_reason}
                    </div>
                  )}
                </div>

                {/* Ações de Aprovação / Recusa */}
                {sub.status === "pending" && (
                  <div className="flex flex-col sm:items-end gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-dim">Cota:</span>
                      <select
                        value={currentGrp?.id || ""}
                        onChange={(e) =>
                          setSelectedGroupMap((prev) => ({ ...prev, [sub.id]: e.target.value }))
                        }
                        className="rounded border border-white/10 bg-[#1a1d29] px-2 py-1 text-xs text-ink focus:border-signal"
                      >
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} — {g.gemini_model || "gemini-2.5-flash"} (R$ {(g.quota_brl - g.used_brl).toFixed(2)} rest.)
                          </option>
                        ))}
                      </select>
                    </div>

                    {currentGrp && (
                      <div className="flex items-center gap-1 text-[10px] text-dim font-mono">
                        <span>🤖 Modelo IA:</span>
                        <span className="font-bold text-signal bg-signal/15 px-1.5 py-0.5 rounded border border-signal/30">
                          {currentGrp.gemini_model || "gemini-2.5-flash"}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRejectingSub(sub)}
                        disabled={isProcessing}
                        className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-50 cursor-pointer"
                      >
                        Recusar
                      </button>

                      <button
                        onClick={() => handleApproveAndAnalyze(sub)}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition disabled:opacity-50 cursor-pointer"
                      >
                        {isProcessing ? (
                          <>
                            <div className="size-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Analisando com IA...
                          </>
                        ) : (
                          <>
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Aprovar & Analisar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Histórico e Paginação de Serviços do Cliente (Client ID / WhatsApp) */}
      {selectedClientPortfolio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0d0f18] p-6 shadow-2xl text-ink max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📂</span>
                <div>
                  <h3 className="text-base font-bold text-ink">Histórico & Portfólio de Serviços do Cliente</h3>
                  <p className="text-xs text-dim">
                    Todos os serviços cadastrados sob o WhatsApp <strong>{selectedClientPortfolio.formattedPhone}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedClientPortfolio(null)}
                className="rounded-lg border border-white/10 p-1.5 text-dim hover:text-ink hover:bg-white/5 transition"
              >
                ✕
              </button>
            </div>

            <ClientServicesPagination portfolio={selectedClientPortfolio} itemsPerPage={8} />

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedClientPortfolio(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-ink hover:bg-white/10 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Motivo da Recusa */}
      {rejectingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/20 bg-[#12141c] p-6 shadow-2xl text-ink">
            <h3 className="text-base font-bold text-rose-400">Recusar Arte</h3>
            <p className="mt-1 text-xs text-dim">
              Informe o motivo da recusa para notificar o consumidor.
            </p>

            <form onSubmit={handleConfirmReject} className="mt-4 space-y-3">
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Imagem com baixa resolução ou dados ilegíveis."
                className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-ink placeholder:text-dim focus:border-signal focus:outline-none resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingSub(null)}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-dim hover:text-ink"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 transition cursor-pointer"
                >
                  Confirmar Recusa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
