import React from 'react';
import { Folder, CheckCircle2, Bell, Clock } from 'lucide-react';
import { SyncFolder } from '../types.js';
import { formatBytes } from '../lib/utils.js';

interface DashboardStatsProps {
  folders: SyncFolder[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ folders }) => {
  const totalFolders = folders.length;
  const activeFolders = folders.filter((f) => f.is_active).length;
  const scheduledFolders = folders.filter((f) => f.is_active && f.schedule_enabled).length;
  const watchedFolders = folders.filter((f) => f.is_active && f.watch_enabled).length;

  const totalSyncedFiles = folders.reduce((acc, f) => acc + (f.synced_count || 0), 0);
  const totalBytesSynced = folders.reduce((acc, f) => acc + (f.total_bytes_synced || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Pastas */}
      <div className="rounded-xl p-4 bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3.5 shadow-xs">
        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
          <Folder className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] text-zinc-400 font-medium">Pastas Mapeadas</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-semibold text-zinc-100 font-mono tracking-tight">{totalFolders}</span>
            <span className="text-[11px] text-zinc-400">({activeFolders} ativas)</span>
          </div>
        </div>
      </div>

      {/* Arquivos Sincronizados */}
      <div className="rounded-xl p-4 bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3.5 shadow-xs">
        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-[11px] text-zinc-400 font-medium">Arquivos Enviados</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-semibold text-zinc-100 font-mono tracking-tight">{totalSyncedFiles}</span>
            <span className="text-[11px] text-zinc-400 font-mono">({formatBytes(totalBytesSynced)})</span>
          </div>
        </div>
      </div>

      {/* Monitoramento de Novos Arquivos */}
      <div className="rounded-xl p-4 bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3.5 shadow-xs">
        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
          <Bell className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p className="text-[11px] text-zinc-400 font-medium">Monitoramento Ativo</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-semibold text-zinc-100 font-mono tracking-tight">{watchedFolders}</span>
            <span className="text-[11px] text-zinc-400">pastas vigiadas</span>
          </div>
        </div>
      </div>

      {/* Agendamentos */}
      <div className="rounded-xl p-4 bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3.5 shadow-xs">
        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
          <Clock className="w-4 h-4 text-zinc-300" />
        </div>
        <div>
          <p className="text-[11px] text-zinc-400 font-medium">Rotinas Agendadas</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-semibold text-zinc-100 font-mono tracking-tight">{scheduledFolders}</span>
            <span className="text-[11px] text-zinc-400">em segundo plano</span>
          </div>
        </div>
      </div>
    </div>
  );
};
