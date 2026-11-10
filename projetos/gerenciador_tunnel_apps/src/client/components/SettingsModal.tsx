import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Shield,
  Save,
  Loader2,
  Trash2,
} from 'lucide-react';
import { ProvidersStatus, TunnelProvider } from '../types.js';
import { api } from '../lib/api.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  providersStatus: ProvidersStatus | null;
  onUpdated: (status: ProvidersStatus) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  providersStatus,
  onUpdated,
}) => {
  const [defaultProvider, setDefaultProvider] = useState<TunnelProvider>('cloudflared');
  const [ngrokAuthtoken, setNgrokAuthtoken] = useState('');
  const [ngrokDomain, setNgrokDomain] = useState('');
  const [cloudflaredToken, setCloudflaredToken] = useState('');
  const [cloudflaredProtocol, setCloudflaredProtocol] = useState<'auto' | 'http2' | 'quic'>('auto');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen && providersStatus) {
      setDefaultProvider(providersStatus.defaultProvider || 'cloudflared');
      setNgrokDomain(providersStatus.ngrokDomain || '');
      setCloudflaredProtocol(providersStatus.cloudflaredProtocol || 'auto');
      setNgrokAuthtoken('');
      setCloudflaredToken('');
      setMessage(null);
    }
  }, [isOpen, providersStatus]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.saveSettings({
        defaultProvider,
        ngrokAuthtoken: ngrokAuthtoken.trim() || undefined,
        ngrokDomain: ngrokDomain.trim(),
        cloudflaredToken: cloudflaredToken.trim() || undefined,
        cloudflaredProtocol,
      });
      onUpdated(res.status);
      setNgrokAuthtoken('');
      setCloudflaredToken('');
      setMessage({ type: 'success', text: 'Configurações salvas e aplicadas com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Falha ao salvar configurações.' });
    } finally {
      setSaving(false);
    }
  };

  const handleClearToken = async (target: 'ngrok' | 'cloudflared') => {
    setSaving(true);
    try {
      const res = await api.saveSettings(
        target === 'ngrok' ? { clearNgrokToken: true } : { clearCloudflaredToken: true }
      );
      onUpdated(res.status);
      setMessage({ type: 'success', text: 'Token removido com sucesso.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                Configurações & Provedores de Túnel
              </h2>
              <p className="text-xs text-zinc-400">
                Diagnóstico de binários instalados e tokens do Cloudflared / Ngrok
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {message && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-medium ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/20 text-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Diagnóstico dos Binários no Sistema */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Binários Detectados no Sistema ({providersStatus?.hostname})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(
                [
                  {
                    key: 'cloudflared',
                    name: 'Cloudflare Tunnel (cloudflared)',
                    info: providersStatus?.providers.cloudflared,
                  },
                  {
                    key: 'ngrok',
                    name: 'Ngrok CLI (ngrok)',
                    info: providersStatus?.providers.ngrok,
                  },
                  {
                    key: 'npx',
                    name: 'NPX / LocalTunnel',
                    info: providersStatus?.providers.npx,
                  },
                  {
                    key: 'ssh',
                    name: 'OpenSSH Client (localhost.run)',
                    info: providersStatus?.providers.ssh,
                  },
                ] as const
              ).map((item) => (
                <div
                  key={item.key}
                  className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-start justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-zinc-200">{item.name}</div>
                    <div className="text-[11px] font-mono text-zinc-500 truncate mt-0.5">
                      {item.info?.installed ? item.info.version || item.info.path : 'Não encontrado no PATH'}
                    </div>
                  </div>
                  {item.info?.installed ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Pronto
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                      <AlertTriangle className="w-3 h-3" />
                      Ausente
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Provedor Padrão e Protocolo Cloudflared */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Provedor de Túnel Padrão
              </label>
              <select
                value={defaultProvider}
                onChange={(e) => setDefaultProvider(e.target.value as TunnelProvider)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="cloudflared">Cloudflared (Recomendado - Gratuito)</option>
                <option value="ngrok">Ngrok</option>
                <option value="localtunnel">LocalTunnel (NPX)</option>
                <option value="custom">SSH / Customizado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Protocolo de Transporte Cloudflared
              </label>
              <select
                value={cloudflaredProtocol}
                onChange={(e) =>
                  setCloudflaredProtocol(e.target.value as 'auto' | 'http2' | 'quic')
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="auto">Automático (Padrão)</option>
                <option value="http2">HTTP/2 (Mais compatível com firewalls)</option>
                <option value="quic">QUIC (Mais rápido)</option>
              </select>
            </div>
          </div>

          {/* Configurações Ngrok */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                Credenciais do Ngrok
              </span>
              {providersStatus?.hasNgrokToken && (
                <button
                  type="button"
                  onClick={() => handleClearToken('ngrok')}
                  className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                  Remover Token Salvo
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Ngrok Authtoken (Criptografado em AES-256)
                </label>
                <input
                  type="password"
                  value={ngrokAuthtoken}
                  onChange={(e) => setNgrokAuthtoken(e.target.value)}
                  placeholder={
                    providersStatus?.hasNgrokToken
                      ? '•••••••••••••••• (Configurado)'
                      : 'Cole seu Authtoken do dashboard.ngrok.com'
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  Domínio Estático Padrão do Ngrok (Opcional)
                </label>
                <input
                  type="text"
                  value={ngrokDomain}
                  onChange={(e) => setNgrokDomain(e.target.value)}
                  placeholder="Ex: meu-dominio.ngrok-free.app"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Configurações Cloudflared Token Global */}
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Cloudflare Zero Trust Token Global (Opcional)
              </span>
              {providersStatus?.hasCloudflaredToken && (
                <button
                  type="button"
                  onClick={() => handleClearToken('cloudflared')}
                  className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                  Remover Token Salvo
                </button>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              Para usar links rápidos gratuitos (<code className="text-orange-300">*.trycloudflare.com</code>), não é necessário preencher este token. Preencha apenas se possuir um túnel nomeado no painel Cloudflare Zero Trust.
            </p>
            <input
              type="password"
              value={cloudflaredToken}
              onChange={(e) => setCloudflaredToken(e.target.value)}
              placeholder={
                providersStatus?.hasCloudflaredToken
                  ? '•••••••••••••••• (Token Zero Trust Configurado)'
                  : 'eyJhIjoi...'
              }
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Fechar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
