import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Cpu,
  Globe,
  UploadCloud,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  X,
  FileText,
  Layers,
  Eye,
  Trash2,
  Edit3,
  Phone,
  User,
  ExternalLink,
  ChevronRight,
  Image as ImageIcon,
  Info,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  ArrowLeft,
  Building2,
  Tag,
  Copy,
  Check,
  Share2,
  Wand2,
  ShoppingBag,
  MessageCircle,
  Smartphone,
  BookOpen,
  Download,
  Code2,
  ScanText,
  Users,
  Key,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { analyzeImage, listGeminiModels, LOVABLE_VISION_MODELS } from "@/lib/analysis.functions";
import { computeAverageHash } from "@/lib/phash";
import { JsonHighlight } from "@/components/JsonHighlight";
import { ArtPromptGenerator } from "@/components/ArtPromptGenerator";
import { useAuth, GLOBAL_ADMIN_EMAIL } from "@/lib/auth-context";
import { AuthModal } from "@/components/AuthModal";
import { StoreLandingPage, type StoreProductRow } from "@/components/StoreLandingPage";
import { IamManagementModal } from "@/components/iam/IamManagementModal";
import { IamManagementPage, type IamTabKey } from "@/components/iam/IamManagementPage";
import { ConsumerSubmissionModal } from "@/components/iam/ConsumerSubmissionModal";
import { EnterpriseNavbar } from "@/components/EnterpriseNavbar";
import { listGroups, listSubmissions } from "@/lib/iam-service";
import type { IamGroup } from "@/lib/iam-types";
import { getClientPortfolioByPhone } from "@/lib/client-aggregation";
import { ClientServicesPagination } from "@/components/ClientServicesPagination";

export type { IamTabKey };

type SearchParams = {
  view?: "store" | "analyzer" | "iam";
  tab?: IamTabKey;
  page?: number;
  q?: string;
  cat?: string;
  date?: string;
};

const VALID_IAM_TABS: IamTabKey[] = ["overview", "usage", "prompts", "groups", "users", "tokens", "queue"];

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const pageNum = Number(search["page"]);
    const viewVal = typeof search["view"] === "string" ? search["view"] : undefined;
    const tabVal = typeof search["tab"] === "string" ? (search["tab"] as IamTabKey) : undefined;

    let view: "store" | "analyzer" | "iam" = "store";
    let tab: IamTabKey | undefined = undefined;

    if (viewVal === "analyzer") {
      view = "analyzer";
    } else if (viewVal === "iam" || (viewVal && VALID_IAM_TABS.includes(viewVal as IamTabKey))) {
      view = "iam";
      tab = viewVal && VALID_IAM_TABS.includes(viewVal as IamTabKey)
        ? (viewVal as IamTabKey)
        : (tabVal && VALID_IAM_TABS.includes(tabVal) ? tabVal : "overview");
    } else {
      view = "store";
    }

    if (view === "iam" && !tab) {
      tab = tabVal && VALID_IAM_TABS.includes(tabVal) ? tabVal : "overview";
    }

    return {
      view,
      tab,
      page: Number.isInteger(pageNum) && pageNum > 0 ? pageNum : 1,
      q: typeof search["q"] === "string" && search["q"].trim() ? search["q"].trim() : undefined,
      cat: typeof search["cat"] === "string" && search["cat"].trim() ? search["cat"].trim() : undefined,
      date: typeof search["date"] === "string" && search["date"].trim() ? search["date"].trim() : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "WhatsApp Image Analyzer — extração de dados de imagens por IA" },
      {
        name: "description",
        content:
          "Envie qualquer imagem do WhatsApp e a IA extrai empresa, contatos, preços, endereço e texto em JSON estruturado.",
      },
      { property: "og:title", content: "WhatsApp Image Analyzer" },
      {
        property: "og:description",
        content: "Extraia automaticamente todas as informações de uma imagem em JSON estruturado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

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
  searchable_text: string | null;
  keywords: string[] | null;
  confidence: number | null;
  analysis: unknown;
  status: string;
  model_used: string | null;
  error_message: string | null;
};

type Suggestion = {
  label: string;
  type: "Objeto" | "Empresa" | "Categoria" | "Produto" | "Marca" | "Tag";
  count: number;
};

type GeminiModelOption = {
  id: string;
  name: string;
  description: string;
};

const DEFAULT_GEMINI_MODELS: GeminiModelOption[] = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Recomendado - Mais Rápido)", description: "Excelente para OCR e visão multimodal" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (Mais Preciso)", description: "Raciocínio profundo e extração avançada" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Nova geração de alta velocidade" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "Rápido e econômico" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Alta capacidade multimodal" },
];

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function extractAllText(obj: unknown): string[] {
  if (obj == null) return [];
  if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") {
    return [String(obj)];
  }
  if (Array.isArray(obj)) {
    return obj.flatMap(extractAllText);
  }
  if (typeof obj === "object") {
    return Object.values(obj as Record<string, unknown>).flatMap(extractAllText);
  }
  return [];
}

function getRowSearchableText(row: Row): string {
  const parts: string[] = [
    row.business_name ?? "",
    row.category ?? "",
    row.title ?? "",
    row.summary ?? "",
    row.image_type ?? "",
    row.searchable_text ?? "",
    ...(row.keywords ?? []),
  ];

  if (row.analysis) {
    parts.push(...extractAllText(row.analysis));
  }

  return parts.filter(Boolean).join(" ").toLowerCase();
}

function getRowTags(row: Row): Array<{ label: string; type: "object" | "brand" | "product" | "tag" }> {
  const tags: Array<{ label: string; type: "object" | "brand" | "product" | "tag" }> = [];
  const seen = new Set<string>();

  function add(val: unknown, type: "object" | "brand" | "product" | "tag") {
    if (!val) return;
    if (typeof val === "string") {
      const clean = val.trim();
      if (clean && !seen.has(clean.toLowerCase()) && tags.length < 6) {
        seen.add(clean.toLowerCase());
        tags.push({ label: clean, type });
      }
    } else if (Array.isArray(val)) {
      val.forEach((item) => add(item, type));
    } else if (typeof val === "object") {
      const rec = val as Record<string, unknown>;
      if (rec["name"]) add(rec["name"], type);
      else if (rec["title"]) add(rec["title"], type);
      else if (rec["label"]) add(rec["label"], type);
    }
  }

  if (row.analysis && typeof row.analysis === "object") {
    const a = row.analysis as Record<string, unknown>;
    add(a["products"], "product");
    add(a["objectsDetected"], "object");
    add(a["logos"], "brand");
    add(a["brands"], "brand");
  }
  (row.keywords ?? []).forEach((k) => add(k, "tag"));

  return tags;
}

function cleanPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

