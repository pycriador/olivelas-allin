import { Link } from "react-router-dom";
import {
  Link2,
  Zap,
  FileText,
  History,
  ShieldCheck,
  Scissors,
  MousePointerClick,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const features = [
  {
    icon: Zap,
    title: "Coleta automática",
    desc: "Cole a URL ou o ID do produto do Mercado Livre e Shopee e receba nome, preço antigo, preço novo e parcelamento em segundos.",
  },
  {
    icon: FileText,
    title: "Templates dinâmicos",
    desc: "Crie mensagens com tags como {{nome_produto}}, {{preco_novo}} e {{link}} — o texto é montado sozinho para cada oferta.",
  },
  {
    icon: Scissors,
    title: "Links encurtados",
    desc: "Cada oferta sai com um link curto e limpo, pronto para colar no WhatsApp, Telegram ou nos stories.",
  },
  {
    icon: MousePointerClick,
    title: "Edição manual",
    desc: "Revisou e achou algo errado? Ajuste qualquer campo antes de gerar a mensagem final.",
  },
  {
    icon: History,
    title: "Histórico completo",
    desc: "Todas as ofertas geradas ficam salvas, prontas para copiar de novo ou reaproveitar em outra campanha.",
  },
  {
    icon: ShieldCheck,
    title: "Conta protegida",
    desc: "Login por email e senha ou com sua conta Google. Seus dados e templates ficam só com você.",
  },
];

const steps = [
  { n: "01", title: "Cole o link", desc: "URL ou ID do produto do marketplace." },
  { n: "02", title: "Escolha o template", desc: "Selecione o modelo de mensagem que combina com o canal." },
  { n: "03", title: "Copie e divulgue", desc: "Mensagem pronta com link curto, direto na área de transferência." },
];

const benefits = [
  "Mercado Livre e Shopee suportados",
  "Templates ilimitados",
  "Encurtador de links integrado",
  "Histórico de ofertas salvo",
];

export default function Landing() {
  const { user } = useAuth();
  const ctaTo = user ? "/app" : "/auth";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center glow-primary">
              <Link2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">LinkPromo</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#recursos" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
            <a href="#comecar" className="hover:text-foreground transition-colors">Começar</a>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild className="gradient-primary text-primary-foreground font-semibold">
                <Link to="/app">Abrir painel</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button asChild className="gradient-primary text-primary-foreground font-semibold glow-primary">
                  <Link to="/auth">Criar conta</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(65%_55%_at_50%_0%,hsl(var(--primary)/0.14),transparent_70%)]" />
        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Feito para afiliados do Mercado Livre e Shopee
          </span>

          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
            Transforme qualquer link de produto em{" "}
            <span className="text-gradient">mensagem de oferta pronta</span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
            O LinkPromo coleta preço, desconto e parcelamento do produto, encurta o link e monta a
            mensagem no seu template favorito. Tudo em menos de um minuto.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="h-12 px-7 gradient-primary text-primary-foreground font-semibold text-base glow-primary">
              <Link to={ctaTo}>
                Começar grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7 bg-secondary/40 border-border text-base">
              <a href="#como-funciona">Ver como funciona</a>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {benefits.map((b) => (
              <span key={b} className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                {b}
              </span>
            ))}
          </div>

          {/* Mock preview */}
          <div className="mt-16 max-w-3xl mx-auto text-left">
            <div className="gradient-card rounded-2xl border border-border p-1.5 shadow-[var(--shadow-elevated)]">
              <div className="rounded-xl border border-border bg-background/60 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 border border-border px-4 py-3">
                  <span className="font-mono text-xs sm:text-sm text-muted-foreground truncate">
                    https://mercadolivre.com.br/fone-bluetooth-xz900...
                  </span>
                  <span className="ml-3 shrink-0 text-xs font-mono font-semibold px-2 py-1 rounded bg-primary/20 text-primary">
                    ML
                  </span>
                </div>
                <div className="rounded-lg border border-border bg-card p-4 font-mono text-sm leading-relaxed text-foreground whitespace-pre-line">
                  {`🔥 OFERTA IMPERDÍVEL 🔥

Fone Bluetooth XZ900
De R$ 349,90 por R$ 189,90
ou 12x de R$ 18,25

👉 https://is.gd/xz900of`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="border-t border-border py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Tudo que você precisa para divulgar mais rápido
            </h2>
            <p className="mt-3 text-muted-foreground">
              Menos copiar e colar, mais ofertas publicadas. O fluxo inteiro em uma única tela.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="gradient-card rounded-xl border border-border p-6 transition-all hover:border-primary/40 hover:shadow-[var(--shadow-glow)]"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="border-t border-border py-20 bg-card/20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Três passos. Um minuto.</h2>
            <p className="mt-3 text-muted-foreground">
              Sem planilhas, sem editar texto na mão, sem esquecer de encurtar o link.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-xl border border-border bg-background/40 p-6">
                <span className="font-mono text-4xl font-bold text-primary/25">{s.n}</span>
                <h3 className="mt-3 font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="comecar" className="border-t border-border py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="gradient-card rounded-2xl border border-border p-10 text-center shadow-[var(--shadow-card)]">
            <h2 className="text-3xl font-bold tracking-tight">Crie sua conta e gere a primeira oferta hoje</h2>
            <p className="mt-3 text-muted-foreground">
              Cadastre-se com email e senha ou entre direto com o Google. É grátis para começar.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="h-12 px-7 gradient-primary text-primary-foreground font-semibold glow-primary">
                <Link to={ctaTo}>
                  Criar conta grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7 bg-secondary/40 border-border">
                <Link to="/auth">Já tenho conta</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md gradient-primary flex items-center justify-center">
              <Link2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">LinkPromo</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} LinkPromo. Feito para afiliados.
          </p>
        </div>
      </footer>
    </div>
  );
}
