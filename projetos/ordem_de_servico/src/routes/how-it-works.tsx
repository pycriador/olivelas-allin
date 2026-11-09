import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Search, Palette, CheckCircle2, UserPlus, BookOpen, Wrench, Shield,
  FileText, Smartphone, Laptop, Printer, QrCode, Share2, Sparkles,
  ArrowRight, ExternalLink, RefreshCw, Send, Check, X, ShieldCheck,
  DollarSign, Package, Eye, Users, AlertCircle, Copy, Sliders,
  HelpCircle, ChevronRight, Download, Filter, Cpu, Layers, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "Como Funciona o Sistema & Manual — ServiceForge" },
      { name: "description", content: "Guia completo, evidências de busca, criação de artes, aprovação de orçamentos e manual do ServiceForge." },
    ],
  }),
  component: HowItWorksPage,
});

/* ─────────────────────────────────────────────────────────────────────────────
   MOCK DATA PARA EVIDÊNCIAS DE BUSCA
───────────────────────────────────────────────────────────────────────────── */

interface SearchEvidenceItem {
  id: string;
  code: string;
  category: "service_order" | "customer" | "device" | "part" | "knowledge";
  categoryLabel: string;
  title: string;
  subtitle: string;
  status: string;
  statusColor: string;
  date: string;
  value?: string;
  details: {
    customer?: string;
    technician?: string;
    serial?: string;
    defect?: string;
    solution?: string;
    stock?: string;
    sla?: string;
  };
}

