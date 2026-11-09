import React from 'react';
import { useApp } from '../../context/AppContext';
import { mockUsers } from '../../mock-data/users';
import {
  Smartphone,
  Monitor,
  UserCheck,
  Building,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';

export const DemoToolbar: React.FC = () => {
  const {
    currentUser,
    activeRole,
    activeCondominium,
    switchCondominium,
    switchRole,
    loginAs,
    isMobileSimulator,
    toggleMobileSimulator,
    currentView,
    setCurrentView,
    isLoggedIn,
  } = useApp();

  return (
    <div className="bg-slate-950 text-slate-200 border-b border-slate-800 text-xs px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 z-40 select-none">
      {/* Left: Persona Switcher */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60">
          <UserCheck className="w-3 h-3" />
          Persona Demo:
        </span>

        {/* Willian (Morador & Síndico) */}
        <button
          onClick={() => {
            const willian = mockUsers[0];
            loginAs(willian, 'condo-solar-park', 'resident');
          }}
          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
            currentUser.id === 'user-willian' && activeRole === 'resident'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Willian (Morador)
        </button>

        <button
          onClick={() => {
            const willian = mockUsers[0];
            loginAs(willian, 'condo-solar-park', 'trustee');
          }}
          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
            currentUser.id === 'user-willian' && activeRole === 'trustee'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Willian (Síndico)
        </button>

        {/* Patrícia (Administradora Alpha) */}
        <button
          onClick={() => {
            const patricia = mockUsers[1];
            loginAs(patricia, 'condo-solar-park', 'admin');
          }}
          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
            currentUser.id === 'user-patricia'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Patrícia (Admin)
        </button>

        {/* Carlos (Global SaaS Admin) */}
        <button
          onClick={() => {
            const carlos = mockUsers[2];
            loginAs(carlos, 'condo-solar-park', 'global_admin');
          }}
          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
            currentUser.id === 'user-carlos'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Carlos (SuperAdmin)
        </button>
      </div>

      {/* Right Controls: View Switcher, Mobile Simulator Toggle, Landing Page */}
      <div className="flex items-center gap-2">
        {/* Navigation Quick Jump */}
        <button
          onClick={() => setCurrentView('landing')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
            currentView === 'landing' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Landing Page
        </button>

        <button
          onClick={() => setCurrentView('login')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
            currentView === 'login' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Login
        </button>

        <button
          onClick={() => setCurrentView('condo_select')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
            currentView === 'condo_select'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Seleção Condomínio
        </button>

        <button
          onClick={() => setCurrentView('design_system')}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
            currentView === 'design_system'
              ? 'bg-pink-600 text-white'
              : 'text-pink-400 hover:text-pink-300'
          }`}
        >
          ✨ Design System
        </button>

        <span className="text-slate-700">|</span>

        {/* Mobile Device Simulator Button */}
        <button
          onClick={toggleMobileSimulator}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            isMobileSimulator
              ? 'bg-blue-500 text-white shadow-xs'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Alternar entre modo Desktop Enterprise e Simulador de Smartphone Mobile-First"
        >
          {isMobileSimulator ? (
            <>
              <Smartphone className="w-3.5 h-3.5" />
              <span>Modo Mobile Ativo</span>
            </>
          ) : (
            <>
              <Monitor className="w-3.5 h-3.5" />
              <span>Simular Mobile</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
