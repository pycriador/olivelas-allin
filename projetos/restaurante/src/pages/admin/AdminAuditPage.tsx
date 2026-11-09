import { useState, useEffect, useCallback } from 'react';
import { ScrollText, ShieldCheck, Code, X, ChevronDown, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterBar } from '@/components/common/FilterBar';
import { PaginationControl } from '@/components/common/PaginationControl';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { auditService } from '@/services/auditService';
import type { AuditLog } from '@/types/audit';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AdminAuditPage() {
  const {
    page,
    pageSize,
    search,
    action,
    setFilter,
    setPage,
    setPageSize,
    resetFilters,
  } = useUrlFilters({ defaultPageSize: 20 });

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await auditService.getAuditLogs({
        page,
        pageSize,
        action,
        search,
      });
      setLogs(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('Erro ao carregar logs de auditoria.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, action, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filterFields = [
    {
      key: 'action',
      label: 'Todas as Ações',
      options: [
        { label: 'LOGIN_SUCCESS', value: 'LOGIN_SUCCESS' },
        { label: 'LOGIN_FAILED', value: 'LOGIN_FAILED' },
        { label: 'LOGOUT', value: 'LOGOUT' },
        { label: 'PASSWORD_CHANGE', value: 'PASSWORD_CHANGE' },
        { label: 'PASSWORD_RESET_REQUEST', value: 'PASSWORD_RESET_REQUEST' },
        { label: 'USER_CREATED', value: 'USER_CREATED' },
        { label: 'USER_DEACTIVATED', value: 'USER_DEACTIVATED' },
        { label: 'USER_REACTIVATED', value: 'USER_REACTIVATED' },
        { label: 'RESTAURANT_CREATED', value: 'RESTAURANT_CREATED' },
        { label: 'RESTAURANT_UPDATED', value: 'RESTAURANT_UPDATED' },
        { label: 'MEMBER_ADDED', value: 'MEMBER_ADDED' },
        { label: 'MEMBER_REMOVED', value: 'MEMBER_REMOVED' },
        { label: 'ROLE_CHANGED', value: 'ROLE_CHANGED' },
        { label: 'SUPPORT_ACCESS_STARTED', value: 'SUPPORT_ACCESS_STARTED' },
        { label: 'SUPPORT_ACCESS_ENDED', value: 'SUPPORT_ACCESS_ENDED' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-primary" />
            Trilha de Auditoria (Append-Only)
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Registro imutável de todos os eventos de autenticação, operações administrativas e acessos de suporte.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Proteção contra exclusão ativa</span>
        </div>
      </div>

      {/* URL Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={(val) => setFilter('search', val)}
        searchPlaceholder="Buscar por ação, entidade ou metadados..."
        filters={filterFields}
        filterValues={{ action }}
        onFilterChange={(key, val) => setFilter(key, val)}
        onReset={resetFilters}
        onRefresh={fetchLogs}
        isLoading={isLoading}
      />

      {/* Table Card */}
      <Card className="border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/70 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Ação</th>
                <th className="px-4 py-3">Ator</th>
                <th className="px-4 py-3">Restaurante</th>
                <th className="px-4 py-3">Entidade</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Carregando registros de auditoria...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum log encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSupport = log.action.startsWith('SUPPORT_');
                  const isAuth = log.action.startsWith('LOGIN_') || log.action.startsWith('LOGOUT') || log.action.startsWith('PASSWORD_');
                  return (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors font-mono">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-[11px]">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant={isSupport ? 'secondary' : isAuth ? 'outline' : 'default'}
                          className={`text-[10px] font-mono ${
                            isSupport
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                              : ''
                          }`}
                        >
                          {log.action}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 font-sans">
                        <div className="font-semibold text-foreground text-xs">
                          {log.actor_name || log.actor_email || log.actor_user_id || 'Sistema'}
                        </div>
                        {log.actor_platform_role && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                            ({log.actor_platform_role})
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-sans text-muted-foreground">
                        {log.restaurant_name || log.restaurant_id || '-'}
                      </td>

                      <td className="px-4 py-3 font-sans text-muted-foreground capitalize">
                        {log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 8)}...)` : ''}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs flex items-center gap-1.5 ml-auto font-sans data-[state=open]:bg-accent"
                            >
                              <span>Ações</span>
                              <ChevronDown className="h-3 w-3 opacity-60" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 font-sans">
                            <DropdownMenuLabel>Ações do Evento</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => setSelectedLog(log)}
                              className="cursor-pointer"
                            >
                              <Code className="h-3.5 w-3.5 mr-2 text-primary" />
                              <span>Ver Payload JSON</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                void navigator.clipboard.writeText(JSON.stringify(log, null, 2));
                                toast.success('JSON copiado para a área de transferência.');
                              }}
                              className="cursor-pointer"
                            >
                              <Copy className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                              <span>Copiar JSON</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* URL Pagination */}
        <PaginationControl
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </Card>

      {/* JSON Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <div>
                <h3 className="font-bold text-sm text-foreground">Metadados do Evento</h3>
                <p className="text-[11px] font-mono text-primary">{selectedLog.action}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs space-y-2 text-muted-foreground">
              <p>ID do Evento: <span className="font-mono text-foreground">{selectedLog.id}</span></p>
              {selectedLog.ip_address && <p>IP: <span className="font-mono text-foreground">{selectedLog.ip_address}</span></p>}
              {selectedLog.user_agent && <p>User-Agent: <span className="text-foreground text-[10px] truncate block">{selectedLog.user_agent}</span></p>}
            </div>

            <pre className="p-3 rounded-lg bg-muted text-[11px] font-mono overflow-x-auto max-h-60 border border-border/60 text-foreground">
              {JSON.stringify(selectedLog.metadata || {}, null, 2)}
            </pre>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setSelectedLog(null)} className="text-xs">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
