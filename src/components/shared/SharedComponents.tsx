import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ListQueryParams } from '../../types/domain';
import { queryAndPaginate } from '../../repositories/repositories';
import { exportRowsToCsv } from '../../services/operationalUtils';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const { t } = useApp();
  const normalized = status.toLowerCase();
  let variant = '';
  if (
    ['active', 'paid', 'resolved', 'reconciled', 'allow', '200', '201'].includes(normalized)
  ) {
    variant = 'badge-success';
  } else if (
    ['pending', 'pending_signature', 'in_progress', 'draft', 'beta', 'medium'].includes(normalized)
  ) {
    variant = 'badge-warning';
  } else if (
    ['suspended', 'overdue', 'urgent', 'high', 'revoked', 'expired', 'deny', '401', '403', '422'].includes(
      normalized,
    )
  ) {
    variant = 'badge-danger';
  } else if (['open', 'global', 'company', 'sandbox_mock'].includes(normalized)) {
    variant = 'badge-info';
  }

  const translated = t(`status.${normalized}`);
  const label = translated.startsWith('status.') ? status : translated;

  return <span className={`badge ${variant}`}>{label}</span>;
};

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export const PageHeader: React.FC<{
  breadcrumbs: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  scopeBadge?: string;
  actions?: React.ReactNode;
}> = ({ breadcrumbs, title, subtitle, scopeBadge, actions }) => {
  return (
    <header className="flex flex-col gap-2 pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted flex-wrap">
        {breadcrumbs.map((bc, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span aria-hidden="true">/</span>}
            {bc.to ? (
              <Link to={bc.to} className="text-muted">
                {bc.label}
              </Link>
            ) : (
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {bc.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 style={{ fontSize: '1.35rem' }}>{title}</h1>
            {scopeBadge && <span className="badge badge-teal">{scopeBadge}</span>}
          </div>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </header>
  );
};

/**
 * Native <dialog closedby="any"> wrapper with Safari fallback per modern-web-guidance.
 */
export const ModalDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ open, onClose, title, children, footer }) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', 'true');
      }
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
    }
  }, [open]);

  // Safari fallback for closedby="any"
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleNativeClose = () => {
      onClose();
    };
    dialog.addEventListener('close', handleNativeClose);

    const handleBackdropClick = (e: MouseEvent) => {
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        const rect = dialog.getBoundingClientRect();
        const inDialog =
          rect.top <= e.clientY &&
          e.clientY <= rect.bottom &&
          rect.left <= e.clientX &&
          e.clientX <= rect.right;
        if (!inDialog) {
          dialog.close();
        }
      }
    };
    dialog.addEventListener('click', handleBackdropClick);

    return () => {
      dialog.removeEventListener('close', handleNativeClose);
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby={titleId}
      className="app-dialog"
    >
      <div className="card-header">
        <h2 id={titleId} style={{ fontSize: '1rem' }}>
          {title}
        </h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Fechar">
          <X size={16} />
        </button>
      </div>
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </dialog>
  );
};

export const ArchiveRecordDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  recordTitle: string;
  onConfirmArchive: (reason: string) => Promise<void>;
}> = ({ open, onClose, recordTitle, onConfirmArchive }) => {
  const { t } = useApp();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError('Informe uma justificativa auditável com pelo menos 5 caracteres.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onConfirmArchive(reason.trim());
      setReason('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title={`${t('common.archive')}: ${recordTitle}`}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            form="archive-record-form"
            className="btn btn-danger"
            disabled={submitting}
          >
            <Archive size={15} />
            {t('common.archive')}
          </button>
        </>
      }
    >
      <form id="archive-record-form" onSubmit={handleConfirm} className="flex flex-col gap-3">
        <div
          className="p-3"
          style={{
            backgroundColor: 'var(--status-warning-bg)',
            border: '1px solid var(--status-warning-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem',
            fontSize: '0.8125rem',
          }}
        >
          <strong>Política de Retenção sem Exclusão Física:</strong> O registro{' '}
          <code>{recordTitle}</code> não será apagado do banco de dados. Ele receberá carimbo de
          arquivamento, preservando vínculos contratuais, financeiros e trilha de auditoria.
        </div>
        <div className="field">
          <label htmlFor="archive-reason-input">Motivo do Arquivamento (Obrigatório para Auditoria)</label>
          <p id="archive-reason-hint" className="hint">
            Descreva a razão operacional ou administrativa (mínimo de 5 caracteres).
          </p>
          <textarea
            id="archive-reason-input"
            className="textarea"
            required
            minLength={5}
            aria-describedby="archive-reason-hint"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex.: Encerramento de ciclo operacional ou substituição cadastral..."
          />
          {error && <p className="error">{error}</p>}
        </div>
      </form>
    </ModalDialog>
  );
};

