import { useState } from "react";
import { toast } from "sonner";
import type { IamGroup, IamRole, IamUser } from "@/lib/iam-types";
import { createUser, deleteUser, updateUser } from "@/lib/iam-service";
import { GLOBAL_ADMIN_EMAIL } from "@/lib/auth-context";

interface IamUsersCrudProps {
  users: IamUser[];
  groups: IamGroup[];
  onRefresh: () => void;
}

export function IamUsersCrud({ users, groups, onRefresh }: IamUsersCrudProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IamUser | null>(null);

  // Form states
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState<IamRole>("consumer");
  const [formGroupIds, setFormGroupIds] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formCustomQuota, setFormCustomQuota] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal de Exclusão
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const userEmail = u?.email || "";
    const userName = u?.full_name || "";
    const matchSearch =
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  function openCreateModal() {
    setEditingUser(null);
    setFormEmail("");
    setFormName("");
    setFormRole("consumer");
    setFormGroupIds([]);
    setFormIsActive(true);
    setFormCustomQuota("");
    setIsModalOpen(true);
  }

  function openEditModal(user: IamUser) {
    setEditingUser(user);
    setFormEmail(user.email);
    setFormName(user.full_name || "");
    setFormRole(user.role);
    setFormGroupIds(user.group_ids || []);
    setFormIsActive(user.is_active);
    setFormCustomQuota(user.custom_quota_brl !== undefined ? String(user.custom_quota_brl) : "");
    setIsModalOpen(true);
  }

  function toggleGroupId(gid: string) {
    setFormGroupIds((prev) =>
      prev.includes(gid) ? prev.filter((id) => id !== gid) : [...prev, gid]
    );
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    if (!formEmail.trim()) {
      toast.error("Informe o e-mail do usuário.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          full_name: formName.trim() || undefined,
          role: formRole,
          group_ids: formGroupIds,
          is_active: formIsActive,
          custom_quota_brl: formCustomQuota ? Number(formCustomQuota) : undefined,
        });
        toast.success("Usuário atualizado com sucesso!");
      } else {
        await createUser({
          email: formEmail.trim().toLowerCase(),
          full_name: formName.trim() || undefined,
          role: formRole,
          group_ids: formGroupIds,
          is_active: formIsActive,
          custom_quota_brl: formCustomQuota ? Number(formCustomQuota) : undefined,
        });
        toast.success("Usuário cadastrado no IAM!");
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar usuário.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteUser(id: string) {
    const target = users.find((u) => u.id === id);
    if (target?.email && target.email.toLowerCase() === GLOBAL_ADMIN_EMAIL.toLowerCase()) {
      toast.error("O Administrador Global principal não pode ser excluído.");
      return;
    }

    try {
      await deleteUser(id);
      toast.success("Usuário removido do IAM.");
      setDeletingUserId(null);
      onRefresh();
    } catch {
      toast.error("Falha ao excluir usuário.");
    }
  }

  function getRoleBadge(role: IamRole) {
    switch (role) {
      case "global_admin":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/30">
            👑 Admin Global
          </span>
        );
      case "analyst":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-500/30">
            🔍 Analista
          </span>
        );
      case "consumer":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-semibold text-slate-300 ring-1 ring-slate-500/30">
            🛍️ Consumidor
          </span>
        );
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de Ações do Topo */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Pesquisar por email ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink placeholder:text-dim focus:border-signal focus:outline-none"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-surface px-3 py-1.5 text-xs text-ink focus:border-signal focus:outline-none"
          >
            <option value="all">Todos os Papéis</option>
            <option value="global_admin">Administrador Global</option>
            <option value="analyst">Analista de Postagem</option>
            <option value="consumer">Consumidor</option>
          </select>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-signal px-3.5 py-2 text-xs font-semibold text-canvas transition hover:brightness-110"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adicionar Usuário
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-surface/50">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-white/10 bg-white/[0.02] text-dim uppercase tracking-wider font-mono">
            <tr>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Papel / HBAC</th>
              <th className="px-4 py-3">Grupos Vinculados</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-dim">
                  Nenhum usuário encontrado com os filtros atuais.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const userGroupNames = groups
                  .filter((g) => u.group_ids?.includes(g.id))
                  .map((g) => g.name);

                const isMainAdmin = Boolean(
                  u.email && u.email.toLowerCase() === GLOBAL_ADMIN_EMAIL.toLowerCase()
                );

                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink">{u.full_name || "Sem nome"}</div>
                      <div className="font-mono text-[11px] text-dim">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">{getRoleBadge(u.role)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {userGroupNames.length > 0 ? (
                          userGroupNames.map((name) => (
                            <span
                              key={name}
                              className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-ink font-mono"
                            >
                              {name}
                            </span>
                          ))
                        ) : (
                          <span className="text-dim text-[11px] italic">Nenhum</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400">
                          <span className="size-1.5 rounded-full bg-rose-400" /> Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="rounded p-1.5 text-dim hover:bg-white/10 hover:text-ink transition"
                          title="Editar Usuário"
                        >
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        {!isMainAdmin && (
                          <button
                            onClick={() => setDeletingUserId(u.id)}
                            className="rounded p-1.5 text-rose-400 hover:bg-rose-500/10 transition"
                            title="Excluir Usuário"
                          >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Criar / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12141c] p-6 shadow-2xl text-ink animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold">
              {editingUser ? "Editar Usuário IAM" : "Adicionar Usuário ao IAM"}
            </h3>
            <p className="mt-1 text-xs text-dim">
              Defina o papel hierárquico (HBAC) e os grupos aos quais este usuário pertence.
            </p>

            <form onSubmit={handleSaveUser} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-dim mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  disabled={Boolean(editingUser)}
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-ink placeholder:text-dim focus:border-signal focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-dim mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Ana Souza"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-ink placeholder:text-dim focus:border-signal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-dim mb-1">Papel no Sistema *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as IamRole)}
                  className="w-full rounded-lg border border-white/10 bg-[#1a1d29] px-3 py-2 text-ink focus:border-signal focus:outline-none"
                >
                  <option value="consumer">Consumidor (Apenas envia arte)</option>
                  <option value="analyst">Analista de Postagem (Aprova artes & gasta cota do grupo)</option>
                  <option value="global_admin">Administrador Global (Controle Total & IAM)</option>
                </select>
              </div>

              <div>
                <label className="block text-dim mb-1.5">Grupos Vinculados</label>
                {groups.length === 0 ? (
                  <p className="text-[11px] text-dim italic">Nenhum grupo cadastrado ainda.</p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.02] p-2">
                    {groups.map((g) => (
                      <label
                        key={g.id}
                        className="flex items-center gap-2 rounded px-2 py-1 hover:bg-white/5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formGroupIds.includes(g.id)}
                          onChange={() => toggleGroupId(g.id)}
                          className="rounded border-white/20 bg-white/5 text-signal focus:ring-0"
                        />
                        <span className="text-xs text-ink">{g.name}</span>
                        <span className="ml-auto font-mono text-[10px] text-dim">
                          Cota: R$ {g.quota_brl.toFixed(2)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-signal focus:ring-0"
                  />
                  <span className="text-xs text-ink">Conta Ativa</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-white/10 px-3.5 py-2 text-xs text-dim hover:text-ink hover:bg-white/5 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-signal px-4 py-2 text-xs font-semibold text-canvas hover:brightness-110 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deletingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/20 bg-[#12141c] p-6 shadow-2xl text-ink">
            <h3 className="text-base font-bold text-rose-400">Confirmar Exclusão</h3>
            <p className="mt-2 text-xs text-dim leading-relaxed">
              Tem certeza que deseja remover este usuário do sistema de acesso IAM?
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingUserId(null)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-dim hover:text-ink"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUser(deletingUserId)}
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
