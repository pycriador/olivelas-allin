import React from 'react';
import { Menu, Globe, Plus } from 'lucide-react';
import { AppTunnelItem } from '../types.js';

interface MobileHeaderProps {
  onOpenMobileMenu: () => void;
  onOpenNewApp: () => void;
  apps: AppTunnelItem[];
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onOpenMobileMenu,
  onOpenNewApp,
  apps,
}) => {
  const runningCount = apps.filter((a) => a.is_running).length;
  const tunnelCount = apps.filter((a) => a.tunnel_status === 'online').length;

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 transition active:scale-95"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs tracking-tight text-zinc-100">Olivelas</span>
              <span className="text-[9px] uppercase font-semibold px-1 py-0.2 rounded bg-zinc-800 text-emerald-400 border border-zinc-700/60">
                Tunnel
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {runningCount > 0 ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 text-[10px] text-zinc-200 border border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {runningCount} rodando {tunnelCount > 0 ? `(${tunnelCount} web)` : ''}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 text-[10px] text-zinc-400 border border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            Ocioso
          </span>
        )}

        <button
          onClick={onOpenNewApp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 transition active:scale-95 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Novo</span>
        </button>
      </div>
    </header>
  );
};
