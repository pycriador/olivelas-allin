import { KeyRound, Lock, Shield, UserCheck, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function UserManagementMockup() {
  return (
    <div className="rounded-2xl border border-border bg-card/90 shadow-xl overflow-hidden backdrop-blur">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-destructive/60" />
            <span className="size-3 rounded-full bg-amber-500/60" />
            <span className="size-3 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-xs font-semibold text-foreground ml-2">
            Gestão de Usuários, Roles (Perfis) e Políticas de Segurança (RBAC & RLS)
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-500/30">
          Supabase Auth + RBAC
        </Badge>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* User Table Simulation */}
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-muted/40 px-3 py-2 border-b border-border flex items-center justify-between text-xs font-semibold">
            <span>Operadores & Administradores Cadastrados</span>
            <span className="text-primary font-normal text-[11px] flex items-center gap-1">
              <UserPlus className="size-3" />
              Novo Operador
            </span>
          </div>

          <div className="divide-y divide-border text-xs">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  GA
                </div>
                <div>
                  <p className="font-bold text-foreground">Gabriel Almeida</p>
                  <p className="text-[11px] text-muted-foreground font-mono">gabriel@rafflehub.com.br</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground text-[10px] font-bold">
                  GLOBAL_ADMIN
                </Badge>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">● Ativo</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-muted text-foreground flex items-center justify-center font-bold text-xs">
                  FM
                </div>
                <div>
                  <p className="font-bold text-foreground">Fernanda Moreira</p>
                  <p className="text-[11px] text-muted-foreground font-mono">fernanda@suporte.com</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-blue-500/40 text-blue-600 text-[10px] font-bold">
                  SUPPORT_OPERATOR
                </Badge>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">● Ativo</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-muted text-foreground flex items-center justify-center font-bold text-xs">
                  RC
                </div>
                <div>
                  <p className="font-bold text-foreground">Roberto Costa</p>
                  <p className="text-[11px] text-muted-foreground font-mono">roberto@financeiro.com</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-amber-500/40 text-amber-600 text-[10px] font-bold">
                  FINANCE_MANAGER
                </Badge>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">● Ativo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Roles & Permissions Matrix */}
        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Shield className="size-4 text-primary" />
              GLOBAL_ADMIN
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Acesso irrestrito a criação de rifas, aprovação de artes, gestão financeira, usuários e logs de auditoria.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <UserCheck className="size-4 text-blue-500" />
              SUPPORT_OPERATOR
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Operação de reservas, atendimento WhatsApp, lançamento de vendas manuais e conferência de comprovantes.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Lock className="size-4 text-emerald-500" />
              Segurança RLS
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Políticas de Row Level Security garantem que cada consulta seja filtrada no banco de dados com isolamento estrito.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
