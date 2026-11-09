import { motion } from "framer-motion";
import { Building2, Landmark, Scale, Shield, Stethoscope, Factory } from "lucide-react";

const TRUST = [
  { icon: Landmark, label: "Instituições financeiras" },
  { icon: Scale, label: "Escritórios jurídicos" },
  { icon: Shield, label: "Compliance & auditoria" },
  { icon: Factory, label: "Indústria" },
  { icon: Stethoscope, label: "Saúde" },
  { icon: Building2, label: "Corporações" },
];

export function TrustSection() {
  return (
    <section className="border-t border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground"
        >
          Construído para equipes que precisam de documentos em escala
        </motion.p>
        <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {TRUST.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <item.icon className="size-6 text-muted-foreground/70" aria-hidden />
              <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
