import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, X, Crown, User, Mail, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth, GLOBAL_ADMIN_EMAIL } from "@/lib/auth-context";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const { signIn, signUp, user, isGlobalAdmin } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  if (!isOpen) return null;

  const isEmailAdmin = email.trim().toLowerCase() === GLOBAL_ADMIN_EMAIL.toLowerCase();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Por favor, preencha o e-mail e a senha.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (tab === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message || "E-mail ou senha incorretos.");
          return;
        }
        toast.success(
          isEmailAdmin
            ? "Bem-vindo de volta, Administrador Global!"
            : "Login realizado com sucesso!"
        );
        onClose();
      } else {
        if (password.length < 6) {
          toast.error("A senha deve ter pelo menos 6 caracteres.");
          return;
        }

        const { error, needsEmailConfirmation } = await signUp(email, password, fullName);
        if (error) {
          toast.error(error.message || "Erro ao realizar cadastro.");
          return;
        }

        if (needsEmailConfirmation) {
          toast.success(
            "Conta criada com sucesso! Por favor, verifique seu e-mail para confirmar seu cadastro.",
            { duration: 6000 }
          );
        } else {
          toast.success(
            isEmailAdmin
              ? "Conta de Administrador Global criada e conectada com sucesso!"
              : "Cadastro realizado com sucesso!"
          );
        }
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#201E1C] shadow-2xl overflow-hidden p-6 sm:p-8 text-[#FBF9F5]">
        {/* Botão de Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-[#A8A199] hover:text-[#FBF9F5] hover:bg-white/10 transition-colors cursor-pointer"
          title="Fechar"
        >
          <X className="size-4" />
        </button>

        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-[#A88C5A]/15 border border-[#A88C5A]/30 text-[#C4A468] shadow-sm">
            <Lock className="size-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#FBF9F5] tracking-tight">
            {tab === "login" ? "Acessar Plataforma" : "Criar Nova Conta"}
          </h2>
          <p className="mt-1 text-xs text-[#A8A199]">
            {tab === "login"
              ? "Autentique-se para gerenciar análises, cotas e visibilidade de produtos."
              : "Cadastre-se para acessar os recursos corporativos da plataforma."}
          </p>
        </div>

        {/* Alternador de Abas (Entrar / Cadastrar) */}
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-[#151413] p-1 mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`rounded-lg py-2 transition-all cursor-pointer ${
              tab === "login"
                ? "bg-[#A88C5A] text-[#151413] font-bold shadow-sm"
                : "text-[#A8A199] hover:text-[#FBF9F5]"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`rounded-lg py-2 transition-all cursor-pointer ${
              tab === "register"
                ? "bg-[#A88C5A] text-[#151413] font-bold shadow-sm"
                : "text-[#A8A199] hover:text-[#FBF9F5]"
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "register" && (
            <div>
              <label className="block text-xs font-medium text-[#D1C9BF] mb-1 flex items-center gap-1.5">
                <User className="size-3.5 text-[#A8A199]" />
                <span>Nome Completo</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome ou nome da empresa"
                className="w-full rounded-xl border border-white/10 bg-[#151413] px-3.5 py-2.5 text-xs text-[#FBF9F5] placeholder:text-[#A8A199]/50 focus:border-[#A88C5A] focus:outline-none transition"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[#D1C9BF] flex items-center gap-1.5">
                <Mail className="size-3.5 text-[#A8A199]" />
                <span>E-mail</span>
              </label>
              {isEmailAdmin && (
                <span className="inline-flex items-center gap-1 rounded bg-[#A88C5A]/20 border border-[#A88C5A]/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#C4A468]">
                  <Crown className="size-2.5" />
                  Admin Global
                </span>
              )}
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              className={`w-full rounded-xl border bg-[#151413] px-3.5 py-2.5 text-xs text-[#FBF9F5] placeholder:text-[#A8A199]/50 focus:outline-none transition ${
                isEmailAdmin
                  ? "border-[#A88C5A] focus:border-[#C4A468]"
                  : "border-white/10 focus:border-[#A88C5A]"
              }`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[#D1C9BF] flex items-center gap-1.5">
                <Lock className="size-3.5 text-[#A8A199]" />
                <span>Senha</span>
              </label>
              {tab === "register" && (
                <span className="text-[10px] text-[#A8A199]">Mínimo 6 caracteres</span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-[#151413] px-3.5 py-2.5 pr-10 text-xs text-[#FBF9F5] placeholder:text-[#A8A199]/50 focus:border-[#A88C5A] focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A199] hover:text-[#FBF9F5] cursor-pointer"
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#A88C5A] hover:bg-[#C4A468] py-2.5 text-xs font-bold text-[#151413] shadow-md shadow-[#A88C5A]/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <span>{tab === "login" ? "Entrar na Plataforma" : "Criar Minha Conta"}</span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Rodapé explicativo */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-[#A8A199]">
          {tab === "login" ? (
            <p>
              Ainda não tem conta?{" "}
              <button
                type="button"
                onClick={() => setTab("register")}
                className="text-[#C4A468] hover:underline font-semibold cursor-pointer"
              >
                Cadastre-se gratuitamente
              </button>
            </p>
          ) : (
            <p>
              Já possui uma conta?{" "}
              <button
                type="button"
                onClick={() => setTab("login")}
                className="text-[#C4A468] hover:underline font-semibold cursor-pointer"
              >
                Faça login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
