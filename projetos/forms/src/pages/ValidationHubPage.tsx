import React from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  AlertTriangle,
  FileSpreadsheet,
  Key,
  Layers,
  ArrowRight,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Code2,
  FileText,
  ShieldAlert,
} from 'lucide-react';

interface RouteValidationItem {
  id: string;
  name: string;
  route: string;
  componentFile: string;
  category: string;
  status: 'redundante' | 'migrado' | 'legado' | 'descontinuado';
  replacement: string;
  description: string;
  actionUrl: string;
}

export const ValidationHubPage: React.FC = () => {
  const itemsToValidate: RouteValidationItem[] = [
    {
      id: 'google-global-integration',
      name: 'Integração Google Global Legada',
      route: '/app/integrations',
      componentFile: 'src/pages/GoogleIntegrationsPage.tsx',
      category: 'Integrações',
      status: 'migrado',
      replacement: '/app/groups/:id/google (Isolamento por Grupo)',
      description:
        'Página antiga de integração do Google Sheets a nível global/individual. O sistema agora utiliza governança descentralizada com Service Account por Grupo em /app/groups.',
      actionUrl: '/app/integrations',
    },
    {
      id: 'token-create-isolated',
      name: 'Criador Isolado de Token API',
      route: '/app/tokens/new',
      componentFile: 'src/pages/TokenCreatePage.tsx',
      category: 'Segurança & HBAC',
      status: 'redundante',
      replacement: '/app/tokens (Modal integrado com vinculação de grupo)',
      description:
        'Página avulsa para geração de token. Agora substituída pelo modal ágil diretamente na listagem de tokens, com edição de escopos e seleção de grupo.',
      actionUrl: '/app/tokens/new',
    },
    {
      id: 'group-google-alias',
      name: 'Alias de Configuração Google do Grupo',
      route: '/app/integrations/groups/:groupId',
      componentFile: 'src/pages/GroupGoogleConfigPage.tsx',
      category: 'Roteamento',
      status: 'redundante',
      replacement: '/app/groups/:id/google',
      description:
        'Rota alias duplicada apontando para a mesma tela de configuração da Service Account Google do Grupo. O padrão REST oficial adotado no projeto é /app/groups/:id/google.',
      actionUrl: '/app/integrations/groups/bcab9a01-2ce8-47b7-a406-817e74891ce4',
    },
    {
      id: 'google-oauth-callback',
      name: 'Redirect Callback Google OAuth Legado',
      route: '/integrations/google/callback',
      componentFile: 'src/routes/index.tsx (GoogleOAuthCallbackRedirect)',
      category: 'Autenticação',
      status: 'legado',
      replacement: 'Autenticação Service Account JSON por Grupo',
      description:
        'Componente de redirecionamento para capturar o código OAuth de consentimento do Google. Tornou-se desnecessário com o uso exclusivo de Contas de Serviço corporativas.',
      actionUrl: '/integrations/google/callback',
    },
  ];

  const getStatusBadge = (status: RouteValidationItem['status']) => {
    switch (status) {
      case 'migrado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            Migrado
          </span>
        );
      case 'redundante':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Redundante
          </span>
        );
      case 'legado':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
            Legado
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Descontinuado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-bold mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            Divisão de Validação & Limpeza
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Páginas e Rotas em Análise para Exclusão
          </h1>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Esta seção centraliza todas as páginas e rotas legadas, duplicadas ou que foram substituídas por novas abordagens (como isolamento por grupo ou modais rápidos). Você pode inspecionar cada uma e solicitar a remoção definitiva.
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-surface border border-border shadow-xs text-right">
          <span className="text-xs text-muted-foreground block font-medium">Itens em Revisão</span>
          <span className="text-xl font-black text-amber-500">{itemsToValidate.length} rotas</span>
        </div>
      </div>

      {/* Info Alert Box */}
      <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 glass flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-foreground space-y-1">
          <p className="font-bold text-amber-600 dark:text-amber-400">
            Instrução para Limpeza do Código
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Nenhuma dessas rotas interfere no fluxo de produção atual. Quando estiver pronto para remover os arquivos fontes correspondentes, basta avisar pelo chat: <em>"Pode deletar as rotas não usadas da divisão Validar"</em> e faremos a limpeza completa e segura do repositório.
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {itemsToValidate.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4 glass hover:border-amber-500/40 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {item.category}
                </span>
                {getStatusBadge(item.status)}
              </div>

              <div>
                <h3 className="font-bold text-base text-foreground leading-snug">
                  {item.name}
                </h3>
                <div className="text-xs font-mono text-primary font-bold mt-0.5">
                  {item.route}
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.description}
              </p>

              <div className="pt-2 border-t border-border/60 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Code2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="font-mono truncate">{item.componentFile}</span>
                </div>
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Substituto: <strong>{item.replacement}</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground italic">
                Aguardando autorização
              </span>

              <Link
                to={item.actionUrl}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-muted hover:bg-surface-hover text-foreground border border-border flex items-center gap-1.5 transition-colors"
              >
                <span>Inspecionar</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
