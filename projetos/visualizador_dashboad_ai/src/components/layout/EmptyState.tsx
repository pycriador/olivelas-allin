import React, { useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  FileText,
  Sparkles,
  ArrowRight,
  Database,
  Download,
  Upload,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuth } from '../../context/AuthContext';

interface EmptyStateProps {
  onConnectForms: () => void;
  onConnectGoogle: () => void;
  onUploadFile: () => void;
  onRestoreBackup?: (backupData: any) => void;
}

export function EmptyState({
  onConnectForms,
  onConnectGoogle,
  onUploadFile,
  onRestoreBackup,
}: EmptyStateProps) {
  const { user, isAuthenticated, openAuthModal, googleConfigured } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onRestoreBackup) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      onRestoreBackup(json);
    } catch (err: any) {
      alert('Arquivo de backup inválido: ' + (err.message || 'Formato JSON inválido.'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-300">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Centered Hero Card */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
          <FileSpreadsheet className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {isAuthenticated
              ? `Olá, ${user?.name || 'Pesquisador'}! Seu Workspace está pronto.`
              : 'Workspace de Análise de Pesquisas'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed mt-1">
            Conecte sua planilha do <strong>Google Sheets</strong>, importe formulários do <strong>Google Forms</strong> ou restaure um backup JSON para gerar painéis executivos instantaneamente.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <Button
            variant="primary"
            size="lg"
            onClick={onConnectGoogle}
            className="text-sm h-11 px-5 gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/15"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Conectar Google Sheets</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onConnectForms}
            className="text-sm h-11 px-5 gap-2.5 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50/60 dark:hover:bg-purple-950/40 font-bold"
          >
            <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Google Forms</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onUploadFile}
            className="text-sm h-11 px-5 gap-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Arquivo Local (XLSX / CSV)</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm h-11 px-5 gap-2 border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 font-semibold"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Restaurar Backup JSON</span>
          </Button>
        </div>

        {/* User Workspace Prompt if not authenticated */}
        {!isAuthenticated && (
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 p-2 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Deseja salvar suas planilhas e credenciais do Google na nuvem?</span>
              <button
                onClick={() => openAuthModal('login')}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-1"
              >
                Entrar ou Criar Conta
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feature cards explaining the pipeline foundation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-left space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Google Sheets Integrado
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Ingestão automática de planilhas nativas do Sheets, arquivos XLSX e CSV compartilhados.
          </p>
        </Card>

        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-left space-y-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Mapeamento Inteligente
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Identificação de escolha única, múltipla seleção, escalas lineares e texto aberto.
          </p>
        </Card>

        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-left space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Segurança & Backup
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Exportação completa em formato JSON seguro para backup ou auditoria sem senhas ou credenciais.
          </p>
        </Card>
      </div>
    </div>
  );
}
