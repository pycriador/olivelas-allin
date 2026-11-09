import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Sparkles,
  Search,
  Shuffle,
  Eye,
  EyeOff,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Tag,
  Layers,
  Wand2,
  UploadCloud,
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "@/components/AuthModal";
import { IamManagementModal } from "@/components/iam/IamManagementModal";
import { ConsumerSubmissionModal } from "@/components/iam/ConsumerSubmissionModal";
import { EnterpriseNavbar } from "@/components/EnterpriseNavbar";
import { listGroups, listSubmissions } from "@/lib/iam-service";
import type { IamGroup } from "@/lib/iam-types";
import {
  groupRowsByAdvertiser,
  type GenericStoreRow,
  type GroupedAdvertiser,
  cleanPhoneForWhatsApp,
  handleImageFallback,
} from "@/lib/client-aggregation";

export type StoreProductRow = {
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
  sender_phone?: string | null;
  sender_name?: string | null;
};

interface StoreLandingPageProps {
  rows: StoreProductRow[];
  onOpenAnalyzer: () => void;
  onOpenIam?: (tab?: "overview" | "usage" | "prompts" | "groups" | "users" | "tokens" | "queue") => void;
  onRefreshData?: () => void;
}

function normalizeSearchText(str: string): string {
  return str
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

/**
 * Card unificado do Anunciante exibindo galeria de artes e produtos consolidados
 */
function AdvertiserCard({
  advertiser,
  isGlobalAdmin,
  isVisible,
  isUpdating,
  onToggleVisibility,
}: {
  advertiser: GroupedAdvertiser;
  isGlobalAdmin: boolean;
  isVisible: boolean;
  isUpdating: boolean;
  onToggleVisibility: (advertiser: GroupedAdvertiser, e: React.MouseEvent) => void;
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const images =
    advertiser.images.length > 0
      ? advertiser.images
      : advertiser.primaryImageUrl
      ? [{ id: advertiser.id, imageUrl: advertiser.primaryImageUrl, createdAt: advertiser.latestCreatedAt }]
      : [];

  const currentImage = images[activeImageIndex] || images[0];

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#201E1C]/85 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#A88C5A]/50 hover:shadow-2xl hover:shadow-black/50">
      {/* Imagem Principal com Aspect Ratio Vertical (Story do Instagram / Status WhatsApp 9:16) */}
      <div className="relative mb-3.5 aspect-[9/16] max-h-[500px] w-full overflow-hidden rounded-xl bg-[#141312] border border-white/[0.06]">
        {currentImage?.imageUrl ? (
          <>
            {/* Backdrop com blur para preenchimento elegante */}
            <img
              src={currentImage.imageUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover blur-xl opacity-35 scale-110 pointer-events-none"
            />
            <img
              src={currentImage.imageUrl}
              alt={advertiser.businessName}
              className="relative z-1 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={handleImageFallback}
            />
          </>
        ) : (
          <div className="grid h-full place-items-center text-xs text-[#A8A199]">
            Sem Imagem
          </div>
        )}

        {/* Categoria Badge */}
        {advertiser.category && (
          <span className="absolute top-2.5 left-2.5 rounded-lg border border-[#A88C5A]/30 bg-[#181716]/90 px-2.5 py-1 font-mono text-[10px] font-semibold text-[#C4A468] backdrop-blur-md">
            {advertiser.category}
          </span>
        )}

        {/* Indicador de Múltiplas Publicações Unificadas */}
        {advertiser.totalPublications > 1 && (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-lg border border-[#A88C5A]/40 bg-[#151413]/90 px-2 py-0.5 font-mono text-[10px] font-bold text-[#C4A468] backdrop-blur-md shadow-sm">
            <Layers className="size-3" />
            <span>{advertiser.totalPublications} publicações</span>
          </span>
        )}

        {/* Mini Carousel Dots para alternar entre artes do mesmo anunciante */}
        {images.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-[#151413]/90 p-1 backdrop-blur-md border border-white/10 z-10">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveImageIndex(idx);
                }}
                className={`size-2 rounded-full transition-all cursor-pointer ${
                  activeImageIndex === idx ? "bg-[#C4A468] w-4" : "bg-white/40 hover:bg-white/70"
                }`}
                title={`Ver arte ${idx + 1} de ${images.length}`}
              />
            ))}
          </div>
        )}

        {/* Controle de Visibilidade do Administrador Global */}
        {isGlobalAdmin && (
          <button
            type="button"
            onClick={(e) => onToggleVisibility(advertiser, e)}
            disabled={isUpdating}
            className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg border px-2 py-1 font-mono text-[10px] font-semibold backdrop-blur-md transition-transform hover:scale-105 shadow-md cursor-pointer ${
              isVisible
                ? "border-[#768F6E]/40 bg-[#1A261D]/90 text-[#768F6E]"
                : "border-[#C4A468]/40 bg-[#282218]/90 text-[#C4A468]"
            }`}
            title={
              isVisible
                ? "Anunciante VISÍVEL. Clique para ocultar da vitrine pública."
                : "Anunciante OCULTO. Clique para exibir na vitrine pública."
            }
          >
            {isVisible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
            <span>{isUpdating ? "..." : isVisible ? "Visível" : "Oculto"}</span>
          </button>
        )}
      </div>

      {/* Conteúdo e Informações do Anunciante */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-[#FBF9F5] line-clamp-1 group-hover:text-[#C4A468] transition-colors">
              {advertiser.businessName}
            </h3>
          </div>

          {advertiser.summary && (
            <p className="mt-1.5 text-xs text-[#A8A199] line-clamp-2 leading-relaxed">
              {advertiser.summary}
            </p>
          )}

          {/* Produtos e Preços Consolidados de TODAS as publicações */}
          {advertiser.productsList.length > 0 && (
            <div className="mt-3 space-y-1 rounded-xl border border-white/[0.06] bg-[#181716]/80 p-2.5">
              <div className="flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-wider text-[#A8A199] mb-1">
                <span>Catálogo Consolidado:</span>
                <span className="text-[#C4A468] font-bold">{advertiser.productsList.length} itens</span>
              </div>
              {advertiser.productsList.slice(0, 3).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs text-[#FBF9F5] gap-2"
                >
                  <span className="truncate">{item.name}</span>
                  {item.price && (
                    <span className="font-mono text-[11px] font-bold text-[#C4A468] shrink-0">
                      {item.price}
                    </span>
                  )}
                </div>
              ))}
              {advertiser.productsList.length > 3 && (
                <span className="block text-[10px] text-[#78716A] pt-0.5">
                  +{advertiser.productsList.length - 3} outros itens cadastrados
                </span>
              )}
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-2">
          {advertiser.phone ? (
            <a
              href={`https://wa.me/${cleanPhoneForWhatsApp(advertiser.phone)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 px-3 py-2 text-xs font-semibold text-[#25D366] hover:bg-[#25D366]/25 transition-colors cursor-pointer"
            >
              <MessageCircle className="size-3.5" />
              <span>WhatsApp</span>
            </a>
          ) : null}

          <Link
            to="/anuncio/$id"
            params={{ id: advertiser.id }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2C2926]/80 border border-white/[0.08] px-3 py-2 text-xs font-semibold text-[#FBF9F5] hover:text-[#C4A468] hover:border-[#A88C5A]/40 hover:bg-[#2C2926] transition-colors"
          >
            <span>Ver Detalhes</span>
            <ChevronRight className="size-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function StoreLandingPage({ rows, onOpenAnalyzer, onOpenIam, onRefreshData }: StoreLandingPageProps) {
  const { user, isGlobalAdmin, canApproveArts } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"login" | "register">("login");

  // IAM & Submission Modals
  const [isIamModalOpen, setIsIamModalOpen] = useState(false);
  const [iamModalTab, setIamModalTab] = useState<"overview" | "users" | "groups" | "tokens" | "queue">("overview");
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<IamGroup[]>([]);
  const [pendingSubmissionsCount, setPendingSubmissionsCount] = useState(0);

  useEffect(() => {
    listGroups().then(setAvailableGroups);
    listSubmissions("pending").then((subs) => setPendingSubmissionsCount(subs.length));
  }, [isIamModalOpen, isSubmissionModalOpen]);

  // Filtros da Loja
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [pageSize, setPageSize] = useState<number | "all">(6);
  const [currentPage, setCurrentPage] = useState(1);

  // Referência do Grid para medir colunas ativas (Lógica Olivelas)
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [gridCols, setGridCols] = useState<number>(3);

  // Armazena estados de visibilidade modificados localmente para resposta instantânea
  const [visibilityOverrides, setVisibilityOverrides] = useState<Record<string, boolean>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Ordem aleatória estável por sessão
  const [seed, setSeed] = useState<number>(() => Math.random());

  function handleShuffle() {
    setSeed(Math.random());
    setCurrentPage(1);
    toast.info("Vitrine reordenada aleatoriamente!");
  }

  // Mede dinamicamente a quantidade de colunas no grid renderizado
  useEffect(() => {
    function measureColumns() {
      if (!gridRef.current) return;
      const computed = window.getComputedStyle(gridRef.current).gridTemplateColumns;
      if (!computed || computed === "none") return;
      const cols = computed.split(" ").filter((t) => t && t !== "none").length;
      if (cols > 0) {
        setGridCols(cols);
      }
    }

    measureColumns();

    const ro = new ResizeObserver(() => {
      measureColumns();
    });

    if (gridRef.current) {
      ro.observe(gridRef.current);
    }

    window.addEventListener("resize", measureColumns);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureColumns);
    };
  }, []);

  // Agrupamento Inteligente por Anunciante (Join de publicações do mesmo estabelecimento/WhatsApp)
  const groupedAdvertisers = useMemo(() => {
    return groupRowsByAdvertiser(rows as GenericStoreRow[]);
  }, [rows]);

  // Extrai categorias dinâmicas presentes nos anunciantes
  const dynamicCategories = useMemo(() => {
    const cats = new Set<string>();
    groupedAdvertisers.forEach((g) => {
      if (g.category?.trim()) {
        cats.add(g.category.trim());
      }
    });
    return Array.from(cats);
  }, [groupedAdvertisers]);

  // Determina se o anunciante é visível na loja
  function isAdvertiserVisible(advertiser: GroupedAdvertiser): boolean {
    if (visibilityOverrides[advertiser.advertiserKey] !== undefined) {
      return visibilityOverrides[advertiser.advertiserKey];
    }
    if (visibilityOverrides[advertiser.id] !== undefined) {
      return visibilityOverrides[advertiser.id];
    }
    return advertiser.isVisibleInStore;
  }

  // Alterna a visibilidade pelo Administrador Global para todas as publicações do anunciante
  async function toggleAdvertiserVisibility(advertiser: GroupedAdvertiser, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isGlobalAdmin) {
      toast.error("Apenas o Administrador Global pode alterar a visibilidade de produtos.");
      return;
    }

    const currentVis = isAdvertiserVisible(advertiser);
    const newVis = !currentVis;

    setUpdatingId(advertiser.id);
    setVisibilityOverrides((prev) => ({
      ...prev,
      [advertiser.advertiserKey]: newVis,
      [advertiser.id]: newVis,
    }));

    try {
      for (const row of advertiser.rawRows) {
        const currentAnalysis =
          row.analysis && typeof row.analysis === "object"
            ? (row.analysis as Record<string, unknown>)
            : {};

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
      }

      toast.success(
        newVis
          ? `Anunciante "${advertiser.businessName}" tornado VISÍVEL.`
          : `Anunciante "${advertiser.businessName}" OCULTADO da vitrine pública.`
      );
      onRefreshData?.();
    } catch {
      setVisibilityOverrides((prev) => ({
        ...prev,
        [advertiser.advertiserKey]: currentVis,
        [advertiser.id]: currentVis,
      }));
      toast.error("Falha ao atualizar visibilidade no banco de dados.");
    } finally {
      setUpdatingId(null);
    }
  }

  // Exporta todos os anúncios visíveis e analisados no formato puro data/anuncios.json
  function handleExportStaticCatalog() {
    const visibleAdvertisers = groupedAdvertisers.filter(isAdvertiserVisible);

    if (visibleAdvertisers.length === 0) {
      toast.error("Nenhum anúncio visível encontrado para exportação.");
      return;
    }

    const staticCatalog = visibleAdvertisers.map((adv) => {
      const formattedImages = (
        adv.images.length > 0
          ? adv.images
          : adv.primaryImageUrl
          ? [{ id: adv.id, imageUrl: adv.primaryImageUrl, createdAt: adv.latestCreatedAt }]
          : []
      ).map((img) => ({
        id: img.id,
        url: img.imageUrl.includes("/storage/v1/object/sign/images/")
          ? img.imageUrl.replace("/storage/v1/object/sign/images/", "/storage/v1/object/public/images/").split("?")[0]
          : img.imageUrl,
        caption: adv.businessName,
      }));

      const primaryImg =
        formattedImages[0]?.url ||
        (adv.primaryImageUrl
          ? adv.primaryImageUrl.includes("/storage/v1/object/sign/images/")
            ? adv.primaryImageUrl.replace("/storage/v1/object/sign/images/", "/storage/v1/object/public/images/").split("?")[0]
            : adv.primaryImageUrl
          : "");

      return {
        id: adv.id,
        businessName: adv.businessName,
        category: adv.category || "Comércio Geral",
        summary: adv.summary || "",
        phone: adv.cleanPhone || "",
        formattedPhone: adv.formattedPhone || "",
        whatsappMessage:
          adv.whatsappMessage ||
          `Olá! Vi o anúncio da ${adv.businessName} na Vitrine Digital e gostaria de mais informações.`,
        primaryImage: primaryImg,
        images: formattedImages,
        keywords: adv.keywords || [],
        products: adv.productsList.map((p) => ({
          name: p.name,
          price: p.price || "",
          description: p.description || "",
        })),
        address: adv.address || "",
        instagram: adv.instagram || "",
        workingHours: adv.workingHours || "",
      };
    });

    const jsonString = JSON.stringify(staticCatalog, null, 2);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "anuncios.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(
      `Catálogo com ${staticCatalog.length} estabelecimento(s) exportado com sucesso como "anuncios.json"!`
    );
  }

  // Filtragem e busca com normalização NFD sobre os anunciantes agrupados
  const filteredAdvertisers = useMemo(() => {
    return groupedAdvertisers.filter((adv) => {
      // Se não for admin, exibe apenas os visíveis
      if (!isGlobalAdmin && !isAdvertiserVisible(adv)) {
        return false;
      }

      // Filtro de Categoria
      if (selectedCategory !== "all") {
        const catNormalized = normalizeSearchText(adv.category || "");
        if (catNormalized !== normalizeSearchText(selectedCategory)) {
          return false;
        }
      }

      // Filtro de Busca (Nome, Resumo, Produtos, Serviços, Palavras-chave de todas as artes)
      if (searchTerm.trim()) {
        const term = normalizeSearchText(searchTerm.trim());
        const busName = normalizeSearchText(adv.businessName || "");
        const cat = normalizeSearchText(adv.category || "");
        const summary = normalizeSearchText(adv.summary || "");
        const kw = adv.keywords.map((k) => normalizeSearchText(k)).join(" ");
        const prods = adv.productsList.map((p) => `${normalizeSearchText(p.name)} ${normalizeSearchText(p.price || "")}`).join(" ");
        const services = adv.servicesList.map((s) => normalizeSearchText(s.name)).join(" ");

        let rawText = "";
        adv.rawRows.forEach((r) => {
          if (r.analysis && typeof r.analysis === "object") {
            const a = r.analysis as Record<string, unknown>;
            if (typeof a["ocrText"] === "string") rawText += " " + normalizeSearchText(a["ocrText"]);
            if (typeof a["detailedVisualDescription"] === "string") rawText += " " + normalizeSearchText(a["detailedVisualDescription"]);
          }
        });

        const match =
          busName.includes(term) ||
          cat.includes(term) ||
          summary.includes(term) ||
          kw.includes(term) ||
          prods.includes(term) ||
          services.includes(term) ||
          rawText.includes(term);

        if (!match) return false;
      }

      return true;
    });
  }, [groupedAdvertisers, selectedCategory, searchTerm, isGlobalAdmin, visibilityOverrides]);

  // Embaralha aleatoriamente com o seed quando não há termo de busca específico
  const randomizedAdvertisers = useMemo(() => {
    if (searchTerm.trim()) {
      return filteredAdvertisers;
    }
    const arr = [...filteredAdvertisers];
    let currentSeed = seed;
    for (let i = arr.length - 1; i > 0; i--) {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      const rnd = currentSeed / 233280;
      const j = Math.floor(rnd * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [filteredAdvertisers, seed, searchTerm]);

  // Paginação e opções de tamanho estilo Olivelas
  const totalItems = randomizedAdvertisers.length;

  const pageSizeOptions = useMemo(() => {
    const cols = Math.max(1, gridCols);
    const total = totalItems;
    if (total <= 0) return [{ value: "all" as const, label: "Todos" }];

    const step = cols >= 2 ? cols : 2;
    const initial = cols >= 2 ? cols * 2 : 4;

    const opts: number[] = [];
    for (let s = initial; s <= total && opts.length < 4; s += step) {
      opts.push(s);
    }

    if (opts.length === 0) {
      opts.push(initial);
    }

    const result: Array<{ value: number | "all"; label: string }> = opts.map((s) => ({
      value: s,
      label: String(s),
    }));

    result.push({ value: "all", label: "Todos" });
    return result;
  }, [gridCols, totalItems]);

  useEffect(() => {
    if (pageSize === "all") return;
    const available = pageSizeOptions
      .filter((o) => typeof o.value === "number")
      .map((o) => o.value as number);

    if (available.length > 0 && !available.includes(pageSize as number)) {
      setPageSize(available[0]);
    }
  }, [pageSizeOptions, pageSize]);

  const totalPages = pageSize === "all" ? 1 : Math.ceil(totalItems / pageSize) || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm, pageSize]);

  const paginatedAdvertisers = useMemo(() => {
    if (pageSize === "all") return randomizedAdvertisers;
    const start = (currentPage - 1) * pageSize;
    return randomizedAdvertisers.slice(start, start + pageSize);
  }, [randomizedAdvertisers, currentPage, pageSize]);

  return (
    <div className="min-h-screen bg-canvas text-ink antialiased flex flex-col selection:bg-[#A88C5A]/30 selection:text-[#FBF9F5]">
      {/* Navbar Superior Enterprise */}
      <EnterpriseNavbar
        currentView="store"
        onNavigateView={(view) => {
          if (view === "analyzer") onOpenAnalyzer();
          else if (view === "iam") onOpenIam?.("overview");
        }}
        availableGroups={availableGroups}
        pendingSubmissionsCount={pendingSubmissionsCount}
        onOpenSubmitArt={() => {
          if (!user) {
            setAuthDefaultTab("login");
            setIsAuthModalOpen(true);
            toast.info("Acesse sua conta para enviar uma arte para aprovação.");
          } else {
            setIsSubmissionModalOpen(true);
          }
        }}
        onOpenAuthModal={(tab) => {
          setAuthDefaultTab(tab);
          setIsAuthModalOpen(true);
        }}
      />

      {/* Hero Section Editorial Olivelas Style */}
      <section id="topo" className="relative overflow-hidden border-b border-white/[0.08] bg-[#181716]/90 py-14 sm:py-20">
        <div className="relative mx-auto max-w-[1100px] px-4 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#A88C5A]/35 bg-[#A88C5A]/10 px-4 py-1 font-mono text-xs font-semibold text-[#C4A468] mb-6 shadow-sm">
            <Sparkles className="size-3.5 text-[#C4A468]" />
            <span>Catálogo Inteligente de Comércios Locais</span>
          </div>

          <h1 className="font-serif text-3xl font-normal tracking-tight text-[#FBF9F5] sm:text-5xl lg:text-6xl leading-[1.18]">
            Descubra produtos e serviços de{" "}
            <span className="font-serif italic font-semibold text-[#C4A468]">
              empreendedores locais
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-[#A8A199] leading-relaxed">
            Navegue pelos estabelecimentos e comércios locais com catálogo consolidado de produtos e cardápios extraídos por IA. Converse e faça pedidos diretamente pelo WhatsApp.
          </p>

          {/* CTA de Envio para Consumidores / Comerciantes */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  setAuthDefaultTab("login");
                  setIsAuthModalOpen(true);
                  toast.info("Acesse sua conta para enviar sua arte.");
                } else {
                  setIsSubmissionModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#A88C5A] px-6 py-3 text-xs sm:text-sm font-bold text-[#151413] shadow-lg shadow-[#A88C5A]/20 hover:bg-[#967B4A] transition-all cursor-pointer"
            >
              <UploadCloud className="size-4" />
              <span>Enviar Arte / Flyer para Divulgação</span>
            </button>

            {canApproveArts && pendingSubmissionsCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenIam) onOpenIam("queue");
                  else {
                    setIamModalTab("queue");
                    setIsIamModalOpen(true);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-[#C4A468]/40 bg-[#282218]/90 px-4 py-3 text-xs sm:text-sm font-semibold text-[#C4A468] hover:bg-[#A88C5A]/20 transition cursor-pointer"
              >
                <span>Fila de Aprovação ({pendingSubmissionsCount} pendentes)</span>
              </button>
            )}
          </div>

          {/* Tags de Destaque / Atalhos */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-xs text-[#A8A199]">
            <span className="text-[#78716A]">Sugestões rápidas:</span>
            {["Cardápio", "Alimentação", "Hotdog", "Pizza", "Salgados", "Eletrônicos", "Conserto", "Delivery"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchTerm(tag);
                  const vitrineEl = document.getElementById("vitrine");
                  vitrineEl?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-lg border border-white/[0.08] bg-[#201E1C]/80 px-3 py-1 text-xs text-[#A8A199] hover:text-[#FBF9F5] hover:border-[#A88C5A]/40 transition-colors cursor-pointer"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Faixa de Pilares e Benefícios (Olivelas Botanical / Mineral Accents) */}
      <section className="border-b border-white/[0.08] bg-[#181716]/50 py-6">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-[#201E1C]/70">
              <div className="grid size-9 place-items-center rounded-lg bg-[#A88C5A]/15 text-[#C4A468] shrink-0">
                <Sparkles className="size-4.5" />
              </div>
              <div>
                <strong className="block text-xs font-semibold text-[#FBF9F5]">Extração por IA</strong>
                <span className="text-[11px] text-[#A8A199]">OCR e dados estruturados</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-[#201E1C]/70">
              <div className="grid size-9 place-items-center rounded-lg bg-[#25D366]/15 text-[#25D366] shrink-0">
                <MessageCircle className="size-4.5" />
              </div>
              <div>
                <strong className="block text-xs font-semibold text-[#FBF9F5]">Contato Direto</strong>
                <span className="text-[11px] text-[#A8A199]">WhatsApp oficial verificado</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-[#201E1C]/70">
              <div className="grid size-9 place-items-center rounded-lg bg-[#778E93]/15 text-[#778E93] shrink-0">
                <Layers className="size-4.5" />
              </div>
              <div>
                <strong className="block text-xs font-semibold text-[#FBF9F5]">Catálogo Unificado</strong>
                <span className="text-[11px] text-[#A8A199]">Agrupado por anunciante</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.06] bg-[#201E1C]/70">
              <div className="grid size-9 place-items-center rounded-lg bg-[#B28378]/15 text-[#B28378] shrink-0">
                <Wand2 className="size-4.5" />
              </div>
              <div>
                <strong className="block text-xs font-semibold text-[#FBF9F5]">Refazer com IA</strong>
                <span className="text-[11px] text-[#A8A199]">Artes em alta definição</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Principal: A Vitrine de Anunciantes */}
      <section id="vitrine" className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          {/* Cabeçalho da Seção com Barra de Pesquisa e Botão Exibir ao lado */}
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#201E1C]/70 p-5 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#C4A468]">
                Catálogo de Anunciantes
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-normal tracking-wide text-[#FBF9F5] mt-0.5">
                Vitrine de Ofertas & Comércios
              </h2>
              <p className="text-xs sm:text-sm text-[#A8A199] mt-0.5">
                Explore os estabelecimentos locais e consulte seus catálogos unificados.
              </p>
            </div>

            {/* Controles de Busca e Exibir lado a lado na área do Catálogo */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 lg:max-w-2xl flex-1 justify-end">
              {/* Barra de Pesquisa */}
              <div className="relative flex-1 min-w-[220px] flex items-center rounded-xl border border-white/[0.08] bg-[#181716]/90 px-3.5 py-2.5 focus-within:border-[#A88C5A]/60 transition-colors">
                <Search className="mr-2 size-4 text-[#78716A] shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar anunciante, produto, preço..."
                  className="w-full bg-transparent text-xs sm:text-sm text-[#FBF9F5] placeholder:text-[#78716A] focus:outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="ml-1 text-[#A8A199] hover:text-[#FBF9F5] cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Botão de Exibir dinâmico estilo Olivelas */}
              <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0 rounded-xl border border-white/[0.08] bg-[#181716]/90 p-1 px-3 text-xs">
                <span className="text-xs text-[#A8A199] font-medium">Exibir:</span>
                <div className="flex items-center gap-1">
                  {pageSizeOptions.map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setPageSize(opt.value)}
                      className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer text-xs ${
                        pageSize === opt.value
                          ? "bg-[#A88C5A] text-[#151413] font-bold shadow-sm"
                          : "text-[#A8A199] hover:text-[#FBF9F5]"
                      }`}
                      title={`Exibir ${opt.label} anunciantes por página`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botão Embaralhar */}
              <button
                type="button"
                onClick={handleShuffle}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#2C2926]/80 px-3.5 py-2.5 text-xs font-medium text-[#A8A199] hover:text-[#FBF9F5] hover:border-[#A88C5A]/40 transition-colors cursor-pointer shrink-0"
                title="Embaralhar ordem dos anunciantes na vitrine"
              >
                <Shuffle className="size-3.5" />
                <span className="hidden sm:inline">Embaralhar</span>
              </button>

              {/* Botão Exportar Catálogo Estático */}
              <button
                type="button"
                onClick={handleExportStaticCatalog}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#A88C5A]/30 bg-[#A88C5A]/15 px-3.5 py-2.5 text-xs font-semibold text-[#C4A468] hover:bg-[#A88C5A]/25 hover:border-[#A88C5A]/60 transition-colors cursor-pointer shrink-0 shadow-sm"
                title="Baixar dados atuais em JSON para a versão estática (/static/data/anuncios.json)"
              >
                <Download className="size-3.5" />
                <span>Exportar Estático</span>
              </button>
            </div>
          </div>

          {/* Layout com Categorias na Lateral Esquerda e Grid na Direita */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Sidebar de Categorias */}
            <aside className="w-full lg:w-64 shrink-0 rounded-2xl border border-white/[0.08] bg-[#201E1C]/70 p-4 backdrop-blur-xl lg:sticky lg:top-20">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#C4A468] flex items-center gap-2">
                  <Tag className="size-3.5" />
                  <span>Categorias</span>
                </h3>
                <span className="font-mono text-[11px] text-[#78716A]">
                  {dynamicCategories.length + 1} opções
                </span>
              </div>

              {/* Versão Mobile: Dropdown <select> */}
              <div className="block lg:hidden">
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-white/[0.08] bg-[#181716] px-4 py-3 pr-10 text-sm font-medium text-[#FBF9F5] focus:border-[#A88C5A] focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#181716]">Todos os Anunciantes ({groupedAdvertisers.length})</option>
                    {dynamicCategories.map((cat) => {
                      const count = groupedAdvertisers.filter((g) => g.category?.trim() === cat).length;
                      return (
                        <option key={cat} value={cat} className="bg-[#181716]">
                          {cat} ({count})
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A8A199] text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Versão Desktop: Lista vertical com contadores */}
              <nav className="hidden lg:flex lg:flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`flex items-center justify-between w-full rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all text-left shrink-0 cursor-pointer ${
                    selectedCategory === "all"
                      ? "bg-[#A88C5A] text-[#151413] font-bold shadow-md shadow-[#A88C5A]/15"
                      : "border border-white/[0.04] bg-[#1C1A18]/60 text-[#A8A199] hover:text-[#FBF9F5] hover:bg-[#2C2926]/70"
                  }`}
                >
                  <span>Todos os Anunciantes</span>
                  <span className={`font-mono text-[11px] ${selectedCategory === "all" ? "text-[#151413]/80 font-bold" : "text-[#78716A]"}`}>
                    {groupedAdvertisers.length}
                  </span>
                </button>

                {dynamicCategories.map((cat) => {
                  const count = groupedAdvertisers.filter((g) => g.category?.trim() === cat).length;
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center justify-between w-full rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all text-left shrink-0 cursor-pointer ${
                        isSelected
                          ? "bg-[#A88C5A] text-[#151413] font-bold shadow-md shadow-[#A88C5A]/15"
                          : "border border-white/[0.04] bg-[#1C1A18]/60 text-[#A8A199] hover:text-[#FBF9F5] hover:bg-[#2C2926]/70"
                      }`}
                    >
                      <span className="truncate pr-2">{cat}</span>
                      <span className={`font-mono text-[11px] ${isSelected ? "text-[#151413]/80 font-bold" : "text-[#78716A]"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* Informações da Busca e Limpar Filtros */}
              <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-white/[0.06] text-xs text-[#A8A199]">
                <div className="flex justify-between items-center text-[#78716A]">
                  <span>Encontrados:</span>
                  <strong className="font-mono text-[#C4A468]">{totalItems} anunciante(s)</strong>
                </div>
                {(selectedCategory !== "all" || searchTerm) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSearchTerm("");
                    }}
                    className="mt-3 w-full rounded-xl border border-white/[0.08] bg-[#1C1A18]/80 py-2 text-center text-xs font-medium text-[#A8A199] hover:text-[#FBF9F5] hover:border-[#A88C5A]/40 transition-colors cursor-pointer"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            </aside>

            {/* Coluna Principal: Grid de Cards dos Anunciantes e Paginação */}
            <main className="flex-1 min-w-0 w-full">
              {totalItems === 0 ? (
                <div className="rounded-2xl border border-white/[0.08] bg-[#201E1C]/70 p-12 text-center my-4">
                  <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-[#181716] text-[#A8A199] border border-white/[0.06]">
                    <Search className="size-6" />
                  </div>
                  <h3 className="font-serif text-lg font-normal text-[#FBF9F5]">Nenhum anunciante encontrado</h3>
                  <p className="mt-1 text-xs text-[#A8A199] max-w-md mx-auto">
                    Não encontramos estabelecimentos correspondentes aos filtros aplicados. Tente limpar a busca ou mudar a categoria.
                  </p>
                  {(searchTerm || selectedCategory !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("all");
                      }}
                      className="mt-4 rounded-xl bg-[#A88C5A]/15 border border-[#A88C5A]/40 px-4 py-2 text-xs font-semibold text-[#C4A468] hover:bg-[#A88C5A]/25 transition-colors cursor-pointer"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>
              ) : (
                <div
                  ref={gridRef}
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
                >
                  {paginatedAdvertisers.map((advertiser) => (
                    <AdvertiserCard
                      key={advertiser.advertiserKey || advertiser.id}
                      advertiser={advertiser}
                      isGlobalAdmin={isGlobalAdmin}
                      isVisible={isAdvertiserVisible(advertiser)}
                      isUpdating={updatingId === advertiser.id}
                      onToggleVisibility={toggleAdvertiserVisibility}
                    />
                  ))}
                </div>
              )}

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#201E1C]/70 p-4">
                  <div className="text-xs text-[#A8A199]">
                    Mostrando{" "}
                    <strong className="text-[#FBF9F5]">
                      {pageSize === "all"
                        ? `1 - ${totalItems}`
                        : `${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, totalItems)}`}
                    </strong>{" "}
                    de <strong className="text-[#C4A468]">{totalItems}</strong> anunciantes
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#1C1A18]/80 px-3 py-1.5 text-xs font-medium text-[#A8A199] hover:text-[#FBF9F5] disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="size-3.5" />
                      <span>Anterior</span>
                    </button>

                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const page = idx + 1;
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`size-8 rounded-xl font-mono text-xs font-semibold transition-colors cursor-pointer ${
                              currentPage === page
                                ? "bg-[#A88C5A] text-[#151413] shadow-md shadow-[#A88C5A]/15 font-bold"
                                : "border border-white/[0.08] bg-[#1C1A18]/80 text-[#A8A199] hover:text-[#FBF9F5] hover:bg-[#2C2926]"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-1 text-xs text-[#78716A] font-mono">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="inline-flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#1C1A18]/80 px-3 py-1.5 text-xs font-medium text-[#A8A199] hover:text-[#FBF9F5] disabled:opacity-30 cursor-pointer"
                    >
                      <span>Próxima</span>
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </section>

      {/* Footer Editorial Olivelas */}
      <footer className="border-t border-white/[0.08] bg-[#121110] py-10 text-xs text-[#78716A]">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#C4A468] font-serif text-base">✦</span>
            <strong className="font-serif tracking-[0.14em] uppercase text-[#FBF9F5]">Vitrine Digital</strong>
            <span>— Catálogo de Ofertas & Comércios Locais</span>
          </div>

          <div className="flex items-center gap-4 text-[#A8A199]">
            <button
              type="button"
              onClick={onOpenAnalyzer}
              className="hover:text-[#C4A468] transition-colors cursor-pointer"
            >
              Área do Analisador
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                setAuthDefaultTab("login");
                setIsAuthModalOpen(true);
              }}
              className="hover:text-[#C4A468] transition-colors cursor-pointer"
            >
              Acesso Restrito
            </button>
          </div>
        </div>
      </footer>

      {/* Modal de Autenticação */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authDefaultTab}
      />

      {/* Modal de Gestão IAM & HBAC (Admin Global / Analista) */}
      <IamManagementModal
        isOpen={isIamModalOpen}
        onClose={() => {
          setIsIamModalOpen(false);
          listSubmissions("pending").then((subs) => setPendingSubmissionsCount(subs.length));
        }}
        initialTab={iamModalTab}
      />

      {/* Modal de Submissão de Arte (Consumidores) */}
      <ConsumerSubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        groups={availableGroups}
        onSuccess={() => {
          listSubmissions("pending").then((subs) => setPendingSubmissionsCount(subs.length));
        }}
      />
    </div>
  );
}

