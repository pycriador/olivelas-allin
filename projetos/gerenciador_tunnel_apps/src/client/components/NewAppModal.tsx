import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  Cpu,
  Radio,
  Folder,
  Terminal,
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  Settings2,
} from 'lucide-react';
import {
  AppTunnelItem,
  ExecutionMode,
  TunnelProvider,
  ProvidersStatus,
  ProjectInspection,
} from '../types.js';
import { api } from '../lib/api.js';
import { LocalFolderPickerModal } from './LocalFolderPickerModal.js';

interface NewAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingApp?: AppTunnelItem | null;
  prefillPort?: number | null;
  prefillProvider?: TunnelProvider | null;
  prefillMode?: ExecutionMode | null;
  prefillName?: string | null;
  providersStatus: ProvidersStatus | null;
}

export const NewAppModal: React.FC<NewAppModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  editingApp,
  prefillPort,
  prefillProvider,
  prefillMode,
  prefillName,
  providersStatus,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('app_and_tunnel');
  const [localPath, setLocalPath] = useState('');
  const [startCommand, setStartCommand] = useState('');
  const [localHost, setLocalHost] = useState('localhost');
  const [localPort, setLocalPort] = useState<number>(3000);
  const [localProtocol, setLocalProtocol] = useState<'http' | 'https'>('http');
  const [envVars, setEnvVars] = useState('');
  const [tunnelProvider, setTunnelProvider] = useState<TunnelProvider>('cloudflared');
  const [tunnelAuthMode, setTunnelAuthMode] = useState<'quick' | 'token'>('quick');
  const [tunnelToken, setTunnelToken] = useState('');
  const [tunnelCustomDomain, setTunnelCustomDomain] = useState('');
  const [tunnelCustomCommand, setTunnelCustomCommand] = useState('');
  const [autoRestart, setAutoRestart] = useState(false);
  const [autoStart, setAutoStart] = useState(false);

  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [inspection, setInspection] = useState<ProjectInspection | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setInspection(null);

    if (editingApp) {
      setName(editingApp.name);
      setDescription(editingApp.description || '');
      setExecutionMode(editingApp.execution_mode);
      setLocalPath(editingApp.local_path || '');
      setStartCommand(editingApp.start_command || '');
      setLocalHost(editingApp.local_host || 'localhost');
      setLocalPort(editingApp.local_port || 3000);
      setLocalProtocol(editingApp.local_protocol || 'http');
      setEnvVars(editingApp.env_vars || '');
      setTunnelProvider(
        editingApp.tunnel_provider === 'none' ? 'cloudflared' : editingApp.tunnel_provider
      );
      setTunnelAuthMode(editingApp.tunnel_auth_mode || 'quick');
      setTunnelToken('');
      setTunnelCustomDomain(editingApp.tunnel_custom_domain || '');
      setTunnelCustomCommand(editingApp.tunnel_custom_command || '');
      setAutoRestart(Boolean(editingApp.auto_restart));
      setAutoStart(Boolean(editingApp.auto_start));
      setShowAdvanced(
        Boolean(
          editingApp.env_vars ||
            editingApp.tunnel_custom_domain ||
            editingApp.tunnel_auth_mode === 'token' ||
            editingApp.auto_restart ||
            editingApp.auto_start
        )
      );
      if (editingApp.local_path) {
        handleInspectDirectory(editingApp.local_path, false);
      }
    } else {
      const defaultProv =
        prefillProvider || providersStatus?.defaultProvider || 'cloudflared';
      setName(prefillName || '');
      setDescription('');
      setExecutionMode(prefillMode || (prefillPort ? 'tunnel_only' : 'app_and_tunnel'));
      setLocalPath('');
      setStartCommand('');
      setLocalHost('localhost');
      setLocalPort(prefillPort || 3000);
      setLocalProtocol('http');
      setEnvVars('');
      setTunnelProvider(defaultProv === 'none' ? 'cloudflared' : defaultProv);
      setTunnelAuthMode('quick');
      setTunnelToken('');
      setTunnelCustomDomain('');
      setTunnelCustomCommand('ssh -R 80:localhost:{port} nokey@localhost.run');
      setAutoRestart(false);
      setAutoStart(false);
      setShowAdvanced(false);
    }
  }, [isOpen, editingApp, prefillPort, prefillProvider, prefillMode, prefillName, providersStatus]);

  const handleInspectDirectory = async (dirPath: string, applyDefaults = true) => {
    if (!dirPath) return;
    setInspecting(true);
    try {
      const data = await api.inspectProject(dirPath);
      setInspection(data);
      if (applyDefaults) {
        if (!name.trim() && data.projectName) {
          setName(data.projectName);
        }
        if (data.detectedPort) {
          setLocalPort(data.detectedPort);
        }
        if (!startCommand.trim() && data.suggestions.length > 0) {
          setStartCommand(data.suggestions[0].command);
          if (data.suggestions[0].suggestedPort) {
            setLocalPort(data.suggestions[0].suggestedPort);
          }
        }
      }
    } catch {
      // Silencioso se não for possível inspecionar
    } finally {
      setInspecting(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Informe um nome para a aplicação ou túnel.');
      return;
    }

    if (executionMode !== 'tunnel_only' && !startCommand.trim()) {
      setError('Informe o comando de inicialização da aplicação local.');
      return;
    }

    if (!localPort || localPort < 1 || localPort > 65535) {
      setError('Informe uma porta local válida (1 a 65535).');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        execution_mode: executionMode,
        local_path: executionMode === 'tunnel_only' ? '' : localPath.trim(),
        start_command: executionMode === 'tunnel_only' ? '' : startCommand.trim(),
        local_host: localHost.trim() || 'localhost',
        local_port: Number(localPort),
        local_protocol: localProtocol,
        env_vars: envVars.trim(),
        tunnel_provider: executionMode === 'app_only' ? 'none' : tunnelProvider,
        tunnel_auth_mode: tunnelAuthMode,
        tunnel_token: tunnelToken.trim() || undefined,
        tunnel_custom_domain: tunnelCustomDomain.trim(),
        tunnel_custom_command: tunnelCustomCommand.trim(),
        auto_restart: autoRestart,
        auto_start: autoStart,
      };

      if (editingApp) {
        await api.updateApp(editingApp.id, payload);
      } else {
        await api.createApp(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configuração.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-100">
                  {editingApp ? 'Editar Aplicação / Túnel' : 'Nova Aplicação ou Túnel Público'}
                </h2>
                <p className="text-xs text-zinc-400">
                  Execute projetos locais e gere links públicos com Cloudflared ou Ngrok
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
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Seleção do Modo de Operação */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">
                Como você deseja executar esta aplicação?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setExecutionMode('app_and_tunnel')}
                  className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                    executionMode === 'app_and_tunnel'
                      ? 'bg-indigo-600/15 border-indigo-500/50 text-zinc-100 shadow-sm'
                      : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Globe
                      className={`w-4 h-4 ${
                        executionMode === 'app_and_tunnel' ? 'text-indigo-400' : 'text-zinc-500'
                      }`}
                    />
                    <span className="text-xs font-semibold">App Local + Túnel</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Inicia o comando da aplicação e já cria a URL pública automaticamente.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setExecutionMode('tunnel_only')}
                  className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                    executionMode === 'tunnel_only'
                      ? 'bg-emerald-600/15 border-emerald-500/50 text-zinc-100 shadow-sm'
                      : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Radio
                      className={`w-4 h-4 ${
                        executionMode === 'tunnel_only' ? 'text-emerald-400' : 'text-zinc-500'
                      }`}
                    />
                    <span className="text-xs font-semibold">Apenas Túnel (Porta)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Expõe na internet uma porta que já está rodando (Docker, XAMPP, API, etc).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setExecutionMode('app_only')}
                  className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                    executionMode === 'app_only'
                      ? 'bg-amber-600/15 border-amber-500/50 text-zinc-100 shadow-sm'
                      : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Cpu
                      className={`w-4 h-4 ${
                        executionMode === 'app_only' ? 'text-amber-400' : 'text-zinc-500'
                      }`}
                    />
                    <span className="text-xs font-semibold">Apenas App Local</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Roda qualquer aplicação local pela interface (e permite ligar túnel depois).
                  </p>
                </button>
              </div>
            </div>

            {/* Nome e Descrição */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Nome de Identificação *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Painel Financeiro, API Backend..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Descrição (Opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Apresentação para cliente..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Configuração de Processo Local (Quando não for tunnel_only) */}
            {executionMode !== 'tunnel_only' && (
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    Execução da Aplicação Local
                  </span>
                  {inspecting && (
                    <span className="text-[11px] text-indigo-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analisando scripts da pasta...
                    </span>
                  )}
                </div>

                {/* Diretório do Projeto */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Pasta do Projeto (Working Directory)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={localPath}
                      onChange={(e) => setLocalPath(e.target.value)}
                      onBlur={() => localPath && handleInspectDirectory(localPath, false)}
                      placeholder="/home/usuario/projetos/meu-app"
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.electronAPI?.selectDirectory) {
                          const picked = await window.electronAPI.selectDirectory(localPath);
                          if (picked) {
                            setLocalPath(picked);
                            handleInspectDirectory(picked, true);
                          }
                        } else {
                          setFolderPickerOpen(true);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 border border-zinc-700/60 transition-colors shrink-0"
                    >
                      <Folder className="w-3.5 h-3.5 text-indigo-400" />
                      Procurar
                    </button>
                  </div>
                </div>

                {/* Comando de Inicialização */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Comando para Iniciar a Aplicação *
                  </label>
                  <input
                    type="text"
                    value={startCommand}
                    onChange={(e) => setStartCommand(e.target.value)}
                    placeholder="Ex: npm run dev, python3 -m http.server 8080, node server.js..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-300 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />

                  {/* Sugestões detectadas automaticamente do projeto */}
                  {inspection && inspection.suggestions.length > 0 && (
                    <div className="mt-2.5">
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1.5">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Comandos detectados nesta pasta (clique para preencher):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {inspection.suggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setStartCommand(sug.command);
                              if (sug.suggestedPort) setLocalPort(sug.suggestedPort);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                              startCommand === sug.command
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                            }`}
                          >
                            <span className="text-zinc-400 font-sans mr-1">{sug.label}:</span>
                            {sug.command}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Porta Local e Protocolo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Protocolo Local
                </label>
                <select
                  value={localProtocol}
                  onChange={(e) => setLocalProtocol(e.target.value as 'http' | 'https')}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="http">HTTP (Padrão)</option>
                  <option value="https">HTTPS</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Host Local
                </label>
                <input
                  type="text"
                  value={localHost}
                  onChange={(e) => setLocalHost(e.target.value)}
                  placeholder="localhost"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Porta da Aplicação *
                </label>
                <input
                  type="number"
                  min={1}
                  max={65535}
                  value={localPort}
                  onChange={(e) => setLocalPort( Number(e.target.value) )}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm font-mono text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Seleção de Provedor de Túnel (quando não for app_only) */}
            {executionMode !== 'app_only' && (
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3.5">
                <label className="block text-xs font-semibold text-zinc-200">
                  Motor de Túnel para Exportar na Internet
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      {
                        id: 'cloudflared',
                        title: 'Cloudflared',
                        subtitle: 'TryCloudflare Rápido',
                        installed: providersStatus?.providers.cloudflared.installed ?? true,
                      },
                      {
                        id: 'ngrok',
                        title: 'Ngrok',
                        subtitle: 'Túnel HTTP/HTTPS',
                        installed: providersStatus?.providers.ngrok.installed ?? true,
                      },
                      {
                        id: 'localtunnel',
                        title: 'LocalTunnel',
                        subtitle: 'Via NPX (Sem conta)',
                        installed: providersStatus?.providers.npx.installed ?? true,
                      },
                      {
                        id: 'custom',
                        title: 'Custom / SSH',
                        subtitle: 'localhost.run / CLI',
                        installed: true,
                      },
                    ] as const
                  ).map((prov) => (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => setTunnelProvider(prov.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        tunnelProvider === prov.id
                          ? 'bg-indigo-600/15 border-indigo-500/50 text-zinc-100'
                          : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:bg-zinc-800/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold">{prov.title}</span>
                        {prov.installed ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" title="Instalado" />
                        ) : (
                          <span
                            className="w-2 h-2 rounded-full bg-amber-400"
                            title="Binário não detectado"
                          />
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">{prov.subtitle}</p>
                    </button>
                  ))}
                </div>

                {tunnelProvider === 'cloudflared' && (
                  <p className="text-[11px] text-zinc-400">
                    Gera gratuitamente uma URL HTTPS pública (<code className="text-orange-300">*.trycloudflare.com</code>) sem necessidade de conta, ou usa Token Zero Trust nas opções avançadas.
                  </p>
                )}

                {tunnelProvider === 'ngrok' && (
                  <p className="text-[11px] text-zinc-400">
                    Expõe sua porta via Ngrok (<code className="text-cyan-300">*.ngrok-free.app</code>). Você pode configurar seu Authtoken ou domínio fixo nas Configurações.
                  </p>
                )}

                {tunnelProvider === 'custom' && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Comando Customizado do Túnel (use <code className="text-indigo-300">{'{port}'}</code> para a porta)
                    </label>
                    <input
                      type="text"
                      value={tunnelCustomCommand}
                      onChange={(e) => setTunnelCustomCommand(e.target.value)}
                      placeholder="ssh -R 80:localhost:{port} nokey@localhost.run"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Opções Avançadas */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
                {showAdvanced ? 'Ocultar opções avançadas' : 'Mostrar opções avançadas (Variáveis de ambiente, Domínio fixo, Auto-restart)'}
              </button>

              {showAdvanced && (
                <div className="mt-3 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-4 animate-fade-in">
                  {executionMode !== 'app_only' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          Domínio / Subdomínio Customizado (Ngrok / LocalTunnel)
                        </label>
                        <input
                          type="text"
                          value={tunnelCustomDomain}
                          onChange={(e) => setTunnelCustomDomain(e.target.value)}
                          placeholder="Ex: meu-sistema.ngrok-free.app"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {tunnelProvider === 'cloudflared' && (
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1">
                            Modo Cloudflared
                          </label>
                          <select
                            value={tunnelAuthMode}
                            onChange={(e) => setTunnelAuthMode(e.target.value as 'quick' | 'token')}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="quick">Quick Tunnel (*.trycloudflare.com gratuito)</option>
                            <option value="token">Cloudflare Zero Trust Named Tunnel (Token)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {executionMode !== 'app_only' &&
                    tunnelProvider === 'cloudflared' &&
                    tunnelAuthMode === 'token' && (
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          Token Exclusivo deste Túnel (Opcional — se vazio usa o Token Global)
                        </label>
                        <input
                          type="password"
                          value={tunnelToken}
                          onChange={(e) => setTunnelToken(e.target.value)}
                          placeholder={
                            editingApp?.has_custom_token
                              ? '•••••••••••••••• (Token salvo — digite para alterar)'
                              : 'eyJhIjoi...'
                          }
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}

                  {executionMode !== 'tunnel_only' && (
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">
                        Variáveis de Ambiente Extras (uma por linha: <code className="text-zinc-300">CHAVE=VALOR</code>)
                      </label>
                      <textarea
                        rows={3}
                        value={envVars}
                        onChange={(e) => setEnvVars(e.target.value)}
                        placeholder={`NODE_ENV=development\nAPI_URL=http://localhost:3000`}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-5 pt-1">
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoRestart}
                        onChange={(e) => setAutoRestart(e.target.checked)}
                        className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
                      />
                      Reiniciar automaticamente se o processo cair
                    </label>

                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoStart}
                        onChange={(e) => setAutoStart(e.target.checked)}
                        className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
                      />
                      Iniciar junto com o servidor Olivelas Local Tunnel
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingApp ? 'Salvar Alterações' : 'Cadastrar Aplicação'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <LocalFolderPickerModal
        isOpen={folderPickerOpen}
        onClose={() => setFolderPickerOpen(false)}
        initialPath={localPath}
        onSelect={(selectedPath) => {
          setLocalPath(selectedPath);
          handleInspectDirectory(selectedPath, true);
        }}
      />
    </>
  );
};