function Index() {
  const queryClient = useQueryClient();
  const analyze = useServerFn(analyzeImage);
  const getModels = useServerFn(listGeminiModels);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    user,
    iamRole,
    isGlobalAdmin,
    isAnalyst,
    isConsumer,
    canManageIam,
    canApproveArts,
    canUseDirectAi,
    userGroups,
    activeGroup,
    setActiveGroupId,
    signOut,
  } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"login" | "register">("login");

  // IAM e Fila de Moderação Modais
  const [isIamModalOpen, setIsIamModalOpen] = useState(false);
  const [iamModalTab, setIamModalTab] = useState<"overview" | "users" | "groups" | "tokens" | "queue">("overview");
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<IamGroup[]>([]);
  const [pendingSubmissionsCount, setPendingSubmissionsCount] = useState(0);

  useEffect(() => {
    listGroups().then(setAvailableGroups);
    listSubmissions("pending").then((subs) => setPendingSubmissionsCount(subs.length));
  }, [isIamModalOpen, isSubmissionModalOpen]);

  const viewMode = searchParams.view ?? "store";
  const page = searchParams.page ?? 1;
  const search = searchParams.q ?? "";
  const category = searchParams.cat ?? "";
  const date = searchParams.date ?? "";

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [current, setCurrent] = useState<Row | null>(null);
  const [dragging, setDragging] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchInput, setSearchInput] = useState(search);
  const [isArtPromptOpen, setIsArtPromptOpen] = useState(false);
  const [artPromptTargetRow, setArtPromptTargetRow] = useState<Row | null>(null);

  // Sincroniza searchInput se o parâmetro q da URL mudar externamente (ex: clicar em tag ou limpar filtros)
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Atualiza a URL com debounce ao digitar, garantindo que o scroll não seja reiniciado para o topo
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        navigate({
          search: (prev) => ({
            ...prev,
            q: searchInput.trim() ? searchInput.trim() : undefined,
            page: 1,
          }),
          replace: true,
          resetScroll: false,
        });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput, search, navigate]);

  // Estados para Dropdown de Ações e Gerenciamento de Tags Manuais
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [editingTagRowId, setEditingTagRowId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState<string>("");

  useEffect(() => {
    function handleClickOutside() {
      setActiveDropdownId(null);
    }
    if (activeDropdownId) {
      window.addEventListener("click", handleClickOutside);
      return () => window.removeEventListener("click", handleClickOutside);
    }
    return undefined;
  }, [activeDropdownId]);

  function handleOpenAnalyzer() {
    if (user) {
      navigate({
        search: (prev) => ({ ...prev, view: "analyzer" }),
        resetScroll: false,
      });
    } else {
      setAuthDefaultTab("login");
      setIsAuthModalOpen(true);
      toast.info("Acesse ou crie sua conta para entrar no Analisador de Imagens.");
    }
  }

  function handleOpenIam(tab: IamTabKey = "overview") {
    if (!user) {
      setAuthDefaultTab("login");
      setIsAuthModalOpen(true);
      toast.info("Acesse sua conta para entrar no Centro de gerenciamento.");
      return;
    }
    navigate({
      search: (prev) => ({ ...prev, view: "iam", tab }),
      resetScroll: false,
    });
  }

  function handleTabChange(tab: IamTabKey) {
    navigate({
      search: (prev) => ({ ...prev, view: "iam", tab }),
      resetScroll: false,
    });
  }

  function handleBackToStore() {
    navigate({
      search: (prev) => ({ ...prev, view: undefined, tab: undefined }),
      resetScroll: false,
    });
  }

  function handleNavigateView(view: "store" | "analyzer" | "iam") {
    if (view === "store") {
      handleBackToStore();
    } else if (view === "analyzer") {
      handleOpenAnalyzer();
    } else if (view === "iam") {
      handleOpenIam();
    }
  }

  function handleSetSearch(val: string) {
    setSearchInput(val);
    navigate({
      search: (prev) => ({
        ...prev,
        q: val.trim() ? val.trim() : undefined,
        page: 1,
      }),
      replace: true,
      resetScroll: false,
    });
  }

  function handleSetCategory(val: string) {
    navigate({
      search: (prev) => ({
        ...prev,
        cat: val || undefined,
        page: 1,
      }),
      replace: true,
      resetScroll: false,
    });
  }

  function handleSetDate(val: string) {
    navigate({
      search: (prev) => ({
        ...prev,
        date: val || undefined,
        page: 1,
      }),
      replace: true,
      resetScroll: false,
    });
  }

  function handleSetPage(newPage: number) {
    navigate({
      search: (prev) => ({
        ...prev,
        page: newPage > 1 ? newPage : undefined,
      }),
      resetScroll: false,
    });
  }

  function handleClearFilters() {
    setSearchInput("");
    navigate({
      search: (prev) => ({ ...prev, page: 1, q: undefined, cat: undefined, date: undefined }),
      replace: true,
      resetScroll: false,
    });
  }

  // Configuração de Provedor de IA (Olivelas AI Vision nativo ou Google Gemini)
  const [aiProvider, setAiProvider] = useState<"lovable" | "gemini">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("preferred_ai_provider");
      if (saved === "lovable" || saved === "gemini") return saved;
    }
    return "lovable";
  });
  const [lovableModel, setLovableModel] = useState<string>("openai/gpt-6-astra");
  const [groupGeminiModel, setGroupGeminiModel] = useState<string>("gemini-2.5-flash");
  const [groupGeminiModels, setGroupGeminiModels] = useState<GeminiModelOption[]>(DEFAULT_GEMINI_MODELS);
  const [isLoadingGroupModels, setIsLoadingGroupModels] = useState(false);
  const [useGroupConfiguredModel, setUseGroupConfiguredModel] = useState<boolean>(true);

  function handleSetAiProvider(provider: "lovable" | "gemini") {
    setAiProvider(provider);
    try {
      localStorage.setItem("preferred_ai_provider", provider);
    } catch {
      /* ignore */
    }
    toast.info(`Provedor de IA alterado para: ${provider === "lovable" ? "Olivelas AI Vision (Nativo)" : "Google Gemini"}`);
  }

  // Modelo efetivo que será enviado para a análise
  const effectiveModel = useMemo(() => {
    if (aiProvider === "lovable") return lovableModel;
    if (useGroupConfiguredModel && activeGroup?.gemini_model) {
      return activeGroup.gemini_model;
    }
    return groupGeminiModel || activeGroup?.gemini_model || "gemini-2.5-flash";
  }, [aiProvider, lovableModel, useGroupConfiguredModel, activeGroup, groupGeminiModel]);

  // Estados para adicionar/editar contato do remetente
  const [senderPhone, setSenderPhone] = useState("");
  const [senderName, setSenderName] = useState("");
  const [isEditingContact, setIsEditingContact] = useState(false);

  // Estado para modal de exclusão de análise na tela
  const [rowToDelete, setRowToDelete] = useState<Row | null>(null);

  // Carrega e sincroniza os modelos de visão disponíveis na chave do Gemini do grupo ativo
  const loadGroupModels = useCallback(async (group: IamGroup | null, showToast = false) => {
    if (!group?.gemini_api_key?.trim()) {
      setGroupGeminiModels(DEFAULT_GEMINI_MODELS);
      if (group?.gemini_model) {
        setGroupGeminiModel(group.gemini_model);
      }
      if (showToast) {
        toast.warning(`O grupo "${group?.name || 'selecionado'}" não possui chave Gemini configurada. Usando lista padrão.`);
      }
      return;
    }

    setIsLoadingGroupModels(true);
    try {
      const res = await getModels({ data: { apiKey: group.gemini_api_key.trim(), filter: "vision" } });
      if (res.ok && res.models && res.models.length > 0) {
        setGroupGeminiModels(res.models);
        const preferredModel = group.gemini_model || "gemini-2.5-flash";
        const hasModel = res.models.some((m) => m.id === preferredModel);
        setGroupGeminiModel(hasModel ? preferredModel : res.models[0]?.id || preferredModel);
        if (showToast) {
          toast.success(`${res.models.length} modelos Gemini sincronizados da chave do grupo "${group.name}".`);
        }
      } else {
        setGroupGeminiModels(DEFAULT_GEMINI_MODELS);
        if (group.gemini_model) setGroupGeminiModel(group.gemini_model);
        if (showToast) {
          toast.info("Nenhum modelo específico retornado; usando lista padrão.");
        }
      }
    } catch {
      setGroupGeminiModels(DEFAULT_GEMINI_MODELS);
      if (group?.gemini_model) setGroupGeminiModel(group.gemini_model);
      if (showToast) {
        toast.error("Erro ao sincronizar modelos com a API do Gemini.");
      }
    } finally {
      setIsLoadingGroupModels(false);
    }
  }, [getModels]);

  useEffect(() => {
    loadGroupModels(activeGroup);
  }, [activeGroup, loadGroupModels]);

  // Intercepta imagens/textos recebidos via Web Share Target API (PWA)
  useEffect(() => {
    async function checkSharedMedia() {
      if (typeof window === "undefined" || !("indexedDB" in window)) return;
      try {
        const DB_NAME = "wpp_share_target_db";
        const STORE_NAME = "shared_items";
        const request = indexedDB.open(DB_NAME, 1);
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) return;
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);
          const getReq = store.get("latest");
          getReq.onsuccess = () => {
            const data = getReq.result;
            if (data && data.image) {
              store.delete("latest");
              const sharedFile = new File([data.image], "whatsapp-imagem.jpg", {
                type: data.image.type || "image/jpeg",
              });
              setFile(sharedFile);
              setPreviewUrl(URL.createObjectURL(sharedFile));
              setCurrent(null);

              if (data.text) {
                toast.info(`Legenda do WhatsApp recebida: "${data.text.slice(0, 50)}..."`);
                const phoneMatch = data.text.match(/(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4}[-\s]?\d{4}/);
                if (phoneMatch) {
                  setSenderPhone(phoneMatch[0]);
                }
              }
              toast.success("Imagem compartilhada do WhatsApp carregada!");
            }
          };
        };
      } catch (err) {
        console.warn("Verificação de compartilhamento falhou:", err);
      }
    }
    checkSharedMedia();
  }, []);

  // Fecha o dropdown de autocomplete ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const history = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("image_analysis")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as Row[];
    },
  });

  const categories = useMemo(() => {
    const set = new Set<string>();
    (history.data ?? []).forEach((r) => r.category && set.add(r.category));
    return [...set].sort();
  }, [history.data]);

  const allSuggestions = useMemo(() => {
    const map = new Map<string, { label: string; type: Suggestion["type"]; count: number }>();

    function add(val: unknown, type: Suggestion["type"]) {
      if (!val) return;
      if (typeof val === "string") {
        const clean = val.trim();
        if (clean.length < 2 || clean.length > 50) return;
        const key = `${type}:${clean.toLowerCase()}`;
        const existing = map.get(key);
        if (existing) {
          existing.count++;
        } else {
          map.set(key, { label: clean, type, count: 1 });
        }
      } else if (Array.isArray(val)) {
        val.forEach((item) => add(item, type));
      } else if (typeof val === "object") {
        const rec = val as Record<string, unknown>;
        if (rec["name"]) add(rec["name"], type);
        else if (rec["label"]) add(rec["label"], type);
        else if (rec["description"]) add(rec["description"], type);
        else if (rec["keyword"]) add(rec["keyword"], type);
      }
    }

    (history.data ?? []).forEach((row) => {
      add(row.business_name, "Empresa");
      add(row.category, "Categoria");
      (row.keywords ?? []).forEach((k) => add(k, "Tag"));

      if (row.analysis && typeof row.analysis === "object") {
        const a = row.analysis as Record<string, unknown>;
        add(a["products"], "Produto");
        add(a["services"], "Produto");
        add(a["objectsDetected"], "Objeto");
        add(a["animalsDetected"], "Objeto");
        add(a["logos"], "Marca");
        add(a["brands"], "Marca");
        if (a["business"] && typeof a["business"] === "object") {
          const b = a["business"] as Record<string, unknown>;
          add(b["name"], "Empresa");
          add(b["category"], "Categoria");
          add(b["subcategory"], "Categoria");
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [history.data]);

  const matchingSuggestions = useMemo(() => {
    const term = (searchInput ?? search).trim().toLowerCase();
    if (!term) {
      return allSuggestions.slice(0, 8);
    }
    return allSuggestions
      .filter((s) => s.label.toLowerCase().includes(term))
      .slice(0, 10);
  }, [allSuggestions, searchInput, search]);

  const filtered = useMemo(() => {
    const term = (searchInput ?? search).trim().toLowerCase();
    return (history.data ?? []).filter((r) => {
      if (category && r.category !== category) return false;
      if (date) {
        const isoDate = r.created_at.slice(0, 10);
        const localDate = new Date(r.created_at).toLocaleDateString("en-CA");
        if (isoDate !== date && localDate !== date) return false;
      }
      if (!term) return true;
      const haystack = getRowSearchableText(r);
      const words = term.split(/\s+/).filter(Boolean);
      return words.every((word) => haystack.includes(word));
    });
  }, [history.data, searchInput, search, category, date]);

  const PAGE_SIZE = 5;
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filtered, currentPage]);

  const pageNumbers = useMemo(() => {
    const delta = 1;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l !== undefined) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  }, [totalPages, currentPage]);

  function pickFile(f: File | undefined | null) {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      toast.error("Formato não suportado. Use jpg, jpeg, png ou webp.");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setCurrent(null);
  }

  const run = useMutation({
    mutationFn: async (selected: File) => {
      const ext = selected.name.split(".").pop() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const upload = await supabase.storage.from("images").upload(path, selected, {
        contentType: selected.type,
      });
      if (upload.error) throw new Error(upload.error.message);

      const signed = await supabase.storage.from("images").createSignedUrl(path, 60 * 60 * 24 * 7);
      const phash = await computeAverageHash(selected);

      const inserted = await supabase
        .from("image_analysis")
        .insert({
          image_path: path,
          image_url: signed.data?.signedUrl ?? null,
          status: "pending",
          phash,
        })
        .select()
        .single();
      if (inserted.error) throw new Error(inserted.error.message);

      const result = await analyze({
        data: {
          id: inserted.data.id,
          path,
          provider: aiProvider,
          groupId: activeGroup?.id || undefined,
          groupApiKey: activeGroup?.gemini_api_key || undefined,
          geminiApiKey: activeGroup?.gemini_api_key || undefined,
          geminiModel: effectiveModel,
        },
      });
      if (!result.ok) throw new Error(result.message);
      return result.row as unknown as Row;
    },
    onSuccess: (row) => {
      setCurrent(row);
      queryClient.invalidateQueries({ queryKey: ["history"] });
      toast.success("Análise concluída.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const reprocess = useMutation({
    mutationFn: async (row: Row) => {
      if (!row.image_path) throw new Error("Imagem original indisponível.");
      const result = await analyze({
        data: {
          id: row.id,
          path: row.image_path,
          provider: aiProvider,
          groupId: activeGroup?.id || undefined,
          groupApiKey: activeGroup?.gemini_api_key || undefined,
          geminiApiKey: activeGroup?.gemini_api_key || undefined,
          geminiModel: effectiveModel,
        },
      });
      if (!result.ok) throw new Error(result.message);
      return result.row as unknown as Row;
    },
    onSuccess: (row) => {
      setCurrent(row);
      setPreviewUrl(row.image_url);
      queryClient.invalidateQueries({ queryKey: ["history"] });
      toast.success("Imagem reprocessada com sucesso.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: async (row: Row) => {
      if (row.image_path) await supabase.storage.from("images").remove([row.image_path]);
      const { error } = await supabase.from("image_analysis").delete().eq("id", row.id);
      if (error) throw new Error(error.message);
      return row.id;
    },
    onSuccess: (id) => {
      if (current?.id === id) setCurrent(null);
      queryClient.invalidateQueries({ queryKey: ["history"] });
      toast.success("Análise excluída.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveContact = useMutation({
    mutationFn: async ({ id, phone, name }: { id: string; phone: string; name?: string }) => {
      if (!current?.analysis || typeof current.analysis !== "object") {
        throw new Error("Análise inválida.");
      }
      const existing = JSON.parse(JSON.stringify(current.analysis)) as Record<string, unknown>;
      const contacts = (existing["contacts"] as Record<string, unknown>) || {};
      const phones = Array.isArray(contacts["phones"]) ? [...contacts["phones"]] : [];
      if (phone && !phones.includes(phone)) {
        phones.unshift(phone);
      }
      contacts["phones"] = phones;
      if (phone) contacts["whatsapp"] = phone;
      if (name) contacts["senderName"] = name;
      existing["contacts"] = contacts;

      const searchable = [
        current.title,
        current.summary,
        current.business_name,
        name,
        phone,
        current.category,
        (current.keywords ?? []).join(" "),
      ]
        .filter(Boolean)
        .join(" \n ");

      const { data: updated, error } = await supabase
        .from("image_analysis")
        .update({
          analysis: existing as never,
          searchable_text: searchable,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return updated as unknown as Row;
    },
    onSuccess: (updatedRow) => {
      setCurrent(updatedRow);
      setIsEditingContact(false);
      setSenderPhone("");
      setSenderName("");
      queryClient.invalidateQueries({ queryKey: ["history"] });
      toast.success("Contato vinculado com sucesso!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateRowKeywords = useMutation({
    mutationFn: async ({ id, keywords }: { id: string; keywords: string[] }) => {
      const { error } = await supabase
        .from("image_analysis")
        .update({ keywords })
        .eq("id", id);
      if (error) throw new Error(error.message);
      return { id, keywords };
    },
    onSuccess: ({ id, keywords }) => {
      queryClient.setQueryData<Row[]>(["history"], (old) => {
        if (!old) return [];
        return old.map((r) => (r.id === id ? { ...r, keywords } : r));
      });
      if (current?.id === id) {
        setCurrent((prev) => (prev ? { ...prev, keywords } : null));
      }
      toast.success("Tags atualizadas com sucesso.");
    },
    onError: (err: Error) => toast.error(`Erro ao atualizar tags: ${err.message}`),
  });

  async function selecionarContatoDaAgenda() {
    if (typeof navigator !== "undefined" && "contacts" in navigator && "ContactsManager" in window) {
      try {
        const props = ["name", "tel"];
        // @ts-expect-error - Contact Picker API
        const selected = await navigator.contacts.select(props, { multiple: false });
        if (selected && selected.length > 0) {
          const c = selected[0];
          const tel = Array.isArray(c.tel) ? c.tel[0] : c.tel;
          const name = Array.isArray(c.name) ? c.name[0] : c.name;
          if (tel) setSenderPhone(tel);
          if (name) setSenderName(name);
          toast.success(`Contato selecionado: ${name || tel}`);
        }
      } catch (err) {
        console.warn("Contact picker cancelado:", err);
      }
    } else {
      toast.info("A seleção direta da agenda está disponível no navegador Chrome no Android.");
    }
  }

  const busy = run.isPending || reprocess.isPending;
  const confidence = Number(current?.confidence ?? 0);

  const currentProducts = useMemo(() => {
    if (!current?.analysis || typeof current.analysis !== "object") return [];
    const a = current.analysis as Record<string, unknown>;
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
  }, [current?.analysis]);

  const currentContacts = useMemo(() => {
    if (!current?.analysis || typeof current.analysis !== "object") return null;
    const a = current.analysis as Record<string, unknown>;
    const c = a["contacts"] as Record<string, unknown> | undefined;
    if (!c) return null;
    const phones = Array.isArray(c["phones"]) ? (c["phones"] as string[]) : [];
    const whatsapp = typeof c["whatsapp"] === "string" ? c["whatsapp"] : "";
    const emails = Array.isArray(c["emails"]) ? (c["emails"] as string[]) : [];
    const instagram = typeof c["instagram"] === "string" ? c["instagram"] : "";
    const senderName = typeof c["senderName"] === "string" ? c["senderName"] : "";
    const hasAny = Boolean(phones.length > 0 || whatsapp || emails.length > 0 || instagram || senderName);
    return { phones, whatsapp, emails, instagram, senderName, hasAny };
  }, [current?.analysis]);

  const currentVisualDescription = useMemo(() => {
    if (!current?.analysis || typeof current.analysis !== "object") return null;
    const a = current.analysis as Record<string, unknown>;
    const detailed = typeof a["detailedVisualDescription"] === "string" ? a["detailedVisualDescription"].trim() : "";
    const details = Array.isArray(a["visualDetails"])
      ? (a["visualDetails"] as string[]).map((v) => String(v).trim()).filter(Boolean)
      : [];
    if (!detailed && details.length === 0) return null;
    return { detailed, details };
  }, [current?.analysis]);

  const currentWppPhone = currentContacts?.whatsapp || currentContacts?.phones?.[0] || senderPhone;
  const currentClientPortfolioQuery = useQuery({
    queryKey: ["current-client-portfolio", currentWppPhone],
    queryFn: () => getClientPortfolioByPhone(currentWppPhone),
    enabled: Boolean(currentWppPhone),
  });
  const currentClientPortfolio = currentClientPortfolioQuery.data;

  function copyJson() {
    if (!current?.analysis) return;
    navigator.clipboard.writeText(JSON.stringify(current.analysis, null, 2));
    toast.success("JSON copiado.");
  }

  function downloadJson() {
    if (!current?.analysis) return;
    const blob = new Blob([JSON.stringify(current.analysis, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analise-${current.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyAnuncioLink(id: string) {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/anuncio/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link do anúncio copiado!");
  }

  function getBadgeColor(type: Suggestion["type"]) {
    switch (type) {
      case "Objeto":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      case "Empresa":
        return "bg-sky-500/15 text-sky-300 border-sky-500/30";
      case "Categoria":
        return "bg-purple-500/15 text-purple-300 border-purple-500/30";
      case "Produto":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "Marca":
        return "bg-pink-500/15 text-pink-300 border-pink-500/30";
      default:
        return "bg-signal/15 text-signal border-signal/30";
    }
  }

  function isProductVisibleInRow(row: Row): boolean {
    if (row.analysis && typeof row.analysis === "object") {
      const a = row.analysis as Record<string, unknown>;
      if (typeof a["is_visible_in_store"] === "boolean") return a["is_visible_in_store"];
      if (typeof a["isVisibleInStore"] === "boolean") return a["isVisibleInStore"];
    }
    return true;
  }

  async function toggleStoreVisibility(row: Row) {
    if (!isGlobalAdmin) return;
    const currentAnalysis =
      row.analysis && typeof row.analysis === "object"
        ? (row.analysis as Record<string, unknown>)
        : {};
    const currentVis = isProductVisibleInRow(row);
    const newVis = !currentVis;

    const updatedAnalysis = {
      ...currentAnalysis,
      is_visible_in_store: newVis,
      isVisibleInStore: newVis,
    };

    try {
      const { error } = await supabase
        .from("image_analysis")
        .update({ analysis: updatedAnalysis })
        .eq("id", row.id);
      if (error) throw error;
      toast.success(newVis ? "Produto visível na vitrine pública." : "Produto ocultado da vitrine.");
      queryClient.invalidateQueries({ queryKey: ["history"] });
    } catch {
      toast.error("Falha ao atualizar visibilidade no banco.");
    }
  }

  // Renderiza a Vitrine da Loja por padrão
  if (viewMode === "store") {
    return (
      <>
        <StoreLandingPage
          rows={(history.data as unknown as StoreProductRow[]) ?? []}
          onOpenAnalyzer={handleOpenAnalyzer}
          onOpenIam={handleOpenIam}
          onRefreshData={() => queryClient.invalidateQueries({ queryKey: ["history"] })}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          defaultTab={authDefaultTab}
        />
      </>
    );
  }

  // Renderiza o Centro de Gestão IAM & IA em Página Inteira com URL Própria
  if (viewMode === "iam") {
    return (
      <>
        <IamManagementPage
          activeTab={searchParams.tab || "overview"}
          onTabChange={handleTabChange}
          onBackToStore={handleBackToStore}
          onOpenAnalyzer={handleOpenAnalyzer}
          onNavigateView={handleNavigateView}
          onOpenAuthModal={(tab) => {
            setAuthDefaultTab(tab);
            setIsAuthModalOpen(true);
          }}
          onOpenSubmitArt={() => {
            if (!user) {
              setAuthDefaultTab("login");
              setIsAuthModalOpen(true);
              toast.info("Acesse sua conta para enviar uma arte.");
            } else {
              setIsSubmissionModalOpen(true);
            }
          }}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          defaultTab={authDefaultTab}
        />
      </>
    );
  }

  const hasActiveFilters = Boolean(search || category || date);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-canvas text-ink antialiased">
      {/* Navbar Superior Enterprise */}
      <EnterpriseNavbar
        currentView="analyzer"
        onNavigateView={handleNavigateView}
        availableGroups={availableGroups}
        pendingSubmissionsCount={pendingSubmissionsCount}
        onOpenSubmitArt={() => {
          if (!user) {
            setAuthDefaultTab("login");
            setIsAuthModalOpen(true);
            toast.info("Acesse sua conta para enviar uma arte.");
          } else {
            setIsSubmissionModalOpen(true);
          }
        }}
        onOpenAuthModal={(tab) => {
          setAuthDefaultTab(tab);
          setIsAuthModalOpen(true);
        }}
      />

      <div className="relative mx-auto w-full max-w-[1240px] min-w-0 px-4 py-6 sm:px-8 sm:py-8">
        {/* Cabeçalho do Analisador */}
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between border-b border-white/[0.08] pb-6">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#A88C5A]/35 bg-[#A88C5A]/10 text-[#C4A468] shadow-sm">
              <ScanText className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl font-normal tracking-wide text-[#FBF9F5] sm:text-2xl">
                  Analisador Multimodal & OCR
                </h1>
                <span className="rounded bg-[#A88C5A]/15 border border-[#A88C5A]/30 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#C4A468]">
                  Vision Engine
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-[#A8A199]">
                Extraia contatos, dados de catálogo, produtos, preços e detalhes visuais em JSON estruturado.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {/* Resumo Rápido do Modelo Ativo */}
            <div className="flex items-center gap-2 rounded-xl border border-[#A88C5A]/30 bg-[#A88C5A]/10 px-3.5 py-1.5 font-mono text-xs text-[#C4A468]">
              <span className="size-2 rounded-full bg-[#C4A468] animate-pulse" />
              <span className="font-semibold text-[11px] uppercase tracking-wider text-[#A88C5A]">Ativo:</span>
              <span className="font-bold text-[#FBF9F5]">{effectiveModel}</span>
              <span className="text-[10px] text-[#A8A199]">({activeGroup?.name || "Geral"})</span>
            </div>
          </div>
        </header>

        {/* PAINEL DE CONTROLE DE GRUPO & MODELOS IA */}
        <div className="mb-6 rounded-2xl border border-white/[0.08] bg-[#1C1A18]/95 p-4 sm:p-5 backdrop-blur-xl shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-white/[0.06] pb-4">
            {/* Seletor de Grupo de Trabalho */}
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold text-[#C4A468] uppercase tracking-wider shrink-0">
                <Users className="size-4 text-[#A88C5A]" />
                <span>Grupo Selecionado:</span>
              </div>
              
              <div className="relative flex-1 max-w-sm">
                <select
                  value={activeGroup?.id || ""}
                  onChange={(e) => {
                    const newGroupId = e.target.value;
                    setActiveGroupId(newGroupId);
                    const selected = (availableGroups.length > 0 ? availableGroups : userGroups).find((g) => g.id === newGroupId) || null;
                    loadGroupModels(selected, false);
                    toast.info(`Grupo de análise alterado para: "${selected?.name || 'Novo Grupo'}"`);
                  }}
                  className="w-full rounded-xl border border-[#A88C5A]/40 bg-[#121110] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#FBF9F5] focus:border-[#A88C5A] focus:outline-none focus:ring-1 focus:ring-[#A88C5A] cursor-pointer shadow-inner"
                >
                  {(availableGroups.length > 0 ? availableGroups : userGroups).map((g) => (
                    <option key={g.id} value={g.id} className="bg-[#181716] text-[#FBF9F5]">
                      {g.name} {g.gemini_api_key ? "✓ (Chave Gemini Própria)" : "• (Chave Global/Padrão)"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status da Chave de API do Grupo */}
              <div className="flex items-center gap-2">
                {activeGroup?.gemini_api_key ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                    <Key className="size-3" />
                    <span>Chave Gemini Ativa</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-[11px] font-semibold text-amber-400">
                    <AlertCircle className="size-3" />
                    <span>Sem Chave Própria (Usa Padrão)</span>
                  </span>
                )}

                {canManageIam && (
                  <button
                    type="button"
                    onClick={() => {
                      setIamModalTab("groups");
                      setIsIamModalOpen(true);
                    }}
                    className="text-[11px] text-[#C4A468] hover:text-[#A88C5A] underline transition-colors cursor-pointer"
                  >
                    Editar Grupo
                  </button>
                )}
              </div>
            </div>

            {/* Alternador de Motor (Google Gemini vs Olivelas AI Vision) */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-[#A8A199] font-medium">Motor:</span>
              <div className="flex items-center rounded-xl border border-white/[0.08] bg-[#121110] p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => handleSetAiProvider("gemini")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    aiProvider === "gemini"
                      ? "bg-[#A88C5A] text-[#151413] font-bold shadow-sm"
                      : "text-[#A8A199] hover:text-[#FBF9F5]"
                  }`}
                >
                  <Globe className="size-3.5" />
                  <span>Google Gemini</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAiProvider("lovable")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    aiProvider === "lovable"
                      ? "bg-[#A88C5A] text-[#151413] font-bold shadow-sm"
                      : "text-[#A8A199] hover:text-[#FBF9F5]"
                  }`}
                >
                  <Cpu className="size-3.5" />
                  <span>Olivelas AI Vision</span>
                </button>
              </div>
            </div>
          </div>

          {/* Opções de Modelo: Usar o Configurado no Grupo vs Sincronizar/Escolher da Lista */}
          <div className="mt-4 flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
            {aiProvider === "gemini" ? (
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Botões de Escolha: Configurado no Grupo vs Sincronizado */}
                <div className="flex items-center rounded-xl border border-white/[0.08] bg-[#121110] p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setUseGroupConfiguredModel(true);
                      toast.info(`Usando modelo configurado no grupo: "${activeGroup?.gemini_model || 'gemini-2.5-flash'}"`);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      useGroupConfiguredModel
                        ? "bg-[#A88C5A]/25 border border-[#A88C5A]/50 text-[#FBF9F5] font-bold shadow-sm"
                        : "text-[#A8A199] hover:text-[#FBF9F5]"
                    }`}
                  >
                    <ShieldCheck className="size-3.5 text-[#C4A468]" />
                    <span>Usar Configurado no Grupo ({activeGroup?.gemini_model || "gemini-2.5-flash"})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUseGroupConfiguredModel(false);
                      toast.info("Modo manual: selecione qualquer modelo da lista sincronizada.");
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      !useGroupConfiguredModel
                        ? "bg-[#A88C5A]/25 border border-[#A88C5A]/50 text-[#FBF9F5] font-bold shadow-sm"
                        : "text-[#A8A199] hover:text-[#FBF9F5]"
                    }`}
                  >
                    <SlidersHorizontal className="size-3.5 text-[#C4A468]" />
                    <span>Escolher Modelo Sincronizado</span>
                  </button>
                </div>

                {/* Seletor Manual de Modelos Sincronizados */}
                {!useGroupConfiguredModel && (
                  <div className="flex items-center gap-1.5 rounded-xl border border-[#A88C5A]/40 bg-[#121110] px-3 py-1.5 text-xs font-mono">
                    <select
                      value={groupGeminiModel}
                      onChange={(e) => setGroupGeminiModel(e.target.value)}
                      disabled={isLoadingGroupModels}
                      className="bg-transparent text-[#FBF9F5] font-semibold focus:outline-none cursor-pointer text-xs max-w-[220px] sm:max-w-[280px] truncate"
                    >
                      {groupGeminiModels.map((m) => (
                        <option key={m.id} value={m.id} className="bg-[#181716] text-[#FBF9F5]">
                          {m.name || m.id}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Botão para Sincronizar Modelos da API */}
                <button
                  type="button"
                  onClick={() => loadGroupModels(activeGroup, true)}
                  disabled={isLoadingGroupModels}
                  className="flex items-center gap-2 rounded-xl border border-[#A88C5A]/40 bg-[#A88C5A]/15 hover:bg-[#A88C5A]/25 px-3.5 py-1.5 text-xs font-semibold text-[#C4A468] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Consulta a API do Google Gemini com a chave do grupo e lista os modelos de visão disponíveis"
                >
                  <RefreshCw className={`size-3.5 ${isLoadingGroupModels ? "animate-spin text-[#C4A468]" : ""}`} />
                  <span>{isLoadingGroupModels ? "Sincronizando..." : "Sincronizar Modelos Disponíveis"}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#A8A199] font-medium">Modelo Lovable Vision:</span>
                <select
                  value={lovableModel}
                  onChange={(e) => setLovableModel(e.target.value)}
                  className="rounded-xl border border-[#A88C5A]/40 bg-[#121110] px-3 py-1.5 text-xs font-mono font-semibold text-[#FBF9F5] focus:outline-none cursor-pointer"
                >
                  {LOVABLE_VISION_MODELS.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#181716] text-[#FBF9F5]">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Badge de Resumo da Execução de Análise */}
            <div className="flex items-center gap-2 text-xs text-[#A8A199] bg-[#121110] border border-white/[0.06] rounded-xl px-3 py-1.5 font-mono">
              <span>Execução:</span>
              <span className="rounded bg-[#A88C5A]/20 border border-[#A88C5A]/30 px-2 py-0.5 font-bold text-[#C4A468]">
                {effectiveModel}
              </span>
              <span>no grupo</span>
              <span className="font-semibold text-[#FBF9F5]">
                {activeGroup?.name || "Geral"}
              </span>
            </div>
          </div>
        </div>

        {/* Área de Upload */}
        <section aria-label="upload" className="w-full max-w-full min-w-0">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickFile(e.dataTransfer.files?.[0]);
            }}
            className={`group relative rounded-2xl border bg-[#201E1C]/80 p-4 backdrop-blur-xl transition-all duration-300 sm:p-6 ${
              dragging ? "border-[#A88C5A] bg-[#A88C5A]/[0.05]" : "border-white/[0.08] hover:border-white/20"
            }`}
          >
            <div className="relative flex flex-col gap-5 min-w-0 max-w-full">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="relative block w-full max-w-full overflow-hidden rounded-xl border border-dashed border-white/10 hover:border-[#A88C5A]/40 bg-[#181716]/90 text-left transition-all cursor-pointer group/dropzone"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Pré-visualização da imagem enviada"
                    className="max-h-[380px] sm:max-h-[420px] w-full object-contain"
                  />
                ) : (
                  <div className="grid aspect-[16/8] sm:aspect-[16/7] w-full place-items-center gap-2.5 text-center p-6">
                    <div className="flex flex-col items-center">
                      <div className="grid size-12 place-items-center rounded-xl bg-[#A88C5A]/15 border border-[#A88C5A]/30 text-[#C4A468] mb-2.5 group-hover/dropzone:scale-105 group-hover/dropzone:border-[#A88C5A]/50 transition-transform">
                        <UploadCloud className="size-6" />
                      </div>
                      <p className="text-sm font-medium text-[#FBF9F5]">
                        Arraste uma imagem aqui ou <span className="text-[#C4A468] font-semibold underline underline-offset-2">clique para selecionar</span>
                      </p>
                      <p className="mt-1.5 font-mono text-[11px] text-[#A8A199]">
                        Formatos suportados: JPG, JPEG, PNG, WEBP
                      </p>
                    </div>
                  </div>
                )}
                {busy && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="animate-pulse absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-[#A88C5A]/20 to-transparent" />
                  </div>
                )}
                <div className="absolute left-3 top-3 rounded-md border border-white/10 bg-[#151413]/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#A8A199]">
                  Pré-visualização
                </div>
              </button>

              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between min-w-0">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[#A8A199] min-w-0">
                  <span className="rounded-lg border border-white/[0.08] bg-[#181716]/80 px-2.5 py-1 truncate max-w-[220px]">
                    arquivo: {file?.name ?? "—"}
                  </span>
                  {file && (
                    <>
                      <span className="rounded-lg border border-white/[0.08] bg-[#181716]/80 px-2.5 py-1">
                        {formatBytes(file.size)}
                      </span>
                      <span className="rounded-lg border border-[#A88C5A]/30 bg-[#A88C5A]/15 px-2.5 py-1 text-[#C4A468] font-semibold">
                        {file.type.replace("image/", "")} ✓
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  {!canUseDirectAi ? (
                    <button
                      type="button"
                      onClick={() => setIsSubmissionModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#A88C5A] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#151413] shadow-md shadow-[#A88C5A]/20 hover:bg-[#967B4A] transition cursor-pointer"
                    >
                      <UploadCloud className="size-4" />
                      <span>Enviar para Fila de Moderação</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => inputRef.current?.click()}
                        className="rounded-xl border border-white/[0.08] bg-[#1C1A18]/80 px-4 py-2.5 text-xs sm:text-sm font-medium text-[#A8A199] transition-colors hover:text-[#FBF9F5] hover:bg-[#2C2926] cursor-pointer"
                      >
                        Selecionar arquivo
                      </button>
                      <button
                        disabled={!file || busy}
                        onClick={() => file && run.mutate(file)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#A88C5A] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#151413] shadow-md shadow-[#A88C5A]/20 hover:bg-[#967B4A] transition disabled:opacity-40 cursor-pointer"
                      >
                        {busy ? (
                          <>
                            <span className="size-4 animate-spin rounded-full border-2 border-[#151413]/30 border-t-[#151413]" />
                            <span>Processando com IA...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-4" />
                            <span>Analisar com IA</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Resultado da Análise Atual */}
        {current && (
          <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.05fr] min-w-0 max-w-full">
            {/* Card de Resumo */}
            <div className="animate-fade-in rounded-2xl border border-white/[0.08] bg-[#201E1C]/80 p-5 backdrop-blur-xl sm:p-6 flex flex-col justify-between min-w-0 max-w-full overflow-hidden">
              <div className="min-w-0">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#C4A468]">Resumo da Extração</h2>
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setArtPromptTargetRow(current);
                        setIsArtPromptOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#A88C5A]/35 bg-[#A88C5A]/15 px-2.5 py-1 text-[#C4A468] hover:bg-[#A88C5A]/25 transition-all font-semibold cursor-pointer"
                      title="Refazer arte profissional com IA usando os dados do JSON"
                    >
                      <Wand2 className="size-3.5" />
                      <span>Refazer Arte com IA</span>
                    </button>
                    <Link
                      to="/anuncio/$id"
                      params={{ id: current.id }}
                      className="inline-flex items-center gap-1 rounded-xl border border-[#A88C5A]/30 bg-[#A88C5A]/10 px-2.5 py-1 text-[#C4A468] hover:bg-[#A88C5A]/20 transition-colors"
                      title="Abrir página dedicada do anúncio"
                    >
                      <ExternalLink className="size-3" />
                      <span>Anúncio</span>
                    </Link>
                    <button
                      onClick={() => copyAnuncioLink(current.id)}
                      className="inline-flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#1C1A18]/80 px-2.5 py-1 text-[#A8A199] hover:text-[#FBF9F5] transition-colors cursor-pointer"
                      title="Copiar link público do anúncio"
                    >
                      <Copy className="size-3" />
                      <span>Copiar Link</span>
                    </button>
                  </div>
                </div>

                <dl className="space-y-3.5 text-sm">
                  <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.06] pb-3">
                    <dt className="shrink-0 text-[#A8A199]">Tipo</dt>
                    <dd className="text-right font-medium text-[#FBF9F5] truncate">{current.image_type || "—"}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.06] pb-3">
                    <dt className="shrink-0 text-[#A8A199]">Categoria</dt>
                    <dd className="text-right font-medium text-[#FBF9F5] truncate">{current.category || "—"}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.06] pb-3">
                    <dt className="shrink-0 text-[#A8A199]">Empresa</dt>
                    <dd className="text-right font-medium text-[#FBF9F5] truncate">{current.business_name || "—"}</dd>
                  </div>
                  <div className="border-b border-white/[0.06] pb-3">
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="shrink-0 text-[#A8A199]">Confiança</dt>
                      <dd className="font-mono text-[#C4A468] font-semibold">{confidence.toFixed(2)}</dd>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#181716]">
                      <div
                        className="h-full rounded-full bg-[#A88C5A]"
                        style={{ width: `${Math.min(100, Math.max(0, confidence * 100))}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-1 min-w-0 max-w-full">
                    <dt className="mb-1.5 text-[#A8A199]">Resumo</dt>
                    <dd className="text-pretty leading-relaxed text-[#FBF9F5] break-words">{current.summary || "—"}</dd>
                  </div>

                  {/* Lista de Produtos & Itens à Venda */}
                  {currentProducts.length > 0 && (
                    <div className="pt-3 border-t border-white/[0.06] min-w-0 max-w-full">
                      <dt className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#C4A468] flex items-center gap-1.5">
                        <ShoppingBag className="size-3.5" />
                        <span>Produtos & Itens à Venda ({currentProducts.length})</span>
                      </dt>
                      <dd className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1 min-w-0 max-w-full">
                        {currentProducts.map((prod, i) => (
                          <div
                            key={i}
                            className="flex items-start justify-between gap-2 rounded-xl border border-white/[0.06] bg-[#181716]/80 px-2.5 py-1.5 text-xs text-[#FBF9F5] min-w-0 max-w-full"
                          >
                            <span className="font-medium min-w-0 flex-1 break-words leading-relaxed">{prod.name}</span>
                            {prod.price && (
                              <span className="shrink-0 rounded bg-[#A88C5A]/15 border border-[#A88C5A]/30 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#C4A468] whitespace-nowrap mt-0.5">
                                {prod.price}
                              </span>
                            )}
                          </div>
                        ))}
                      </dd>
                    </div>
                  )}

                  {/* Detalhes Visuais & Físicos dos Produtos */}
                  {currentVisualDescription && (
                    <div className="pt-3 border-t border-white/[0.06] min-w-0 max-w-full">
                      <dt className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#C4A468] flex items-center gap-1.5">
                        <Eye className="size-3.5" />
                        <span>Detalhes Visuais & Físicos</span>
                      </dt>
                      <dd className="space-y-2 text-xs text-[#A8A199]">
                        {currentVisualDescription.detailed && (
                          <p className="leading-relaxed whitespace-pre-wrap break-words text-[#FBF9F5]">
                            {currentVisualDescription.detailed}
                          </p>
                        )}
                        {currentVisualDescription.details.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {currentVisualDescription.details.map((item, idx) => (
                              <span
                                key={idx}
                                className="rounded border border-[#A88C5A]/30 bg-[#A88C5A]/10 px-2 py-0.5 text-[11px] text-[#C4A468] font-medium"
                              >
                                ✓ {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </dd>
                    </div>
                  )}

                  {/* Seção de Contatos Identificados */}
                  {currentContacts?.hasAny && (
                    <div className="pt-3 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between mb-2">
                        <dt className="text-xs font-semibold uppercase tracking-wider text-[#A8A199] flex items-center gap-1.5">
                          <Phone className="size-3.5" />
                          <span>Contatos & WhatsApp</span>
                        </dt>
                        <button
                          type="button"
                          onClick={() => setIsEditingContact(!isEditingContact)}
                          className="text-[11px] text-[#C4A468] hover:underline cursor-pointer"
                        >
                          {isEditingContact ? "Fechar" : "+ Alterar/Adicionar"}
                        </button>
                      </div>
                      <dd className="space-y-2">
                        {currentContacts.whatsapp && (
                          <div className="flex items-center justify-between gap-2 rounded-xl border border-[#25D366]/30 bg-[#1A261D]/90 p-2 text-xs text-[#25D366]">
                            <div className="flex items-center gap-2 truncate">
                              <MessageCircle className="size-3.5" />
                              <span className="font-mono font-semibold">{currentContacts.whatsapp}</span>
                              {currentContacts.senderName && (
                                <span className="text-[#A8A199] truncate">({currentContacts.senderName})</span>
                              )}
                            </div>
                            <a
                              href={`https://wa.me/${cleanPhoneForWhatsApp(currentContacts.whatsapp)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="shrink-0 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] px-2.5 py-1 text-xs font-bold text-[#151413] transition-colors"
                            >
                              Abrir WhatsApp
                            </a>
                          </div>
                        )}
                        {currentContacts.phones.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {currentContacts.phones.map((phone, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#1C1A18]/80 px-2 py-1 font-mono text-xs text-[#FBF9F5]"
                              >
                                <Phone className="size-3 text-[#C4A468]" />
                                <span>{phone}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Banner / Fallback para quando a imagem NÃO tiver contatos */}
              {(!currentContacts?.hasAny || isEditingContact) && (
                <div className="mt-4 rounded-xl border border-[#C4A468]/30 bg-[#282218]/90 p-3.5 backdrop-blur-md">
                  <div className="flex items-start gap-2.5">
                    <Smartphone className="size-4 text-[#C4A468] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#C4A468]">
                        {!currentContacts?.hasAny
                          ? "Nenhum contato identificado na imagem"
                          : "Atualizar contato do remetente"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#A8A199]">
                        Informe o WhatsApp de quem enviou ou selecione direto da agenda do celular:
                      </p>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <input
                          type="text"
                          value={senderPhone}
                          onChange={(e) => setSenderPhone(e.target.value)}
                          placeholder="WhatsApp / Telefone (ex: 11999999999)"
                          className="w-full rounded-lg border border-white/[0.08] bg-[#181716] px-3 py-1.5 text-xs text-[#FBF9F5] placeholder:text-[#78716A] focus:border-[#A88C5A] focus:outline-none"
                        />
                        <input
                          type="text"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder="Nome do remetente (opcional)"
                          className="w-full rounded-lg border border-white/[0.08] bg-[#181716] px-3 py-1.5 text-xs text-[#FBF9F5] placeholder:text-[#78716A] focus:border-[#A88C5A] focus:outline-none"
                        />
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={selecionarContatoDaAgenda}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#1C1A18]/80 px-2.5 py-1.5 text-xs font-medium text-[#A8A199] hover:text-[#FBF9F5] transition cursor-pointer"
                        >
                          <BookOpen className="size-3.5" />
                          <span>Buscar na Agenda</span>
                        </button>
                        <button
                          type="button"
                          disabled={!senderPhone.trim() || saveContact.isPending}
                          onClick={() =>
                            saveContact.mutate({
                              id: current.id,
                              phone: senderPhone.trim(),
                              name: senderName.trim() || undefined,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#A88C5A] px-3.5 py-1.5 text-xs font-bold text-[#151413] hover:bg-[#967B4A] disabled:opacity-40 transition cursor-pointer"
                        >
                          {saveContact.isPending ? "Salvando..." : "Salvar Contato"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card do JSON */}
            <div className="animate-fade-in flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#181716] backdrop-blur-xl min-w-0 max-w-full">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-2.5 bg-[#201E1C]/80">
                <div className="flex items-center gap-2 font-mono text-[11px] text-[#C4A468]">
                  <Code2 className="size-3.5 text-[#C4A468]" />
                  <span>analysis.json</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={copyJson}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#1C1A18]/80 px-2.5 py-1.5 text-xs font-medium text-[#A8A199] transition-colors hover:text-[#FBF9F5] cursor-pointer"
                  >
                    <Copy className="size-3" />
                    <span>Copiar</span>
                  </button>
                  <button
                    onClick={downloadJson}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#1C1A18]/80 px-2.5 py-1.5 text-xs font-medium text-[#A8A199] transition-colors hover:text-[#FBF9F5] cursor-pointer"
                  >
                    <Download className="size-3" />
                    <span>Baixar</span>
                  </button>
                </div>
              </div>
              <div className="max-h-[460px] overflow-auto max-w-full">
                <JsonHighlight value={current.analysis} />
              </div>
            </div>
          </section>
        )}

        {/* Portfólio & Paginação de Serviços do Cliente Identificado por WhatsApp */}
        {current && currentClientPortfolio && currentClientPortfolio.services.length > 0 && (
          <section className="mt-8 w-full max-w-full min-w-0">
            <ClientServicesPagination
              portfolio={currentClientPortfolio}
              currentArtId={current.id}
              itemsPerPage={8}
            />
          </section>
        )}

        {/* Seção do Histórico e Busca */}
        <section className="mt-8 w-full max-w-full min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#C4A468]">
              Histórico de Extrações{" "}
              <span className="ml-1 font-mono text-[11px] normal-case text-[#78716A]">
                ({totalItems} {totalItems === 1 ? "registro" : "registros"})
              </span>
            </h2>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Campo de busca inteligente com Autocomplete */}
              <div ref={searchContainerRef} className="relative flex-1 sm:w-80 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#78716A]" />
                <input
                  value={searchInput}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type="text"
                  placeholder="Buscar texto, doces, salgados, carro..."
                  className="w-full rounded-xl border border-white/[0.08] bg-[#181716] py-2 pl-8 pr-8 text-xs sm:text-sm text-[#FBF9F5] placeholder:text-[#78716A] focus:border-[#A88C5A] focus:outline-none"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => handleSetSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A8A199] hover:text-[#FBF9F5] cursor-pointer"
                    title="Limpar busca"
                  >
                    <X className="size-3.5" />
                  </button>
                )}

                {/* Dropdown de Autocomplete */}
                {isSearchFocused && matchingSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#1C1A18] p-1.5 shadow-2xl backdrop-blur-xl">
                    <div className="px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[#78716A]">
                      {search ? "Sugestões correspondentes" : "Termos frequentes"}
                    </div>
                    {matchingSuggestions.map((s, idx) => (
                      <button
                        key={`${s.type}-${s.label}-${idx}`}
                        type="button"
                        onClick={() => {
                          handleSetSearch(s.label);
                          setIsSearchFocused(false);
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-white/5 cursor-pointer"
                      >
                        <span className="truncate text-[#FBF9F5]">{s.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${getBadgeColor(
                              s.type
                            )}`}
                          >
                            {s.type}
                          </span>
                          {s.count > 1 && (
                            <span className="font-mono text-[10px] text-[#78716A]">
                              ×{s.count}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filtro por Categoria */}
              <select
                value={category}
                onChange={(e) => handleSetCategory(e.target.value)}
                className="rounded-xl border border-white/[0.08] bg-[#181716] py-2 pl-3 pr-8 text-xs sm:text-sm text-[#FBF9F5] focus:border-[#A88C5A] focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#181716]">Todas categorias</option>
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-[#181716]">
                    {c}
                  </option>
                ))}
              </select>

              {/* Filtro por Data */}
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => handleSetDate(e.target.value)}
                  className="rounded-xl border border-white/[0.08] bg-[#181716] px-3 py-2 pr-7 text-xs sm:text-sm text-[#FBF9F5] focus:border-[#A88C5A] focus:outline-none"
                  title="Filtrar por data"
                />
                {date && (
                  <button
                    type="button"
                    onClick={() => handleSetDate("")}
                    className="absolute right-2 text-[#A8A199] hover:text-[#FBF9F5] cursor-pointer"
                    title="Limpar filtro de data"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Botão para limpar todos os filtros */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="rounded-xl border border-white/[0.08] bg-[#1C1A18]/80 px-2.5 py-2 text-xs text-[#A8A199] transition-colors hover:text-rose-400 cursor-pointer"
                  title="Limpar todos os filtros"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          {/* Tabela Responsiva do Histórico */}
          <div className="w-full max-w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
            <div className="hidden grid-cols-[1.8fr_1fr_0.8fr_auto] gap-4 border-b border-white/10 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-faint sm:grid">
              <span>Imagem & Tags</span>
              <span>Categoria</span>
              <span>Data</span>
              <span className="text-right">Ações</span>
            </div>

            {totalItems === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-dim">Nenhuma análise encontrada.</p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="mt-2 text-xs text-signal underline hover:text-signal/80"
                  >
                    Limpar filtros aplicados
                  </button>
                )}
              </div>
            )}

            {paginatedItems.map((row) => {
              const currentKeywords = row.keywords ?? [];
              const isDropdownOpen = activeDropdownId === row.id;

              return (
                <div
                  key={row.id}
                  className="grid grid-cols-1 gap-3 border-b border-white/10 px-4 py-3.5 last:border-b-0 sm:grid-cols-[1.8fr_1fr_0.8fr_auto] sm:items-center sm:gap-4 min-w-0 transition-colors hover:bg-white/[0.015]"
                >
                  {/* Coluna 1: Imagem, Título e Tags Editáveis */}
                  <div className="flex flex-col gap-2 min-w-0 max-w-full">
                    <button
                      onClick={() => {
                        setCurrent(row);
                        setPreviewUrl(row.image_url);
                        setFile(null);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="flex items-center gap-3 text-left min-w-0 max-w-full group cursor-pointer"
                    >
                      {row.image_url ? (
                        <img
                          src={row.image_url}
                          alt={row.business_name ?? "Miniatura da análise"}
                          className="size-11 shrink-0 rounded-lg object-cover outline-1 -outline-offset-1 outline-black/5 transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="size-11 shrink-0 rounded-lg bg-white/[0.05] grid place-items-center text-xs text-dim">
                          📷
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink group-hover:text-signal transition-colors">
                          {row.business_name || row.title || "Sem identificação"}
                        </p>
                        <p className="truncate text-xs text-faint">
                          {row.status === "failed"
                            ? (row.error_message ?? "Falha na análise")
                            : row.image_type || "—"}
                        </p>
                      </div>
                    </button>

                    {/* Gerenciamento de Tags (Selecionar, Tirar ou Colocar Manualmente) */}
                    <div className="flex flex-wrap items-center gap-1.5 pl-0 sm:pl-14 max-w-full">
                      {currentKeywords.map((kw, idx) => (
                        <span
                          key={`${kw}-${idx}`}
                          className="inline-flex items-center gap-1 rounded-md border border-signal/30 bg-signal/10 px-2 py-0.5 text-xs text-signal font-medium shadow-sm"
                        >
                          <button
                            type="button"
                            onClick={() => handleSetSearch(kw)}
                            className="cursor-pointer hover:underline truncate max-w-[120px]"
                            title={`Filtrar por #${kw}`}
                          >
                            #{kw}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextKeywords = currentKeywords.filter((_, i) => i !== idx);
                              updateRowKeywords.mutate({ id: row.id, keywords: nextKeywords });
                            }}
                            className="ml-0.5 text-signal/60 hover:text-danger cursor-pointer text-[10px] font-bold"
                            title={`Remover tag "${kw}"`}
                          >
                            ✕
                          </button>
                        </span>
                      ))}

                      {/* Adicionar Tag Manual */}
                      {editingTagRowId === row.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const trimmed = newTagInput.trim().replace(/^#+/, "");
                            if (trimmed) {
                              if (!currentKeywords.some((k) => k.toLowerCase() === trimmed.toLowerCase())) {
                                updateRowKeywords.mutate({
                                  id: row.id,
                                  keywords: [...currentKeywords, trimmed],
                                });
                              }
                            }
                            setNewTagInput("");
                            setEditingTagRowId(null);
                          }}
                          className="inline-flex items-center gap-1"
                        >
                          <input
                            type="text"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            placeholder="Nova tag..."
                            autoFocus
                            className="w-24 rounded border border-signal/40 bg-black/80 px-2 py-0.5 text-xs text-ink placeholder:text-faint focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="rounded bg-signal px-1.5 py-0.5 text-[10px] font-bold text-canvas cursor-pointer hover:bg-signal/90"
                            title="Salvar tag"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTagRowId(null);
                              setNewTagInput("");
                            }}
                            className="text-xs text-dim hover:text-ink cursor-pointer px-1"
                            title="Cancelar"
                          >
                            ✕
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTagRowId(row.id);
                            setNewTagInput("");
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-dashed border-white/20 bg-white/[0.02] px-2 py-0.5 text-xs text-dim hover:text-signal hover:border-signal/40 hover:bg-signal/5 transition-colors cursor-pointer"
                          title="Adicionar tag manualmente a esta análise"
                        >
                          <span>+</span>
                          <span>Tag</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Coluna 2: Categoria */}
                  <div className="truncate text-sm text-dim">{row.category || "—"}</div>

                  {/* Coluna 3: Data */}
                  <div className="font-mono text-xs text-faint">
                    {new Date(row.created_at).toLocaleDateString("pt-BR")}
                  </div>

                  {/* Coluna 4: Dropdown de Ações */}
                  <div className="relative flex items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdownId(isDropdownOpen ? null : row.id);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-ink hover:bg-white/[0.08] hover:border-signal/40 transition-colors cursor-pointer shadow-sm"
                    >
                      <span>Ações</span>
                      <span className="text-[10px] opacity-70">▾</span>
                    </button>

                    {isDropdownOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-white/15 bg-[#0c0e14]/98 p-1.5 shadow-2xl backdrop-blur-2xl ring-1 ring-black/50 animate-in fade-in zoom-in-95 duration-100"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setCurrent(row);
                            setPreviewUrl(row.image_url);
                            setFile(null);
                            setActiveDropdownId(null);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-ink hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <span>👁️</span>
                          <span>Ver Detalhes</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setArtPromptTargetRow(row);
                            setIsArtPromptOpen(true);
                            setActiveDropdownId(null);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-purple-300 hover:bg-purple-500/15 transition-colors cursor-pointer"
                        >
                          <span>🎨</span>
                          <span>Refazer Arte com IA</span>
                        </button>

                        <Link
                          to="/anuncio/$id"
                          params={{ id: row.id }}
                          onClick={() => setActiveDropdownId(null)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-signal hover:bg-signal/15 transition-colors cursor-pointer"
                        >
                          <span>🔗</span>
                          <span>Página do Anúncio</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            copyAnuncioLink(row.id);
                            setActiveDropdownId(null);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-dim hover:text-ink hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <span>📋</span>
                          <span>Copiar Link</span>
                        </button>

                        {isGlobalAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              toggleStoreVisibility(row);
                              setActiveDropdownId(null);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-amber-300 hover:bg-amber-500/15 transition-colors cursor-pointer border-t border-white/5 mt-1 pt-1.5"
                          >
                            <span>{isProductVisibleInRow(row) ? "🙈" : "👁️"}</span>
                            <span>{isProductVisibleInRow(row) ? "Ocultar da Vitrine" : "Exibir na Vitrine"}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            reprocess.mutate(row);
                            setActiveDropdownId(null);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-dim hover:text-ink hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <span>🔄</span>
                          <span>Reprocessar IA</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRowToDelete(row);
                            setActiveDropdownId(null);
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-danger hover:bg-danger/15 transition-colors cursor-pointer border-t border-white/5 mt-1 pt-1.5 font-medium"
                        >
                          <span>🗑️</span>
                          <span>Excluir Análise</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barra de Paginação */}
          {totalPages > 1 && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-white/5 pt-4">
              <div className="text-xs text-dim">
                Mostrando{" "}
                <span className="font-mono font-medium text-ink">
                  {totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                </span>{" "}
                a{" "}
                <span className="font-mono font-medium text-ink">
                  {Math.min(currentPage * PAGE_SIZE, totalItems)}
                </span>{" "}
                de <span className="font-mono font-medium text-ink">{totalItems}</span> análises
              </div>

              <div className="flex flex-wrap items-center gap-1.5 self-center sm:self-auto">
                {/* Botão Anterior */}
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => handleSetPage(currentPage - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-dim transition-colors hover:border-signal/40 hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
                  title="Página anterior"
                >
                  ← Anterior
                </button>

                {/* Números das Páginas */}
                <div className="flex items-center gap-1">
                  {pageNumbers.map((p, idx) => {
                    if (p === "...") {
                      return (
                        <span key={`dots-${idx}`} className="px-2 py-1 text-xs text-faint font-mono">
                          ...
                        </span>
                      );
                    }
                    const num = Number(p);
                    const isActive = num === currentPage;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleSetPage(num)}
                        className={`size-8 rounded-lg font-mono text-xs font-medium transition-all ${
                          isActive
                            ? "bg-signal text-canvas font-bold shadow-sm shadow-signal/20"
                            : "border border-white/10 bg-white/[0.03] text-dim hover:border-signal/40 hover:text-ink"
                        }`}
                        title={`Ir para página ${num}`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                {/* Botão Próximo */}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => handleSetPage(currentPage + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-dim transition-colors hover:border-signal/40 hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
                  title="Próxima página"
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Modal / Gerador de Prompt para Refazer Arte com IA */}
      <ArtPromptGenerator
        isOpen={isArtPromptOpen}
        onClose={() => setIsArtPromptOpen(false)}
        analysis={artPromptTargetRow?.analysis as Record<string, unknown> | undefined}
        imageUrl={artPromptTargetRow?.image_url}
        title={artPromptTargetRow?.business_name || artPromptTargetRow?.title}
        artId={artPromptTargetRow?.id}
        onArtUpdated={() => {
          history.refetch();
        }}
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

      {/* Modal de Confirmação de Exclusão de Análise na Tela */}
      {rowToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-danger/40 bg-[#0c0e14] p-6 shadow-2xl text-ink">
            <div className="flex items-center gap-3 text-danger mb-3">
              <div className="grid size-11 place-items-center rounded-xl bg-danger/20 border border-danger/40 text-xl shrink-0">
                🗑️
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-ink">Excluir Análise do Sistema</h3>
                <p className="text-xs text-dim truncate">
                  {rowToDelete.business_name || rowToDelete.title || `Anúncio #${rowToDelete.id.slice(0, 8)}`}
                </p>
              </div>
            </div>

            <p className="text-xs text-dim leading-relaxed mb-4">
              Tem certeza que deseja excluir esta análise permanentemente? Todas as informações extraídas, dados comerciais e arquivos associados serão removidos do banco de dados e do servidor.
            </p>

            {rowToDelete.image_url && (
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/50 mb-4 max-h-44 flex items-center justify-center">
                <img
                  src={rowToDelete.image_url}
                  alt={rowToDelete.business_name || "Anúncio"}
                  className="max-h-44 max-w-full object-contain rounded"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => setRowToDelete(null)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-dim hover:text-ink hover:bg-white/[0.08] transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={remove.isPending}
                onClick={async () => {
                  try {
                    await remove.mutateAsync(rowToDelete);
                    setRowToDelete(null);
                  } catch {
                    /* erro tratado pelo onError do useMutation */
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-danger px-4 py-2 text-xs font-bold text-white hover:bg-danger/90 transition shadow-lg shadow-danger/25 cursor-pointer disabled:opacity-50"
              >
                {remove.isPending ? (
                  <>
                    <div className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>Sim, Excluir Análise</span>
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
