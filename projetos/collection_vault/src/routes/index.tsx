import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Gamepad2, Joystick, Trophy, Tag, Coins, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard" });
  }, [user, loading, nav]);

  return (
    <div className="min-h-screen arcade-grid">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2">
          <Joystick className="h-8 w-8 text-primary" />
          <span className="font-display text-lg neon-text-pink">RETROVAULT</span>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm" className="font-display text-xs">
            <Link to="/auth">LOGIN</Link>
          </Button>
          <Button asChild size="sm" className="font-display text-xs glow-pulse">
            <Link to="/auth">START</Link>
          </Button>
        </div>
      </header>

      <main className="px-6 md:px-12">
        {/* Hero */}
        <section className="mx-auto max-w-5xl py-16 md:py-28 text-center">
          <p className="font-mono text-2xl neon-text-cyan mb-4">
            ► PLAYER 1 PRESS START<span className="blink">_</span>
          </p>
          <h1 className="text-3xl md:text-6xl leading-tight neon-text-pink font-display">
            SUA COLEÇÃO<br />
            <span className="neon-text-yellow">EM ALTA SCORE</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground font-mono text-2xl">
            Catalogue jogos, consoles e acessórios. Acompanhe preços, cupons e
            domine seu backlog como um verdadeiro speedrunner.
          </p>
          <div className="mt-10 flex justify-center gap-3 flex-wrap">
            <Button asChild size="lg" className="font-display text-xs">
              <Link to="/auth">▶ INICIAR JOGO</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-display text-xs border-accent text-accent hover:bg-accent hover:text-accent-foreground">
              <a href="#features">CONTINUE</a>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl pb-20 grid gap-5 md:grid-cols-3">
          {[
            { icon: Library, title: "INVENTÁRIO", desc: "Físico, digital, CIB, edição de colecionador. Tudo rastreado.", color: "neon-text-pink" },
            { icon: Trophy, title: "BACKLOG", desc: "Backlog, jogando, finalizado. Veja seu progresso visual.", color: "neon-text-cyan" },
            { icon: Tag, title: "CUPONS", desc: "Salve códigos por loja com validade e valor mínimo.", color: "neon-text-yellow" },
            { icon: Coins, title: "PREÇOS", desc: "Compare links de compra entre lojas e calcule preço final.", color: "neon-text-pink" },
            { icon: Gamepad2, title: "MULTIUSUÁRIO", desc: "Cada nerd no seu cartucho. Dados isolados e seguros.", color: "neon-text-cyan" },
            { icon: Joystick, title: "DASHBOARD", desc: "Gráficos arcade dos seus gastos e plataformas.", color: "neon-text-yellow" },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border-2 border-border bg-card p-6 transition-all hover:border-primary hover:-translate-y-1">
              <f.icon className={`h-8 w-8 mb-4 ${f.color}`} />
              <h3 className={`font-display text-sm mb-3 ${f.color}`}>{f.title}</h3>
              <p className="text-sm text-muted-foreground font-mono text-xl">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center font-mono text-xl text-muted-foreground">
        © {new Date().getFullYear()} RETROVAULT • HIGH SCORE FOREVER
      </footer>
    </div>
  );
}
