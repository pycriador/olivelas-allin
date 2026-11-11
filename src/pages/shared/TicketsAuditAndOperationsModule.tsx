import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  Copy,
  Database,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  Filter,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  ShoppingCart,
  Trash2,
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
import { exportRowsToCsv } from '../../services/operationalUtils';
import { isSupabaseConfigured, supabase } from '../../lib/supabase/client';
import {
  AccessDeniedView,
  ActionDropdownMenu,
  ArchiveRecordDialog,
  ModalDialog,
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
  const navigate = useNavigate();

  const [archiveTarget, setArchiveTarget] = useState<TicketEntity | null>(null);
  const [inspectTicket, setInspectTicket] = useState<TicketEntity | null>(null);
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
    <div className="flex flex-col gap-2.5">
      <PageHeader
        breadcrumbs={[
          {
            label: scope === 'global' ? t('scope.global') : company?.tradeName || 'Empresa',
            to: scope === 'global' ? '/app/global' : `/app/empresa/${empresaId}`,
          },
          { label: t('nav.tickets') },
        ]}
        title="Central de Atendimento & Tickets Operacionais"
        subtitle={`Gestão de chamados por empresa, controle de prioridade, SLA e notas internas auditadas • ${scopedTickets.length} chamados registrados`}
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
        columns={[
          {
            key: 'code',
            header: 'Protocolo & Assunto',
            width: '28%',
            sortable: true,
            render: (tk) => (
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link to={`${baseRoute}/${tk.id}`} className="mono font-semibold">
                    {tk.code}
                  </Link>
                  <span className="text-xs text-muted">
                    • {formatDateTime(tk.createdAt, session.language)}
                  </span>
                </div>
                <div className="text-xs font-medium mt-0.5">{tk.subject}</div>
              </div>
            ),
          },
          {
            key: 'companyName',
            header: 'Empresa & Solicitante',
            width: '20%',
            sortable: true,
            render: (tk) => (
              <div>
                <div className="font-semibold text-xs">{tk.companyName}</div>
                <div className="text-xs text-muted">Solicitante: {tk.openedByUserName}</div>
              </div>
            ),
          },
          {
            key: 'category',
            header: 'Categoria & Prioridade',
            width: '15%',
            sortable: true,
            render: (tk) => (
              <div className="flex items-center gap-1.5 flex-wrap">
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
                <span className="badge badge-neutral uppercase text-xs">{tk.category}</span>
              </div>
            ),
          },
          {
            key: 'assignedToUserName',
            header: 'Atendente & Prazo SLA',
            width: '17%',
            render: (tk) => (
              <div>
                <div className="text-xs font-medium">{tk.assignedToUserName || 'Fila Geral'}</div>
                <div className="text-xs text-muted mono">
                  SLA: {formatDateTime(tk.slaDueAt, session.language)}
                </div>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Estado & Interações',
            width: '11%',
            sortable: true,
            render: (tk) => (
              <div className="flex items-center gap-1.5 flex-wrap">
                <StatusBadge status={tk.status} />
                <span className="badge badge-info text-xs">{tk.comments.length} msg</span>
              </div>
            ),
          },
          {
            key: 'actions',
            header: 'Ações',
            width: '9%',
            isNumeric: true,
            render: (tk) => (
              <ActionDropdownMenu
                label="Ações"
                items={[
                  ...(hasPermission('tickets', 'edit', targetCompanyId)
                    ? [
                        {
                          id: 'edit-ticket',
                          label: 'Editar Chamado (ID Único)',
                          icon: <Edit3 size={14} />,
                          variant: 'primary' as const,
                          onClick: () => navigate(`${baseRoute}/${tk.id}/editar`),
                        },
                      ]
                    : []),
                  {
                    id: 'open-ticket',
                    label: `Atender Chamado (${tk.comments.length})`,
                    icon: <MessageSquare size={14} />,
                    onClick: () => navigate(`${baseRoute}/${tk.id}`),
                  },
                  {
                    id: 'quick-inspect',
                    label: 'Ver Resumo Rápido',
                    icon: <Eye size={14} />,
                    onClick: () => setInspectTicket(tk),
                  },
                  ...(hasPermission('tickets', 'archive', targetCompanyId)
                    ? [
                        tk.archiveMetadata.isArchived
                          ? {
                              id: 'restore',
                              label: t('common.restore'),
                              icon: <RotateCcw size={14} />,
                              onClick: async () => {
                                await repositories.tickets.restore(tk.id, getActor(tk.companyId));
                                await refreshData();
                                notify({ type: 'success', title: `Ticket ${tk.code} restaurado.` });
                              },
                            }
                          : {
                              id: 'archive',
                              label: t('common.archive'),
                              icon: <Trash2 size={14} />,
                              variant: 'danger' as const,
                              onClick: () => setArchiveTarget(tk),
                            },
                      ]
                    : []),
                ]}
              />
            ),
          },
        ]}
      />

      {/* Modal: Inspeção Rápida de Ticket (com X) */}
      <ModalDialog
        open={Boolean(inspectTicket)}
        onClose={() => setInspectTicket(null)}
        title={inspectTicket ? `${inspectTicket.code} — ${inspectTicket.subject}` : 'Ticket'}
        description={inspectTicket ? `Empresa: ${inspectTicket.companyName} • Aberto por ${inspectTicket.openedByUserName}` : ''}
        maxWidth="680px"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setInspectTicket(null)}>
              Fechar
            </button>
            {inspectTicket && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const id = inspectTicket.id;
                  setInspectTicket(null);
                  navigate(`${baseRoute}/${id}`);
                }}
              >
                <MessageSquare size={14} /> Abrir Atendimento Completo
              </button>
            )}
          </>
        }
      >
        {inspectTicket && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={inspectTicket.status} />
              <span className="badge badge-warning uppercase">{inspectTicket.priority}</span>
              <span className="badge badge-neutral uppercase">{inspectTicket.category}</span>
              <span className="text-xs text-muted">
                SLA: {formatDateTime(inspectTicket.slaDueAt, session.language)}
              </span>
            </div>
            <div className="card card-body bg-subtle text-sm">
              {inspectTicket.description}
            </div>
            <div className="text-xs text-muted">
              <strong>Histórico de Interações:</strong> {inspectTicket.comments.length} mensagem(ns) registrada(s).
            </div>
          </div>
        )}
      </ModalDialog>

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
  const { auditEvents, companies, session, hasPermission, notify, t } = useApp();
  const navigate = useNavigate();

  const [remoteEvents, setRemoteEvents] = useState<AuditEventEntity[]>([]);
  const [syncingSupabase, setSyncingSupabase] = useState(false);

  // Advanced Audit Filters (inspired by gestao_estoque AuditLogsPage)
  const [filterCompanyId, setFilterCompanyId] = useState<string>('ALL');
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [inspectEvent, setInspectEvent] = useState<AuditEventEntity | null>(null);

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

  const handleSyncFromSupabase = async () => {
    if (!isSupabaseConfigured) return;
    setSyncingSupabase(true);
    try {
      let query = supabase
        .from('allin_audit_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(150);
      if (targetCompanyId) {
        query = query.eq('company_id', targetCompanyId);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        const mapped: AuditEventEntity[] = data.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          timestamp: String(row.timestamp || new Date().toISOString()),
          actorUserId: String(row.actor_user_id || 'usr-super-admin'),
          actorName: String(row.actor_name || 'Operador Supabase'),
          actorRole: String(row.actor_role || 'Super Admin'),
          companyId: row.company_id ? String(row.company_id) : undefined,
          companyName: row.company_name ? String(row.company_name) : undefined,
          module: String(row.module || 'supabase'),
          entityType: String(row.entity_type || 'record'),
          entityId: String(row.entity_id || ''),
          action: (row.action as AuditEventEntity['action']) || 'update',
          origin: (row.origin as AuditEventEntity['origin']) || 'ui',
          correlationId: String(row.correlation_id || 'CORR-SUPA'),
          summary: String(row.summary || 'Evento sincronizado do Supabase'),
          previousValue: (row.previous_value as Record<string, unknown>) || undefined,
          newValue: (row.new_value as Record<string, unknown>) || undefined,
        }));
        setRemoteEvents(mapped);
        notify({
          type: 'success',
          title: 'Trilha de Auditoria Sincronizada',
          description: `${mapped.length} evento(s) carregados de public.allin_audit_events no Supabase PostgreSQL.`,
        });
      }
    } finally {
      setSyncingSupabase(false);
    }
  };

  const mergedEvents = React.useMemo(() => {
    const map = new Map<string, AuditEventEntity>();
    for (const ev of auditEvents) map.set(ev.id, ev);
    for (const rev of remoteEvents) {
      if (!map.has(rev.id)) map.set(rev.id, rev);
    }
    return Array.from(map.values()).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [auditEvents, remoteEvents]);

  const distinctModules = React.useMemo(() => {
    const s = new Set<string>();
    mergedEvents.forEach((e) => {
      if (e.module) s.add(e.module);
    });
    return Array.from(s).sort();
  }, [mergedEvents]);

  const scopedEvents = React.useMemo(() => {
    return mergedEvents.filter((ev) => {
      if (targetCompanyId && ev.companyId !== targetCompanyId) return false;
      if (!targetCompanyId && filterCompanyId !== 'ALL') {
        if (filterCompanyId === 'GLOBAL_ONLY' && ev.companyId) return false;
        if (filterCompanyId !== 'GLOBAL_ONLY' && ev.companyId !== filterCompanyId) return false;
      }
      if (filterModule !== 'ALL' && ev.module !== filterModule) return false;
      if (dateFrom) {
        const d = ev.timestamp.slice(0, 10);
        if (d < dateFrom) return false;
      }
      if (dateTo) {
        const d = ev.timestamp.slice(0, 10);
        if (d > dateTo) return false;
      }
      return true;
    });
  }, [mergedEvents, targetCompanyId, filterCompanyId, filterModule, dateFrom, dateTo]);

  const criticalEventsCount = scopedEvents.filter((ev) =>
    ['grant_permission', 'revoke_permission', 'sign_contract', 'reconcile_payment', 'archive', 'revoke_token'].includes(
      ev.action,
    ),
  ).length;

  const handleExportForensicJson = () => {
    const blob = new Blob([JSON.stringify(scopedEvents, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria-forense-${scope}-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify({
      type: 'info',
      title: 'Exportação JSON Forense Concluída',
      description: `${scopedEvents.length} registros exportados com estado anterior e posterior.`,
    });
  };

  const handleExportAuditCsv = () => {
    exportRowsToCsv(
      `auditoria-forense-${scope}-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'ID Evento',
        'Data/Hora',
        'Correlation ID',
        'Ator',
        'Papel',
        'Ação',
        'Módulo',
        'Empresa / Unidade',
        'Resumo',
      ],
      scopedEvents.map((ev) => [
        ev.id,
        ev.timestamp,
        ev.correlationId,
        ev.actorName,
        ev.actorRole,
        ev.action,
        ev.module,
        ev.companyName || 'Global Plataforma',
        ev.summary,
      ]),
    );
    notify({
      type: 'success',
      title: 'Planilha CSV de Auditoria Exportada',
      description: `${scopedEvents.length} evento(s) exportado(s).`,
    });
  };

  const getActionBadgeClass = (action: string) => {
    if (action === 'create' || action === 'restore' || action === 'sign_contract') return 'badge-success';
    if (action === 'archive' || action === 'revoke_permission' || action === 'revoke_token') return 'badge-danger';
    if (action === 'grant_permission' || action === 'reconcile_payment') return 'badge-teal';
    if (action === 'execute_api') return 'badge-info';
    return 'badge-warning';
  };

  return (
    <div className="flex flex-col gap-2.5">
      <PageHeader
        breadcrumbs={[
          {
            label: scope === 'global' ? t('scope.global') : company?.tradeName || 'Empresa',
            to: scope === 'global' ? '/app/global' : `/app/empresa/${empresaId}`,
          },
          { label: t('nav.audit') },
        ]}
        title="Trilha de Auditoria Forense, Logs de Mutação & Diff JSON (Before / After)"
        subtitle={`${scopedEvents.length} eventos registrados • ${criticalEventsCount} mutações críticas • ${distinctModules.length} módulos monitorados`}
        scopeBadge={scope === 'global' ? t('scope.global') : company?.tradeName}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleSyncFromSupabase}
              disabled={syncingSupabase}
            >
              <RefreshCw size={14} />
              {syncingSupabase ? 'Sincronizando...' : 'Sincronizar Supabase'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportAuditCsv}
            >
              <FileSpreadsheet size={14} />
              Exportar CSV ({scopedEvents.length})
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleExportForensicJson}
            >
              <Download size={14} />
              Exportar JSON Forense ({scopedEvents.length})
            </button>
          </div>
        }
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
        extraFiltersRender={() => (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={13} className="text-muted" />
            {scope === 'global' && (
              <select
                aria-label="Filtrar Empresa ou Filial"
                className="form-select"
                style={{ width: 'auto', minWidth: '155px' }}
                value={filterCompanyId}
                onChange={(e) => setFilterCompanyId(e.target.value)}
              >
                <option value="ALL">Todas as Empresas</option>
                <option value="GLOBAL_ONLY">Apenas Console Global</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tradeName}
                  </option>
                ))}
              </select>
            )}
            <select
              aria-label="Filtrar Módulo"
              className="form-select"
              style={{ width: 'auto', minWidth: '140px' }}
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
            >
              <option value="ALL">Todos os Módulos ({distinctModules.length})</option>
              {distinctModules.map((m) => (
                <option key={m} value={m}>
                  {m.toUpperCase()}
                </option>
              ))}
            </select>
            {(filterCompanyId !== 'ALL' || filterModule !== 'ALL' || dateFrom || dateTo) && (
              <button
                type="button"
                className="btn btn-ghost btn-sm text-xs"
                onClick={() => {
                  setFilterCompanyId('ALL');
                  setFilterModule('ALL');
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                Limpar
              </button>
            )}
          </div>
        )}
        columns={[
          {
            key: 'timestamp',
            header: 'Data/Hora / Ator & Papel',
            width: '25%',
            sortable: true,
            render: (ev) => (
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`${baseRoute}/${ev.id}`} className="mono text-xs font-semibold">
                    {formatDateTime(ev.timestamp, session.language)}
                  </Link>
                  <code className="text-xs text-muted">{ev.correlationId}</code>
                </div>
                <div className="text-xs font-medium mt-0.5">
                  {ev.actorName} <span className="text-xs text-muted">({ev.actorRole})</span>
                </div>
              </div>
            ),
          },
          {
            key: 'action',
            header: 'Ação / Módulo & Escopo',
            width: '22%',
            sortable: true,
            render: (ev) => (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`badge ${getActionBadgeClass(ev.action)} mono`}>{ev.action}</span>
                  <span className="badge badge-neutral text-xs uppercase">{ev.module}</span>
                </div>
                <span className="text-xs text-muted">
                  {ev.companyName || 'Escopo Global da Plataforma'}
                </span>
              </div>
            ),
          },
          {
            key: 'summary',
            header: 'Resumo da Operação',
            width: '43%',
            render: (ev) => (
              <div>
                <div className="text-xs font-medium">{ev.summary}</div>
                <div className="text-xs text-muted mono">
                  Entidade: {ev.entityType} ({ev.entityId}) • Canal: {ev.origin}
                </div>
              </div>
            ),
          },
          {
            key: 'details',
            header: 'Inspeção',
            width: '10%',
            isNumeric: true,
            render: (ev) => (
              <ActionDropdownMenu
                label="Inspecionar"
                items={[
                  {
                    id: 'diff-modal',
                    label: 'Ver Diff Before/After (Modal)',
                    icon: <Eye size={14} />,
                    onClick: () => setInspectEvent(ev),
                  },
                  {
                    id: 'full-page',
                    label: 'Abrir Página Forense',
                    icon: <ShieldCheck size={14} />,
                    onClick: () => navigate(`${baseRoute}/${ev.id}`),
                  },
                  {
                    id: 'copy-json',
                    label: 'Copiar Payload JSON',
                    icon: <Copy size={14} />,
                    onClick: () => {
                      navigator.clipboard?.writeText(JSON.stringify(ev, null, 2));
                      notify({ type: 'info', title: `JSON do evento ${ev.id} copiado!` });
                    },
                  },
                ]}
              />
            ),
          },
        ]}
      />

      {/* Modal: Inspeção de Payload & Diff Lado a Lado (Before vs After JSON) com botão X */}
      <ModalDialog
        open={Boolean(inspectEvent)}
        onClose={() => setInspectEvent(null)}
        title={inspectEvent ? `Inspeção Forense — ${inspectEvent.action.toUpperCase()} (${inspectEvent.correlationId})` : 'Auditoria'}
        description={inspectEvent?.summary}
        maxWidth="920px"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setInspectEvent(null)}>
              Fechar
            </button>
            {inspectEvent && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    navigator.clipboard?.writeText(JSON.stringify(inspectEvent, null, 2));
                    notify({ type: 'info', title: 'Payload forense copiado!' });
                  }}
                >
                  <Copy size={14} /> Copiar JSON Completo
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const id = inspectEvent.id;
                    setInspectEvent(null);
                    navigate(`${baseRoute}/${id}`);
                  }}
                >
                  Abrir Ficha Completa
                </button>
              </>
            )}
          </>
        }
      >
        {inspectEvent && (
          <div className="flex flex-col gap-4">
            <div className="grid-3 text-xs">
              <div className="card card-body">
                <span className="text-muted uppercase block">Executado por</span>
                <strong className="text-sm">{inspectEvent.actorName}</strong>
                <span className="text-muted">{inspectEvent.actorRole}</span>
              </div>
              <div className="card card-body">
                <span className="text-muted uppercase block">Empresa / Entidade</span>
                <strong className="text-sm">{inspectEvent.companyName || 'Console Global'}</strong>
                <code className="mono text-muted">
                  {inspectEvent.entityType} ({inspectEvent.entityId})
                </code>
              </div>
              <div className="card card-body">
                <span className="text-muted uppercase block">Data/Hora &amp; Origem</span>
                <strong className="mono text-sm">
                  {formatDateTime(inspectEvent.timestamp, session.language)}
                </strong>
                <span className="text-muted">Canal: {inspectEvent.origin.toUpperCase()}</span>
              </div>
            </div>

            <div className="grid-2">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title text-xs uppercase">Estado Anterior (Before / previousValue)</h3>
                </div>
                <div className="card-body">
                  <pre className="code-block text-xs">
                    {inspectEvent.previousValue
                      ? JSON.stringify(inspectEvent.previousValue, null, 2)
                      : '// Sem estado anterior (registro novo ou evento de sessão)'}
                  </pre>
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title text-xs uppercase">Novo Estado Aplicado (After / newValue)</h3>
                </div>
                <div className="card-body">
                  <pre className="code-block text-xs">
                    {inspectEvent.newValue
                      ? JSON.stringify(inspectEvent.newValue, null, 2)
                      : '// Sem payload de mutação adicional'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalDialog>
    </div>
  );
};

export const AuditEventDetailPage: React.FC<{ scope: 'global' | 'company' }> = ({ scope }) => {
  const { empresaId, eventoId } = useParams<{ empresaId: string; eventoId: string }>();
  const { auditEvents, session, hasPermission, notify, t } = useApp();

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
        actions={
          <div className="flex items-center gap-2">
            <Link to={baseRoute} className="btn btn-secondary btn-sm">
              Voltar à Trilha
            </Link>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                navigator.clipboard?.writeText(JSON.stringify(event, null, 2));
                notify({
                  type: 'info',
                  title: 'Payload Forense Copiado',
                  description: `O JSON completo do evento ${event.id} foi copiado para a área de transferência.`,
                });
              }}
            >
              <Copy size={14} />
              Copiar JSON Forense
            </button>
          </div>
        }
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
  const { empresaId: routeEmpresaId } = useParams<{ empresaId: string }>();
  const navigate = useNavigate();
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

  const isGlobalScope = !routeEmpresaId;
  const empresaId = routeEmpresaId || session.activeCompanyId || companies[0]?.id || 'emp-olivelas-matriz';
  const company = companies.find((c) => c.id === empresaId);
  const operationBasePrefix = isGlobalScope ? '/app/global/operacao' : `/app/empresa/${empresaId}/operacao`;
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newQty, setNewQty] = useState(10);
  const [newAmount, setNewAmount] = useState(150);
  const [archiveTarget, setArchiveTarget] = useState<OperationalItemEntity | null>(null);
  const [editingItem, setEditingItem] = useState<OperationalItemEntity | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editQty, setEditQty] = useState(1);
  const [editAmount, setEditAmount] = useState(0);

  const moduleMeta = {
    inventory: {
      moduleCode: 'allin_estoque',
      title: 'Allin Estoque — Controle de SKUs, Saldos e Depósitos',
      subtitle: 'Gestão operacional de itens estocados sincronizada no Supabase PostgreSQL e isolada no escopo da empresa ativa.',
      icon: <Package size={16} />,
    },
    orders: {
      moduleCode: 'allin_vendas',
      title: 'Allin Vendas — Pedidos Comerciais & Faturamento Operacional',
      subtitle: 'Registro e acompanhamento de pedidos de clientes com sincronização no Supabase e trilha de auditoria.',
      icon: <ShoppingCart size={16} />,
    },
    crm: {
      moduleCode: 'allin_crm',
      title: 'Allin CRM — Contas, Oportunidades & Relacionamento',
      subtitle: 'Pipeline comercial e carteira de clientes corporativos da empresa sincronizados no Supabase.',
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

  if (!isGlobalScope && !isModuleSubscribed(empresaId, moduleMeta.moduleCode)) {
    return (
      <AccessDeniedView
        reason={`A empresa ${company.tradeName} não possui o módulo comercial ${moduleMeta.moduleCode} ativo em seu contrato.`}
        requiredPermission={`module:${moduleMeta.moduleCode}`}
      />
    );
  }

  if (!hasPermission(moduleType, 'view', isGlobalScope ? undefined : empresaId)) {
    return (
      <AccessDeniedView
        reason={`Seu papel atual não possui a permissão ${moduleType}:view na empresa ${company.tradeName}.`}
        requiredPermission={`${moduleType}:view`}
      />
    );
  }

  const currentItems = isGlobalScope
    ? operationalItems.filter((item) => item.moduleType === moduleType)
    : operationalItems.filter(
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
    setNewModalOpen(false);
    notify({ type: 'success', title: `Registro ${record.code} sincronizado no Supabase e auditado.` });
  };

  const handleOpenEdit = (item: OperationalItemEntity) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditQty(item.quantity);
    setEditAmount(item.amount);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !empresaId) return;
    await repositories.operationalItems.update(
      editingItem.id,
      (curr) => ({
        ...curr,
        title: editTitle.trim(),
        category: editCategory.trim() || 'Geral',
        quantity: Number(editQty),
        amount: Number(editAmount),
      }),
      getActor(empresaId),
      `Edição do registro operacional ${editingItem.code}: ${editTitle.trim()}`,
    );
    await refreshData();
    setEditingItem(null);
    notify({ type: 'success', title: `Registro ${editingItem.code} atualizado com sucesso.` });
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
    <div className="flex flex-col gap-2.5">
      <PageHeader
        breadcrumbs={[
          {
            label: isGlobalScope ? t('scope.global') : company.tradeName,
            to: isGlobalScope ? '/app/global' : `/app/empresa/${empresaId}`,
          },
          { label: moduleMeta.title.split('—')[0].trim() },
        ]}
        title={moduleMeta.title}
        subtitle={`${moduleMeta.subtitle} • ${currentItems.length} registros ativos`}
        scopeBadge={isGlobalScope ? undefined : company.tradeName}
        actions={
          hasPermission(moduleType, 'create', isGlobalScope ? undefined : empresaId) && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setNewModalOpen(true)}>
              <Plus size={14} />
              Novo Registro ({moduleMeta.moduleCode})
            </button>
          )
        }
      />

      <UrlDataTable<OperationalItemEntity>
        tableId={`op-table-${moduleType}-${isGlobalScope ? 'global' : empresaId}`}
        caption={moduleMeta.title}
        items={currentItems}
        defaultSortField="updatedAt"
        csvFilename={`${moduleType}-${isGlobalScope ? 'global' : empresaId}.csv`}
        searchPlaceholder="Buscar por código, descrição ou categoria..."
        statusExtractor={(r) => r.status}
        searchExtractor={(r) => `${r.code} ${r.title} ${r.category}`}
        statusOptions={[
          { value: 'active', label: t('status.active') },
          { value: 'pending', label: t('status.pending') },
          { value: 'archived', label: t('status.archived') },
        ]}
        isArchivedExtractor={(r) => r.archiveMetadata.isArchived}
        columns={[
          {
            key: 'code',
            header: 'Código / Descrição',
            width: '38%',
            sortable: true,
            csvValue: (r) => `${r.code} - ${r.title}`,
            render: (r) => {
              const slug = moduleType === 'inventory' ? 'estoque' : moduleType === 'orders' ? 'vendas' : 'crm';
              return (
                <div>
                  <Link
                    to={`${operationBasePrefix}/${slug}/${r.id}/editar`}
                    className="mono font-semibold"
                    style={{ color: 'var(--brand-primary)' }}
                  >
                    {r.code}
                  </Link>
                  <div className="font-medium text-xs">{r.title}</div>
                </div>
              );
            },
          },
          {
            key: 'category',
            header: 'Categoria',
            width: '20%',
            render: (r) => <span className="badge badge-neutral">{r.category}</span>,
          },
          {
            key: 'quantity',
            header: 'Qtd & Valor',
            width: '20%',
            sortable: true,
            render: (r) => (
              <div className="tabular">
                <div className="font-semibold">
                  {formatCurrency(r.amount, r.currency || company.currency, session.language)}
                </div>
                <div className="text-xs text-muted mono">Qtd: {r.quantity}</div>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Estado',
            width: '12%',
            render: (r) => <StatusBadge status={r.status} />,
          },
          {
            key: 'actions',
            header: 'Ações',
            width: '10%',
            isNumeric: true,
            render: (r) => {
              const slug = moduleType === 'inventory' ? 'estoque' : moduleType === 'orders' ? 'vendas' : 'crm';
              return (
                <ActionDropdownMenu
                  label="Ações"
                  items={[
                    ...(hasPermission(moduleType, 'edit', isGlobalScope ? undefined : empresaId)
                      ? [
                          {
                            id: 'edit-page',
                            label: 'Editar Registro (ID Único)',
                            icon: <Edit3 size={14} />,
                            variant: 'primary' as const,
                            onClick: () => navigate(`${operationBasePrefix}/${slug}/${r.id}/editar`),
                          },
                          {
                            id: 'toggle-status',
                            label: 'Alternar Status',
                            icon: <RotateCcw size={14} />,
                            onClick: () => handleToggleStatus(r),
                          },
                        ]
                      : []),
                    ...(hasPermission(moduleType, 'archive', isGlobalScope ? undefined : empresaId)
                      ? [
                          r.archiveMetadata.isArchived
                            ? {
                                id: 'restore',
                                label: t('common.restore'),
                                icon: <RotateCcw size={14} />,
                                onClick: () => handleRestore(r),
                              }
                            : {
                                id: 'archive',
                                label: t('common.archive'),
                                icon: <Trash2 size={14} />,
                                variant: 'danger' as const,
                                onClick: () => setArchiveTarget(r),
                              },
                        ]
                      : []),
                  ]}
                />
              );
            },
          },
        ]}
      />

      <ModalDialog
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        title={`Novo Registro Operacional — ${moduleMeta.moduleCode}`}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setNewModalOpen(false)}>
              {t('common.cancel')}
            </button>
            <button type="submit" form="new-op-form" className="btn btn-primary">
              <Database size={14} /> Registrar no Supabase
            </button>
          </>
        }
      >
        <form id="new-op-form" onSubmit={handleAddRecord} className="form-grid">
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
            <input
              id="op-amt"
              type="number"
              step="0.01"
              className="form-input"
              value={newAmount}
              onChange={(e) => setNewAmount(Number(e.target.value))}
            />
          </div>
        </form>
      </ModalDialog>

      <ModalDialog
        open={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title={`Editar Registro Operacional — ${editingItem?.code || ''}`}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setEditingItem(null)}>
              {t('common.cancel')}
            </button>
            <button type="submit" form="edit-op-form" className="btn btn-primary">
              <Save size={14} />
              Salvar Alterações
            </button>
          </>
        }
      >
        <form id="edit-op-form" onSubmit={handleSaveEdit} className="flex flex-col gap-3">
          <div className="field">
            <label htmlFor="edit-op-title">Descrição / Item / Cliente *</label>
            <input
              id="edit-op-title"
              className="input"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="edit-op-cat">Categoria / Etapa *</label>
            <input
              id="edit-op-cat"
              className="input"
              required
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
            />
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="edit-op-qty">Quantidade / Volume</label>
              <input
                id="edit-op-qty"
                type="number"
                className="input"
                value={editQty}
                onChange={(e) => setEditQty(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label htmlFor="edit-op-amt">Valor Financeiro ({company.currency})</label>
              <input
                id="edit-op-amt"
                type="number"
                step="0.01"
                className="input"
                value={editAmount}
                onChange={(e) => setEditAmount(Number(e.target.value))}
              />
            </div>
          </div>
        </form>
      </ModalDialog>

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

export const CompanyOperationItemFormPage: React.FC<{
  moduleType: 'inventory' | 'orders' | 'crm';
}> = ({ moduleType }) => {
  const { empresaId: routeEmpresaId, itemId } = useParams<{ empresaId: string; itemId: string }>();
  const navigate = useNavigate();
  const { companies, operationalItems, session, getActor, refreshData, notify, t } = useApp();

  const isGlobalScope = !routeEmpresaId;
  const existing = operationalItems.find((it) =>
    it.id === itemId && (isGlobalScope ? true : it.companyId === routeEmpresaId),
  );
  const empresaId = routeEmpresaId || existing?.companyId || session.activeCompanyId || companies[0]?.id || 'emp-olivelas-matriz';
  const company = companies.find((c) => c.id === empresaId);
  const slug = moduleType === 'inventory' ? 'estoque' : moduleType === 'orders' ? 'vendas' : 'crm';
  const baseRoute = isGlobalScope ? `/app/global/operacao/${slug}` : `/app/empresa/${empresaId}/operacao/${slug}`;

  const [title, setTitle] = useState(existing?.title || '');
  const [category, setCategory] = useState(existing?.category || 'Geral');
  const [quantity, setQuantity] = useState(existing?.quantity ?? 1);
  const [amount, setAmount] = useState(existing?.amount ?? 0);
  const [status, setStatus] = useState<'active' | 'pending' | 'archived'>(existing?.status || 'active');

  if (!company || !existing) {
    return (
      <AccessDeniedView
        title="Registro Operacional Não Localizado"
        reason={`O registro "${itemId}" não foi encontrado na empresa.`}
        backTo={baseRoute}
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await repositories.operationalItems.update(
      existing.id,
      (curr) => ({
        ...curr,
        title: title.trim(),
        category: category.trim() || 'Geral',
        quantity: Number(quantity),
        amount: Number(amount),
        status,
        updatedAt: new Date().toISOString(),
      }),
      getActor(empresaId),
      `Edição dedicada do registro operacional ${existing.code}: ${title.trim()}`,
    );
    await refreshData();
    notify({ type: 'success', title: `Registro ${existing.code} atualizado com sucesso.` });
    navigate(baseRoute);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: company.tradeName, to: `/app/empresa/${empresaId}` },
          { label: slug.toUpperCase(), to: baseRoute },
          { label: `Editar ${existing.code}` },
        ]}
        title={`Editar Registro Operacional — ${existing.code} (ID: ${existing.id})`}
        subtitle="Página dedicada de edição com identificador único e trilha de auditoria."
        actions={
          <Link to={baseRoute} className="btn btn-secondary btn-sm">
            {t('common.back')}
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body grid-2">
          <div className="field">
            <label htmlFor="op-edit-title">Descrição / Item / Cliente *</label>
            <input
              id="op-edit-title"
              className="input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="op-edit-cat">Categoria / Etapa *</label>
            <input
              id="op-edit-cat"
              className="input"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="op-edit-qty">Quantidade / Volume</label>
            <input
              id="op-edit-qty"
              type="number"
              className="input tabular"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="op-edit-amt">Valor Financeiro ({company.currency})</label>
            <input
              id="op-edit-amt"
              type="number"
              step="0.01"
              className="input tabular"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <div className="field">
            <label htmlFor="op-edit-status">Status Operacional</label>
            <select
              id="op-edit-status"
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'pending' | 'archived')}
            >
              <option value="active">Ativo</option>
              <option value="pending">Pendente</option>
            </select>
          </div>
        </div>
        <div className="card-footer">
          <Link to={baseRoute} className="btn btn-secondary">
            {t('common.cancel')}
          </Link>
          <button type="submit" className="btn btn-primary">
            <Save size={14} /> {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
};

