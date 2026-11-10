import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Cpu,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Users,
  HardDrive,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../lib/api';
import { Group } from '../types';
import { toast } from 'sonner';

export const GroupGoogleConfigPage: React.FC = () => {
  const { id, groupId } = useParams<{ id?: string; groupId?: string }>();
  const activeGroupId = id || groupId;

  const [group, setGroup] = useState<Group | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'service_account' | 'oauth'>('service_account');

  // Service Account Form
  const [saJson, setSaJson] = useState('');
  const [savingSa, setSavingSa] = useState(false);

  // OAuth Form
  const [authUrl, setAuthUrl] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [exchanging, setExchanging] = useState(false);

  useEffect(() => {
    if (activeGroupId) {
      loadGroupAndStatus();
    }
  }, [activeGroupId]);

  const loadGroupAndStatus = async () => {
    try {
      setLoading(true);
      const [groupData, statusData] = await Promise.all([
        api.getGroupById(activeGroupId!),
        api.getGoogleStatus(activeGroupId),
      ]);
      setGroup(groupData);
      setStatus(statusData);
    } catch (err: any) {
      toast.error('Erro ao carregar dados do grupo e status Google.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSaJson(content);
      toast.success(`Arquivo ${file.name} carregado com sucesso.`);
    };
    reader.readAsText(file);
  };

  const handleSaveServiceAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saJson.trim()) {
      toast.error('Cole o conteúdo do arquivo JSON da Conta de Serviço.');
      return;
    }

    setSavingSa(true);
    try {
      const parsed = JSON.parse(saJson);
      const res = await api.saveGoogleServiceAccount(parsed, activeGroupId);
      toast.success(res.message || 'Conta de Serviço Google configurada para este grupo!');
      setSaJson('');
      await loadGroupAndStatus();
    } catch (err: any) {
      toast.error(err.message || 'JSON inválido ou erro de autenticação.');
    } finally {
      setSavingSa(false);
    }
  };

  const handleGenerateAuthUrl = async () => {
    try {
      const redirectUri = window.location.origin + '/integrations/google/callback';
      const res = await api.getGoogleAuthUrl(undefined, undefined, redirectUri, activeGroupId);
      setAuthUrl(res.authUrl);
      window.open(res.authUrl, '_blank');
      toast.success('Página de consentimento Google aberta em nova aba!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar URL de consentimento Google.');
    }
  };

  const handleExchangeCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authCode.trim()) {
      toast.error('Informe o código de autorização Google.');
      return;
    }

    setExchanging(true);
    try {
      const redirectUri = window.location.origin + '/integrations/google/callback';
      const res = await api.exchangeGoogleCode(authCode.trim(), redirectUri, activeGroupId);
      toast.success(res.message || 'Google OAuth conectado com sucesso para o grupo!');
      setAuthCode('');
      await loadGroupAndStatus();
    } catch (err: any) {
      toast.error(err.message || 'Código inválido ou expirado.');
    } finally {
      setExchanging(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground">Carregando credenciais Google do grupo...</p>
      </div>
    );
  }

  const isConnected = status?.isConnected;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/app/groups"
            className="p-2 rounded-xl hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
            title="Voltar para a gestão de grupos"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: group?.color || '#4f46e5' }}
              />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Grupo: {group?.name}
              </span>
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Credenciais Google do Grupo
            </h1>
            <p className="text-xs text-muted-foreground">
              Configure a conta de serviço Google ou OAuth exclusiva para os formulários e planilhas deste setor.
            </p>
          </div>
        </div>

        <button
          onClick={loadGroupAndStatus}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-surface text-foreground hover:bg-surface-hover text-xs font-semibold shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
          Atualizar Conexão
        </button>
      </div>

      {/* Live Status Header Banner */}
      <div
        className={`p-5 rounded-2xl border ${
          isConnected ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'
        } glass flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isConnected ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
            }`}
          >
            {isConnected ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {isConnected
                ? `Google Conectado para o Grupo "${group?.name}"`
                : `Google Desconectado para o Grupo "${group?.name}"`}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isConnected
                ? `Conta Ativa (${status?.authMode === 'service_account' ? 'Service Account' : 'OAuth'}): ${status?.email}`
                : 'Defina as credenciais abaixo para habilitar o Google Sheets & Drive neste grupo.'}
            </p>
          </div>
        </div>

        {isConnected && status?.email && (
          <button
            type="button"
            onClick={() => copyToClipboard(status.email, 'Email da Conta')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground hover:bg-surface-hover text-xs font-semibold shrink-0 shadow-sm transition-all"
          >
            <Copy className="w-3.5 h-3.5 text-primary" />
            Copiar Email Google
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('service_account')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'service_account'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface'
          }`}
        >
          Conta de Serviço (Service Account JSON)
        </button>
        <button
          onClick={() => setActiveTab('oauth')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'oauth'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface'
          }`}
        >
          Conexão OAuth 2.0
        </button>
      </div>

      {/* TAB 1: SERVICE ACCOUNT */}
      {activeTab === 'service_account' && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-6 glass">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" /> Chave Privada da Conta de Serviço (JSON)
            </h2>
            <p className="text-xs text-muted-foreground">
              Autenticação corporativa isolada para o setor <strong className="text-foreground">{group?.name}</strong>. Permite sincronização ininterrupta com o Google Sheets.
            </p>
          </div>

          <form onSubmit={handleSaveServiceAccount} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-foreground">Conteúdo do Arquivo .json</label>
                <label className="text-xs font-semibold text-primary hover:underline cursor-pointer">
                  Carregar arquivo .json
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              <textarea
                rows={9}
                value={saJson}
                onChange={(e) => setSaJson(e.target.value)}
                placeholder='{
  "type": "service_account",
  "project_id": "projetos-de-ia-509615",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "acesso-ao-google-sheets@projetos-de-ia-509615.iam.gserviceaccount.com"
}'
                className="w-full text-xs font-mono p-3.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">
                As credenciais serão criptografadas e vinculadas exclusivamente a este grupo.
              </p>
              <button
                type="submit"
                disabled={savingSa || !saJson.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {savingSa ? 'Testando Conexão...' : 'Validar & Salvar para o Grupo'}
                <ShieldCheck className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: OAUTH */}
      {activeTab === 'oauth' && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-6 glass">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" /> Conexão OAuth 2.0 para o Grupo
            </h2>
            <p className="text-xs text-muted-foreground">
              Vincule a conta Google Workspace de um gestor deste grupo para criar planilhas diretamente no Drive dele.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-foreground block">Gerar Autorização Google</span>
              <span className="text-[11px] text-muted-foreground">
                Abre a tela de permissões oficial do Google Cloud para conceder acesso às planilhas.
              </span>
            </div>
            <button
              type="button"
              onClick={handleGenerateAuthUrl}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
              Conectar com Google
            </button>
          </div>

          <form onSubmit={handleExchangeCode} className="p-4 rounded-xl bg-background border border-border space-y-3">
            <div>
              <span className="text-xs font-bold text-foreground block mb-1">Código de Autorização</span>
              <input
                type="text"
                placeholder="4/0AWtgzh6..."
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={exchanging || !authCode.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {exchanging ? 'Validando...' : 'Confirmar Autorização OAuth'}
                <ShieldCheck className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
