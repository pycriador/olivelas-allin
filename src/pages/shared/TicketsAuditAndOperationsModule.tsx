import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Edit3,
  MessageSquare,
  Package,
  Plus,
  Save,
  Send,
  ShieldCheck,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  AuditEventEntity,
  OperationalItemEntity,
  TicketCategory,
  TicketEntity,
  TicketPriority,
  TicketStatus,
} from '../../types/domain';
import { generateId, repositories } from '../../repositories/repositories';
import { formatCurrency, formatDateTime } from '../../i18n/translations';
import { getUserActiveRoles } from '../../services/hbacService';
import {
  AccessDeniedView,
  ArchiveRecordDialog,
  PageHeader,
  StatusBadge,
  UnsavedChangesBanner,
  UrlDataTable,
} from '../../components/shared/SharedComponents';

export const TicketsListPage: React.FC<{ scope: 'global' | 'company' }> = ({ scope }) => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const {
    tickets,
    companies,
    session,
    hasPermission,
    isModuleSubscribed,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();

  const [archiveTarget, setArchiveTarget] = useState<TicketEntity | null>(null);
  const targetCompanyId = scope === 'company' ? empresaId : undefined;
  const company = targetCompanyId ? companies.find((c) => c.id === targetCompanyId) : null;
  const baseRoute =
    scope === 'global' ? '/app/global/tickets' : `/app/empresa/${empresaId}/tickets`;

  if (!hasPermission('tickets', 'view', targetCompanyId)) {
    return (
      <AccessDeniedView
        reason="Seu papel atual não possui permissão para visualizar chamados de suporte."
        requiredPermission="tickets:view"
      />
    );
  }

  if (scope === 'company' && targetCompanyId && !isModuleSubscribed(targetCompanyId, 'allin_suporte')) {
    return (
      <AccessDeniedView
        reason="A empresa selecionada não possui o módulo Allin Suporte contratado e ativo."
        requiredPermission="module:allin_suporte"
      />
    );
  }

  const scopedTickets = targetCompanyId
    ? tickets.filter((tkt) => tkt.companyId === targetCompanyId)
    : tickets;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          {
            label: scope === 'global' ? t('scope.global') : company?.tradeName || 'Empresa',
            to: scope === 'global' ? '/app/global' : `/app/empresa/${empresaId}`,
          },
          { label: t('nav.tickets') },
        ]}
        title="Central de Atendimento & Tickets Operacionais"
        subtitle="Gestão de chamados por empresa, controle de prioridade, SLA, notas internas da plataforma e histórico auditado."
        scopeBadge={scope === 'global' ? t('scope.global') : company?.tradeName}
        actions={
          hasPermission('tickets', 'create', targetCompanyId) && (
            <Link to={`${baseRoute}/novo`} className="btn btn-primary btn-sm">
              <Plus size={14} />
              Abrir Novo Ticket
            </Link>
          )
        }
      />

      <UrlDataTable<TicketEntity>
        tableId={`tickets-table-${scope}`}
        caption="Chamados de suporte e solicitações comerciais/técnicas"
        items={scopedTickets}
        defaultSortField="createdAt"
        csvFilename={`tickets-${scope}.csv`}
        searchPlaceholder="Buscar por protocolo, assunto, empresa ou responsável..."
        statusExtractor={(tk) => tk.status}
        searchExtractor={(tk) =>
          `${tk.code} ${tk.subject} ${tk.companyName} ${tk.openedByUserName} ${tk.priority}`
        }
        statusOptions={[
          { value: 'open', label: t('status.open') },
          { value: 'in_progress', label: t('status.in_progress') },
          { value: 'waiting_customer', label: t('status.waiting_customer') },
          { value: 'resolved', label: t('status.resolved') },
          { value: 'closed', label: t('status.closed') },
          { value: 'archived', label: t('status.archived') },
        ]}
        isArchivedExtractor={(tk) => tk.archiveMetadata.isArchived}
        onArchiveClick={
          hasPermission('tickets', 'archive', targetCompanyId)
            ? (tk) => setArchiveTarget(tk)
            : undefined
        }
        onRestoreClick={
          hasPermission('tickets', 'archive', targetCompanyId)
            ? async (tk) => {
                await repositories.tickets.restore(tk.id, getActor(tk.companyId));
                await refreshData();
                notify({ type: 'success', title: `Ticket ${tk.code} restaurado.` });
              }
            : undefined
        }
        columns={[
          {
            key: 'code',
            header: 'Protocolo / Assunto',
            sortable: true,
            render: (tk) => (
              <div>
                <Link to={`${baseRoute}/${tk.id}`} className="mono font-semibold">
                  {tk.code}
                </Link>
                <div className="text-sm font-medium">{tk.subject}</div>
                <div className="text-xs text-muted">{tk.companyName}</div>
              </div>
            ),
          },
          {
            key: 'priority',
            header: 'Prioridade / Categoria',
            sortable: true,
            render: (tk) => (
              <div className="flex flex-col gap-1">
                <span
                  className={`badge ${
                    tk.priority === 'urgent' || tk.priority === 'high'
                      ? 'badge-danger'
                      : tk.priority === 'medium'
                        ? 'badge-warning'
                        : 'badge-neutral'
                  } uppercase`}
                >
                  {tk.priority}
                </span>
                <span className="text-xs text-muted uppercase">{tk.category}</span>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Estado / SLA',
            sortable: true,
            render: (tk) => (
              <div className="flex flex-col gap-1">
                <StatusBadge status={tk.status} />
                <span className="text-xs text-muted">
                  SLA: {formatDateTime(tk.slaDueAt, session.language)}
                </span>
              </div>
            ),
          },
          {
            key: 'assignedToUserName',
            header: 'Solicitante / Atendente',
            render: (tk) => (
              <div className="text-xs">
                <div>De: {tk.openedByUserName}</div>
                <div className="text-muted">Para: {tk.assignedToUserName || 'Fila Geral'}</div>
              </div>
            ),
          },
          {
            key: 'actions',
            header: 'Ações',
            render: (tk) => (
              <div className="flex items-center gap-1">
                <Link to={`${baseRoute}/${tk.id}`} className="btn btn-secondary btn-sm">
                  Atender ({tk.comments.length})
                </Link>
                {hasPermission('tickets', 'edit', targetCompanyId) && (
                  <Link to={`${baseRoute}/${tk.id}/editar`} className="btn btn-ghost btn-sm">
                    <Edit3 size={13} />
                    Editar
                  </Link>
                )}
              </div>
            ),
          },
        ]}
      />

      <ArchiveRecordDialog
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        recordTitle={archiveTarget ? `${archiveTarget.code} — ${archiveTarget.subject}` : ''}
        onConfirmArchive={async (reason) => {
          if (!archiveTarget) return;
          await repositories.tickets.archive(
            archiveTarget.id,
            reason,
            getActor(archiveTarget.companyId),
          );
          await refreshData();
          notify({ type: 'warning', title: `Ticket ${archiveTarget.code} arquivado.` });
        }}
      />
    </div>
  );
};

