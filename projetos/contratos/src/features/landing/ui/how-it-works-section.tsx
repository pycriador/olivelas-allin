import { motion } from "framer-motion";
import {
  AppWindow,
  Database,
  FileCheck2,
  FolderKanban,
  GitBranch,
  GitPullRequest,
} from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: FolderKanban,
    title: "Crie o projeto",
    description:
      "Defina a estrutura documental como uma aplicação: seções, variáveis e fontes de dados.",
  },
  {
    step: "02",
    icon: Database,
    title: "Conecte os dados",
    description: "Integre planilhas, APIs e arquivos para alimentar os documentos com dados reais.",
  },
  {
    step: "03",
    icon: GitPullRequest,
    title: "Defina as regras",
    description: "Configure cláusulas condicionais e validações para controlar o que é gerado.",
  },
  {
    step: "04",
    icon: GitBranch,
    title: "Versione o projeto",
    description: "Publique versões com histórico completo e trilha de auditoria de cada alteração.",
  },
  {
    step: "05",
    icon: AppWindow,
    title: "Execute",
    description: "Execute o projeto com entradas específicas e acompanhe o status em tempo real.",
  },
  {
    step: "06",
    icon: FileCheck2,
    title: "Gere o documento",
    description: "O documento é o resultado da execução — pronto, versionado e auditável.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Do projeto à execução em seis passos
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Um fluxo claro e auditável, construído para escalar com a operação da sua empresa.
          </p>
        </motion.div>

        <div className="relative mt-16">
          <div
            className="absolute inset-x-0 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
            aria-hidden
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="relative"
              >
                <div className="rounded-xl border border-border/60 bg-background p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <step.icon className="size-5" aria-hidden />
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground/60">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
