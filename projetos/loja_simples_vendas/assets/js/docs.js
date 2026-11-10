import {
  $,
  $$,
  normalizeText,
  formatCurrency,
  readStorage,
  writeStorage,
  STORAGE_KEYS,
  copyToClipboard,
  refreshIcons,
} from './utils.js';

/**
 * Docs & Como Funciona - Client Controller & Interactive Simulators
 */
class DocsApp {
  constructor() {
    this.products = [];
    this.loja = null;
    this.selectedSample = [];
  }

  async init() {
    this._installTheme();
    this._bindEvents();
    this._initFAQ();
    this._initTOC();

    try {
      const res = await fetch('data/produtos.json');
      if (res.ok) {
        const json = await res.json();
        this.loja = json.loja;
        this.products = [];
        json.categorias.forEach((cat) => {
          cat.produtos.forEach((p) => {
            this.products.push({ ...p, categoria: cat.categoria, categoriaSlug: cat.slug });
          });
        });
        this._initSearchSimulator();
        this._initOrderSimulator();
      }
    } catch (e) {
      console.warn('Não foi possível carregar produtos para o simulador:', e);
    }

    refreshIcons();
  }

  /* --- Theme System --- */
  _installTheme() {
    const saved = readStorage(STORAGE_KEYS.THEME, null);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    writeStorage(STORAGE_KEYS.THEME, next);
  }

