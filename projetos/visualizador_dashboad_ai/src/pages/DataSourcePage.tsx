import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  Database,
  RefreshCw,
  Plus,
  Layers,
  Calendar,
  Hash,
  FileType,
  ExternalLink,
} from 'lucide-react';
import { DataSource } from '../types/survey';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface DataSourcePageProps {
  dataSource?: DataSource;
  onOpenSourceModal: () => void;
}

export function DataSourcePage({
  dataSource,
  onOpenSourceModal,
}: DataSourcePageProps) {
  const getSourceIcon = (type?: string) => {
    switch (type) {
      case 'google_forms':
        return (
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
            <FileText className="w-6 h-6" />
          </div>
        );
      case 'google_sheets':
      case 'xlsx':
      case 'csv':
        return (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        );
      default:
        return (
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <Database className="w-6 h-6" />
          </div>
        );
    }
  };

  const getSourceBadge = (type?: string) => {
    switch (type) {
      case 'google_forms':
        return <Badge variant="purple" size="sm">Google Forms API</Badge>;
      case 'google_sheets':
        return <Badge variant="success" size="sm">Google Sheets</Badge>;
      case 'xlsx':
        return <Badge variant="info" size="sm">Arquivo XLSX</Badge>;
      case 'csv':
        return <Badge variant="info" size="sm">Arquivo CSV</Badge>;
      default:
        return <Badge variant="secondary" size="sm">Mock Demonstrativo</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Fonte de Dados (DataSource)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Gerenciamento e metadados da origem da pesquisa ativa no sistema.
        </p>
      </div>

      {dataSource ? (
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {getSourceIcon(dataSource.type)}
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {dataSource.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {getSourceBadge(dataSource.type)}
                  <span className="text-xs text-slate-400">
                    Tipo técnico: <code>{dataSource.type}</code>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {dataSource.url && (
                <a
                  href={dataSource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir no Google
                </a>
              )}
              <Button variant="primary" size="sm" onClick={onOpenSourceModal} className="text-xs">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Trocar Fonte
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-5 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                <Hash className="w-3.5 h-3.5 text-slate-400" /> ID da Origem
              </span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200 truncate block" title={dataSource.id}>
                {dataSource.id}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> Total de Respostas
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {dataSource.rowCount ?? 0} respostas obtidas
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                <FileType className="w-3.5 h-3.5 text-slate-400" /> MimeType
              </span>
              <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate block" title={dataSource.mimeType}>
                {dataSource.mimeType || 'application/vnd.google-apps.form'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Sincronização
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {dataSource.lastModified ? new Date(dataSource.lastModified).toLocaleDateString('pt-BR') : 'Hoje'}
              </span>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center space-y-3">
          <Database className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Nenhuma fonte de dados conectada
          </p>
          <Button variant="primary" size="sm" onClick={onOpenSourceModal}>
            Conectar Fonte
          </Button>
        </Card>
      )}

      {/* Extensibility specifications */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm space-y-3 text-xs">
        <h4 className="font-bold text-slate-900 dark:text-slate-100">
          Fontes de Ingestão Suportadas:
        </h4>
        <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside leading-relaxed">
          <li><strong>Google Forms API:</strong> Obtenção direta da árvore de perguntas, validação de obrigatoriedade, opções originais e respostas individuais indexadas por questionId.</li>
          <li><strong>Google Drive & Sheets:</strong> Leitura e extração de planilhas nativas do Sheets, arquivos XLSX e CSV hospedados no Drive.</li>
          <li><strong>Pipeline de Análise:</strong> Mapeamento automático de tipos com modo quantitativo (gráficos imediatos) e modo qualitativo (preparado para síntese de texto).</li>
        </ul>
      </div>
    </div>
  );
}
