import { useState } from "react";
import { toast } from "sonner";
import type { IamApiToken, IamGroup, IamRole, IamUser } from "@/lib/iam-types";
import { createApiToken, deleteApiToken, updateApiToken } from "@/lib/iam-service";

interface IamTokensCrudProps {
  tokens: IamApiToken[];
  users: IamUser[];
  groups: IamGroup[];
  onRefresh: () => void;
}

export function IamTokensCrud({ tokens, users, groups, onRefresh }: IamTokensCrudProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Criar Token
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [assignedRole, setAssignedRole] = useState<IamRole>("consumer");
  const [assignedUserId, setAssignedUserId] = useState<string>("");
  const [assignedGroupId, setAssignedGroupId] = useState<string>("");
  const [quotaBrl, setQuotaBrl] = useState("50.00");
  const [expiresInDays, setExpiresInDays] = useState<string>("30");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal com Chave Gerada
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<IamApiToken | null>(null);

  // Exclusão
  const [deletingTokenId, setDeletingTokenId] = useState<string | null>(null);

  const filteredTokens = tokens.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.token_prefix.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleCreateToken(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenName.trim()) {
      toast.error("Informe um nome de identificação para o token.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createApiToken({
        name: tokenName.trim(),
        assignedRole,
        userId: assignedUserId || undefined,
        groupId: assignedGroupId || undefined,
        quotaBrl: Number(quotaBrl) || 50.0,
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
      });

      setIsCreateOpen(false);
      setNewlyCreatedToken(created);
      toast.success("Token de API gerado com sucesso!");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar token.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(token: IamApiToken) {
    try {
      await updateApiToken(token.id, { is_active: !token.is_active });
      toast.success(token.is_active ? "Token revogado." : "Token reativado.");
      onRefresh();
    } catch {
      toast.error("Falha ao atualizar token.");
    }
  }

  async function handleDeleteToken(id: string) {
    try {
      await deleteApiToken(id);
      toast.success("Token excluído definitivamente.");
      setDeletingTokenId(null);
      onRefresh();
    } catch {
      toast.error("Falha ao excluir token.");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Token copiado para a área de transferência!");
  }

  return (
    <div className="space-y-4">
      {/* Topo */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Pesquisar tokens por nome ou prefixo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-72 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink placeholder:text-dim focus:border-signal focus:outline-none"
        />

        <button
          onClick={() => {
            setTokenName("");
            setAssignedRole("consumer");
            setAssignedUserId("");
            setAssignedGroupId("");
            setQuotaBrl("50.00");
            setExpiresInDays("30");
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-signal px-3.5 py-2 text-xs font-semibold text-canvas transition hover:brightness-110"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Gerar Novo Token
        </button>
      </div>

      {/* Tabela de Tokens */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-surface/50">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-white/10 bg-white/[0.02] text-dim uppercase tracking-wider font-mono">
            <tr>
              <th className="px-4 py-3">Identificação</th>
              <th className="px-4 py-3">Prefixo / Hash</th>
              <th className="px-4 py-3">Papel & Destino</th>
              <th className="px-4 py-3">Cota & Uso</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredTokens.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-dim">
                  Nenhum token de API cadastrado.
                </td>
              </tr>
            ) : (
              filteredTokens.map((t) => {
                const targetUser = users.find((u) => u.id === t.user_id);
                const targetGroup = groups.find((g) => g.id === t.group_id);

                return (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink">{t.name}</div>
                      <div className="text-[10px] text-dim">
                        Criado em {new Date(t.created_at).toLocaleDateString("pt-BR")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] text-amber-300">
                        {t.token_prefix}...
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-ink font-semibold capitalize">{t.assigned_role}</div>
                      <div className="text-[11px] text-dim">
                        {targetUser ? `Usuário: ${targetUser.email}` : targetGroup ? `Grupo: ${targetGroup.name}` : "Geral"}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className="text-ink">R$ {t.used_brl.toFixed(2)}</span> /{" "}
                      <span className="text-dim">R$ {t.quota_brl.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {t.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                          <span className="size-1.5 rounded-full bg-emerald-400" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400">
                          <span className="size-1.5 rounded-full bg-rose-400" /> Revogado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(t)}
                          className={`rounded px-2 py-1 text-[11px] transition ${
                            t.is_active
                              ? "text-amber-400 hover:bg-amber-500/10"
                              : "text-emerald-400 hover:bg-emerald-500/10"
                          }`}
                        >
                          {t.is_active ? "Revogar" : "Reativar"}
                        </button>
                        <button
                          onClick={() => setDeletingTokenId(t.id)}
                          className="rounded p-1.5 text-rose-400 hover:bg-rose-500/10 transition"
                          title="Excluir Token"
                        >
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Criar Token */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12141c] p-6 shadow-2xl text-ink animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold">Gerar Token de API</h3>
            <p className="mt-1 text-xs text-dim">
              Crie tokens para permitir integrações externas, analistas ou parceiros consumirem a API.
            </p>

            <form onSubmit={handleCreateToken} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-dim mb-1">Nome / Identificação *</label>
                <input
                  type="text"
                  required
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="Ex: Token Bot WhatsApp Monumento"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-ink placeholder:text-dim focus:border-signal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-dim mb-1">Papel Atribuído ao Token *</label>
                <select
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value as IamRole)}
                  className="w-full rounded-lg border border-white/10 bg-[#1a1d29] px-3 py-2 text-ink focus:border-signal focus:outline-none"
                >
                  <option value="consumer">Consumidor (Submissão de imagens)</option>
                  <option value="analyst">Analista de Postagem (Extração & IA)</option>
                  <option value="global_admin">Administrador Global</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-dim mb-1">Vincular Usuário</label>
                  <select
                    value={assignedUserId}
                    onChange={(e) => setAssignedUserId(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#1a1d29] px-3 py-2 text-ink focus:border-signal focus:outline-none"
                  >
                    <option value="">Nenhum (Token Geral)</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-dim mb-1">Vincular Grupo</label>
                  <select
                    value={assignedGroupId}
                    onChange={(e) => setAssignedGroupId(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#1a1d29] px-3 py-2 text-ink focus:border-signal focus:outline-none"
                  >
                    <option value="">Nenhum</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-dim mb-1">Cota Limite (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={quotaBrl}
                    onChange={(e) => setQuotaBrl(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-ink focus:border-signal focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-dim mb-1">Expira em (dias)</label>
                  <input
                    type="number"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    placeholder="30"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-ink focus:border-signal focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-white/10 px-3.5 py-2 text-xs text-dim hover:text-ink hover:bg-white/5 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-signal px-4 py-2 text-xs font-semibold text-canvas hover:brightness-110 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Gerando..." : "Gerar Token"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chave Revelada (Exibida uma única vez) */}
      {newlyCreatedToken && newlyCreatedToken.raw_token && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-[#12141c] p-6 shadow-2xl text-ink">
            <div className="flex items-center gap-2 text-emerald-400">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="text-base font-bold">Token Gerado com Sucesso!</h3>
            </div>
            <p className="mt-2 text-xs text-dim leading-relaxed">
              Copie o token agora. Por razões de segurança, ele não será exibido por completo novamente.
            </p>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/50 p-3">
              <div className="font-mono text-xs text-emerald-300 break-all select-all">
                {newlyCreatedToken.raw_token}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => copyToClipboard(newlyCreatedToken.raw_token!)}
                className="rounded-lg bg-signal px-4 py-2 text-xs font-semibold text-canvas hover:brightness-110 transition"
              >
                Copiar Token
              </button>
              <button
                onClick={() => setNewlyCreatedToken(null)}
                className="rounded-lg border border-white/10 px-3.5 py-2 text-xs text-dim hover:text-ink"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Exclusão */}
      {deletingTokenId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/20 bg-[#12141c] p-6 shadow-2xl text-ink">
            <h3 className="text-base font-bold text-rose-400">Excluir Token</h3>
            <p className="mt-2 text-xs text-dim leading-relaxed">
              Tem certeza que deseja excluir permanentemente este token? Qualquer integração deixará de funcionar imediatamente.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingTokenId(null)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-dim hover:text-ink"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteToken(deletingTokenId)}
                className="rounded-lg bg-rose-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 transition"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
