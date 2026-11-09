import { motion } from "framer-motion";
import { Fingerprint, Lock, ShieldCheck, KeyRound, ScanLine, Users } from "lucide-react";

const SECURITY_ITEMS = [
  {
    icon: Users,
    title: "RBAC granular",
    description:
      "Papéis e permissões por módulo — Workspace, Projects, Documents, Executions, Libraries e mais.",
  },
  {
    icon: Fingerprint,
    title: "Multi-tenant nativo",
    description:
      "Isolamento completo entre empresas: dados, usuários e configurações por workspace.",
  },
  {
    icon: KeyRound,
    title: "Criptografia de credenciais",
    description:
      "Credenciais de conectores armazenadas de forma criptografada, reutilizáveis entre projetos.",
  },
  {
    icon: ScanLine,
    title: "Auditoria completa",
    description:
      "Login, logout, CRUD, alterações de permissão e configurações registrados com trilha auditável.",
  },
];

export function SecuritySection() {
  return (
    <section id="seguranca" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-6" aria-hidden />
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            Segurança no nível enterprise
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Seus documentos e dados protegidos com os mesmos padrões exigidos pelas maiores
            operações jurídicas.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {SECURITY_ITEMS.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="flex gap-4 rounded-xl border border-border/60 bg-background p-6 shadow-sm"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="size-5" aria-hidden />
              </div>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          {["Autenticação via Google", "Sessões seguras", "Refresh tokens", "CSRF protegido"].map(
            (label) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-4 py-1.5 text-sm text-muted-foreground"
              >
                <Lock className="size-3.5 text-primary" />
                {label}
              </div>
            ),
          )}
        </motion.div>
      </div>
    </section>
  );
}
