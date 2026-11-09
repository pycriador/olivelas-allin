import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Building2,
  ToggleLeft,
  ToggleRight,
  Sliders,
  CheckCircle2,
  Users,
  Settings,
  Sparkles,
  Layers,
  Database,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { mockModules } from '../mock-data/modules';

export const GlobalAdminView: React.FC = () => {
  const {
    condominiums,
    activeCondominium,
    switchCondominium,
    condoModuleOverrides,
    toggleCondoModule,
    showToast,
  } = useApp();

  const [selectedCondoId, setSelectedCondoId] = useState<string>(activeCondominium.id);

  const currentSelectedCondo = condominiums.find((c) => c.id === selectedCondoId) || condominiums[0];
  const overrides = condoModuleOverrides[selectedCondoId] || {};

  const handleToggle = (moduleKey: string, currentVal: boolean) => {
    toggleCondoModule(selectedCondoId, moduleKey, !currentVal);
    showToast(
      'info',
      'Feature Flag Atualizada',
      `Módulo "${moduleKey}" ${!currentVal ? 'habilitado' : 'desabilitado'} para ${currentSelectedCondo.name}.`
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/80 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <span>SaaS Multi-Tenant SuperAdmin</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-xs text-slate-400">Ambiente de Operações Globais</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Painel do Administrador Global & Feature Flags
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Gerencie instâncias de condomínios clientes, planos contratados e habilite/desabilite módulos e recursos sob demanda.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-600/90 text-white border border-blue-500 shadow-xs">
            v0.1 (Beta)
          </span>
        </div>
      </div>

      {/* Condominium Tenant Selector */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Selecione a Instância de Condomínio (Tenant)
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {condominiums.map((condo) => {
            const isSelected = condo.id === selectedCondoId;
            return (
              <div
                key={condo.id}
                onClick={() => {
                  setSelectedCondoId(condo.id);
                  switchCondominium(condo.id, 'global_admin');
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={condo.name}>
                        {condo.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                        ID: {condo.id}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                    {condo.plan.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-2 mt-auto">
                  <span className="font-medium">{condo.totalUnits} Unidades</span>
                  <span className={`text-[10px] font-semibold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                    {isSelected ? 'Instância Ativa' : 'Clique para gerenciar'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Flags & Modules Matrix for Selected Condo */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Módulos Habilitados para {currentSelectedCondo.name}
            </h3>
            <p className="text-xs text-slate-500">
              Personalize o acesso a módulos específicos para este condomínio independente do plano base.
            </p>
          </div>
          <Badge variant="success" size="sm">
            Status: Ativo & Operacional
          </Badge>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {mockModules.map((mod) => {
            const isEnabled = overrides[mod.key] !== undefined ? overrides[mod.key] : mod.globalEnabled;

            return (
              <div key={mod.key} className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {mod.name}
                    </h4>
                    <span className="font-mono text-[10px] text-slate-400">
                      key: {mod.key}
                    </span>
                    <Badge variant={mod.category === 'core' ? 'neutral' : mod.category === 'governance' ? 'purple' : 'primary'} size="sm">
                      {mod.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {mod.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(mod.key, isEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    isEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