export interface TableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  isNumeric?: boolean;
  render: (item: T) => React.ReactNode;
  csvValue?: (item: T) => string | number | boolean;
}

export function UrlDataTable<T extends { id: string }>({
  tableId,
  caption,
  items,
  columns,
  searchPlaceholder,
  statusOptions,
  statusExtractor,
  searchExtractor,
  csvFilename = 'relatorio-olivelas-allin.csv',
  defaultSortField = 'createdAt',
  extraFiltersRender,
  onArchiveClick,
  onRestoreClick,
  isArchivedExtractor,
}: {
  tableId: string;
  caption: string;
  items: T[];
  columns: TableColumn<T>[];
  searchPlaceholder?: string;
  statusOptions?: { value: string; label: string }[];
  statusExtractor?: (item: T) => string;
  searchExtractor?: (item: T) => string;
  csvFilename?: string;
  defaultSortField?: string;
  extraFiltersRender?: (
    searchParams: URLSearchParams,
    updateParam: (key: string, value: string) => void,
  ) => React.ReactNode;
  onArchiveClick?: (item: T) => void;
  onRestoreClick?: (item: T) => void;
  isArchivedExtractor?: (item: T) => boolean;
}) {
  const { t } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const includeArchived =
    (searchParams.get('includeArchived') as ListQueryParams['includeArchived']) || 'false';
  const sort = searchParams.get('sort') || defaultSortField;
  const order = (searchParams.get('order') as 'asc' | 'desc') || 'desc';
  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('pageSize')) || 10;

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || (key === 'includeArchived' && value === 'false')) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    if (key !== 'page') {
      next.set('page', '1');
    }
    setSearchParams(next, { replace: true });
  };

  const resetAllFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const toggleSort = (colKey: string) => {
    const next = new URLSearchParams(searchParams);
    if (sort === colKey) {
      next.set('order', order === 'asc' ? 'desc' : 'asc');
    } else {
      next.set('sort', colKey);
      next.set('order', 'asc');
    }
    setSearchParams(next, { replace: true });
  };

  const paginated = queryAndPaginate(
    items,
    { search, status, includeArchived, sort, order, page, pageSize },
    (item) => {
      if (status && status !== 'all' && statusExtractor) {
        return statusExtractor(item).toLowerCase() === status.toLowerCase();
      }
      return true;
    },
    searchExtractor,
  );

  const handleExportCsv = () => {
    const headers = columns.map((c) => c.header);
    const rows = paginated.items.map((item) =>
      columns.map((c) => {
        if (c.csvValue) return c.csvValue(item);
        const val = (item as Record<string, unknown>)[c.key];
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          return val;
        }
        return JSON.stringify(val ?? '');
      }),
    );
    exportRowsToCsv(csvFilename, headers, rows);
  };

  // Build inline CSS custom properties for mobile container query labels (--label-1, --label-2...)
  const labelVars: Record<string, string> = {};
  columns.forEach((col, idx) => {
    labelVars[`--label-${idx + 1}`] = `"${col.header}"`;
  });
  if (onArchiveClick || onRestoreClick) {
    labelVars[`--label-${columns.length + 1}`] = `"${t('common.actions')}"`;
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2 flex-wrap" style={{ flex: 1 }}>
          <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 260px', maxWidth: '380px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.65rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
              }}
            />
            <input
              type="search"
              className="input"
              style={{ paddingLeft: '2rem' }}
              value={search}
              onChange={(e) => updateParam('search', e.target.value)}
              placeholder={searchPlaceholder || t('common.search')}
              aria-label={searchPlaceholder || t('common.search')}
            />
          </div>

          {statusOptions && statusOptions.length > 0 && (
            <select
              className="select"
              style={{ width: 'auto', minWidth: '150px' }}
              value={status}
              onChange={(e) => updateParam('status', e.target.value)}
              aria-label={t('common.status')}
            >
              <option value="all">{t('common.status')}: {t('common.all')}</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          <select
            className="select"
            style={{ width: 'auto', minWidth: '165px' }}
            value={includeArchived}
            onChange={(e) => updateParam('includeArchived', e.target.value)}
            aria-label="Filtro de arquivamento"
          >
            <option value="false">{t('common.hideArchived')}</option>
            <option value="true">{t('common.showArchived')}</option>
            <option value="only">{t('common.onlyArchived')}</option>
          </select>

          {extraFiltersRender && extraFiltersRender(searchParams, updateParam)}

          {(search || status !== 'all' || includeArchived !== 'false') && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={resetAllFilters}>
              {t('common.clearFilters')}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportCsv}>
            <Download size={14} />
            {t('common.exportCsv')}
          </button>
        </div>
      </div>

      <div
        tabIndex={0}
        role="region"
        aria-labelledby={tableId}
        className="table-wrapper"
        style={{
          border: 'none',
          borderRadius: 0,
          ...(labelVars as React.CSSProperties),
        }}
      >
        <table className="data-table">
          <caption id={tableId} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
            {caption}
          </caption>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={col.isNumeric ? 'num' : undefined}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        font: 'inherit',
                        color: 'inherit',
                        textTransform: 'inherit',
                        letterSpacing: 'inherit',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      {col.header}
                      {sort === col.key && (order === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
              {(onArchiveClick || onRestoreClick) && (
                <th scope="col" className="num">
                  {t('common.actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginated.items.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onArchiveClick || onRestoreClick ? 1 : 0)}
                  style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}
                >
                  {t('common.noResults')}
                </td>
              </tr>
            ) : (
              paginated.items.map((item) => {
                const isArchived = isArchivedExtractor ? isArchivedExtractor(item) : false;
                return (
                  <tr key={item.id}>
                    {columns.map((col) => (
                      <td key={col.key} className={col.isNumeric ? 'num' : undefined}>
                        {col.render(item)}
                      </td>
                    ))}
                    {(onArchiveClick || onRestoreClick) && (
                      <td className="num">
                        <div className="flex items-center gap-1" style={{ justifyContent: 'flex-end' }}>
                          {isArchived && onRestoreClick ? (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => onRestoreClick(item)}
                            >
                              <RotateCcw size={13} />
                              {t('common.restore')}
                            </button>
                          ) : (
                            !isArchived &&
                            onArchiveClick && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => onArchiveClick(item)}
                              >
                                <Archive size={13} />
                                {t('common.archive')}
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="card-footer">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>
            {t('common.showing')} <strong>{paginated.items.length}</strong> {t('common.of')}{' '}
            <strong className="tabular">{paginated.total}</strong>
          </span>
          <span>•</span>
          <label htmlFor={`${tableId}-pagesize`} className="text-xs">
            {t('common.rowsPerPage')}:
          </label>
          <select
            id={`${tableId}-pagesize`}
            className="select"
            style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
            value={pageSize}
            onChange={(e) => updateParam('pageSize', e.target.value)}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted tabular">
            {t('common.page')} {paginated.page} {t('common.of')} {paginated.totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={paginated.page <= 1}
            onClick={() => updateParam('page', String(paginated.page - 1))}
            aria-label="Página anterior"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={paginated.page >= paginated.totalPages}
            onClick={() => updateParam('page', String(paginated.page + 1))}
            aria-label="Próxima página"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export const AccessDeniedView: React.FC<{
  title?: string;
  reason: string;
  requiredPermission?: string;
  backTo?: string;
}> = ({ title = 'Acesso Restrito pela Governança HBAC / Isolamento Multiempresa', reason, requiredPermission, backTo = '/login' }) => {
  return (
    <div className="card" style={{ maxWidth: '640px', margin: '2rem auto' }}>
      <div className="card-header">
        <div className="flex items-center gap-2" style={{ color: 'var(--status-danger)' }}>
          <ShieldAlert size={20} />
          <h2 style={{ fontSize: '1.05rem', color: 'var(--status-danger)' }}>{title}</h2>
        </div>
        <span className="badge badge-danger">POLÍTICA HBAC ATIVA</span>
      </div>
      <div className="card-body flex flex-col gap-3">
        <p className="text-sm">{reason}</p>
        {requiredPermission && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span className="text-xs text-muted">Regra / Escopo Exigido: </span>
            <code className="text-xs font-semibold">{requiredPermission}</code>
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Link to={backTo} className="btn btn-primary">
            Alternar Perfil ou Contexto Autorizado
          </Link>
          <Link to="/" className="btn btn-secondary">
            Ir para Página Inicial
          </Link>
        </div>
      </div>
    </div>
  );
};

export const UnsavedChangesBanner: React.FC<{
  isDirty: boolean;
  onDiscard: () => void;
}> = ({ isDirty, onDiscard }) => {
  if (!isDirty) return null;
  return (
    <div
      className="flex items-center justify-between gap-2 mb-4"
      style={{
        padding: '0.65rem 1rem',
        backgroundColor: 'var(--status-warning-bg)',
        border: '1px solid var(--status-warning-border)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--status-warning)' }}>
        <AlertTriangle size={16} />
        <span>Existem alterações não salvas neste formulário.</span>
      </div>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onDiscard}>
        Descartar Alterações
      </button>
    </div>
  );
};
