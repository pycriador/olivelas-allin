import { $, $$, normalizeText, formatCurrency } from './utils.js';

/**
 * Filters - Category, search, sort, price and favorites
 */
export class Filters {
  constructor(catalog) {
    this.catalog = catalog;
    this.category = 'todos';
    this.search = '';
    this.sort = 'relevancia';
    this.showFavorites = false;
    this.maxPrice = Infinity;
    this.onChange = null;
  }

  /** Build the visible filter bar (categories + controls) */
  mount(container) {
    container.innerHTML = '';
    container.appendChild(this._buildCategories());
    container.appendChild(this._buildControls());
    return container;
  }

  /** Populate the category nav into the DOM */
  renderCategories() {
    this._buildCategories();
  }

  /** Horizontal category nav with "Todos" + each category */
  _buildCategories() {
    const nav = $('.sidebar__nav');
    if (!nav) return;

    // remove any previously injected category buttons (keep title)
    $$('.category-pill', nav).forEach((btn) => btn.remove());

    const pill = (label, slug) => {
      const b = el2('button', {
        class: `category-pill${slug === this.category ? ' active' : ''}`,
        type: 'button',
        dataset: { slug },
      }, label);
      b.addEventListener('click', () => this.setCategory(slug));
      return b;
    };

    nav.appendChild(pill('Todos', 'todos'));
    this.catalog.getCategories().forEach((c) => nav.appendChild(pill(c.nome, c.slug)));

    return nav;
  }

  _buildControls() {
    const sortSelect = $('.sort-select');
    if (sortSelect) {
      sortSelect.value = this.sort;
    }
    return document.createDocumentFragment();
  }

  setCategory(slug) {
    this.category = slug;
    const pills = document.querySelectorAll('.category-pill');
    pills.forEach((p) => {
      p.classList.toggle('active', p.dataset.slug === slug);
    });
    this.onSidebarSelect?.();
    this._notify();
  }

  setSearch(value) {
    this.search = value.trim();
    this._notify();
  }

  setSort(value) {
    this.sort = value;
    this._notify();
  }

  setPrice(maxValue) {
    this.maxPrice = maxValue;
    this._notify();
  }

  setFavorites(active) {
    this.showFavorites = active;
    this._notify();
  }

  /** Apply all filters and sort, return filtered list */
  apply() {
    let list = [...this.catalog.products];

    if (this.category !== 'todos') {
      list = list.filter((p) => p.categoriaSlug === this.category);
    }

    if (this.showFavorites) {
      list = list.filter((p) => this.catalog.isFavorite(p.codigo));
    }

    // Append orphan (removed) favorites as "product not found" markers
    const orphans = this.showFavorites ? this.catalog.getOrphanFavorites() : [];
    if (orphans.length) list = [...list, ...orphans.map((fav) => ({ __orphanFav: fav }))];

    if (this.search) {
      const q = normalizeText(this.search);
      list = list.filter((p) => {
        const inVariants = (p.opcoes_venda || []).some(
          (opt) =>
            normalizeText(opt.descricao_quantidade || '').includes(q) ||
            normalizeText(opt.unidade || '').includes(q)
        );
        return (
          normalizeText(p.nome || '').includes(q) ||
          normalizeText(p.codigo || '').includes(q) ||
          normalizeText(p.categoria || '').includes(q) ||
          normalizeText(p.descricao || '').includes(q) ||
          normalizeText(p.disponibilidade || '').includes(q) ||
          inVariants
        );
      });
    }

    if (this.maxPrice !== Infinity) {
      list = list.filter((p) => p.precoPacote <= this.maxPrice);
    }

    switch (this.sort) {
      case 'menor-preco':
        list.sort((a, b) => a.precoPacote - b.precoPacote);
        break;
      case 'maior-preco':
        list.sort((a, b) => b.precoPacote - a.precoPacote);
        break;
      case 'az':
        list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        break;
      case 'za':
        list.sort((a, b) => b.nome.localeCompare(a.nome, 'pt-BR'));
        break;
      default:
        break;
    }

    return list;
  }

  getStats() {
    const all = this.catalog.products;
    const prices = all.map((p) => p.precoPacote);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      count: all.length,
    };
  }

  _notify() {
    this.onChange?.();
  }
}

/** Local helper mirroring utils.el() to avoid circular import */
function el2(tag, attrs = {}, text = '') {
  const node = document.createElement(tag);
  const { dataset, ...rest } = attrs;
  Object.entries(rest).forEach(([key, value]) => {
    if (key === 'class') node.className = value;
    else node.setAttribute(key, value);
  });
  if (text) node.textContent = text;
  if (dataset) Object.assign(node.dataset, dataset);
  return node;
}
