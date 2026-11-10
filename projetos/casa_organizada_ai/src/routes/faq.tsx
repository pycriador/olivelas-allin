import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas frequentes — HomeFlow" },
      { name: "description", content: "Respostas rápidas para as dúvidas mais comuns sobre o HomeFlow." },
      { property: "og:title", content: "FAQ — HomeFlow" },
      { property: "og:description", content: "Perguntas frequentes sobre planejamentos, templates e Theme Builder." },
    ],
  }),
  component: FaqPage,
});

const faqs = [
  { q: "Posso criar quantos planejamentos?", a: "Sim, você pode criar quantos planejamentos quiser, sem limite." },
  { q: "Posso compartilhar?", a: "Sim. Cada planejamento tem um link de compartilhamento e permissões por convite." },
  { q: "Posso exportar em PDF?", a: "Sim, qualquer planejamento pode ser exportado para PDF." },
  { q: "Posso usar no celular?", a: "Sim, o HomeFlow é 100% responsivo e funciona em qualquer dispositivo." },
  { q: "Como funcionam os templates?", a: "São modelos prontos por categoria. Você pode duplicar e ajustar como quiser." },
  { q: "O Theme Builder é gratuito?", a: "Sim, faz parte do plano gratuito." },
  { q: "Meus dados ficam seguros?", a: "Utilizamos infraestrutura em nuvem com criptografia e políticas rigorosas de acesso." },
];

function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
          Perguntas <span className="text-gradient-brand">frequentes</span>
        </h1>
        <p className="mt-4 text-muted-foreground">Tudo que você precisa saber antes de começar.</p>
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
      <SiteFooter />
    </div>
  );
}