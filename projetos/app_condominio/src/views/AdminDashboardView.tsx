import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  DollarSign,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Filter,
  Download,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const AdminDashboardView: React.FC = () => {
  const {
    activeCondominium,
    currentUser,
    setCurrentView,
    condominiums,
    switchCondominium,
    showToast,
  } = useApp();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
              Administradora Alpha Gestão
            </span>
            <span className="text-purple-400">•</span>
            <span className="text-xs text-purple-200">Painel Operacional da Administradora</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Gestão Contábil & Governança Predial
          </h1>
          <p className="text-xs sm:text-sm text-purple-200 max-w-xl">
            Visão consolidada de arrecadação, emissão de boletos, folha de pagamento de funcionários e prestação de contas mensal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white text-purple-900 hover:bg-purple-50 font-bold"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => showToast('success', 'Relatório Gerado', 'Balancete analítico consolidado exportado com sucesso.')}
          >
            Exportar Balancete
          </Button>
        </div>
      </div>

      {/* Portfolio Condominiums Quick Bar */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-1">
          Condomínios sob Gestão da Carteira
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {condominiums.map((condo) => {
            const isCurrent = condo.id === activeCondominium.id;
            return (
              <div
                key={condo.id}
                onClick={() => switchCondominium(condo.id, 'admin')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-400 dark:border-purple-700 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={condo.name}>
                        {condo.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        ID: {condo.id}
                      </p>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white shrink-0">
                      Ativo
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-2 mt-1">
                  <span>{condo.totalUnits} unidades</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Plano {condo.plan.toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Overview KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <span className="text-xs font-bold text-slate-400 uppercase">Arrecadação Mês</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            R$ 82.550
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">
            96,2% adimplência
          </span>
        </Card>

        <Card>
          <span className="text-xs font-bold text-slate-400 uppercase">Contratos Vigentes</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            14 contratos
          </p>
          <span className="text-[11px] text-slate-500">
            Segurança, limpeza, elevadores
          </span>
        </Card>

        <Card>
          <span className="text-xs font-bold text-slate-400 uppercase">Despesas Ordinárias</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            R$ 64.200
          </p>
          <span className="text-[11px] text-slate-500">
            Folha + concessionárias
          </span>
        </Card>

        <Card>
          <span className="text-xs font-bold text-slate-400 uppercase">Superávit Projetado</span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            + R$ 18.350
          </p>
          <span className="text-[11px] text-blue-500">
            Destinado ao fundo de reserva
          </span>
        </Card>
      </div>

      {/* Admin Quick Tools */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Acompanhamento de Inadimplência por Bloco
            </h3>
            <Badge variant="neutral" size="sm">Agosto / 2026</Badge>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Bloco A (48 Unidades)</p>
                <p className="text-[11px] text-slate-500">2 boletos em aberto (Apt 103 e Apt 303)</p>
              </div>
              <span className="text-xs font-bold text-amber-600">4,1%</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Bloco B (48 Unidades)</p>
                <p className="text-[11px] text-slate-500">1 boleto em aberto (Apt 402)</p>
              </div>
              <span className="text-xs font-bold text-emerald-600">2,0%</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('units_management')}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Gerenciar Unidades & Moradores
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Ações Rápidas de Administração
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Rotinas contábeis e parametrização do condomínio.
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setCurrentView('resources_config')}
                leftIcon={<ShieldCheck className="w-4 h-4 text-purple-600" />}
              >
                Parâmetros de Áreas Comuns
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setCurrentView('permissions_matrix')}
                leftIcon={<Users className="w-4 h-4 text-blue-600" />}
              >
                Matriz de Perfis & Permissões
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setCurrentView('documents')}
                leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              >
                Sincronizar Google Drive Atas
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
