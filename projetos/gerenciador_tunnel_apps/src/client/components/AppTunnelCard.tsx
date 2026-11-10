import React, { useState } from 'react';
import {
  Globe,
  Terminal,
  Play,
  Square,
  RotateCw,
  Edit2,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Folder,
  Cpu,
  Radio,
  Sparkles,
  Unplug,
  Link2,
} from 'lucide-react';
import { AppTunnelItem, DetectedUrlItem } from '../types.js';
import { formatRelativeTime } from '../lib/utils.js';

interface AppTunnelCardProps {
  app: AppTunnelItem;
  onStart: (id: number) => void;
  onStop: (id: number) => void;
  onRestart: (id: number) => void;
  onStartQuickTunnel: (id: number, provider: 'cloudflared' | 'ngrok', port?: number) => void;
  onStopTunnel: (id: number) => void;
  onOpenLogs: (app: AppTunnelItem) => void;
  onOpenQrCode: (app: AppTunnelItem) => void;
  onEdit: (app: AppTunnelItem) => void;
  onDelete: (id: number) => void;
  onToggleActive: (app: AppTunnelItem) => void;
}

export const AppTunnelCard: React.FC<AppTunnelCardProps> = ({
  app,
  onStart,
  onStop,
  onRestart,
  onStartQuickTunnel,
  onStopTunnel,
  onOpenLogs,
  onOpenQrCode,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedLocal, setCopiedLocal] = useState(false);
  const [copiedLan, setCopiedLan] = useState(false);
  const [copiedDetectedUrl, setCopiedDetectedUrl] = useState<string | null>(null);

  const copyText = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const copyDetected = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedDetectedUrl(url);
    setTimeout(() => setCopiedDetectedUrl(null), 2000);
  };

  const detectedUrls: DetectedUrlItem[] = Array.isArray(app.detected_urls) ? app.detected_urls : [];

  const getStatusBadge = () => {
    if (app.tunnel_status === 'online') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Público Online
        </span>
      );
    }

    if (app.app_status === 'starting' || app.tunnel_status === 'starting') {
      return (
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700/60 text-[11px] font-medium">
          <RotateCw className="w-3 h-3 animate-spin text-amber-400" /> Iniciando...
        </span>
      );
    }

    if (app.is_running) {
      return (
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800/90 text-zinc-200 border border-zinc-700 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Rodando Local
        </span>
      );
    }

    if (app.last_status === 'error' || app.app_status === 'error' || app.tunnel_status === 'error') {
      return (
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-950/40 text-red-300 border border-red-800/60 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Falha
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800/50 text-zinc-400 border border-zinc-800 text-[11px] font-medium">
        Parado
      </span>
    );
  };

  const getModeLabel = () => {
    switch (app.execution_mode) {
      case 'app_and_tunnel':
        return 'App Local + Túnel';
      case 'tunnel_only':
        return 'Apenas Túnel';
      case 'app_only':
        return 'Apenas App Local';
    }
  };

  const getProviderBadge = () => {
    const provider = app.is_running ? app.active_tunnel_provider : app.tunnel_provider;
    if (!provider || provider === 'none') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900/60 text-zinc-400 border border-zinc-800/60 text-[11px]">
          Sem Túnel Web
        </span>
      );
    }

    const labels: Record<string, string> = {
      cloudflared: app.tunnel_auth_mode === 'token' ? 'Cloudflare Zero Trust' : 'Cloudflared Tunnel',
      ngrok: 'Ngrok Tunnel',
      localtunnel: 'LocalTunnel',
      custom: 'Túnel Customizado',
    };

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/80 text-cyan-300 border border-zinc-700/60 text-[11px] font-medium">
        <Globe className="w-3 h-3 text-cyan-400" />
        {labels[provider] || provider}
      </span>
    );
  };

  return (
    <div
      className={`rounded-xl p-4 border transition-all duration-200 flex flex-col justify-between ${
        !app.is_active
          ? 'opacity-60 bg-zinc-900/30 border-zinc-800/60'
          : app.tunnel_status === 'online'
          ? 'bg-zinc-900/75 hover:bg-zinc-900/90 border-emerald-800/60 hover:border-emerald-700/80 shadow-xs'
          : app.is_running
          ? 'bg-zinc-900/70 hover:bg-zinc-900/85 border-zinc-700/80 shadow-xs'
          : 'bg-zinc-900/60 hover:bg-zinc-900/80 border-zinc-800 hover:border-zinc-700/80 shadow-xs'
      }`}
    >
      <div>
        {/* Header do Card */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                app.tunnel_status === 'online'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60'
                  : app.is_running
                  ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700/60'
              }`}
            >
              {app.execution_mode === 'app_only' ? (
                <Cpu className="w-4 h-4" />
              ) : (
                <Globe className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-zinc-100 tracking-tight truncate" title={app.name}>
                {app.name}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono truncate">
                {app.description || `Porta ${app.effective_port} • ${formatRelativeTime(app.started_at)}`}
              </p>
            </div>
          </div>
          <div className="shrink-0">{getStatusBadge()}</div>
        </div>

        {/* DESTAQUE: URL Pública Ativa (Quando o túnel está online ou URL foi gerada na execução atual) */}
        {(app.public_url || (app.is_running && app.last_public_url)) ? (
          <div className="my-2.5 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Radio className="w-3 h-3 animate-pulse" />
                URL Pública na Internet ({app.active_tunnel_provider || app.tunnel_provider})
              </span>
              <button
                onClick={() => onStopTunnel(app.id)}
                className="text-[10px] text-zinc-400 hover:text-red-300 flex items-center gap-1 transition"
                title="Fechar apenas o túnel público"
              >
                <Unplug className="w-3 h-3" /> Desconectar túnel
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <a
                href={(app.public_url || app.last_public_url)!}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-xs font-mono font-semibold text-emerald-200 hover:text-white bg-zinc-950/90 px-2.5 py-1.5 rounded border border-emerald-800/50 truncate transition"
                title={(app.public_url || app.last_public_url)!}
              >
                {app.public_url || app.last_public_url}
              </a>

              <button
                onClick={() => copyText((app.public_url || app.last_public_url)!, setCopiedPublic)}
                className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition shrink-0"
                title="Copiar URL pública"
              >
                {copiedPublic ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <a
                href={(app.public_url || app.last_public_url)!}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 transition shrink-0"
                title="Abrir no navegador"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => onOpenQrCode({ ...app, public_url: app.public_url || app.last_public_url })}
                className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-700/80 transition shrink-0"
                title="Mostrar QR Code para abrir no celular / outro PC"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : app.tunnel_status === 'starting' ? (
          <div className="my-2.5 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-2">
              <RotateCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              Gerando URL pública ({app.active_tunnel_provider})...
            </span>
          </div>
        ) : (
          /* Botões rápidos para expor na internet caso esteja sem túnel ativo */
          <div className="my-2.5 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1.5 truncate">
                <Sparkles className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                Expor porta {app.effective_port}:
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onStartQuickTunnel(app.id, 'cloudflared')}
                  className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] font-medium text-zinc-200 border border-zinc-700/70 transition"
                  title="Criar túnel rápido gratuito via Cloudflared"
                >
                  + Cloudflared
                </button>
                <button
                  onClick={() => onStartQuickTunnel(app.id, 'ngrok')}
                  className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] font-medium text-zinc-200 border border-zinc-700/70 transition"
                  title="Criar túnel rápido via Ngrok"
                >
                  + Ngrok
                </button>
              </div>
            </div>
            {app.last_public_url && (
              <div className="pt-1.5 border-t border-zinc-800/70 flex items-center justify-between gap-2 text-[11px] font-mono">
                <span className="text-zinc-500 font-sans text-[10px] shrink-0">Última URL:</span>
                <span className="text-zinc-400 truncate flex-1" title={app.last_public_url}>
                  {app.last_public_url}
                </span>
                <button
                  onClick={() => copyText(app.last_public_url, setCopiedPublic)}
                  className="text-zinc-400 hover:text-zinc-200 shrink-0"
                  title="Copiar última URL gerada"
                >
                  {copiedPublic ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Endereços Locais & Comando */}
        <div className="space-y-1.5 my-2.5 text-[11px] font-mono bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/80">
          {/* URL Localhost */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-zinc-400 shrink-0 font-sans text-[10px] uppercase font-semibold">Local:</span>
              <a
                href={app.local_url}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-200 hover:text-white hover:underline truncate"
              >
                {app.local_url}
              </a>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => copyText(app.local_url, setCopiedLocal)}
                className="p-0.5 text-zinc-400 hover:text-zinc-200 transition"
                title="Copiar endereço local"
              >
                {copiedLocal ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <a
                href={app.local_url}
                target="_blank"
                rel="noreferrer"
                className="p-0.5 text-zinc-400 hover:text-zinc-200 transition"
                title="Abrir endereço local"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* URL na Rede Local (LAN) */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-zinc-400 shrink-0 font-sans text-[10px] uppercase font-semibold">Rede:</span>
              <a
                href={app.lan_url}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-300 hover:text-white hover:underline truncate"
              >
                {app.lan_url}
              </a>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => copyText(app.lan_url, setCopiedLan)}
                className="p-0.5 text-zinc-400 hover:text-zinc-200 transition"
                title="Copiar endereço na rede local"
              >
                {copiedLan ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <button
                onClick={() => onOpenQrCode(app)}
                className="p-0.5 text-zinc-400 hover:text-zinc-200 transition"
                title="QR Code para acessar na rede"
              >
                <QrCode className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Comando e Pasta Local se configurados */}
          {(app.execution_mode === 'app_and_tunnel' || app.execution_mode === 'app_only') && app.start_command && (
            <div className="pt-1.5 mt-1 border-t border-zinc-800/80 space-y-1">
              <div className="flex items-start gap-1.5">
                <span className="text-zinc-400 shrink-0 font-sans text-[10px] uppercase font-semibold">Cmd:</span>
                <span className="text-emerald-300/90 truncate" title={app.start_command}>
                  {app.start_command}
                </span>
              </div>
              {app.local_path && (
                <div className="flex items-start gap-1.5">
                  <span className="text-zinc-400 shrink-0 font-sans text-[10px] uppercase font-semibold">Dir:</span>
                  <span className="text-zinc-400 truncate flex items-center gap-1" title={app.local_path}>
                    <Folder className="w-3 h-3 shrink-0" />
                    {app.local_path}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lista de Todas as URLs Capturadas Automaticamente da Inicialização */}
        {detectedUrls.length > 0 && (
          <div className="my-2.5 p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-800/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Link2 className="w-3 h-3 text-indigo-400" />
                URLs Capturadas da Aplicação ({detectedUrls.length})
              </span>
            </div>

            <div className="space-y-1 max-h-40 overflow-y-auto pr-0.5">
              {detectedUrls.map((item) => {
                const isPublic = item.category === 'public';
                const isLan = item.category === 'lan';
                const badgeStyle = isPublic
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                  : isLan
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60'
                  : 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60';

                return (
                  <div
                    key={item.url}
                    className="flex items-center justify-between gap-1.5 px-2 py-1 rounded bg-zinc-950/90 border border-zinc-800/80 text-[11px] font-mono"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-sans font-semibold border shrink-0 ${badgeStyle}`}
                      >
                        {item.label}
                      </span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-200 hover:text-white hover:underline truncate"
                        title={item.url}
                      >
                        {item.url}
                      </a>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.category === 'local' &&
                        item.port &&
                        item.port !== app.effective_port && (
                          <button
                            onClick={() =>
                              onStartQuickTunnel(
                                app.id,
                                app.active_tunnel_provider === 'ngrok' ? 'ngrok' : 'cloudflared',
                                item.port
                              )
                            }
                            className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-indigo-900/50 text-[9px] font-sans font-medium text-indigo-300 border border-indigo-800/50 transition"
                            title={`Expor a porta ${item.port} (${item.label}) no túnel público`}
                          >
                            Expor :{item.port}
                          </button>
                        )}

                      <button
                        onClick={() => copyDetected(item.url)}
                        className="p-1 text-zinc-400 hover:text-zinc-200 transition"
                        title="Copiar esta URL"
                      >
                        {copiedDetectedUrl === item.url ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-zinc-400 hover:text-zinc-200 transition"
                        title="Abrir no navegador"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => onOpenQrCode({ ...app, public_url: item.url })}
                        className="p-1 text-zinc-400 hover:text-emerald-400 transition"
                        title="Gerar QR Code para esta URL"
                      >
                        <QrCode className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Badges de Modo e Provedor */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5 text-[11px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-200 border border-zinc-700/60">
            {getModeLabel()}
          </span>

          {getProviderBadge()}

          {app.app_pid && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono text-[10px]">
              PID {app.app_pid}
            </span>
          )}
        </div>

        {/* Preview da última linha de console / log */}
        {app.last_log_line && (
          <button
            onClick={() => onOpenLogs(app)}
            className="w-full text-left my-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-zinc-800/80 flex items-center gap-2 group transition"
            title="Clique para abrir o Console em Tempo Real"
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 shrink-0" />
            <span className="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-200 truncate flex-1">
              {app.last_log_line}
            </span>
          </button>
        )}

        {/* Mensagem de erro se houver */}
        {app.last_status === 'error' && app.last_error_message && !app.is_running && (
          <div className="my-2 p-2 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs break-words">
            {app.last_error_message}
          </div>
        )}
      </div>

      {/* Rodapé de Ações do Card */}
      <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onOpenLogs(app)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 transition"
            title="Abrir Terminal / Logs em Tempo Real"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Console</span>
          </button>

          <button
            onClick={() => onToggleActive(app)}
            className={`px-2 py-1 rounded-md text-xs transition ${
              app.is_active
                ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                : 'text-amber-400 hover:bg-amber-500/10'
            }`}
            title={app.is_active ? 'Desabilitar do Iniciar Todos' : 'Habilitar'}
          >
            {app.is_active ? 'Ativo' : 'Pausado'}
          </button>

          <button
            onClick={() => onEdit(app)}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-zinc-800/60 transition"
            title="Editar configurações"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(app.id)}
            className="p-1.5 text-zinc-400 hover:text-red-400 rounded-md hover:bg-red-500/10 transition"
            title="Remover aplicação"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {app.is_running && (
            <button
              onClick={() => onRestart(app.id)}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition"
              title="Reiniciar"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

          {app.is_running ? (
            <button
              onClick={() => onStop(app.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-950/60 hover:bg-red-900/70 text-red-300 border border-red-800/60 transition active:scale-95"
            >
              <Square className="w-3 h-3 fill-current" />
              Parar
            </button>
          ) : (
            <button
              onClick={() => onStart(app.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 shadow-xs transition active:scale-95"
            >
              <Play className="w-3 h-3 fill-current" />
              Iniciar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
