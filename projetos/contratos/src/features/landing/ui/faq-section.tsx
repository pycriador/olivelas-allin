import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    question: "O ClauseForge é um editor de documentos?",
    answer:
      "Não. O ClauseForge é uma plataforma de automação documental. Cada projeto representa uma aplicação completa de geração de documentos — o documento é apenas o resultado da execução do projeto.",
  },
  {
    question: "Quais fontes de dados posso conectar?",
    answer:
      "A arquitetura suporta Google Sheets, Google Docs, REST APIs, CSV, XLSX e JSON. As integrações estarão disponíveis na interface em breve, com credenciais criptografadas e reutilizáveis entre projetos.",
  },
  {
    question: "A plataforma é multi-tenant?",
    answer:
      "Sim. O ClauseForge nasceu preparado para múltiplas empresas, com isolamento completo por workspace: usuários, projetos, documentos, permissões e configurações.",
  },
  {
    question: "Como funciona a segurança?",
    answer:
      "Contamos com RBAC granular, proteção de rotas, sessões seguras com refresh token, criptografia de credenciais e auditoria completa de todas as ações da plataforma.",
  },
  {
    question: "Posso gerenciar quem acessa cada módulo?",
    answer:
      "Sim. Papéis, grupos e permissões granulares permitem controlar acesso a Workspace, Projects, Documents, Executions, Libraries, Users, Settings, Audit, Connectors e Validation.",
  },
  {
    question: "Qual o formato dos documentos gerados?",
    answer:
      "A geração de documentos será implementada nas próximas sprints, incluindo suporte a PDF e a integrações com Google Docs e Google Sheets.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-border/60 bg-muted/40 py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Perguntas frequentes
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Tudo que você precisa saber antes de começar.
          </p>
        </motion.div>

        <div className="mt-12 space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
