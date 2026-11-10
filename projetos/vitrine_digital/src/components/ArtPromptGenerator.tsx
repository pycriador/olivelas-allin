import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Cpu,
  Globe,
  RefreshCw,
  Copy,
  Check,
  X,
  Search,
  SlidersHorizontal,
  Download,
  ExternalLink,
  Layers,
  Building2,
  Wand2,
} from "lucide-react";
import {
  ART_DIRECTIVES,
  DIRECTIVE_CATEGORIES,
  DEFAULT_ACTIVE_DIRECTIVE_IDS,
  buildArtPrompt,
  type DirectiveCategory,
} from "@/lib/art-prompt";
import { generateArtImageDirect, listGeminiModels, LOVABLE_IMAGE_MODELS } from "@/lib/analysis.functions";
import { listGroups } from "@/lib/iam-service";
import type { IamGroup } from "@/lib/iam-types";

const STORAGE_KEY = "art_prompt_options";
const DEFAULT_IMAGE_MODELS = [
  { id: "imagen-3.0-generate-002", name: "Imagen 3 (Fast / Alta Definição)", description: "Modelo oficial Google Imagen 3 de alta velocidade e qualidade" },
  { id: "imagen-3.0-generate-001", name: "Imagen 3 (Versão Estável 001)", description: "Versão estável Imagen 3" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Multimodal de nova geração" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Velocidade ultrarrápida" },
  { id: "imagegeneration@006", name: "Imagen 2 (imagegeneration@006)", description: "Versão legado Google Imagen" },
];

interface ArtPromptGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: Record<string, unknown> | null | undefined;
  imageUrl?: string | null;
  title?: string | null;
  artId?: string | null;
  onArtUpdated?: (newImageUrl: string) => void;
}

