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
    this.scrollToFirstItem();
  }

  setPageSize(size) {
    const newSize = Number(size);
    if (newSize === this.pageSize) return;
    this.pageSize = newSize;
    this.page = 1;
    this.onChange();
    this.scrollToFirstItem();
  }

  /**
   * Smoothly scroll to the first item / top of products section
   * Takes into account sticky header and tools bar height across desktop & mobile.
   */
  scrollToFirstItem() {
    requestAnimationFrame(() => {
      const target = document.querySelector('.products-grid .product-card') ||
                     document.querySelector('.products-grid') ||
                     document.querySelector('#produtos');
      if (!target) return;

      const header = document.querySelector('.header');
      const tools = document.querySelector('.tools');
      const headerHeight = header ? header.offsetHeight : 0;
      const toolsHeight = tools ? tools.offsetHeight : 0;
      const totalOffset = headerHeight + toolsHeight + 16;

      const rect = target.getBoundingClientRect();
      const targetY = rect.top + window.pageYOffset - totalOffset;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth',
      });
    });
  }

  /**
   * Generate page-size options that always keep full rows.
   * On mobile, ensures minimum quantity of items per page is at least 10 (if available in file).
   */
  static sizesFor(cols, total) {
    if (!total || total < 1) return [1];

    // If total items is <= 10, show all available
    if (total <= 10) {
      return [total];
    }

    const opts = new Set();
    
    // Always provide 10 as minimum option when total >= 10
    opts.add(10);

    if (cols <= 2) {
      for (let s = 10; s <= total; s += (cols === 2 ? 4 : 5)) {
        opts.add(s);
      }
    } else {
      const step = cols * 2;
      const start = Math.max(10, Math.ceil(10 / cols) * cols);
      for (let s = start; s <= total; s += step) {
        opts.add(s);
      }
    }

    opts.add(total);
    return Array.from(opts).sort((a, b) => a - b);
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
