import {
  STORAGE_KEYS,
  readStorage,
  writeStorage,
  formatCurrency,
  $,
  $$,
  debounce
} from '../assets/js/utils.js';

class AdminApp {
  constructor() {
    this.data = null;
    this.products = [];
    this.searchTerm = '';
    this.categoryFilter = '';
    this.stockFilter = '';
    this.sortBy = 'codigo-asc';
    this.productToDelete = null;

    // Pagination State
    this.currentPage = 1;
    this.itemsPerPage = 12;

    this.init();
  }

  async init() {
    this.initTheme();
    await this.loadData();
    this.initSvgGallery();
    this.bindEvents();
    this.render();
  }

  /* --- Theme Handling --- */
  initTheme() {
    const saved = readStorage(STORAGE_KEYS.THEME, null);
    const savedTheme = saved === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);

    $('#btn-theme-toggle')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      writeStorage(STORAGE_KEYS.THEME, next);
      this.updateThemeIcon(next);
    });
  }

  updateThemeIcon(theme) {
    const iconBtn = $('#btn-theme-toggle');
    if (!iconBtn) return;
    iconBtn.innerHTML = theme === 'dark'
      ? '<i data-lucide="sun"></i>'
      : '<i data-lucide="moon"></i>';
    this.refreshIcons();
  }

  /* --- Data Loading & Flattening --- */
  async loadData() {
    try {
      const customData = readStorage(STORAGE_KEYS.CUSTOM_CATALOG, null);
      if (customData && customData.categorias && Array.isArray(customData.categorias)) {
        this.data = customData;
        this.updateStorageBadge(true);
      } else {
        const res = await fetch('../data/produtos.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error('Erro ao carregar dados do catálogo');
        this.data = await res.json();
        this.updateStorageBadge(false);
      }
      this.syncProductsList();
    } catch (err) {
      console.error('Falha ao inicializar dados administrativos:', err);
      this.showToast('Erro ao carregar dados do catálogo.', 'error');
    }
  }

  updateStorageBadge(isCustom) {
    const textEl = $('#storage-status-text');
    if (textEl) {
      textEl.textContent = isCustom
        ? 'Dados Editados (LocalStorage)'
        : 'Padrão do Servidor';
    }
  }

  syncProductsList() {
    this.products = [];
    (this.data.categorias || []).forEach((cat) => {
      (cat.produtos || []).forEach((p) => {
        this.products.push({
          ...p,
          categoria: cat.categoria || cat.nome,
          categoriaSlug: cat.slug || this.slugify(cat.categoria || cat.nome),
        });
      });
    });
  }

  saveData() {
    writeStorage(STORAGE_KEYS.CUSTOM_CATALOG, this.data);
    this.updateStorageBadge(true);
    this.syncProductsList();
    this.render();
  }

  slugify(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  /* --- SVG Gallery Quick Picker --- */
  initSvgGallery() {
    const galleryContainer = $('#svg-gallery-picker');
    if (!galleryContainer) return;

    galleryContainer.innerHTML = '';
    for (let i = 1; i <= 33; i++) {
      const numStr = String(i).padStart(3, '0');
      const relPath = `assets/images/products/hf${numStr}.svg`;
      const fullPath = `../${relPath}`;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'svg-thumb-btn';
      btn.title = `Selecionar HF${numStr}`;
      btn.innerHTML = `<img src="${fullPath}" alt="HF${numStr}" loading="lazy" />`;
      btn.addEventListener('click', () => {
        $('#p-imagem').value = relPath;
        const imgPrev = $('#image-preview-el');
        if (imgPrev) imgPrev.src = fullPath;
        galleryContainer.querySelectorAll('.svg-thumb-btn').forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
      });
      galleryContainer.appendChild(btn);
    }
  }

  /* --- Event Listeners Binding --- */
  bindEvents() {
    // Modal Tab Switching
    $$('.modal-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        if (!tabId) return;

        $$('.modal-tab-btn').forEach((b) => b.classList.remove('is-active'));
        $$('.modal-tab-content').forEach((c) => c.classList.remove('is-active'));

        btn.classList.add('is-active');
        $(`#${tabId}`)?.classList.add('is-active');
        this.refreshIcons();
      });
    });

    // Search input
    const searchInput = $('#admin-search-input');
    const searchClear = $('#admin-search-clear');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.searchTerm = e.target.value.trim().toLowerCase();
        if (searchClear) searchClear.style.display = this.searchTerm ? 'flex' : 'none';
        this.currentPage = 1;
        this.renderTable();
      }, 150));
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        this.searchTerm = '';
        searchClear.style.display = 'none';
        this.currentPage = 1;
        this.renderTable();
      });
    }

    // Filters & Sorting
    $('#filter-category')?.addEventListener('change', (e) => {
      this.categoryFilter = e.target.value;
      this.currentPage = 1;
      this.renderTable();
    });

    $('#filter-stock')?.addEventListener('change', (e) => {
      this.stockFilter = e.target.value;
      this.currentPage = 1;
      this.renderTable();
    });

    $('#admin-sort')?.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.renderTable();
    });

    $('#btn-clear-filters')?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      this.searchTerm = '';
      this.categoryFilter = '';
      this.stockFilter = '';
      const catSel = $('#filter-category');
      if (catSel) catSel.value = '';
      const stockSel = $('#filter-stock');
      if (stockSel) stockSel.value = '';
      this.currentPage = 1;
      this.renderTable();
    });

    // Pagination Listeners
    $('#admin-per-page')?.addEventListener('change', (e) => {
      const val = e.target.value;
      this.itemsPerPage = val === 'all' ? 9999 : parseInt(val, 10);
      this.currentPage = 1;
      this.renderTable();
    });

    $('#btn-page-prev')?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderTable();
        this.scrollToTable();
      }
    });

    $('#btn-page-next')?.addEventListener('click', () => {
      const totalPages = this.getTotalPages();
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.renderTable();
        this.scrollToTable();
      }
    });

    // Product Modal
    $('#btn-add-product')?.addEventListener('click', () => this.openProductModal('create'));
    $('#btn-close-product-modal')?.addEventListener('click', () => this.closeModal('product-modal-overlay'));
    $('#btn-cancel-product')?.addEventListener('click', () => this.closeModal('product-modal-overlay'));
    $('#product-form')?.addEventListener('submit', (e) => this.handleSaveProduct(e));
    $('#btn-add-variant')?.addEventListener('click', () => this.addVariantRow());

    // Image preview live update
    $('#p-imagem')?.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      const img = $('#image-preview-el');
      if (img) {
        img.src = val ? (val.startsWith('http') || val.startsWith('data:') ? val : `../${val}`) : '../assets/images/favicon.svg';
      }
    });

    // SKU live update in modal title tag
    $('#p-codigo')?.addEventListener('input', (e) => {
      const tag = $('#product-modal-sku-tag');
      if (tag) tag.textContent = e.target.value.trim() || 'NOVO';
    });

    // New Category Modal
    $('#btn-new-category')?.addEventListener('click', () => this.openModal('category-modal-overlay'));
    $('#btn-close-category-modal')?.addEventListener('click', () => this.closeModal('category-modal-overlay'));
    $('#btn-cancel-category')?.addEventListener('click', () => this.closeModal('category-modal-overlay'));
    $('#category-form')?.addEventListener('submit', (e) => this.handleCreateCategory(e));

    // Store Settings Modal
    $('#btn-store-settings')?.addEventListener('click', () => this.openStoreModal());
    $('#btn-close-store-modal')?.addEventListener('click', () => this.closeModal('store-modal-overlay'));
    $('#btn-cancel-store')?.addEventListener('click', () => this.closeModal('store-modal-overlay'));
    $('#store-form')?.addEventListener('submit', (e) => this.handleSaveStore(e));

    // Delete Modal
    $('#btn-close-delete-modal')?.addEventListener('click', () => this.closeModal('delete-modal-overlay'));
    $('#btn-cancel-delete')?.addEventListener('click', () => this.closeModal('delete-modal-overlay'));
    $('#btn-confirm-delete')?.addEventListener('click', () => this.handleConfirmDelete());

    // Download & Upload JSON
    $('#btn-download-json')?.addEventListener('click', () => this.downloadJSON());
    $('#btn-upload-json')?.addEventListener('click', () => $('#json-file-input')?.click());
    $('#json-file-input')?.addEventListener('change', (e) => this.handleUploadJSON(e));

    // Reset Data
    $('#btn-reset-data')?.addEventListener('click', () => this.handleResetData());
  }

  scrollToTable() {
    requestAnimationFrame(() => {
      const tableSection = document.querySelector('.admin-table-section') || document.querySelector('#admin-table');
      if (tableSection) {
        const headerHeight = document.querySelector('.admin-header')?.offsetHeight || 0;
        const targetY = tableSection.getBoundingClientRect().top + window.pageYOffset - headerHeight - 16;
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }
    });
  }

  /* --- Rendering --- */
  render() {
    this.renderWelcome();
    this.renderMetrics();
    this.renderCategoryOptions();
    this.renderTable();
    this.refreshIcons();
  }

  renderWelcome() {
    const loja = this.data?.loja || {};
    const vigenciaEl = $('#welcome-vigencia-val');
    if (vigenciaEl) vigenciaEl.textContent = loja.vigenciaTabela || '15/09/2026';
    const whatsappEl = $('#welcome-whatsapp-val');
    if (whatsappEl) whatsappEl.textContent = loja.whatsapp || '5511963820374';
  }

  renderMetrics() {
    const total = this.products.length;
    const inStock = this.products.filter((p) => !p.disponibilidade || p.disponibilidade === 'Pronta Entrega').length;
    const lowStock = this.products.filter((p) => p.disponibilidade === 'Últimas Unidades').length;
    const outStock = this.products.filter((p) => p.disponibilidade === 'Esgotado').length;
    const categoriesCount = (this.data.categorias || []).length;

    const setVal = (id, val) => {
      const el = $(id);
      if (el) el.textContent = String(val);
    };

    setVal('#metric-total-products', total);
    setVal('#metric-in-stock', inStock);
    setVal('#metric-low-stock', lowStock);
    setVal('#metric-out-stock', outStock);
    setVal('#metric-categories', categoriesCount);
  }

  renderCategoryOptions() {
    const filterSelect = $('#filter-category');
    const formSelect = $('#p-categoria');
    const categories = (this.data.categorias || []).map((c) => c.categoria || c.nome);

    if (filterSelect) {
      const currentVal = filterSelect.value;
      filterSelect.innerHTML = '<option value="">Todas as Categorias</option>' +
        categories.map((cat) => `<option value="${cat}">${cat}</option>`).join('');
      filterSelect.value = currentVal;
    }

    if (formSelect) {
      formSelect.innerHTML = categories.map((cat) => `<option value="${cat}">${cat}</option>`).join('');
    }
  }

  getFilteredProducts() {
    let list = [...this.products];

    if (this.searchTerm) {
      list = list.filter((p) => {
        const q = this.searchTerm;
        return (
          (p.codigo && p.codigo.toLowerCase().includes(q)) ||
          (p.nome && p.nome.toLowerCase().includes(q)) ||
          (p.categoria && p.categoria.toLowerCase().includes(q)) ||
          (p.descricao && p.descricao.toLowerCase().includes(q)) ||
          (p.disponibilidade && p.disponibilidade.toLowerCase().includes(q))
        );
      });
    }

    if (this.categoryFilter) {
      list = list.filter((p) => p.categoria === this.categoryFilter);
    }

    if (this.stockFilter) {
      list = list.filter((p) => {
        const disp = p.disponibilidade || 'Pronta Entrega';
        return disp === this.stockFilter;
      });
    }

    // Sort
    list.sort((a, b) => {
      switch (this.sortBy) {
        case 'codigo-desc':
          return (b.codigo || '').localeCompare(a.codigo || '');
        case 'nome-asc':
          return (a.nome || '').localeCompare(b.nome || '');
        case 'nome-desc':
          return (b.nome || '').localeCompare(a.nome || '');
        case 'categoria-asc':
          return (a.categoria || '').localeCompare(b.categoria || '');
        case 'preco-asc':
          return (a.preco || 0) - (b.preco || 0);
        case 'preco-desc':
          return (b.preco || 0) - (a.preco || 0);
        case 'codigo-asc':
        default:
          return (a.codigo || '').localeCompare(b.codigo || '');
      }
    });

    return list;
  }

  getTotalPages() {
    const filtered = this.getFilteredProducts();
    if (this.itemsPerPage >= 9999 || filtered.length === 0) return 1;
    return Math.ceil(filtered.length / this.itemsPerPage);
  }

  renderTable() {
    const tbody = $('#products-tbody');
    const emptyState = $('#admin-empty-state');
    const countEl = $('#table-results-count');
    const paginationEl = $('#admin-pagination');
    if (!tbody) return;

    const filtered = this.getFilteredProducts();
    const totalItems = filtered.length;
    const totalPages = this.getTotalPages();

    if (this.currentPage > totalPages) {
      this.currentPage = Math.max(1, totalPages);
    }

    if (countEl) {
      countEl.textContent = `Exibindo ${totalItems} de ${this.products.length} produtos`;
    }

    if (totalItems === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      if (paginationEl) paginationEl.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (paginationEl) paginationEl.style.display = 'flex';

    // Slice for pagination
    const startIdx = (this.currentPage - 1) * this.itemsPerPage;
    const endIdx = Math.min(startIdx + this.itemsPerPage, totalItems);
    const paginatedItems = filtered.slice(startIdx, endIdx);

    const moeda = this.data?.loja?.moeda || 'BRL';

    tbody.innerHTML = paginatedItems.map((p) => {
      const options = p.opcoes_venda || [{
        quantidade: p.unidadesPorPacote || 1,
        unidade: p.unidadeVenda || 'un',
        preco: p.preco || p.precoPacote || 0
      }];

      const optionsBadges = options.map((opt) => {
        const desc = opt.descricao_quantidade || `${opt.quantidade} ${opt.unidade}`;
        const preco = formatCurrency(opt.preco, moeda);
        return `<span class="admin-variant-badge" title="${desc}: ${preco}">${desc}: <strong>${preco}</strong></span>`;
      }).join(' ');

      const status = p.disponibilidade || 'Pronta Entrega';
      let statusClass = 'admin-stock-badge--success';
      let statusIcon = 'check-circle-2';

      if (status === 'Últimas Unidades') {
        statusClass = 'admin-stock-badge--warning';
        statusIcon = 'alert-triangle';
      } else if (status === 'Esgotado') {
        statusClass = 'admin-stock-badge--danger';
        statusIcon = 'x-circle';
      } else if (status === 'Sob Encomenda') {
        statusClass = 'admin-stock-badge--info';
        statusIcon = 'clock';
      }

      const stockCountLabel = (p.estoque !== null && p.estoque !== undefined && p.estoque !== '')
        ? `<span class="admin-stock-qty" title="Quantidade cadastrada em estoque: ${p.estoque}">${p.estoque === 1 ? '1 un. (Última)' : `${p.estoque} un.`}</span>`
        : '';

      const imgPath = p.imagem ? (p.imagem.startsWith('http') || p.imagem.startsWith('data:') ? p.imagem : `../${p.imagem}`) : '../assets/images/favicon.svg';

      return `
        <tr data-code="${p.codigo}">
          <td class="col-thumb">
            <div class="admin-prod-thumb">
              <img src="${imgPath}" alt="${p.nome}" onerror="this.src='../assets/images/favicon.svg'" loading="lazy" />
            </div>
          </td>
          <td class="col-code">
            <span class="admin-prod-code">${p.codigo}</span>
          </td>
          <td class="col-name">
            <div class="admin-prod-name-box">
              <span class="admin-prod-name">${p.nome}</span>
              ${p.descricao ? `<span class="admin-prod-desc" title="${p.descricao}">${p.descricao}</span>` : ''}
            </div>
          </td>
          <td class="col-category">
            <span class="admin-prod-cat">${p.categoria}</span>
          </td>
          <td class="col-variants">
            <div class="admin-prod-variants">${optionsBadges}</div>
          </td>
          <td class="col-stock">
            <div class="admin-stock-wrapper">
              <button type="button" class="admin-stock-badge ${statusClass}" data-action="toggle-stock" data-code="${p.codigo}" title="Clique para alternar o status de estoque">
                <i data-lucide="${statusIcon}"></i>
                <span>${status}</span>
              </button>
              ${stockCountLabel}
            </div>
          </td>
          <td class="col-actions">
            <div class="admin-actions-cell">
              <button type="button" class="admin-action-btn" data-action="edit" data-code="${p.codigo}" title="Editar produto">
                <i data-lucide="edit-3"></i>
              </button>
              <button type="button" class="admin-action-btn" data-action="duplicate" data-code="${p.codigo}" title="Duplicar produto">
                <i data-lucide="copy"></i>
              </button>
              <button type="button" class="admin-action-btn admin-action-btn--delete" data-action="delete" data-code="${p.codigo}" title="Excluir produto">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row action listeners
    tbody.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        const code = btn.getAttribute('data-code');
        if (!code) return;

        if (action === 'toggle-stock') {
          this.cycleStockStatus(code);
        } else if (action === 'edit') {
          this.openProductModal('edit', code);
        } else if (action === 'duplicate') {
          this.duplicateProduct(code);
        } else if (action === 'delete') {
          this.openDeleteModal(code);
        }
      });
    });

    this.renderPaginationUI(totalItems, totalPages, startIdx + 1, endIdx);
    this.refreshIcons();
  }

  renderPaginationUI(totalItems, totalPages, displayStart, displayEnd) {
    const infoText = $('#pagination-info-text');
    if (infoText) {
      infoText.textContent = `Mostrando ${displayStart} a ${displayEnd} de ${totalItems} produtos`;
    }

    const prevBtn = $('#btn-page-prev');
    const nextBtn = $('#btn-page-next');
    if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
    if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;

    const container = $('#admin-page-numbers');
    if (!container) return;
    container.innerHTML = '';

    if (totalPages <= 1) return;

    // Generate page numbers with ellipses
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (this.currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (this.currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', this.currentPage - 1, this.currentPage, this.currentPage + 1, '...', totalPages);
      }
    }

    pages.forEach((p) => {
      if (p === '...') {
        const span = document.createElement('span');
        span.className = 'admin-page-ellipsis';
        span.textContent = '...';
        container.appendChild(span);
      } else {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `admin-page-btn${p === this.currentPage ? ' is-active' : ''}`;
        btn.textContent = String(p);
        btn.addEventListener('click', () => {
          this.currentPage = p;
          this.renderTable();
          this.scrollToTable();
        });
        container.appendChild(btn);
      }
    });
  }

  /* --- Stock Status Cycle --- */
  cycleStockStatus(code) {
    const statuses = ['Pronta Entrega', 'Últimas Unidades', 'Esgotado', 'Sob Encomenda'];
    for (const cat of this.data.categorias || []) {
      const prod = (cat.produtos || []).find((p) => p.codigo === code);
      if (prod) {
        const current = prod.disponibilidade || 'Pronta Entrega';
        const nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
        prod.disponibilidade = statuses[nextIdx];
        this.saveData();
        this.showToast(`Estoque de "${prod.nome}" alterado para ${prod.disponibilidade}.`, 'info');
        break;
      }
    }
  }

  /* --- Product Modal (Create / Edit) --- */
  openProductModal(mode = 'create', code = null) {
    const form = $('#product-form');
    if (!form) return;
    form.reset();

    // Reset tabs to first tab
    $$('.modal-tab-btn').forEach((b, i) => b.classList.toggle('is-active', i === 0));
    $$('.modal-tab-content').forEach((c, i) => c.classList.toggle('is-active', i === 0));

    $('#form-product-mode').value = mode;
    $('#form-original-code').value = code || '';

    const titleEl = $('#product-modal-title');
    const skuTag = $('#product-modal-sku-tag');
    const iconEl = $('#product-modal-icon');

    if (mode === 'edit' && code) {
      const prod = this.products.find((p) => p.codigo === code);
      if (!prod) return;

      if (titleEl) titleEl.textContent = `Editar: ${prod.nome}`;
      if (skuTag) skuTag.textContent = prod.codigo || 'HF000';
      if (iconEl) iconEl.setAttribute('data-lucide', 'edit-3');

      $('#p-codigo').value = prod.codigo || '';
      $('#p-nome').value = prod.nome || '';
      $('#p-categoria').value = prod.categoria || '';
      $('#p-disponibilidade').value = prod.disponibilidade || 'Pronta Entrega';
      $('#p-estoque').value = (prod.estoque !== undefined && prod.estoque !== null) ? prod.estoque : '';
      $('#p-descricao').value = prod.descricao || '';
      $('#p-unidades-pacote').value = prod.unidadesPorPacote || prod.descricaoUnidade || '';
      $('#p-peso-unitario').value = prod.pesoUnitario || '';
      $('#p-vigencia').value = prod.vigenciaPreco || prod.vigencia || '15/09/2026';
      $('#p-procedencia').value = prod.procedencia || 'Produtor Regional Selecionado';
      $('#p-imagem').value = prod.imagem || '';

      const imgPreview = $('#image-preview-el');
      if (imgPreview) {
        imgPreview.src = prod.imagem ? (prod.imagem.startsWith('http') || prod.imagem.startsWith('data:') ? prod.imagem : `../${prod.imagem}`) : '../assets/images/favicon.svg';
      }

      // Highlight selected SVG in quick picker if match
      $('#svg-gallery-picker')?.querySelectorAll('.svg-thumb-btn').forEach((b) => {
        b.classList.toggle('is-selected', b.title.toLowerCase() === `selecionar ${prod.codigo.toLowerCase()}` || b.querySelector('img')?.src.includes(prod.imagem));
      });

      // Render variants
      const container = $('#variants-container');
      if (container) {
        container.innerHTML = '';
        const options = prod.opcoes_venda && prod.opcoes_venda.length > 0 ? prod.opcoes_venda : [{
          quantidade: 1,
          unidade: 'unidade',
          preco: prod.preco || 0,
          descricao_quantidade: '1 unidade'
        }];
        options.forEach((opt) => this.addVariantRow(opt));
      }
    } else {
      // Create mode
      if (titleEl) titleEl.textContent = 'Novo Produto';
      if (iconEl) iconEl.setAttribute('data-lucide', 'package-plus');

      // Suggest SKU
      const nextCode = this.generateNextCode();
      $('#p-codigo').value = nextCode;
      if (skuTag) skuTag.textContent = nextCode;
      $('#p-vigencia').value = this.data?.loja?.vigenciaTabela || '15/09/2026';
      $('#p-procedencia').value = 'Produtor Regional Selecionado';
      $('#p-disponibilidade').value = 'Pronta Entrega';
      $('#p-estoque').value = '';
      $('#p-imagem').value = 'assets/images/products/hf001.svg';

      const imgPreview = $('#image-preview-el');
      if (imgPreview) imgPreview.src = '../assets/images/products/hf001.svg';

      const container = $('#variants-container');
      if (container) {
        container.innerHTML = '';
        this.addVariantRow({ quantidade: 1, unidade: 'unidade', preco: 0, descricao_quantidade: '1 unidade' });
      }
    }

    this.updateVariantCountBadge();
    this.openModal('product-modal-overlay');
    this.refreshIcons();
  }

  generateNextCode() {
    const nums = this.products
      .map((p) => {
        const match = String(p.codigo).match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
    return `HF${String(maxNum + 1).padStart(3, '0')}`;
  }

  addVariantRow(data = { quantidade: 1, unidade: 'kg', preco: 0, descricao_quantidade: '' }) {
    const container = $('#variants-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'variant-card-item';
    row.innerHTML = `
      <input type="number" step="any" min="0.1" name="v_qtd" placeholder="Qtd" value="${data.quantidade || 1}" required title="Quantidade" />
      <input type="text" name="v_unidade" placeholder="Unidade (ex: kg, un)" value="${data.unidade || 'unidade'}" required title="Unidade" />
      <input type="number" step="0.01" min="0" name="v_preco" placeholder="Preço (R$)" value="${data.preco || ''}" required title="Preço unitário em Reais" />
      <input type="text" name="v_desc" placeholder="Rótulo (ex: 1 bandeja com 4 un)" value="${data.descricao_quantidade || ''}" title="Descrição da embalagem/formato" />
      <button type="button" class="variant-remove-btn" title="Remover formato">
        <i data-lucide="trash-2"></i>
        <span>Remover</span>
      </button>
    `;

    row.querySelector('.variant-remove-btn')?.addEventListener('click', () => {
      if (container.querySelectorAll('.variant-card-item').length > 1) {
        row.remove();
        this.updateVariantCountBadge();
      } else {
        this.showToast('O produto precisa de pelo menos 1 variação de venda.', 'warning');
      }
    });

    container.appendChild(row);
    this.updateVariantCountBadge();
    this.refreshIcons();
  }

  updateVariantCountBadge() {
    const badge = $('#variants-count-badge');
    const count = $$('#variants-container .variant-card-item').length;
    if (badge) badge.textContent = String(count || 1);
  }

  handleSaveProduct(e) {
    e.preventDefault();

    const mode = $('#form-product-mode').value;
    const originalCode = $('#form-original-code').value;

    const codigo = $('#p-codigo').value.trim();
    const nome = $('#p-nome').value.trim();
    const categoria = $('#p-categoria').value.trim();
    const disponibilidade = $('#p-disponibilidade').value;
    const estoqueRaw = $('#p-estoque')?.value.trim() ?? '';
    const estoque = estoqueRaw !== '' && !isNaN(parseInt(estoqueRaw, 10)) ? parseInt(estoqueRaw, 10) : null;
    const descricao = $('#p-descricao').value.trim();
    const unidadesPorPacote = $('#p-unidades-pacote').value.trim() || '1 unidade';
    const pesoUnitario = $('#p-peso-unitario').value.trim() || 'Preço por unidade';
    const vigenciaPreco = $('#p-vigencia').value.trim() || '15/09/2026';
    const procedencia = $('#p-procedencia').value.trim() || 'Produtor Regional Selecionado';
    const imagem = $('#p-imagem').value.trim() || 'assets/images/favicon.svg';

    if (!codigo || !nome || !categoria) {
      this.showToast('Preencha os campos obrigatórios (Código, Nome e Categoria).', 'error');
      return;
    }

    // Check SKU duplicate if create or if code changed
    if (mode === 'create' || (mode === 'edit' && codigo !== originalCode)) {
      const exists = this.products.some((p) => p.codigo.toLowerCase() === codigo.toLowerCase());
      if (exists) {
        this.showToast(`O código SKU "${codigo}" já está em uso por outro produto.`, 'error');
        return;
      }
    }

    // Extract variants
    const variantRows = $$('#variants-container .variant-card-item');
    const opcoes_venda = [];
    variantRows.forEach((r) => {
      const qtd = parseFloat(r.querySelector('[name="v_qtd"]')?.value) || 1;
      const un = r.querySelector('[name="v_unidade"]')?.value.trim() || 'unidade';
      const preco = parseFloat(r.querySelector('[name="v_preco"]')?.value) || 0;
      const desc = r.querySelector('[name="v_desc"]')?.value.trim() || `${qtd} ${un}`;
      opcoes_venda.push({
        quantidade: qtd,
        unidade: un,
        preco: preco,
        descricao_quantidade: desc,
      });
    });

    if (opcoes_venda.length === 0) {
      this.showToast('Adicione pelo menos 1 variação de preço.', 'error');
      return;
    }

    const primaryOpt = opcoes_venda[0];
    const primaryPreco = primaryOpt.preco;

    const productPayload = {
      codigo,
      nome,
      categoria,
      unidadeVenda: primaryOpt.unidade,
      descricaoUnidade: primaryOpt.descricao_quantidade || unidadesPorPacote,
      unidadesPorPacote,
      pesoUnitario,
      precoPacote: primaryPreco,
      preco: primaryPreco,
      opcoes_venda,
      imagem,
      descricao,
      disponibilidade,
      estoque,
      procedencia,
      vigenciaPreco,
    };

    // Remove from original category if editing
    if (mode === 'edit' && originalCode) {
      for (const cat of this.data.categorias || []) {
        const idx = (cat.produtos || []).findIndex((p) => p.codigo === originalCode);
        if (idx !== -1) {
          cat.produtos.splice(idx, 1);
          break;
        }
      }
    }

    // Add to target category
    let targetCat = (this.data.categorias || []).find(
      (c) => (c.categoria || c.nome).toLowerCase() === categoria.toLowerCase()
    );

    if (!targetCat) {
      targetCat = {
        categoria,
        slug: this.slugify(categoria),
        produtos: []
      };
      this.data.categorias.push(targetCat);
    }

    if (!targetCat.produtos) targetCat.produtos = [];
    targetCat.produtos.push(productPayload);

    this.saveData();
    this.closeModal('product-modal-overlay');
    this.showToast(`Produto "${nome}" salvo com sucesso!`, 'success');
  }

  duplicateProduct(code) {
    const prod = this.products.find((p) => p.codigo === code);
    if (!prod) return;

    this.openProductModal('create');
    $('#p-nome').value = `${prod.nome} (Cópia)`;
    $('#p-categoria').value = prod.categoria || '';
    $('#p-disponibilidade').value = prod.disponibilidade || 'Pronta Entrega';
    $('#p-estoque').value = (prod.estoque !== undefined && prod.estoque !== null) ? prod.estoque : '';
    $('#p-descricao').value = prod.descricao || '';
    $('#p-unidades-pacote').value = prod.unidadesPorPacote || '';
    $('#p-peso-unitario').value = prod.pesoUnitario || '';
    $('#p-vigencia').value = prod.vigenciaPreco || '15/09/2026';
    $('#p-procedencia').value = prod.procedencia || '';
    $('#p-imagem').value = prod.imagem || '';

    const container = $('#variants-container');
    if (container && prod.opcoes_venda) {
      container.innerHTML = '';
      prod.opcoes_venda.forEach((opt) => this.addVariantRow(opt));
    }
  }

  /* --- Delete Handling --- */
  openDeleteModal(code) {
    const prod = this.products.find((p) => p.codigo === code);
    if (!prod) return;

    this.productToDelete = prod;
    $('#delete-product-name').textContent = prod.nome;
    $('#delete-product-code').textContent = prod.codigo;
    this.openModal('delete-modal-overlay');
  }

  handleConfirmDelete() {
    if (!this.productToDelete) return;
    const code = this.productToDelete.codigo;
    const name = this.productToDelete.nome;

    for (const cat of this.data.categorias || []) {
      const idx = (cat.produtos || []).findIndex((p) => p.codigo === code);
      if (idx !== -1) {
        cat.produtos.splice(idx, 1);
        break;
      }
    }

    // Clean empty categories if desired
    this.data.categorias = (this.data.categorias || []).filter(
      (c) => (c.produtos && c.produtos.length > 0)
    );

    this.productToDelete = null;
    this.saveData();
    this.closeModal('delete-modal-overlay');
    this.showToast(`Produto "${name}" excluído com sucesso.`, 'info');
  }

  /* --- New Category Modal --- */
  handleCreateCategory(e) {
    e.preventDefault();
    const nameInput = $('#new-cat-name');
    const name = nameInput ? nameInput.value.trim() : '';

    if (!name) return;

    const exists = (this.data.categorias || []).some(
      (c) => (c.categoria || c.nome).toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      this.showToast('Esta categoria já existe.', 'warning');
      return;
    }

    this.data.categorias.push({
      categoria: name,
      slug: this.slugify(name),
      produtos: []
    });

    this.saveData();
    this.renderCategoryOptions();
    $('#p-categoria').value = name;
    this.closeModal('category-modal-overlay');
    nameInput.value = '';
    this.showToast(`Categoria "${name}" criada com sucesso!`, 'success');
  }

  /* --- Store Settings Modal --- */
  openStoreModal() {
    const loja = this.data.loja || {};
    $('#s-nome').value = loja.nome || this.data.estabelecimento || 'Hortifruti Natural';
    $('#s-slogan').value = loja.slogan || 'Colheita & Produtos Frescos';
    $('#s-descricao').value = loja.descricao || '';
    $('#s-whatsapp').value = loja.whatsapp || '5511963820374';
    $('#s-vigencia').value = loja.vigenciaTabela || '15/09/2026';
    $('#s-formas-pedido').value = loja.formas_pedido || 'WhatsApp e Feira Online';
    $('#s-disponibilidade-padrao').value = loja.disponibilidade_padrao || 'Pronta Entrega';

    this.openModal('store-modal-overlay');
  }

  handleSaveStore(e) {
    e.preventDefault();

    this.data.loja = {
      nome: $('#s-nome').value.trim(),
      slogan: $('#s-slogan').value.trim(),
      descricao: $('#s-descricao').value.trim(),
      vigenciaTabela: $('#s-vigencia').value.trim() || '15/09/2026',
      observacao: 'Preços por unidade de venda - sujeitos a alteração sem aviso prévio.',
      formas_pedido: $('#s-formas-pedido').value.trim() || 'WhatsApp e Feira Online',
      disponibilidade_padrao: $('#s-disponibilidade-padrao').value.trim() || 'Pronta Entrega',
      whatsapp: $('#s-whatsapp').value.trim(),
      moeda: this.data?.loja?.moeda || 'BRL'
    };

    this.data.estabelecimento = this.data.loja.nome;

    this.saveData();
    this.closeModal('store-modal-overlay');
    this.showToast('Configurações da loja salvas com sucesso!', 'success');
  }

  /* --- JSON Download & Upload --- */
  downloadJSON() {
    try {
      const jsonStr = JSON.stringify(this.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'produtos.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.showToast('Arquivo produtos.json baixado! Coloque-o em /data/produtos.json para publicar.', 'success');
    } catch (err) {
      console.error('Falha ao baixar JSON:', err);
      this.showToast('Erro ao exportar arquivo JSON.', 'error');
    }
  }

  handleUploadJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed.categorias || !Array.isArray(parsed.categorias)) {
          throw new Error('Formato inválido: o JSON deve conter uma lista "categorias".');
        }

        this.data = parsed;
        this.saveData();
        this.showToast('Arquivo JSON importado com sucesso!', 'success');
      } catch (err) {
        console.error('Erro ao ler arquivo JSON:', err);
        this.showToast(`Falha na importação: ${err.message}`, 'error');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  /* --- Reset Data --- */
  async handleResetData() {
    if (!confirm('Deseja restaurar o catálogo padrão original? Todas as alterações salvas localmente serão substituídas pelos dados do arquivo produtos.json.')) {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_CATALOG);
      const res = await fetch('../data/produtos.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('Não foi possível ler o arquivo produtos.json do servidor.');
      this.data = await res.json();
      this.updateStorageBadge(false);
      this.syncProductsList();
      this.currentPage = 1;
      this.render();
      this.showToast('Dados restaurados com sucesso para o padrão do servidor.', 'info');
    } catch (err) {
      console.error('Erro ao restaurar dados:', err);
      this.showToast('Erro ao restaurar dados padrão.', 'error');
    }
  }

  /* --- Modal Utilities --- */
  openModal(overlayId) {
    const overlay = $(`#${overlayId}`);
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal(overlayId) {
    const overlay = $(`#${overlayId}`);
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  /* --- Toast Notifications --- */
  showToast(message, type = 'info') {
    const container = $('#admin-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `admin-toast admin-toast--${type}`;

    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'alert-circle';
    if (type === 'warning') icon = 'alert-triangle';

    toast.innerHTML = `
      <i data-lucide="${icon}"></i>
      <span class="admin-toast__msg">${message}</span>
    `;

    container.appendChild(toast);
    this.refreshIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new AdminApp();
});
