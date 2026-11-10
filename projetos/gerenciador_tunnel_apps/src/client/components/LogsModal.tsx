import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Terminal,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Play,
  Square,
  RotateCcw,
  Radio,
  Link2,
} from 'lucide-react';
import { AppTunnelItem, LogEntry, DetectedUrlItem } from '../types.js';
import { api } from '../lib/api.js';
import { copyToClipboard } from '../lib/utils.js';

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: AppTunnelItem | null;
  liveLogs: LogEntry[];
  onClearLogs: (appId: number) => void;
  onStartApp: (id: number) => void;
  onStopApp: (id: number) => void;
  onRestartApp: (id: number) => void;
}

export const LogsModal: React.FC<LogsModalProps> = ({
  isOpen,
  onClose,
  app,
  liveLogs,
  onClearLogs,
  onStartApp,
  onStopApp,
  onRestartApp,
}) => {
  const [filterSource, setFilterSource] = useState<'all' | 'app' | 'tunnel' | 'system'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedChipUrl, setCopiedChipUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveLogs, isOpen, autoScroll, filterSource]);

  if (!isOpen || !app) return null;

  const filteredLogs = liveLogs.filter((l) =>
    filterSource === 'all' ? true : l.source === filterSource
  );

  // Detectar URL diretamente nos logs caso ainda não tenha chegado no objeto app
  let urlFromLogs: string | null = null;
  for (let i = liveLogs.length - 1; i >= 0; i--) {
    const m = liveLogs[i].line.match(
      /https:\/\/[a-zA-Z0-9.-]+\.(?:trycloudflare\.com|ngrok(?:-free)?\.(?:app|io|dev|pizza)|loca\.lt|lhr\.life|localhost\.run)/i
    );
    if (m) {
      urlFromLogs = m[0];
      break;
    }
  }

  const effectivePublicUrl = app.public_url || urlFromLogs || (app.is_running ? app.last_public_url : null);

  // Consolidar todas as URLs capturadas (do backend + extraídas ao vivo dos logs do modal)
  const allDetectedUrls: DetectedUrlItem[] = [...(app.detected_urls || [])];
  for (const l of liveLogs) {
    if (l.source === 'system') continue;
    const matches = l.line.match(/https?:\/\/[^\s"'<>`|]+/gi);
    if (!matches) continue;
    for (const raw of matches) {
      const cleaned = raw.replace(/[.,;:!?)\]}'"]+$/, '').replace(/\/$/, '');
      if (
        cleaned.includes('nodejs.org') ||
        cleaned.includes('npmjs.com') ||
        cleaned.includes('cloudflare.com') ||
        cleaned.includes('ngrok.com') ||
        cleaned.includes('rolldown.rs') ||
        cleaned.includes('vite.dev')
      ) {
        continue;
      }
      if (!allDetectedUrls.some((u) => u.url.replace(/\/$/, '') === cleaned)) {
        const isPublic = cleaned.includes('trycloudflare.com') || cleaned.includes('ngrok') || cleaned.includes('loca.lt');
        allDetectedUrls.push({
          url: cleaned,
          label: isPublic ? 'Túnel Público' : 'URL no Log',
          category: isPublic ? 'public' : 'local',
          source: l.source,
          detectedAt: l.timestamp,
        });
      }
    }
  }

  const handleCopyChip = async (url: string) => {
    await copyToClipboard(url);
    setCopiedChipUrl(url);
    setTimeout(() => setCopiedChipUrl(null), 2000);
  };

  // Renderizar linha de log destacando e tornando clicáveis quaisquer URLs
  const renderLineWithLinks = (line: string) => {
    const parts = line.split(/(https?:\/\/[^\s"'<>`|]+)/gi);
    return parts.map((part, idx) => {
      if (/^https?:\/\//i.test(part)) {
        const cleanHref = part.replace(/[.,;:!?)\]}'"]+$/, '');
        return (
          <a
            key={idx}
            href={cleanHref}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-300 hover:text-emerald-200 underline font-semibold"
          >
            {part}
          </a>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  const handleCopyLogs = async () => {
    const text = filteredLogs
      .map(
        (l) =>
          `[${new Date(l.timestamp).toLocaleTimeString('pt-BR')}] [${l.source.toUpperCase()}] ${l.line}`
      )
      .join('\n');
    await copyToClipboard(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyUrl = async () => {
    if (!effectivePublicUrl) return;
    await copyToClipboard(effectivePublicUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleClear = async () => {
    await api.clearAppLogs(app.id);
    onClearLogs(app.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col h-[82vh] overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/95">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
              <Terminal className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-100 truncate">{app.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    app.is_running
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {app.is_running ? 'Em Execução' : 'Parado'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono truncate">
                {app.start_command || `Túnel na porta ${app.local_port}`}
              </p>
            </div>
          </div>

          {/* Controles Rápidos */}
          <div className="flex items-center gap-2">
            {app.is_running ? (
              <>
                <button
                  onClick={() => onRestartApp(app.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reiniciar
                </button>
                <button
                  onClick={() => onStopApp(app.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/25 text-xs font-medium transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Parar
                </button>
              </>
            ) : (
              <button
                onClick={() => onStartApp(app.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Iniciar
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de URL Pública se estiver online */}
        {effectivePublicUrl && (
          <div className="px-5 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
              <span className="text-xs text-emerald-300 font-medium">URL Pública Online:</span>
              <a
                href={effectivePublicUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-emerald-200 underline hover:text-white truncate"
              >
                {effectivePublicUrl}
              </a>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleCopyUrl}
                className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-[11px] font-medium transition-colors"
              >
                {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedUrl ? 'Copiado' : 'Copiar URL'}
              </button>
              <a
                href={effectivePublicUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Barra de Todas as URLs Capturadas da Aplicação */}
        {allDetectedUrls.length > 0 && (
          <div className="px-5 py-2 bg-indigo-950/25 border-b border-indigo-500/20 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1 mr-1 shrink-0">
              <Link2 className="w-3.5 h-3.5 text-indigo-400" />
              URLs Capturadas ({allDetectedUrls.length}):
            </span>
            {allDetectedUrls.map((u) => (
              <div
                key={u.url}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-950/90 border border-zinc-800 text-[11px] font-mono"
              >
                <span className="text-[9px] font-sans font-semibold px-1 py-0.1 rounded bg-indigo-500/20 text-indigo-300">
                  {u.label}
                </span>
                <a
                  href={u.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-200 hover:text-white hover:underline truncate max-w-[240px]"
                  title={u.url}
                >
                  {u.url}
                </a>
                <button
                  onClick={() => handleCopyChip(u.url)}
                  className="text-zinc-400 hover:text-zinc-200"
                  title="Copiar URL"
                >
                  {copiedChipUrl === u.url ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
                <a
                  href={u.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-400 hover:text-zinc-200"
                  title="Abrir no navegador"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Barra de Filtros do Console */}
        <div className="px-5 py-2.5 bg-zinc-950/80 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'Todos os Logs' },
                { id: 'app', label: 'Aplicação Local' },
                { id: 'tunnel', label: 'Túnel Público' },
                { id: 'system', label: 'Sistema' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterSource(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterSource === tab.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer mr-2">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-indigo-600"
              />
              Auto-scroll
            </label>
            <button
              onClick={handleCopyLogs}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedAll ? 'Copiado' : 'Copiar'}
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-300 hover:text-red-300 text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar
            </button>
          </div>
        </div>

        {/* Saída do Terminal */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#09090b] font-mono text-xs space-y-1 select-text">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
              <Terminal className="w-8 h-8 stroke-1" />
              <p>Nenhuma saída registrada para este filtro no momento.</p>
            </div>
          ) : (
            filteredLogs.map((entry) => {
              const sourceBadge =
                entry.source === 'tunnel'
                  ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                  : entry.source === 'system'
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-2 py-0.5 hover:bg-zinc-900/60 px-1.5 rounded leading-relaxed break-all"
                >
                  <span className="text-zinc-600 shrink-0 select-none">
                    {new Date(entry.timestamp).toLocaleTimeString('pt-BR')}
                  </span>
                  <span
                    className={`px-1.5 py-0 rounded text-[10px] font-semibold uppercase border shrink-0 select-none ${sourceBadge}`}
                  >
                    {entry.source}
                  </span>
                  <span
                    className={
                      entry.stream === 'stderr' && entry.source === 'app'
                        ? 'text-red-300'
                        : 'text-zinc-200'
                    }
                  >
                    {renderLineWithLinks(entry.line)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
};
