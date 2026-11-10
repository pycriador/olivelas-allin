import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Eye,
  Settings,
  Share2,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Upload,
  Star,
  ToggleLeft,
  Calendar,
  Clock,
  List,
  CheckSquare,
  Radio,
  Type,
  AlignLeft,
  Hash,
  Percent,
  Info,
  Users,
  Palette,
  ArrowLeft,
  Smartphone,
  Monitor,
  ExternalLink,
} from 'lucide-react';
import { api } from '../lib/api';
import { Form, FormField, FieldType, FormCollaborator } from '../types';
import { useAuth } from '../stores/authStore';
import { useI18n } from '../i18n';
import { THEMES_LIST, getThemeById } from '../utils/themes';
import { toast } from 'sonner';

export const FormBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, canEditForm } = useAuth();
  const { t } = useI18n();

  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [collaborators, setCollaborators] = useState<FormCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Tabs: 'questions', 'settings', 'themes', 'collaborators'
  const [activeTab, setActiveTab] = useState<'questions' | 'settings' | 'themes' | 'collaborators'>('questions');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Collaborator Invite Form
  const [collabEmail, setCollabEmail] = useState('');
  const [collabRole, setCollabRole] = useState<'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      loadForm();
    } else {
      initNewForm();
    }
  }, [id]);

  const initNewForm = async () => {
    try {
      setLoading(true);
      const created = await api.createForm({
        title: 'Formulário Sem Nome',
        description: 'Descreva aqui o objetivo deste formulário para os participantes.',
        owner_id: user.id,
        theme_id: 'google-classic',
      });
      navigate(`/app/forms/${created.id}`, { replace: true });
    } catch (err: any) {
      toast.error('Erro ao inicializar formulário.');
    } finally {
      setLoading(false);
    }
  };

  const loadForm = async () => {
    try {
      setLoading(true);
      const data = await api.getFormById(id!);
      setForm(data);
      setFields(data.fields || []);
      setCollaborators(data.collaborators || []);
    } catch (err: any) {
      toast.error('Erro ao carregar dados do formulário.');
    } finally {
      setLoading(false);
    }
  };

  // Header Title & Description change
  const handleFormMetaChange = async (updates: Partial<Form>) => {
    if (!form) return;
    const updated = { ...form, ...updates };
    setForm(updated);
    try {
      await api.updateForm(form.id, updates);
    } catch (err: any) {
      toast.error('Erro ao salvar cabeçalho.');
    }
  };

  // Add Question / Field
  const handleAddField = async (type: FieldType) => {
    if (!form) return;
    const defaultLabels: Record<FieldType, string> = {
      text: 'Pergunta de Texto Curto',
      textarea: 'Pergunta de Texto Longo (Parágrafo)',
      integer: 'Pergunta de Número Inteiro (Sem decimais)',
      decimal: 'Pergunta de Número Quebrado / Decimal',
      radio: 'Pergunta de Múltipla Escolha',
      checkbox: 'Pergunta de Caixas de Seleção',
      dropdown: 'Pergunta de Lista Suspensa',
      info_text: 'Instruções e Informações Importantes',
      file_upload: 'Envio de Imagem ou Documento',
      rating: 'Avaliação por Estrelas',
      scale: 'Escala de Avaliação',
      date: 'Data',
      time: 'Horário',
      switch: 'Pergunta Sim ou Não',
    };

    const defaultOptions = ['radio', 'checkbox', 'dropdown'].includes(type) ? ['Opção 1', 'Opção 2', 'Opção 3'] : [];
    const defaultValidation = type === 'integer'
      ? { min: 0, max: 1000, step: 1 }
      : type === 'decimal'
      ? { min: 0.0, max: 1000.0, step: 0.1, precision: 2 }
      : type === 'file_upload'
      ? { maxFileSizeMB: 10, allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'] }
      : type === 'rating'
      ? { maxRating: 5 }
      : {};

    try {
      const newField = await api.addField(form.id, {
        type,
        label: defaultLabels[type],
        description: type === 'info_text' ? 'Este bloco serve apenas como instrução ou aviso aos respondentes. Não possui caixa de escrita.' : '',
        required: type !== 'info_text',
        options: defaultOptions,
        validation: defaultValidation,
      });

      setFields([...fields, newField]);
      toast.success(`Campo "${defaultLabels[type]}" adicionado!`);
    } catch (err: any) {
      toast.error('Erro ao adicionar campo.');
    }
  };

  // Update Field
  const handleUpdateField = async (fieldId: string, updates: Partial<FormField>) => {
    if (!form) return;
    setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
    try {
      await api.updateField(form.id, fieldId, updates);
    } catch (err: any) {
      toast.error('Erro ao salvar pergunta.');
    }
  };

  // Delete Field
  const handleDeleteField = async (fieldId: string) => {
    if (!form) return;
    try {
      await api.deleteField(form.id, fieldId);
      setFields(fields.filter(f => f.id !== fieldId));
      toast.success('Campo excluído.');
    } catch (err: any) {
      toast.error('Erro ao excluir campo.');
    }
  };

  // Duplicate Field
  const handleDuplicateField = async (field: FormField) => {
    if (!form) return;
    try {
      const duplicated = await api.addField(form.id, {
        type: field.type,
        label: `${field.label} (Cópia)`,
        description: field.description,
        placeholder: field.placeholder,
        required: field.required,
        options: field.options,
        validation: field.validation,
      });
      setFields([...fields, duplicated]);
      toast.success('Campo duplicado.');
    } catch (err: any) {
      toast.error('Erro ao duplicar campo.');
    }
  };

  // Move Field Up/Down
  const handleMoveField = async (index: number, direction: 'up' | 'down') => {
    if (!form) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const reordered = [...fields];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setFields(reordered);

    try {
      await api.reorderFields(form.id, reordered.map(f => f.id));
    } catch (err: any) {
      toast.error('Erro ao reordenar campos.');
    }
  };

  // Collaborator Invite
  const handleInviteCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !collabEmail.trim()) return;

    setInviting(true);
    try {
      const added = await api.addCollaborator(form.id, collabEmail.trim(), collabRole);
      setCollaborators([...collaborators.filter(c => c.user_email !== added.user_email), added]);
      toast.success(`Acesso de ${collabRole === 'editor' ? 'Editor' : 'Visualizador'} concedido para ${collabEmail}!`);
      setCollabEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao conceder acesso.');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveCollaborator = async (collabId: string) => {
    if (!form) return;
    try {
      await api.removeCollaborator(form.id, collabId);
      setCollaborators(collaborators.filter(c => c.id !== collabId));
      toast.success('Acesso removido.');
    } catch (err: any) {
      toast.error('Erro ao remover acesso.');
    }
  };

  if (loading || !form) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground">Carregando construtor de formulários...</p>
      </div>
    );
  }

  const activeTheme = getThemeById(form.theme_id);

  return (
    <div className="max-w-4xl mx-auto space-y-3.5 pb-6">
      {/* Sticky Action Bar (Fixa no topo do scroll, sem espaços vazios) */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md rounded-2xl border border-border/80 shadow-sm p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to="/app/forms"
            className="p-1.5 rounded-xl hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors shrink-0"
            title="Voltar para a lista"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <span className="font-extrabold text-xs sm:text-sm truncate max-w-[150px] sm:max-w-xs block leading-tight text-foreground">
              {form.title}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium truncate">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: activeTheme.primary }} />
              {activeTheme.name}
            </span>
          </div>
        </div>

        {/* Builder Navigation Tabs */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl overflow-x-auto max-w-full custom-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'questions' ? 'bg-surface text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Perguntas ({fields.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-surface text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Configurações
          </button>
          <button
            onClick={() => setActiveTab('themes')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'themes' ? 'bg-surface text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Temas (30)
          </button>
          <button
            onClick={() => setActiveTab('collaborators')}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'collaborators' ? 'bg-surface text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Acessos ({collaborators.length})
          </button>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto md:ml-0">
          <Link
            to={`/app/forms/${form.id}/responses`}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-border bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
          >
            Respostas ({form.responses_count || 0})
          </Link>
          <button
            onClick={() => setPreviewModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: activeTheme.primary }}
          >
            <Eye className="w-3.5 h-3.5" /> Testar
          </button>
        </div>
      </div>

      {/* TAB 1: Questions & Google Forms Visual Canvas */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          
          {/* Header Card (Google Forms Banner Style) */}
          <div
            className="rounded-2xl p-5 sm:p-7 bg-surface shadow-md border-t-8 transition-all glass"
            style={{ borderTopColor: activeTheme.primary }}
          >
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleFormMetaChange({ title: e.target.value })}
              placeholder="Título do formulário"
              className="w-full text-2xl sm:text-3xl font-black bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none py-1 transition-colors"
            />
            <textarea
              rows={2}
              value={form.description || ''}
              onChange={(e) => handleFormMetaChange({ description: e.target.value })}
              placeholder="Descrição do formulário e instruções para preenchimento..."
              className="w-full text-xs sm:text-sm text-muted-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none py-1 mt-2 transition-colors resize-none"
            />
          </div>

          {/* Floating Action Palette to Add Questions */}
          <div className="p-3.5 rounded-2xl bg-surface border border-border shadow-sm flex flex-wrap items-center justify-between gap-3 glass">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-primary" /> Adicionar Elemento:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => handleAddField('text')}
                className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-surface-hover flex items-center gap-1"
                title="Texto Curto"
              >
                <Type className="w-3.5 h-3.5 text-indigo-500" /> Texto Curto
              </button>
              <button
                onClick={() => handleAddField('textarea')}
                className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-surface-hover flex items-center gap-1"
                title="Texto Longo"
              >
                <AlignLeft className="w-3.5 h-3.5 text-blue-500" /> Parágrafo
              </button>
              <button
                onClick={() => handleAddField('integer')}
                className="px-2.5 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 flex items-center gap-1"
                title="Número Inteiro"
              >
                <Hash className="w-3.5 h-3.5" /> Inteiro
              </button>
              <button
                onClick={() => handleAddField('decimal')}
                className="px-2.5 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 flex items-center gap-1"
                title="Número Quebrado"
              >
                <Percent className="w-3.5 h-3.5" /> Quebrado/Decimal
              </button>
              <button
                onClick={() => handleAddField('radio')}
                className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-surface-hover flex items-center gap-1"
              >
                <Radio className="w-3.5 h-3.5 text-rose-500" /> Múltipla Escolha
              </button>
              <button
                onClick={() => handleAddField('checkbox')}
                className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-surface-hover flex items-center gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-500" /> Seleção
              </button>
              <button
                onClick={() => handleAddField('dropdown')}
                className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-surface-hover flex items-center gap-1"
              >
                <List className="w-3.5 h-3.5 text-purple-500" /> Dropdown
              </button>
              <button
                onClick={() => handleAddField('info_text')}
                className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-bold hover:bg-amber-500/20 flex items-center gap-1"
                title="Aviso/Instrução Sem Escrita"
              >
                <Info className="w-3.5 h-3.5" /> Bloco Informativo
              </button>
              <button
                onClick={() => handleAddField('file_upload')}
                className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-surface-hover flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5 text-amber-500" /> Upload
              </button>
              <button
                onClick={() => handleAddField('rating')}
                className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-surface-hover flex items-center gap-1"
              >
                <Star className="w-3.5 h-3.5 text-yellow-500" /> Estrelas
              </button>
              <button
                onClick={() => handleAddField('switch')}
                className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-surface-hover flex items-center gap-1"
              >
                <ToggleLeft className="w-3.5 h-3.5 text-teal-500" /> Switch
              </button>
            </div>
          </div>

          {/* Questions Canvas */}
          <div className="space-y-4">
            {fields.map((field, index) => {
              const isInfoText = field.type === 'info_text';

              return (
                <div
                  key={field.id}
                  className={`rounded-2xl p-5 border transition-all ${
                    isInfoText
                      ? 'bg-amber-50/20 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/50'
                      : 'bg-surface border-border shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-6 h-6 rounded-full bg-muted text-[11px] font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                        placeholder="Título da pergunta..."
                        className="w-full text-sm font-bold bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <select
                        value={field.type}
                        onChange={(e) => handleUpdateField(field.id, { type: e.target.value as FieldType })}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background font-semibold"
                      >
                        <option value="text">Texto Curto</option>
                        <option value="textarea">Texto Longo (Parágrafo)</option>
                        <option value="integer">Número Inteiro (Sem decimais)</option>
                        <option value="decimal">Número Quebrado / Decimal</option>
                        <option value="radio">Múltipla Escolha (Única)</option>
                        <option value="checkbox">Caixas de Seleção</option>
                        <option value="dropdown">Lista Suspensa</option>
                        <option value="info_text">Somente Texto Informativo</option>
                        <option value="file_upload">Upload de Imagem/Arquivo</option>
                        <option value="rating">Avaliação (1-5 Estrelas)</option>
                        <option value="switch">Interruptor Sim / Não</option>
                      </select>

                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleMoveField(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 rounded-md hover:bg-surface-hover disabled:opacity-30"
                          title="Mover para cima"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveField(index, 'down')}
                          disabled={index === fields.length - 1}
                          className="p-1.5 rounded-md hover:bg-surface-hover disabled:opacity-30"
                          title="Mover para baixo"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Field Body & Settings */}
                  <div className="py-4 space-y-3">
                    <input
                      type="text"
                      value={field.description || ''}
                      onChange={(e) => handleUpdateField(field.id, { description: e.target.value })}
                      placeholder={isInfoText ? "Texto descritivo do aviso ou comunicado..." : "Texto de instrução ou apoio ao respondente..."}
                      className="w-full text-xs text-muted-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
                    />

                    {/* Specific Renderings per Type */}
                    {field.type === 'integer' && (
                      <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 flex flex-wrap items-center gap-4 text-xs">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5" /> Validação Número Inteiro:
                        </span>
                        <label className="flex items-center gap-1">
                          Mínimo:
                          <input
                            type="number"
                            value={field.validation?.min ?? 0}
                            onChange={(e) => handleUpdateField(field.id, {
                              validation: { ...field.validation, min: parseInt(e.target.value, 10) }
                            })}
                            className="w-16 px-1.5 py-0.5 rounded border border-border bg-background text-xs"
                          />
                        </label>
                        <label className="flex items-center gap-1">
                          Máximo:
                          <input
                            type="number"
                            value={field.validation?.max ?? 100}
                            onChange={(e) => handleUpdateField(field.id, {
                              validation: { ...field.validation, max: parseInt(e.target.value, 10) }
                            })}
                            className="w-16 px-1.5 py-0.5 rounded border border-border bg-background text-xs"
                          />
                        </label>
                      </div>
                    )}

                    {field.type === 'decimal' && (
                      <div className="p-3 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/50 flex flex-wrap items-center gap-4 text-xs">
                        <span className="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                          <Percent className="w-3.5 h-3.5" /> Validação Número Quebrado/Decimal:
                        </span>
                        <label className="flex items-center gap-1">
                          Mínimo:
                          <input
                            type="number"
                            step="0.01"
                            value={field.validation?.min ?? 0.0}
                            onChange={(e) => handleUpdateField(field.id, {
                              validation: { ...field.validation, min: parseFloat(e.target.value) }
                            })}
                            className="w-16 px-1.5 py-0.5 rounded border border-border bg-background text-xs"
                          />
                        </label>
                        <label className="flex items-center gap-1">
                          Máximo:
                          <input
                            type="number"
                            step="0.01"
                            value={field.validation?.max ?? 1000.0}
                            onChange={(e) => handleUpdateField(field.id, {
                              validation: { ...field.validation, max: parseFloat(e.target.value) }
                            })}
                            className="w-16 px-1.5 py-0.5 rounded border border-border bg-background text-xs"
                          />
                        </label>
                        <label className="flex items-center gap-1">
                          Precisão (Casas):
                          <input
                            type="number"
                            value={field.validation?.precision ?? 2}
                            onChange={(e) => handleUpdateField(field.id, {
                              validation: { ...field.validation, precision: parseInt(e.target.value, 10) }
                            })}
                            className="w-12 px-1.5 py-0.5 rounded border border-border bg-background text-xs"
                          />
                        </label>
                      </div>
                    )}

                    {/* Options Manager for Radio, Checkbox, Dropdown */}
                    {['radio', 'checkbox', 'dropdown'].includes(field.type) && (
                      <div className="space-y-2 pt-2">
                        <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Opções de Escolha:
                        </label>
                        {(field.options || []).map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs">•</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...(field.options || [])];
                                newOpts[optIndex] = e.target.value;
                                handleUpdateField(field.id, { options: newOpts });
                              }}
                              className="text-xs px-2.5 py-1 rounded-lg border border-border bg-background flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = (field.options || []).filter((_, i) => i !== optIndex);
                                handleUpdateField(field.id, { options: newOpts });
                              }}
                              className="text-muted-foreground hover:text-destructive p-1"
                              title="Remover opção"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = [...(field.options || []), `Opção ${(field.options || []).length + 1}`];
                            handleUpdateField(field.id, { options: newOpts });
                          }}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 pt-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adicionar Opção
                        </button>
                      </div>
                    )}

                    {field.type === 'file_upload' && (
                      <div className="p-3 rounded-xl border border-border bg-muted/30 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4 text-primary" />
                          <span>Permite envio de arquivos com prévia instantânea e upload seguro</span>
                        </div>
                        <span className="text-muted-foreground text-[11px]">Máx: 10MB</span>
                      </div>
                    )}

                    {isInfoText && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>Este bloco aparecerá destacado visualmente na tela de resposta sem exigir preenchimento.</span>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Required Toggle, Duplicate, Delete */}
                  <div className="pt-3 border-t border-border/80 flex items-center justify-between text-xs">
                    <div>
                      {!isInfoText && (
                        <label className="flex items-center gap-2 cursor-pointer font-semibold">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                            className="rounded text-primary focus:ring-primary"
                          />
                          <span>Resposta Obrigatória</span>
                        </label>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDuplicateField(field)}
                        className="p-1.5 rounded-lg border border-border hover:bg-surface-hover text-muted-foreground"
                        title="Duplicar pergunta"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteField(field.id)}
                        className="p-1.5 rounded-lg border border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        title="Excluir pergunta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Settings */}
      {activeTab === 'settings' && (
        <div className="rounded-3xl p-6 bg-surface border border-border shadow-md glass space-y-6">
          <div>
            <h2 className="text-base font-bold text-foreground">Configurações Gerais do Formulário</h2>
            <p className="text-xs text-muted-foreground">Controle de respostas, limites, segurança e mensagens.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background">
              <div>
                <p className="font-bold text-foreground">Disponibilização Pública</p>
                <p className="text-muted-foreground">Permite que respondentes acessem via link sem login prévio</p>
              </div>
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => handleFormMetaChange({ is_public: e.target.checked })}
                className="w-4 h-4 rounded text-primary"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background">
              <div>
                <p className="font-bold text-foreground">Limitar a 1 Resposta por Usuário</p>
                <p className="text-muted-foreground">Evita duplicidade por endereço de e-mail</p>
              </div>
              <input
                type="checkbox"
                checked={form.limit_one_response}
                onChange={(e) => handleFormMetaChange({ limit_one_response: e.target.checked })}
                className="w-4 h-4 rounded text-primary"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background">
              <div>
                <p className="font-bold text-foreground">Exibir Barra de Progresso</p>
                <p className="text-muted-foreground">Mostra porcentagem concluída ao respondente</p>
              </div>
              <input
                type="checkbox"
                checked={form.show_progress_bar}
                onChange={(e) => handleFormMetaChange({ show_progress_bar: e.target.checked })}
                className="w-4 h-4 rounded text-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground block">Mensagem de Confirmação de Envio</label>
              <textarea
                rows={2}
                value={form.confirmation_message || ''}
                onChange={(e) => handleFormMetaChange({ confirmation_message: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground block">URL de Redirecionamento Pós-Envio (Opcional)</label>
              <input
                type="url"
                placeholder="https://suaempresa.com.br/obrigado"
                value={form.redirect_url || ''}
                onChange={(e) => handleFormMetaChange({ redirect_url: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 30 Visual Themes */}
      {activeTab === 'themes' && (
        <div className="rounded-3xl p-6 bg-surface border border-border shadow-md glass space-y-6">
          <div>
            <h2 className="text-base font-bold text-foreground">Galeria de 30 Temas Visuais</h2>
            <p className="text-xs text-muted-foreground">
              Selecione o tema de alta identidade visual que será aplicado a este formulário e aos seus respondentes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {THEMES_LIST.map((theme) => {
              const isSelected = form.theme_id === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleFormMetaChange({ theme_id: theme.id })}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-2 border-primary shadow-lg ring-2 ring-primary/20 bg-surface'
                      : 'border-border hover:border-primary/50 bg-surface/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-bold text-xs truncate">{theme.name}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-muted text-muted-foreground">
                      {theme.category}
                    </span>
                  </div>

                  {/* Theme Palette Swatch Preview */}
                  <div className="h-10 rounded-xl overflow-hidden flex border border-black/10 shadow-inner">
                    <div className="flex-1" style={{ backgroundColor: theme.primary }} />
                    <div className="flex-1" style={{ backgroundColor: theme.accent }} />
                    <div className="flex-1" style={{ backgroundColor: theme.primaryDark }} />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-mono">{theme.primary}</span>
                    {isSelected && (
                      <span className="font-bold text-primary flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Collaborators & Permissions */}
      {activeTab === 'collaborators' && (
        <div className="rounded-3xl p-6 bg-surface border border-border shadow-md glass space-y-6">
          <div>
            <h2 className="text-base font-bold text-foreground">Gestão de Colaboradores & Acessos</h2>
            <p className="text-xs text-muted-foreground">
              O proprietário do formulário pode conceder permissões de <strong>Editor</strong> (para editar perguntas) ou <strong>Visualizador</strong> (apenas leitura de respostas) por e-mail.
            </p>
          </div>

          <form onSubmit={handleInviteCollaborator} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="email"
              required
              placeholder="Digite o e-mail do colaborador corporativo..."
              value={collabEmail}
              onChange={(e) => setCollabEmail(e.target.value)}
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <select
              value={collabRole}
              onChange={(e) => setCollabRole(e.target.value as any)}
              className="text-xs px-3 py-2 rounded-xl border border-border bg-background font-semibold"
            >
              <option value="editor">Editor (Pode editar perguntas)</option>
              <option value="viewer">Visualizador (Apenas vê respostas)</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shrink-0 disabled:opacity-50"
            >
              {inviting ? 'Concedendo...' : 'Conceder Acesso'}
            </button>
          </form>

          <div className="border border-border rounded-2xl overflow-hidden bg-background">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">E-mail do Usuário</th>
                  <th className="py-2.5 px-4">Papel Concedido</th>
                  <th className="py-2.5 px-4">Data do Convite</th>
                  <th className="py-2.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {collaborators.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      Nenhum colaborador adicionado ainda. Apenas você tem acesso.
                    </td>
                  </tr>
                ) : (
                  collaborators.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-hover/50">
                      <td className="py-3 px-4 font-semibold">{c.user_email}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.role === 'editor' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-muted text-muted-foreground'
                        }`}>
                          {c.role === 'editor' ? 'Editor de Perguntas' : 'Visualizador'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRemoveCollaborator(c.id)}
                          className="text-xs text-destructive hover:underline font-semibold"
                        >
                          Revogar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Modal: Desktop & Mobile Emulator */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-4xl max-h-[90vh] bg-surface rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                    previewDevice === 'desktop' ? 'bg-primary text-white' : 'hover:bg-surface-hover text-muted-foreground'
                  }`}
                >
                  <Monitor className="w-4 h-4" /> Desktop
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                    previewDevice === 'mobile' ? 'bg-primary text-white' : 'hover:bg-surface-hover text-muted-foreground'
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> Mobile
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/f/${form.share_code}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold hover:bg-surface-hover flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir Página Pública
                </Link>
                <button onClick={() => setPreviewModalOpen(false)} className="p-2 rounded-lg hover:bg-surface-hover">
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900 flex justify-center">
              <div className={`w-full transition-all duration-300 ${previewDevice === 'mobile' ? 'max-w-sm border-8 border-slate-800 rounded-[2.5rem] shadow-2xl p-4 bg-surface' : 'max-w-2xl'}`}>
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-surface border-t-8 shadow-sm" style={{ borderTopColor: activeTheme.primary }}>
                    <h2 className="text-xl font-bold">{form.title}</h2>
                    <p className="text-xs text-muted-foreground mt-1">{form.description}</p>
                  </div>

                  {fields.map((f, i) => (
                    <div key={f.id} className="p-4 rounded-xl bg-surface border border-border shadow-sm space-y-2">
                      <p className="text-xs font-bold">
                        {i + 1}. {f.label} {f.required && <span className="text-destructive">*</span>}
                      </p>
                      {f.description && <p className="text-[11px] text-muted-foreground">{f.description}</p>}

                      {f.type === 'text' && <input type="text" placeholder="Sua resposta" className="w-full text-xs p-2 rounded-lg border border-border bg-background" disabled />}
                      {f.type === 'textarea' && <textarea placeholder="Sua resposta longa" className="w-full text-xs p-2 rounded-lg border border-border bg-background" disabled rows={2} />}
                      {f.type === 'integer' && <input type="number" placeholder="Ex: 42 (apenas inteiros)" className="w-full text-xs p-2 rounded-lg border border-border bg-background" disabled />}
                      {f.type === 'decimal' && <input type="number" step="0.01" placeholder="Ex: 3.14 (aceita decimais)" className="w-full text-xs p-2 rounded-lg border border-border bg-background" disabled />}
                      {['radio', 'checkbox'].includes(f.type) && (
                        <div className="space-y-1">
                          {(f.options || []).map((o, idx) => (
                            <label key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <input type={f.type === 'radio' ? 'radio' : 'checkbox'} disabled />
                              <span>{o}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {f.type === 'info_text' && (
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
                          {f.description || f.label}
                        </div>
                      )}
                      {f.type === 'file_upload' && (
                        <div className="p-3 border-2 border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">
                          Clique ou arraste para simular upload
                        </div>
                      )}
                      {f.type === 'rating' && (
                        <div className="flex gap-1 text-yellow-400">
                          {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-5 h-5 fill-current" />)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
