import React from 'react';
import { useApp } from '../context/AppContext';
import { mockMemberships } from '../mock-data/users';
import { Building2, ArrowRight, Shield, Check, PlusCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const CondoSelectView: React.FC = () => {
  const {
    currentUser,
    condominiums,
    switchCondominium,
    activeCondominium,
    activeRole,
    setCurrentView,
  } = useApp();

  const userMemberships = mockMemberships.filter((m) => m.userId === currentUser.id);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'resident':
        return 'Morador';
      case 'trustee':
        return 'Síndico Geral';
      case 'admin':
        return 'Administração';
      case 'global_admin':
        return 'SuperAdmin Global';
      default:
        return role;
    }
  };

  const getRoleBadgeVariant = (role: string): any => {
    switch (role) {
      case 'trustee':
        return 'warning';
      case 'admin':
        return 'purple';
      case 'global_admin':
        return 'primary';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Olá, {currentUser.name.split(' ')[0]}!
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            v0.1 (Beta)
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Onde você deseja entrar agora? Selecione o condomínio ou perfil de atuação.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="space-y-3">
          {userMemberships.map((mem) => {
            const condo = condominiums.find((c) => c.id === mem.condominiumId);
            const isCurrentlyActive =
              mem.condominiumId === activeCondominium.id && mem.role === activeRole;

            return (
              <Card
                key={mem.id}
                hoverable
                onClick={() => {
                  switchCondominium(mem.condominiumId, mem.role);
                  if (mem.role === 'trustee') setCurrentView('trustee_dashboard');
                  else if (mem.role === 'admin') setCurrentView('admin_dashboard');
                  else if (mem.role === 'global_admin') setCurrentView('global_admin');
                  else setCurrentView('dashboard');
                }}
                className={`transition-all ${
                  isCurrentlyActive
                    ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                          {condo?.name || 'Condomínio'}
                        </h3>
                        {isCurrentlyActive && (
                          <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                            Sessão Atual
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {mem.unitNumber ? (
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            Unidade {mem.unitNumber} {mem.block ? `(${mem.block})` : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Gestão Corporativa</span>
                        )}
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <Badge variant={getRoleBadgeVariant(mem.role)} size="sm">
                          {getRoleLabel(mem.role)}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                        {condo?.address
                          ? `${condo.address.street}, ${condo.address.number} - ${condo.address.neighborhood}, ${condo.address.city}/${condo.address.state}`
                          : ''}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Add another condominium action */}
          <button
            onClick={() => {
              // demo switch to Global admin
              switchCondominium(activeCondominium.id, 'global_admin');
              setCurrentView('global_admin');
            }}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs font-bold cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Vincular novo condomínio com código de convite</span>
          </button>
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentView('landing')}
          >
            Voltar para Landing Page
          </Button>
        </div>
      </div>
    </div>
  );
};
