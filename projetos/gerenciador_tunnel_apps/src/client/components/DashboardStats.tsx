import React from 'react';
import { Server, Cpu, Globe, Wifi } from 'lucide-react';
import { AppTunnelItem, ProvidersStatus } from '../types.js';

interface DashboardStatsProps {
  apps: AppTunnelItem[];
  providersStatus: ProvidersStatus | null;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ apps, providersStatus }) => {
  const totalApps = apps.length;
  const activeApps = apps.filter((a) => a.is_active).length;
  const runningApps = apps.filter((a) => a.is_running).length;
  const onlineTunnels = apps.filter((a) => a.tunnel_status === 'online').length;
  const totalRuns = apps.reduce((acc, a) => acc + (a.total_runs || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Aplicações Cadastradas */}
      <div className="rounded-xl p-4 bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3.5 shadow-xs">
        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
          <Server className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] text-zinc-400 font-medium">Serviços & Apps</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-semibold text-zinc-100 font-mono tracking-tight">{totalApps}</span>
            <span className="text-[11px] text-zinc-400">({activeApps} habilitados)</span>
          </div>
        </div>
      </div>

      {/* Processos Rodando */}
      <div className="rounded-xl p-4 bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3.5 shadow-xs">
        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
          <Cpu className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-[11px] text-zinc-400 font-medium">Processos Ativos</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-semibold text-zinc-100 font-mono tracking-tight">{runningApps}</span>
            <span className="text-[11px] text-zinc-400">em execução local</span>
          </div>
        </div>
      </div>

      {/* Túneis Públicos */}
      <div className="rounded-xl p-4 bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3.5 shadow-xs">
        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
          <Globe className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <p className="text-[11px] text-zinc-400 font-medium">Túneis Públicos Web</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-semibold text-zinc-100 font-mono tracking-tight">{onlineTunnels}</span>
            <span className="text-[11px] text-zinc-400">URLs online</span>
          </div>
        </div>
      </div>

      {/* Rede Local & Execuções */}
      <div className="rounded-xl p-4 bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3.5 shadow-xs">
        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 shrink-0">
          <Wifi className="w-4 h-4 text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-zinc-400 font-medium">IP Rede Local (LAN)</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-sm font-semibold text-zinc-100 font-mono tracking-tight truncate">
              {providersStatus?.lanIp || '127.0.0.1'}
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">({totalRuns} runs)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
