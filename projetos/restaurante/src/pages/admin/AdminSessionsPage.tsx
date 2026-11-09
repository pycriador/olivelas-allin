import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  KeyRound,
  Shield,
  Laptop,
  Smartphone,
  Tablet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserX,
  Users,
  LogOut,
  RefreshCw,
  Code,
  Copy,
  ChevronDown,
  Activity,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterBar } from '@/components/common/FilterBar';
import { PaginationControl } from '@/components/common/PaginationControl';
import { useAuth } from '@/hooks/useAuth';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { sessionService } from '@/services/sessionService';
import type { PlatformSession, SessionStats } from '@/types/session';
import type { AuditLog } from '@/types/audit';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AdminSessionsPage() {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab: 'active' | 'history'
  const activeTab = searchParams.get('tab') === 'history' ? 'history' : 'active';
  const handleTabChange = (tab: 'active' | 'history') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === 'history') {
        next.set('tab', 'history');
      } else {
        next.delete('tab');
      }
      return next;
    });
  };

  // URL filters for auth history tab
  const {
    page,
    pageSize,
    search,
    action,
    setFilter,
    setPage,
    setPageSize,
    resetFilters,
  } = useUrlFilters({ defaultPageSize: 10 });

  // Sessions state
  const [sessions, setSessions] = useState<PlatformSession[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    activeSessionsCount: 0,
    uniqueUsersOnlineCount: 0,
    loginsTodayCount: 0,
    failedLoginsTodayCount: 0,
  });
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // History state
  const [authLogs, setAuthLogs] = useState<AuditLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  // Modals state
  const [revokingSession, setRevokingSession] = useState<PlatformSession | null>(null);
  const [revokingAllUser, setRevokingAllUser] = useState<PlatformSession | null>(null);
  const [isSubmittingRevoke, setIsSubmittingRevoke] = useState(false);
  const [selectedLogPayload, setSelectedLogPayload] = useState<AuditLog | null>(null);

  // Load active sessions and stats
  const loadSessionsData = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      if (currentUser) {
        await sessionService.syncCurrentSession(currentUser);
      }
      const [list, s] = await Promise.all([
        sessionService.getActiveSessions(),
        sessionService.getSessionStats(),
      ]);
      setSessions(list);
      setStats(s);
    } catch {
      toast.error('Erro ao carregar sessões ativas.');
    } finally {
      setIsLoadingSessions(false);
    }
  }, [currentUser]);

  // Load auth history logs
  const loadAuthHistory = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const res = await sessionService.getAuthLogs({
        page,
        pageSize,
        search,
        action,
      });
      setAuthLogs(res.data);
      setTotalLogs(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('Erro ao carregar histórico de autenticações.');
    } finally {
      setIsLoadingLogs(false);
    }
  }, [page, pageSize, search, action]);

  useEffect(() => {
    void loadSessionsData();
  }, [loadSessionsData]);

  useEffect(() => {
    if (activeTab === 'history') {
      void loadAuthHistory();
    }
  }, [activeTab, loadAuthHistory]);

  // Actions: Revoke single session
  const handleConfirmRevokeSession = async () => {
    if (!revokingSession) return;
    setIsSubmittingRevoke(true);
    try {
      const res = await sessionService.revokeSession(revokingSession.id, currentUser?.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Sessão de ${revokingSession.user_email} revogada com sucesso.`);
        setRevokingSession(null);
        await loadSessionsData();
        if (activeTab === 'history') await loadAuthHistory();
      }
    } catch {
      toast.error('Falha ao revogar sessão.');
    } finally {
      setIsSubmittingRevoke(false);
    }
  };

  // Actions: Revoke all other sessions of a user
  const handleConfirmRevokeAllUser = async () => {
    if (!revokingAllUser) return;
    setIsSubmittingRevoke(true);
    try {
      const res = await sessionService.revokeAllUserSessions(
        revokingAllUser.user_id,
        currentUser?.id,
        revokingAllUser.id
      );
      toast.success(
        `${res.count} outras sessão(ões) de ${revokingAllUser.user_email} foram revogadas.`
      );
      setRevokingAllUser(null);
      await loadSessionsData();
      if (activeTab === 'history') await loadAuthHistory();
    } catch {
      toast.error('Falha ao revogar sessões.');
    } finally {
      setIsSubmittingRevoke(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4 text-primary shrink-0" />;
      case 'tablet':
        return <Tablet className="h-4 w-4 text-primary shrink-0" />;
      default:
        return <Laptop className="h-4 w-4 text-primary shrink-0" />;
    }
  };

  const historyFilterFields = [
    {
      key: 'action',
      label: 'Todos os Eventos',
      options: [
        { label: 'Logins com Sucesso', value: 'LOGIN_SUCCESS' },
        { label: 'Falhas de Login', value: 'LOGIN_FAILED' },
        { label: 'Logouts', value: 'LOGOUT' },
        { label: 'Sessões Revogadas', value: 'SESSION_REVOKED' },
        { label: 'Troca de Senha', value: 'PASSWORD_RESET' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-primary" />
            Controle de Sessões e Autenticação
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Monitore em tempo real dispositivos conectados, encerre acessos suspeitos e consulte a trilha de autenticação.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void loadSessionsData();
            if (activeTab === 'history') void loadAuthHistory();
          }}
          className="text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Atualizar Sessões</span>
        </Button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Sessions */}
        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Sessões Ativas</p>
              <div className="text-2xl font-bold text-foreground flex items-center gap-2">
                <span>{stats.activeSessionsCount}</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Unique Users Online */}
        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Usuários Conectados</p>
              <p className="text-2xl font-bold text-foreground">{stats.uniqueUsersOnlineCount}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Logins Today */}
        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Autenticações Hoje</p>
              <p className="text-2xl font-bold text-foreground">{stats.loginsTodayCount}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Current Operator Session */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <p className="text-xs font-bold text-primary uppercase tracking-wider">Sua Sessão</p>
              </div>
              <p className="text-xs font-semibold text-foreground truncate">{currentUser?.email}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {typeof navigator !== 'undefined' ? navigator.userAgent.split(' ')[0] : 'Web'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Laptop className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border/80">
        <button
          type="button"
          onClick={() => handleTabChange('active')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'active'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Sessões Ativas ({sessions.filter((s) => s.status === 'active').length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('history')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Histórico de Autenticação ({totalLogs})</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE SESSIONS */}
      {activeTab === 'active' && (
        <Card className="border-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/70 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Dispositivo / Navegador</th>
                  <th className="px-4 py-3">Endereço IP</th>
                  <th className="px-4 py-3">Início da Sessão</th>
                  <th className="px-4 py-3">Última Atividade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoadingSessions ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Carregando sessões ativas...
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma sessão ativa encontrada.
                    </td>
                  </tr>
                ) : (
                  sessions.map((sess) => (
                    <tr
                      key={sess.id}
                      className={`hover:bg-muted/20 transition-colors ${
                        sess.is_current ? 'bg-primary/5' : ''
                      }`}
                    >
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {sess.user_avatar ? (
                              <img
                                src={sess.user_avatar}
                                alt=""
                                className="h-full w-full object-cover rounded-full"
                              />
                            ) : (
                              sess.user_name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <span>{sess.user_name}</span>
                              {sess.is_current && (
                                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[9px] py-0 px-1">
                                  Esta Sessão
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{sess.user_email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Device & Browser */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(sess.device_type)}
                          <div>
                            <p className="font-semibold text-foreground text-xs">{sess.browser}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {sess.os} · {sess.device_type}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* IP */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                          {sess.ip_address}
                        </span>
                      </td>

                      {/* Started at */}
                      <td className="px-4 py-3 text-muted-foreground text-[11px]">
                        {new Date(sess.created_at).toLocaleString('pt-BR')}
                      </td>

                      {/* Last Activity */}
                      <td className="px-4 py-3 text-muted-foreground text-[11px]">
                        {new Date(sess.last_activity_at).toLocaleTimeString('pt-BR')}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge
                          variant={sess.status === 'active' ? 'default' : 'secondary'}
                          className={`text-[10px] capitalize ${
                            sess.status === 'revoked' ? 'bg-destructive/10 text-destructive border-destructive/20' : ''
                          }`}
                        >
                          {sess.status === 'active' ? 'Ativa' : sess.status === 'revoked' ? 'Revogada' : 'Expirada'}
                        </Badge>
                      </td>

                      {/* Actions Dropdown */}
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs flex items-center gap-1.5 ml-auto data-[state=open]:bg-accent"
                            >
                              <span>Ações</span>
                              <ChevronDown className="h-3 w-3 opacity-60" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Ações da Sessão</DropdownMenuLabel>

                            {sess.status === 'active' && (
                              <DropdownMenuItem
                                onClick={() => setRevokingSession(sess)}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <LogOut className="h-3.5 w-3.5 mr-2" />
                                <span>Encerrar Esta Sessão</span>
                              </DropdownMenuItem>
                            )}

                            {sess.status === 'active' && !sess.is_current && (
                              <DropdownMenuItem
                                onClick={() => setRevokingAllUser(sess)}
                                className="cursor-pointer text-amber-600 dark:text-amber-400 focus:text-amber-600"
                              >
                                <UserX className="h-3.5 w-3.5 mr-2" />
                                <span>Revogar Outras Sessões</span>
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link to={`/admin/users/${sess.user_id}`}>
                                <Users className="h-3.5 w-3.5 mr-2 text-primary" />
                                <span>Ver Cadastro do Usuário</span>
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild className="cursor-pointer">
                              <Link to={`/admin/audit?search=${encodeURIComponent(sess.user_email)}`}>
                                <Shield className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                <span>Ver Auditoria do Usuário</span>
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: AUTHENTICATION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* URL Filter Bar */}
          <FilterBar
            search={search}
            onSearchChange={(val) => setFilter('search', val)}
            searchPlaceholder="Buscar por e-mail, nome, IP ou evento..."
            filters={historyFilterFields}
            filterValues={{ action }}
            onFilterChange={(key, val) => setFilter(key, val)}
            onReset={resetFilters}
            onRefresh={loadAuthHistory}
            isLoading={isLoadingLogs}
          />

          {/* History Table */}
          <Card className="border-border shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border/70 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Horário</th>
                    <th className="px-4 py-3">Evento</th>
                    <th className="px-4 py-3">Usuário</th>
                    <th className="px-4 py-3">Endereço IP</th>
                    <th className="px-4 py-3">Dispositivo / Método</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isLoadingLogs ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Carregando histórico de autenticações...
                      </td>
                    </tr>
                  ) : authLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Nenhum evento de autenticação registrado com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    authLogs.map((log) => {
                      const isSuccess = log.action === 'LOGIN_SUCCESS';
                      const isFailed = log.action === 'LOGIN_FAILED';
                      const isRevoked = log.action.includes('REVOKED');
                      const email =
                        log.actor_email ||
                        (log.metadata as any)?.email ||
                        (log.metadata as any)?.target_user_email ||
                        'Visitante';

                      return (
                        <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge
                              variant={isSuccess ? 'default' : isFailed ? 'destructive' : 'secondary'}
                              className={`text-[10px] font-mono ${
                                isRevoked
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                  : ''
                              }`}
                            >
                              {log.action}
                            </Badge>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground text-xs">
                              {log.actor_name || email.split('@')[0]}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{email}</div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                              {log.ip_address || '127.0.0.1'}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {(log.metadata as any)?.device ||
                              (log.metadata as any)?.method ||
                              (log.user_agent ? log.user_agent.slice(0, 30) + '...' : 'OAuth / Senha')}
                          </td>

                          {/* History Actions Dropdown */}
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs flex items-center gap-1.5 ml-auto data-[state=open]:bg-accent"
                                >
                                  <span>Ações</span>
                                  <ChevronDown className="h-3 w-3 opacity-60" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>Ações do Evento</DropdownMenuLabel>

                                <DropdownMenuItem
                                  onClick={() => setSelectedLogPayload(log)}
                                  className="cursor-pointer"
                                >
                                  <Code className="h-3.5 w-3.5 mr-2 text-primary" />
                                  <span>Ver Metadados JSON</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => {
                                    void navigator.clipboard.writeText(JSON.stringify(log, null, 2));
                                    toast.success('JSON copiado!');
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Copy className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                  <span>Copiar Registro</span>
                                </DropdownMenuItem>

                                {log.actor_user_id && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild className="cursor-pointer">
                                      <Link to={`/admin/users/${log.actor_user_id}`}>
                                        <Users className="h-3.5 w-3.5 mr-2 text-primary" />
                                        <span>Ver Usuário</span>
                                      </Link>
                                    </DropdownMenuItem>
                                  </>
                                )}
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
              total={totalLogs}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 20, 50]}
            />
          </Card>
        </div>
      )}

      {/* Modal: Confirm Revoke Single Session */}
      {revokingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-destructive/30 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="font-bold text-base text-foreground">Encerrar Sessão Ativa?</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Você está prestes a desconectar forçadamente a sessão de{' '}
              <strong className="text-foreground">{revokingSession.user_email}</strong> no dispositivo{' '}
              <strong className="text-foreground">{revokingSession.browser} ({revokingSession.os})</strong>. O usuário precisará realizar novo login.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setRevokingSession(null)}
                disabled={isSubmittingRevoke}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmRevokeSession}
                isLoading={isSubmittingRevoke}
                loadingText="Encerrando..."
              >
                Encerrar Sessão
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Revoke All User Sessions */}
      {revokingAllUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-amber-500/30 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="font-bold text-base text-foreground">Revogar Todas as Outras Sessões?</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Todas as outras sessões ativas associadas a{' '}
              <strong className="text-foreground">{revokingAllUser.user_email}</strong> serão invalidadas e desconectadas imediatamente.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setRevokingAllUser(null)}
                disabled={isSubmittingRevoke}
              >
                Cancelar
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleConfirmRevokeAllUser}
                isLoading={isSubmittingRevoke}
                loadingText="Revogando..."
              >
                Revogar Sessões
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Audit Payload JSON */}
      {selectedLogPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <div>
                <h3 className="font-bold text-sm text-foreground">Metadados de Autenticação</h3>
                <p className="text-[11px] font-mono text-primary">{selectedLogPayload.action}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogPayload(null)}
                className="text-xs text-muted-foreground hover:text-foreground p-1"
              >
                ✕
              </button>
            </div>

            <pre className="p-3 rounded-lg bg-muted/60 text-foreground font-mono text-[11px] overflow-auto max-h-72 whitespace-pre-wrap">
              {JSON.stringify(
                {
                  id: selectedLogPayload.id,
                  action: selectedLogPayload.action,
                  actor_user_id: selectedLogPayload.actor_user_id,
                  ip_address: selectedLogPayload.ip_address,
                  user_agent: selectedLogPayload.user_agent,
                  metadata: selectedLogPayload.metadata,
                  created_at: selectedLogPayload.created_at,
                },
                null,
                2
              )}
            </pre>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(JSON.stringify(selectedLogPayload, null, 2));
                  toast.success('JSON copiado!');
                }}
                className="text-xs"
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copiar
              </Button>
              <Button size="sm" onClick={() => setSelectedLogPayload(null)} className="text-xs">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
