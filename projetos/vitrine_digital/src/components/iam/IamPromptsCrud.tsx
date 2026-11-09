import { useState } from "react";
import { toast } from "sonner";
import type { IamPrompt, PromptType } from "@/lib/prompt-types";
import { deletePrompt, restoreDefaultPrompts, savePrompt, setActivePrompt } from "@/lib/prompt-service";

interface IamPromptsCrudProps {
  prompts: IamPrompt[];
  onRefresh: () => void;
}

export function IamPromptsCrud({ prompts, onRefresh }: IamPromptsCrudProps) {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal de Edição / Criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<IamPrompt | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<PromptType>("vision_extraction");
  const [formContent, setFormContent] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formVersion, setFormVersion] = useState("v1.0");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formModelTarget, setFormModelTarget] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal de Exclusão e Restauração
  const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Modal de Visualização / Comparação
  const [viewingPrompt, setViewingPrompt] = useState<IamPrompt | null>(null);

  const filtered = prompts.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = selectedType === "all" || p.type === selectedType;
    return matchSearch && matchType;
  });

  function openCreateModal(type: PromptType = "vision_extraction") {
    setEditingPrompt(null);
    setFormName("");
    setFormType(type);
    setFormContent("");
    setFormDesc("");
    setFormVersion(`v1.${prompts.filter((p) => p.type === type).length + 1}`);
    setFormIsActive(true);
    setFormModelTarget("all");
    setIsModalOpen(true);
  }

  function openEditModal(p: IamPrompt) {
    setEditingPrompt(p);
    setFormName(p.name);
    setFormType(p.type);
    setFormContent(p.content);
    setFormDesc(p.description || "");
    setFormVersion(p.version);
    setFormIsActive(p.is_active);
    setFormModelTarget(p.model_target || "all");
    setIsModalOpen(true);
  }

  function handleDuplicate(p: IamPrompt) {
    setEditingPrompt(null);
    setFormName(`${p.name} (Cópia)`);
    setFormType(p.type);
    setFormContent(p.content);
    setFormDesc(p.description || "");
    setFormVersion(`${p.version}.1`);
    setFormIsActive(false);
    setFormModelTarget(p.model_target || "all");
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formContent.trim()) {
      toast.error("Preencha o nome e as instruções do prompt.");
      return;
    }

    setIsSubmitting(true);
    try {
      await savePrompt({
        id: editingPrompt?.id,
        name: formName.trim(),
        type: formType,
        content: formContent.trim(),
        description: formDesc.trim() || undefined,
        version: formVersion.trim() || "v1.0",
        is_active: formIsActive,
        is_system_default: editingPrompt?.is_system_default ?? false,
        model_target: formModelTarget,
      });

      toast.success("Prompt salvo com sucesso no banco de dados!");
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar prompt.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleActivate(p: IamPrompt) {
    try {
      await setActivePrompt(p.id, p.type);
      toast.success(`Prompt "${p.name}" ativado como principal do sistema!`);
      onRefresh();
    } catch {
      toast.error("Erro ao ativar prompt.");
    }
  }

  async function handleDelete(id: string) {
    const target = prompts.find((p) => p.id === id);
    if (target?.is_system_default) {
      toast.error("Prompts marcados como padrão do sistema não podem ser excluídos.");
      return;
    }

    try {
      await deletePrompt(id);
      toast.success("Prompt excluído.");
      setDeletingPromptId(null);
      onRefresh();
    } catch {
      toast.error("Falha ao excluir prompt.");
    }
  }

  async function executeRestoreDefaults() {
    setIsRestoring(true);
    try {
      await restoreDefaultPrompts();
      toast.success("Prompts de fábrica restaurados com sucesso!");
      setIsRestoreModalOpen(false);
      onRefresh();
    } catch {
      toast.error("Erro ao restaurar prompts.");
    } finally {
      setIsRestoring(false);
    }
  }

  function handleRestoreDefaults() {
    setIsRestoreModalOpen(true);
  }

  function insertTemplateRule(text: string) {
    setFormContent((prev) => `${prev}\n\n${text}`);
    toast.info("Regra adicionada ao final do prompt.");
  }

  return (
    <div className="space-y-4">
      {/* Barra de Controle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Pesquisar instruções ou títulos de prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink placeholder:text-dim focus:border-signal focus:outline-none"
          />

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-lg border border-white/10 bg-surface px-3 py-1.5 text-xs text-ink focus:border-signal focus:outline-none"
          >
            <option value="all">Todos os Tipos</option>
            <option value="vision_extraction">Extração de Visão (OCR & JSON)</option>
            <option value="art_generation">Geração de Arte Publicitária</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-dim hover:text-ink hover:bg-white/10 transition"
            title="Restaurar prompts originais de fábrica"
          >
            ↺ Restaurar Padrões
          </button>
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-signal px-3.5 py-1.5 text-xs font-semibold text-canvas hover:brightness-110 transition"
          >
            <span>+</span>
            <span>Novo Prompt</span>
          </button>
        </div>
      </div>

      {/* Lista de Prompts em Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full max-w-full min-w-0">
        {filtered.length === 0 ? (
          <div className="col-span-1 sm:col-span-2 rounded-xl border border-white/10 bg-surface/50 p-8 text-center text-xs text-dim">
            Nenhum prompt encontrado para os filtros selecionados.
          </div>
        ) : (
          filtered.map((p) => {
            const estimatedTokens = Math.round(p.content.length / 4);

            return (
              <div
                key={p.id}
                className={`relative flex flex-col justify-between rounded-xl border p-4 sm:p-5 backdrop-blur-sm transition w-full max-w-full min-w-0 overflow-hidden ${
                  p.is_active
                    ? "border-signal/50 bg-signal/[0.04] shadow-md shadow-signal/5"
                    : "border-white/10 bg-surface/60 hover:border-white/20"
                }`}
              >
                <div className="w-full max-w-full min-w-0 overflow-hidden">
                  <div className="flex items-start justify-between gap-2 w-full min-w-0">
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-bold text-sm text-ink truncate max-w-[180px] sm:max-w-[240px]">{p.name}</span>
                        <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-amber-300 shrink-0">
                          {p.version}
                        </span>
                        {p.is_system_default && (
                          <span className="rounded bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 text-[10px] text-blue-300 font-mono shrink-0">
                            Padrão
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <p className="mt-1 text-xs text-dim line-clamp-2 leading-relaxed break-words">{p.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setViewingPrompt(p)}
                        className="rounded p-1.5 text-dim hover:bg-white/10 hover:text-ink transition cursor-pointer"
                        title="Visualizar Instruções Completas"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openEditModal(p)}
                        className="rounded p-1.5 text-dim hover:bg-white/10 hover:text-ink transition cursor-pointer"
                        title="Editar Prompt"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDuplicate(p)}
                        className="rounded p-1.5 text-dim hover:bg-white/10 hover:text-ink transition cursor-pointer"
                        title="Duplicar / Criar Versão"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      </button>
                      {!p.is_system_default && (
                        <button
                          onClick={() => setDeletingPromptId(p.id)}
                          className="rounded p-1.5 text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                          title="Excluir Prompt"
                        >
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Prévia do Conteúdo com quebra automática rigorosa */}
                  <div className="mt-3 w-full max-w-full min-w-0 rounded-lg border border-white/5 bg-black/40 p-2.5 font-mono text-[11px] text-dim line-clamp-3 select-none leading-relaxed break-words break-all overflow-hidden">
                    {p.content}
                  </div>
                </div>

                {/* Rodapé do Card */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3 text-xs w-full min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] text-dim font-mono shrink-0">
                    <span>{p.content.length} carac.</span>
                    <span>·</span>
                    <span>~{estimatedTokens} tok.</span>
                  </div>

                  {p.is_active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 font-mono shrink-0">
                      ✓ Ativo no Sistema
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleActivate(p)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-dim hover:text-signal hover:border-signal/40 transition cursor-pointer shrink-0"
                    >
                      Ativar como Principal
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Criar / Editar Prompt */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#12141c] p-6 shadow-2xl text-ink animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingPrompt ? `Editar Prompt (${editingPrompt.name})` : "Novo Prompt de IA"}
                </h3>
                <p className="mt-1 text-xs text-dim">
                  Ajuste o comportamento, OCR, instruções sensoriais e estrutura JSON que a IA seguirá.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-dim hover:bg-white/10 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-dim mb-1 font-medium">Nome do Prompt *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Prompt de Extração de Alimentos & Cardápios"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-ink placeholder:text-dim focus:border-signal focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-dim mb-1 font-medium">Versão</label>
                  <input
                    type="text"
                    value={formVersion}
                    onChange={(e) => setFormVersion(e.target.value)}
                    placeholder="v1.2"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-ink placeholder:text-dim focus:border-signal focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-dim mb-1 font-medium">Tipo de Aplicação</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as PromptType)}
                    className="w-full rounded-lg border border-white/10 bg-[#1a1d29] px-3 py-2 text-ink focus:border-signal focus:outline-none"
                  >
                    <option value="vision_extraction">Extração de Imagem (OCR & JSON)</option>
                    <option value="art_generation">Geração de Arte Publicitária</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-dim mb-1 font-medium">Modelo Destino</label>
                  <select
                    value={formModelTarget}
                    onChange={(e) => setFormModelTarget(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#1a1d29] px-3 py-2 text-ink focus:border-signal focus:outline-none"
                  >
                    <option value="all">Todos os Modelos (Gemini & OpenAI)</option>
                    <option value="gemini-2.5-flash">Otimizado para Gemini 2.5 Flash</option>
                    <option value="gemini-2.5-pro">Otimizado para Gemini 2.5 Pro</option>
                    <option value="gpt-4o">Otimizado para GPT-4o Vision</option>
                  </select>
                </div>
              </div>

              {/* Botões de Inserção Rápida de Regras */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-dim font-medium">Instruções & Prompt do Sistema *</label>
                  <span className="font-mono text-[10px] text-dim">
                    {formContent.length} caracteres · ~{Math.round(formContent.length / 4)} tokens
                  </span>
                </div>

                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-faint">Atalhos de Regras:</span>
                  <button
                    type="button"
                    onClick={() =>
                      insertTemplateRule(
                        "EXTRAÇÃO RIGOROSA DE PREÇOS:\n- Sempre associe preços com moeda (R$) ao nome exato do produto correspondente."
                      )
                    }
                    className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-dim hover:text-ink hover:bg-white/10"
                  >
                    + Regra Preços
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertTemplateRule(
                        "REGRA DE OCR & NÚMEROS DE TELEFONE:\n- Extraia todos os números no formato DDD + 9 dígitos (ex: 11 99999-9999)."
                      )
                    }
                    className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-dim hover:text-ink hover:bg-white/10"
                  >
                    + Regra Telefones
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertTemplateRule(
                        "DESCRITORES SENSORIAIS & FÍSICOS:\n- Descreva texturas, cores, embalagens e iluminação com máximo realismo fotográfico."
                      )
                    }
                    className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-dim hover:text-ink hover:bg-white/10"
                  >
                    + Regra Sensorial
                  </button>
                </div>

                <textarea
                  rows={12}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Escreva as instruções completas para a IA..."
                  className="w-full rounded-lg border border-white/10 bg-black/60 p-3 font-mono text-xs text-ink placeholder:text-dim focus:border-signal focus:outline-none resize-y leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-dim mb-1 font-medium">Descrição / Finalidade</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ex: Otimizado para OCR de fotos enviadas pelo WhatsApp"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-ink placeholder:text-dim focus:border-signal focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-signal focus:ring-0 cursor-pointer"
                />
                <label htmlFor="chkIsActive" className="text-xs text-ink cursor-pointer">
                  Definir este prompt como <strong>Ativo no Sistema</strong> para {formType}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs text-dim hover:text-ink hover:bg-white/5 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-signal px-5 py-2 text-xs font-semibold text-canvas hover:brightness-110 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Prompt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualização do Prompt */}
      {viewingPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#12141c] p-4 sm:p-6 shadow-2xl text-ink max-h-[88vh] flex flex-col min-w-0 overflow-hidden">
            <div className="flex items-start justify-between border-b border-white/10 pb-3 min-w-0">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-base font-bold flex flex-wrap items-center gap-2">
                  <span className="truncate">{viewingPrompt.name}</span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-amber-300 font-mono shrink-0">
                    {viewingPrompt.version}
                  </span>
                </h3>
                <p className="mt-1 text-xs text-dim break-words">{viewingPrompt.description || "Sem descrição adicional"}</p>
              </div>
              <button
                onClick={() => setViewingPrompt(null)}
                className="rounded-lg p-1.5 text-dim hover:bg-white/10 hover:text-ink cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden my-3 sm:my-4 rounded-xl border border-white/5 bg-black/60 p-3 sm:p-4 font-mono text-xs text-ink/90 whitespace-pre-wrap leading-relaxed select-all break-words break-all min-w-0 max-w-full">
              {viewingPrompt.content}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs min-w-0">
              <span className="font-mono text-dim text-[11px]">
                {viewingPrompt.content.length} caracteres · ~{Math.round(viewingPrompt.content.length / 4)} tokens
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(viewingPrompt.content);
                    toast.success("Prompt copiado para a área de transferência!");
                  }}
                  className="rounded-lg bg-signal px-3.5 py-1.5 text-xs font-semibold text-canvas hover:brightness-110 cursor-pointer"
                >
                  Copiar Prompt
                </button>
                <button
                  onClick={() => setViewingPrompt(null)}
                  className="rounded-lg border border-white/10 px-3.5 py-1.5 text-xs text-dim hover:text-ink cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão */}
      {deletingPromptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/20 bg-[#12141c] p-6 shadow-2xl text-ink">
            <h3 className="text-base font-bold text-rose-400">Excluir Prompt</h3>
            <p className="mt-2 text-xs text-dim leading-relaxed">
              Tem certeza que deseja remover esta versão de prompt do sistema?
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingPromptId(null)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-dim hover:text-ink cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deletingPromptId)}
                className="rounded-lg bg-rose-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 transition cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Restauração de Padrões */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-[#12141c] p-6 shadow-2xl text-ink">
            <div className="flex items-center gap-3 text-amber-400 mb-2">
              <div className="grid size-9 place-items-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-lg">
                ⚠️
              </div>
              <h3 className="text-base font-bold text-amber-300">Restaurar Padrões de Fábrica</h3>
            </div>
            <p className="mt-2 text-xs text-dim leading-relaxed">
              Deseja restaurar todos os prompts originais de fábrica para extração de dados e geração de arte?
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                disabled={isRestoring}
                onClick={() => setIsRestoreModalOpen(false)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-dim hover:text-ink cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={isRestoring}
                onClick={executeRestoreDefaults}
                className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-black hover:bg-amber-400 transition cursor-pointer disabled:opacity-50"
              >
                {isRestoring ? "Restaurando..." : "Sim, Restaurar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
