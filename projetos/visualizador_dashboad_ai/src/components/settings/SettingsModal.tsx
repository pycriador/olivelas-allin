import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  FileSpreadsheet,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Download,
  Database,
  Info,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../services/auth/authService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, isAuthenticated, refreshMe, googleConfigured, googleClientEmail, openAuthModal } =
    useAuth();

  const [activeTab, setActiveTab] = useState<'google' | 'gemini' | 'backup'>('google');
  const [jsonInput, setJsonInput] = useState('');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasCopiedEmail, setHasCopiedEmail] = useState(false);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      setSaveSuccess(null);
      setSaveError(null);
      // Fetch credential status
      AuthService.getCredentialsStatus()
        .then((status) => {
          // Status updated
        })
        .catch(() => {});
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const handleSaveGoogleCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      let parsedPayload: any = {};
      if (jsonInput.trim()) {
        try {
          const parsed = JSON.parse(jsonInput.trim());
          parsedPayload.clientEmail = parsed.client_email || parsed.clientEmail;
          parsedPayload.privateKey = parsed.private_key || parsed.privateKey;
          parsedPayload.projectId = parsed.project_id || parsed.projectId;
          parsedPayload.serviceAccountJson = jsonInput.trim();
        } catch {
          throw new Error('O formato do arquivo JSON de Service Account fornecido é inválido.');
        }
      }

      if (googleApiKey.trim()) {
        parsedPayload.googleApiKey = googleApiKey.trim();
      }

      const res = await AuthService.saveCredentials(parsedPayload);
      setSaveSuccess(res.message || 'Credenciais salvas com sucesso!');
      await refreshMe();
      setJsonInput('');
      setGoogleApiKey('');
    } catch (err: any) {
      setSaveError(err.message || 'Erro ao salvar credenciais.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGeminiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await AuthService.saveCredentials({
        geminiApiKey: geminiApiKey.trim(),
      });
      setSaveSuccess(res.message || 'Chave Gemini salva com sucesso!');
      setGeminiApiKey('');
    } catch (err: any) {
      setSaveError(err.message || 'Erro ao salvar chave Gemini.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyEmail = (emailText: string) => {
    navigator.clipboard.writeText(emailText);
    setHasCopiedEmail(true);
    setTimeout(() => setHasCopiedEmail(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Configurações & Chaves do Workspace
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gerencie sua conta, conexão com Google Drive / Sheets e chaves de IA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 gap-6 pt-2">
          <button
            onClick={() => {
              setActiveTab('google');
              setSaveSuccess(null);
              setSaveError(null);
            }}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'google'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Google Cloud & Sheets</span>
            {googleConfigured && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            {activeTab === 'google' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('gemini');
              setSaveSuccess(null);
              setSaveError(null);
            }}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'gemini'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Gemini AI Engine</span>
            {activeTab === 'gemini' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('backup');
              setSaveSuccess(null);
              setSaveError(null);
            }}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === 'backup'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Privacidade & Backup</span>
            {activeTab === 'backup' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {saveError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* TAB 1: GOOGLE CLOUD & SHEETS */}
          {activeTab === 'google' && (
            <div className="space-y-6">
              {/* Current Status Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Status da Integração Google
                    </span>
                    {googleConfigured ? (
                      <Badge variant="success" size="sm" className="gap-1 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Conectado e Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" size="sm" className="text-[11px]">
                        Aguardando Credenciais
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {googleConfigured
                      ? 'O servidor está apto a ler planilhas e formulários autorizados da sua conta.'
                      : 'Cole abaixo a chave JSON da sua Conta de Serviço (Service Account) do Google Cloud.'}
                  </p>

                  {googleClientEmail && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold">E-mail da Conta de Serviço:</span>
                      <code className="text-xs bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-mono select-all">
                        {googleClientEmail}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(googleClientEmail)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Copiar e-mail"
                      >
                        {hasCopiedEmail ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions Guide */}
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>Como conectar sua planilha privada do Google Sheets:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  <li>
                    No <strong>Google Cloud Console</strong>, crie uma Conta de Serviço com as APIs <em>Google Drive</em> e <em>Google Sheets</em> ativadas.
                  </li>
                  <li>
                    Gere uma chave do tipo <strong>JSON</strong> e cole o conteúdo no formulário abaixo.
                  </li>
                  <li>
                    Compartilhe sua planilha ou pasta no Google Drive com o e-mail da Conta de Serviço (com permissão de leitor).
                  </li>
                </ol>
              </div>

              {/* Form to submit credentials */}
              <form onSubmit={handleSaveGoogleCreds} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Conteúdo do Arquivo JSON da Conta de Serviço (Recomendado)
                  </label>
                  <textarea
                    rows={4}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='{ "type": "service_account", "project_id": "...", "private_key": "...", "client_email": "..." }'
                    className="w-full p-3 font-mono text-[11px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    O JSON é armazenado de forma isolada na sua conta de usuário no backend.
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Ou Chave de API Pública Google (Opcional para Forms públicos)
                  </label>
                  <input
                    type="password"
                    value={googleApiKey}
                    onChange={(e) => setGoogleApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isSaving || (!jsonInput.trim() && !googleApiKey.trim())}
                    className="gap-2 text-xs font-bold"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Validando e Salvando...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Salvar Credenciais do Google</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: GEMINI AI */}
          {activeTab === 'gemini' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Motor de Inteligência Artificial Gemini
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  O Gemini analisa automaticamente respostas qualitativas de texto aberto, detecta sentimentos, sintetiza temas dominantes e gera insights executivos para o painel.
                </p>
              </div>

              <form onSubmit={handleSaveGeminiKey} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Chave de API Gemini (Google AI Studio)
                  </label>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400">
                    A chave é utilizada estritamente no backend para executar análises semânticas das respostas.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isSaving || !geminiApiKey.trim()}
                    className="gap-2 text-xs font-bold"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Salvar Chave Gemini</span>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: BACKUP & PRIVACY */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Exportação Segura e Backup de Dados
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Todos os dashboards e configurações de análise podem ser salvos ou exportados em formato JSON estruturado.
                  <strong> Nenhuma senha, token ou chave de API é incluída nos arquivos de exportação.</strong>
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Estrutura do Backup JSON:
                </h4>
                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] space-y-1">
                  <div>&#123;</div>
                  <div className="pl-4 text-slate-400">"version": "1.0",</div>
                  <div className="pl-4 text-slate-400">"appName": "AI Survey Analyzer",</div>
                  <div className="pl-4 text-slate-400">"exportedAt": "2026-08-28T...",</div>
                  <div className="pl-4 text-emerald-400">"projectName": "Pesquisa de Satisfação",</div>
                  <div className="pl-4 text-indigo-400">"survey": &#123; "questions": [...], "responses": [...] &#125;,</div>
                  <div className="pl-4 text-amber-400">"displaySettings": &#123; ... &#125;</div>
                  <div>&#125;</div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ideal para arquivamento histórico, versionamento e interoperabilidade com outras ferramentas de BI (Power BI, Python, Tableau).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
