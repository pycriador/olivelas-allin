import { Catalog } from './catalog.js';
import { Filters } from './filters.js';
import { Search } from './search.js';
import { ProductModal } from './modal.js';
import { Whatsapp } from './whatsapp.js';
import { Cart } from './cart.js';
import { Pagination } from './pagination.js';
import {
  $,
  $$,
  el,
  debounce,
  STORAGE_KEYS,
  readStorage,
  writeStorage,
  formatCurrency,
  refreshIcons,
} from './utils.js';

/**
 * App - Application bootstrap & orchestration
 */
class App {
  constructor() {
    this.catalog = new Catalog();
    this.filters = null;
    this.whatsapp = null;
    this.cart = null;
    this.modal = null;
    this.pagination = null;
    this.state = {
      favoriteOnly: false,
    };
  }

  async init() {
    try {
      await this.catalog.load();
      this._configureStore();
      this.filters = new Filters(this.catalog);
      this.filters.onChange = () => {
        this.pagination.reset();
        this.render();
      };

      this.pagination = new Pagination({
        onChange: () => this.render(),
      });

      this.whatsapp = new Whatsapp(this.catalog.getLoja().whatsapp);
      this.cart = new Cart(this.catalog, { onChange: () => this._syncCartUI() });
      this.modal = new ProductModal(this.catalog, {
        onAddToCart: (p, optIdx, qty) => this.addToCart(p, optIdx, qty),
        onToggleFavorite: (p) => this.toggleFavorite(p),
        onToast: (msg, type) => this.toast(msg, type),
      });

      this.catalog.onProductClick = (p) => this.modal.open(p);
      this.catalog.onAddToCart = (p) => this.addToCart(p);
      this.catalog.onToggleFavorite = (p, btn) => this.toggleFavorite(p, btn);

      this._mountUI();
      this._syncCartUI();
      this._bindEvents();
      this._renderHero();

      // Handle shared-product deep link (?p=HF001, ?produto=HF001, #HF001)
      const sharedCode = this.modal.getCodeFromUrl();
      if (sharedCode) {
        const product = this.catalog.getProductByCode(sharedCode);
        if (product) {
          setTimeout(() => this.modal.open(product, false), 250);
        }
      }

      this.filters.setCategory('todos');
      this.render();
      this._loadFavoritesView();
      this.hideLoading();
    } catch (err) {
      console.error(err);
      this.toast(`Erro: ${err.message}`, 'error');
      this._renderError(err);
    }
  }

  _configureStore() {
    const loja = this.catalog.getLoja();

    document.title = `${loja.nome} - Catálogo de Hortifruti Fresco`;

    const nameEl = $('.header__name');
    if (nameEl) nameEl.textContent = loja.nome;

    const heroTitle = $('.hero__title');
    if (heroTitle) heroTitle.textContent = loja.nome;

    const heroSubtitle = $('.hero__subtitle');
    if (heroSubtitle) {
      heroSubtitle.textContent = loja.descricao || 'Frutas selecionadas, verduras e legumes frescos direto do produtor.';
    }

    const validBadge = $('.hero__badge-text');
    if (validBadge) validBadge.textContent = loja.slogan || loja.vigenciaTabela || 'Colheita & Produtos Frescos';

    const footerVigencia = $('#footer-vigencia');
    if (footerVigencia) footerVigencia.textContent = loja.vigenciaTabela || 'Preços do Dia';

    const footerName = $('.footer__name');
    if (footerName) footerName.textContent = loja.nome;

    document.documentElement.setAttribute('data-format', loja.moeda || 'BRL');

    // OpenGraph updates
    $('meta[property="og:title"]')?.setAttribute('content', loja.nome);
    $('meta[property="og:description"]')?.setAttribute('content', `Catálogo online de hortifruti ${loja.nome}. Frutas, verduras, legumes e ovos frescos.`);
  }

