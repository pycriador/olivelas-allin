import React from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../ui/Modal';
import { Building2, Check, Shield, User, ChevronRight, Sparkles } from 'lucide-react';
import { mockMemberships } from '../../mock-data/users';

export const ContextSwitcherModal: React.FC = () => {
  const {
    isContextSwitcherOpen,
    setIsContextSwitcherOpen,
    currentUser,
    activeCondominium,
    activeRole,
    switchCondominium,
    condominiums,
  } = useApp();

  const userMemberships = mockMemberships.filter((m) => m.userId === currentUser.id);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'resident':
        return 'Morador';
      case 'trustee':
        return 'Síndico';
      case 'admin':
        return 'Administração';
      case 'global_admin':
        return 'Admin Global';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'trustee':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
      case 'global_admin':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <Modal
      isOpen={isContextSwitcherOpen}
      onClose={() => setIsContextSwitcherOpen(false)}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Alternar Condomínio & Contexto
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Identidade única de {currentUser.name.split(' ')[0]} vinculada a múltiplos condomínios
            </p>
          </div>
        </div>
      }
      maxWidth="md"
    >
      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
          Seus vínculos ativos na plataforma
        </p>

        <div className="space-y-2">
          {userMemberships.map((mem) => {
            const condo = condominiums.find((c) => c.id === mem.condominiumId);
            const isSelected =
              mem.condominiumId === activeCondominium.id && mem.role === activeRole;

            return (
              <div
                key={mem.id}
                onClick={() => switchCondominium(mem.condominiumId, mem.role)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700/80 shadow-xs'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {condo?.name || 'Condomínio'}
                      </h4>
                      {isSelected && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                          Ativo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {mem.unitNumber ? (
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          Apt {mem.unitNumber} {mem.block ? `(${mem.block})` : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Sede Corporativa
                        </span>
                      )}
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(
                          mem.role
                        )}`}
                      >
                        {getRoleLabel(mem.role)}
                      </span>
                    </div>
                    {mem.customTitle && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {mem.customTitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Admin shortcut if applicable */}
        {currentUser.isGlobalAdmin && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                switchCondominium(activeCondominium.id, 'global_admin');
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-xs font-semibold cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Acessar Painel Global SaaS SuperAdmin</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
