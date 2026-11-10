import React from 'react';
import {
  Folder,
  Cloud,
  Clock,
  Bell,
  Play,
  Square,
  RotateCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { SyncFolder, SyncProgressPayload } from '../types.js';
import { formatBytes, formatRelativeTime } from '../lib/utils.js';

interface FolderCardProps {
  folder: SyncFolder;
  progress?: SyncProgressPayload;
  onSync: (id: number) => void;
  onStopSync: (id: number) => void;
  onEdit: (folder: SyncFolder) => void;
  onDelete: (id: number) => void;
  onToggleActive: (folder: SyncFolder) => void;
  onTestWatch?: (id: number) => void;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  progress,
  onSync,
  onStopSync,
  onEdit,
  onDelete,
  onToggleActive,
  onTestWatch,
}) => {
  const isSyncing = folder.is_syncing || (progress && progress.folderId === folder.id);

  const getStatusBadge = () => {
    if (isSyncing) {
      return (
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700/60 text-[11px] font-medium">
          <RotateCw className="w-3 h-3 animate-spin text-zinc-400" /> Sincronizando
        </span>
      );
    }

    switch (folder.last_sync_status) {
      case 'success':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Sucesso
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-950/40 text-red-300 border border-red-800/60 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Falha
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800/50 text-zinc-400 border border-zinc-800 text-[11px] font-medium">
            Ocioso
          </span>
        );
    }
  };

  const getScheduleText = () => {
    if (!folder.schedule_enabled) return 'Manual';
    switch (folder.schedule_interval) {
      case '15m': return 'A cada 15m';
      case '30m': return 'A cada 30m';
      case 'hourly': return 'A cada 1h';
      case '6h': return 'A cada 6h';
      case 'daily': return 'Diário';
      case 'custom': return `Cron: ${folder.schedule_cron}`;
      default: return 'Agendado';
    }
  };

  return (
    <div
      className={`rounded-xl p-4 border transition-all duration-200 flex flex-col justify-between ${
        !folder.is_active
          ? 'opacity-60 bg-zinc-900/30 border-zinc-800/60'
          : 'bg-zinc-900/60 hover:bg-zinc-900/80 border-zinc-800 hover:border-zinc-700/80 shadow-xs'
      }`}
    >
      {/* Top row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              folder.is_active ? 'bg-zinc-800 text-zinc-200 border border-zinc-700/60' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
            }`}>
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-100 tracking-tight">{folder.name}</h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                {formatRelativeTime(folder.last_synced_at)}
              </p>
            </div>
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Informações de Caminho */}
        <div className="space-y-1.5 my-3 text-[11px] font-mono bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/80">
          <div className="flex items-start gap-1.5">
            <span className="text-zinc-400 shrink-0 font-sans text-[10px] uppercase font-semibold">Local:</span>
            <span className="text-zinc-300 truncate" title={folder.local_path}>
              {folder.local_path}
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-zinc-400 shrink-0 font-sans text-[10px] uppercase font-semibold">Drive:</span>
            <span className="text-zinc-300 truncate flex items-center gap-1" title={folder.gdrive_folder_id}>
              <Cloud className="w-3 h-3 text-zinc-400 shrink-0" />
              {folder.gdrive_folder_name || folder.gdrive_folder_id}
            </span>
          </div>
        </div>

        {/* Badges de Recurso */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px]">
          {/* Badge de Agendamento */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${
            folder.schedule_enabled
              ? 'bg-zinc-800/80 text-zinc-200 border-zinc-700/60'
              : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/60'
          }`}>
            <Clock className="w-3 h-3 text-zinc-400" />
            {getScheduleText()}
          </span>

          {/* Badge de Notificação de Novos Arquivos */}
          {folder.watch_enabled ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-200 border border-zinc-700/60"
              title={
                folder.watch_auto_sync
                  ? `Sincronização automática disparada após ${folder.watch_delay_seconds || 10}s`
                  : `Sugere execução na tela após ${folder.watch_delay_seconds || 10}s de novos arquivos`
              }
            >
              <Bell className="w-3 h-3 text-amber-400" />
              {folder.watch_auto_sync ? 'Auto' : 'Watcher'} ({folder.watch_delay_seconds || 10}s)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900/60 text-zinc-400 border border-zinc-800/60">
              Monitor desligado
            </span>
          )}

          {/* Extensões */}
          {folder.file_extensions && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono text-[10px]">
              {folder.file_extensions}
            </span>
          )}
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-2 gap-2 text-center py-2 px-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/60 mb-3">
          <div>
            <p className="text-[10px] text-zinc-400 font-medium">Arquivos Enviados</p>
            <p className="text-xs font-semibold text-zinc-200 font-mono mt-0.5">{folder.synced_count || 0}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 font-medium">Volume Total</p>
            <p className="text-xs font-semibold text-zinc-200 font-mono mt-0.5">{formatBytes(folder.total_bytes_synced || 0)}</p>
          </div>
        </div>

        {/* Progresso de Sincronização em Tempo Real */}
        {isSyncing && progress && progress.folderId === folder.id && (
          <div className="my-2 p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                <RotateCw className="w-3 h-3 animate-spin text-zinc-400" />
                {progress.current} de {progress.total}
              </span>
              <span className="font-mono text-zinc-100 font-medium">{progress.percent}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-zinc-200 transition-all duration-300 rounded-full"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 truncate font-mono">
              {progress.currentFile}
            </p>
          </div>
        )}

        {/* Mensagem de Erro se houver */}
        {folder.last_sync_status === 'error' && folder.last_sync_message && !isSyncing && (
          <div className="my-2 p-2 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
            {folder.last_sync_message}
          </div>
        )}
      </div>

      {/* Ações do Card */}
      <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleActive(folder)}
            className={`px-2 py-1 rounded-md text-xs transition ${
              folder.is_active
                ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                : 'text-amber-400 hover:bg-amber-500/10'
            }`}
            title={folder.is_active ? 'Pausar pasta' : 'Ativar pasta'}
          >
            {folder.is_active ? 'Pausar' : 'Ativar'}
          </button>

          {folder.watch_enabled && onTestWatch && (
            <button
              onClick={() => onTestWatch(folder.id)}
              className="p-1.5 text-zinc-400 hover:text-amber-400 rounded-md hover:bg-zinc-800/60 transition"
              title="Testar validação do monitoramento"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onEdit(folder)}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-zinc-800/60 transition"
            title="Editar configurações"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(folder.id)}
            className="p-1.5 text-zinc-400 hover:text-red-400 rounded-md hover:bg-red-500/10 transition"
            title="Remover pasta"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Botão Sincronizar Agora ou Parar Sincronização */}
        {isSyncing ? (
          <button
            onClick={() => onStopSync(folder.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/60 transition active:scale-95"
            title="Interromper sincronização"
          >
            <Square className="w-3 h-3 fill-current" />
            Parar
          </button>
        ) : (
          <button
            disabled={!folder.is_active}
            onClick={() => onSync(folder.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 shadow-xs transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Play className="w-3 h-3 fill-current" />
            Sincronizar
          </button>
        )}
      </div>
    </div>
  );
};