  _mountUI() {
    // Categories in the sticky tools bar
    this.filters.renderCategories();

    // Sort + price controls
    const tools = $('.tools__controls');
    if (tools) this._buildControls(tools);

    // Product search in the catalog tools bar
    const searchInput = $('#catalog-search-input') || $('.tools__search-input');
    if (searchInput) {
      this.search = new Search(searchInput, (term) => this.filters.setSearch(term));
    }

    // Register PWA service worker
    this._registerSW();
    this._installTheme();
  }

  _buildControls(container) {
    container.innerHTML = '';

    const sortSelect = el(
      'select',
      { class: 'select-control', 'aria-label': 'Ordenar produtos' },
      [
        opt('relevancia', 'Ordenar'),
        opt('menor-preco', 'Mais baratos'),
        opt('maior-preco', 'Mais caros'),
        opt('az', 'A-Z'),
        opt('za', 'Z-A'),
      ]
    );
    sortSelect.value = this.filters.sort;
    sortSelect.addEventListener('change', (e) => {
      this.filters.setSort(e.target.value);
    });

    // Price slider
    const stats = this.filters.getStats();
    this._priceMin = stats.min;
    this._priceMax = stats.max;

    const slider = el('input', {
      type: 'range',
      class: 'price-filter__range',
      min: String(Math.floor(this._priceMin)),
      max: String(Math.ceil(this._priceMax)),
      value: String(Math.ceil(this._priceMax)),
      'aria-label': 'Filtrar por preço máximo',
    });
    slider.addEventListener('input', debounce(() => {
      this.filters.setPrice(Number(slider.value));
      priceLabel.textContent = formatCurrency(this.filters.maxPrice, this.catalog.getLoja().moeda);
    }, 120));

    const priceLabel = el('span', { class: 'price-filter__label' });
    priceLabel.textContent = `até ${formatCurrency(this._priceMax, this.catalog.getLoja().moeda)}`;

    const priceContainer = el('div', { class: 'price-filter' }, [
      el('i', { 'data-lucide': 'filter' }),
      slider,
      priceLabel,
    ]);

    container.appendChild(sortSelect);
    container.appendChild(priceContainer);
    refreshIcons();
  }

