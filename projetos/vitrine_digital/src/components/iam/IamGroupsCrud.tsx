import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import type { IamGroup, IamUser } from "@/lib/iam-types";
import { createGroup, deleteGroup, updateGroup } from "@/lib/iam-service";
import { listGeminiModels, LOVABLE_VISION_MODELS } from "@/lib/analysis.functions";

interface IamGroupsCrudProps {
  groups: IamGroup[];
  users: IamUser[];
  onRefresh: () => void;
}

const DEFAULT_GEMINI_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Recomendado)", description: "Excelente para OCR e visão multimodal em alta velocidade" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Raciocínio profundo e extração avançada" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Nova geração de alta velocidade" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "Rápido e econômico" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Alta capacidade multimodal" },
];

export function IamGroupsCrud({ groups, users, onRefresh }: IamGroupsCrudProps) {
  const getModels = useServerFn(listGeminiModels);
  const [searchTerm, setSearchTerm] = useState("");

  // Modo de exibição: "list" (padrão) | "edit" (criação/edição tela cheia) | "inspect_models" (tela cheia de modelos)
  const [viewMode, setViewMode] = useState<"list" | "edit" | "inspect_models">("list");
  const [editingGroup, setEditingGroup] = useState<IamGroup | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formGeminiKey, setFormGeminiKey] = useState("");
  const [formGeminiModel, setFormGeminiModel] = useState("gemini-2.5-flash");
  const [showKeyInForm, setShowKeyInForm] = useState(false);
  const [formQuota, setFormQuota] = useState("200.00");
  const [formMaxReqs, setFormMaxReqs] = useState("500");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de Modelos do Gemini
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [loadedModels, setLoadedModels] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [modelFilterTerm, setModelFilterTerm] = useState("");
  const [modelInspectionGroup, setModelInspectionGroup] = useState<{
    group: IamGroup;
    models: Array<{ id: string; name: string; description: string }>;
  } | null>(null);

  // Exclusão
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  // Visualização de chaves mascaradas
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function toggleRevealKey(groupId: string) {
    setRevealedKeys((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  function openCreateView() {
    setEditingGroup(null);
    setFormName("");
    setFormSlug("");
    setFormDesc("");
    setFormGeminiKey("");
    setFormGeminiModel("gemini-2.5-flash");
    setShowKeyInForm(false);
    setLoadedModels([]);
    setFormQuota("200.00");
    setFormMaxReqs("500");
    setViewMode("edit");
  }

  function openEditView(group: IamGroup) {
    setEditingGroup(group);
    setFormName(group.name);
    setFormSlug(group.slug);
    setFormDesc(group.description || "");
    setFormGeminiKey(group.gemini_api_key || "");
    setFormGeminiModel(group.gemini_model || "gemini-2.5-flash");
    setShowKeyInForm(false);
    setLoadedModels([]);
    setFormQuota(String(group.quota_brl));
    setFormMaxReqs(String(group.max_requests_per_day || 500));
    setViewMode("edit");
  }

  async function handleTestAndLoadModels(keyToTest?: string) {
    const key = (keyToTest || formGeminiKey).trim();
    if (!key) {
      toast.error("Insira a chave de API do Gemini para testar e listar os modelos.");
      return;
    }
    setIsLoadingModels(true);
    const toastId = toast.loading("Consultando modelos disponíveis na Google AI API...");
    try {
      const res = await getModels({ data: { apiKey: key } });
      if (res.ok && res.models.length > 0) {
        setLoadedModels(res.models);
        // Se o modelo atual não estiver na lista retornada, mantém ou atualiza
        const hasCurrent = res.models.some((m) => m.id === formGeminiModel);
        if (!hasCurrent && res.models[0]) {
          setFormGeminiModel(res.models[0].id);
        }
        toast.success(`Chave validada! ${res.models.length} modelos Gemini compatíveis encontrados.`, { id: toastId });
      } else {
        toast.error("Nenhum modelo compatível encontrado para esta chave.", { id: toastId });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao validar chave do Gemini.";
      toast.error(msg, { id: toastId });
    } finally {
      setIsLoadingModels(false);
    }
  }

  async function handleInspectGroupModels(group: IamGroup) {
    if (!group.gemini_api_key) {
      toast.info(`O grupo "${group.name}" ainda não possui chave Gemini cadastrada. Edite o grupo para inserir uma chave.`);
      openEditView(group);
      return;
    }
    setIsLoadingModels(true);
    const toastId = toast.loading(`Consultando modelos da chave do grupo "${group.name}"...`);
    try {
      const res = await getModels({ data: { apiKey: group.gemini_api_key } });
      if (res.ok && res.models.length > 0) {
        setModelInspectionGroup({ group, models: res.models });
        setModelFilterTerm("");
        setViewMode("inspect_models");
        toast.success(`${res.models.length} modelos disponíveis para o grupo "${group.name}".`, { id: toastId });
      } else {
        toast.error("Nenhum modelo disponível para a chave deste grupo.", { id: toastId });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao consultar modelos do grupo.";
      toast.error(msg, { id: toastId });
    } finally {
      setIsLoadingModels(false);
    }
  }

  async function handleApplyModelToGroup(group: IamGroup, modelId: string) {
    try {
      await updateGroup(group.id, { gemini_model: modelId });
      toast.success(`Modelo "${modelId}" aplicado com sucesso ao grupo "${group.name}"!`);
      if (modelInspectionGroup) {
        setModelInspectionGroup({
          ...modelInspectionGroup,
          group: { ...modelInspectionGroup.group, gemini_model: modelId },
        });
      }
      onRefresh();
    } catch {
      toast.error("Falha ao salvar modelo do grupo.");
    }
  }

  async function handleSaveGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Informe o nome do grupo.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingGroup) {
        await updateGroup(editingGroup.id, {
          name: formName.trim(),
          slug: formSlug.trim() || formName.toLowerCase().replace(/\s+/g, "-"),
          description: formDesc.trim() || undefined,
          gemini_api_key: formGeminiKey.trim(),
          gemini_model: formGeminiModel.trim() || "gemini-2.5-flash",
          quota_brl: Number(formQuota) || 200.0,
          max_requests_per_day: Number(formMaxReqs) || 500,
        });
        toast.success(`Grupo "${formName}" e modelo "${formGeminiModel}" salvos com sucesso!`);
      } else {
        await createGroup({
          name: formName.trim(),
          slug: formSlug.trim() || formName.toLowerCase().replace(/\s+/g, "-"),
          description: formDesc.trim() || undefined,
          gemini_api_key: formGeminiKey.trim(),
          gemini_model: formGeminiModel.trim() || "gemini-2.5-flash",
          quota_brl: Number(formQuota) || 200.0,
          max_requests_per_day: Number(formMaxReqs) || 500,
        });
        toast.success(`Novo grupo "${formName}" criado com modelo "${formGeminiModel}"!`);
      }
      setViewMode("list");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar grupo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteGroup(id: string) {
    try {
      await deleteGroup(id);
      toast.success("Grupo excluído.");
      setDeletingGroupId(null);
      onRefresh();
    } catch {
      toast.error("Falha ao excluir grupo.");
    }
  }

  async function handleResetQuota(group: IamGroup) {
    try {
      await updateGroup(group.id, { used_brl: 0.0 });
      toast.success(`Cota de uso do grupo "${group.name}" reiniciada para R$ 0,00!`);
      onRefresh();
    } catch {
      toast.error("Falha ao resetar cota.");
    }
  }

  const inspectedModelsFiltered = useMemo(() => {
    if (!modelInspectionGroup) return [];
    if (!modelFilterTerm.trim()) return modelInspectionGroup.models;
    const term = modelFilterTerm.toLowerCase();
    return modelInspectionGroup.models.filter(
      (m) =>
        m.id.toLowerCase().includes(term) ||
        (m.name && m.name.toLowerCase().includes(term)) ||
        (m.description && m.description.toLowerCase().includes(term))
    );
  }, [modelInspectionGroup, modelFilterTerm]);

  // ==========================================
  // VIEW 1: TELA CHEIA DE CRIAÇÃO / EDIÇÃO DE GRUPO
  // ==========================================
  if (viewMode === "edit") {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Top Header com Botão Voltar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-dim hover:text-signal hover:border-signal/40 transition cursor-pointer"
            >
              <span>←</span>
              <span>Voltar para Lista de Grupos</span>
            </button>
            <div className="h-4 w-px bg-white/10" />
            <h2 className="text-base font-bold text-ink">
              {editingGroup ? `Editar Grupo: ${editingGroup.name}` : "Criar Novo Grupo & Cota de IA"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-dim hover:text-ink hover:bg-white/5 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveGroup}
              className="rounded-xl bg-signal px-5 py-2 text-xs font-bold text-canvas hover:brightness-110 transition disabled:opacity-50 shadow-md shadow-signal/20 cursor-pointer"
            >
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </div>

        {/* Formulário em Tela Cheia com 2 Colunas */}
        <form onSubmit={handleSaveGroup} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna 1: Dados do Grupo e Cotas */}
          <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2 border-b border-white/10 pb-3">
              <span>🏢</span> Informações Gerais do Grupo
            </h3>

            <div>
              <label className="block text-xs font-semibold text-dim mb-1.5">Nome do Grupo *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Monumento, Matriz, Filial SP"
                className="w-full rounded-xl border border-white/10 bg-[#07080b] px-3.5 py-2.5 text-xs text-ink placeholder:text-dim focus:border-signal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-dim mb-1.5">Slug Identificador (URL/Código)</label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="ex: monumento"
                className="w-full rounded-xl border border-white/10 bg-[#07080b] px-3.5 py-2.5 font-mono text-xs text-ink placeholder:text-dim focus:border-signal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-dim mb-1.5">Descrição da Unidade / Grupo</label>
              <textarea
                rows={3}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Finalidade deste grupo, analistas responsáveis..."
                className="w-full rounded-xl border border-white/10 bg-[#07080b] px-3.5 py-2.5 text-xs text-ink placeholder:text-dim focus:border-signal focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-dim mb-1.5">Cota Financeira de IA (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formQuota}
                  onChange={(e) => setFormQuota(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#07080b] px-3.5 py-2.5 font-mono text-xs text-emerald-400 font-bold focus:border-signal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dim mb-1.5">Limite Máximo (Req/Dia)</label>
                <input
                  type="number"
                  value={formMaxReqs}
                  onChange={(e) => setFormMaxReqs(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#07080b] px-3.5 py-2.5 font-mono text-xs text-ink focus:border-signal focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Coluna 2: Chave Gemini & Seleção do Modelo */}
          <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2 border-b border-white/10 pb-3">
              <span>🤖</span> Configuração de IA & Chave Gemini do Grupo
            </h3>

            {/* Input da Chave com Botão Validar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-dim">Chave de API do Google Gemini (Gravada no BD)</label>
                {formGeminiKey && (
                  <button
                    type="button"
                    onClick={() => setShowKeyInForm(!showKeyInForm)}
                    className="text-[11px] text-signal hover:underline cursor-pointer"
                  >
                    {showKeyInForm ? "Ocultar Chave" : "Visualizar Chave"}
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type={showKeyInForm ? "text" : "password"}
                  value={formGeminiKey}
                  onChange={(e) => {
                    setFormGeminiKey(e.target.value);
                    setLoadedModels([]);
                  }}
                  placeholder="AIzaSy..."
                  className="w-full sm:flex-1 min-w-0 rounded-xl border border-white/10 bg-[#07080b] px-3.5 py-2.5 font-mono text-xs text-ink placeholder:text-dim focus:border-signal focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => handleTestAndLoadModels()}
                  disabled={!formGeminiKey.trim() || isLoadingModels}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-signal/40 bg-signal/15 px-4 py-2.5 font-mono text-xs font-bold text-signal hover:bg-signal/25 transition disabled:opacity-40 w-full sm:w-auto shrink-0 cursor-pointer shadow-sm whitespace-nowrap"
                >
                  {isLoadingModels ? (
                    <>
                      <div className="size-3.5 animate-spin rounded-full border-2 border-signal border-t-transparent" />
                      <span>Validando...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>Carregar Modelos</span>
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-dim">
                Se informada, esta chave do Google Gemini será consumida nas análises do grupo. Se deixada em branco, o grupo utilizará a IA nativa do <strong>Lovable AI</strong>.
              </p>
            </div>

            {/* Seleção do Modelo Ativo */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-dim">Modelo de IA Padrão do Grupo</label>
                <span className="rounded-md bg-signal/15 border border-signal/30 px-2 py-0.5 font-mono text-[11px] font-bold text-signal truncate max-w-[160px] sm:max-w-none">
                  Ativo: {formGeminiModel}
                </span>
              </div>
              <select
                value={formGeminiModel}
                onChange={(e) => setFormGeminiModel(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#07080b] px-3.5 py-2.5 text-xs text-signal font-mono focus:border-signal focus:outline-none cursor-pointer"
              >
                <optgroup label="Modelos Google Gemini">
                  {(loadedModels.length > 0 ? loadedModels : DEFAULT_GEMINI_MODELS).map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#0e1017] text-ink font-mono">
                      {m.id} {m.name && m.name !== m.id ? `(${m.name})` : ""}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Modelos Lovable AI (Nativo)">
                  {LOVABLE_VISION_MODELS.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#0e1017] text-ink font-mono">
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Grade de Modelos Disponíveis (Clique para escolher) */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <span>✨</span> Modelos Gemini Disponíveis:
                </span>
                <span className="text-[10px] text-dim">Clique em qualquer um para selecionar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {(loadedModels.length > 0 ? loadedModels : DEFAULT_GEMINI_MODELS).map((m) => {
                  const isSelected = formGeminiModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setFormGeminiModel(m.id);
                        toast.success(`Modelo "${m.id}" selecionado!`);
                      }}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition cursor-pointer min-w-0 ${
                        isSelected
                          ? "border-signal bg-signal/15 shadow-md shadow-signal/20 text-signal"
                          : "border-white/10 bg-white/[0.02] hover:border-white/30 text-ink/80 hover:text-ink"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <strong className="font-mono text-xs font-bold truncate">{m.id}</strong>
                        {isSelected && <span className="text-xs font-bold shrink-0">✓ Ativo</span>}
                      </div>
                      {m.description && (
                        <p className="mt-1 text-[10px] text-dim line-clamp-2 leading-relaxed break-words">
                          {m.description}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: TELA CHEIA DE INSPEÇÃO DE MODELOS DO GRUPO
  // ==========================================
  if (viewMode === "inspect_models" && modelInspectionGroup) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-dim hover:text-signal hover:border-signal/40 transition cursor-pointer"
            >
              <span>←</span>
              <span>Voltar para Lista de Grupos</span>
            </button>
            <div className="h-4 w-px bg-white/10" />
            <div>
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <span>🤖</span> Modelos Gemini Disponíveis para "{modelInspectionGroup.group.name}"
              </h2>
              <p className="text-xs text-dim">
                {modelInspectionGroup.models.length} modelos retornados pela Google AI API para esta chave.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filtrar modelos (ex: flash, pro, 2.5)..."
              value={modelFilterTerm}
              onChange={(e) => setModelFilterTerm(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-white/10 bg-[#07080b] px-3.5 py-2 text-xs text-ink placeholder:text-dim focus:border-signal focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Grade de Modelos em Tela Cheia */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inspectedModelsFiltered.map((m) => {
            const isCurrent = (modelInspectionGroup.group.gemini_model || "gemini-2.5-flash") === m.id;
            return (
              <div
                key={m.id}
                className={`flex flex-col justify-between rounded-2xl border p-4.5 transition ${
                  isCurrent
                    ? "border-signal bg-signal/10 shadow-lg shadow-signal/15"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <strong className="font-mono text-sm text-signal font-bold break-all">{m.id}</strong>
                    {isCurrent ? (
                      <span className="shrink-0 rounded-full bg-signal px-2 py-0.5 text-[10px] font-bold text-canvas">
                        ✓ Ativo no Grupo
                      </span>
                    ) : null}
                  </div>

                  {m.name && m.name !== m.id && (
                    <div className="mt-1 text-[11px] font-medium text-ink/90">{m.name}</div>
                  )}

                  {m.description && (
                    <p className="mt-2 text-xs text-dim leading-relaxed">{m.description}</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-faint">Google Gemini API</span>
                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => handleApplyModelToGroup(modelInspectionGroup.group, m.id)}
                    className={`rounded-xl px-4 py-2 font-mono text-xs font-bold transition cursor-pointer ${
                      isCurrent
                        ? "bg-signal/20 text-signal/50 border border-signal/30 cursor-default"
                        : "bg-signal text-canvas hover:brightness-110 shadow-md shadow-signal/20"
                    }`}
                  >
                    {isCurrent ? "✓ Modelo em Uso" : "Definir como Padrão"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: TELA PRINCIPAL (LISTA DE GRUPOS)
  // ==========================================
  return (
    <div className="space-y-4">
      {/* Barra do Topo */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full min-w-0">
        <input
          type="text"
          placeholder="Pesquisar grupos por nome ou slug..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-72 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-ink placeholder:text-dim focus:border-signal focus:outline-none"
        />

        <button
          onClick={openCreateView}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-signal px-4 py-2.5 text-xs font-semibold text-canvas transition hover:brightness-110 shadow-md shadow-signal/20 cursor-pointer"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Grupo
        </button>
      </div>

      {/* Grid de Grupos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
        {filteredGroups.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-white/10 bg-surface/50 p-12 text-center text-xs text-dim">
            Nenhum grupo encontrado.
          </div>
        ) : (
          filteredGroups.map((g) => {
            const memberCount = users.filter((u) => u.group_ids?.includes(g.id)).length;
            const percentUsed = Math.min(100, (g.used_brl / Math.max(1, g.quota_brl)) * 100);
            const isRevealed = Boolean(revealedKeys[g.id]);

            return (
              <div
                key={g.id}
                className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-surface/60 p-4 sm:p-5 backdrop-blur-sm hover:border-white/20 transition w-full min-w-0 overflow-hidden"
              >
                <div className="min-w-0 w-full">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <span className="font-bold text-sm text-ink truncate max-w-full">{g.name}</span>
                        <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-dim shrink-0">
                          slug: {g.slug}
                        </span>
                      </div>
                      {g.description && (
                        <p className="mt-1 text-xs text-dim leading-relaxed break-words">{g.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditView(g)}
                        className="rounded-lg p-2 text-dim hover:bg-white/10 hover:text-ink transition cursor-pointer"
                        title="Editar Grupo em Tela Cheia"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeletingGroupId(g.id)}
                        className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Excluir Grupo"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Cota Financeira da IA */}
                  <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 text-xs w-full min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] mb-1.5 font-mono">
                      <span className="text-dim">Cota de IA (Gemini):</span>
                      <span className="font-semibold text-ink">
                        R$ {g.used_brl.toFixed(2)} / R$ {g.quota_brl.toFixed(2)}
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full transition-all duration-300 ${
                          percentUsed > 90
                            ? "bg-rose-500"
                            : percentUsed > 70
                            ? "bg-amber-500"
                            : "bg-signal"
                        }`}
                        style={{ width: `${percentUsed}%` }}
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[10px] text-dim">
                      <span>{percentUsed.toFixed(0)}% utilizado</span>
                      <button
                        type="button"
                        onClick={() => handleResetQuota(g)}
                        className="text-signal hover:underline cursor-pointer"
                      >
                        Resetar Uso (R$ 0,00)
                      </button>
                    </div>
                  </div>

                  {/* Chave de API Gravada no BD */}
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs w-full min-w-0">
                    <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
                      <svg className="size-4 text-dim shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-dim uppercase tracking-wider font-mono">Chave Gemini Gravada</div>
                        <div className="font-mono text-xs text-ink truncate">
                          {g.gemini_api_key
                            ? isRevealed
                              ? g.gemini_api_key
                              : `${g.gemini_api_key.slice(0, 6)}••••••••••••${g.gemini_api_key.slice(-4)}`
                            : "Nenhuma (usa padrão do servidor)"}
                        </div>
                      </div>
                    </div>

                    {g.gemini_api_key && (
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleInspectGroupModels(g)}
                          disabled={isLoadingModels}
                          className="inline-flex items-center gap-1 rounded-lg bg-signal/15 border border-signal/30 px-2.5 py-1 text-[11px] font-bold text-signal hover:bg-signal/25 transition cursor-pointer"
                          title="Listar todos os modelos disponíveis para esta chave em tela cheia"
                        >
                          <span>🤖 Ver Modelos</span>
                        </button>
                        <button
                          onClick={() => toggleRevealKey(g.id)}
                          className="rounded-lg px-2 py-1 bg-white/5 border border-white/10 text-dim hover:text-ink transition text-[11px] cursor-pointer"
                          title={isRevealed ? "Ocultar Chave" : "Mostrar Chave"}
                        >
                          {isRevealed ? "Ocultar" : "Ver"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer do Card */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-white/5 pt-3 text-[11px] text-dim w-full min-w-0">
                  <div className="flex items-center justify-between sm:justify-start gap-1.5 min-w-0 w-full sm:w-auto">
                    <span className="shrink-0">🤖 Modelo:</span>
                    <select
                      value={g.gemini_model || "gemini-2.5-flash"}
                      onChange={async (e) => {
                        const newModel = e.target.value;
                        try {
                          await updateGroup(g.id, { gemini_model: newModel });
                          toast.success(`Modelo do grupo "${g.name}" atualizado para ${newModel}!`);
                          onRefresh();
                        } catch {
                          toast.error("Erro ao atualizar modelo.");
                        }
                      }}
                      className="max-w-[180px] truncate rounded-lg bg-signal/15 border border-signal/30 px-2 py-1 font-mono text-[11px] font-bold text-signal focus:outline-none cursor-pointer hover:bg-signal/25 transition"
                      title="Selecione o modelo Gemini padrão para as análises deste grupo"
                    >
                      {DEFAULT_GEMINI_MODELS.map((m) => (
                        <option key={m.id} value={m.id} className="bg-[#0e1017] text-ink">
                          {m.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 text-[10px] sm:text-[11px] shrink-0">
                    <span>👥 {memberCount} membro(s)</span>
                    <span>⚡ Max: {g.max_requests_per_day || 500} req/dia</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Exclusão Simples */}
      {deletingGroupId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/20 bg-[#12141c] p-6 shadow-2xl text-ink">
            <h3 className="text-base font-bold text-rose-400">Excluir Grupo</h3>
            <p className="mt-2 text-xs text-dim leading-relaxed">
              Tem certeza que deseja remover este grupo? Os membros e limites associados serão desvinculados.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingGroupId(null)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-dim hover:text-ink"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteGroup(deletingGroupId)}
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
