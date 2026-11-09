import { Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AdminIamPage() {
  const platformRoles = [
    {
      id: 'global_admin',
      name: 'Global Admin (Superadmin)',
      desc: 'Acesso administrativo irrestrito à plataforma inteira, gerenciamento de todos os restaurantes, usuários, suporte auditado e governança de dados.',
      badge: 'Nível 1 — Plataforma',
    },
    {
      id: 'platform_support',
      name: 'Suporte da Plataforma',
      desc: 'Agente autorizado a iniciar sessões de atendimento e suporte técnico aos restaurantes com justificativa obrigatória e rastreabilidade total.',
      badge: 'Nível 1 — Suporte',
    },
  ];

  const tenantRoles = [
    {
      id: 'restaurant_admin',
      name: 'Administrador do Restaurante',
      desc: 'Gestão completa do restaurante, configurações fiscais, equipe, cardápio, mesas e fechamento de caixa.',
      permissions: ['Todas as permissões do tenant'],
    },
    {
      id: 'manager',
      name: 'Gerente',
      desc: 'Gestão operacional do dia a dia, produtos, mesas, relatórios diários e cancelamento de pedidos.',
      permissions: ['restaurant.view', 'products.*', 'tables.*', 'orders.*', 'kitchen.*', 'cashier.view'],
    },
    {
      id: 'waiter',
      name: 'Garçom',
      desc: 'Operação de atendimento, status de mesas, lançamento e acompanhamento de pedidos no salão.',
      permissions: ['tables.view', 'orders.create', 'orders.update', 'products.view'],
    },
    {
      id: 'kitchen',
      name: 'Cozinha (KDS)',
      desc: 'Visualização da fila de pedidos da cozinha e atualização de status de preparo.',
      permissions: ['kitchen.view', 'kitchen.update', 'orders.view'],
    },
    {
      id: 'cashier',
      name: 'Caixa',
      desc: 'Fechamento de contas, emissão de comprovantes e conferência de caixa.',
      permissions: ['cashier.view', 'cashier.update', 'orders.view', 'tables.view'],
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            IAM & Matriz de Papéis (RBAC)
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Arquitetura de dois níveis: papéis globais de plataforma e papéis operacionais multi-tenant.
          </p>
        </div>
      </div>

      {/* Level 1: Platform Roles */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-xs">
            Nível 1: Plataforma SaaS
          </Badge>
          <span className="text-xs text-muted-foreground">Administradores do sistema Olivelas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platformRoles.map((role) => (
            <Card key={role.id} className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">{role.name}</CardTitle>
                  <code className="text-[11px] px-2 py-0.5 rounded bg-muted font-mono">{role.id}</code>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {role.desc}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Level 2: Tenant Roles */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-semibold text-xs">
            Nível 2: Restaurante Multi-Tenant
          </Badge>
          <span className="text-xs text-muted-foreground">Papéis vinculados à associação restaurant_members</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tenantRoles.map((role) => (
            <Card key={role.id} className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{role.name}</CardTitle>
                  <code className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-mono">{role.id}</code>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-muted-foreground text-[11px]">{role.desc}</p>
                <div className="pt-2 border-t border-border/60">
                  <span className="text-[10px] font-semibold text-muted-foreground block mb-1 uppercase tracking-wider">
                    Permissões:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((p) => (
                      <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 font-mono">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
