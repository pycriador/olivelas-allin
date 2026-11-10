import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Key,
  Shield,
  Copy,
  CheckCircle2,
  Building2,
  Layers,
} from 'lucide-react';
import { api } from '../lib/api';
import { Group } from '../types';
import { toast } from 'sonner';
import { HBAC_SCOPES } from './ApiTokensPage';

export const TokenCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    'forms:read',
    'forms:write',
    'responses:read',
    'dashboards:read',
  ]);
  const [creating, setCreating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await api.getGroups();
      setGroups(data);
      if (data.length > 0) {
        setGroupId(data[0].id);
      }
    } catch (err: any) {
      toast.error('Erro ao carregar grupos para vinculação do token.');
    }
  };

  const handleToggleScope = (scopeId: string) => {
    if (selectedScopes.includes(scopeId)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scopeId));
    } else {
      setSelectedScopes([...selectedScopes, scopeId]);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Token copiado para a área de transferência!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Informe um nome identificador para o token.');
      return;
    }
    if (selectedScopes.length === 0) {
      toast.error('Selecione pelo menos um escopo de permissão.');
      return;
    }

    setCreating(true);
    try {
      const res = await api.createToken({
        name: name.trim(),
        group_id: groupId || undefined,
        scopes: selectedScopes,
        expires_in_days: expiresInDays,
      });

      setGeneratedToken(res.raw_token);
      toast.success('Token de API gerado com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar token.');
    } finally {
      setCreating(false);
    }
  };

  const categories = Array.from(new Set(HBAC_SCOPES.map((s) => s.category)));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Validation Division Notice Banner */}
      <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950">
            Divisão Validar
          </span>
          <span className="text-foreground font-semibold">
            Esta rota (<code>/app/tokens/new</code>) está em análise para deleção futura. A criação e gestão de tokens agora é realizada via modal direto em <strong>Governança &gt; Tokens de API</strong>.
          </span>
        </div>
        <Link
          to="/app/tokens"
          className="px-3 py-1.5 rounded-xl border border-border bg-surface text-foreground font-bold hover:bg-surface-hover shrink-0"
        >
          Ir para /app/tokens
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/app/tokens"
          className="p-2 rounded-xl hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Gerar Novo Token de API (HBAC)
          </h1>
          <p className="text-xs text-muted-foreground">
            Crie chaves de acesso com vínculo obrigatório ao grupo e controle granular de escopos.
          </p>
        </div>
      </div>

      {generatedToken ? (
        /* Token Success Display */
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 space-y-5 glass">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Token Gerado com Sucesso!</h3>
              <p className="text-xs text-muted-foreground">
                Copie o token agora. Por razões de segurança, ele <strong>nunca será exibido novamente</strong>.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border flex items-center justify-between gap-3 font-mono text-xs">
            <span className="text-foreground font-bold break-all">{generatedToken}</span>
            <button
              type="button"
              onClick={() => handleCopy(generatedToken)}
              className="px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md"
            >
              <Copy className="w-3.5 h-3.5" /> Copiar
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-muted-foreground">
              Guarde esta chave em seu arquivo <code>.env</code> ou gerenciador de segredos.
            </span>
            <button
              onClick={() => navigate('/app/tokens')}
              className="px-5 py-2 rounded-xl text-xs font-bold border border-border bg-surface text-foreground hover:bg-surface-hover"
            >
              Voltar para Tokens
            </button>
          </div>
        </div>
      ) : (
        /* Create Token Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4 glass">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" /> Identificação e Vínculo de Grupo
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">Nome do Token *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sync Server CI/CD ou Zapier Produção"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Grupo Vinculado (Isolamento HBAC) *
                </label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-foreground block mb-1.5">Validade do Token</label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option value={7}>7 Dias</option>
                  <option value={30}>30 Dias (Recomendado)</option>
                  <option value={90}>90 Dias</option>
                  <option value={365}>1 Ano</option>
                  <option value={0}>Nunca Expira (Acesso Permanente)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Granular Scopes Categorized */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4 glass">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Escopos de Permissão (Granular HBAC)
              </h2>
              <span className="text-xs text-primary font-semibold">
                {selectedScopes.length} escopo(s) habilitado(s)
              </span>
            </div>

            <div className="space-y-4 pt-1">
              {categories.map((cat) => (
                <div key={cat} className="space-y-2">
                  <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5 border-b border-border/60 pb-1">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    {cat}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {HBAC_SCOPES.filter((s) => s.category === cat).map((scope) => {
                      const isChecked = selectedScopes.includes(scope.id);
                      return (
                        <div
                          key={scope.id}
                          onClick={() => handleToggleScope(scope.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                            isChecked
                              ? 'border-primary bg-primary/10 shadow-sm'
                              : 'border-border bg-background hover:bg-surface-hover'
                          }`}
                        >
                          <div className="pr-2">
                            <span className="text-xs font-mono font-bold text-foreground block">
                              {scope.label}
                            </span>
                            <span className="text-[11px] text-muted-foreground block mt-0.5">
                              {scope.description}
                            </span>
                          </div>
                          {isChecked ? (
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          ) : (
                            <div className="w-4 h-4 rounded border border-border shrink-0 mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              to="/app/tokens"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border hover:bg-surface-hover"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 disabled:opacity-50"
            >
              {creating ? 'Gerando Chave...' : 'Gerar Chave de Acesso'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