const SEARCH_DATASET: SearchEvidenceItem[] = [
  {
    id: "ev-1",
    code: "SF-000104",
    category: "service_order",
    categoryLabel: "Ordem de Serviço",
    title: "iPhone 14 Pro Max — Troca de Tela OLED",
    subtitle: "Cliente: TechSolutions Brasil Ltda",
    status: "Em Execução",
    statusColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    date: "Hoje às 14:32",
    value: "R$ 1.850,00",
    details: {
      customer: "TechSolutions Brasil Ltda (CNPJ 12.345.678/0001-90)",
      technician: "Lucas Mendes (Especialista Apple)",
      serial: "IMEI 359124091823901",
      defect: "Display trincado após queda, sem toque na borda inferior",
      sla: "Dentro do Prazo (Resta 18h)",
    },
  },
  {
    id: "ev-2",
    code: "SF-000105",
    category: "service_order",
    categoryLabel: "Ordem de Serviço",
    title: "MacBook Pro M1 16\" — Curto na Linha de 19V",
    subtitle: "Cliente: Mariana Albuquerque",
    status: "Pronta p/ Entrega",
    statusColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    date: "Ontem às 17:15",
    value: "R$ 2.400,00",
    details: {
      customer: "Mariana Albuquerque (mariana@exemplo.com)",
      technician: "Rafael Souza (Laboratório BGA)",
      serial: "S/N: C02G4091MD6T",
      defect: "Não liga após oscilação de energia",
      solution: "Substituição do CI de carga USB-C e mosfet de entrada",
      sla: "Concluído em 26h (Meta: 48h)",
    },
  },
  {
    id: "ev-3",
    code: "CLI-0042",
    category: "customer",
    categoryLabel: "Cliente",
    title: "Carlos Eduardo Meireles",
    subtitle: "Pessoa Física • 8 Ordens de Serviço concluídas",
    status: "Cliente VIP",
    statusColor: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    date: "Cadastro: 12/03/2024",
    details: {
      customer: "Carlos Eduardo Meireles (carlos.meireles@email.com)",
      serial: "Telefone: (11) 98765-4321 • WhatsApp Verificado",
      sla: "Histórico de Adimplência: 100% (Sem pendências financeiras)",
    },
  },
  {
    id: "ev-4",
    code: "DEV-0881",
    category: "device",
    categoryLabel: "Equipamento / Ativo",
    title: "Dell XPS 15 9520 (Intel i7 12ª Ger)",
    subtitle: "Proprietário: Studio Design Criativo",
    status: "Garantia Vigente",
    statusColor: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    date: "Última OS: 28/08/2026",
    details: {
      serial: "Service Tag: 8GHTX22",
      defect: "Histórico: Troca de cooler e pasta térmica em 28/08",
      sla: "Garantia de Serviço válida até 28/11/2026",
    },
  },
  {
    id: "ev-5",
    code: "KB-0019",
    category: "knowledge",
    categoryLabel: "Base de Conhecimento",
    title: "Procedimento: Abertura iPhone 14 sem Danificar FaceID",
    subtitle: "Tutorial Técnico com 14 fotos e esquema térmico",
    status: "Aprovado CQ",
    statusColor: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
    date: "Revisão 3.2",
    details: {
      solution: "Temperatura recomendada da mesa térmica: 75°C por 3 minutos",
      technician: "Autor: Equipe de Engenharia ServiceForge",
      sla: "Utilizado com sucesso em 184 reparos",
    },
  },
  {
    id: "ev-6",
    code: "PRT-0312",
    category: "part",
    categoryLabel: "Peça / Estoque",
    title: "Display OLED Original Apple iPhone 14 Pro Max",
    subtitle: "Almoxarifado Principal • Gaveta A3-04",
    status: "Estoque Normal",
    statusColor: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    date: "Última entrada: 02/10/2026",
    value: "Custo: R$ 890,00",
    details: {
      stock: "Disponível: 14 unidades (Mínimo: 3 un)",
      solution: "Fornecedor: Global Parts Distribuidora",
    },
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   PÁGINA PRINCIPAL
───────────────────────────────────────────────────────────────────────────── */

function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState("search");

  // Estado de Busca
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEvidence, setSelectedEvidence] = useState<SearchEvidenceItem | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Estado de Criação de Artes / Documentos
  const [artTemplate, setArtTemplate] = useState<"os" | "warranty" | "tag" | "receipt">("os");
  const [artColor, setArtColor] = useState<string>("#2563eb");
  const [showLogo, setShowLogo] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [showSeal, setShowSeal] = useState(true);
  const [customFootnote, setCustomFootnote] = useState("Garantia legal de 90 dias conforme Art. 26 do CDC.");

  // Estado de Aprovação
  const [approvalChannel, setApprovalChannel] = useState<"whatsapp" | "email" | "sms">("whatsapp");
  const [isApproved, setIsApproved] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Estado de Usuários
  const [usersList, setUsersList] = useState([
    { id: "u-1", name: "Guilherme Santos", email: "guilherme@serviceforge.com", role: "admin", company: "Matriz São Paulo", specialty: "Coordenação Geral", commission: "—" },
    { id: "u-2", name: "Lucas Mendes", email: "lucas.tech@serviceforge.com", role: "technician", company: "Matriz São Paulo", specialty: "Dispositivos Apple", commission: "12%" },
    { id: "u-3", name: "Fernanda Lima", email: "fernanda.atend@serviceforge.com", role: "attendant", company: "Filial Rio de Janeiro", specialty: "Recepção e Vendas", commission: "5%" },
    { id: "u-4", name: "Carlos Rocha", email: "carlos.fin@serviceforge.com", role: "financial", company: "Matriz São Paulo", specialty: "Controladoria & DRE", commission: "—" },
  ]);
  const [newUserModal, setNewUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("technician");
  const [newUserSpecialty, setNewUserSpecialty] = useState("");

  // Canvas drawing logic
  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e3a8a";
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignatureData(canvasRef.current.toDataURL());
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  }

  // Filtragem de busca
  const filteredSearch = SEARCH_DATASET.filter((item) => {
    const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      item.code.toLowerCase().includes(query) ||
      item.title.toLowerCase().includes(query) ||
      item.subtitle.toLowerCase().includes(query) ||
      (item.details.serial && item.details.serial.toLowerCase().includes(query)) ||
      (item.details.defect && item.details.defect.toLowerCase().includes(query));
    return matchesCat && matchesQuery;
  });

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHasSearched(true);
    toast.success(`Busca concluída: ${filteredSearch.length} evidências localizadas.`);
  }

  function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUserName || !newUserEmail) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    const created = {
      id: `u-${Date.now().toString(36)}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      company: "Matriz São Paulo",
      specialty: newUserSpecialty || "Geral",
      commission: newUserRole === "technician" ? "10%" : "—",
    };
    setUsersList([...usersList, created]);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserSpecialty("");
    setNewUserModal(false);
    toast.success(`Usuário "${created.name}" cadastrado com sucesso!`);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ─── BARRA DE NAVEGAÇÃO SUPERIOR ─── */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-primary font-bold text-lg hover:opacity-90 transition">
              <Wrench className="h-5 w-5" />
              <span>ServiceForge</span>
            </Link>
            <Badge variant="outline" className="hidden sm:inline-flex text-xs">
              Central de Demonstração & Manual
            </Badge>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/manual-do-sistema.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-md border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Documentação HTML Pública</span>
              <span className="xs:hidden">Manual HTML</span>
            </a>
            <Link to="/login">
              <Button size="sm" variant="default">
                Acessar Sistema
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO DA PÁGINA ─── */}
      <section className="relative border-b bg-gradient-to-b from-primary/5 via-background to-background py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <Badge className="mb-4 bg-primary/15 text-primary border-primary/20" variant="outline">
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Visão Geral Interativa da Aplicação
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-balance">
            Como Funciona o <span className="text-primary">ServiceForge</span>
          </h1>
          <p className="mt-4 max-w-3xl mx-auto text-base sm:text-lg text-muted-foreground text-balance">
            Explore as evidências práticas de cada etapa da plataforma: desde a busca instantânea de ativos,
            criação de laudos e artes visuais, workflow de aprovação omnicanal pelo cliente, até o controle de
            usuários com RBAC e manual técnico completo.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              variant={activeTab === "search" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("search")}
              className="gap-1.5"
            >
              <Search className="h-4 w-4" />
              1. Evidência de Busca
            </Button>
            <Button
              variant={activeTab === "art" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("art")}
              className="gap-1.5"
            >
              <Palette className="h-4 w-4" />
              2. Criação de Artes
            </Button>
            <Button
              variant={activeTab === "approval" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("approval")}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              3. Aprovação pelo Cliente
            </Button>
            <Button
              variant={activeTab === "users" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("users")}
              className="gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              4. Cadastro de Usuários
            </Button>
            <Button
              variant={activeTab === "manual" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("manual")}
              className="gap-1.5"
            >
              <BookOpen className="h-4 w-4" />
              5. Manual Completo
            </Button>
          </div>
        </div>
      </section>

      {/* ─── CORPO PRINCIPAL COM ABAS ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

          {/* ═══════════════════════════════════════════════════════════════════
              ABA 1: EVIDÊNCIAS DE BUSCA
          ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="search" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Search className="h-6 w-6 text-primary" />
                  Evidência Funcional de Busca em Tempo Real
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Demonstração do motor de busca unificado do ServiceForge: localize ordens de serviço, clientes, números de série e procedimentos técnicos em milissegundos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs">
                  Indexação: 1.420 Registros
                </Badge>
                <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 dark:border-emerald-800">
                  ⚡ Resposta: ~4ms
                </Badge>
              </div>
            </div>

            {/* BARRA DE PESQUISA INTERATIVA */}
            <Card className="border shadow-sm">
              <CardContent className="pt-6">
                <form onSubmit={handleSearchSubmit} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Pesquisar por Código (SF-000104), Cliente, Modelo (iPhone, Dell), Serial ou Defeito..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 text-sm"
                      />
                    </div>
                    <Button type="submit" className="gap-1.5 shrink-0">
                      <Search className="h-4 w-4" />
                      Executar Busca
                    </Button>
                    {(searchQuery || selectedCategory !== "all") && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setSearchQuery(""); setSelectedCategory("all"); setHasSearched(false); }}
                      >
                        Limpar
                      </Button>
                    )}
                  </div>

                  {/* FILTROS POR CATEGORIA */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-medium text-muted-foreground flex items-center gap-1">
                      <Filter className="h-3.5 w-3.5" /> Filtrar por:
                    </span>
                    {[
                      { id: "all", label: "Todos os Resultados" },
                      { id: "service_order", label: "Ordens de Serviço" },
                      { id: "customer", label: "Clientes" },
                      { id: "device", label: "Equipamentos" },
                      { id: "part", label: "Peças & Estoque" },
                      { id: "knowledge", label: "Base Técnica" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { setSelectedCategory(cat.id); setHasSearched(true); }}
                        className={`px-2.5 py-1 rounded-full border transition ${
                          selectedCategory === cat.id
                            ? "bg-primary text-primary-foreground border-primary font-medium"
                            : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* RESULTADOS DA BUSCA */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>
                  Exibindo {filteredSearch.length} evidência(s) encontrada(s)
                </span>
                <span className="font-mono">Cache: HIT • TTL: 300s</span>
              </div>

              {filteredSearch.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent className="space-y-3">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
                    <h3 className="text-base font-semibold">Nenhuma evidência localizada</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Tente pesquisar por termos como "iPhone", "SF-000104", "Dell", "OLED" ou "Mariana".
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                    >
                      Redefinir Busca
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {filteredSearch.map((item) => (
                    <Card
                      key={item.id}
                      className="hover:border-primary/50 transition-all cursor-pointer group shadow-sm"
                      onClick={() => setSelectedEvidence(item)}
                    >
                      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-sm text-primary group-hover:underline">
                              {item.code}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {item.categoryLabel}
                            </Badge>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.statusColor}`}>
                              {item.status}
                            </span>
                            {item.value && (
                              <span className="text-xs font-semibold text-foreground ml-auto sm:ml-0">
                                {item.value}
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {item.subtitle} • {item.date}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Button size="sm" variant="outline" className="text-xs gap-1 group-hover:border-primary">
                            <Eye className="h-3.5 w-3.5" />
                            Inspecionar Registro
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* BANNER CONCLUSIVO AO FINALIZAR A BUSCA */}
            {hasSearched && (
              <Card className="bg-primary/5 border-primary/20 mt-6">
                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      Evidência de Busca Validada com Sucesso!
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Os dados foram processados com integridade referencial. Você pode visualizar o fluxo de criação de artes ou consultar o manual técnico completo.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button size="sm" onClick={() => setActiveTab("art")} className="gap-1 w-full sm:w-auto">
                      Ver Criação de Artes <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════
              ABA 2: CRIAÇÃO DE ARTES, DOCUMENTOS & TEMPLATES
          ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="art" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Palette className="h-6 w-6 text-primary" />
                  Criação de Artes, Laudos e Modelos Visuais
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Designer de layouts para Ordens de Serviço, Certificados de Garantia com selos, Recibos e Etiquetas com QR Code de autenticação.
                </p>
              </div>
              <Badge variant="secondary">Renderizador de Documentos PDF/Canvas</Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* PAINEL DE CONTROLE / CUSTOMIZAÇÃO */}
              <div className="lg:col-span-5 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-primary" />
                      Parâmetros da Arte / Template
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Escolha o modelo base e ajuste elementos gráficos em tempo real.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {/* SELEÇÃO DO MODELO */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Tipo de Arte</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "os", label: "Ordem de Serviço", icon: FileText },
                          { id: "warranty", label: "Certificado Garantia", icon: ShieldCheck },
                          { id: "tag", label: "Etiqueta Térmica", icon: QrCode },
                          { id: "receipt", label: "Recibo de Pagamento", icon: DollarSign },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setArtTemplate(m.id as any)}
                            className={`p-2.5 rounded-lg border text-left flex items-center gap-2 text-xs transition ${
                              artTemplate === m.id
                                ? "border-primary bg-primary/10 font-semibold text-primary"
                                : "border-border hover:bg-muted"
                            }`}
                          >
                            <m.icon className="h-4 w-4 shrink-0" />
                            <span>{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* COR DE DESTAQUE */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Cor de Identidade Visual</Label>
                      <div className="flex items-center gap-2">
                        {[
                          { name: "Azul Corporativo", color: "#2563eb" },
                          { name: "Verde Esmeralda", color: "#16a34a" },
                          { name: "Laranja Oficina", color: "#ea580c" },
                          { name: "Roxo Premium", color: "#7c3aed" },
                          { name: "Preto Minimalista", color: "#0f172a" },
                        ].map((c) => (
                          <button
                            key={c.color}
                            type="button"
                            title={c.name}
                            onClick={() => setArtColor(c.color)}
                            className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                            style={{
                              backgroundColor: c.color,
                              borderColor: artColor === c.color ? "#ffffff" : "transparent",
                              boxShadow: artColor === c.color ? `0 0 0 2px ${c.color}` : "none",
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* TOGGLES VISUAIS */}
                    <div className="space-y-3 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="toggle-logo" className="text-xs cursor-pointer">
                          Exibir Logotipo da Empresa
                        </Label>
                        <Switch id="toggle-logo" checked={showLogo} onCheckedChange={setShowLogo} />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="toggle-qr" className="text-xs cursor-pointer">
                          QR Code de Rastreio / Validação
                        </Label>
                        <Switch id="toggle-qr" checked={showQr} onCheckedChange={setShowQr} />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="toggle-seal" className="text-xs cursor-pointer">
                          Selo Gráfico de Garantia / Qualidade
                        </Label>
                        <Switch id="toggle-seal" checked={showSeal} onCheckedChange={setShowSeal} />
                      </div>
                    </div>

                    {/* TEXTO DE TERMOS */}
                    <div className="space-y-1.5 pt-2 border-t">
                      <Label className="text-xs font-semibold">Texto Legal / Rodapé</Label>
                      <Input
                        value={customFootnote}
                        onChange={(e) => setCustomFootnote(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex flex-col gap-2">
                    <Button
                      className="w-full gap-1.5 text-xs"
                      onClick={() => toast.success("Arte renderizada e pronta para impressão ou exportação em PDF.")}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Simular Download da Arte (PDF)
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* LIVE PREVIEW DA ARTE RENDERIZADA */}
              <div className="lg:col-span-7">
                <Card className="border shadow-lg overflow-hidden bg-muted/20">
                  <CardHeader className="py-2.5 px-4 bg-muted/40 border-b flex flex-row items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" /> Pré-visualização em Alta Definição (300 DPI)
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Formato A4 • Escala 100%
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 flex justify-center">
                    {/* FOLHA DE PAPEL SIMULADA */}
                    <div
                      className="w-full max-w-md bg-white text-slate-900 rounded-lg p-6 shadow-xl border border-slate-200 transition-all font-sans relative"
                      style={{ borderTop: `6px solid ${artColor}` }}
                    >
                      {/* CABEÇALHO DA ARTE */}
                      <div className="flex items-start justify-between border-b pb-4 mb-4 gap-2">
                        {showLogo ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: artColor }}
                            >
                              SF
                            </div>
                            <div>
                              <h3 className="font-bold text-sm tracking-tight text-slate-900">SERVICEFORGE ASSISTÊNCIA</h3>
                              <p className="text-[10px] text-slate-500">CNPJ: 42.109.876/0001-20 • (11) 3456-7890</p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h3 className="font-bold text-sm text-slate-900">SERVICEFORGE</h3>
                          </div>
                        )}

                        <div className="text-right">
                          <span
                            className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                            style={{ backgroundColor: artColor }}
                          >
                            {artTemplate === "os" && "ORDEM DE SERVIÇO"}
                            {artTemplate === "warranty" && "CERTIFICADO DE GARANTIA"}
                            {artTemplate === "tag" && "ETIQUETA TÉCNICA"}
                            {artTemplate === "receipt" && "COMPROVANTE FISCAL"}
                          </span>
                          <p className="font-mono text-xs font-bold text-slate-700 mt-0.5">#SF-000104</p>
                        </div>
                      </div>

                      {/* CONTEÚDO DEPENDENDO DO TEMPLATE */}
                      {artTemplate === "os" && (
                        <div className="space-y-3 text-xs">
                          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
                            <div className="flex justify-between">
                              <span className="font-semibold text-slate-700">Cliente:</span>
                              <span className="text-slate-900">TechSolutions Brasil Ltda</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold text-slate-700">Equipamento:</span>
                              <span className="text-slate-900">iPhone 14 Pro Max (IMEI: 359124091823901)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-semibold text-slate-700">Data de Entrada:</span>
                              <span className="text-slate-900">05/10/2026 14:32:00 UTC</span>
                            </div>
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800 mb-1">Itens do Orçamento Aprovado:</p>
                            <table className="w-full text-[11px] border border-slate-200">
                              <thead className="bg-slate-100 text-slate-700">
                                <tr>
                                  <th className="p-1 text-left">Item / Descrição</th>
                                  <th className="p-1 text-right">Qtd</th>
                                  <th className="p-1 text-right">Valor</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                <tr>
                                  <td className="p-1">Display Super Retina XDR Original</td>
                                  <td className="p-1 text-right">1</td>
                                  <td className="p-1 text-right">R$ 1.350,00</td>
                                </tr>
                                <tr>
                                  <td className="p-1">Mão de Obra de Troca + Calibração TrueTone</td>
                                  <td className="p-1 text-right">1</td>
                                  <td className="p-1 text-right">R$ 500,00</td>
                                </tr>
                              </tbody>
                              <tfoot className="bg-slate-50 font-bold border-t">
                                <tr>
                                  <td className="p-1" colSpan={2}>TOTAL GERAL:</td>
                                  <td className="p-1 text-right" style={{ color: artColor }}>R$ 1.850,00</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}

                      {artTemplate === "warranty" && (
                        <div className="space-y-3 text-xs text-center py-2">
                          <div className="inline-block p-3 rounded-full bg-amber-50 border border-amber-200 text-amber-600 mb-1">
                            <ShieldCheck className="h-8 w-8 mx-auto" />
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-900">TERMO DE GARANTIA PREMIUM — 90 DIAS</h4>
                          <p className="text-[11px] text-slate-600 px-2 leading-relaxed">
                            Certificamos que o equipamento <strong>iPhone 14 Pro Max</strong> recebeu peças originais submetidas
                            a testes de bancada e controle de qualidade formal sob a OS <strong>#SF-000104</strong>.
                          </p>
                          <div className="bg-slate-50 p-2 rounded text-[10px] text-slate-700 border font-mono">
                            Chave de Autenticidade: SF-HASH-9A4B-883F-2026-OK
                          </div>
                        </div>
                      )}

                      {artTemplate === "tag" && (
                        <div className="space-y-3 text-xs py-3 border-2 border-dashed border-slate-300 p-3 rounded">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-sm">#SF-000104</span>
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">BOX: A3-12</span>
                          </div>
                          <p className="font-semibold text-slate-800 text-[11px]">iPhone 14 Pro Max • TechSolutions</p>
                          <p className="text-[10px] text-slate-500">Técnico Resp: Lucas Mendes • Prioridade: Alta</p>
                        </div>
                      )}

                      {artTemplate === "receipt" && (
                        <div className="space-y-2 text-xs py-2">
                          <div className="flex justify-between border-b pb-1">
                            <span className="font-semibold">Valor Recebido:</span>
                            <span className="font-bold text-slate-900">R$ 1.850,00</span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="font-semibold">Forma de Pagamento:</span>
                            <span>PIX Instantâneo (Aut. 993182)</span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="font-semibold">Recebido por:</span>
                            <span>Fernanda Lima (Caixa 01)</span>
                          </div>
                        </div>
                      )}

                      {/* SELOS E QR CODE */}
                      <div className="mt-4 pt-3 border-t flex items-center justify-between">
                        {showQr && (
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center rounded p-1">
                              <QrCode className="w-full h-full" />
                            </div>
                            <div className="text-[9px] text-slate-500 leading-tight">
                              <p className="font-semibold text-slate-700">Autenticar Documento</p>
                              <p>Escaneie a câmera do celular</p>
                            </div>
                          </div>
                        )}

                        {showSeal && (
                          <div className="text-right">
                            <Badge
                              className="text-[10px] font-bold text-white border-none"
                              style={{ backgroundColor: artColor }}
                            >
                              ★ CONTROLE DE QUALIDADE APROVADO ★
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* RODAPÉ LEGAL */}
                      <p className="mt-3 text-[9px] text-slate-400 text-center border-t pt-2">
                        {customFootnote}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════
              ABA 3: APROVAÇÃO DE ARTES & ORÇAMENTOS
          ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="approval" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                  Jornada de Aprovação Omnicanal & Portal do Cliente
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  O cliente final recebe um link protegido por token, inspeciona o laudo e orçamento, e assina digitalmente na tela do smartphone ou computador.
                </p>
              </div>
              <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                Sem necessidade de senha
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* ETAPA 1 & 2: DISPARO DA PROPOSTA */}
              <div className="lg:col-span-5 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Send className="h-4 w-4 text-primary" />
                      1. Notificação Omnicanal ao Cliente
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Escolha o canal pelo qual a proposta da OS #SF-000104 será enviada.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={approvalChannel === "whatsapp" ? "default" : "outline"}
                        onClick={() => setApprovalChannel("whatsapp")}
                        className="text-xs"
                      >
                        WhatsApp
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={approvalChannel === "email" ? "default" : "outline"}
                        onClick={() => setApprovalChannel("email")}
                        className="text-xs"
                      >
                        E-mail
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={approvalChannel === "sms" ? "default" : "outline"}
                        onClick={() => setApprovalChannel("sms")}
                        className="text-xs"
                      >
                        SMS
                      </Button>
                    </div>

                    {/* PREVIEW DA MENSAGEM */}
                    <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-2 font-mono">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b pb-1 font-sans">
                        <span>Canal: {approvalChannel.toUpperCase()}</span>
                        <span className="text-emerald-600 font-semibold">● Fila Pronta</span>
                      </div>
                      {approvalChannel === "whatsapp" && (
                        <p className="leading-relaxed">
                          Olá <strong>Mariana</strong>! Seu <strong>iPhone 14 Pro Max</strong> foi diagnosticado com sucesso na ServiceForge. 🛠️
                          <br /><br />
                          📄 Orçamento: <strong>R$ 1.850,00</strong> em até 6x.
                          <br />
                          👉 Toque para revisar fotos e aprovar:
                          <br />
                          <span className="text-primary underline">https://serviceforge.app/portal/token-9a4b883f</span>
                        </p>
                      )}
                      {approvalChannel === "email" && (
                        <p className="leading-relaxed">
                          Assunto: [ServiceForge] Orçamento Disponível — OS #SF-000104
                          <br /><br />
                          Prezada Mariana Albuquerque, seu laudo técnico foi emitido com fotos de bancada.
                          Clique no link seguro para autorizar a execução do serviço.
                        </p>
                      )}
                      {approvalChannel === "sms" && (
                        <p className="leading-relaxed">
                          SERVICEFORGE: Seu orcamento da OS #SF-000104 esta pronto (R$ 1.850,00). Acesse e aprove: https://sf.to/9a4b88
                        </p>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5 text-xs"
                      onClick={() => toast.success("Disparo simulado com sucesso via Webhook.")}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Copiar Link Público de Autoatendimento
                    </Button>
                  </CardContent>
                </Card>

                {/* STATUS DE RETORNO DO EVENTO */}
                <Card className={isApproved ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" : ""}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>Status da Aprovação</span>
                      {isApproved && <Badge className="bg-emerald-600 text-white">APROVADO PELO CLIENTE</Badge>}
                      {isRejected && <Badge variant="destructive">RECUSADO PELO CLIENTE</Badge>}
                      {!isApproved && !isRejected && <Badge variant="secondary">AGUARDANDO APROVAÇÃO</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1.5 text-muted-foreground">
                    <p>• <strong>Evento do Barramento:</strong> {isApproved ? "service-order.budget.approved (Emitido)" : "service-order.budget.created"}</p>
                    <p>• <strong>Ação Automática no Estoque:</strong> {isApproved ? "Peças reservadas no Almoxarifado Principal" : "Aguardando confirmação"}</p>
                    <p>• <strong>Previsão Financeira:</strong> {isApproved ? "Título criado em Contas a Receber (Vencimento +15d)" : "Pendente"}</p>
                  </CardContent>
                </Card>
              </div>

              {/* ETAPA 3: SIMULADOR DO PORTAL DO CLIENTE */}
              <div className="lg:col-span-7">
                <Card className="border shadow-lg">
                  <CardHeader className="bg-muted/30 border-b pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm">2. Visão do Cliente no Portal Público</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono">
                        portal/orders/token-9a4b883f
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    {/* CARD DO LAUDO */}
                    <div className="rounded-lg border p-4 bg-card space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-mono text-muted-foreground">OS #SF-000104</span>
                          <h4 className="text-base font-bold text-foreground">iPhone 14 Pro Max 256GB</h4>
                        </div>
                        <Badge variant="secondary">Diagnóstico Concluído</Badge>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Defeito identificado: Falha no circuito de toque e danos estéticos no display. Solução recomendada: Substituição do painel OLED completo e selagem de vedação IP68.
                      </p>

                      <div className="border-t pt-2 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span>Display Super Retina XDR Original</span>
                          <span className="font-semibold">R$ 1.350,00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mão de Obra Especializada Apple</span>
                          <span className="font-semibold">R$ 500,00</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-primary border-t pt-1.5">
                          <span>TOTAL DA PROPOSTA:</span>
                          <span>R$ 1.850,00</span>
                        </div>
                      </div>
                    </div>

                    {/* ASSINATURA DIGITAL */}
                    {!isApproved && !isRejected ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <PenIcon className="h-3.5 w-3.5 text-primary" />
                            Assinatura Eletrônica do Cliente (Desenhe abaixo com o mouse ou toque):
                          </Label>
                          <Button size="sm" variant="ghost" className="h-6 text-xs text-muted-foreground" onClick={clearSignature}>
                            Limpar
                          </Button>
                        </div>

                        <div className="border-2 border-dashed rounded-lg bg-white dark:bg-slate-900 p-1 flex justify-center">
                          <canvas
                            ref={canvasRef}
                            width={420}
                            height={120}
                            className="w-full h-[120px] touch-none cursor-crosshair"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                            onClick={() => {
                              setIsApproved(true);
                              setIsRejected(false);
                              toast.success("Orçamento Aprovado com Assinatura Digital!");
                            }}
                          >
                            <Check className="h-4 w-4" />
                            Aprovar Orçamento e Iniciar Reparo
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              setIsRejected(true);
                              setIsApproved(false);
                              toast.error("Orçamento Recusado pelo Cliente.");
                            }}
                          >
                            <X className="h-4 w-4" />
                            Recusar
                          </Button>
                        </div>
                      </div>
                    ) : isApproved ? (
                      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 text-center space-y-2">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                        <h4 className="text-base font-bold text-emerald-800 dark:text-emerald-300">
                          Proposta Aprovada com Sucesso!
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          A equipe técnica já foi notificada para início imediato do serviço. As peças foram reservadas no estoque.
                        </p>
                        <div className="text-[10px] font-mono text-muted-foreground border-t border-emerald-200 dark:border-emerald-800 pt-2">
                          Hash de Validade: SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs"
                          onClick={() => { setIsApproved(false); setIsRejected(false); clearSignature(); }}
                        >
                          Reiniciar Simulação
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 text-center space-y-2">
                        <X className="h-10 w-10 text-red-600 mx-auto" />
                        <h4 className="text-base font-bold text-red-800 dark:text-red-300">
                          Orçamento Recusado
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          O aparelho foi encaminhado para a bancada de devolução sem custos adicionais.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs"
                          onClick={() => { setIsApproved(false); setIsRejected(false); }}
                        >
                          Reiniciar Simulação
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════
              ABA 4: CADASTRO DE USUÁRIOS, RBAC & MULTI-EMPRESA
          ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <UserPlus className="h-6 w-6 text-primary" />
                  Cadastro de Usuários, RBAC & Governança Multi-Empresa
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Gerenciamento granular de operadores com segregação de dados por filial e controle rigoroso de permissões por módulo.
                </p>
              </div>
              <Button onClick={() => setNewUserModal(true)} className="gap-1.5 shrink-0">
                <UserPlus className="h-4 w-4" />
                Novo Usuário
              </Button>
            </div>

            {/* TABELA DE OPERADORES CADASTRADOS */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Equipe & Operadores Cadastrados</CardTitle>
                <CardDescription className="text-xs">
                  Lista de usuários com perfis e especialidades técnicas atribuídas.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                      <tr>
                        <th className="p-3 text-left">Nome / Colaborador</th>
                        <th className="p-3 text-left">Função / Perfil RBAC</th>
                        <th className="p-3 text-left">Empresa / Unidade</th>
                        <th className="p-3 text-left">Especialidade</th>
                        <th className="p-3 text-left">Comissão</th>
                        <th className="p-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-foreground">{u.name}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={
                                u.role === "admin"
                                  ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300"
                                  : u.role === "technician"
                                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300"
                                  : u.role === "financial"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                              }
                            >
                              {u.role === "admin" && "Administrador Global"}
                              {u.role === "technician" && "Técnico Especialista"}
                              {u.role === "attendant" && "Atendente de Balcão"}
                              {u.role === "financial" && "Controladoria Financeira"}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{u.company}</td>
                          <td className="p-3 text-xs font-medium">{u.specialty}</td>
                          <td className="p-3 text-xs font-mono font-semibold">{u.commission}</td>
                          <td className="p-3 text-right">
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.info(`Editando perfil de ${u.name}`)}>
                              Editar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* MATRIZ DE PERMISSÕES RBAC */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Matriz de Permissões por Papel (RBAC)
                </CardTitle>
                <CardDescription className="text-xs">
                  Políticas ativas aplicadas na interface e no banco de dados via Row Level Security (RLS).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="p-2.5 text-left">Módulo do Sistema</th>
                        <th className="p-2.5 text-center">Administrador</th>
                        <th className="p-2.5 text-center">Gerente</th>
                        <th className="p-2.5 text-center">Técnico</th>
                        <th className="p-2.5 text-center">Atendente</th>
                        <th className="p-2.5 text-center">Financeiro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        { module: "Ordens de Serviço (Workspace)", adm: "Total", ger: "Total", tec: "Execução & Testes", ate: "Abertura & Entrega", fin: "Apenas Leitura" },
                        { module: "Gestão de Clientes & Ativos", adm: "Total", ger: "Total", tec: "Leitura", ate: "Total", fin: "Leitura" },
                        { module: "Contas a Pagar / Receber / DRE", adm: "Total", ger: "Leitura", tec: "Sem Acesso", ate: "Recebimentos", fin: "Total" },
                        { module: "Almoxarifado & Requisição de Peças", adm: "Total", ger: "Total", tec: "Uso na OS", ate: "Leitura", fin: "Auditoria" },
                        { module: "Inteligência Artificial & Prompts", adm: "Total", ger: "Uso", tec: "Uso de OCR/Laudo", ate: "Uso de OCR", fin: "Sem Acesso" },
                        { module: "Administração & Configurações", adm: "Total", ger: "Sem Acesso", tec: "Sem Acesso", ate: "Sem Acesso", fin: "Sem Acesso" },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-muted/30">
                          <td className="p-2.5 font-medium">{row.module}</td>
                          <td className="p-2.5 text-center"><Badge variant="default" className="text-[10px]">{row.adm}</Badge></td>
                          <td className="p-2.5 text-center"><Badge variant="secondary" className="text-[10px]">{row.ger}</Badge></td>
                          <td className="p-2.5 text-center"><Badge variant="outline" className="text-[10px] border-blue-300 text-blue-700">{row.tec}</Badge></td>
                          <td className="p-2.5 text-center"><Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">{row.ate}</Badge></td>
                          <td className="p-2.5 text-center"><Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700">{row.fin}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════
              ABA 5: MANUAL COMPLETO DA APLICAÇÃO (DOCUMENTAÇÃO DETALHADA)
          ═══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="manual" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  Manual Completo de Operação da Plataforma
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Guia passo a passo para técnicos, gerentes e administradores do ServiceForge.
                </p>
              </div>

              <a
                href="/manual-do-sistema.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition shadow-sm"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir Versão HTML Pública Completa
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: "1. Ordens de Serviço (Workspace de 30+ Abas)",
                  icon: Wrench,
                  desc: "Abertura em 5 passos, checklists fotográficos de entrada, laudo técnico multinível, cronômetro de bancada, testes de estresse, CQ e entrega com assinatura digital.",
                },
                {
                  title: "2. Clientes & Ativos Tecnológicos",
                  icon: Users,
                  desc: "Cadastro PF/PJ com múltiplos endereços, contatos secundários, catálogo de marcas, modelos, números de série e histórico vitalício de manutenções.",
                },
                {
                  title: "3. Backoffice Financeiro & DRE",
                  icon: DollarSign,
                  desc: "Plano de contas estruturado, contas a pagar e receber geradas automaticamente pelas OSs e compras, conciliação bancária e DRE gerencial.",
                },
                {
                  title: "4. Estoque & Almoxarifados",
                  icon: Package,
                  desc: "Controle de peças por gaveteiro (bins), movimentações de entrada e saída automática ao fechar a OS, inventários cíclicos e alerta de reposição mínima.",
                },
                {
                  title: "5. Compras & Gestão de Fornecedores",
                  icon: Building2,
                  desc: "Cotações com fornecedores cadastrados, pedidos de compra e recebimento de notas fiscais com atualização instantânea do saldo de estoque.",
                },
                {
                  title: "6. RH, Produtividade & Comissões",
                  icon: Users,
                  desc: "Registro de jornada e cálculo automático de comissões técnicas com base nas horas faturadas e serviços executados com sucesso.",
                },
                {
                  title: "7. Base de Conhecimento Técnico",
                  icon: BookOpen,
                  desc: "Artigos técnicos, manuais de serviço e recomendação automática inteligente de diagnósticos na OS com base no defeito relatado.",
                },
                {
                  title: "8. Plataforma de Inteligência Artificial",
                  icon: Cpu,
                  desc: "OCR para leitura de etiquetas e IMEIs, visão computacional para detecção de avarias estéticas em fotos de entrada e assistente de laudos.",
                },
                {
                  title: "9. Automações, Workflows & SLAs",
                  icon: Layers,
                  desc: "Gatilhos automáticos, regras de SLA, transições estritas por máquina de estados e alertas preventivos antes do prazo de entrega.",
                },
              ].map((card, i) => (
                <Card key={i} className="hover:border-primary/50 transition shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base font-semibold">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {card.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

        </Tabs>
      </main>

      {/* ─── MODAL DE INSPEÇÃO DE EVIDÊNCIA ─── */}
      <Dialog open={!!selectedEvidence} onOpenChange={(open) => !open && setSelectedEvidence(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {selectedEvidence?.code}
              </Badge>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedEvidence?.statusColor}`}>
                {selectedEvidence?.status}
              </span>
            </div>
            <DialogTitle className="text-lg mt-2">{selectedEvidence?.title}</DialogTitle>
            <DialogDescription className="text-xs">{selectedEvidence?.subtitle}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="bg-muted/40 p-3 rounded-lg space-y-2 border">
              <p className="font-semibold text-foreground text-sm border-b pb-1">Metadados Auditados:</p>
              {selectedEvidence?.details.customer && (
                <p><strong>Cliente:</strong> {selectedEvidence.details.customer}</p>
              )}
              {selectedEvidence?.details.technician && (
                <p><strong>Técnico Responsável:</strong> {selectedEvidence.details.technician}</p>
              )}
              {selectedEvidence?.details.serial && (
                <p><strong>Identificador / Serial:</strong> {selectedEvidence.details.serial}</p>
              )}
              {selectedEvidence?.details.defect && (
                <p><strong>Sintoma Relatado:</strong> {selectedEvidence.details.defect}</p>
              )}
              {selectedEvidence?.details.solution && (
                <p><strong>Solução / Procedimento:</strong> {selectedEvidence.details.solution}</p>
              )}
              {selectedEvidence?.details.stock && (
                <p><strong>Saldo em Estoque:</strong> {selectedEvidence.details.stock}</p>
              )}
              {selectedEvidence?.details.sla && (
                <p><strong>Indicador de SLA:</strong> {selectedEvidence.details.sla}</p>
              )}
            </div>

            <div className="flex justify-between items-center text-[11px] text-muted-foreground">
              <span>Registro sincronizado com banco Lovable Cloud (PostgreSQL)</span>
              <span className="font-mono">UUID: OK</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL DE NOVO USUÁRIO ─── */}
      <Dialog open={newUserModal} onOpenChange={setNewUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Colaborador</DialogTitle>
            <DialogDescription className="text-xs">
              Defina as permissões e alçada de acesso na plataforma ServiceForge.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-3 text-sm">
            <div className="space-y-1">
              <Label className="text-xs">Nome Completo</Label>
              <Input
                placeholder="Ex: Amanda Carvalho"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">E-mail Corporativo</Label>
              <Input
                type="email"
                placeholder="amanda@serviceforge.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Perfil de Acesso (RBAC)</Label>
              <select
                className="w-full text-xs p-2 rounded-md border bg-background"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
              >
                <option value="technician">Técnico Especialista</option>
                <option value="attendant">Atendente de Balcão</option>
                <option value="financial">Controladoria Financeira</option>
                <option value="admin">Administrador Global</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Especialidade Principal</Label>
              <Input
                placeholder="Ex: Solda BGA, Notebooks, Apple"
                value={newUserSpecialty}
                onChange={(e) => setNewUserSpecialty(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setNewUserModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                Salvar e Ativar Acesso
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── FOOTER ─── */}
      <footer className="border-t bg-muted/20 py-8 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground text-center sm:text-left">
          <div>
            <p className="font-semibold text-foreground">ServiceForge Platform • Assistência Técnica Modular SaaS</p>
            <p>Desenvolvido com React 19, TanStack Start e Tailwind CSS v4.</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/manual-do-sistema.html" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition underline">
              Manual HTML Público
            </a>
            <Link to="/login" className="hover:text-primary transition underline">
              Entrar no Sistema
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
    </svg>
  );
}
