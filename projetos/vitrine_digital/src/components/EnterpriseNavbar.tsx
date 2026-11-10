import { useState, useMemo, useEffect } from "react";
import {
  Layers,
  Store,
  ScanText,
  ShieldCheck,
  Building2,
  Upload,
  LogOut,
  LogIn,
  Crown,
  UserCheck,
  User as UserIcon,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { IamGroup } from "@/lib/iam-types";
import { toast } from "sonner";

interface EnterpriseNavbarProps {
  currentView: "store" | "analyzer" | "iam";
  onNavigateView: (view: "store" | "analyzer" | "iam") => void;
  availableGroups: IamGroup[];
  pendingSubmissionsCount?: number;
  onOpenSubmitArt: () => void;
  onOpenAuthModal: (tab: "login" | "register") => void;
}

export function EnterpriseNavbar({
  currentView,
  onNavigateView,
  availableGroups,
  pendingSubmissionsCount = 0,
  onOpenSubmitArt,
  onOpenAuthModal,
}: EnterpriseNavbarProps) {
  const { user, isGlobalAdmin, isAnalyst, isConsumer, canApproveArts, activeGroup, setActiveGroupId, signOut } =
    useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fecha o menu lateral automaticamente ao redimensionar para desktop ou navegar
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Previne rolagem da página quando o drawer lateral estiver aberto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const activeGroupRemaining = useMemo(() => {
    if (!activeGroup) return null;
    const remaining = Number(activeGroup.quota_brl) - Number(activeGroup.used_brl);
    return Math.max(0, remaining).toFixed(2);
  }, [activeGroup]);

  function handleNavigate(view: "store" | "analyzer" | "iam") {
    onNavigateView(view);
    setIsMobileMenuOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#151413]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & Editorial Typography */}
          <div className="flex items-center gap-6 min-w-0">
            <button
              type="button"
              onClick={() => handleNavigate("store")}
              className="flex items-center gap-2.5 sm:gap-3 text-left focus:outline-none group cursor-pointer min-w-0"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#A88C5A]/35 bg-[#A88C5A]/10 text-[#C4A468] group-hover:border-[#A88C5A]/60 group-hover:bg-[#A88C5A]/20 transition-all">
                <Layers className="size-4.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-sm sm:text-base tracking-[0.16em] font-semibold text-[#FBF9F5] uppercase truncate">
                    Olivelas - Olivelas - Vitrine Digital & Analisador IA & Analisador IA
                  </span>
                  <span className="hidden sm:inline-block rounded bg-[#A88C5A]/15 border border-[#A88C5A]/30 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-[#C4A468] uppercase">
                    Editorial
                  </span>
                </div>
                <p className="hidden sm:block text-[9px] tracking-[0.2em] uppercase text-[#A8A199] font-medium">
                  Super Administrador • All In
                </p>
              </div>
            </button>

            {/* Desktop Segmented Navigation Tabs */}
            <nav className="hidden md:flex items-center rounded-xl border border-white/[0.08] bg-[#1C1A18]/90 p-1 text-xs">
              <button
                type="button"
                onClick={() => handleNavigate("store")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer ${
                  currentView === "store"
                    ? "bg-[#A88C5A] text-[#151413] shadow-sm font-bold"
                    : "text-[#A8A199] hover:text-[#FBF9F5] hover:bg-white/[0.04]"
                }`}
              >
                <Store className="size-3.5" />
                <span>Vitrine da Loja</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate("analyzer")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer ${
                  currentView === "analyzer"
                    ? "bg-[#A88C5A] text-[#151413] shadow-sm font-bold"
                    : "text-[#A8A199] hover:text-[#FBF9F5] hover:bg-white/[0.04]"
                }`}
              >
                <ScanText className="size-3.5" />
                <span>Analisador & OCR</span>
              </button>

              {canApproveArts && (
                <button
                  type="button"
                  onClick={() => handleNavigate("iam")}
                  className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer ${
                    currentView === "iam"
                      ? "bg-[#A88C5A] text-[#151413] shadow-sm font-bold"
                      : "text-[#A8A199] hover:text-[#FBF9F5] hover:bg-white/[0.04]"
                  }`}
                >
                  <ShieldCheck className="size-3.5" />
                  <span>{isGlobalAdmin ? "Gestão & IAM" : "Moderação"}</span>
                  {pendingSubmissionsCount > 0 && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-[#C4A468] text-[10px] font-bold text-[#151413]">
                      {pendingSubmissionsCount}
                    </span>
                  )}
                </button>
              )}

              <a
                href="/docs/manual.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium text-[#A8A199] hover:text-[#FBF9F5] hover:bg-white/[0.04] transition-all cursor-pointer"
                title="Abrir Manual Completo da Aplicação"
              >
                <BookOpen className="size-3.5 text-[#C4A468]" />
                <span>Manual</span>
              </a>
            </nav>
          </div>

          {/* Right Actions & Workspace Controls (Desktop) */}
          <div className="hidden md:flex items-center gap-2.5 sm:gap-3">
            {/* Seletor de Grupo/Workspace */}
            {availableGroups.length > 0 && (
              <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#1C1A18]/80 px-2.5 py-1.5 text-xs text-[#A8A199]">
                <Building2 className="size-3.5 text-[#A88C5A] shrink-0" />
                <select
                  value={activeGroup?.id || ""}
                  onChange={(e) => setActiveGroupId(e.target.value)}
                  className="bg-transparent text-xs text-[#FBF9F5] font-medium focus:outline-none cursor-pointer max-w-[150px] truncate"
                >
                  {availableGroups.map((g) => (
                    <option key={g.id} value={g.id} className="bg-[#1C1A18] text-[#FBF9F5]">
                      {g.name}
                    </option>
                  ))}
                </select>
                {activeGroupRemaining !== null && (
                  <span className="font-mono text-[10px] rounded bg-[#768F6E]/15 border border-[#768F6E]/30 px-1.5 py-0.5 text-[#768F6E] font-semibold shrink-0">
                    R$ {activeGroupRemaining}
                  </span>
                )}
              </div>
            )}

            {/* Botão Enviar Arte */}
            <button
              type="button"
              onClick={onOpenSubmitArt}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#A88C5A]/40 bg-[#A88C5A]/10 px-3 py-1.5 text-xs font-semibold text-[#C4A468] hover:bg-[#A88C5A]/20 hover:border-[#A88C5A]/60 transition-all cursor-pointer shadow-sm"
            >
              <Upload className="size-3.5" />
              <span>Enviar Arte</span>
            </button>

            {/* Perfil & Autenticação */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#1C1A18]/80 px-2.5 py-1.5 text-xs">
                  {isGlobalAdmin ? (
                    <Crown className="size-3.5 text-[#C4A468]" />
                  ) : isAnalyst ? (
                    <UserCheck className="size-3.5 text-[#778E93]" />
                  ) : (
                    <UserIcon className="size-3.5 text-[#A8A199]" />
                  )}
                  <span className="text-[#FBF9F5] font-medium max-w-[120px] sm:max-w-[160px] truncate">
                    {user.email?.split("@")[0]}
                  </span>
                  <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.2 font-mono text-[9px] text-[#A8A199] font-medium uppercase">
                    {isGlobalAdmin ? "Admin" : isAnalyst ? "Analista" : "Cliente"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    toast.info("Sessão finalizada.");
                  }}
                  title="Encerrar sessão"
                  className="grid size-8 place-items-center rounded-xl border border-white/[0.08] bg-[#1C1A18]/60 text-[#A8A199] hover:text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all cursor-pointer"
                >
                  <LogOut className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuthModal("login")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#A88C5A] px-3.5 py-1.5 text-xs font-bold text-[#151413] hover:bg-[#967B4A] transition-all cursor-pointer shadow-sm"
              >
                <LogIn className="size-3.5" />
                <span>Entrar</span>
              </button>
            )}
          </div>

          {/* Right Mobile Toggle & Quick Action */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={onOpenSubmitArt}
              className="inline-flex items-center gap-1 rounded-lg border border-[#A88C5A]/40 bg-[#A88C5A]/15 px-2.5 py-1.5 text-xs font-semibold text-[#C4A468] active:scale-95 transition cursor-pointer"
            >
              <Upload className="size-3" />
              <span>Enviar</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="grid size-9 place-items-center rounded-xl border border-white/10 bg-[#201E1C] text-[#FBF9F5] hover:border-[#A88C5A]/40 active:bg-white/10 transition-colors cursor-pointer"
              aria-label="Abrir Menu de Opções"
            >
              {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Drawer / Menu Lateral Mobile (Slide-over elegante Olivelas) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Painel Lateral */}
          <div className="fixed inset-y-0 right-0 w-full max-w-[320px] bg-[#181716] border-l border-white/10 p-5 flex flex-col justify-between shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Topo do Menu Lateral */}
            <div className="space-y-6">
              {/* Header do Drawer */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-8 place-items-center rounded-lg border border-[#A88C5A]/35 bg-[#A88C5A]/10 text-[#C4A468]">
                    <Layers className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold tracking-wider text-[#FBF9F5] uppercase">
                      Olivelas - Olivelas - Vitrine Digital & Analisador IA & Analisador IA
                    </h3>
                    <span className="text-[10px] text-[#A8A199] font-sans">Menu de Navegação</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="grid size-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-[#A8A199] hover:text-[#FBF9F5] transition cursor-pointer"
                  title="Fechar Menu"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Seção de Navegação Principal */}
              <div>
                <span className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A88C5A] mb-2 px-1">
                  Páginas & Recursos
                </span>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleNavigate("store")}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left font-medium transition cursor-pointer ${
                      currentView === "store"
                        ? "bg-[#A88C5A] text-[#151413] font-bold shadow-md shadow-[#A88C5A]/20"
                        : "bg-[#201E1C] text-[#FBF9F5] border border-white/[0.06] hover:border-[#A88C5A]/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Store className="size-4" />
                      <span className="text-xs">Vitrine da Loja</span>
                    </div>
                    <ChevronRight className="size-3.5 opacity-60" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNavigate("analyzer")}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left font-medium transition cursor-pointer ${
                      currentView === "analyzer"
                        ? "bg-[#A88C5A] text-[#151413] font-bold shadow-md shadow-[#A88C5A]/20"
                        : "bg-[#201E1C] text-[#FBF9F5] border border-white/[0.06] hover:border-[#A88C5A]/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ScanText className="size-4" />
                      <span className="text-xs">Analisador & OCR</span>
                    </div>
                    <ChevronRight className="size-3.5 opacity-60" />
                  </button>

                  {canApproveArts && (
                    <button
                      type="button"
                      onClick={() => handleNavigate("iam")}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left font-medium transition cursor-pointer ${
                        currentView === "iam"
                          ? "bg-[#A88C5A] text-[#151413] font-bold shadow-md shadow-[#A88C5A]/20"
                          : "bg-[#201E1C] text-[#FBF9F5] border border-white/[0.06] hover:border-[#A88C5A]/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="size-4" />
                        <span className="text-xs">{isGlobalAdmin ? "Gestão & IAM" : "Moderação"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {pendingSubmissionsCount > 0 && (
                          <span className="flex size-4 items-center justify-center rounded-full bg-[#C4A468] text-[9px] font-bold text-[#151413]">
                            {pendingSubmissionsCount}
                          </span>
                        )}
                        <ChevronRight className="size-3.5 opacity-60" />
                      </div>
                    </button>
                  )}

                  <a
                    href="/docs/manual.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left font-medium bg-[#201E1C] text-[#FBF9F5] border border-white/[0.06] hover:border-[#A88C5A]/30 transition"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="size-4 text-[#C4A468]" />
                      <span className="text-xs">Como Funciona (Manual)</span>
                    </div>
                    <ChevronRight className="size-3.5 opacity-60" />
                  </a>
                </div>
              </div>

              {/* Seletor de Grupo / Workspace no Mobile */}
              {availableGroups.length > 0 && (
                <div>
                  <span className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A88C5A] mb-2 px-1">
                    Grupo de Trabalho / IA
                  </span>
                  <div className="rounded-xl border border-white/10 bg-[#201E1C] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-[#FBF9F5] font-medium">
                        <Building2 className="size-3.5 text-[#C4A468]" />
                        <span>Grupo Ativo</span>
                      </div>
                      {activeGroupRemaining !== null && (
                        <span className="font-mono text-[10px] rounded bg-[#768F6E]/15 border border-[#768F6E]/30 px-1.5 py-0.5 text-[#768F6E] font-semibold">
                          R$ {activeGroupRemaining}
                        </span>
                      )}
                    </div>
                    <select
                      value={activeGroup?.id || ""}
                      onChange={(e) => setActiveGroupId(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#151413] px-3 py-2 text-xs text-[#FBF9F5] font-medium focus:border-[#A88C5A] focus:outline-none cursor-pointer"
                    >
                      {availableGroups.map((g) => (
                        <option key={g.id} value={g.id} className="bg-[#151413] text-[#FBF9F5]">
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Ação Primária: Enviar Arte */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenSubmitArt();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#A88C5A] hover:bg-[#C4A468] py-3 text-xs font-bold text-[#151413] shadow-lg shadow-[#A88C5A]/20 transition cursor-pointer"
                >
                  <Upload className="size-4" />
                  <span>Enviar Arte / Flyer para Divulgação</span>
                </button>
              </div>
            </div>

            {/* Rodapé do Menu Lateral: Perfil e Autenticação */}
            <div className="mt-6 pt-4 border-t border-white/[0.08]">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#201E1C] p-3">
                    <div className="grid size-9 place-items-center rounded-lg bg-[#A88C5A]/15 text-[#C4A468] shrink-0">
                      {isGlobalAdmin ? (
                        <Crown className="size-4" />
                      ) : isAnalyst ? (
                        <UserCheck className="size-4" />
                      ) : (
                        <UserIcon className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <strong className="block text-xs text-[#FBF9F5] font-medium truncate">
                        {user.email}
                      </strong>
                      <span className="inline-block mt-0.5 rounded bg-white/5 border border-white/10 px-1.5 py-0.2 font-mono text-[9px] text-[#A8A199] font-medium uppercase">
                        {isGlobalAdmin ? "Admin Global" : isAnalyst ? "Analista" : "Cliente"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut();
                      toast.info("Sessão finalizada.");
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                  >
                    <LogOut className="size-3.5" />
                    <span>Encerrar Sessão</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuthModal("login");
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[#A88C5A] py-2.5 text-xs font-bold text-[#151413] hover:bg-[#C4A468] transition cursor-pointer"
                  >
                    <LogIn className="size-3.5" />
                    <span>Entrar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuthModal("register");
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#201E1C] py-2.5 text-xs font-semibold text-[#FBF9F5] hover:bg-white/10 transition cursor-pointer"
                  >
                    <span>Criar Conta</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
