import { motion } from "framer-motion";
import {
  Blocks,
  Database,
  FileJson,
  GitBranch,
  PlayCircle,
  ShieldCheck,
  Variable,
  Workflow,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Blocks,
    title: "Projetos como aplicações",
    description:
      "Monte projetos documentais como se fossem aplicações: estrutura, entradas, regras e saídas definidas visualmente.",
  },
  {
    icon: Database,
    title: "Fontes de dados conectadas",
    description:
      "Conecte Google Sheets, Docs, APIs REST, CSV, XLSX e JSON para alimentar seus documentos com dados reais.",
  },
  {
    icon: Variable,
    title: "Variáveis tipadas",
    description:
      "Defina variáveis com tipos, validação e valores padrão. Cada execução recebe entradas consistentes e seguras.",
  },
  {
    icon: Workflow,
    title: "Regras de negócio",
    description:
      "Condições, cláusulas condicionais e validações automatizadas controlam o conteúdo gerado.",
  },
  {
    icon: PlayCircle,
    title: "Execuções auditáveis",
    description:
      "Cada execução é registrada com entradas, saídas e trilha de auditoria. Reproduza e rastreie tudo.",
  },
  {
    icon: ShieldCheck,
    title: "Segurança enterprise",
    description:
      "RBAC granular, workspace multi-tenant, criptografia de credenciais e trilhas de auditoria completas.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export function FeaturesSection() {
  return (
    <section id="recursos" className="border-t border-border/60 bg-muted/40 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Tudo que uma operação documental precisa
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Da definição do projeto à geração do documento final, o ClauseForge centraliza o
            processo completo.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              whileHover={{ y: -4 }}
              className="group rounded-xl border border-border/60 bg-background p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="size-5" aria-hidden />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-12 grid justify-items-center gap-6 sm:grid-cols-3">
          {[
            { icon: GitBranch, label: "Versionamento de projetos" },
            { icon: FileJson, label: "Saídas em múltiplos formatos" },
            { icon: Database, label: "Biblioteca corporativa de cláusulas" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-sm text-muted-foreground">
              <item.icon className="size-5 text-primary" />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
