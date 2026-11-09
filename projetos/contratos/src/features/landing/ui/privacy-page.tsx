import { PublicLayout } from "@/layouts/public-layout";
import { APP_NAME } from "@/constants/app";

export function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-tight">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Última atualização: 1 de setembro de 2026
        </p>
        <div className="prose mt-10 space-y-6 text-muted-foreground dark:prose-invert">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Dados que coletamos</h2>
            <p>
              Coletamos informações de conta (nome, email, avatar) necessárias para autenticação via
              Google ou email/senha, além de dados de uso e logs de auditoria para garantir a
              segurança da plataforma.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Uso dos dados</h2>
            <p>
              Utilizamos seus dados exclusivamente para operar a plataforma, proteger sua conta,
              fornecer suporte e melhorar a experiência do produto. Nunca vendemos dados pessoais.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Segurança</h2>
            <p>
              Credenciais de conectores são armazenadas de forma criptografada. Sessões utilizam
              refresh tokens e toda ação relevante é registrada em trilhas de auditoria.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Contato</h2>
            <p>Dúvidas sobre privacidade podem ser enviadas pela página de contato.</p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
