import { el, escapeHtml, formatCurrency, STORAGE_KEYS, readStorage, writeStorage } from './utils.js';

/**
 * Catalog - Data model and grid rendering
 */
export class Catalog {
  constructor() {
    this.data = null;
    this.products = [];
    this.onProductClick = null;
    this.onAddToCart = null;
    this.onToggleFavorite = null;
    this.placeholders = new Set();
    this.favorites = readStorage(STORAGE_KEYS.FAVORITES, []);
  }

  /** Load JSON data with localStorage override support */
  async load() {
    const customData = readStorage(STORAGE_KEYS.CUSTOM_CATALOG, null);
    if (customData && customData.categorias && Array.isArray(customData.categorias)) {
      this.data = customData;
      this._flatten(customData);
      return customData;
    }
    const res = await fetch('data/produtos.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('Falha ao carregar catálogo');
    const json = await res.json();
    this.data = json;
    this._flatten(json);
    return json;
  }

  /** Flatten categories -> flat product list with category props */
  _flatten(json) {
    this.products = [];
    (json.categorias || []).forEach((cat) => {
      (cat.produtos || []).forEach((p) => {
        this.products.push({
          ...p,
          categoria: cat.categoria || cat.nome,
          categoriaSlug: cat.slug,
        });
      });
    });
  }

  /** Get list of categories */
  getCategories() {
    return (this.data.categorias || []).map((c) => ({
      nome: c.categoria || c.nome,
      slug: c.slug
    }));
  }

  getLoja() {
    return this.data.loja || {
      nome: this.data.estabelecimento || 'Hortifruti Natural',
      vigenciaTabela: this.data.observacao || 'Tabela Vigente',
      whatsapp: '5511963820374',
      moeda: this.data.moeda || 'BRL'
    };
  }

  getProductByCode(code) {
    return this.products.find((p) => p.codigo === code);
  }

  /** Generate unique key for a product */
  static key(p) {
    return `${p.codigo}-${p.categoriaSlug}`;
  }

  isFavorite(code) {
    return this.favorites.some((f) => (typeof f === 'object' ? f.codigo === code : f === code));
  }

  toggleFavorite(product) {
    const code = product.codigo;
    const idx = this.favorites.findIndex((f) => (typeof f === 'object' ? f.codigo === code : f === code));
    if (idx >= 0) this.favorites.splice(idx, 1);
    else this.favorites.push({ codigo: code, nome: product.nome });
    writeStorage(STORAGE_KEYS.FAVORITES, this.favorites);
    return this.isFavorite(code);
  }

  /** Favorite codes saved locally (works with old string-only format) */
  getFavoriteIds() {
    return this.favorites.map((f) => (typeof f === 'object' ? f.codigo : f));
  }

  /** Favorites whose product no longer exists in the catalog */
  getOrphanFavorites() {
    return this.favorites.filter((f) => {
      const code = typeof f === 'object' ? f.codigo : f;
      return !this.products.some((p) => p.codigo === code);
    });
  }

  /** Build the placeholder image element */
  _placeholderEl() {
    const img = el('img', {
      src: 'assets/images/placeholder.webp',
      alt: '',
      loading: 'lazy',
      decoding: 'async',
    });
    return img;
  }

  /**
   * Render a single product card.
   * @param {object} product
   * @param {object} opts
   */
  renderCard(product) {
    const loja = this.getLoja();
    const favorite = this.isFavorite(product.codigo);
    const key = Catalog.key(product);
    const price = formatCurrency(product.precoPacote, loja.moeda);
    const stock = resolveStock(product);

    const hasMultipleOptions = product.opcoes_venda && product.opcoes_venda.length > 1;

    const imgContainer = el('div', { class: 'product-card__image' });

    // Category badge on top left of image
    const tagBadge = el('span', { class: 'product-card__badge' }, escapeHtml(product.categoria || ''));
    imgContainer.appendChild(tagBadge);

    // Stock/Availability badge on image (e.g. Sob Encomenda, Última unidade, Esgotado)
    if (stock.type !== 'pronta-entrega') {
      const stockTag = el('span', { class: `product-card__stock-tag ${stock.badgeClass}` }, [
        el('i', { 'data-lucide': stock.icon }),
        el('span', {}, stock.label)
      ]);
      imgContainer.appendChild(stockTag);
    }

    const img = product.imagem
      ? el('img', {
          src: resolveImg(product.imagem),
          alt: product.nome,
          loading: 'lazy',
          decoding: 'async',
        })
      : this._placeholderEl();

    if (product.imagem) {
      img.addEventListener('error', () => {
        if (!this.placeholders.has(key)) {
          this.placeholders.add(key);
          img.replaceWith(this._placeholderEl());
        }
      });
    }

    imgContainer.appendChild(img);

    const favBtn = el(
      'button',
      {
        class: 'product-card__favorite',
        'data-active': String(favorite),
        'aria-label': favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos',
        title: favorite ? 'Remover dos favoritos' : 'Favoritar',
      },
      el('i', { 'data-lucide': 'heart', 'data-filled': favorite ? 'true' : 'false' })
    );
    imgContainer.appendChild(favBtn);

    let buyBtnText = hasMultipleOptions ? 'Opções' : stock.btnText;
    let buyBtnIcon = hasMultipleOptions ? 'layers' : stock.btnIcon;

    // Oba-style Add button with dynamic stock state
    const buyBtn = el(
      'button',
      {
        class: `product-card__buy${stock.isOutOfStock ? ' product-card__buy--disabled' : ''}${stock.isPreOrder ? ' product-card__buy--preorder' : ''}`,
        'aria-label': hasMultipleOptions
          ? `Escolher opções para ${product.nome}`
          : `${buyBtnText} ${product.nome}`,
        disabled: stock.isOutOfStock ? true : undefined,
      },
      [
        el('i', { 'data-lucide': buyBtnIcon }),
        el('span', {}, buyBtnText)
      ]
    );
    buyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (stock.isOutOfStock) return;
      if (hasMultipleOptions || stock.isPreOrder) {
        this.onProductClick?.(product);
      } else {
        this.onAddToCart?.(product);
      }
    });

    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onToggleFavorite?.(product, favBtn);
    });

    const unitText = product.descricaoUnidade || (product.unidadeVenda ? `Por ${product.unidadeVenda}` : '1 un.');

    const card = el('article', {
      class: 'product-card',
      dataset: { code: product.codigo },
      role: 'button',
      tabindex: 0,
      'aria-label': `Ver detalhes de ${product.nome}`,
    }, [
      imgContainer,
      el('div', { class: 'product-card__body' }, [
        el('div', { class: 'product-card__top-info' }, [
          el('span', { class: 'product-card__category' }, product.categoria || ''),
          el('span', { class: 'product-card__code' }, `Ref: ${product.codigo || ''}`),
        ]),
        el('h3', { class: 'product-card__name' }, product.nome || ''),
        el('div', { class: 'product-card__unit-info' }, [
          el('i', { 'data-lucide': 'package' }),
          el('span', {}, unitText),
        ]),
        hasMultipleOptions
          ? el('div', { class: 'product-card__options-indicator' }, [
              el('i', { 'data-lucide': 'check-circle-2' }),
              `${product.opcoes_venda.length} opções de tamanho/unidade`
            ])
          : null,
        el('div', { class: 'product-card__footer' }, [
          el('div', { class: 'product-card__price-wrapper' }, [
            hasMultipleOptions ? el('span', { class: 'product-card__price-prefix' }, 'A partir de') : null,
            el('div', { class: 'product-card__price-main' }, [
              el('span', { class: 'product-card__price' }, price),
              el('span', { class: 'product-card__price-unit' }, `/${product.unidadeVenda || 'un'}`)
            ]),
          ]),
          buyBtn,
        ]),
      ].filter(Boolean)),
    ]);

    card.addEventListener('click', () => this.onProductClick?.(product));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.onProductClick?.(product);
      }
    });

    return card;
  }

  /** Render a card for a saved favorite that no longer exists in the catalog */
  renderMissingCard(fav) {
    const code = typeof fav === 'object' ? fav.codigo : fav;
    const nome = typeof fav === 'object' ? fav.nome : '';

    const imgContainer = el('div', { class: 'product-card__image' });
    imgContainer.appendChild(el('img', {
      src: 'assets/images/placeholder.webp',
      alt: '',
      loading: 'lazy',
      decoding: 'async',
    }));

    const favBtn = el(
      'button',
      {
        class: 'product-card__favorite',
        type: 'button',
        'data-active': 'true',
        'aria-label': 'Remover dos favoritos',
        title: 'Remover dos favoritos',
      },
      el('i', { 'data-lucide': 'heart', 'data-filled': 'true' })
    );
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onToggleFavorite?.({ codigo: code, nome }, favBtn);
    });
    imgContainer.appendChild(favBtn);

    const card = el('article', {
      class: 'product-card product-card--missing',
      dataset: { code },
      'aria-label': `Produto ${nome || code} não localizado`,
    }, [
      imgContainer,
      el('div', { class: 'product-card__body' }, [
        el('span', { class: 'product-card__category' }, 'Produto indisponível'),
        el('h3', { class: 'product-card__name' }, escapeHtml(nome || `Código ${code}`)),
        el('span', { class: 'product-card__code' }, `Código: ${escapeHtml(code)}`),
        el('span', { class: 'product-card__missing' }, 'Produto não localizado'),
      ]),
    ]);

    return card;
  }

  /** Render skeletons while loading */
  renderSkeletons(grid, count = 8) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      frag.appendChild(el('div', { class: 'skeleton-card' }, [
        el('div', { class: 'skeleton-card__image' }),
        el('div', { class: 'skeleton-card__body' }, [
          el('div', { class: 'skeleton-line skeleton-line--sm' }),
          el('div', { class: 'skeleton-line skeleton-line--lg' }),
          el('div', { class: 'skeleton-line skeleton-line--md' }),
          el('div', { class: 'skeleton-line skeleton-line--lg' }),
        ]),
      ]));
    }
    grid.innerHTML = '';
    grid.appendChild(frag);
  }

  render(grid, products) {
    grid.innerHTML = '';
    if (!products.length) return null;
    const frag = document.createDocumentFragment();
    products.forEach((p) => {
      if (p && p.__orphanFav) frag.appendChild(this.renderMissingCard(p.__orphanFav));
      else frag.appendChild(this.renderCard(p));
    });
    grid.appendChild(frag);
    return frag;
  }

  /** Render empty state */
  renderEmpty(grid, filterSummary = {}) {
    grid.innerHTML = '';
    const empty = el('div', { class: 'empty-state' }, [
      el('div', { class: 'empty-state__icon' }, el('i', { 'data-lucide': filterSummary.favorites ? 'heart' : 'search-x' })),
      el('h3', { class: 'empty-state__title' }, filterSummary.favorites ? 'Nenhum favorito ainda' : 'Nenhum produto encontrado'),
      el(
        'p',
        { class: 'empty-state__desc' },
        filterSummary.favorites
          ? 'Marque produtos como favoritos tocando no coração dos cards.'
          : 'Ajuste os filtros ou pesquise por outro termo para encontrar produtos.'
      ),
    ]);
    grid.appendChild(empty);
    return empty;
  }
}

