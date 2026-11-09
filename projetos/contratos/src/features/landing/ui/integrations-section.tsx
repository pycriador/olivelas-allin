import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  FileText,
  Globe,
  Braces,
  Table2,
  Database,
  type LucideIcon,
} from "lucide-react";

interface Integration {
  icon: LucideIcon;
  name: string;
}

const INTEGRATIONS: Integration[] = [
  { icon: FileSpreadsheet, name: "Google Sheets" },
  { icon: FileText, name: "Google Docs" },
  { icon: Globe, name: "REST API" },
  { icon: Braces, name: "CSV" },
  { icon: Table2, name: "XLSX" },
  { icon: Database, name: "JSON" },
];

export function IntegrationsSection() {
  return (
    <section id="integracoes" className="border-t border-border/60 bg-muted/40 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Conecte suas fontes de dados
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Uma arquitetura de conectores pronta para alimentar seus projetos com dados reais de
            qualquer sistema.
          </p>
        </motion.div>

        <div className="mx-auto mt-14 flex max-w-4xl flex-wrap items-center justify-center gap-4">
          {INTEGRATIONS.map((integration, index) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              whileHover={{ y: -3 }}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-5 py-3.5 shadow-sm"
            >
              <integration.icon className="size-5 text-primary" aria-hidden />
              <span className="text-sm font-medium">{integration.name}</span>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Conectores disponíveis em breve via interface — arquitetura já preparada.
        </p>
      </div>
    </section>
  );
}
