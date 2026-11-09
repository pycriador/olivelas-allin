import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Check, X, Lock, Users } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const PermissionsMatrixView: React.FC = () => {
  const { activeCondominium } = useApp();

  const permissionsList = [
    { module: 'Boletos & Taxas', action: 'Visualizar próprio boleto & pagar via PIX', resident: true, trustee: true, admin: true, globalAdmin: true },
    { module: 'Boletos & Taxas', action: 'Emitir boletos em lote e ver inadimplência global', resident: false, trustee: true, admin: true, globalAdmin: true },
    { module: 'Reservas de Lazer', action: 'Reservar salão/churrasqueira', resident: true, trustee: true, admin: true, globalAdmin: true },
    { module: 'Reservas de Lazer', action: 'Aprovar/Recusar reservas e alterar bloqueios', resident: false, trustee: true, admin: true, globalAdmin: true },
    { module: 'Documentos & Drive', action: 'Consultar convenção, regimento e atas', resident: true, trustee: true, admin: true, globalAdmin: true },
    { module: 'Documentos & Drive', action: 'Upload de novos documentos e balancetes contábeis', resident: false, trustee: true, admin: true, globalAdmin: true },
    { module: 'Assembleias', action: 'Participar e votar nas pautas convocadas', resident: true, trustee: true, admin: true, globalAdmin: true },
    { module: 'Assembleias', action: 'Convocar assembleia e cadastrar pautas/cédulas', resident: false, trustee: true, admin: true, globalAdmin: true },
    { module: 'Ocorrências', action: 'Registrar ocorrência (com foto/sigilo)', resident: true, trustee: true, admin: true, globalAdmin: true },
    { module: 'Ocorrências', action: 'Emitir parecer oficial, advertência ou concluir', resident: false, trustee: true, admin: true, globalAdmin: true },
    { module: 'Mural de Avisos', action: 'Ler comunicados oficiais', resident: true, trustee: true, admin: true, globalAdmin: true },
    { module: 'Mural de Avisos', action: 'Publicar novos comunicados oficiais e fixar avisos', resident: false, trustee: true, admin: true, globalAdmin: true },
    { module: 'SaaS Config', action: 'Gerenciar Feature Flags e instâncias de condomínio', resident: false, trustee: false, admin: false, globalAdmin: true },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {activeCondominium.name}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-500">Segurança & RBAC</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Matriz de Perfis & Permissões (RBAC)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Tabela detalhada de privilégios e controle de acesso baseado em papéis para cada módulo da plataforma.
        </p>
      </div>

      <Card padding="none" className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300">
              <th className="p-4">Módulo Funcional</th>
              <th className="p-4">Ação / Operação</th>
              <th className="p-4 text-center">Morador</th>
              <th className="p-4 text-center">Síndico Geral</th>
              <th className="p-4 text-center">Administração</th>
              <th className="p-4 text-center">SuperAdmin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {permissionsList.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="p-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                  {row.module}
                </td>
                <td className="p-4 text-slate-600 dark:text-slate-400">
                  {row.action}
                </td>
                <td className="p-4 text-center">
                  {row.resident ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                      <X className="w-3.5 h-3.5" />
                    </span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {row.trustee ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                      <X className="w-3.5 h-3.5" />
                    </span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {row.admin ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                      <X className="w-3.5 h-3.5" />
                    </span>
                  )}
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
