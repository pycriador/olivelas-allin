import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  RefreshCw,
  Shield,
  Clock,
  X,
  ChevronDown,
  ChevronRight,
  Copy,
  Globe,
  Terminal,
  Calendar,
  Laptop,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../lib/api';
import { AuditLog } from '../types';
import { toast } from 'sonner';
import { useUrlParams } from '../hooks/useUrlParams';
import { PaginationBar } from '../components/PaginationBar';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const { search, page, limit, getParam, setParam, setPage, setSearch } = useUrlParams(15);
  const filterAction = getParam('action', 'all');

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  const copyDetails = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success('Detalhes copiados para a área de transferência!');
  };



  useEffect(() => {
    loadLogs();
  }, [filterAction]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const actionParam = filterAction === 'all' ? undefined : filterAction;
      const data = await api.getAuditLogs(actionParam);
      setLogs(data);
    } catch (err: any) {
      toast.error('Erro ao carregar registros de auditoria.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    if (!search) return logs;
    const q = search.toLowerCase();
    return logs.filter((log) => {
      const email = (log.user_email || log.user_name || '').toLowerCase();
      const action = log.action.toLowerCase();
      const entity = (log.entity_type || '').toLowerCase();
      const details = log.details ? JSON.stringify(log.details).toLowerCase() : '';
      return email.includes(q) || action.includes(q) || entity.includes(q) || details.includes(q);
    });
  }, [logs, search]);

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredLogs.slice(start, start + limit);
  }, [filteredLogs, page, limit]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Trilha de Auditoria & HBAC</h1>
          <p className="text-xs text-muted-foreground">
            Rastreabilidade completa de ações de usuários, alterações em formulários, convites e acessos à API com URL.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-hover text-muted-foreground flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar Trilha
        </button>
      </div>

      {/* Filter Row with URL Search & Action */}
      <div className="p-3.5 rounded-2xl bg-surface border border-border glass flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por usuário, detalhes, entidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">Ação:</span>
          <select
            value={filterAction}
            onChange={(e) => setParam('action', e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-border bg-background text-foreground font-medium"
          >
            <option value="all">Todas as Ações</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="FORM_CREATED">FORM_CREATED</option>
            <option value="FORM_DELETED">FORM_DELETED</option>
            <option value="COLLABORATOR_INVITED">COLLABORATOR_INVITED</option>
            <option value="RESPONSE_SUBMITTED">RESPONSE_SUBMITTED</option>
            <option value="API_TOKEN_CREATED">API_TOKEN_CREATED</option>
            <option value="DATABASE_SEED">DATABASE_SEED</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden glass">
        <div className="responsive-table-shell overflow-x-auto">
          <table className="w-full text-left text-xs responsive-mobile-cards">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Data & Hora</th>
                <th className="py-3 px-4">Ação Registrada</th>
                <th className="py-3 px-4">Entidade</th>
                <th className="py-3 px-4">Usuário Responsável</th>
                <th className="py-3 px-4">Detalhes</th>
                <th className="py-3 px-4">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Carregando trilha de auditoria...
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const detailsObj = typeof log.details === 'string' ? (() => {
                    try { return JSON.parse(log.details); } catch (_) { return log.details; }
                  })() : log.details || {};
                  
                  const browserAgent = detailsObj?.user_agent || (log as any)?.user_agent || 'Navegador Web';
                  const dateLocal = new Date(log.created_at).toLocaleString('pt-BR');
                  const dateIso = new Date(log.created_at).toISOString();

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => toggleExpand(log.id)}
                        className={`cursor-pointer transition-colors select-none ${
                          isExpanded
                            ? 'bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary'
                            : 'hover:bg-surface-hover/60'
                        }`}
                        title="Clique para ver todos os detalhes deste evento"
                      >
                        {/* Data & Hora com toggle expand */}
                        <td data-mobile-label="Data" className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded-md bg-muted/60 text-foreground">
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-primary" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </span>
                            <span>{dateLocal}</span>
                          </div>
                        </td>

                        {/* Ação Registrada */}
                        <td data-mobile-label="Ação" className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-primary/10 text-primary border border-primary/20">
                            {log.action}
                          </span>
                        </td>

                        {/* Entidade */}
                        <td data-mobile-label="Entidade" className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md uppercase font-semibold text-[10px] bg-muted text-muted-foreground">
                            {log.entity_type}
                          </span>
                        </td>

                        {/* Usuário Responsável */}
                        <td data-mobile-label="Usuário" className="py-3 px-4 font-semibold text-foreground">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate max-w-[180px]">{log.user_email || log.user_name || 'Sistema'}</span>
                          </div>
                        </td>

                        {/* Detalhes (Resumo) */}
                        <td data-mobile-label="Detalhes" className="py-3 px-4 font-mono text-[10px] text-muted-foreground max-w-xs truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">
                              {log.details ? (typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)) : '-'}
                            </span>
                            <span className="text-[9px] font-bold text-primary hover:underline shrink-0">
                              {isExpanded ? 'Recolher ▲' : 'Ver mais ▼'}
                            </span>
                          </div>
                        </td>

                        {/* IP */}
                        <td data-mobile-label="IP" className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                          {log.ip_address || '127.0.0.1'}
                        </td>
                      </tr>

                      {/* Expanded Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-muted/20 border-b border-border/80 animate-in fade-in duration-150">
                          <td colSpan={6} className="p-4 sm:p-6">
                            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-inner space-y-4">
                              
                              {/* Metadata Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-4 border-b border-border/70 text-xs">
                                
                                {/* 1. Horário */}
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-primary" /> Horário Completo
                                  </div>
                                  <div className="font-semibold text-foreground">{dateLocal}</div>
                                  <div className="text-[10px] text-muted-foreground font-mono">{dateIso}</div>
                                </div>

                                {/* 2. IP & Origem */}
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5 text-primary" /> Endereço IP
                                  </div>
                                  <div className="font-mono font-bold text-foreground">
                                    {log.ip_address || '127.0.0.1 (Localhost / Servidor)'}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">Tráfego interno seguro</div>
                                </div>

                                {/* 3. Identificadores (IDs) */}
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Terminal className="w-3.5 h-3.5 text-primary" /> Identificadores (IDs)
                                  </div>
                                  <div className="text-[10px] font-mono text-muted-foreground">
                                    <span className="font-semibold text-foreground">Audit ID:</span> {log.id}
                                  </div>
                                  {log.entity_id && (
                                    <div className="text-[10px] font-mono text-muted-foreground">
                                      <span className="font-semibold text-foreground">Entity ID:</span> {log.entity_id}
                                    </div>
                                  )}
                                  {log.user_id && (
                                    <div className="text-[10px] font-mono text-muted-foreground">
                                      <span className="font-semibold text-foreground">User ID:</span> {log.user_id}
                                    </div>
                                  )}
                                </div>

                                {/* 4. Navegador / Dispositivo */}
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Laptop className="w-3.5 h-3.5 text-primary" /> Navegador & Agente
                                  </div>
                                  <div className="text-[11px] text-foreground font-mono break-words leading-tight line-clamp-2" title={browserAgent}>
                                    {browserAgent}
                                  </div>
                                </div>

                              </div>

                              {/* Structured Payload / Details Section */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <Terminal className="w-3.5 h-3.5 text-primary" />
                                    <span>Conteúdo Detalhado do Evento (JSON / Payload):</span>
                                  </div>
                                  <button
                                    onClick={(e) => copyDetails(JSON.stringify(detailsObj, null, 2), e)}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-border bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                  >
                                    <Copy className="w-3 h-3" /> Copiar JSON
                                  </button>
                                </div>

                                <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 dark:bg-black/80 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
                                  {JSON.stringify(detailsObj, null, 2)}
                                </pre>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* URL Pagination */}
        <div className="px-4 pb-2">
          <PaginationBar
            totalItems={filteredLogs.length}
            currentPage={page}
            pageSize={limit}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
};
