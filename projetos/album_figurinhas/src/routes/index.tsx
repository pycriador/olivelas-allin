import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listAlbums } from "@/lib/db";
import { AppHeader } from "@/components/layout/AppShell";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight, Trophy, LayoutTemplate, Ruler, FileDown, Upload,
  Layers, Sparkles, ShieldCheck, Images, MousePointerClick,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Copa 2026 · Album Studio" },
      { name: "description", content: "Crie e personalize álbuns A4 inspirados na Copa do Mundo 2026 — montagem visual, figurinhas em centímetros e PDF pronto para impressão." },
      { property: "og:title", content: "Copa 2026 · Album Studio" },
      { property: "og:description", content: "Monte álbuns A4 personalizados da Copa 2026: editor visual, figurinhas em centímetros reais e exportação em PDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: LayoutTemplate, title: "Editor visual A4", desc: "Arraste, redimensione e alinhe figurinhas em uma página real de 21 × 29,7 cm." },
  { icon: Ruler, title: "Medidas reais", desc: "Cada figurinha é definida em centímetros — o que você vê é exatamente o que será impresso." },
  { icon: Layers, title: "Camadas e propriedades", desc: "Controle ordem, rotação, bordas e cantos com um painel de propriedades completo." },
  { icon: Images, title: "Grid inteligente", desc: "Gere dezenas de espaços perfeitamente distribuídos com um clique." },
  { icon: Upload, title: "Upload sem login", desc: "Visitantes só abrem o link do álbum e enviam as fotos nos espaços definidos." },
  { icon: FileDown, title: "PDF de alta resolução", desc: "Exporte o álbum pronto para gráfica, com qualidade de impressão profissional." },
];

const STEPS = [
  { n: "01", title: "Crie o álbum", desc: "Defina nome, capa e quantas páginas quiser. O canvas começa em branco, do seu jeito." },
  { n: "02", title: "Monte o layout", desc: "Adicione figurinhas individuais ou gere um grid completo e ajuste tudo visualmente." },
  { n: "03", title: "Compartilhe o link", desc: "Envie o endereço do álbum. Visitantes fazem upload das fotos sem criar conta." },
  { n: "04", title: "Exporte em PDF", desc: "Baixe o arquivo final em alta resolução e leve direto para a impressão." },
];

const FAQ = [
  { q: "Preciso criar uma conta para usar?", a: "Somente administradores precisam de conta para criar e editar álbuns. Visitantes acessam o link do álbum e enviam fotos sem login." },
  { q: "Como faço login?", a: "Você pode entrar com e-mail e senha ou usar sua conta Google em um clique." },
  { q: "O PDF sai no tamanho certo para impressão?", a: "Sim. Todo o editor trabalha em centímetros sobre uma página A4 real, então o PDF exportado mantém as medidas exatas." },
  { q: "Posso criar vários álbuns?", a: "Sim, quantos quiser — cada um com suas próprias páginas, layouts e link público de upload." },
];

function Index() {
  const { data: albums, isLoading } = useQuery({ queryKey: ["albums"], queryFn: listAlbums });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/30">
      <AppHeader />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[38rem] w-[38rem] rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute top-24 right-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-28 text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
            <Trophy className="w-3.5 h-3.5 text-accent" />
            Copa do Mundo 2026
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="mx-auto max-w-4xl text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            Crie o seu álbum da Copa,
            <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">do seu jeito.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Layouts personalizados em A4, figurinhas em centímetros reais e exportação em PDF de alta resolução. Visitantes só precisam enviar as fotos.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/auth">
                <Sparkles className="w-4 h-4 mr-2" /> Criar conta grátis
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link to="/auth">Entrar com e-mail ou Google</Link>
            </Button>
          </motion.div>
          <p className="mt-4 text-xs text-muted-foreground">
            Cadastro em segundos · Visitantes não precisam de conta
          </p>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Tudo que um estúdio de álbuns precisa</h2>
            <p className="mt-3 text-muted-foreground">Ferramentas pensadas para quem cria layouts sob medida e entrega arquivos prontos para a gráfica.</p>
          </div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}>
                <Card className="h-full border-border/60 hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground mb-4">
                      <f.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="border-y border-border/60 bg-card/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Do zero ao PDF em quatro passos</h2>
              <p className="mt-3 text-muted-foreground">Um fluxo simples para administradores e ainda mais simples para os visitantes.</p>
            </div>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((s, i) => (
                <motion.div key={s.n}
                  initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="relative rounded-xl border border-border bg-background p-6">
                  <span className="text-sm font-mono text-accent">{s.n}</span>
                  <h3 className="mt-2 font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ALBUMS */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Álbuns disponíveis</h2>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3].map((i) => <Skeleton key={i} className="aspect-[21/29.7] rounded-xl" />)}
            </div>
          ) : !albums?.length ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center text-muted-foreground">
                Nenhum álbum publicado ainda. Faça login como administrador para criar o primeiro.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {albums.map((a) => (
                <motion.div key={a.id} whileHover={{ y: -4 }}>
                  <Link to="/album/$slug" params={{ slug: a.slug }} className="block group">
                    <div className="aspect-[21/29.7] rounded-xl border border-border bg-card overflow-hidden shadow-sm group-hover:shadow-lg transition-shadow relative"
                      style={{ backgroundImage: a.cover_url ? `url(${a.cover_url})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
                      {!a.cover_url && (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/5 flex items-center justify-center">
                          <Trophy className="w-12 h-12 text-primary/40" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white">
                        <div className="font-semibold">{a.name}</div>
                        {a.description && <div className="text-xs opacity-80 line-clamp-2">{a.description}</div>}
                        <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium">
                          Abrir álbum <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* FAQ */}
        <section className="border-t border-border/60 bg-card/40">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center">Perguntas frequentes</h2>
            <Accordion type="single" collapsible className="mt-8">
              {FAQ.map((item) => (
                <AccordionItem key={item.q} value={item.q}>
                  <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-10 lg:p-16 text-center">
            <div className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 h-64 w-[30rem] rounded-full bg-accent/20 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Comece o seu álbum da Copa 2026 hoje</h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Crie sua conta com e-mail e senha ou entre com o Google — leva menos de um minuto.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link to="/auth"><MousePointerClick className="w-4 h-4 mr-2" /> Criar conta</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link to="/auth">Já tenho conta</Link>
                </Button>
              </div>
              <p className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5" /> Seus dados ficam protegidos e seus álbuns são privados até você compartilhar.
              </p>
            </div>
          </div>
        </section>

        <footer className="border-t border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" /> Copa 2026 · Album Studio
            </span>
            <Link to="/auth" className="hover:text-foreground transition-colors">Entrar / Criar conta</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
