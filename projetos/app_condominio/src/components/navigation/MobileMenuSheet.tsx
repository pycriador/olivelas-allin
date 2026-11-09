import React from 'react';
import { useApp, AppView } from '../../context/AppContext';
import { BottomSheet } from '../ui/BottomSheet';
import {
  Receipt,
  FileText,
  LifeBuoy,
  AlertTriangle,
  Users2,
  CalendarCheck2,
  Building,
  Sliders,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Layers,
  LogOut,
  User,
  Sparkles,
} from 'lucide-react';

interface MobileMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenuSheet: React.FC<MobileMenuSheetProps> = ({ isOpen, onClose }) => {
  const {
    setCurrentView,
    activeRole,
    currentUser,
    logout,
    setIsContextSwitcherOpen,
    setIsAiSearchOpen,
  } = useApp();

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    onClose();
  };

  const isTrusteeOrAdmin = activeRole === 'trustee' || activeRole === 'admin' || activeRole === 'global_admin';
  const isGlobalAdmin = activeRole === 'global_admin' || currentUser.isGlobalAdmin;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Menu & Serviços">
      <div className="space-y-6 pb-4">
        {/* Resident Services Grid */}
        <div>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2 px-1">
            Serviços do Condomínio
          </span>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => handleNavigate('bills')}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 active:scale-95 transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5 shadow-2xs">
                <Receipt className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Boletos</span>
              <span className="text-[10px] text-amber-600 font-semibold">1 pendente</span>
            </button>

            <button
              onClick={() => handleNavigate('reservations')}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 active:scale-95 transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5 shadow-2xs">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Reservas</span>
              <span className="text-[10px] text-slate-400">Espaços</span>
            </button>

            <button
              onClick={() => handleNavigate('documents')}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 active:scale-95 transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1.5 shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Documentos</span>
              <span className="text-[10px] text-slate-400">Atas & Regras</span>
            </button>

            <button
              onClick={() => handleNavigate('requests')}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 active:scale-95 transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5 shadow-2xs">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Solicitações</span>
              <span className="text-[10px] text-slate-400">2ª via & tags</span>
            </button>

            <button
              onClick={() => handleNavigate('occurrences')}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 active:scale-95 transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-1.5 shadow-2xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Ocorrências</span>
              <span className="text-[10px] text-slate-400">Livro digital</span>
            </button>

            <button
              onClick={() => handleNavigate('assemblies')}
              className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 active:scale-95 transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1.5 shadow-2xs">
                <Users2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Assembleias</span>
              <span className="text-[10px] text-purple-600 font-semibold">1 votação</span>
            </button>
          </div>
        </div>

        {/* AI Assistant Quick Banner */}
        <div
          onClick={() => {
            onClose();
            setIsAiSearchOpen(true);
          }}
          className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md cursor-pointer active:scale-98 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold">Assistente Inteligente (IA)</p>
              <p className="text-[11px] text-blue-100">Consulte regras e regimentos com IA</p>
            </div>
          </div>
          <span className="text-xs bg-white text-blue-600 px-2 py-1 rounded-lg font-bold">
            Abrir
          </span>
        </div>

        {/* Management Tools (if Trustee / Admin) */}
        {isTrusteeOrAdmin && (
          <div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-2 px-1">
              Gestão & Administração
            </span>
            <div className="space-y-1.5">
              <button
                onClick={() => handleNavigate('trustee_dashboard')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold"
              >
                <div className="flex items-center gap-2.5">
                  <Building className="w-4 h-4 text-amber-500" />
                  <span>Painel do Síndico & Indicadores</span>
                </div>
              </button>
              <button
                onClick={() => handleNavigate('units_management')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-blue-500" />
                  <span>Unidades & Moradores</span>
                </div>
              </button>
              <button
                onClick={() => handleNavigate('resources_config')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  <span>Parâmetros de Áreas Comuns</span>
                </div>
              </button>
              <button
                onClick={() => handleNavigate('permissions_matrix')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Matriz de Permissões (RBAC)</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Global Admin SaaS Tools */}
        {isGlobalAdmin && (
          <div>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block mb-2 px-1">
              Plataforma SaaS SuperAdmin
            </span>
            <div className="space-y-1.5">
              <button
                onClick={() => handleNavigate('global_admin')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 text-xs font-semibold border border-purple-200 dark:border-purple-800/60"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Painel Global Multi-Condomínios</span>
                </div>
              </button>
              <button
                onClick={() => handleNavigate('modules_management')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 text-xs font-semibold border border-purple-200 dark:border-purple-800/60"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Feature Flags & Módulos</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={() => handleNavigate('design_system')}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 text-xs font-bold border border-pink-200 dark:border-pink-800/60"
          >
            <Sparkles className="w-4 h-4 text-pink-600" />
            <span>Design System & Tokens</span>
          </button>

          <button
            onClick={() => {
              onClose();
              setIsContextSwitcherOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold"
          >
            <Building className="w-4 h-4 text-blue-600" />
            <span>Alternar Condomínio</span>
          </button>

          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
