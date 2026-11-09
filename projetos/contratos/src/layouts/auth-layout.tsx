import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, FileStack, Workflow, Lock } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const HIGHLIGHTS = [
  {
    icon: FileStack,
    title: "Projetos como aplicações",
    description:
      "Cada projeto é uma aplicação completa de geração de documentos, não um simples editor.",
  },
  {
    icon: Workflow,
    title: "Automação de ponta a ponta",
    description:
      "Fontes de dados, variáveis, regras e execuções trabalhando juntas para gerar documentos sob demanda.",
  },
  {
    icon: Lock,
    title: "Segurança enterprise",
    description:
      "RBAC granular, auditoria completa, criptografia de credenciais e multi-tenant nativo.",
  },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-indigo-900 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-32 -left-32 size-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/3 -right-24 size-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 size-64 rounded-full bg-white/5 blur-2xl" />
        </div>

        <div className="relative z-10 flex items-center justify-between p-8">
          <Logo className="text-white" iconClassName="bg-white/20 text-white" showText />
          <ThemeToggle />
        </div>

        <div className="relative z-10 px-12 py-8">
          <div className="max-w-md">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur">
              <ShieldCheck className="size-4" />
              Plataforma enterprise
            </div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white">
              Automação documental em escala para empresas.
            </h1>
            <p className="mt-4 text-base text-white/70">
              Crie projetos, conecte fontes de dados, defina regras e gere documentos com segurança
              e auditoria completa.
            </p>

            <ul className="mt-10 space-y-6">
              {HIGHLIGHTS.map((item) => (
                <li key={item.title} className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white">
                    <item.icon className="size-5" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-white/60">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative z-10 p-8">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} ClauseForge. Todos os direitos reservados.
          </p>
        </div>
      </div>

      <div className="flex flex-col bg-background">
        <div className="flex items-center justify-between p-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Voltar ao início
          </Link>
          <div className="lg:hidden">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
