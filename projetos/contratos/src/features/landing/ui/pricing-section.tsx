import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    description: "Para experimentar a plataforma",
    features: [
      "1 workspace",
      "2 usuários",
      "10 projetos",
      "50 execuções/mês",
      "Biblioteca básica",
      "Suporte comunitário",
    ],
    cta: "Começar grátis",
    highlight: false,
  },
  {
    name: "Business",
    price: "R$ 749",
    period: "/mês",
    description: "Para equipes que precisam escalar",
    features: [
      "Workspaces ilimitados",
      "25 usuários inclusos",
      "Projetos ilimitados",
      "Execuções ilimitadas",
      "RBAC granular completo",
      "Auditoria completa",
      "Conectores avançados",
      "Suporte prioritário",
    ],
    cta: "Começar agora",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Sob consulta",
    period: "",
    description: "Para operações críticas",
    features: [
      "SSO / SAML",
      "MFA obrigatório",
      "Deploy dedicado",
      "SLA 99,9%",
      "Onboarding dedicado",
      "Parceiro de sucesso",
    ],
    cta: "Falar com vendas",
    highlight: false,
  },
];

export function PricingSection() {
  return (
    <section id="planos" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Planos que crescem com você
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Comece grátis e escale conforme sua operação demanda.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {PLANS.map((plan) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: PLANS.indexOf(plan) * 0.08 }}
              className={cn(
                "relative flex flex-col rounded-2xl border p-8",
                plan.highlight
                  ? "border-primary/60 bg-primary/5 shadow-xl"
                  : "border-border/60 bg-background shadow-sm",
              )}
            >
              {plan.highlight && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Sparkles className="mr-1 size-3" />
                  Mais popular
                </Badge>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/login" className="mt-8">
                <Button className="w-full" variant={plan.highlight ? "default" : "outline"}>
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
