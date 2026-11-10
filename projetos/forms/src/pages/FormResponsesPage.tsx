import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Trash2,
  ArrowLeft,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink,
  Table as TableIcon,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { api } from '../lib/api';
import { Form, FormResponse, FormField } from '../types';
import { toast } from 'sonner';

export const FormResponsesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [syncingGoogle, setSyncingGoogle] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [formData, respData] = await Promise.all([
        api.getFormById(id!),
        api.getResponses(id!),
      ]);
      setForm(formData);
      setFields(formData.fields || []);
      setResponses(respData);
    } catch (err: any) {
      toast.error('Erro ao carregar respostas do formulário.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResponse = async (respId: string) => {
    if (!form) return;
    if (!window.confirm('Tem certeza que deseja excluir esta resposta?')) return;
    try {
      await api.deleteResponse(form.id, respId);
      setResponses(responses.filter(r => r.id !== respId));
      toast.success('Resposta excluída com sucesso.');
    } catch (err: any) {
      toast.error('Erro ao excluir resposta.');
    }
  };

  const handleExportCSV = () => {
    if (!form) return;
    window.open(`/api/forms/${form.id}/responses/export/csv`, '_blank');
  };

  const handleSyncGoogleSheets = async () => {
    if (!form) return;
    setSyncingGoogle(true);
    try {
      const res = await api.syncFormSheet(form.id);
      if (res.newImported > 0) {
        toast.success(`Sincronização concluída! ${res.newImported} nova(s) resposta(s) importada(s).`);
      } else {
        toast.info(res.message || 'Sincronização concluída! A planilha já está 100% atualizada.');
      }
      await loadData();
    } catch (err: any) {
      toast.error('Erro na sincronização com Google Sheets.');
    } finally {
      setSyncingGoogle(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground">Carregando respostas...</p>
      </div>
    );
  }

  // Answer map helper: response.answers is an array of { field_id, value_text, value_number, value_json, label }
  const getAnswerDisplay = (resp: FormResponse, fieldId: string) => {
    if (!resp.answers) return '-';
    const ans = resp.answers.find(a => a.field_id === fieldId);
    if (!ans) return '-';
    if (ans.value_number !== null && ans.value_number !== undefined) return String(ans.value_number);
    if (ans.value_json) {
      if (Array.isArray(ans.value_json)) return ans.value_json.join(', ');
      if (typeof ans.value_json === 'object' && ans.value_json.name) return `Arquivo: ${ans.value_json.name}`;
      return JSON.stringify(ans.value_json);
    }
    return ans.value_text || '-';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/app/forms/${form.id}`}
            className="p-2 rounded-xl hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
            title="Voltar ao construtor"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Respostas: {form.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              Total de <strong>{responses.length}</strong> envios registrados até o momento.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncGoogleSheets}
            disabled={syncingGoogle}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 shadow-sm flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {syncingGoogle ? 'Sincronizando...' : 'Sincronizar Google Sheets'}
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-border bg-surface hover:bg-surface-hover shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-primary" />
            Exportar Planilha CSV
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-border hover:bg-surface-hover text-muted-foreground"
            title="Atualizar respostas"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Responses Table Card */}
      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden glass">
        {responses.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <h3 className="text-base font-bold text-foreground">Ainda não há respostas</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Compartilhe o link público do formulário para começar a coletar dados dos respondentes.
            </p>
            <Link
              to={`/f/${form.share_code}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary mt-2"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Abrir Formulário Público
            </Link>
          </div>
        ) : (
          <div className="responsive-table-shell overflow-x-auto max-h-[70vh]">
            <table className="w-full text-left text-xs responsive-mobile-cards">
              <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm border-b border-border font-bold uppercase text-[10px] text-muted-foreground tracking-wider z-10">
                <tr>
                  <th className="py-3 px-4">Data Envio</th>
                  <th className="py-3 px-4">E-mail Participante</th>
                  {fields.filter(f => f.type !== 'info_text').map(f => (
                    <th key={f.id} className="py-3 px-4 min-w-[150px] max-w-[250px] truncate" title={f.label}>
                      {f.label}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {responses.map((resp) => (
                  <tr key={resp.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td data-mobile-label="Data" className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                      {new Date(resp.submitted_at).toLocaleString('pt-BR')}
                    </td>
                    <td data-mobile-label="Participante" className="py-3 px-4 font-semibold text-foreground">
                      {resp.respondent_email || 'Anônimo'}
                    </td>
                    {fields.filter(f => f.type !== 'info_text').map(f => (
                      <td key={f.id} data-mobile-label={f.label} className="py-3 px-4 max-w-[250px] truncate">
                        {getAnswerDisplay(resp, f.id)}
                      </td>
                    ))}
                    <td className="mobile-table-actions py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteResponse(resp.id)}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Excluir resposta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
