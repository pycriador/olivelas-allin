import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  AlertCircle,
  Upload,
  Star,
  FileText,
  Lock,
  ArrowRight,
  Sparkles,
  Info,
  Layers,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { api } from '../lib/api';
import { Form, FormField } from '../types';
import { getThemeById } from '../utils/themes';
import { useI18n } from '../i18n';
import { toast, Toaster } from 'sonner';

export const PublicFormPage: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const { locale, setLocale, t } = useI18n();

  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form values state: field_id -> value
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [respondentEmail, setRespondentEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  useEffect(() => {
    if (shareCode) loadPublicForm();
  }, [shareCode]);

  const loadPublicForm = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPublicForm(shareCode!);
      setForm(data);
      setFields(data.fields || []);
    } catch (err: any) {
      setError(err.message || 'Formulário indisponível ou não encontrado.');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (fieldId: string, val: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: val }));
    // Clear error for field if fixed
    if (fieldErrors[fieldId]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleFileUpload = (fieldId: string, file: File) => {
    // Generate data URL preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      handleValueChange(fieldId, {
        name: file.name,
        sizeMB: (file.size / (1024 * 1024)).toFixed(2),
        type: file.type,
        preview: dataUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    for (const f of fields) {
      if (f.type === 'info_text') continue;

      const val = answers[f.id];

      // Required check
      if (f.required && (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0))) {
        errors[f.id] = t('responder.required_warning');
        continue;
      }

      // Integer check
      if (f.type === 'integer' && val !== undefined && val !== null && val !== '') {
        const num = Number(val);
        if (!Number.isInteger(num)) {
          errors[f.id] = t('responder.integer_warning');
          continue;
        }
        if (f.validation?.min !== undefined && num < f.validation.min) {
          errors[f.id] = `Valor mínimo permitido é ${f.validation.min}.`;
          continue;
        }
        if (f.validation?.max !== undefined && num > f.validation.max) {
          errors[f.id] = `Valor máximo permitido é ${f.validation.max}.`;
          continue;
        }
      }

      // Decimal check
      if (f.type === 'decimal' && val !== undefined && val !== null && val !== '') {
        const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
        if (isNaN(num)) {
          errors[f.id] = t('responder.decimal_warning');
          continue;
        }
        if (f.validation?.min !== undefined && num < f.validation.min) {
          errors[f.id] = `Valor mínimo permitido é ${f.validation.min}.`;
          continue;
        }
        if (f.validation?.max !== undefined && num > f.validation.max) {
          errors[f.id] = `Valor máximo permitido é ${f.validation.max}.`;
          continue;
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Por favor, corrija os campos destacados.');
      return;
    }

    if (!form) return;

    setSubmitting(true);
    try {
      const res = await api.submitResponse(form.id, {
        respondent_email: respondentEmail.trim() || undefined,
        answers,
      });

      setConfirmationMessage(res.message || form.confirmation_message || 'Sua resposta foi registrada com sucesso!');
      setSubmitted(true);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (_) {}

      if (res.redirect_url) {
        setTimeout(() => {
          window.location.href = res.redirect_url;
        }, 3000);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar resposta.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-muted-foreground">Carregando formulário...</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface p-8 rounded-3xl shadow-xl border border-border text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Formulário Indisponível</h2>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Link to="/" className="inline-block text-xs font-bold text-primary hover:underline pt-2">
            Voltar para o início
          </Link>
        </div>
      </div>
    );
  }

  const theme = getThemeById(form.theme_id);

  // Compute completion progress
  const fillableFields = fields.filter(f => f.type !== 'info_text');
  const answeredCount = fillableFields.filter(f => answers[f.id] !== undefined && answers[f.id] !== null && answers[f.id] !== '').length;
  const progressPercent = fillableFields.length > 0 ? Math.round((answeredCount / fillableFields.length) * 100) : 0;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-primary/20`}>
      <Toaster position="top-right" richColors />

      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Top Mini-Nav: Brand + Language Switcher */}
        <div className="flex items-center justify-between px-2 text-xs">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: theme.primary }}>
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-foreground group-hover:underline">
              Olivelas Forms
            </span>
          </Link>

          {/* 3 Languages Switcher */}
          <div className="flex items-center gap-1 bg-surface/80 rounded-lg p-1 border border-border shadow-sm">
            <Globe className="w-3.5 h-3.5 text-muted-foreground ml-1" />
            {(['pt-BR', 'en', 'es'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                  locale === l ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {l.split('-')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Success Confirmation Card */}
        {submitted ? (
          <div className="rounded-3xl p-8 sm:p-10 bg-surface border border-border shadow-2xl text-center space-y-5 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h1 className="text-2xl font-black text-foreground">
              {t('responder.success_title')}
            </h1>

            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {confirmationMessage}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold border border-border hover:bg-surface-hover"
              >
                {t('responder.submit_another')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Header Banner Card (Google Forms Signature Style) */}
            <div
              className="rounded-3xl p-6 sm:p-8 bg-surface shadow-md border-t-8 transition-all glass"
              style={{ borderTopColor: theme.primary }}
            >
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {form.title}
              </h1>
              {form.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                  {form.description}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="text-destructive font-semibold">* Perguntas com asterisco são obrigatórias</span>
                {form.show_progress_bar && (
                  <span className="font-bold">{progressPercent}% concluído</span>
                )}
              </div>

              {/* Progress bar */}
              {form.show_progress_bar && (
                <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${progressPercent}%`, backgroundColor: theme.primary }}
                  />
                </div>
              )}
            </div>

            {/* Respondent Email Identification */}
            <div className="rounded-2xl p-5 bg-surface border border-border shadow-sm space-y-2 glass">
              <label className="block text-xs font-bold text-foreground">
                Endereço de E-mail do Participante
              </label>
              <input
                type="email"
                placeholder="seu.email@empresa.com"
                value={respondentEmail}
                onChange={(e) => setRespondentEmail(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Questions List */}
            {fields.map((field, index) => {
              const isInfo = field.type === 'info_text';
              const errorMsg = fieldErrors[field.id];
              const val = answers[field.id];

              if (isInfo) {
                return (
                  <div
                    key={field.id}
                    className="rounded-2xl p-5 border border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 shadow-sm space-y-1.5 glass"
                  >
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>{field.label}</span>
                    </div>
                    {field.description && (
                      <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                        {field.description}
                      </p>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={field.id}
                  className={`rounded-2xl p-6 bg-surface border shadow-sm transition-all glass space-y-3 ${
                    errorMsg ? 'border-destructive ring-1 ring-destructive' : 'border-border'
                  }`}
                >
                  <div>
                    <label className="block text-sm font-bold text-foreground">
                      {index + 1}. {field.label} {field.required && <span className="text-destructive">*</span>}
                    </label>
                    {field.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>
                    )}
                  </div>

                  {/* Render Controls by Field Type */}
                  <div className="pt-1">
                    {field.type === 'text' && (
                      <input
                        type="text"
                        placeholder={field.placeholder || "Sua resposta curta..."}
                        value={val || ''}
                        onChange={(e) => handleValueChange(field.id, e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        rows={3}
                        placeholder={field.placeholder || "Sua resposta detalhada..."}
                        value={val || ''}
                        onChange={(e) => handleValueChange(field.id, e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    )}

                    {field.type === 'integer' && (
                      <div className="space-y-1">
                        <input
                          type="number"
                          step="1"
                          placeholder={field.placeholder || "Digite um número inteiro (ex: 10, 42)"}
                          value={val !== undefined ? val : ''}
                          onChange={(e) => handleValueChange(field.id, e.target.value ? parseInt(e.target.value, 10) : '')}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                        />
                        <span className="text-[10px] text-muted-foreground">
                          Aceita somente números inteiros. (Mín: {field.validation?.min ?? 0}, Máx: {field.validation?.max ?? 'Livre'})
                        </span>
                      </div>
                    )}

                    {field.type === 'decimal' && (
                      <div className="space-y-1">
                        <input
                          type="number"
                          step={field.validation?.step || 0.01}
                          placeholder={field.placeholder || "Digite um número decimal / quebrado (ex: 3.14)"}
                          value={val !== undefined ? val : ''}
                          onChange={(e) => handleValueChange(field.id, e.target.value ? parseFloat(e.target.value) : '')}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                        />
                        <span className="text-[10px] text-muted-foreground">
                          Aceita números quebrados e decimais com precisão.
                        </span>
                      </div>
                    )}

                    {field.type === 'radio' && (
                      <div className="space-y-2">
                        {(field.options || []).map((opt, optIndex) => (
                          <label
                            key={optIndex}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                              val === opt ? 'border-primary bg-primary/5 font-semibold' : 'border-border hover:bg-surface-hover'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`field_${field.id}`}
                              value={opt}
                              checked={val === opt}
                              onChange={() => handleValueChange(field.id, opt)}
                              className="text-primary focus:ring-primary"
                            />
                            <span className="text-xs text-foreground">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {field.type === 'checkbox' && (
                      <div className="space-y-2">
                        {(field.options || []).map((opt, optIndex) => {
                          const currentArr: string[] = Array.isArray(val) ? val : [];
                          const checked = currentArr.includes(opt);
                          return (
                            <label
                              key={optIndex}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                checked ? 'border-primary bg-primary/5 font-semibold' : 'border-border hover:bg-surface-hover'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handleValueChange(field.id, [...currentArr, opt]);
                                  } else {
                                    handleValueChange(field.id, currentArr.filter(item => item !== opt));
                                  }
                                }}
                                className="rounded text-primary focus:ring-primary"
                              />
                              <span className="text-xs text-foreground">{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {field.type === 'dropdown' && (
                      <select
                        value={val || ''}
                        onChange={(e) => handleValueChange(field.id, e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="">Selecione uma opção...</option>
                        {(field.options || []).map((opt, optIndex) => (
                          <option key={optIndex} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {field.type === 'rating' && (
                      <div className="flex items-center gap-2 pt-1">
                        {[1, 2, 3, 4, 5].map((starNum) => {
                          const isFilled = (val || 0) >= starNum;
                          return (
                            <button
                              key={starNum}
                              type="button"
                              onClick={() => handleValueChange(field.id, starNum)}
                              className="p-1 hover:scale-125 transition-transform"
                            >
                              <Star
                                className={`w-7 h-7 ${
                                  isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-700'
                                }`}
                              />
                            </button>
                          );
                        })}
                        <span className="text-xs font-bold text-muted-foreground ml-2">
                          {val ? `${val} / 5 Estrelas` : 'Não avaliado'}
                        </span>
                      </div>
                    )}

                    {field.type === 'switch' && (
                      <label className="flex items-center gap-3 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={!!val}
                          onChange={(e) => handleValueChange(field.id, e.target.checked)}
                          className="w-5 h-5 rounded text-primary focus:ring-primary"
                        />
                        <span className="text-xs font-semibold">
                          {val ? 'Sim (Ativado)' : 'Não (Desativado)'}
                        </span>
                      </label>
                    )}

                    {field.type === 'file_upload' && (
                      <div className="space-y-2">
                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border hover:border-primary rounded-2xl cursor-pointer bg-background hover:bg-surface-hover/50 transition-colors">
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-xs font-bold text-foreground">Clique para selecionar imagem ou arquivo</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, WEBP, PDF (Máx. 10MB)</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(field.id, e.target.files[0]);
                              }
                            }}
                          />
                        </label>

                        {val && typeof val === 'object' && val.name && (
                          <div className="p-3 rounded-xl border border-border bg-muted/40 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 truncate">
                              {val.preview && (
                                <img src={val.preview} alt="Prévia" className="w-8 h-8 object-cover rounded-md" />
                              )}
                              <span className="font-semibold truncate">{val.name}</span>
                              <span className="text-[10px] text-muted-foreground">({val.sizeMB} MB)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleValueChange(field.id, null)}
                              className="text-xs text-destructive hover:underline ml-2"
                            >
                              Remover
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Field Error Message */}
                  {errorMsg && (
                    <div className="flex items-center gap-1.5 text-xs text-destructive font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom Form Actions */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setAnswers({})}
                className="text-xs text-muted-foreground hover:text-foreground underline font-semibold"
              >
                {t('responder.clear')}
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 rounded-xl font-bold text-white shadow-xl flex items-center gap-2 text-sm transition-transform hover:scale-105 disabled:opacity-50"
                style={{ backgroundColor: theme.primary }}
              >
                {submitting ? t('responder.submitting') : t('responder.submit')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
