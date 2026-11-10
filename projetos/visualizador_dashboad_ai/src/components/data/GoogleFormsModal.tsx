import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Sliders,
  Sparkles,
  BarChart2,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  Info,
  Check,
  ChevronRight,
  Edit2,
} from 'lucide-react';
import { GoogleApiService } from '../../services/google/api';
import type { Survey, SurveyQuestion, QuestionMapping, QuestionType, AnalysisMode, VisualizationType } from '../../types/survey';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface GoogleFormsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSurveyLoaded: (survey: Survey) => void;
}

export function GoogleFormsModal({
  isOpen,
  onClose,
  onSurveyLoaded,
}: GoogleFormsModalProps) {
  const [urlInput, setUrlInput] = useState('');
  const [formId, setFormId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ configured: boolean; clientEmail?: string } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  
  // Fetching state
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Review state
  const [surveyPreview, setSurveyPreview] = useState<Survey | null>(null);
  const [editableMappings, setEditableMappings] = useState<Record<string, QuestionMapping>>({});
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [decimalPlaces, setDecimalPlaces] = useState<number>(2);

  // Check backend Google API configuration on modal open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSurveyPreview(null);
      setIsLoadingStatus(true);
      GoogleApiService.checkStatus()
        .then((res) => {
          setStatus({ configured: res.configured, clientEmail: res.clientEmail });
        })
        .catch(() => {
          setStatus({ configured: false });
        })
        .finally(() => {
          setIsLoadingStatus(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrlInput(val);
    setError(null);

    // Live validation
    if (val.trim().length > 10) {
      const match = val.match(/\/forms\/d\/(?:e\/)?([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) {
        setFormId(match[1]);
      } else if (/^[a-zA-Z0-9_-]{15,}$/.test(val.trim())) {
        setFormId(val.trim());
      } else {
        setFormId(null);
      }
    } else {
      setFormId(null);
    }
  };

  const handleFetchForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) {
      setError('Por favor, informe a URL ou o ID do Google Forms.');
      return;
    }

    setIsFetching(true);
    setError(null);

    try {
      // 1. Parse URL via API or local regex
      const parseResult = await GoogleApiService.parseFormUrl(urlInput.trim());
      const targetId = parseResult.formId || formId;

      if (!targetId) {
        throw new Error(
          parseResult.error ||
            'Formato de link inválido. Use a URL completa de edição ou o ID do formulário.'
        );
      }

      // 2. Fetch Form Structure & Responses
      const survey = await GoogleApiService.getGoogleFormData(targetId);

      setSurveyPreview(survey);
      setEditableMappings({ ...survey.mappings });
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados do Google Forms.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleConfirmSurvey = () => {
    if (!surveyPreview) return;

    // Apply any mapping changes and configured decimal precision
    const finalSurvey: Survey = {
      ...surveyPreview,
      decimalPlaces,
      mappings: { ...editableMappings },
      analyzedAt: new Date().toISOString(),
    };

    onSurveyLoaded(finalSurvey);
    onClose();
  };

  const handleUpdateMapping = (
    qId: string,
    updates: Partial<QuestionMapping>
  ) => {
    setEditableMappings((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        ...updates,
        source: 'user',
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {surveyPreview ? 'Revisão do Formulário' : 'Importar do Google Forms'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {surveyPreview
                  ? 'Verifique o mapeamento das perguntas antes de gerar a análise.'
                  : 'Insira o link ou ID do formulário para carregar estrutura e respostas via API.'}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Step 1: Input URL and credentials verification */}
          {!surveyPreview ? (
            <div className="space-y-5">
              {/* Service Account info card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Status da Conexão Google
                  </span>
                  {isLoadingStatus ? (
                    <Badge variant="secondary" size="sm" className="gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Verificando...
                    </Badge>
                  ) : status?.configured ? (
                    <Badge variant="success" size="sm">
                      Credenciais Ativas
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      Configuração Necessária
                    </Badge>
                  )}
                </div>

                {status?.clientEmail && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    E-mail da Service Account:{' '}
                    <code className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px]">
                      {status.clientEmail}
                    </code>
                  </p>
                )}

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  <strong>Dica de Acesso:</strong> Se o seu formulário for restrito, compartilhe o acesso de visualização/leitura com o e-mail da Service Account acima.
                </p>
              </div>

              {/* Form Input */}
              <form onSubmit={handleFetchForm} className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Link ou ID do Google Forms
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={handleUrlChange}
                    placeholder="https://docs.google.com/forms/d/1FAIpQLSc.../edit"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono"
                    disabled={isFetching}
                    autoFocus
                  />
                  {formId && (
                    <span className="absolute right-3 top-2.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> ID detectado
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  Exemplos suportados: link de edição <code>/forms/d/.../edit</code>, link de visualização <code>/viewform</code> ou o ID alfanumérico direto.
                </p>

                {error && (
                  <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Erro ao carregar</p>
                      <p className="text-[11px] mt-0.5 leading-relaxed">{error}</p>
                    </div>
                  </div>
                )}

                <div className="pt-3">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!urlInput.trim() || isFetching}
                    className="w-full justify-center bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isFetching ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Obtendo Metadados e Respostas...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Carregar Formulário
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            /* Step 2: Review Screen (Requirement 16) */
            <div className="space-y-4">
              {/* Form Metadata Banner */}
              <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {surveyPreview.name}
                  </h3>
                  {surveyPreview.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {surveyPreview.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" size="sm">
                      {surveyPreview.questions.length} perguntas
                    </Badge>
                    <Badge variant="success" size="sm">
                      {surveyPreview.responses.length} respostas obtidas
                    </Badge>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSurveyPreview(null)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Alterar Link
                </Button>
              </div>

              {/* Questions Review Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Mapeamento das Perguntas (Metadados Confiáveis)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Clique em uma pergunta para personalizar
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs max-h-72 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold w-10 text-center">#</th>
                        <th className="py-2.5 px-3 font-semibold">Pergunta</th>
                        <th className="py-2.5 px-3 font-semibold">Tipo</th>
                        <th className="py-2.5 px-3 font-semibold">Análise</th>
                        <th className="py-2.5 px-3 font-semibold">Visualização</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Ajustar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {surveyPreview.questions.map((q) => {
                        const m = editableMappings[q.id] || surveyPreview.mappings[q.id];
                        const isEditing = editingQuestionId === q.id;

                        return (
                          <React.Fragment key={q.id}>
                            <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                              <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-semibold">
                                Q{q.order}
                              </td>
                              <td className="py-2.5 px-3 max-w-[200px]">
                                <p className="font-medium text-slate-900 dark:text-slate-100 truncate" title={q.title}>
                                  {q.title}
                                </p>
                                {q.options && (
                                  <span className="text-[10px] text-slate-400 block">
                                    {q.options.length} opções (ordem preservada)
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <Badge variant="secondary" size="sm">
                                  {q.type}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-3">
                                {m.analysisMode === 'qualitative' ? (
                                  <Badge variant="purple" size="sm">
                                    qualitativa
                                  </Badge>
                                ) : (
                                  <Badge variant="info" size="sm">
                                    quantitativa
                                  </Badge>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                {m.visualization}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() =>
                                    setEditingQuestionId(isEditing ? null : q.id)
                                  }
                                  className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer"
                                  title="Editar mapeamento"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>

                            {/* Inline Edit Row */}
                            {isEditing && (
                              <tr className="bg-purple-50/30 dark:bg-purple-950/20">
                                <td colSpan={6} className="p-3 border-t border-purple-100 dark:border-purple-900/40">
                                  <div className="flex items-center gap-4 flex-wrap text-xs">
                                    <div>
                                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                                        Modo de Análise
                                      </label>
                                      <select
                                        value={m.analysisMode}
                                        onChange={(e) =>
                                          handleUpdateMapping(q.id, {
                                            analysisMode: e.target.value as AnalysisMode,
                                          })
                                        }
                                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                                      >
                                        <option value="quantitative">Quantitativa (Estatística)</option>
                                        <option value="qualitative">Qualitativa (IA Semântica)</option>
                                        <option value="ignore">Ignorar na análise</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                                        Visualização Gráfica
                                      </label>
                                      <select
                                        value={m.visualization}
                                        onChange={(e) =>
                                          handleUpdateMapping(q.id, {
                                            visualization: e.target.value as VisualizationType,
                                          })
                                        }
                                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                                      >
                                        <option value="bar">Gráfico de Barras</option>
                                        <option value="horizontal_bar">Barras Horizontais</option>
                                        <option value="distribution">Distribuição de Escala</option>
                                        <option value="pie">Pizza</option>
                                        <option value="donut">Rosca</option>
                                        <option value="table">Tabela</option>
                                        <option value="none">Nenhuma (Texto puro)</option>
                                      </select>
                                    </div>

                                    <div className="ml-auto pt-3">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingQuestionId(null)}
                                        className="text-xs h-7 px-2"
                                      >
                                        Concluir
                                      </Button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Cancelar
            </Button>

            {surveyPreview && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-[11px]">Decimais:</span>
                <div className="inline-flex rounded bg-white dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-700">
                  {[0, 1, 2].map((dec) => (
                    <button
                      key={dec}
                      type="button"
                      onClick={() => setDecimalPlaces(dec)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        decimalPlaces === dec
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-purple-600'
                      }`}
                    >
                      {dec}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {surveyPreview && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmSurvey}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
            >
              <span>Executar Análise</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
