import React, { useState } from 'react';
import {
  Sun,
  Moon,
  CheckCircle2,
  Sparkles,
  KeyRound,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Palette,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../services/auth/authService';
import { useTheme } from '../hooks/useTheme';

interface SettingsPageProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export function SettingsPage({ isDark, onToggleTheme }: SettingsPageProps) {
  const { user, isAuthenticated, googleConfigured, googleClientEmail, refreshMe, openAuthModal } =
    useAuth();
  const { themeId, currentTheme, setTheme, lightThemes, darkThemes } = useTheme();

  const [themeTab, setThemeTab] = useState<'light' | 'dark'>(isDark ? 'dark' : 'light');
  const [jsonInput, setJsonInput] = useState('');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isSavingGoogle, setIsSavingGoogle] = useState(false);
  const [isSavingGemini, setIsSavingGemini] = useState(false);
  const [googleMessage, setGoogleMessage] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [geminiMessage, setGeminiMessage] = useState<string | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [hasCopiedEmail, setHasCopiedEmail] = useState(false);

  const handleSaveGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setIsSavingGoogle(true);
    setGoogleMessage(null);
    setGoogleError(null);

    try {
      let payload: any = {};
      if (jsonInput.trim()) {
        const parsed = JSON.parse(jsonInput.trim());
        payload.clientEmail = parsed.client_email || parsed.clientEmail;
        payload.privateKey = parsed.private_key || parsed.privateKey;
        payload.projectId = parsed.project_id || parsed.projectId;
        payload.serviceAccountJson = jsonInput.trim();
      }
      if (googleApiKey.trim()) {
        payload.googleApiKey = googleApiKey.trim();
      }

      const res = await AuthService.saveCredentials(payload);
      setGoogleMessage(res.message || 'Credenciais salvas com sucesso!');
      await refreshMe();
      setJsonInput('');
    } catch (err: any) {
      setGoogleError(err.message || 'Erro ao salvar credenciais.');
    } finally {
      setIsSavingGoogle(false);
    }
  };

  const handleSaveGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setIsSavingGemini(true);
    setGeminiMessage(null);
    setGeminiError(null);

    try {
      const res = await AuthService.saveCredentials({
        geminiApiKey: geminiApiKey.trim(),
      });
      setGeminiMessage(res.message || 'Chave Gemini salva com sucesso!');
      setGeminiApiKey('');
    } catch (err: any) {
      setGeminiError(err.message || 'Erro ao salvar chave.');
    } finally {
      setIsSavingGemini(false);
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setHasCopiedEmail(true);
    setTimeout(() => setHasCopiedEmail(false), 2000);
  };

  const activeThemesList = themeTab === 'light' ? lightThemes : darkThemes;

  return (
    <div className="space-y-6 max-w-4xl text-theme-main">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-theme-main">
          Configurações do Workspace & Identidade Visual
        </h2>
        <p className="text-xs text-theme-muted mt-1">
          Gerenciamento de 20 temas visuais instantâneos, chaves privadas do Google Cloud e motor Gemini.
        </p>
      </div>

      {/* Theme & Visual Identity Selector (20 Themes) */}
      <Card className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-theme-primary-light text-theme-primary border border-theme">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-theme-main">
                Seletor de Temas & Identidade Visual (20 Paletas)
              </h3>
              <p className="text-xs text-theme-muted mt-0.5">
                Tema ativo: <strong className="text-theme-primary">{currentTheme.name}</strong> ({currentTheme.category})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-theme-subtle border border-theme">
              <button
                onClick={() => setThemeTab('light')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  themeTab === 'light'
                    ? 'bg-theme-surface text-theme-main shadow-xs border border-theme'
                    : 'text-theme-muted hover:text-theme-main'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Claros ({lightThemes.length})</span>
              </button>

              <button
                onClick={() => setThemeTab('dark')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  themeTab === 'dark'
                    ? 'bg-theme-surface text-theme-main shadow-xs border border-theme'
                    : 'text-theme-muted hover:text-theme-main'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-theme-primary" />
                <span>Escuros ({darkThemes.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {activeThemesList.map((item) => {
            const isSelected = themeId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setTheme(item.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-theme bg-theme-primary-light ring-2 ring-theme-primary'
                    : 'border-theme bg-theme-subtle/40 hover:border-theme hover:bg-theme-subtle/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-theme-main">
                        {item.name}
                      </span>
                      <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-theme-subtle text-theme-muted border border-theme">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-theme-muted mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-theme-primary text-white' : 'border border-theme text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>

                <div className="pt-2 border-t border-theme flex items-center justify-between">
                  <div className="flex items-center -space-x-1">
                    <div
                      className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10"
                      style={{ backgroundColor: item.previewColors.bg }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10"
                      style={{ backgroundColor: item.previewColors.surface }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10"
                      style={{ backgroundColor: item.previewColors.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10"
                      style={{ backgroundColor: item.previewColors.accent }}
                    />
                  </div>

                  <span className={`text-[10px] font-bold ${isSelected ? 'text-theme-primary' : 'text-theme-muted'}`}>
                    {isSelected ? 'Ativo' : 'Clique para usar'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Google Cloud Service Account */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-theme-primary-light text-theme-primary border border-theme">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-theme-main">
                Credenciais Google Cloud (Service Account)
              </h3>
              <p className="text-xs text-theme-muted mt-0.5">
                Para ler planilhas e formulários do Google Drive e Google Forms.
              </p>
            </div>
          </div>

          <Badge
            variant={googleConfigured ? 'success' : 'default'}
            className="text-[10px] px-2 py-0.5 font-bold"
          >
            {googleConfigured ? 'Conectado' : 'Não configurado'}
          </Badge>
        </div>

        {googleClientEmail && (
          <div className="p-3.5 rounded-xl bg-theme-subtle border border-theme flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-theme-muted">
                Email da Service Account Conectada:
              </span>
              <p className="font-mono text-theme-main select-all font-semibold">
                {googleClientEmail}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyEmail(googleClientEmail)}
              className="text-xs h-7 px-2.5 gap-1"
            >
              {hasCopiedEmail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{hasCopiedEmail ? 'Copiado' : 'Copiar'}</span>
            </Button>
          </div>
        )}

        {googleMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{googleMessage}</span>
          </div>
        )}

        {googleError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{googleError}</span>
          </div>
        )}

        <form onSubmit={handleSaveGoogle} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-theme-main">
              Arquivo JSON da Service Account (Cole o conteúdo completo)
            </label>
            <textarea
              rows={4}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{ "type": "service_account", "project_id": "...", "private_key": "...", "client_email": "..." }'
              className="w-full p-3 text-xs font-mono rounded-xl border border-theme bg-theme-surface text-theme-main focus:outline-none focus:ring-2 ring-theme-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-theme-main">
              Google API Key Pública (Opcional - para leitura de planilhas abertas)
            </label>
            <input
              type="password"
              value={googleApiKey}
              onChange={(e) => setGoogleApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-theme bg-theme-surface text-theme-main focus:outline-none focus:ring-2 ring-theme-primary"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSavingGoogle || (!jsonInput.trim() && !googleApiKey.trim())}
              className="text-xs font-bold"
            >
              {isSavingGoogle ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Salvar Credenciais Google
            </Button>
          </div>
        </form>
      </Card>

      {/* Gemini AI Settings */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-theme">
          <div className="p-2.5 rounded-xl bg-theme-primary-light text-theme-primary border border-theme">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-theme-main">
              Motor Gemini AI (Análise Qualitativa)
            </h3>
            <p className="text-xs text-theme-muted mt-0.5">
              Análise semântica, sentimentos e clusterização de respostas em texto aberto.
            </p>
          </div>
        </div>

        {geminiMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
            {geminiMessage}
          </div>
        )}

        <form onSubmit={handleSaveGemini} className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-theme-main">
              Chave de API Gemini (Google AI Studio)
            </label>
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-theme bg-theme-surface text-theme-main focus:outline-none focus:ring-2 ring-theme-primary"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSavingGemini || !geminiApiKey.trim()}
              className="text-xs font-bold"
            >
              {isSavingGemini ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Salvar Chave Gemini
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
