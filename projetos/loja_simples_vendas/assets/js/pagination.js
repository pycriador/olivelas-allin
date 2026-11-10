import { $, el } from './utils.js';

/**
 * Pagination - page state and controls rendering
 */
export class Pagination {
  constructor(handlers = {}) {
    this.page = 1;
    this.pageSize = 10;
    this.total = 0;
    this.onChange = handlers.onChange || (() => {});
  }

  /** Total number of pages for the current result count */
  get pageCount() {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  /** Slice a full result list for the current page */
  paginate(list) {
    this.total = list.length;
    const start = (this.page - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  /** Reset to first page and notify */
  reset() {
    this.page = 1;
  }

  setPage(page) {
    if (page < 1 || page > this.pageCount || page === this.page) return;
    this.page = page;
    this.onChange();
  }

  setPageSize(size) {
    const newSize = Number(size);
    if (newSize === this.pageSize) return;
    this.pageSize = newSize;
    this.page = 1;
    this.onChange();
  }

  /**
   * Generate page-size options that always keep full rows.
   * Options are multiples of 2x the number of columns, up to the total.
   * e.g. 4 columns -> 8, 16, 24, 32...
   */
  static sizesFor(cols, total) {
    const step = cols * 2;
    if (!step || step < 1 || total < 1) return [Math.max(1, total)];
    const opts = [];
    for (let s = step; s <= total; s += step) {
      opts.push(s);
    }
    if (opts[opts.length - 1] !== total) opts.push(total);
    return opts;
  }

  /** Render the pagination controls into the container */
  render(container) {
    container.innerHTML = '';
    const pages = this.pageCount;
    if (this.total === 0 || pages <= 1) return;

    const btn = (label, opts = {}) => {
      const b = el('button', {
        class: `page-btn${opts.active ? ' active' : ''}`,
        type: 'button',
        ...(opts.disabled ? { disabled: 'disabled' } : {}),
      }, label);
      if (!opts.disabled) b.addEventListener('click', () => this.setPage(opts.page));
      return b;
    };

    const prev = btn(icon('chevron-left'), { page: this.page - 1, disabled: this.page === 1 });
    prev.setAttribute('aria-label', 'Página anterior');
    container.appendChild(prev);

    const windowed = this._pageWindow();
    windowed.forEach((p) => {
      if (p === '...') {
        container.appendChild(el('span', { class: 'page-ellipsis' }, '…'));
      } else {
        container.appendChild(btn(String(p), { page: p, active: p === this.page }));
      }
    });

    const next = btn(icon('chevron-right'), { page: this.page + 1, disabled: this.page === pages });
    next.setAttribute('aria-label', 'Próxima página');
    container.appendChild(next);

    refreshIcons();
  }

  /** Build a compact page-number list with ellipsis for many pages */
  _pageWindow() {
    const total = this.pageCount;
    const current = this.page;
    const pages = new Set([1, total, current, current - 1, current + 1]);

    const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

    const result = [];
    let prev = 0;
    sorted.forEach((p) => {
      if (p - prev > 1) result.push('...');
      result.push(p);
      prev = p;
    });
    return result;
  }
}

function icon(name) {
  return el('i', { 'data-lucide': name, 'aria-hidden': 'true' });
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}
