import { el, formatCurrency, STORAGE_KEYS, readStorage, writeStorage, refreshIcons, tap } from './utils.js';

/**
 * Cart - LocalStorage-backed shopping cart with sidebar UI
 */
export class Cart {
  constructor(catalog, handlers = {}) {
    this.catalog = catalog;
    this.items = readStorage(STORAGE_KEYS.CART, []);
    this.onChange = handlers.onChange;

    this.sidebar = document.querySelector('.cart');
    this.overlay = document.querySelector('.cart-overlay');
    this.closeBtn = document.querySelector('.cart__close');

    this._bind();
  }

  _bind() {
    this.closeBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  }

  /** Persist and notify */
  _save() {
    writeStorage(STORAGE_KEYS.CART, this.items);
    this.onChange?.();
  }

  add(product, quantity = 1) {
    const key = this.catalog.constructor.key(product);
    const existing = this.items.find((i) => i.key === key);
    if (existing) existing.quantity += quantity;
    else this.items.push({ key, code: product.codigo, quantity });
    this._save();
    this.render();
  }

  updateQuantity(key, delta) {
    const item = this.items.find((i) => i.key === key);
    if (!item) return;
    item.quantity = Math.max(1, item.quantity + delta);
    this._save();
    this.render();
  }

  remove(key) {
    this.items = this.items.filter((i) => i.key !== key);
    this._save();
    this.render();
  }

  clear() {
    this.items = [];
    this._save();
    this.render();
  }

  getCount() {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  getTotal(currency) {
    return this.items.reduce((sum, i) => {
      const p = this.catalog.getProductByCode(i.code);
      return sum + (p ? p.precoPacote * i.quantity : 0);
    }, 0);
  }

  /** Resolve items with full product data */
  resolveItems() {
    return this.items
      .map((i) => {
        const product = this.catalog.getProductByCode(i.code);
        return product ? { ...i, product } : null;
      })
      .filter(Boolean);
  }

  open() {
    this.render();
    this.sidebar.classList.add('active');
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.sidebar.classList.remove('active');
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggle() {
    if (this.sidebar.classList.contains('active')) this.close();
    else this.open();
  }

  /** Render sidebar items */
  render() {
    const loja = this.catalog.getLoja();
    const listEl = document.querySelector('.cart__items');
    listEl.innerHTML = '';

    const resolved = this.resolveItems();

    if (!resolved.length) {
      listEl.appendChild(
        el('div', { class: 'cart__empty' }, [
          el('i', { 'data-lucide': 'shopping-bag' }),
          el('p', { style: 'margin-top:12px' }, 'Seu carrinho está vazio'),
        ])
      );
      this._renderFooter(null);
      refreshIcons();
      return;
    }
    const frag = document.createDocumentFragment();
    resolved.forEach((item) => {
      const img = item.product.imagem
        ? el('img', { class: 'cart__item-img', src: resolveImg(item.product.imagem), alt: item.product.nome, loading: 'lazy' })
        : el('img', { class: 'cart__item-img', src: 'assets/images/placeholder.webp', alt: item.product.nome, loading: 'lazy' });

      const row = el('div', { class: 'cart__item' }, [
        img,
        el('div', { class: 'cart__item-info' }, [
          el('span', { class: 'cart__item-name' }, item.product.nome),
          el('span', { class: 'cart__item-code' }, `Cód. ${item.product.codigo}`),
          el('span', { class: 'cart__item-subtotal' }, formatCurrency(item.product.precoPacote * item.quantity, loja.moeda)),
          el('div', { class: 'cart__item-controls' }, [
            qtyBtn('-', () => this.updateQuantity(item.key, -1)),
            el('span', { class: 'cart__qty' }, String(item.quantity)),
            qtyBtn('+', () => this.updateQuantity(item.key, 1)),
          ]),
        ]),
        el(
          'button',
          { class: 'cart__remove', 'aria-label': 'Remover item', title: 'Remover' },
          el('i', { 'data-lucide': 'trash-2' })
        ),
      ]);
      // attach remove handler
      const removeBtn = row.querySelector('.cart__remove');
      removeBtn.addEventListener('click', () => this.remove(item.key));
      frag.appendChild(row);
    });
    listEl.appendChild(frag);

    this._renderFooter(this.getTotal(loja.moeda), loja.moeda);
    refreshIcons();
  }

  _renderFooter(total, currency) {
    const footer = document.querySelector('.cart__footer');
    if (footer) {
      const totalEl = footer.querySelector('.cart__total-value');
      const text = footer.querySelector('.cart__total-text');
      if (total === null) {
        if (text) text.textContent = 'Total';
        if (totalEl) totalEl.textContent = '—';
        const btn = footer.querySelector('.cart__checkout');
        if (btn) btn.disabled = true;
        const clearBtn = footer.querySelector('.cart__clear');
        if (clearBtn) clearBtn.style.display = 'none';
        return;
      }
      if (totalEl) totalEl.textContent = formatCurrency(total, currency);
      const btn = footer.querySelector('.cart__checkout');
      if (btn) btn.disabled = false;
      const clearBtn = footer.querySelector('.cart__clear');
      if (clearBtn) clearBtn.style.display = '';
    }
  }

  /** Refresh the header badge counter */
  updateBadge(el, count) {
    if (!count) {
      el.textContent = '0';
      return;
    }
    el.textContent = count > 99 ? '99+' : String(count);
  }
}

function qtyBtn(label, onClick) {
  return tap(
    el('button', { class: 'cart__qty-btn', type: 'button', 'aria-label': label === '+' ? 'Aumentar quantidade' : 'Diminuir quantidade' }, label),
    (b) => b.addEventListener('click', onClick)
  );
}

function resolveImg(url) {
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return url;
}
