import { PublicLayout } from "@/layouts/public-layout";
import { APP_NAME } from "@/constants/app";

export function AboutPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-tight">Sobre o {APP_NAME}</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Uma plataforma para equipes que precisam gerar documentos em escala, com controle,
          segurança e auditoria completa.
        </p>
        <div className="mt-10 space-y-6 text-muted-foreground">
          <p>
            No ClauseForge, cada Projeto representa uma aplicação completa de geração de documentos.
            O documento é apenas o resultado da execução de um projeto.
          </p>
          <p>
            Nossa arquitetura multi-tenant foi desenhada para empresas que operam múltiplas
            unidades, com isolamento completo entre workspaces e um modelo de permissões granular
            (RBAC).
          </p>
          <p>
            Construído sobre React 19, TanStack e Supabase, o ClauseForge combina uma interface
            moderna com a robustez exigida por operações jurídicas e de compliance.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
