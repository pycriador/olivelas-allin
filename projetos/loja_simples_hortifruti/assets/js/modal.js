import { $, el, escapeHtml, formatCurrency, shareProduct, refreshIcons } from './utils.js';
import { resolveStock } from './catalog.js';

/**
 * Modal - product detail dialog
 */
export class ProductModal {
  constructor(catalog, handlers = {}) {
    this.catalog = catalog;
    this.onAddToCart = handlers.onAddToCart;
    this.onToggleFavorite = handlers.onToggleFavorite;
    this.onToast = handlers.onToast;
    this.current = null;

    this.overlay = $('.overlay');
    this.modal = $('.product-modal');
    this.closeBtn = $('.modal__close');

    this._bind();
  }

  _bind() {
    this.closeBtn?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal?.classList.contains('active')) this.close();
    });

    // Browser back/forward navigation support
    window.addEventListener('popstate', (e) => {
      const code = e.state?.productCode || this.getCodeFromUrl();
      if (code) {
        const prod = this.catalog.getProductByCode(code);
        if (prod) this.open(prod, false);
      } else if (this.modal?.classList.contains('active')) {
        this.close(false);
      }
    });
  }

  getCodeFromUrl() {
    const params = new URLSearchParams(location.search);
    const code = params.get('p') || params.get('produto');
    if (code) return code;
    const hash = location.hash.replace(/^#/, '');
    if (hash.startsWith('produto=')) return hash.split('=')[1];
    if (hash && hash.startsWith('HF')) return hash;
    return null;
  }

  open(product, pushHistory = true) {
    this.current = product;
    let selectedOptionIndex = 0;
    let quantity = 1;
    const loja = this.catalog.getLoja();
    let isFavorite = this.catalog.isFavorite(product.codigo);
    const stock = resolveStock(product);

    // Update URL & Title dynamically
    if (pushHistory) {
      const currentCode = this.getCodeFromUrl();
      if (currentCode !== product.codigo) {
        const newUrl = `${location.pathname}?p=${encodeURIComponent(product.codigo)}`;
        history.pushState({ productCode: product.codigo }, '', newUrl);
      }
    }
    document.title = `${product.nome} | ${loja.nome}`;

    const options = product.opcoes_venda && product.opcoes_venda.length > 0 ? product.opcoes_venda : [
      {
        quantidade: product.unidadesPorPacote || 1,
        unidade: product.unidadeVenda || 'unidade',
        preco: product.precoPacote || product.preco || 0,
        descricao_quantidade: product.descricaoUnidade,
      },
    ];

    const contentEl = this.modal.querySelector('.modal__content');
    contentEl.innerHTML = '';

    const img = product.imagem
      ? el('img', { src: resolveImg(product.imagem), alt: product.nome })
      : el('img', { src: 'assets/images/placeholder.svg', alt: product.nome });

    const imageGallery = el('div', { class: 'modal__gallery' }, [
      img,
      el('span', { class: 'modal__gallery-badge' }, product.categoria || ''),
    ]);

    const priceEl = el('div', { class: 'modal__price-box' });
    
    // Quantity controls with stock limitation
    const maxAllowedQty = stock.maxQty || 99;
    const qtyInput = el('span', { class: 'modal-qty__value' }, String(quantity));
    const minusBtn = el('button', { class: 'modal-qty__btn', type: 'button', 'aria-label': 'Diminuir quantidade' }, '−');
    const plusBtn = el('button', { class: 'modal-qty__btn', type: 'button', 'aria-label': 'Aumentar quantidade' }, '+');
    
    if (stock.isOutOfStock) {
      minusBtn.disabled = true;
      plusBtn.disabled = true;
    }

    const qtySelector = el('div', { class: `modal-qty${stock.isOutOfStock ? ' modal-qty--disabled' : ''}` }, [
      el('span', { class: 'modal-qty__label' }, stock.isOutOfStock ? 'Estoque Esgotado' : 'Quantidade:'),
      el('div', { class: 'modal-qty__controls' }, [
        minusBtn,
        qtyInput,
        plusBtn
      ])
    ]);

    const updatePriceAndSpecs = () => {
      const opt = options[selectedOptionIndex];
      const unitPrice = opt.preco;
      const subtotal = unitPrice * quantity;
      const u = opt.descricao_quantidade || `por ${opt.unidade}`;
      
      priceEl.innerHTML = '';
      priceEl.appendChild(el('div', { class: 'modal__price-label' }, [
        el('span', {}, 'Preço Unitário:'),
        el('strong', {}, formatCurrency(unitPrice, loja.moeda) + ` / ${u}`),
      ]));
      priceEl.appendChild(el('div', { class: 'modal__price-total' }, [
        el('span', {}, quantity > 1 ? `Total (${quantity} un.):` : 'Total:'),
        el('strong', { class: 'modal__price-highlight' }, formatCurrency(subtotal, loja.moeda))
      ]));

      // Update unit in specs if needed
      const specUnitVal = document.querySelector('#modal-spec-unit-val');
      if (specUnitVal) {
        specUnitVal.textContent = opt.descricao_quantidade || `${opt.quantidade} ${opt.unidade}`;
      }
    };

    minusBtn.addEventListener('click', () => {
      if (quantity > 1) {
        quantity--;
        qtyInput.textContent = String(quantity);
        plusBtn.disabled = false;
        updatePriceAndSpecs();
      }
    });

    plusBtn.addEventListener('click', () => {
      if (quantity < maxAllowedQty) {
        quantity++;
        qtyInput.textContent = String(quantity);
        if (quantity >= maxAllowedQty) {
          plusBtn.disabled = true;
        }
        updatePriceAndSpecs();
      }
    });

    // Options / Variants card group (only rendered if product has multiple options)
    let optionsContainer = null;
    if (options.length > 1) {
      optionsContainer = el('div', { class: 'modal__options' });
      optionsContainer.appendChild(el('div', { class: 'modal__options-header' }, [
        el('div', { class: 'modal__options-title-group' }, [
          el('i', { 'data-lucide': 'layers' }),
          el('span', { class: 'modal__options-title' }, 'Selecione o Tipo / Embalagem:'),
        ]),
        el('span', { class: 'modal__options-badge' }, `${options.length} tipos disponíveis`)
      ]));
      const optionsList = el('div', { class: 'modal-variants-grid' });
      options.forEach((opt, idx) => {
        const desc = opt.descricao_quantidade || `${opt.quantidade} ${opt.unidade}`;
        const isCurrent = idx === selectedOptionIndex;
        const optBtn = el('button', {
          class: `modal-variant-card${isCurrent ? ' is-active' : ''}`,
          type: 'button',
          'aria-pressed': String(isCurrent),
        }, [
          el('div', { class: 'modal-variant-card__left' }, [
            el('div', { class: 'modal-variant-card__radio' }, [
              el('i', { 'data-lucide': isCurrent ? 'check-circle-2' : 'circle' })
            ]),
            el('div', { class: 'modal-variant-card__info' }, [
              el('span', { class: 'modal-variant-card__name' }, desc),
              el('span', { class: 'modal-variant-card__sub' }, `Preço por ${opt.unidade || 'unidade'}`),
            ]),
          ]),
          el('div', { class: 'modal-variant-card__right' }, [
            el('span', { class: 'modal-variant-card__price' }, formatCurrency(opt.preco, loja.moeda)),
            el('span', { class: 'modal-variant-card__status' }, isCurrent ? 'Selecionado' : 'Escolher'),
          ]),
        ]);
        optBtn.addEventListener('click', () => {
          selectedOptionIndex = idx;
          optionsList.querySelectorAll('.modal-variant-card').forEach((b, i) => {
            const isActive = i === idx;
            b.classList.toggle('is-active', isActive);
            b.setAttribute('aria-pressed', String(isActive));
            const icon = b.querySelector('.modal-variant-card__radio [data-lucide]');
            if (icon) icon.setAttribute('data-lucide', isActive ? 'check-circle-2' : 'circle');
            const status = b.querySelector('.modal-variant-card__status');
            if (status) status.textContent = isActive ? 'Selecionado' : 'Escolher';
          });
          updatePriceAndSpecs();
          refreshIcons();
        });
        optionsList.appendChild(optBtn);
      });
      optionsContainer.appendChild(optionsList);
    }

    const optInitial = options[selectedOptionIndex];
    const unitInitial = optInitial.descricao_quantidade || `${optInitial.quantidade} ${optInitial.unidade}`;
    
    // Complete specifications list sourced directly from JSON
    const specsList = el('div', { class: 'modal-specs-list' }, [
      specItem('Categoria', product.categoria, 'tag'),
      specItem('Código de Ref.', product.codigo, 'hash'),
      specItem('Unidade Selecionada', unitInitial, 'scale', 'modal-spec-unit-val'),
      specItem('Embalagem/Pacote', product.descricaoUnidade || product.unidadesPorPacote, 'package'),
      specItem('Preço de Referência', product.pesoUnitario, 'badge-dollar-sign'),
      specItem('Disponibilidade', product.disponibilidade || loja.disponibilidade_padrao, 'truck'),
      specItem('Procedência', product.procedencia, 'map-pin'),
      specItem('Vigência de Preço', product.vigenciaPreco || product.vigencia_preco || product.vigencia || loja.vigenciaTabela || 'Preços de Hoje', 'calendar'),
      specItem('Formas de Pedido', loja.formas_pedido, 'check-circle'),
    ]);

    // Stock callout notice if special status (concise single-line title)
    let stockNoticeEl = null;
    if (stock.type === 'sob-encomenda') {
      stockNoticeEl = el('div', { class: 'modal-stock-notice modal-stock-notice--info' }, [
        el('i', { 'data-lucide': 'clock' }),
        el('div', { class: 'modal-stock-notice__text' }, [
          el('strong', {}, 'Item Preparado Sob Encomenda'),
        ]),
      ]);
    } else if (stock.type === 'ultimas-unidades') {
      stockNoticeEl = el('div', { class: 'modal-stock-notice modal-stock-notice--warning' }, [
        el('i', { 'data-lucide': 'alert-triangle' }),
        el('div', { class: 'modal-stock-notice__text' }, [
          el('strong', {}, stock.label),
        ]),
      ]);
    } else if (stock.type === 'esgotado') {
      stockNoticeEl = el('div', { class: 'modal-stock-notice modal-stock-notice--danger' }, [
        el('i', { 'data-lucide': 'x-circle' }),
        el('div', { class: 'modal-stock-notice__text' }, [
          el('strong', {}, 'Produto Temporariamente Esgotado'),
        ]),
      ]);
    }

    const botaoAdicionar = el('button', {
      class: `btn ${stock.isOutOfStock ? 'btn-outline btn--disabled' : 'btn-primary'} btn-full`,
      type: 'button',
      disabled: stock.isOutOfStock ? true : undefined,
    }, [
      el('i', { 'data-lucide': stock.isOutOfStock ? 'x-circle' : 'shopping-cart' }),
      stock.isOutOfStock ? 'Produto Esgotado' : 'Adicionar ao Carrinho',
    ]);
    botaoAdicionar.addEventListener('click', () => {
      if (stock.isOutOfStock) return;
      this.onAddToCart?.(product, selectedOptionIndex, quantity);
      this.close();
    });

    const whatsappBtnText = stock.isPreOrder
      ? 'Encomendar no WhatsApp'
      : stock.isOutOfStock
      ? 'Consultar Previsão no WhatsApp'
      : 'Pedir no WhatsApp';

    const botaoWhatsapp = el('button', {
      class: `btn ${stock.isPreOrder ? 'btn-primary' : 'btn-outline'} btn-full`,
      type: 'button'
    }, [
      el('i', { 'data-lucide': 'message-circle' }),
      whatsappBtnText,
    ]);
    botaoWhatsapp.addEventListener('click', () => {
      const opt = options[selectedOptionIndex];
      const subtotal = opt.preco * quantity;
      const prefix = stock.isPreOrder ? 'Gostaria de fazer uma encomenda de' : 'Gostaria de pedir';
      const directMsg = `Olá, ${loja.nome}! ${prefix} *${quantity}x ${product.nome}* (${opt.descricao_quantidade || opt.unidade}) por *${formatCurrency(subtotal, loja.moeda)}*. Código: ${product.codigo}. Status: ${stock.label}.`;
      const url = `https://wa.me/${loja.whatsapp}?text=${encodeURIComponent(directMsg)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    });

    const botaoFav = el('button', {
      class: 'btn btn-ghost modal-fav-btn',
      type: 'button',
      'data-active': String(isFavorite),
      'aria-label': isFavorite ? 'Remover dos favoritos' : 'Favoritar produto',
      title: isFavorite ? 'Remover dos favoritos' : 'Favoritar produto',
    }, [
      el('i', { 'data-lucide': 'heart', 'data-filled': isFavorite ? 'true' : 'false' }),
      el('span', { class: 'modal-fav-btn__text' }, isFavorite ? 'Favorito' : 'Favoritar'),
    ]);
    botaoFav.addEventListener('click', () => {
      const nowFav = this.onToggleFavorite ? this.onToggleFavorite(product) : this.catalog.toggleFavorite(product);
      isFavorite = nowFav;
      botaoFav.setAttribute('data-active', String(nowFav));
      botaoFav.setAttribute('aria-label', nowFav ? 'Remover dos favoritos' : 'Favoritar produto');
      botaoFav.setAttribute('title', nowFav ? 'Remover dos favoritos' : 'Favoritar produto');
      const heart = botaoFav.querySelector('[data-lucide]');
      if (heart) heart.setAttribute('data-filled', nowFav ? 'true' : 'false');
      const txt = botaoFav.querySelector('.modal-fav-btn__text');
      if (txt) txt.textContent = nowFav ? 'Favorito' : 'Favoritar';
      refreshIcons();
    });

    const botaoShare = el('button', { class: 'btn btn-ghost modal-share-btn', type: 'button', 'aria-label': 'Compartilhar produto' }, [
      el('i', { 'data-lucide': 'share-2' }),
      'Compartilhar'
    ]);
    botaoShare.addEventListener('click', () => this._share(product));

    const modalInfoScroll = el('div', { class: 'modal__info-scroll' }, [
      el('div', { class: 'modal__header-info' }, [
        el('div', { class: 'modal__header-top' }, [
          el('span', { class: 'modal__eyebrow' }, product.categoria || ''),
          el('div', { class: 'modal__header-actions' }, [botaoFav, botaoShare]),
        ]),
        el('h2', { class: 'modal__title' }, product.nome || ''),
      ]),
      stockNoticeEl,
      el('p', { class: 'modal__desc' }, product.descricao || loja.descricao || ''),
      optionsContainer,
      qtySelector,
      priceEl,
      specsList,
    ].filter(Boolean));

    const actionsGroup = el('div', { class: 'modal__actions-group' }, [
      botaoAdicionar,
      botaoWhatsapp,
    ]);

    const modalInfo = el('div', { class: 'modal__info' }, [
      modalInfoScroll,
      actionsGroup,
    ]);

    contentEl.appendChild(imageGallery);
    contentEl.appendChild(modalInfo);

    updatePriceAndSpecs();

    this.overlay.classList.add('active');
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    refreshIcons();
  }

  async _share(product) {
    const loja = this.catalog.getLoja();
    const url = `${location.origin}${location.pathname}?p=${encodeURIComponent(product.codigo)}`;
    const text = `${loja.nome} - ${product.nome} (${formatCurrency(product.precoPacote, loja.moeda)})`;
    const shared = await shareProduct(text, url);
    if (shared && this.onToast) {
      this.onToast('Link exclusivo do produto copiado com sucesso!', 'success');
    }
  }

  close(updateHistory = true) {
    if (!this.modal?.classList.contains('active')) return;
    this.overlay.classList.remove('active');
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    this.current = null;

    const loja = this.catalog.getLoja();
    document.title = `${loja.nome} - Catálogo de Hortifruti Fresco`;

    if (updateHistory) {
      const hasParam = this.getCodeFromUrl();
      if (hasParam) {
        history.pushState(null, '', location.pathname);
      }
    }
  }
}

function specItem(label, value, icon = 'info', valId = '') {
  return el('div', { class: 'modal-spec-item' }, [
    el('div', { class: 'modal-spec-item__header' }, [
      el('i', { 'data-lucide': icon }),
      el('span', {}, label),
    ]),
    el('strong', { id: valId || '' }, String(value ?? '')),
  ]);
}

function resolveImg(url) {
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return url;
}