export const TicketFormPage: React.FC<{
  scope: 'global' | 'company';
  mode: 'create' | 'edit';
}> = ({ scope, mode }) => {
  const { empresaId, ticketId } = useParams<{ empresaId: string; ticketId: string }>();
  const {
    tickets,
    companies,
    users,
    currentUser,
    hasPermission,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();
  const navigate = useNavigate();

  const targetCompanyId = scope === 'company' ? empresaId : undefined;
  const baseRoute =
    scope === 'global' ? '/app/global/tickets' : `/app/empresa/${empresaId}/tickets`;
  const existing = mode === 'edit' ? tickets.find((tk) => tk.id === ticketId) : undefined;

  const [companyId, setCompanyId] = useState(
    existing?.companyId || targetCompanyId || companies[0]?.id || 'emp-olivelas-matriz',
  );
  const [subject, setSubject] = useState(existing?.subject || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [category, setCategory] = useState<TicketCategory>(existing?.category || 'technical');
  const [priority, setPriority] = useState<TicketPriority>(existing?.priority || 'medium');
  const [status, setStatus] = useState<TicketStatus>(existing?.status || 'open');
  const [assignedToUserId, setAssignedToUserId] = useState(
    existing?.assignedToUserId || 'usr-admin',
  );
  const [isDirty, setIsDirty] = useState(false);

  if (!hasPermission('tickets', mode === 'create' ? 'create' : 'edit', targetCompanyId)) {
    return (
      <AccessDeniedView
        reason="Sem permissão para criar ou editar tickets de suporte."
        requiredPermission={`tickets:${mode}`}
      />
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const comp = companies.find((c) => c.id === companyId);
    const assignee = users.find((u) => u.id === assignedToUserId);
    const now = new Date().toISOString();

    if (mode === 'create') {
      const newId = generateId('tkt');
      const code = `CHAM-2026-0${tickets.length + 101}`;
      const newTicket: TicketEntity = {
        id: newId,
        code,
        companyId,
        companyName: comp?.legalName || companyId,
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        status: 'open',
        openedByUserId: currentUser?.id || 'usr-cliente',
        openedByUserName: currentUser?.name || 'Usuário',
        assignedToUserId: assignee?.id,
        assignedToUserName: assignee?.name,
        slaDueAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        comments: [],
        attachments: [],
        createdAt: now,
        updatedAt: now,
        archiveMetadata: { isArchived: false },
        changeHistory: [],
      };
      await repositories.tickets.create(
        newTicket,
        getActor(companyId),
        `Abertura do chamado ${code}: "${newTicket.subject}".`,
      );
      await refreshData();
      notify({ type: 'success', title: `Chamado ${code} aberto com sucesso.` });
      navigate(`${baseRoute}/${newId}`);
    } else if (existing) {
      await repositories.tickets.update(
        existing.id,
        (curr) => ({
          ...curr,
          subject: subject.trim(),
          description: description.trim(),
          category,
          priority,
          status,
          assignedToUserId: assignee?.id,
          assignedToUserName: assignee?.name,
        }),
        getActor(existing.companyId),
        `Atualização do chamado ${existing.code} (Status: ${status}, Prioridade: ${priority}).`,
      );
      await refreshData();
      notify({ type: 'success', title: `Chamado ${existing.code} atualizado.` });
      navigate(`${baseRoute}/${existing.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('nav.tickets'), to: baseRoute },
          { label: mode === 'create' ? 'Novo Ticket' : existing?.code || 'Editar' },
        ]}
        title={mode === 'create' ? 'Abrir Novo Chamado de Suporte' : `Editar Ticket ${existing?.code}`}
        subtitle="Registre solicitações técnicas, dúvidas de permissão HBAC, faturamento ou contratação modular."
      />

      <UnsavedChangesBanner isDirty={isDirty} onDiscard={() => setIsDirty(false)} />

      <form onSubmit={handleSave} onChange={() => setIsDirty(true)} className="card">
        <div className="card-body flex flex-col gap-4">
          <div className="form-grid">
            {scope === 'global' && mode === 'create' && (
              <div className="form-group">
                <label className="form-label" htmlFor="tk-comp">
                  Empresa Solicitante
                </label>
                <select
                  id="tk-comp"
                  className="form-select"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.tradeName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="tk-cat">
                Categoria
              </label>
              <select
                id="tk-cat"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
              >
                <option value="technical">Suporte Técnico</option>
                <option value="access">Acesso & Permissões HBAC</option>
                <option value="billing">Financeiro & Cobrança</option>
                <option value="module_request">Contratação de Módulos</option>
                <option value="general">Dúvida Geral</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="tk-prio">
                Prioridade / SLA
              </label>
              <select
                id="tk-prio"
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
              >
                <option value="low">Baixa (SLA 72h)</option>
                <option value="medium">Média (SLA 48h)</option>
                <option value="high">Alta (SLA 24h)</option>
                <option value="urgent">Urgente (SLA 4h)</option>
              </select>
            </div>
            {mode === 'edit' && (
              <div className="form-group">
                <label className="form-label" htmlFor="tk-status">
                  Estado do Ticket
                </label>
                <select
                  id="tk-status"
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TicketStatus)}
                >
                  <option value="open">Aberto</option>
                  <option value="in_progress">Em Atendimento</option>
                  <option value="waiting_customer">Aguardando Cliente</option>
                  <option value="resolved">Resolvido</option>
                  <option value="closed">Fechado</option>
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="tk-assign">
                Responsável Designado
              </label>
              <select
                id="tk-assign"
                className="form-select"
                value={assignedToUserId}
                onChange={(e) => setAssignedToUserId(e.target.value)}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="tk-subj">
              Assunto do Chamado *
            </label>
            <input
              id="tk-subj"
              className="form-input"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Resumo objetivo da solicitação"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="tk-desc">
              Descrição Detalhada *
            </label>
            <textarea
              id="tk-desc"
              className="form-textarea"
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <div className="card-footer flex justify-between">
          <Link to={baseRoute} className="btn btn-secondary">
            {t('common.cancel')}
          </Link>
          <button type="submit" className="btn btn-primary">
            <Save size={14} />
            Salvar Ticket
          </button>
        </div>
      </form>
    </div>
  );
};

export const TicketDetailPage: React.FC<{ scope: 'global' | 'company' }> = ({ scope }) => {
  const { empresaId, ticketId } = useParams<{ empresaId: string; ticketId: string }>();
  const {
    tickets,
    roles,
    currentUser,
    session,
    isCurrentGlobalStaff,
    hasPermission,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();

  const targetCompanyId = scope === 'company' ? empresaId : undefined;
  const baseRoute =
    scope === 'global' ? '/app/global/tickets' : `/app/empresa/${empresaId}/tickets`;
  const ticket = tickets.find((tk) => tk.id === ticketId);

  const [commentText, setCommentText] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'internal'>('public');

  if (!ticket || (targetCompanyId && ticket.companyId !== targetCompanyId)) {
    return (
      <AccessDeniedView
        reason="Ticket não encontrado ou pertence a outra empresa fora do escopo atual."
        requiredPermission="tickets:view"
      />
    );
  }

  const visibleComments = ticket.comments.filter(
    (c) => c.visibility === 'public' || isCurrentGlobalStaff,
  );

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;
    const activeRoles = getUserActiveRoles(currentUser, roles);
    const roleLabel = activeRoles[0]?.name[session.language] || 'Operador';
    const now = new Date().toISOString();

    await repositories.tickets.update(
      ticket.id,
      (curr) => ({
        ...curr,
        comments: [
          ...curr.comments,
          {
            id: generateId('cmt'),
            authorUserId: currentUser.id,
            authorName: currentUser.name,
            authorRoleLabel: roleLabel,
            visibility: isCurrentGlobalStaff ? visibility : 'public',
            content: commentText.trim(),
            createdAt: now,
          },
        ],
      }),
      getActor(ticket.companyId),
      `Nova mensagem adicionada ao chamado ${ticket.code} (${visibility}).`,
    );
    await refreshData();
    setCommentText('');
    notify({ type: 'success', title: 'Interação registrada no chamado.' });
  };

  const handleQuickStatus = async (newStatus: TicketStatus) => {
    await repositories.tickets.update(
      ticket.id,
      (curr) => ({ ...curr, status: newStatus }),
      getActor(ticket.companyId),
      `Transição de estado do chamado ${ticket.code} para ${newStatus}.`,
    );
    await refreshData();
    notify({ type: 'info', title: `Status atualizado para ${newStatus}.` });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('nav.tickets'), to: baseRoute },
          { label: ticket.code },
        ]}
        title={`${ticket.code} — ${ticket.subject}`}
        subtitle={`Empresa: ${ticket.companyName} • Aberto por ${ticket.openedByUserName}`}
        scopeBadge={ticket.priority.toUpperCase()}
        actions={
          <div className="flex items-center gap-2">
            {hasPermission('tickets', 'edit', targetCompanyId) && (
              <>
                {ticket.status !== 'resolved' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleQuickStatus('resolved')}
                  >
                    Marcar como Resolvido
                  </button>
                )}
                <Link to={`${baseRoute}/${ticket.id}/editar`} className="btn btn-secondary btn-sm">
                  <Edit3 size={14} />
                  Editar
                </Link>
              </>
            )}
          </div>
        }
      />

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Descrição & Metadados do Chamado</h2>
            <StatusBadge status={ticket.status} />
          </div>
          <div className="card-body flex flex-col gap-3">
            <p className="text-sm">{ticket.description}</p>
            <div className="text-xs text-muted flex flex-col gap-1 mt-2">
              <div>
                <strong>Categoria:</strong> {ticket.category}
              </div>
              <div>
                <strong>Responsável:</strong> {ticket.assignedToUserName || 'Fila Geral'}
              </div>
              <div>
                <strong>Prazo SLA:</strong> {formatDateTime(ticket.slaDueAt, session.language)}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Histórico de Interações ({visibleComments.length})</h2>
            <MessageSquare size={16} />
          </div>
          <div className="card-body flex flex-col gap-3">
            {visibleComments.map((cmt) => (
              <div
                key={cmt.id}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background:
                    cmt.visibility === 'internal'
                      ? 'color-mix(in srgb, var(--color-warning) 12%, var(--bg-surface))'
                      : 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex justify-between items-center text-xs mb-1">
                  <strong>
                    {cmt.authorName} ({cmt.authorRoleLabel})
                  </strong>
                  <div className="flex items-center gap-2">
                    {cmt.visibility === 'internal' && (
                      <span className="badge badge-warning">Nota Interna</span>
                    )}
                    <span className="text-muted">
                      {formatDateTime(cmt.createdAt, session.language)}
                    </span>
                  </div>
                </div>
                <p className="text-sm">{cmt.content}</p>
              </div>
            ))}

            {hasPermission('tickets', 'edit', targetCompanyId) && (
              <form onSubmit={handleAddComment} className="flex flex-col gap-2 mt-2">
                <textarea
                  className="form-textarea"
                  rows={3}
                  required
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escreva uma resposta ou orientação técnica..."
                />
                <div className="flex justify-between items-center">
                  {isCurrentGlobalStaff ? (
                    <select
                      className="form-select"
                      style={{ width: 'auto' }}
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as 'public' | 'internal')}
                    >
                      <option value="public">Visível ao Cliente (Público)</option>
                      <option value="internal">Nota Interna da Equipe Global</option>
                    </select>
                  ) : (
                    <span className="text-xs text-muted">Mensagem visível ao suporte</span>
                  )}
                  <button type="submit" className="btn btn-primary btn-sm">
                    <Send size={13} />
                    Enviar Resposta
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AuditListPage: React.FC<{ scope: 'global' | 'company' }> = ({ scope }) => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const { auditEvents, companies, session, hasPermission, t } = useApp();

  const targetCompanyId = scope === 'company' ? empresaId : undefined;
  const company = targetCompanyId ? companies.find((c) => c.id === targetCompanyId) : null;
  const baseRoute =
    scope === 'global' ? '/app/global/auditoria' : `/app/empresa/${empresaId}/auditoria`;

  if (!hasPermission('audit', 'view', targetCompanyId)) {
    return (
      <AccessDeniedView
        reason="Seu papel atual não possui permissão para inspecionar a trilha de auditoria."
        requiredPermission="audit:view"
      />
    );
  }

  const scopedEvents = targetCompanyId
    ? auditEvents.filter((ev) => ev.companyId === targetCompanyId)
    : auditEvents;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          {
            label: scope === 'global' ? t('scope.global') : company?.tradeName || 'Empresa',
            to: scope === 'global' ? '/app/global' : `/app/empresa/${empresaId}`,
          },
          { label: t('nav.audit') },
        ]}
        title="Trilha de Auditoria Forense & Governança Operacional"
        subtitle="Registro cronológico imutável de criações, edições, arquivamentos, alterações HBAC e trocas de contexto."
        scopeBadge={scope === 'global' ? t('scope.global') : company?.tradeName}
      />

      <UrlDataTable<AuditEventEntity>
        tableId={`audit-table-${scope}`}
        caption="Eventos registrados na trilha de auditoria"
        items={scopedEvents}
        defaultSortField="timestamp"
        csvFilename={`auditoria-${scope}.csv`}
        searchPlaceholder="Buscar por ator, ação, resumo, entidade ou Correlation ID..."
        statusExtractor={(ev) => ev.action}
        searchExtractor={(ev) =>
          `${ev.id} ${ev.actorName} ${ev.action} ${ev.summary} ${ev.companyName || ''} ${ev.correlationId}`
        }
        statusOptions={[
          { value: 'create', label: 'Criação (create)' },
          { value: 'update', label: 'Edição (update)' },
          { value: 'archive', label: 'Arquivamento (archive)' },
          { value: 'restore', label: 'Restauração (restore)' },
          { value: 'grant_permission', label: 'Concessão HBAC' },
          { value: 'sign_contract', label: 'Assinatura de Contrato' },
          { value: 'reconcile_payment', label: 'Conciliação Financeira' },
          { value: 'execute_api', label: 'Execução API Hub' },
        ]}
        columns={[
          {
            key: 'timestamp',
            header: 'Data/Hora / Correlation ID',
            sortable: true,
            render: (ev) => (
              <div>
                <Link to={`${baseRoute}/${ev.id}`} className="mono text-xs font-semibold">
                  {formatDateTime(ev.timestamp, session.language)}
                </Link>
                <div className="mono text-xs text-muted">{ev.correlationId}</div>
              </div>
            ),
          },
          {
            key: 'actorName',
            header: 'Ator / Papel',
            sortable: true,
            render: (ev) => (
              <div>
                <div className="font-medium text-sm">{ev.actorName}</div>
                <div className="text-xs text-muted">{ev.actorRole}</div>
              </div>
            ),
          },
          {
            key: 'action',
            header: 'Ação / Módulo',
            sortable: true,
            render: (ev) => (
              <div className="flex flex-col gap-1">
                <span className="badge badge-teal mono">{ev.action}</span>
                <span className="text-xs text-muted uppercase">{ev.module}</span>
              </div>
            ),
          },
          {
            key: 'summary',
            header: 'Resumo da Operação / Empresa',
            render: (ev) => (
              <div>
                <div className="text-sm">{ev.summary}</div>
                <div className="text-xs text-muted">
                  {ev.companyName || 'Escopo Global da Plataforma'}
                </div>
              </div>
            ),
          },
          {
            key: 'details',
            header: 'Inspeção',
            render: (ev) => (
              <Link to={`${baseRoute}/${ev.id}`} className="btn btn-secondary btn-sm">
                Ver Diff JSON
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
};

export const AuditEventDetailPage: React.FC<{ scope: 'global' | 'company' }> = ({ scope }) => {
  const { empresaId, eventoId } = useParams<{ empresaId: string; eventoId: string }>();
  const { auditEvents, session, hasPermission, t } = useApp();

  const targetCompanyId = scope === 'company' ? empresaId : undefined;
  const baseRoute =
    scope === 'global' ? '/app/global/auditoria' : `/app/empresa/${empresaId}/auditoria`;
  const event = auditEvents.find((ev) => ev.id === eventoId);

  if (!hasPermission('audit', 'view', targetCompanyId) || !event) {
    return (
      <AccessDeniedView
        reason="Evento de auditoria não localizado ou fora do escopo autorizado."
        requiredPermission="audit:view"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('nav.audit'), to: baseRoute },
          { label: event.id },
        ]}
        title={`Evento de Auditoria ${event.id}`}
        subtitle={event.summary}
        scopeBadge={event.correlationId}
      />

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Metadados Forenses da Operação</h2>
          <span className="badge badge-teal mono">{event.action}</span>
        </div>
        <div className="card-body grid-3 text-sm">
          <div>
            <div className="text-xs text-muted uppercase">Executado por</div>
            <div className="font-semibold">{event.actorName}</div>
            <div className="text-xs text-muted">{event.actorRole}</div>
          </div>
          <div>
            <div className="text-xs text-muted uppercase">Empresa / Escopo</div>
            <div className="font-semibold">{event.companyName || 'Console Global'}</div>
            <div className="mono text-xs text-muted">
              {event.entityType} ({event.entityId})
            </div>
          </div>
          <div>
            <div className="text-xs text-muted uppercase">Timestamp / Origem</div>
            <div className="mono font-semibold">
              {formatDateTime(event.timestamp, session.language)}
            </div>
            <div className="text-xs text-muted">Canal: {event.origin}</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Estado Anterior (previousValue)</h2>
          </div>
          <div className="card-body">
            <pre className="code-block">
              {event.previousValue
                ? JSON.stringify(event.previousValue, null, 2)
                : '// Sem estado anterior (registro novo ou evento de sessão)'}
            </pre>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Novo Estado Aplicado (newValue)</h2>
          </div>
          <div className="card-body">
            <pre className="code-block">
              {event.newValue
                ? JSON.stringify(event.newValue, null, 2)
                : '// Sem payload de mutação adicional'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CompanyOperationModulePage: React.FC<{
  moduleType: 'inventory' | 'orders' | 'crm';
}> = ({ moduleType }) => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const {
    companies,
    operationalItems,
    session,
    hasPermission,
    isModuleSubscribed,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();

  const company = companies.find((c) => c.id === empresaId);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newQty, setNewQty] = useState(10);
  const [newAmount, setNewAmount] = useState(150);
  const [archiveTarget, setArchiveTarget] = useState<OperationalItemEntity | null>(null);

  const moduleMeta = {
    inventory: {
      moduleCode: 'allin_estoque',
      title: 'Allin Estoque — Controle de SKUs, Saldos e Depósitos',
      subtitle: 'Gestão operacional de itens estocados persistida em IndexedDB e isolada no escopo da empresa ativa.',
      icon: <Package size={16} />,
    },
    orders: {
      moduleCode: 'allin_vendas',
      title: 'Allin Vendas — Pedidos Comerciais & Faturamento Operacional',
      subtitle: 'Registro e acompanhamento de pedidos de clientes com persistência local e trilha de auditoria.',
      icon: <ShoppingCart size={16} />,
    },
    crm: {
      moduleCode: 'allin_crm',
      title: 'Allin CRM — Contas, Oportunidades & Relacionamento',
      subtitle: 'Pipeline comercial e carteira de clientes corporativos da empresa persistidos localmente.',
      icon: <Users size={16} />,
    },
  }[moduleType];

  if (!empresaId || !company) {
    return (
      <AccessDeniedView
        reason="Empresa não identificada no contexto atual."
        requiredPermission={`${moduleType}:view`}
      />
    );
  }

  if (!isModuleSubscribed(empresaId, moduleMeta.moduleCode)) {
    return (
      <AccessDeniedView
        reason={`A empresa ${company.tradeName} não possui o módulo comercial ${moduleMeta.moduleCode} ativo em seu contrato.`}
        requiredPermission={`module:${moduleMeta.moduleCode}`}
      />
    );
  }

  if (!hasPermission(moduleType, 'view', empresaId)) {
    return (
      <AccessDeniedView
        reason={`Seu papel atual não possui a permissão ${moduleType}:view na empresa ${company.tradeName}.`}
        requiredPermission={`${moduleType}:view`}
      />
    );
  }

  const currentItems = operationalItems.filter(
    (item) => item.companyId === empresaId && item.moduleType === moduleType,
  );

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const prefix = moduleType === 'inventory' ? 'SKU' : moduleType === 'orders' ? 'PED' : 'CRM';
    const code = `${prefix}-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    const record: OperationalItemEntity = {
      id: generateId(moduleType),
      companyId: empresaId,
      moduleType,
      code,
      title: newTitle.trim(),
      category: newCategory.trim() || 'Geral',
      quantity: Number(newQty),
      amount: Number(newAmount),
      currency: company.currency,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      archiveMetadata: { isArchived: false },
      changeHistory: [],
    };
    await repositories.operationalItems.create(
      record,
      getActor(empresaId),
      `Registro operacional criado em ${moduleMeta.moduleCode}: ${record.code} — ${record.title}`,
    );
    await refreshData();
    setNewTitle('');
    setNewCategory('');
    notify({ type: 'success', title: `Registro ${record.code} persistido no IndexedDB e auditado.` });
  };

  const handleToggleStatus = async (item: OperationalItemEntity) => {
    const nextStatus = item.status === 'active' ? 'pending' : 'active';
    await repositories.operationalItems.update(
      item.id,
      (curr) => ({ ...curr, status: nextStatus }),
      getActor(empresaId),
      `Estado do registro operacional ${item.code} alterado para ${nextStatus}`,
    );
    await refreshData();
    notify({ type: 'info', title: `Estado de ${item.code} atualizado para ${nextStatus}.` });
  };

  const handleRestore = async (item: OperationalItemEntity) => {
    await repositories.operationalItems.restore(item.id, getActor(empresaId));
    await refreshData();
    notify({ type: 'success', title: `Registro ${item.code} restaurado.` });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: company.tradeName, to: `/app/empresa/${empresaId}` },
          { label: moduleMeta.title.split('—')[0].trim() },
        ]}
        title={moduleMeta.title}
        subtitle={moduleMeta.subtitle}
        scopeBadge={company.tradeName}
      />

      {hasPermission(moduleType, 'create', empresaId) && (
        <form onSubmit={handleAddRecord} className="card">
          <div className="card-header">
            <h2 className="card-title">Novo Registro Operacional Auditado (Persistência IndexedDB)</h2>
            <span className="badge badge-teal">{moduleMeta.moduleCode}</span>
          </div>
          <div className="card-body form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="op-title">
                Descrição / Item / Cliente *
              </label>
              <input
                id="op-title"
                className="form-input"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Informe a identificação do registro..."
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="op-cat">
                Categoria / Etapa
              </label>
              <input
                id="op-cat"
                className="form-input"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Ex.: Linha Premium / Atacado"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="op-qty">
                Quantidade / Volume
              </label>
              <input
                id="op-qty"
                type="number"
                className="form-input"
                value={newQty}
                onChange={(e) => setNewQty(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="op-amt">
                Valor Unitário ou Total ({company.currency})
              </label>
              <div className="flex gap-2 flex-wrap">
                <input
                  id="op-amt"
                  type="number"
                  step="0.01"
                  className="form-input"
                  style={{ flex: 1, minWidth: 120 }}
                  value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                />
                <button type="submit" className="btn btn-primary">
                  <Plus size={14} />
                  Registrar
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      <UrlDataTable<OperationalItemEntity>
        tableId={`op-table-${moduleType}-${empresaId}`}
        caption={moduleMeta.title}
        items={currentItems}
        defaultSortField="updatedAt"
        csvFilename={`${moduleType}-${empresaId}.csv`}
        searchPlaceholder="Buscar por código, descrição ou categoria..."
        statusExtractor={(r) => r.status}
        searchExtractor={(r) => `${r.code} ${r.title} ${r.category}`}
        statusOptions={[
          { value: 'active', label: t('status.active') },
          { value: 'pending', label: t('status.pending') },
          { value: 'archived', label: t('status.archived') },
        ]}
        isArchivedExtractor={(r) => r.archiveMetadata.isArchived}
        onArchiveClick={
          hasPermission(moduleType, 'archive', empresaId) ? (r) => setArchiveTarget(r) : undefined
        }
        onRestoreClick={hasPermission(moduleType, 'archive', empresaId) ? handleRestore : undefined}
        columns={[
          {
            key: 'code',
            header: 'Código / Descrição',
            sortable: true,
            csvValue: (r) => `${r.code} - ${r.title}`,
            render: (r) => (
              <div>
                <span className="mono font-semibold">{r.code}</span>
                <div className="font-medium text-sm">{r.title}</div>
              </div>
            ),
          },
          {
            key: 'category',
            header: 'Categoria',
            render: (r) => <span className="badge badge-neutral">{r.category}</span>,
          },
          {
            key: 'quantity',
            header: 'Qtd / Volume',
            sortable: true,
            isNumeric: true,
            render: (r) => <span className="mono font-semibold">{r.quantity}</span>,
          },
          {
            key: 'amount',
            header: 'Valor Financeiro',
            sortable: true,
            isNumeric: true,
            render: (r) => (
              <span className="font-semibold tabular">
                {formatCurrency(r.amount, r.currency || company.currency, session.language)}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Estado',
            render: (r) => <StatusBadge status={r.status} />,
          },
          {
            key: 'actions',
            header: 'Operação',
            render: (r) =>
              hasPermission(moduleType, 'edit', empresaId) && !r.archiveMetadata.isArchived ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleToggleStatus(r)}
                >
                  Alternar Status
                </button>
              ) : null,
          },
        ]}
      />

      <ArchiveRecordDialog
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        recordTitle={archiveTarget ? `${archiveTarget.code} — ${archiveTarget.title}` : ''}
        onConfirmArchive={async (reason) => {
          if (!archiveTarget) return;
          await repositories.operationalItems.archive(
            archiveTarget.id,
            reason,
            getActor(empresaId),
          );
          await refreshData();
          notify({
            type: 'warning',
            title: `Registro ${archiveTarget.code} arquivado com histórico preservado.`,
          });
        }}
      />
    </div>
  );
};
