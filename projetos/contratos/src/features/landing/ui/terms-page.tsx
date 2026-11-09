import { PublicLayout } from "@/layouts/public-layout";
import { APP_NAME } from "@/constants/app";

export function TermsPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-tight">Termos de Uso</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: 1 de setembro de 2026
        </p>
        <div className="mt-10 space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos termos</h2>
            <p>
              Ao acessar ou utilizar o {APP_NAME}, você concorda com estes termos. Se não concordar,
              não utilize a plataforma.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Uso da plataforma</h2>
            <p>
              A plataforma é fornecida para automação de documentos corporativos. Você é responsável
              pelo conteúdo gerado e por cumprir a legislação aplicável.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Contas e responsabilidades</h2>
            <p>
              Você é responsável por manter a confidencialidade das credenciais e por todas as
              atividades realizadas na sua conta.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              4. Limitação de responsabilidade
            </h2>
            <p>
              Não garantimos que os documentos gerados substituam assessoria jurídica profissional.
              O uso da plataforma é de sua responsabilidade.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Alterações</h2>
            <p>
              Podemos atualizar estes termos periodicamente. Alterações relevantes serão comunicadas
              pela plataforma.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
