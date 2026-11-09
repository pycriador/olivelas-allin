import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { deleteAnalysisImage, setActiveAnalysisImage } from "@/lib/analysis.functions";
import { useAuth } from "@/lib/auth-context";
import { getPermanentImageUrl, handleImageFallback } from "@/lib/client-aggregation";

export interface GalleryItem {
  id: string;
  url: string;
  path?: string;
  type: "original" | "ai_generated";
  created_at?: string;
  prompt?: string;
  model_used?: string;
  artId?: string;
}

interface AdImageGalleryProps {
  artId: string;
  mainImageUrl: string | null;
  mainImagePath?: string | null;
  analysis: Record<string, unknown> | null | undefined;
  businessName?: string | null;
  portfolioArts?: Array<{
    id: string;
    imageUrl?: string;
    businessName?: string;
    category?: string;
    createdAt?: string;
    status?: string;
  }>;
  onRefakeArt?: () => void;
  onUpdated?: () => void;
}

export function AdImageGallery({
  artId,
  mainImageUrl,
  mainImagePath,
  analysis,
  businessName,
  portfolioArts,
  onRefakeArt,
  onUpdated,
}: AdImageGalleryProps) {
  const { isGlobalAdmin, isAnalyst, iamRole } = useAuth();
  const canManageImages = Boolean(
    isGlobalAdmin || isAnalyst || iamRole === "global_admin" || iamRole === "analyst"
  );

  const deleteImageFn = useServerFn(deleteAnalysisImage);
  const setActiveImageFn = useServerFn(setActiveAnalysisImage);

  const [compareMode, setCompareMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingActive, setIsSettingActive] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<GalleryItem | null>(null);

  // Reconstrói a lista da galeria a partir de analysis.image_gallery, portfolioArts e propriedades legadas
  const galleryItems = useMemo<GalleryItem[]>(() => {
    const items: GalleryItem[] = [];
    const seenUrls = new Set<string>();

    const rawGallery = analysis?.["image_gallery"];
    const originalUrl = (analysis?.["original_image_url"] as string) || null;
    const originalPath = (analysis?.["original_image_path"] as string) || null;

    const resolvedMainUrl = getPermanentImageUrl(mainImageUrl, mainImagePath);

    // 1. Imagem principal do anúncio
    if (resolvedMainUrl && !seenUrls.has(resolvedMainUrl)) {
      seenUrls.add(resolvedMainUrl);
      items.push({
        id: `main-${artId}`,
        url: resolvedMainUrl,
        path: mainImagePath || undefined,
        type: analysis?.["generated_with_ai"] ? "ai_generated" : "original",
        created_at: (analysis?.["ai_generated_at"] as string) || undefined,
        model_used: (analysis?.["ai_model_used"] as string) || undefined,
        artId,
      });
    }

    // 2. Imagem original se diferente da principal
    const resolvedOrigUrl = getPermanentImageUrl(originalUrl, originalPath);
    if (resolvedOrigUrl && !seenUrls.has(resolvedOrigUrl)) {
      seenUrls.add(resolvedOrigUrl);
      items.push({
        id: `orig-${artId}`,
        url: resolvedOrigUrl,
        path: originalPath || undefined,
        type: "original",
        created_at: undefined,
        artId,
      });
    }

    // 3. Imagens da galeria interna (artes geradas por IA)
    if (Array.isArray(rawGallery) && rawGallery.length > 0) {
      rawGallery.forEach((item, idx) => {
        const itemUrl = getPermanentImageUrl(item.url ? String(item.url) : null, item.path ? String(item.path) : null);
        if (itemUrl && !seenUrls.has(itemUrl)) {
          seenUrls.add(itemUrl);
          items.push({
            id: String(item.id || `item-${idx}`),
            url: itemUrl,
            path: item.path ? String(item.path) : undefined,
            type: item.type === "original" ? "original" : "ai_generated",
            created_at: item.created_at ? String(item.created_at) : undefined,
            prompt: item.prompt ? String(item.prompt) : undefined,
            model_used: item.model_used ? String(item.model_used) : undefined,
            artId,
          });
        }
      });
    }

    // 4. Todas as publicações e artes do mesmo anunciante (Portfólio / Agrupamento)
    if (Array.isArray(portfolioArts) && portfolioArts.length > 0) {
      portfolioArts.forEach((art, idx) => {
        const artUrl = getPermanentImageUrl(art.imageUrl);
        if (artUrl && !seenUrls.has(artUrl)) {
          seenUrls.add(artUrl);
          items.push({
            id: `portfolio-${art.id || idx}`,
            url: artUrl,
            type: "original",
            created_at: art.createdAt,
            model_used: art.businessName || `Publicação ${idx + 1}`,
            artId: art.id,
          });
        }
      });
    }

    return items;
  }, [analysis, mainImageUrl, mainImagePath, artId, portfolioArts]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Garante que o índice selecionado é válido
  const safeIndex = selectedIndex < galleryItems.length ? selectedIndex : Math.max(0, galleryItems.length - 1);
  const currentItem = galleryItems[safeIndex] || null;

  // Identifica a imagem original e as geradas por IA para o modo comparador
  const originalItem = galleryItems.find((i) => i.type === "original") || null;
  const aiItems = galleryItems.filter((i) => i.type === "ai_generated");
  const activeAiItem = currentItem?.type === "ai_generated" ? currentItem : aiItems[0] || null;

  async function handleSetActive(item: GalleryItem) {
    if (!canManageImages || !item.url) return;
    setIsSettingActive(true);
    try {
      await setActiveImageFn({
        data: {
          analysisId: artId,
          imageUrl: item.url,
          imagePath: item.path || undefined,
        },
      });
      toast.success("Imagem definida como capa principal da Vitrine!");
      if (onUpdated) onUpdated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao definir imagem principal.";
      toast.error(msg);
    } finally {
      setIsSettingActive(false);
    }
  }

  async function handleConfirmDelete() {
    if (!itemToDelete || !canManageImages) return;
    setIsDeleting(true);
    const toastId = toast.loading("Apagando imagem...");

    try {
      const res = await deleteImageFn({
        data: {
          analysisId: artId,
          galleryItemId: itemToDelete.id,
          targetType: itemToDelete.type,
          imagePath: itemToDelete.path,
          imageUrl: itemToDelete.url,
        },
      });

      if (!res.ok) throw new Error("Falha ao apagar imagem.");

      toast.success(
        itemToDelete.type === "original"
          ? "Imagem original removida com sucesso."
          : "Arte gerada por IA removida com sucesso.",
        { id: toastId }
      );

      setItemToDelete(null);
      if (onUpdated) onUpdated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao apagar imagem.";
      toast.error(`Falha: ${msg}`, { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  }

  function handleDownload(url: string, prefix: string) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.download = `${prefix}-${(businessName || "anuncio").toLowerCase().replace(/\s+/g, "-")}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Download iniciado!");
  }

  if (galleryItems.length === 0 && !mainImageUrl) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#201E1C]/60 p-8 text-center backdrop-blur-xl">
        <p className="text-sm text-[#A8A199]">Nenhuma imagem cadastrada para este anúncio.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#201E1C]/80 p-4 backdrop-blur-xl max-w-full overflow-hidden">
      {/* Barra de Controles da Galeria */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C4A468] flex items-center gap-1.5 font-mono">
            <span>🖼️</span> Galeria de Artes do Anunciante ({galleryItems.length} {galleryItems.length === 1 ? "imagem" : "imagens"})
          </span>
          {galleryItems.some((i) => i.type === "ai_generated") && (
            <span className="rounded-full bg-[#A88C5A]/15 border border-[#A88C5A]/35 px-2 py-0.5 font-mono text-[10px] font-bold text-[#C4A468]">
              IA Recriada
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle de Comparador Antes/Depois (só se tiver original + IA) */}
          {originalItem && aiItems.length > 0 && (
            <button
              type="button"
              onClick={() => setCompareMode(!compareMode)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                compareMode
                  ? "border-[#A88C5A] bg-[#A88C5A]/20 text-[#C4A468] font-bold shadow-sm"
                  : "border-white/10 bg-white/[0.03] text-[#A8A199] hover:text-[#FBF9F5] hover:bg-white/[0.08]"
              }`}
              title="Comparar imagem original enviada vs imagem recriada com IA lado a lado"
            >
              <span>⚖️</span>
              <span>{compareMode ? "Visualização Individual" : "Comparar Antes vs Depois"}</span>
            </button>
          )}

          {/* Botão Refazer Arte com IA */}
          {onRefakeArt && (
            <button
              type="button"
              onClick={onRefakeArt}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#A88C5A]/40 bg-[#A88C5A]/15 px-2.5 py-1 text-xs font-semibold text-[#C4A468] hover:bg-[#A88C5A]/25 transition cursor-pointer shadow-sm"
            >
              <span>🎨</span>
              <span>+ Refazer com IA</span>
            </button>
          )}
        </div>
      </div>

      {/* Miniaturas das Imagens (Carrossel / Tabs de Seleção) */}
      {galleryItems.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 max-w-full">
          {galleryItems.map((item, idx) => {
            const isSelected = idx === safeIndex;
            const isMain = item.url === mainImageUrl;
            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedIndex(idx);
                  if (compareMode && item.type === "original") {
                    setCompareMode(false);
                  }
                }}
                className={`group relative flex items-center gap-2 rounded-xl border p-1.5 transition-all cursor-pointer shrink-0 max-w-[220px] ${
                  isSelected
                    ? "border-[#A88C5A] bg-[#A88C5A]/15 shadow-md shadow-[#A88C5A]/10 ring-1 ring-[#A88C5A]/50"
                    : "border-white/10 bg-[#181716]/60 hover:border-white/20 hover:bg-[#181716]"
                }`}
              >
                <img
                  src={item.url}
                  alt={`Miniatura ${idx + 1}`}
                  className="size-12 rounded-lg object-cover bg-black/40 shrink-0"
                  onError={handleImageFallback}
                />
                <div className="min-w-0 flex-1 pr-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-[#FBF9F5] truncate">
                      {item.type === "original" ? "📸 Original" : "✨ IA"}
                    </span>
                    {isMain && (
                      <span className="text-[9px] text-[#C4A468] font-mono font-bold shrink-0" title="Capa Principal">
                        ★ Capa
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#A8A199] truncate font-mono">
                    {item.model_used || (item.type === "original" ? "Cliente" : "Imagem IA")}
                  </p>
                </div>

                {/* Botão de Excluir Rápido no Thumbnail (Admin/Analista) */}
                {canManageImages && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setItemToDelete(item);
                    }}
                    className="opacity-0 group-hover:opacity-100 grid size-6 place-items-center rounded bg-danger/20 border border-danger/40 text-danger hover:bg-danger/40 transition shrink-0 cursor-pointer"
                    title="Apagar esta imagem da galeria"
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Visualização: Modo Comparador Lado a Lado */}
      {compareMode && originalItem && activeAiItem ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in pt-1">
          {/* Lado Esquerdo: Original */}
          <div className="flex flex-col rounded-xl border border-white/10 bg-[#181716]/90 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#A8A199] flex items-center gap-1.5">
                <span>📸</span> Imagem Original Enviada pelo Cliente
              </span>
              <a
                href={originalItem.url}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-mono text-[#C4A468] hover:underline"
              >
                Ver em alta ↗
              </a>
            </div>
            <div className="relative overflow-hidden rounded-lg bg-black/50 aspect-square flex items-center justify-center">
              <img
                src={originalItem.url}
                alt="Original"
                className="max-h-full max-w-full object-contain rounded"
              />
            </div>
            {canManageImages && (
              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => handleSetActive(originalItem)}
                  disabled={isSettingActive || originalItem.url === mainImageUrl}
                  className="text-[11px] font-medium text-[#C4A468] hover:underline disabled:opacity-40 cursor-pointer"
                >
                  {originalItem.url === mainImageUrl ? "✓ É a Capa Atual" : "★ Definir como Capa"}
                </button>
                <button
                  type="button"
                  onClick={() => setItemToDelete(originalItem)}
                  className="text-[11px] text-danger hover:underline cursor-pointer"
                >
                  🗑️ Apagar Original
                </button>
              </div>
            )}
          </div>

          {/* Lado Direito: IA */}
          <div className="flex flex-col rounded-xl border border-[#A88C5A]/35 bg-[#282218]/80 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#C4A468] flex items-center gap-1.5">
                <span>✨</span> Nova Arte Gerada por IA ({activeAiItem.model_used || "Gemini / Imagen"})
              </span>
              <a
                href={activeAiItem.url}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-mono text-[#C4A468] hover:underline"
              >
                Ver em alta ↗
              </a>
            </div>
            <div className="relative overflow-hidden rounded-lg bg-black/50 aspect-square flex items-center justify-center">
              <img
                src={activeAiItem.url}
                alt="Gerada por IA"
                className="max-h-full max-w-full object-contain rounded"
              />
            </div>
            {canManageImages && (
              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => handleSetActive(activeAiItem)}
                  disabled={isSettingActive || activeAiItem.url === mainImageUrl}
                  className="text-[11px] font-medium text-[#C4A468] hover:underline disabled:opacity-40 cursor-pointer"
                >
                  {activeAiItem.url === mainImageUrl ? "✓ É a Capa Atual" : "★ Definir como Capa"}
                </button>
                <button
                  type="button"
                  onClick={() => setItemToDelete(activeAiItem)}
                  className="text-[11px] text-danger hover:underline cursor-pointer"
                >
                  🗑️ Apagar Arte IA
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Visualização: Imagem Única Selecionada em Destaque */
        currentItem && (
          <div className="relative flex flex-col group max-w-full overflow-hidden">
            {/* Header da Imagem com Badges e Ações */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 ${
                    currentItem.type === "original"
                      ? "bg-white/10 text-[#FBF9F5] border border-white/15"
                      : "bg-[#A88C5A]/20 text-[#C4A468] border border-[#A88C5A]/40"
                  }`}
                >
                  <span>{currentItem.type === "original" ? "📸" : "✨"}</span>
                  <span>
                    {currentItem.type === "original"
                      ? "Imagem Original (Enviada pelo Cliente)"
                      : `Arte Recriada com IA (${currentItem.model_used || "Imagen 3 / Gemini"})`}
                  </span>
                </span>

                {currentItem.url === mainImageUrl && (
                  <span className="rounded-md bg-[#A88C5A]/20 border border-[#A88C5A]/40 px-2 py-0.5 font-mono text-[10px] font-bold text-[#C4A468]">
                    ★ Capa da Vitrine
                  </span>
                )}
              </div>

              {currentItem.created_at && (
                <span className="text-[10px] font-mono text-[#78716A]">
                  {new Date(currentItem.created_at).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>

            {/* Imagem em Destaque */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#181716]/90">
              <img
                src={currentItem.url}
                alt={businessName ?? "Imagem do anúncio"}
                className="max-h-[580px] w-full rounded-xl object-contain bg-black/40"
                onError={handleImageFallback}
              />

              {/* Botões Flutuantes sobre a Imagem */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2 backdrop-blur-md bg-[#151413]/85 p-1.5 rounded-xl border border-white/10 shadow-lg">
                <button
                  type="button"
                  onClick={() => handleDownload(currentItem.url, currentItem.type)}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-[#A8A199] hover:text-[#FBF9F5] transition cursor-pointer"
                  title="Baixar imagem em alta resolução"
                >
                  ⬇️ Baixar
                </button>

                <a
                  href={currentItem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-[#A8A199] hover:text-[#FBF9F5] transition"
                  title="Abrir imagem em nova aba"
                >
                  🔍 Abrir ↗
                </a>

                {/* Botão de Exclusão (Admin Global e Analista) */}
                {canManageImages && (
                  <button
                    type="button"
                    onClick={() => setItemToDelete(currentItem)}
                    className="rounded-lg border border-danger/40 bg-danger/15 px-2.5 py-1 font-mono text-[11px] text-danger hover:bg-danger/30 transition cursor-pointer"
                    title="Apagar esta imagem permanentemente"
                  >
                    🗑️ Apagar
                  </button>
                )}
              </div>
            </div>

            {/* Ações inferiores da imagem */}
            {canManageImages && currentItem.url !== mainImageUrl && (
              <div className="mt-2.5 flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => handleSetActive(currentItem)}
                  disabled={isSettingActive}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C4A468] hover:underline cursor-pointer disabled:opacity-50"
                >
                  <span>★</span>
                  <span>Definir esta versão como Capa Principal da Vitrine</span>
                </button>

                {currentItem.prompt && (
                  <span className="text-[10px] text-[#A8A199] font-mono truncate max-w-sm" title={currentItem.prompt}>
                    Prompt: "{currentItem.prompt.slice(0, 60)}..."
                  </span>
                )}
              </div>
            )}
          </div>
        )
      )}

      {/* Modal de Confirmação de Exclusão */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-danger/40 bg-[#1C1A18] p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-danger mb-3">
              <div className="grid size-10 place-items-center rounded-xl bg-danger/20 border border-danger/40 text-xl">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-bold text-[#FBF9F5]">Confirmar Exclusão de Imagem</h3>
                <p className="text-xs text-[#A8A199]">Ação exclusiva de Administrador / Analista</p>
              </div>
            </div>

            <p className="text-xs text-[#A8A199] leading-relaxed mb-4">
              Você tem certeza que deseja apagar permanentemente esta imagem{" "}
              <strong className="text-[#FBF9F5]">
                ({itemToDelete.type === "original" ? "Imagem Original do Cliente" : "Arte Gerada por IA"})
              </strong>{" "}
              do anúncio e do armazenamento do servidor? Esta ação não pode ser desfeita.
            </p>

            <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/50 mb-4 max-h-40 flex items-center justify-center">
              <img
                src={itemToDelete.url}
                alt="Imagem para apagar"
                className="max-h-40 max-w-full object-contain rounded"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setItemToDelete(null)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-[#A8A199] hover:text-[#FBF9F5] hover:bg-white/[0.08] transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-danger px-4 py-2 text-xs font-bold text-white hover:bg-danger/90 transition shadow-lg shadow-danger/25 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Apagando...</span>
                  </>
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>Sim, Apagar Imagem</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
