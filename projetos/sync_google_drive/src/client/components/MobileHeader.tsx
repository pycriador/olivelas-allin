import React from 'react';
import { Menu, Cloud, FolderPlus } from 'lucide-react';
import { AuthStatus } from '../types.js';

interface MobileHeaderProps {
  onOpenMobileMenu: () => void;
  onOpenNewFolder: () => void;
  authStatus: AuthStatus | null;
  unreadCount: number;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onOpenMobileMenu,
  onOpenNewFolder,
  authStatus,
}) => {
  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
      {/* Botão Hamburger Menu & Logo */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 transition active:scale-95"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200">
            <Cloud className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs tracking-tight text-zinc-100">Olivelas Drive</span>
              <span className="text-[9px] uppercase font-semibold px-1 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                Sync
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas Mobile */}
      <div className="flex items-center gap-2">
        {authStatus?.isConnected ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 text-[10px] text-zinc-300 border border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Conectado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 text-[10px] text-amber-400 border border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Offline
          </span>
        )}

        <button
          onClick={onOpenNewFolder}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 transition active:scale-95 shadow-xs"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>Nova Pasta</span>
        </button>
      </div>
    </header>
  );
};
