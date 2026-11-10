import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Key,
  FileCode,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
  LogOut,
  ExternalLink,
  HardDrive,
  Copy,
  Check,
  Upload,
  Download,
  Info,
} from 'lucide-react';
import { AuthStatus } from '../types.js';
import { api } from '../lib/api.js';
import { formatBytes } from '../lib/utils.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  authStatus: AuthStatus | null;
  onStatusUpdated: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  authStatus,
  onStatusUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'oauth' | 'service_account'>('oauth');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOAuthSaveAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim()) {
      setError('Informe o Client ID e o Client Secret.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.configureOAuth(clientId.trim(), clientSecret.trim());
      
      // Abrir popup de autenticação do Google
      const width = 550;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        res.authUrl,
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
      );

      // Ouvir mensagem do callback via postMessage e BroadcastChannel
      const messageHandler = (event: MessageEvent) => {
        if (event.data?.type === 'oauth_success') {
          cleanup();
          setSuccess('Conta Google conectada com sucesso!');
          onStatusUpdated();
          setLoading(false);
        } else if (event.data?.type === 'oauth_error') {
          cleanup();
          setError(`Erro na autenticação: ${event.data.error}`);
          setLoading(false);
        }
      };
      window.addEventListener('message', messageHandler);

      let bc: BroadcastChannel | null = null;
      try {
        bc = new BroadcastChannel('gdrive_sync_auth');
        bc.onmessage = (event) => {
          if (event.data?.type === 'oauth_success') {
            cleanup();
            setSuccess('Conta Google conectada com sucesso!');
            onStatusUpdated();
            setLoading(false);
          }
        };
      } catch (e) {}

      const cleanup = () => {
        window.removeEventListener('message', messageHandler);
        if (bc) {
          try { bc.close(); } catch (e) {}
        }
      };

      // Timeout de segurança se a janela for fechada manualmente
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          cleanup();
          onStatusUpdated();
          setLoading(false);
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar fluxo OAuth.');
      setLoading(false);
    }
  };

  const handleServiceAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceAccountJson.trim()) {
      setError('Cole o conteúdo do arquivo JSON da Service Account.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.configureServiceAccount(serviceAccountJson.trim());
      setSuccess('Service Account configurada e testada com sucesso!');
      onStatusUpdated();
    } catch (err: any) {
      setError(err.message || 'Erro ao validar credenciais da Service Account.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Tem certeza de que deseja desconectar o Google Drive?')) return;
    setLoading(true);
    try {
      await api.disconnect();
      onStatusUpdated();
      setSuccess('Conta desconectada com sucesso.');
    } catch (err: any) {
      setError(err.message || 'Erro ao desconectar.');
    } finally {
      setLoading(false);
    }
  };

  // Calcular uso de armazenamento se disponível
  const quotaLimit = authStatus?.storageQuota?.limit ? Number(authStatus.storageQuota.limit) : 0;
  const quotaUsage = authStatus?.storageQuota?.usage ? Number(authStatus.storageQuota.usage) : 0;
  const quotaPercent = quotaLimit > 0 ? Math.round((quotaUsage / quotaLimit) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-4xl lg:max-w-5xl rounded-xl shadow-2xl border border-zinc-800 bg-zinc-900 flex flex-col my-auto transition-all overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-3.5">
            <div className="p-2 bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700/60">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-zinc-100 tracking-tight">Configurações do Google Drive</h3>
              <p className="text-xs text-zinc-400">Credenciais armazenadas com segurança via criptografia AES-256 no SQLite local</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status de Conexão Atual */}
        <div className="px-6 sm:px-8 pt-6">
          {authStatus?.apiDisabled ? (
            <div className="p-4 sm:p-5 rounded-xl bg-amber-950/20 border border-amber-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-start gap-3.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    Quase lá! Ative a Google Drive API
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-mono">
                      {authStatus.email} autenticado
                    </span>
                  </h4>
                  <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                    Sua conta foi autenticada com sucesso! No entanto, a <strong>Google Drive API</strong> ainda não foi ativada no seu projeto do Google Cloud.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <a
                  href={authStatus.enableUrl || "https://console.cloud.google.com/apis/library/drive.googleapis.com"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition shadow-sm"
                >
                  Ativar API no Google Cloud <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={onStatusUpdated}
                  className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition border border-zinc-700"
                  title="Recarregar status após ativar"
                >
                  Já ativei
                </button>
              </div>
            </div>
          ) : authStatus?.isConnected ? (
            <div className="p-4 sm:p-5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-2 bg-zinc-800 text-emerald-400 rounded-lg border border-zinc-700 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-100">Conectado ao Google Drive com Sucesso</p>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase tracking-wider font-medium">
                      {authStatus.mode === 'oauth' ? 'OAuth 2.0' : 'Service Account'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{authStatus.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {quotaLimit > 0 && (
                  <div className="min-w-[180px] text-right">
                    <div className="flex items-center justify-end gap-1.5 text-xs text-zinc-400 mb-1">
                      <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{formatBytes(quotaUsage)} de {formatBytes(quotaLimit)} ({quotaPercent}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, quotaPercent)}%` }}
                      />
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition shrink-0 shadow-sm"
                >
                  Concluído
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium transition shrink-0"
                  title="Desconectar do Google Drive"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-xs text-zinc-400">
                Nenhuma conta conectada. Configure o OAuth 2.0 ou uma Service Account abaixo para habilitar a sincronização.
              </p>
            </div>
          )}
        </div>

        {/* Abas com finalidade explícita */}
        <div className="px-6 sm:px-8 mt-4 flex flex-wrap gap-4 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('oauth')}
            className={`flex items-center gap-2.5 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'oauth'
                ? 'border-zinc-200 text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>OAuth 2.0</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium border border-zinc-700/60">
              <Upload className="w-3 h-3" /> Envio de Arquivos (Recomendado)
            </span>
          </button>
          <button
            onClick={() => setActiveTab('service_account')}
            className={`flex items-center gap-2.5 pb-3 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === 'service_account'
                ? 'border-zinc-200 text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Conta de Serviço (JSON)</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium border border-zinc-700/60">
              <Download className="w-3 h-3" /> Listagem, Leitura & Shared Drives
            </span>
          </button>
        </div>

        {/* Conteúdo das Abas em 2 Colunas */}
        <div className="p-6 sm:px-8 sm:py-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {activeTab === 'oauth' ? (
            <div className="space-y-4">
              {/* Banner de Finalidade do OAuth 2.0 */}
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-start gap-3.5 text-xs">
                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-200 shrink-0 mt-0.5 border border-zinc-700/50">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-zinc-100 text-xs sm:text-sm flex items-center gap-2">
                    Finalidade: Envio de Arquivos Locais ➔ Google Drive
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium border border-zinc-700/60">
                      Usa cota pessoal / Google One
                    </span>
                  </p>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    O <strong>OAuth 2.0</strong> autentica diretamente com a sua conta Google pessoal. É o <strong>método ideal e essencial para fazer upload e sincronizar fotos e arquivos</strong> da sua máquina para o Drive, aproveitando o seu espaço de armazenamento sem limitações de permissão.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Lado Esquerdo: Instruções de Configuração */}
              <div className="lg:col-span-5 p-5 bg-zinc-950/70 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-100 text-xs sm:text-sm">Passo a passo no Google:</span>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-300 hover:text-white underline inline-flex items-center gap-1 font-medium transition"
                  >
                    Console Cloud <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <ol className="list-decimal list-inside space-y-2 text-zinc-400 text-xs leading-relaxed">
                  <li>
                    Acesse o Google Cloud e habilite a <strong>Google Drive API</strong> no seu projeto.
                  </li>
                  <li>
                    Vá em <em>Credenciais → Criar Credenciais → ID do cliente OAuth</em> (tipo: <strong>Aplicação Web</strong>).
                  </li>
                  <li>
                    Em <em>URIs de redirecionamento autorizados</em>, adicione exatamente:
                    <div className="mt-1.5 flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-300">
                      <span className="truncate select-all">http://localhost:3001/api/auth/google/callback</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('http://localhost:3001/api/auth/google/callback');
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2500);
                        }}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-sans font-medium flex items-center gap-1 transition shrink-0 border border-zinc-700"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </li>
                  <li>
                    Copie o <strong>Client ID</strong> e <strong>Client Secret</strong> e cole ao lado.
                  </li>
                </ol>

                <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-500">
                  🔒 Seus tokens são criptografados com chave exclusiva da máquina antes de serem gravados no SQLite.
                </div>
              </div>

              {/* Lado Direito: Formulário */}
              <form onSubmit={handleOAuthSaveAndConnect} className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                    Client ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Ex: 1234567890-abcdefgh.apps.googleusercontent.com"
                    className="w-full px-3.5 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Client Secret (Chave secreta) *
                    </label>
                    <span className="text-[10px] text-zinc-400">Normalmente começa com <code>GOCSPX-</code></span>
                  </div>
                  <input
                    type="text"
                    required
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="Ex: GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
                  />
                  {(clientSecret.includes('.apps.googleusercontent.com') || (clientId && clientSecret === clientId)) && (
                    <p className="text-xs text-rose-400 font-medium mt-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Atenção: Você colou o Client ID aqui! O Client Secret é a <strong>Chave Secreta</strong> (geralmente começa com <code>GOCSPX-</code>).
                    </p>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm disabled:opacity-50 transition"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Salvar e Conectar Conta Google
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Banner de Finalidade da Service Account */}
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-start gap-3.5 text-xs">
                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-200 shrink-0 mt-0.5 border border-zinc-700/50">
                  <Download className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-zinc-100 text-xs sm:text-sm flex items-center gap-2">
                    Finalidade: Listagem de Pastas, Leitura, Downloads & Shared Drives
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium border border-zinc-700/60">
                      Sem login interativo
                    </span>
                  </p>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    A <strong>Conta de Serviço</strong> (arquivo <code>credentials.json</code>) opera de forma 100% autônoma em segundo plano. É ideal para <strong>listar diretórios, verificar arquivos e realizar downloads</strong> sem exigir tela de login. Para <strong>envio de arquivos em contas pessoais (@gmail.com)</strong>, utilize a aba <strong>OAuth 2.0</strong> devido à regra de cota zero do Google.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Lado Esquerdo: Instruções Service Account */}
              <div className="lg:col-span-5 p-5 bg-zinc-950/70 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-3">
                <span className="font-semibold text-zinc-100 text-xs sm:text-sm">Como usar Conta de Serviço:</span>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Gere uma Chave de Conta de Serviço (arquivo JSON) no Google Cloud Console e cole o conteúdo no campo ao lado.
                </p>
                <div className="p-3 bg-zinc-900 border border-amber-500/30 text-amber-200/90 rounded-lg text-[11px] leading-relaxed space-y-1.5">
                  <p>
                    ⚠️ <strong>Limitação da API do Google:</strong> Contas de Serviço não possuem cota de armazenamento próprio (cota = 0) e só conseguem fazer upload em <strong>Drives Compartilhados (Shared Drives)</strong> de contas Google Workspace corporativas.
                  </p>
                  <p className="text-amber-300 font-semibold">
                    👉 Para sincronizar pastas em contas pessoais (@gmail.com), use a aba <strong>OAuth 2.0</strong>!
                  </p>
                </div>
              </div>

              {/* Lado Direito: Formulário Service Account */}
              <form onSubmit={handleServiceAccountSave} className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 uppercase tracking-wider mb-1.5">
                    Conteúdo do arquivo credentials.json *
                  </label>
                  <textarea
                    rows={7}
                    required
                    value={serviceAccountJson}
                    onChange={(e) => setServiceAccountJson(e.target.value)}
                    placeholder={`{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key": "...",\n  "client_email": "..."\n}`}
                    className="w-full p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm disabled:opacity-50 transition"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      <>
                        <FileCode className="w-4 h-4" />
                        Salvar e Validar Service Account
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
