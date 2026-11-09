import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { JsonHighlight } from "@/components/JsonHighlight";
import { ArtPromptGenerator } from "@/components/ArtPromptGenerator";
import { AdImageGallery } from "@/components/AdImageGallery";
import { useAuth } from "@/lib/auth-context";
import { getClientPortfolio, getClientPortfolioByPhone } from "@/lib/client-aggregation";
import { ClientServicesPagination } from "@/components/ClientServicesPagination";

export const Route = createFileRoute("/anuncio/$id")({
  head: () => ({
    meta: [
      { title: "Anúncio — WhatsApp Image Analyzer" },
      {
        name: "description",
        content: "Visualização completa e dados extraídos do anúncio por Inteligência Artificial.",
      },
      { property: "og:title", content: "Anúncio — WhatsApp Image Analyzer" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AnuncioPage,
});

type Row = {
  id: string;
  created_at: string;
  image_url: string | null;
  image_path: string | null;
  image_type: string | null;
  business_name: string | null;
  category: string | null;
  title: string | null;
  summary: string | null;
  keywords: string[] | null;
  confidence: number | null;
  analysis: unknown;
  status: string;
  model_used: string | null;
  error_message: string | null;
};

function cleanPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

function AnuncioPage() {
  const { id } = Route.useParams();
  const [isArtPromptOpen, setIsArtPromptOpen] = useState(false);

  const query = useQuery({
    queryKey: ["anuncio", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("image_analysis")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw new Error(error.message);
      return data as unknown as Row;
    },
  });

  const row = query.data;

  const contacts = useMemo(() => {
    if (!row?.analysis || typeof row.analysis !== "object") return null;
    const a = row.analysis as Record<string, unknown>;
    const c = a["contacts"] as Record<string, unknown> | undefined;
    if (!c) return null;
    const phones = Array.isArray(c["phones"]) ? (c["phones"] as string[]) : [];
    const whatsapp = typeof c["whatsapp"] === "string" ? c["whatsapp"] : "";
    const emails = Array.isArray(c["emails"]) ? (c["emails"] as string[]) : [];
    const instagram = typeof c["instagram"] === "string" ? c["instagram"] : "";
    const website = typeof c["website"] === "string" ? c["website"] : "";
    const senderName = typeof c["senderName"] === "string" ? c["senderName"] : "";
    const hasAny = Boolean(phones.length > 0 || whatsapp || emails.length > 0 || instagram || website || senderName);
    return { phones, whatsapp, emails, instagram, website, senderName, hasAny };
  }, [row?.analysis]);

  const products = useMemo(() => {
    if (!row?.analysis || typeof row.analysis !== "object") return [];
    const a = row.analysis as Record<string, unknown>;
    const list: Array<{ name: string; price?: string }> = [];
    const prods = Array.isArray(a["products"]) ? a["products"] : [];
    const prices = Array.isArray(a["prices"]) ? a["prices"] : [];

    prods.forEach((p, idx) => {
      if (typeof p === "string") {
        list.push({ name: p, price: typeof prices[idx] === "string" ? prices[idx] : undefined });
      } else if (typeof p === "object" && p !== null) {
        const rec = p as Record<string, unknown>;
        list.push({
          name: String(rec["name"] || rec["title"] || rec["description"] || JSON.stringify(p)),
          price: rec["price"] ? String(rec["price"]) : undefined,
        });
      }
    });

    return list;
  }, [row?.analysis]);

  const address = useMemo(() => {
    if (!row?.analysis || typeof row.analysis !== "object") return "";
    const a = row.analysis as Record<string, unknown>;
    const addr = a["address"] as Record<string, unknown> | undefined;
    if (!addr) return "";
    return [
      addr["street"],
      addr["number"],
      addr["district"],
      addr["city"],
      addr["state"],
      addr["zipcode"],
    ]
      .filter(Boolean)
      .join(", ");
  }, [row?.analysis]);

  const ocrText = useMemo(() => {
    if (!row?.analysis || typeof row.analysis !== "object") return "";
    const a = row.analysis as Record<string, unknown>;
    return typeof a["ocrText"] === "string" ? a["ocrText"] : "";
  }, [row?.analysis]);

  const visualDescription = useMemo(() => {
    if (!row?.analysis || typeof row.analysis !== "object") return null;
    const a = row.analysis as Record<string, unknown>;
    const detailed = typeof a["detailedVisualDescription"] === "string" ? a["detailedVisualDescription"].trim() : "";
    const details = Array.isArray(a["visualDetails"])
      ? (a["visualDetails"] as string[]).map((v) => String(v).trim()).filter(Boolean)
      : [];
    if (!detailed && details.length === 0) return null;
    return { detailed, details };
  }, [row?.analysis]);

  const queryClient = useQueryClient();
  const { user, isGlobalAdmin } = useAuth();
  const isAuthorizedAdmin = Boolean(isGlobalAdmin || user);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  const isVisibleInStore = useMemo(() => {
    if (!row?.analysis || typeof row.analysis !== "object") return true;
    const a = row.analysis as Record<string, unknown>;
    if (typeof a["is_visible_in_store"] === "boolean") return a["is_visible_in_store"];
    if (typeof a["isVisibleInStore"] === "boolean") return a["isVisibleInStore"];
    return true;
  }, [row?.analysis]);

  async function toggleStoreVisibility() {
    if (!isGlobalAdmin || !row) return;
    setIsUpdatingVisibility(true);

    try {
      const currentAnalysis =
        row.analysis && typeof row.analysis === "object"
          ? (row.analysis as Record<string, unknown>)
          : {};

      const newVis = !isVisibleInStore;
      const updatedAnalysis = {
        ...currentAnalysis,
        is_visible_in_store: newVis,
        isVisibleInStore: newVis,
      };

      const { error } = await supabase
        .from("image_analysis")
        .update({ analysis: updatedAnalysis })
        .eq("id", row.id);

      if (error) throw error;

      toast.success(
        newVis ? "Produto marcado como VISÍVEL na Vitrine." : "Produto OCULTADO da Vitrine Pública."
      );
      queryClient.invalidateQueries({ queryKey: ["anuncio", id] });
    } catch {
      toast.error("Falha ao atualizar status de visibilidade.");
    } finally {
      setIsUpdatingVisibility(false);
    }
  }

  function copyShareLink() {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link do anúncio copiado para a área de transferência!");
  }

  function shareNative() {
    if (typeof navigator !== "undefined" && navigator.share && row) {
      navigator
        .share({
          title: row.business_name || row.title || "Anúncio",
          text: row.summary || "Confira este anúncio analisado por IA",
          url: window.location.href,
        })
        .catch(() => {
          copyShareLink();
        });
    } else {
      copyShareLink();
    }
  }

  function copyJson() {
    if (!row?.analysis) return;
    navigator.clipboard.writeText(JSON.stringify(row.analysis, null, 2));
    toast.success("JSON copiado.");
  }

  function downloadJson() {
    if (!row?.analysis) return;
    const blob = new Blob([JSON.stringify(row.analysis, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anuncio-${id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const primaryPhone = contacts?.whatsapp || contacts?.phones?.[0];
  const clientPortfolioQuery = useQuery({
    queryKey: ["client-portfolio", id, primaryPhone, row?.business_name],
    queryFn: () => getClientPortfolio(id, primaryPhone, row?.business_name),
    enabled: Boolean(id || primaryPhone),
  });
  const clientPortfolio = clientPortfolioQuery.data;

  if (query.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-ink">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-signal border-t-transparent" />
          <p className="font-mono text-xs text-dim">Carregando anúncio...</p>
        </div>
      </div>
    );
  }

  if (query.isError || !row) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4 text-ink">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center backdrop-blur-xl">
          <h1 className="text-xl font-bold text-ink">Anúncio não encontrado</h1>
          <p className="mt-2 text-xs text-dim leading-relaxed">
            Este anúncio pode ter sido removido ou o link está incorreto.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-signal px-4 py-2 font-mono text-xs font-semibold text-canvas transition-colors hover:bg-signal/90"
          >
            ← Voltar para a Vitrine
          </Link>
        </div>
      </div>
    );
  }

  const confidence = Number(row?.confidence ?? 0);

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-canvas text-ink antialiased">
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-[#A88C5A]/5 blur-[160px]" />
        <div className="absolute -bottom-52 right-0 h-[460px] w-[520px] rounded-full bg-[#768F6E]/5 blur-[160px]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1240px] min-w-0 px-4 py-6 sm:px-8 sm:py-10">
        {/* Barra superior de navegação e compartilhamento */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between min-w-0">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono text-xs text-[#A8A199] transition-colors hover:text-[#C4A468] truncate cursor-pointer"
          >
            ← Voltar para a Vitrine da Loja
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {/* Controle de Visibilidade exclusivo do Administrador Global */}
            {isGlobalAdmin && (
              <button
                type="button"
                onClick={toggleStoreVisibility}
                disabled={isUpdatingVisibility}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  isVisibleInStore
                    ? "border-[#768F6E]/40 bg-[#1A261D]/90 text-[#768F6E] hover:bg-[#1A261D]"
                    : "border-[#C4A468]/40 bg-[#282218]/90 text-[#C4A468] hover:bg-[#282218]"
                }`}
                title="Clique para alternar visibilidade deste produto na Vitrine Pública"
              >
                <span>{isVisibleInStore ? "👁️" : "🙈"}</span>
                <span>{isVisibleInStore ? "Visível na Vitrine" : "Oculto da Vitrine"}</span>
              </button>
            )}

            {/* Ação de Refazer Arte com IA (Somente Admin) */}
            {isAuthorizedAdmin && (
              <button
                onClick={() => setIsArtPromptOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#A88C5A]/40 bg-[#A88C5A]/15 px-3 py-1.5 text-xs font-semibold text-[#C4A468] transition-all hover:bg-[#A88C5A]/25 shadow-sm cursor-pointer"
              >
                <span>🎨</span>
                Refazer Arte com IA
              </button>
            )}

            <button
              onClick={shareNative}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#1C1A18]/80 px-3 py-1.5 text-xs font-medium text-[#A8A199] transition-colors hover:text-[#FBF9F5] cursor-pointer"
            >
              <span>🔗</span>
              Compartilhar Anúncio
            </button>
            <button
              onClick={copyShareLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#A88C5A]/30 bg-[#A88C5A]/10 px-3 py-1.5 text-xs font-semibold text-[#C4A468] transition-colors hover:bg-[#A88C5A]/20 cursor-pointer"
            >
              <span>📋</span>
              Copiar Link
            </button>
          </div>
        </div>

        {/* Cabeçalho do Anúncio */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-[#201E1C]/80 p-5 backdrop-blur-xl sm:p-7 min-w-0 max-w-full overflow-hidden">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between min-w-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 font-mono text-xs text-[#C4A468]">
                <span>◈</span>
                <span className="truncate">{row.category || "Anúncio"}</span>
                {row.image_type && <span className="text-[#78716A] truncate">· {row.image_type}</span>}
              </div>
              <h1 className="mt-1.5 font-serif text-2xl font-normal tracking-wide text-[#FBF9F5] sm:text-3xl break-words">
                {row.business_name || row.title || "Anúncio sem título"}
              </h1>
              {row.summary && <p className="mt-2 text-sm text-[#A8A199] leading-relaxed break-words text-pretty">{row.summary}</p>}
            </div>

            <div className="flex flex-col items-start gap-2 self-start rounded-xl border border-white/5 bg-[#181716]/80 p-3 font-mono text-xs sm:items-end shrink-0">
              <span className="text-[#78716A]">ID: {row.id.slice(0, 8)}…</span>
              <span className="text-[#A8A199]">{new Date(row.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
        </div>

        {/* Banner de Refazer Arte com IA (Exclusivo do Administrador) */}
        {isAuthorizedAdmin && (
          <div className="mb-6 rounded-2xl border border-[#A88C5A]/35 bg-[#282218]/90 p-4 sm:p-5 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0 max-w-full">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#A88C5A]/20 border border-[#A88C5A]/40 text-xl text-[#C4A468]">
                🎨
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-[#FBF9F5] sm:text-base flex items-center gap-2 flex-wrap">
                  <span>Refazer Arte Profissional com IA</span>
                  <span className="rounded bg-[#A88C5A]/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[#C4A468] uppercase">
                    Prompt Master (30+ Opções)
                  </span>
                </h2>
                <p className="mt-0.5 text-xs text-[#A8A199] break-words leading-relaxed">
                  Gere um prompt otimizado para Midjourney, Flux.1, ChatGPT/DALL-E e redes sociais usando os dados deste anúncio.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsArtPromptOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#A88C5A] px-5 py-2.5 text-xs font-bold text-[#151413] shadow-lg shadow-[#A88C5A]/20 transition-all hover:bg-[#967B4A] shrink-0 cursor-pointer"
            >
              <span>✨</span>
              <span>Refazer Arte Agora</span>
            </button>
          </div>
        )}

        {/* Layout da Página: Uma caixa em cada linha (1 coluna vertical limpa e espaçosa) */}
        <div className="mx-auto max-w-4xl flex flex-col gap-6 min-w-0 w-full">
          {/* 1. Galeria de Imagens do Anúncio (Original vs IA, Comparador e Exclusão) */}
          <AdImageGallery
            artId={row.id}
            mainImageUrl={row.image_url}
            mainImagePath={row.image_path}
            analysis={row.analysis as Record<string, unknown> | undefined}
            businessName={row.business_name || row.title}
            portfolioArts={clientPortfolio?.arts}
            onRefakeArt={isAuthorizedAdmin ? () => setIsArtPromptOpen(true) : undefined}
            onUpdated={() => {
              queryClient.invalidateQueries({ queryKey: ["anuncio", id] });
            }}
          />

          {/* 2. Ação rápida de WhatsApp / Contato */}
          {primaryPhone && (
            <div className="rounded-2xl border border-[#25D366]/30 bg-[#1A261D]/90 p-5 backdrop-blur-xl min-w-0 max-w-full">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
                <div className="min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#25D366]">
                    Contato Direto
                  </span>
                  <p className="mt-0.5 font-mono text-lg font-bold text-[#25D366] truncate">
                    {primaryPhone}
                  </p>
                  {contacts?.senderName && (
                    <p className="text-xs text-[#A8A199] truncate">Responsável: {contacts.senderName}</p>
                  )}
                </div>
                <a
                  href={`https://wa.me/${cleanPhoneForWhatsApp(primaryPhone)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 font-bold text-[#151413] shadow-lg shadow-[#25D366]/20 transition-all hover:bg-[#1EBE5D] shrink-0 cursor-pointer"
                >
                  <span>💬</span>
                  Conversar no WhatsApp
                </a>
              </div>
            </div>
          )}

          {/* 3. Lista de Produtos & Itens à Venda (Formato de Lista - Quebra automática de textos longos) */}
          {products.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#201E1C]/80 p-5 backdrop-blur-xl sm:p-6 min-w-0 max-w-full overflow-hidden">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#C4A468] flex items-center gap-2">
                  <span>🛍️</span> Produtos & Itens à Venda
                </h2>
                <span className="rounded-md border border-[#A88C5A]/30 bg-[#A88C5A]/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#C4A468]">
                  {products.length} {products.length === 1 ? "item" : "itens"}
                </span>
              </div>

              <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-[#181716]/80 overflow-hidden min-w-0 max-w-full">
                {products.map((prod, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3.5 sm:px-4 text-sm text-[#FBF9F5] transition-colors hover:bg-white/[0.02] min-w-0 max-w-full"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <span className="text-[#C4A468] text-xs mt-1 select-none shrink-0">✦</span>
                      <span className="font-medium text-[#FBF9F5] leading-relaxed break-words [overflow-wrap:anywhere] min-w-0 flex-1">
                        {prod.name}
                      </span>
                    </div>
                    {prod.price && (
                      <div className="self-start sm:self-center shrink-0 max-w-full sm:max-w-[50%]">
                        <span className="inline-block rounded-lg border border-[#A88C5A]/30 bg-[#A88C5A]/15 px-3 py-1 font-mono text-xs font-bold text-[#C4A468] break-words [overflow-wrap:anywhere] whitespace-normal leading-snug shadow-sm text-left sm:text-right">
                          {prod.price}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Detalhes Visuais & Físicos dos Produtos (Fidelidade Real) */}
          {visualDescription && (
            <div className="rounded-2xl border border-white/10 bg-[#201E1C]/80 p-5 backdrop-blur-xl sm:p-6 min-w-0 max-w-full overflow-hidden">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#C4A468] flex items-center gap-2">
                <span>👁️</span> Detalhes Visuais & Físicos dos Produtos
              </h2>
              {visualDescription.detailed && (
                <p className="text-sm text-[#A8A199] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                  {visualDescription.detailed}
                </p>
              )}
              {visualDescription.details.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {visualDescription.details.map((item, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg border border-[#A88C5A]/30 bg-[#A88C5A]/10 px-2.5 py-1 text-xs text-[#C4A468] font-medium break-words [overflow-wrap:anywhere]"
                    >
                      ✓ {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. Portfólio & Paginação de Todos os Serviços Prestados pelo Cliente (Client ID / WhatsApp) */}
          {clientPortfolio && clientPortfolio.services.length > 0 && (
            <div className="min-w-0 max-w-full">
              <ClientServicesPagination
                portfolio={clientPortfolio}
                currentArtId={row.id}
                itemsPerPage={8}
              />
            </div>
          )}

          {/* 6. Dados do Estabelecimento e Localização */}
          {(address || (row.keywords && row.keywords.length > 0)) && (
            <div className="rounded-2xl border border-white/10 bg-[#201E1C]/80 p-5 backdrop-blur-xl sm:p-6 min-w-0 max-w-full">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#A8A199]">
                Detalhes Adicionais
              </h2>
              <dl className="space-y-3 text-sm">
                {address && (
                  <div className="border-b border-white/5 pb-2.5">
                    <dt className="text-xs text-[#A8A199]">Endereço / Localização</dt>
                    <dd className="mt-0.5 text-[#FBF9F5] break-words [overflow-wrap:anywhere]">{address}</dd>
                  </div>
                )}
                {row.keywords && row.keywords.length > 0 && (
                  <div className="pt-1">
                    <dt className="text-xs text-[#A8A199] mb-2">Palavras-chave & Tags</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {row.keywords.map((k, idx) => (
                        <span
                          key={idx}
                          className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-1 font-mono text-[11px] text-[#78716A] break-words [overflow-wrap:anywhere]"
                        >
                          #{k}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* 6. Métricas da IA (Caixa em linha inteira - Exclusivo Administrador) */}
          {isAuthorizedAdmin && (
            <div className="rounded-2xl border border-white/10 bg-[#201E1C]/80 p-5 backdrop-blur-xl sm:p-6 min-w-0 max-w-full overflow-hidden">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#A8A199] flex items-center gap-2">
                <span>⚡</span> Métricas da IA (Visão do Administrador)
              </h2>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
                <div className="rounded-xl border border-white/5 bg-[#181716]/80 p-3">
                  <dt className="text-xs text-[#A8A199]">Índice de Confiança</dt>
                  <dd className="mt-1 font-mono text-base font-bold text-[#C4A468]">{confidence.toFixed(2)}</dd>
                </div>
                <div className="rounded-xl border border-white/5 bg-[#181716]/80 p-3">
                  <dt className="text-xs text-[#A8A199]">Modelo Utilizado</dt>
                  <dd className="mt-1 font-mono text-xs font-semibold text-[#FBF9F5] break-words">{row.model_used || "Vision AI"}</dd>
                </div>
                <div className="rounded-xl border border-white/5 bg-[#181716]/80 p-3">
                  <dt className="text-xs text-[#A8A199]">Data do Processamento</dt>
                  <dd className="mt-1 font-mono text-xs text-[#78716A]">
                    {new Date(row.created_at).toLocaleString("pt-BR")}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* 7. Texto OCR Extraído (Caixa em linha inteira - Exclusivo Administrador) */}
          {isAuthorizedAdmin && ocrText && (
            <div className="rounded-2xl border border-white/10 bg-[#201E1C]/80 p-5 backdrop-blur-xl sm:p-6 min-w-0 max-w-full overflow-hidden">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#A8A199] flex items-center gap-2">
                <span>📄</span> Texto OCR Identificado (Visão do Administrador)
              </h2>
              <div className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere] font-mono text-xs leading-relaxed text-[#A8A199] bg-[#181716]/90 p-4 rounded-xl border border-white/5">
                {ocrText}
              </div>
            </div>
          )}

          {/* 8. JSON Estruturado (Caixa em linha inteira - Exclusivo Administrador) */}
          {isAuthorizedAdmin && (
            <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#181716] backdrop-blur-xl min-w-0 max-w-full">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 min-w-0">
                <span className="font-mono text-xs text-[#C4A468] truncate">anuncio-{row.id.slice(0, 8)}.json</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={copyJson}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-[#A8A199] hover:text-[#FBF9F5] cursor-pointer"
                  >
                    <span>⧉</span> Copiar
                  </button>
                  <button
                    onClick={downloadJson}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-[#A8A199] hover:text-[#FBF9F5] cursor-pointer"
                  >
                    <span>↓</span> Baixar
                  </button>
                </div>
              </div>
              <div className="max-h-[480px] overflow-auto max-w-full">
                <JsonHighlight value={row.analysis} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Refazer Arte com IA (Somente Admin) */}
      {isAuthorizedAdmin && (
        <ArtPromptGenerator
          isOpen={isArtPromptOpen}
          onClose={() => setIsArtPromptOpen(false)}
          analysis={row.analysis as Record<string, unknown> | undefined}
          imageUrl={row.image_url}
          title={row.business_name || row.title}
          artId={row.id}
          onArtUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ["anuncio", id] });
          }}
        />
      )}
    </div>
  );
}
