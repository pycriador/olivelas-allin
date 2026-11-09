import { motion } from "framer-motion";
import { CheckCircle2, Clock3, TrendingDown, Rocket } from "lucide-react";

const BENEFITS = [
  {
    icon: Clock3,
    stat: "até 80%",
    label: "menos tempo na geração de documentos",
  },
  {
    icon: TrendingDown,
    stat: "100%",
    label: "de rastreabilidade em cada alteração",
  },
  {
    icon: Rocket,
    stat: "3x",
    label: "mais rápido para novos projetos",
  },
  {
    icon: CheckCircle2,
    stat: "Zero",
    label: "erros de digitação em cláusulas manuais",
  },
];

const VALUE_POINTS = [
  "Elimine versões divergentes de documentos",
  "Padronização de cláusulas corporativas",
  "Redução drástica de retrabalho manual",
  "Ambiente controlado e auditável para o jurídico",
  "Integração com dados operacionais reais",
  "Escala sem aumentar o headcount de suporte",
];

export function BenefitsSection() {
  return (
    <section id="beneficios" className="border-t border-border/60 bg-muted/40 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Resultados mensuráveis para a operação
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Empresas que automatizam documentação reduzem custos, aceleram prazos e melhoram a
              qualidade dos documentos finais.
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {VALUE_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.label}
                className="rounded-xl border border-border/60 bg-background p-6 shadow-sm"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <benefit.icon className="size-5" aria-hidden />
                </div>
                <p className="mt-4 text-3xl font-semibold tracking-tight">{benefit.stat}</p>
                <p className="mt-1 text-sm text-muted-foreground">{benefit.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
