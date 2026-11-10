import React, { useState, useEffect } from 'react';
import {
  X,
  Radar,
  RefreshCw,
  Globe,
  ExternalLink,
  PlusCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { ActivePortItem, TunnelProvider, ExecutionMode } from '../types.js';
import { api } from '../lib/api.js';

interface ActivePortsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickExposePort: (
    port: number,
    processName: string,
    provider: TunnelProvider,
    mode: ExecutionMode
  ) => void;
  onInstantTunnelCreated: () => void;
}

export const ActivePortsModal: React.FC<ActivePortsModalProps> = ({
  isOpen,
  onClose,
  onQuickExposePort,
  onInstantTunnelCreated,
}) => {
  const [ports, setPorts] = useState<ActivePortItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingPort, setCreatingPort] = useState<number | null>(null);

  const loadPorts = async () => {
    setLoading(true);
    try {
      const data = await api.getActivePorts();
      setPorts(data.ports || []);
    } catch {
      // ignora erro
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPorts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInstantExpose = async (item: ActivePortItem, provider: 'cloudflared' | 'ngrok') => {
    setCreatingPort(item.port);
    try {
      const created = await api.createApp({
        name: `${item.processName || 'Serviço'} (Porta ${item.port})`,
        description: `Túnel criado a partir do scanner de portas ativas`,
        execution_mode: 'tunnel_only',
        local_host: 'localhost',
        local_port: item.port,
        local_protocol: 'http',
        tunnel_provider: provider,
      });
      await api.startApp(created.id);
      onInstantTunnelCreated();
      onClose();
    } catch {
      // fallback para abrir modal preenchido
      onQuickExposePort(item.port, item.processName, provider, 'tunnel_only');
    } finally {
      setCreatingPort(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Radar className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Portas Locais Ativas neste Computador
              </h2>
              <p className="text-xs text-zinc-400">
                Detecte servidores já rodando (Node, Python, Docker, PHP) e exponha na internet com 1 clique
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadPorts}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lista de Portas */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
              <span className="text-xs">Escaneando portas TCP em escuta...</span>
            </div>
          ) : ports.length === 0 ? (
            <div className="text-center py-14 text-zinc-500 text-sm">
              Nenhuma porta TCP em escuta encontrada no momento.
            </div>
          ) : (
            <div className="space-y-2.5">
              {ports.map((item) => (
                <div
                  key={item.port}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 font-mono text-sm font-bold text-indigo-300">
                      :{item.port}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-100">
                          {item.processName || 'Processo Local'}
                        </span>
                        {item.pid && (
                          <span className="text-[11px] font-mono text-zinc-500">PID {item.pid}</span>
                        )}
                        {item.registeredAppName && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Cadastrado ({item.registeredAppName})
                          </span>
                        )}
                      </div>
                      <a
                        href={`http://localhost:${item.port}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-indigo-400 transition-colors mt-0.5"
                      >
                        http://localhost:{item.port}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleInstantExpose(item, 'cloudflared')}
                      disabled={creatingPort === item.port}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 text-xs font-medium transition-colors"
                      title="Criar e iniciar imediatamente um túnel Cloudflared para esta porta"
                    >
                      {creatingPort === item.port ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Globe className="w-3.5 h-3.5" />
                      )}
                      Cloudflared 1-Click
                    </button>

                    <button
                      onClick={() => handleInstantExpose(item, 'ngrok')}
                      disabled={creatingPort === item.port}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors"
                      title="Criar e iniciar imediatamente um túnel Ngrok para esta porta"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Ngrok 1-Click
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onQuickExposePort(
                          item.port,
                          `${item.processName || 'App'} (${item.port})`,
                          'cloudflared',
                          'tunnel_only'
                        );
                      }}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                      title="Configurar opções antes de criar"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