  /* --- Event Listeners --- */
  _bindEvents() {
    $('.theme-toggle')?.addEventListener('click', () => this.toggleTheme());

    // Back to top button
    const btt = $('.back-to-top');
    if (btt) {
      window.addEventListener('scroll', () => {
        btt.classList.toggle('visible', window.scrollY > 400);
      });
      btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // Header scroll shadow
    window.addEventListener('scroll', () => {
      $('.header')?.classList.toggle('scrolled', window.scrollY > 10);
    });
  }

  /* --- FAQ Accordion --- */
  _initFAQ() {
    $$('.docs-accordion__header').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.docs-accordion__item');
        const isOpen = item.classList.contains('open');
        // Close other items
        $$('.docs-accordion__item').forEach((i) => {
          if (i !== item) i.classList.remove('open');
        });
        item.classList.toggle('open', !isOpen);
      });
    });
  }

  /* --- Active Table of Contents on Scroll --- */
  _initTOC() {
    const links = $$('.docs-toc__link');
    const sections = $$('.docs-section');
    if (!links.length || !sections.length) return;

    window.addEventListener('scroll', () => {
      let currentSection = '';
      const scrollPos = window.scrollY + 160;

      sections.forEach((sec) => {
        if (sec.offsetTop <= scrollPos) {
          currentSection = sec.getAttribute('id');
        }
      });

      links.forEach((link) => {
        const href = link.getAttribute('href').replace('#', '');
        link.classList.toggle('active', href === currentSection);
      });
    });
  }

  /* --- Search Normalizer Live Simulator --- */
  _initSearchSimulator() {
    const input = $('#sim-search-input');
    const output = $('#sim-search-output');
    const matchCount = $('#sim-search-count');
    if (!input || !output) return;

    const run = () => {
      const query = input.value.trim();
      const normalized = normalizeText(query);

      if (!query) {
        output.textContent = 'Digite algo acima para ver o processo de normalização NFD e os resultados retornados em tempo real...';
        if (matchCount) matchCount.textContent = '0 encontrados';
        return;
      }

      const matches = this.products.filter((p) => {
        return (
          normalizeText(p.nome).includes(normalized) ||
          normalizeText(p.codigo).includes(normalized) ||
          normalizeText(p.categoria).includes(normalized)
        );
      });

      let text = `1. Termo Original: "${query}"\n`;
      text += `2. Termo Normalizado (NFD sem acentos): "${normalized}"\n`;
      text += `3. Total de Produtos no Catálogo: ${this.products.length}\n`;
      text += `4. Produtos Encontrados: ${matches.length}\n\n`;
      text += `--- Primeiros Resultados Correspondentes ---\n`;

      matches.slice(0, 5).forEach((p, idx) => {
        text += `[${idx + 1}] Cód: ${p.codigo} | ${p.nome} | ${p.categoria} | ${formatCurrency(p.precoPacote, 'BRL')}\n`;
      });

      if (matches.length > 5) {
        text += `... e mais ${matches.length - 5} produtos correspondentes.\n`;
      }

      output.textContent = text;
      if (matchCount) matchCount.textContent = `${matches.length} encontrado${matches.length === 1 ? '' : 's'}`;
    };

    input.addEventListener('input', run);
    run();
  }

  /* --- Order Message Simulator --- */
  _initOrderSimulator() {
    const select = $('#sim-order-select');
    const qtyInput = $('#sim-order-qty');
    const addBtn = $('#sim-order-add');
    const clearBtn = $('#sim-order-clear');
    const output = $('#sim-order-output');
    const copyBtn = $('#sim-order-copy');
    const waLink = $('#sim-order-whatsapp');

    if (!select || !output) return;

    // Populate select with top items
    select.innerHTML = '';
    this.products.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.codigo;
      opt.textContent = `${p.codigo} - ${p.nome} (${formatCurrency(p.precoPacote, 'BRL')})`;
      select.appendChild(opt);
    });

    // Default sample selection
    this.selectedSample = [
      { product: this.products[0] || { codigo: '00006', nome: 'Pão de Batata Sem Recheio', precoPacote: 33.5 }, quantity: 2 },
      { product: this.products[2] || { codigo: '00037', nome: 'Pão de Batata Calabresa', precoPacote: 50.5 }, quantity: 1 },
    ];

    const updateMessage = () => {
      if (!this.selectedSample.length) {
        output.textContent = 'Adicione itens acima para gerar a simulação da mensagem de pedido do WhatsApp...';
        if (waLink) waLink.style.display = 'none';
        return;
      }

      const total = this.selectedSample.reduce((sum, item) => sum + item.product.precoPacote * item.quantity, 0);
      const lines = ['Olá!', '', 'Gostaria de realizar o seguinte pedido:', ''];

      this.selectedSample.forEach((item, i) => {
        lines.push(`${i + 1}. ${item.product.nome}`);
        lines.push(`   Código: ${item.product.codigo}`);
        lines.push(`   Quantidade: ${item.quantity}`);
        lines.push('');
      });

      lines.push(`Total estimado: ${formatCurrency(total, 'BRL')}`);
      lines.push('');
      lines.push('Gostaria de confirmar o pedido.');

      const fullMessage = lines.join('\n');
      output.textContent = fullMessage;

      if (waLink && this.loja) {
        waLink.style.display = 'inline-flex';
        waLink.href = `https://wa.me/${this.loja.whatsapp}?text=${encodeURIComponent(fullMessage)}`;
      }
    };

    addBtn?.addEventListener('click', () => {
      const code = select.value;
      const qty = Math.max(1, parseInt(qtyInput?.value || '1', 10));
      const p = this.products.find((prod) => prod.codigo === code);
      if (p) {
        const existing = this.selectedSample.find((item) => item.product.codigo === code);
        if (existing) existing.quantity += qty;
        else this.selectedSample.push({ product: p, quantity: qty });
        updateMessage();
      }
    });

    clearBtn?.addEventListener('click', () => {
      this.selectedSample = [];
      updateMessage();
    });

    copyBtn?.addEventListener('click', async () => {
      const text = output.textContent;
      if (text) {
        await copyToClipboard(text);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copiado!';
        setTimeout(() => (copyBtn.textContent = originalText), 2000);
      }
    });

    updateMessage();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const docs = new DocsApp();
  docs.init();
  window.__docsApp = docs;
});