function resolveImg(url) {
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return url;
}

/**
 * Resolve product stock and availability status
 */
export function resolveStock(product) {
  const disp = product.disponibilidade || 'Pronta Entrega';
  const estoque = product.estoque !== undefined && product.estoque !== null ? parseInt(product.estoque, 10) : null;

  if (disp === 'Esgotado' || (estoque !== null && estoque <= 0)) {
    return {
      type: 'esgotado',
      label: 'Esgotado',
      icon: 'x-circle',
      badgeClass: 'product-card__stock-tag--danger',
      isOutOfStock: true,
      isPreOrder: false,
      btnText: 'Esgotado',
      btnIcon: 'x-circle',
    };
  }

  if (disp === 'Sob Encomenda') {
    return {
      type: 'sob-encomenda',
      label: 'Sob Encomenda',
      icon: 'clock',
      badgeClass: 'product-card__stock-tag--info',
      isOutOfStock: false,
      isPreOrder: true,
      btnText: 'Encomendar',
      btnIcon: 'message-circle',
    };
  }

  if (disp === 'Últimas Unidades' || (estoque !== null && estoque > 0 && estoque <= 5)) {
    let label = 'Últimas Unidades';
    if (estoque === 1) {
      label = 'Última unidade!';
    } else if (estoque && estoque > 1 && estoque <= 5) {
      label = `Últimas ${estoque} un.`;
    }
    return {
      type: 'ultimas-unidades',
      label,
      icon: 'alert-triangle',
      badgeClass: 'product-card__stock-tag--warning',
      isOutOfStock: false,
      isPreOrder: false,
      maxQty: estoque,
      btnText: 'Adicionar',
      btnIcon: 'shopping-cart',
    };
  }

  return {
    type: 'pronta-entrega',
    label: 'Pronta Entrega',
    icon: 'check-circle-2',
    badgeClass: 'product-card__stock-tag--success',
    isOutOfStock: false,
    isPreOrder: false,
    btnText: 'Adicionar',
    btnIcon: 'shopping-cart',
  };
}
