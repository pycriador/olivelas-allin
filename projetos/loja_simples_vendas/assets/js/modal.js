import { $, el, escapeHtml, formatCurrency, shareProduct, refreshIcons } from './utils.js';

/**
 * Modal - product detail dialog
 */
export class ProductModal {
  constructor(catalog, handlers = {}) {
    this.catalog = catalog;
    this.onAddToCart = handlers.onAddToCart;
    this.current = null;

    this.overlay = $('.overlay');
    this.modal = $('.product-modal');
    this.closeBtn = $('.modal__close');

    this._bind();
  }

  _bind() {
    this.closeBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', () => this.close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  }

  open(product) {
    this.current = product;
    const loja = this.catalog.getLoja();
    const favorite = this.catalog.isFavorite(product.codigo);
    this.updateBookmark(favorite);

    const price = formatCurrency(product.precoPacote, loja.moeda);

    this.modal.querySelector('.modal__content').innerHTML = '';

    const img = product.imagem
      ? el('img', { src: resolveImg(product.imagem), alt: product.nome })
      : el('img', { src: 'assets/images/placeholder.webp', alt: product.nome });

    const botaoAdicionar = el('button', { class: 'btn btn-primary btn-full', type: 'button' }, [
      el('i', { 'data-lucide': 'shopping-cart' }),
      'Adicionar ao carrinho',
    ]);
    botaoAdicionar.addEventListener('click', () => {
      this.onAddToCart?.(product);
      this.close();
    });

    const botaoCompartilhar = el('button', { class: 'btn btn-outline btn-full', type: 'button' }, [
      el('i', { 'data-lucide': 'share-2' }),
      'Compartilhar',
    ]);
    botaoCompartilhar.addEventListener('click', () => this._share(product));

    const body = el('div', { class: 'modal__container' }, [
      el('div', { class: 'modal__image' }, img),
      el('div', { class: 'modal__info' }, [
        el('span', { class: 'modal__category' }, escapeHtml(product.categoria)),
        el('h2', { class: 'modal__title' }, escapeHtml(product.nome)),
        el('span', { class: 'modal__code' }, `Código: ${escapeHtml(product.codigo)}`),
        el('div', { class: 'modal__price' }, [price, el('small', {}, '/ pacote')]),
        el('div', { class: 'modal__details' }, [
          detail('Peso', product.pesoUnitario),
          detail('Quantidade', `${product.unidadesPorPacote} un. p/pacote`),
          detail('Categoria', product.categoria),
        ]),
        el('div', { class: 'modal__actions' }, [botaoAdicionar, botaoCompartilhar]),
      ]),
    ]);

    this.modal.querySelector('.modal__content').appendChild(body);

    this.overlay.classList.add('active');
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    refreshIcons();
  }

  _share(product) {
    const loja = this.catalog.getLoja();
    const url = `${location.origin}${location.pathname}?p=${encodeURIComponent(product.codigo)}`;
    const text = `${loja.nome} - ${product.nome} - ${formatCurrency(product.precoPacote, loja.moeda)}`;
    shareProduct(text, url);
  }

  close() {
    this.overlay.classList.remove('active');
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  updateBookmark(fav) {
    // Placeholder hook reserved for favorites in modal
  }
}

function detail(label, value) {
  return el('div', { class: 'modal__detail' }, [
    el('span', { class: 'modal__detail-label' }, label),
    el('div', { class: 'modal__detail-value' }, escapeHtml(String(value))),
  ]);
}

function resolveImg(url) {
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return url;
}