export function ArtPromptGenerator({
  isOpen,
  onClose,
  analysis,
  imageUrl,
  title,
  artId,
  onArtUpdated,
}: ArtPromptGeneratorProps) {
  const generateImageFn = useServerFn(generateArtImageDirect);
  const getModels = useServerFn(listGeminiModels);

  const [aiProvider, setAiProvider] = useState<"lovable" | "gemini">("lovable");
  const [selectedLovableModel, setSelectedLovableModel] = useState<string>("dall-e-3");
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_ACTIVE_DIRECTIVE_IDS);
  const [activeTab, setActiveTab] = useState<DirectiveCategory | "all">("all");
  const [lang, setLang] = useState<"pt" | "en">("pt");
  const [groups, setGroups] = useState<IamGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("imagen-3.0-generate-002");
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string; description?: string }>>(DEFAULT_IMAGE_MODELS);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedImagePath, setGeneratedImagePath] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string>("");

  // Carrega preferências salvas do localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedIds(parsed);
        }
      }
    } catch {
      // Usa o padrão se houver erro de parse
    }
  }, []);

  // Salva no localStorage a cada alteração
  function updateSelection(newIds: string[]) {
    setSelectedIds(newIds);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
    } catch {
      // Ignora falha de armazenamento local
    }
  }

  function toggleDirective(id: string) {
    const directive = ART_DIRECTIVES.find((d) => d.id === id);
    if (!directive) return;

    // Se for da categoria de formato (proporção), permite apenas 1 formato ativo por vez
    if (directive.category === "format") {
      const formatIds = ART_DIRECTIVES.filter((d) => d.category === "format").map((d) => d.id);
      const filtered = selectedIds.filter((dId) => !formatIds.includes(dId));
      if (!selectedIds.includes(id)) {
        updateSelection([...filtered, id]);
      } else {
        updateSelection(filtered);
      }
      return;
    }

    if (selectedIds.includes(id)) {
      updateSelection(selectedIds.filter((dId) => dId !== id));
    } else {
      updateSelection([...selectedIds, id]);
    }
  }

  function handleSelectAll() {
    // Mantém o primeiro formato e seleciona todos os outros
    const formatIds = ART_DIRECTIVES.filter((d) => d.category === "format").map((d) => d.id);
    const activeFormat = selectedIds.find((id) => formatIds.includes(id)) || "format_story_9_16";
    const nonFormatIds = ART_DIRECTIVES.filter((d) => d.category !== "format").map((d) => d.id);
    updateSelection([activeFormat, ...nonFormatIds]);
    toast.success("Todas as diretrizes foram ativadas.");
  }

  function handleDeselectAll() {
    updateSelection([]);
    toast.info("Todas as opções foram desmarcadas.");
  }

  function handleRestoreDefaults() {
    updateSelection(DEFAULT_ACTIVE_DIRECTIVE_IDS);
    toast.success("Diretrizes restauradas para o padrão recomendado.");
  }

  // Carrega grupos cadastrados para seleção de chave de API
  useEffect(() => {
    if (!isOpen) return;
    listGroups().then((loaded) => {
      setGroups(loaded);
      if (loaded.length > 0) {
        setSelectedGroupId((prev) => {
          if (prev) {
            const exists = loaded.some((g) => g.id === prev);
            if (exists) return prev;
          }
          // Pré-seleciona prioritariamente o grupo que tiver chave Gemini configurada
          const withKey = loaded.find((g) => g.gemini_api_key && g.gemini_api_key.trim().length > 0);
          return withKey ? withKey.id : loaded[0].id;
        });
      }
    });
  }, [isOpen]);

  // Atualiza/busca modelos disponíveis da chave Gemini quando o grupo é alterado
  async function loadGroupModels(grpId: string) {
    const targetGroup = groups.find((g) => g.id === grpId);
    if (!targetGroup?.gemini_api_key) {
      setAvailableModels(DEFAULT_IMAGE_MODELS);
      return;
    }
    setIsLoadingModels(true);
    try {
      const res = await getModels({ data: { apiKey: targetGroup.gemini_api_key, filter: "all" } });
      if (res.ok && res.models && res.models.length > 0) {
        // Junta modelos retornados da API com os de imagem conhecidos
        const modelMap = new Map<string, { id: string; name: string; description?: string }>();
        DEFAULT_IMAGE_MODELS.forEach((m) => modelMap.set(m.id, m));
        res.models.forEach((m) => {
          modelMap.set(m.id, {
            id: m.id,
            name: m.name || m.id,
            description: m.description || "",
          });
        });
        const combined = Array.from(modelMap.values());
        setAvailableModels(combined);
        toast.success(`${combined.length} modelos Gemini carregados da API!`);
      }
    } catch {
      // Mantém lista padrão caso a consulta falhe
      setAvailableModels(DEFAULT_IMAGE_MODELS);
    } finally {
      setIsLoadingModels(false);
    }
  }

  useEffect(() => {
    if (selectedGroupId && isOpen && groups.length > 0) {
      loadGroupModels(selectedGroupId);
    }
  }, [selectedGroupId, isOpen, groups.length]);

  const activeRatio = useMemo(() => {
    if (selectedIds.includes("format_story_9_16")) return "9:16";
    if (selectedIds.includes("format_banner_16_9")) return "16:9";
    if (selectedIds.includes("format_feed_4_5")) return "4:5";
    return "1:1";
  }, [selectedIds]);

  const [searchTerm, setSearchTerm] = useState("");

  const generatedPrompt = useMemo(() => {
    return buildArtPrompt(analysis, selectedIds, lang);
  }, [analysis, selectedIds, lang]);

  function copyPrompt() {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    toast.success(
      lang === "pt"
        ? "Prompt copiado! Cole no Midjourney, ChatGPT ou gerador de imagem."
        : "Prompt copied! Ready to paste into Midjourney, Flux or DALL-E."
    );
  }

  async function handleGenerateDirectImage() {
    if (!generatedPrompt) {
      toast.error("O prompt está vazio.");
      return;
    }

    const currentModelName = aiProvider === "lovable" ? selectedLovableModel : selectedModel;
    setIsGeneratingImage(true);
    setGenerationStep(`Iniciando geração com ${currentModelName}...`);
    const toastId = toast.loading(`Gerando imagem publicitária (${aiProvider === "lovable" ? "Lovable AI: " : "Gemini: "}${currentModelName})...`);

    try {
      setGenerationStep("Processando prompt e diretrizes visuais...");
      const targetGroup = groups.find((g) => g.id === selectedGroupId);
      const res = await generateImageFn({
        data: {
          prompt: generatedPrompt,
          provider: aiProvider,
          groupId: selectedGroupId || undefined,
          geminiApiKey: aiProvider === "gemini" ? (targetGroup?.gemini_api_key?.trim() || undefined) : undefined,
          geminiModel: currentModelName || undefined,
          aspectRatio: activeRatio,
          targetArtId: artId || undefined,
          referenceImageUrl: imageUrl || undefined,
        },
      });

      if (!res.ok) {
        throw new Error((res as { message?: string }).message || "Falha ao gerar imagem.");
      }

      setGeneratedImageUrl(res.imageUrl);
      setGeneratedImagePath(res.imagePath);
      setUsedModel(res.modelUsed || currentModelName || "dall-e-3");
      toast.success("Imagem publicitária gerada com sucesso e salva no servidor!", { id: toastId });

      if (onArtUpdated) {
        onArtUpdated(res.imageUrl);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido ao gerar imagem.";
      toast.error(`Falha na geração: ${msg}`, { id: toastId });
    } finally {
      setIsGeneratingImage(false);
      setGenerationStep("");
    }
  }

  function handleDownloadGeneratedImage() {
    if (!generatedImageUrl) return;
    const a = document.createElement("a");
    a.href = generatedImageUrl;
    a.target = "_blank";
    a.download = `arte-ia-${title ? title.toLowerCase().replace(/\s+/g, "-") : "gerada"}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Download da imagem iniciado!");
  }

  function handleCopyImageUrl() {
    if (!generatedImageUrl) return;
    navigator.clipboard.writeText(generatedImageUrl);
    toast.success("Link da imagem copiado para a área de transferência!");
  }

  if (!isOpen) return null;

  const filteredDirectives = ART_DIRECTIVES.filter((d) => {
    if (activeTab !== "all" && d.category !== activeTab) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        d.label.toLowerCase().includes(term) ||
        d.description.toLowerCase().includes(term) ||
        d.promptPt.toLowerCase().includes(term) ||
        d.promptEn.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const activeCount = selectedIds.length;
  const totalCount = ART_DIRECTIVES.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative flex flex-col w-full max-w-[1240px] max-h-[95vh] rounded-2xl border border-white/[0.08] bg-[#090d16] shadow-2xl overflow-hidden min-h-[500px]">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3.5 sm:px-6 sm:py-4 bg-slate-900/40">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="grid size-10 place-items-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
              <Wand2 className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white sm:text-lg truncate">
                  Estúdio Criativo de Artes com IA
                </h2>
                <span className="rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-blue-400">
                  Prompt Master
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {title ? `Dados estruturados de: ${title}` : "Gere prompts otimizados para Midjourney, Flux.1, DALL-E 3 e redes sociais."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg border border-white/[0.08] bg-slate-900/60 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Corpo com Split: Opções à Esquerda e Prompt à Direita */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden min-h-0">
          {/* Coluna de Opções & Checkboxes (7 Colunas no Desktop) */}
          <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-white/[0.08] overflow-y-auto p-4 sm:p-6 min-w-0">
            {/* Título da Seção & Ações de Seleção Rápida */}
            <div className="flex flex-col gap-3 pb-3.5 border-b border-white/[0.06]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                      Diretrizes de Produção
                    </span>
                    <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 font-mono text-xs font-semibold text-blue-400">
                      {activeCount} de {totalCount} ativas
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    Personalize parâmetros de estética, tipografia, proporção e anti-clichês publicitários.
                  </p>
                </div>

                {/* Ações de Seleção Rápida */}
                <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-slate-900/60 px-2.5 py-1 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Marcar todas as opções"
                  >
                    <Check className="size-3 text-blue-400" />
                    <span>Todos</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-slate-900/60 px-2.5 py-1 text-xs text-slate-300 hover:text-red-400 transition-colors cursor-pointer"
                    title="Desmarcar todas"
                  >
                    <X className="size-3" />
                    <span>Limpar</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRestoreDefaults}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                    title="Restaurar padrão recomendado"
                  >
                    <RefreshCw className="size-3" />
                    <span>Padrão</span>
                  </button>
                </div>
              </div>

              {/* Barra de Busca e Filtro por Categoria (Dropdown) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1">
                {/* Campo de Busca */}
                <div className="relative flex-1 min-w-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar diretrizes (ex: story, mãos, cores, estúdio, iluminação, texto)..."
                    className="w-full rounded-xl border border-white/[0.08] bg-slate-950/80 py-2 pl-8 pr-8 text-xs text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:outline-none"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown de Categorias ao lado da pesquisa */}
                <div className="relative shrink-0 sm:w-64">
                  <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value as DirectiveCategory | "all")}
                    className="w-full appearance-none rounded-xl border border-white/[0.08] bg-slate-950/80 py-2 pl-3 pr-8 text-xs font-medium text-slate-200 focus:border-blue-500/50 focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-[#090d16]">
                      Todas as Categorias ({ART_DIRECTIVES.length})
                    </option>
                    {DIRECTIVE_CATEGORIES.map((cat) => {
                      const countInCat = ART_DIRECTIVES.filter((d) => d.category === cat.id).length;
                      return (
                        <option key={cat.id} value={cat.id} className="bg-[#090d16]">
                          {cat.name} ({countInCat})
                        </option>
                      );
                    })}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                    ▼
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Checkboxes Categorizadas */}
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 min-h-0 pt-3">
              {filteredDirectives.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Nenhuma diretriz encontrada para "{searchTerm}".
                </div>
              ) : (
                filteredDirectives.map((directive) => {
                  const isChecked = selectedIds.includes(directive.id);
                  const isFormat = directive.category === "format";
                  return (
                    <label
                      key={directive.id}
                      className={`flex items-start gap-3.5 rounded-xl border p-3.5 cursor-pointer transition-all ${
                        isChecked
                          ? "border-blue-500/40 bg-blue-500/[0.06] shadow-sm"
                          : "border-white/[0.04] bg-slate-900/30 hover:border-white/[0.08] hover:bg-slate-900/50"
                      }`}
                    >
                      <input
                        type={isFormat ? "radio" : "checkbox"}
                        name={isFormat ? "art_format" : undefined}
                        checked={isChecked}
                        onChange={() => toggleDirective(directive.id)}
                        className="mt-0.5 size-4 rounded border-white/20 bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs sm:text-sm font-medium ${isChecked ? "text-white font-semibold" : "text-slate-300"}`}>
                            {directive.label}
                          </span>
                          {isFormat && (
                            <span className="rounded bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-blue-400">
                              Proporção
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                          {directive.description}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Coluna do Prompt Gerado & Ações (5 Colunas no Desktop) */}
          <div className="lg:col-span-5 flex flex-col bg-slate-950/60 p-4 sm:p-6 overflow-y-auto min-w-0">
            {/* Seletor de Provedor & Modelo de IA para geração */}
            <div className="mb-3.5 rounded-xl border border-white/[0.08] bg-slate-900/40 p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="size-3.5 text-blue-400" />
                  <span>Provedor de Imagem</span>
                </span>
                <span className="font-mono text-[10px] rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 font-semibold text-blue-400">
                  Proporção: {activeRatio}
                </span>
              </div>

              {/* Botões de Seleção do Provedor */}
              <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-white/[0.08] bg-slate-950/80 p-1 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setAiProvider("lovable")}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    aiProvider === "lovable"
                      ? "bg-blue-600 text-white font-semibold shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Cpu className="size-3.5" />
                  <span>Lovable AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAiProvider("gemini")}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    aiProvider === "gemini"
                      ? "bg-blue-600 text-white font-semibold shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Globe className="size-3.5" />
                  <span>Google Imagen</span>
                </button>
              </div>

              {aiProvider === "lovable" ? (
                <div>
                  <label className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="size-3 text-blue-400" />
                    <span>Modelo Lovable AI Gateway</span>
                  </label>
                  <select
                    value={selectedLovableModel}
                    onChange={(e) => setSelectedLovableModel(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.08] bg-slate-900/90 px-3 py-2 text-xs text-white font-mono focus:border-blue-500 focus:outline-none transition cursor-pointer"
                  >
                    {LOVABLE_IMAGE_MODELS.map((m) => (
                      <option key={m.id} value={m.id} className="bg-[#090d16] text-white font-mono">
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {LOVABLE_IMAGE_MODELS.find((m) => m.id === selectedLovableModel)?.description || "Geração via Lovable AI Gateway."}
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                      <Building2 className="size-3 text-blue-400" />
                      <span>Workspace / Grupo & Chave</span>
                    </label>
                    <select
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="w-full rounded-lg border border-white/[0.08] bg-slate-900/90 px-3 py-2 text-xs text-white font-mono focus:border-blue-500 focus:outline-none transition cursor-pointer"
                    >
                      <option value="" className="bg-[#090d16]">Padrão do Sistema (Chave do Servidor)</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id} className="bg-[#090d16]">
                          {g.name} {g.gemini_api_key ? "(Chave Própria)" : "(Sem chave configurada)"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                        <Cpu className="size-3 text-blue-400" />
                        <span>Modelo Google Imagen</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => selectedGroupId && loadGroupModels(selectedGroupId)}
                        disabled={isLoadingModels || !selectedGroupId}
                        className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        title="Recarregar modelos da chave Google Gemini"
                      >
                        <RefreshCw className={`size-3 ${isLoadingModels ? "animate-spin" : ""}`} />
                        <span>Listar Modelos</span>
                      </button>
                    </div>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full rounded-lg border border-white/[0.08] bg-slate-900/90 px-3 py-2 text-xs text-white font-mono focus:border-blue-500 focus:outline-none transition cursor-pointer"
                    >
                      {availableModels.map((m) => (
                        <option key={m.id} value={m.id} className="bg-[#090d16] text-white font-mono">
                          {m.id} — {m.name || m.id}
                        </option>
                      ))}
                    </select>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="truncate max-w-[280px]">
                        {availableModels.find((m) => m.id === selectedModel)?.description || "Modelo selecionado para processamento."}
                      </span>
                      <span className="font-mono text-blue-400/80 shrink-0 font-medium">
                        {availableModels.length} disponíveis
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Prompt Mestre Otimizado
              </span>

              {/* Alternador de Idioma */}
              <div className="flex items-center rounded-lg border border-white/[0.08] bg-slate-900/60 p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setLang("pt")}
                  className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                    lang === "pt" ? "bg-blue-600 text-white font-semibold shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  PT
                </button>
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                    lang === "en" ? "bg-blue-600 text-white font-semibold shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                  title="Recomendado para Midjourney, Flux e DALL-E"
                >
                  EN (Otimizado)
                </button>
              </div>
            </div>

            {/* Caixa do Prompt */}
            <div className="relative flex-1 min-h-[160px] max-h-[240px] rounded-xl border border-white/[0.08] bg-slate-950/90 p-3.5 font-mono text-xs text-slate-200 overflow-y-auto whitespace-pre-wrap break-words leading-relaxed selection:bg-blue-600 selection:text-white [overflow-wrap:anywhere]">
              {generatedPrompt}
            </div>

            {/* Card de Imagem Gerada com IA */}
            {generatedImageUrl && (
              <div className="mt-3.5 rounded-xl border border-blue-500/30 bg-blue-500/[0.04] p-3.5 backdrop-blur-sm animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                    <Sparkles className="size-3.5" />
                    <span>Arte Gerada ({usedModel})</span>
                  </span>
                  <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                    ✓ Salva na Galeria
                  </span>
                </div>

                <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-slate-950/80 mb-3 max-h-56">
                  <img
                    src={generatedImageUrl}
                    alt="Arte Gerada com IA"
                    className="mx-auto max-h-56 w-full object-contain rounded"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadGeneratedImage}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition cursor-pointer shadow-sm"
                  >
                    <Download className="size-3.5" />
                    <span>Baixar Imagem</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyImageUrl}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <Copy className="size-3.5" />
                    <span>Copiar Link</span>
                  </button>
                </div>
              </div>
            )}

            {/* Ações Inferiores */}
            <div className="mt-3.5 flex flex-col gap-2">
              {/* Botão Principal: Refazer Imagem Direto com IA & Salvar */}
              <button
                type="button"
                disabled={isGeneratingImage || !generatedPrompt}
                onClick={handleGenerateDirectImage}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all active:scale-[0.99] disabled:opacity-40 cursor-pointer"
              >
                {isGeneratingImage ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>{generationStep || "Gerando com IA..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    <span>Gerar Nova Imagem com IA & Salvar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={copyPrompt}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-slate-900/60 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Copy className="size-3.5" />
                <span>Copiar Prompt Mestre</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
