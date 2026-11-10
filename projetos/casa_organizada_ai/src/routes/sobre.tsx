import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Target, Heart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — HomeFlow" },
      { name: "description", content: "Conheça a missão e os valores do HomeFlow." },
      { property: "og:title", content: "Sobre — HomeFlow" },
      { property: "og:description", content: "Nossa missão é dar clareza à sua rotina." },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
          Nossa <span className="text-gradient-brand">missão</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Acreditamos que planejar é um ato de cuidado — com a família, o trabalho, a casa e com você.
          O HomeFlow existe para eliminar o caos e dar clareza ao dia a dia através de uma
          plataforma bonita, flexível e realmente sua.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Target, title: "Foco", desc: "Ferramentas simples e diretas." },
            { icon: Heart, title: "Cuidado", desc: "Produto pensado para pessoas reais." },
            { icon: Sparkles, title: "Personalização", desc: "Seu planner do seu jeito." },
          ].map((v) => (
            <Card key={v.title} className="p-6">
              <v.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{v.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
            </Card>
          ))}
        </div>
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold">Casos de uso</h2>
          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <li>• Famílias organizando rotinas de crianças e pets</li>
            <li>• Estudantes com cronograma de provas e leituras</li>
            <li>• Profissionais autônomos com projetos e clientes</li>
            <li>• Cuidadores de idosos gerenciando medicações</li>
            <li>• Times pequenos coordenando entregas</li>
            <li>• Qualquer pessoa que quer clareza no dia a dia</li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}