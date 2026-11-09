import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function fadeUp(delay: number) {
  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: "easeOut" as const },
  };
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_55%)]" />
        <div className="absolute left-1/2 top-0 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute -left-24 top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-24 top-40 size-72 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-sm font-medium">
            <Sparkles className="mr-2 size-3.5 text-primary" />
            Plataforma de automação documental enterprise
          </Badge>
        </motion.div>

        <motion.h1
          {...fadeUp(0.1)}
          className="mx-auto mt-6 max-w-4xl text-center text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Cada projeto documental,{" "}
          <span className="bg-gradient-to-r from-primary via-indigo-500 to-violet-500 bg-clip-text text-transparent">
            uma aplicação completa
          </span>
        </motion.h1>

        <motion.p
          {...fadeUp(0.2)}
          className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-muted-foreground"
        >
          O ClauseForge não é um editor de documentos. É uma plataforma onde cada projeto automatiza
          a geração de documentos — com fontes de dados, variáveis, regras e execuções sob controle
          total.
        </motion.p>

        <motion.div
          {...fadeUp(0.3)}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link to="/login">
            <Button size="lg" className="w-full px-8 sm:w-auto">
              Começar agora
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="w-full px-8 sm:w-auto">
              <Play className="mr-2 size-4" />
              Ver demonstração
            </Button>
          </Link>
        </motion.div>

        <motion.p {...fadeUp(0.4)} className="mt-6 text-center text-sm text-muted-foreground">
          Sem cartão de crédito · Configuração em minutos · Multi-tenant nativo
        </motion.p>
      </div>
    </section>
  );
}