  _renderHero() {
    const heroBtn = $('.hero__btn');
    if (heroBtn) {
      heroBtn.addEventListener('click', () => {
        $('.section-products')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  _bindEvents() {
    // Cart toggle
    $('.cart-toggle')?.addEventListener('click', () => this.cart.toggle());

    // Dark mode
    $('.theme-toggle')?.addEventListener('click', () => this.toggleTheme());

    // Categories sidebar drawer (tablet/mobile)
    $('.categories-toggle')?.addEventListener('click', () => this.toggleSidebar());
    $('.sidebar__close')?.addEventListener('click', () => this.closeSidebar());
    $('.sidebar-overlay')?.addEventListener('click', () => this.closeSidebar());
    this._catalogSidebarEl = $('.sidebar');

    // Close the drawer when a category is selected (mobile)
    this.filters.onSidebarSelect = () => {
      if (window.innerWidth <= 768) this.closeSidebar();
    };

    // Favorites filter
    $('.favorites-toggle')?.addEventListener('click', () => {
      this.state.favoriteOnly = !this.state.favoriteOnly;
      this.filters.setFavorites(this.state.favoriteOnly);
    });

    // Items per page selector (smart: options follow grid columns)
    this._setupPageSizeSelect();

    // Checkout
    $('.cart__checkout')?.addEventListener('click', () => this.checkout());

    // Clear cart
    $('.cart__clear')?.addEventListener('click', () => {
      this.cart.clear();
      this.toast('Carrinho limpo', 'info');
    });

    // Back to top
    $('.back-to-top')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', debounce(this._handleScroll, 80));

    // Header scroll shadow
    window.addEventListener('scroll', () => {
      $('.header')?.classList.toggle('scrolled', window.scrollY > 10);
    });

    $('.footer__whatsapp')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openWhatsapp();
    });

    // Reset filters button in empty state (delegated)
    document.addEventListener('click', (e) => {
      if (e.target.closest('.empty-state__reset')) {
        this._resetFilters();
      }
      if (e.target.closest('.cart__checkout')) this.checkout();
    });
  }

  _handleScroll() {
    $('.back-to-top')?.classList.toggle('visible', window.scrollY > 400);
  }

  /** Open the categories drawer (mobile) */
  openSidebar() {
    $('.sidebar')?.classList.add('active');
    $('.sidebar-overlay')?.classList.add('active');
    $('.categories-toggle')?.setAttribute('aria-expanded', 'true');
  }

  /** Close the categories drawer */
  closeSidebar() {
    $('.sidebar')?.classList.remove('active');
    $('.sidebar-overlay')?.classList.remove('active');
    $('.categories-toggle')?.setAttribute('aria-expanded', 'false');
  }

  /** Toggle the categories drawer */
  toggleSidebar() {
    const sidebar = $('.sidebar');
    if (sidebar && sidebar.classList.contains('active')) this.closeSidebar();
    else this.openSidebar();
  }

  /** Render the product grid based on current filters + pagination */
  render() {
    const grid = $('.products-grid');
    if (!grid) return;

    const filtered = this.filters.apply();
    const info = $('.results-info__count');

    if (info) {
      info.textContent = `${filtered.length} produto${filtered.length === 1 ? '' : 's'}`;
    }

    // Clamp current page if it no longer exists (e.g. results reduced)
    this.pagination.total = filtered.length;
    if (this.pagination.page > this.pagination.pageCount) {
      this.pagination.page = this.pagination.pageCount;
    }

    // Rebuild the size selector before paginating so any pageSize
    // adjustment (e.g. on resize) is reflected in the rendered page
    this._rebuildPageSizeOptions();

    const pageList = this.pagination.paginate(filtered);
    this.catalog.render(grid, pageList);

    this.pagination.render($('.pagination'));
    refreshIcons();
  }

  /** Measure how many product cards fit per row from the grid's computed columns */
  _measureColumns() {
    const grid = $('.products-grid');
    if (!grid) return 4;
    const computed = getComputedStyle(grid).gridTemplateColumns;
    const cols = computed ? computed.split(' ').filter((t) => t && t !== 'none').length : 0;
    return cols && cols > 0 ? cols : 4;
  }

  /** (Re)build the items-per-page select based on grid columns and current total */
  _rebuildPageSizeOptions() {
    const select = $('#page-size-select');
    if (!select) return;

    const cols = this._measureColumns();
    const total = Math.max(1, this.pagination.total);
    const options = Pagination.sizesFor(cols, total);

    const current = this.pagination.pageSize;
    // Keep current size if it's still a valid option, otherwise fall back to the first
    if (!options.includes(current)) {
      this.pagination.pageSize = options[0] || total;
      this.pagination.page = 1;
    }

    select.innerHTML = '';
    options.forEach((size) => {
      const opt = el('option', { value: String(size) }, String(size));
      if (size === this.pagination.pageSize) opt.selected = true;
      select.appendChild(opt);
    });
  }

  /** Wire the items-per-page select once */
  _setupPageSizeSelect() {
    const select = $('#page-size-select');
    if (!select) return;

    this._rebuildPageSizeOptions();

    select.addEventListener('change', (e) => {
      this.pagination.setPageSize(e.target.value);
    });

    // Re-measure when the viewport changes (columns may change)
    window.addEventListener('resize', debounce(() => this.render(), 200));
  }

  _loadFavoritesView() {
    // favorites state synced via filters
  }

  /** Sync cart badge and persist state */
  _syncCartUI() {
    const badge = $('.cart-toggle .icon-btn__badge');
    if (badge) this.cart.updateBadge(badge, this.cart.getCount());
  }

  /** Add a product to the cart and notify user */
  addToCart(product, optionIndex = 0, quantity = 1) {
    this.cart.add(product, quantity, optionIndex);
    const opt = (product.opcoes_venda && product.opcoes_venda[optionIndex]) || null;
    const optSuffix = opt && opt.descricao_quantidade ? ` (${opt.descricao_quantidade})` : (opt && opt.unidade ? ` (${opt.unidade})` : '');
    const qtyPrefix = quantity > 1 ? `${quantity}x ` : '';
    this.toast(`${qtyPrefix}${product.nome}${optSuffix} adicionado ao carrinho`, 'success');
  }

  /** Toggle favorite state and refresh current view if favorites-only */
  toggleFavorite(product, btn) {
    const nowFavorite = this.catalog.toggleFavorite(product);
    if (btn) {
      btn.setAttribute('data-active', String(nowFavorite));
      btn.setAttribute('aria-label', nowFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
      const heart = btn.querySelector('[data-lucide]');
      if (heart) heart.setAttribute('data-filled', nowFavorite ? 'true' : 'false');
    }
    if (this.filters.showFavorites) this.render();
    this.toast(
      nowFavorite ? `${product.nome} adicionado aos favoritos` : `${product.nome} removido dos favoritos`,
      'info'
    );
    return nowFavorite;
  }

  checkout() {
    const items = this.cart.resolveItems();
    if (!items.length) {
      this.toast('Seu carrinho está vazio', 'error');
      return;
    }
    const loja = this.catalog.getLoja();
    const message = this.whatsapp.orderMessage(items, this.cart.getTotal(loja.moeda), loja.moeda);
    this.cart.close();
    this.whatsapp.open(message);
  }

  openWhatsapp() {
    const loja = this.catalog.getLoja();
    this.whatsapp.open(`Olá! Gostaria de falar com a ${loja.nome}.`);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    writeStorage(STORAGE_KEYS.THEME, next);
  }

  _installTheme() {
    const saved = readStorage(STORAGE_KEYS.THEME, null);
    const theme = saved === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }

  _registerSW() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      });
    }
  }

  _resetFilters() {
    this.state = { favoriteOnly: false };
    this.filters.setCategory('todos');
    this.filters.search = '';
    this.filters.maxPrice = this.filters.getStats().max;
    this.filters.setSort('relevancia');
    this.filters.setFavorites(false);
    this.search?.clear();
    const priceLabel = $('.price-filter__label');
    if (priceLabel) priceLabel.textContent = `até ${formatCurrency(this.filters.maxPrice, this.catalog.getLoja().moeda)}`;
    const sortSelect = $('.select-control');
    if (sortSelect) sortSelect.value = 'relevancia';
    this.render();
  }

  /** Toast helper */
  toast(message, type = 'success') {
    const container = $('.toast-container');
    if (!container) return;
    const toast = el('div', { class: `toast toast--${type}`, role: 'status' }, message);
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  hideLoading() {
    const screen = $('.loading-screen');
    if (screen) {
      screen.classList.add('hidden');
      setTimeout(() => screen.remove(), 500);
    }
  }

  _renderError(err) {
    const grid = $('.products-grid');
    const screen = $('.loading-screen');
    if (screen) screen.remove();
    if (grid) {
      grid.innerHTML = '';
      grid.appendChild(
        el('div', { class: 'empty-state' }, [
          el('div', { class: 'empty-state__icon' }, el('i', { 'data-lucide': 'cloud-off' })),
          el('h3', { class: 'empty-state__title' }, 'Erro ao carregar o catálogo'),
          el('p', { class: 'empty-state__desc' }, 'Tente recarregar a página em alguns instantes.'),
        ])
      );
    }
  }
}

function opt(value, label) {
  return el('option', { value }, label);
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  window.__app = app;
});
