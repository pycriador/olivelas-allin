/**
 * Vitrine Digital - Static Edition Application Script
 * 100% Client-side, zero backend dependencies.
 */

// Application State
const state = {
  allAdvertisers: [],
  selectedCategory: 'todas',
  searchQuery: '',
  pageSize: 8,
  currentPage: 1,
  shuffleSeed: Date.now(),
  cardImageIndices: {}, // advertiserId -> currentImageIndex
};

// Available Page Size Options
const PAGE_SIZE_OPTIONS = [4, 8, 12, 'all'];

// Seeded PRNG for stable pagination when shuffled
function pseudoRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function seededShuffle(array, seed) {
  const arr = [...array];
  let currentSeed = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom(currentSeed++) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helpers
function normalizeText(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

function formatPrice(price) {
  if (!price) return '';
  const str = String(price).trim();
  if (str.includes('R$')) return str;
  const num = parseFloat(str.replace(',', '.'));
  if (!isNaN(num) && num > 0) {
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  }
  return str;
}

function getWhatsAppUrl(phone, advertiserName) {
  if (!phone) return '#';
  let digits = phone.replace(/\D/g, '');
  if (!digits.startsWith('55') && (digits.length === 10 || digits.length === 11)) {
    digits = '55' + digits;
  }
  const text = encodeURIComponent(`Olá! Vi o anúncio da ${advertiserName || 'loja'} na Vitrine Digital e gostaria de mais informações.`);
  return `https://wa.me/${digits}?text=${text}`;
}

// Drawer Controller Functions
window.openMobileDrawer = function () {
  const drawer = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('mobile-drawer-overlay');
  if (drawer && overlay) {
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
};

window.closeMobileDrawer = function () {
  const drawer = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('mobile-drawer-overlay');
  if (drawer && overlay) {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
};

// Global Category Selector
window.selectCategory = function (category) {
  state.selectedCategory = category;
  state.currentPage = 1;
  renderCategoriesSidebar();
  renderCatalog();
  closeMobileDrawer();
};

// Global Page Size Selector
window.setPageSize = function (size) {
  state.pageSize = size;
  state.currentPage = 1;
  renderPageSizeSelector();
  renderCatalog();
};

// Global Pagination Nav
window.goToPage = function (page) {
  state.currentPage = page;
  renderCatalog();
  const catalogSection = document.getElementById('vitrine');
  if (catalogSection) {
    catalogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// Global Card Image Switcher
window.changeCardImage = function (advertiserId, direction) {
  const advertiser = state.allAdvertisers.find((a) => a.id === advertiserId);
  if (!advertiser || !advertiser.images || advertiser.images.length <= 1) return;

  const total = advertiser.images.length;
  const current = state.cardImageIndices[advertiserId] || 0;
  let next = (current + direction + total) % total;
  state.cardImageIndices[advertiserId] = next;

  // Update specific card DOM without re-rendering entire grid
  const card = document.querySelector(`.advertiser-card[data-id="${advertiserId}"]`);
  if (!card) {
    renderCatalog();
    return;
  }

  const imgEl = card.querySelector('.card-image-main');
  const blurImgEl = card.querySelector('.card-image-blur-backdrop');
  const counterEl = card.querySelector('.image-counter-pill');
  const dots = card.querySelectorAll('.dot-indicator');

  if (imgEl) {
    imgEl.src = advertiser.images[next];
  }
  if (blurImgEl) {
    blurImgEl.src = advertiser.images[next];
  }
  if (counterEl) {
    counterEl.textContent = `${next + 1} / ${total}`;
  }
  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === next);
  });
};

// DOM Event Listeners Setup
function setupEventListeners() {
  // Mobile drawer buttons
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');
  const drawerOverlay = document.getElementById('mobile-drawer-overlay');

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', window.openMobileDrawer);
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', window.closeMobileDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', window.closeMobileDrawer);

  // Search input & clear button
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      state.currentPage = 1;
      if (clearSearchBtn) {
        clearSearchBtn.classList.toggle('hidden', state.searchQuery === '');
      }
      renderCatalog();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        state.searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        state.currentPage = 1;
        renderCatalog();
        searchInput.focus();
      }
    });
  }

  // Shuffle button
  const shuffleBtn = document.getElementById('shuffle-btn');
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      state.shuffleSeed = Date.now();
      state.currentPage = 1;
      renderCatalog();
    });
  }

  // Hero section quick tag buttons
  const heroTags = document.querySelectorAll('.hero-tags .tag-btn');
  heroTags.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag');
      if (tag) {
        const searchInput = document.getElementById('search-input');
        const clearBtn = document.getElementById('clear-search-btn');
        if (searchInput) searchInput.value = tag;
        if (clearBtn) clearBtn.classList.remove('hidden');

        state.searchQuery = tag;
        state.selectedCategory = 'todas';
        state.currentPage = 1;
        renderCategoriesSidebar();
        renderCatalog();

        const catalogSection = document.getElementById('vitrine');
        if (catalogSection) {
          catalogSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
}

// Render Categories in Sidebar & Mobile Drawer
function renderCategoriesSidebar() {
  const sidebarList = document.getElementById('categories-list');
  const mobileList = document.getElementById('mobile-categories-list');
  const countBadge = document.getElementById('categories-count-badge');

  // Compute tag counts across all advertisers
  const tagCounts = {};
  state.allAdvertisers.forEach((adv) => {
    const tags = new Set(adv.tags || []);
    if (adv.products) {
      adv.products.forEach((p) => {
        if (p.category) tags.add(p.category);
      });
    }
    tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);

  if (countBadge) {
    countBadge.textContent = `${sortedTags.length + 1} opções`;
  }

  // Build items HTML
  const buildItemsHtml = (isMobile = false) => {
    let html = `
      <button
        type="button"
        class="category-item ${state.selectedCategory === 'todas' ? 'active' : ''}"
        onclick="selectCategory('todas')"
      >
        <span class="category-name">⭐ Todas as Lojas</span>
        <span class="category-count">${state.allAdvertisers.length}</span>
      </button>
    `;

    sortedTags.forEach((tag) => {
      const isActive = normalizeText(state.selectedCategory) === normalizeText(tag);
      html += `
        <button
          type="button"
          class="category-item ${isActive ? 'active' : ''}"
          onclick="selectCategory('${tag.replace(/'/g, "\\'")}')"
        >
          <span class="category-name"># ${tag}</span>
          <span class="category-count">${tagCounts[tag]}</span>
        </button>
      `;
    });

    return html;
  };

  if (sidebarList) sidebarList.innerHTML = buildItemsHtml(false);
  if (mobileList) mobileList.innerHTML = buildItemsHtml(true);
}

// Render Page Size Selector Buttons (4, 8, 12, Todos)
function renderPageSizeSelector() {
  const container = document.getElementById('page-size-buttons');
  if (!container) return;

  container.innerHTML = PAGE_SIZE_OPTIONS.map((size) => {
    const isSelected = state.pageSize === size;
    const label = size === 'all' ? 'Todos' : size;
    return `
      <button
        type="button"
        class="size-btn ${isSelected ? 'active' : ''}"
        onclick="setPageSize(${typeof size === 'string' ? `'${size}'` : size})"
      >
        ${label}
      </button>
    `;
  }).join('');
}

// Get Filtered and Shuffled Advertisers
function getFilteredAdvertisers() {
  let list = [...state.allAdvertisers];

  // 1. Category Filter
  if (state.selectedCategory && state.selectedCategory !== 'todas') {
    const targetCat = normalizeText(state.selectedCategory);
    list = list.filter((adv) => {
      const matchCategory = normalizeText(adv.category) === targetCat;
      const matchAdvTag = (adv.tags || []).some((t) => normalizeText(t) === targetCat);
      const matchProductTag = (adv.products || []).some(
        (p) => normalizeText(p.category) === targetCat || normalizeText(p.title).includes(targetCat)
      );
      return matchCategory || matchAdvTag || matchProductTag;
    });
  }

  // 2. Search Filter (Palavras-chave, Anunciante, Categoria, Resumo, Produtos, Preços, Telefone)
  if (state.searchQuery) {
    const q = normalizeText(state.searchQuery);
    list = list.filter((adv) => {
      const matchName = normalizeText(adv.name).includes(q) || normalizeText(adv.businessName).includes(q);
      const matchCat = normalizeText(adv.category).includes(q);
      const matchSummary = normalizeText(adv.summary).includes(q);
      const matchPhone = (adv.phone && adv.phone.includes(q)) || (adv.formattedPhone && adv.formattedPhone.includes(q));
      const matchTags = (adv.tags || []).some((t) => normalizeText(t).includes(q));
      const matchProducts = (adv.products || []).some(
        (p) =>
          normalizeText(p.title).includes(q) ||
          normalizeText(p.name).includes(q) ||
          normalizeText(p.description).includes(q) ||
          (p.price && String(p.price).includes(q))
      );
      return matchName || matchCat || matchSummary || matchPhone || matchTags || matchProducts;
    });
  }

  // 3. Seeded Shuffle
  return seededShuffle(list, state.shuffleSeed);
}

// Card HTML Generator
function createCardHtml(adv) {
  const images = adv.images && adv.images.length > 0 ? adv.images : ['images/placeholder.jpg'];
  const totalImages = images.length;
  const activeIdx = state.cardImageIndices[adv.id] || 0;
  const currentImgSrc = images[activeIdx] || images[0];

  const formattedPhone = adv.phone ? formatPhone(adv.phone) : 'Sem telefone informado';
  const whatsappUrl = adv.phone ? getWhatsAppUrl(adv.phone, adv.name) : '#';

  // Products preview (limit to top 4)
  const products = adv.products || [];
  const previewProducts = products.slice(0, 4);
  const remainingCount = products.length - previewProducts.length;

  let productsHtml = '';
  if (previewProducts.length > 0) {
    productsHtml = `
      <div class="card-products-section">
        <span class="card-section-label">Ofertas & Destaques (${products.length})</span>
        <div class="products-mini-list">
          ${previewProducts
            .map((p) => {
              const priceStr = formatPrice(p.price);
              const portionStr = p.portion ? ` (${p.portion})` : '';
              return `
                <div class="product-mini-item">
                  <div class="product-mini-info">
                    <strong class="product-mini-title">${p.title}</strong>
                    ${p.description ? `<span class="product-mini-desc">${p.description}</span>` : ''}
                  </div>
                  ${priceStr ? `<span class="product-mini-price">${priceStr}${portionStr}</span>` : ''}
                </div>
              `;
            })
            .join('')}
        </div>
        ${remainingCount > 0 ? `<span class="products-more-badge">+ mais ${remainingCount} produto(s) no catálogo</span>` : ''}
      </div>
    `;
  }

  // Tags pill list
  const tagsHtml = (adv.tags || [])
    .slice(0, 5)
    .map((t) => `<span class="card-tag">#${t}</span>`)
    .join('');

  return `
    <article class="advertiser-card" data-id="${adv.id}">
      <!-- Image Gallery Header (Formato Story Vertical 9:16) -->
      <div class="card-image-wrapper">
        <img
          src="${currentImgSrc}"
          alt=""
          aria-hidden="true"
          class="card-image-blur-backdrop"
        />
        <img
          src="${currentImgSrc}"
          alt="${adv.name}"
          class="card-image-main"
          loading="lazy"
          onerror="this.onerror=null; this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 400 300\\' fill=\\'%23161922\\'><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%23A88C5A\\' font-size=\\'18\\'>Vitrine Digital</text></svg>';"
        />

        ${
          totalImages > 1
            ? `
          <button
            type="button"
            class="gallery-arrow-btn gallery-prev"
            onclick="event.stopPropagation(); changeCardImage('${adv.id}', -1)"
            aria-label="Imagem Anterior"
          >‹</button>

          <button
            type="button"
            class="gallery-arrow-btn gallery-next"
            onclick="event.stopPropagation(); changeCardImage('${adv.id}', 1)"
            aria-label="Próxima Imagem"
          >›</button>

          <div class="image-counter-pill">${activeIdx + 1} / ${totalImages}</div>

          <div class="gallery-dots">
            ${images
              .map(
                (_, idx) =>
                  `<span class="dot-indicator ${idx === activeIdx ? 'active' : ''}"></span>`
              )
              .join('')}
          </div>
        `
            : ''
        }
      </div>

      <!-- Card Body Content -->
      <div class="card-body">
        <div class="card-header-info">
          <h3 class="card-title">${adv.name || 'Estabelecimento Local'}</h3>
          <div class="card-phone-meta">
            <span class="phone-icon">📞</span>
            <span class="phone-number">${formattedPhone}</span>
          </div>
        </div>

        ${tagsHtml ? `<div class="card-tags-wrap">${tagsHtml}</div>` : ''}

        ${productsHtml}

        <!-- Card Action Footer -->
        <div class="card-footer-actions">
          ${
            adv.phone
              ? `
            <a
              href="${whatsappUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-whatsapp-cta"
            >
              <span>💬</span> Conversar no WhatsApp
            </a>
          `
              : `
            <button type="button" class="btn-whatsapp-cta disabled" disabled>
              WhatsApp não cadastrado
            </button>
          `
          }
        </div>
      </div>
    </article>
  `;
}

// Render Main Catalog Grid & Pagination
function renderCatalog() {
  const gridContainer = document.getElementById('advertiser-grid');
  const resultsCountEl = document.getElementById('results-count');
  const paginationWrapper = document.getElementById('pagination-wrapper');

  if (!gridContainer) return;

  const filteredList = getFilteredAdvertisers();
  const totalCount = filteredList.length;

  // Update Status Text
  if (resultsCountEl) {
    if (totalCount === 0) {
      resultsCountEl.textContent = 'Nenhum estabelecimento encontrado';
    } else if (totalCount === 1) {
      resultsCountEl.textContent = '1 estabelecimento encontrado';
    } else {
      resultsCountEl.textContent = `${totalCount} estabelecimentos encontrados`;
    }
  }

  // Handle Empty State
  if (totalCount === 0) {
    gridContainer.innerHTML = `
      <div class="empty-state-box">
        <div class="empty-state-icon">🔍</div>
        <h3 class="empty-state-title">Nenhum resultado para os filtros atuais</h3>
        <p class="empty-state-desc">Tente buscar por outro termo ou selecione "Todas as Lojas" na barra lateral.</p>
        <button type="button" class="btn btn-gold" onclick="selectCategory('todas')">
          Ver Todas as Lojas
        </button>
      </div>
    `;
    if (paginationWrapper) paginationWrapper.innerHTML = '';
    return;
  }

  // Calculate Pagination Slices
  let itemsToRender = filteredList;
  let totalPages = 1;

  if (state.pageSize !== 'all') {
    const size = Number(state.pageSize);
    totalPages = Math.ceil(totalCount / size);

    if (state.currentPage > totalPages) {
      state.currentPage = totalPages;
    }
    if (state.currentPage < 1) {
      state.currentPage = 1;
    }

    const startIndex = (state.currentPage - 1) * size;
    const endIndex = startIndex + size;
    itemsToRender = filteredList.slice(startIndex, endIndex);
  }

  // Render Grid Cards
  gridContainer.innerHTML = itemsToRender.map((adv) => createCardHtml(adv)).join('');

  // Render Pagination Controls
  renderPagination(totalPages, totalCount);
}

// Render Pagination Bar
function renderPagination(totalPages, totalCount) {
  const wrapper = document.getElementById('pagination-wrapper');
  if (!wrapper) return;

  if (state.pageSize === 'all' || totalPages <= 1) {
    wrapper.innerHTML = `
      <div class="pagination-summary">
        Mostrando todos os <strong>${totalCount}</strong> estabelecimentos
      </div>
    `;
    return;
  }

  const current = state.currentPage;
  const isFirst = current === 1;
  const isLast = current === totalPages;

  let pageButtonsHtml = '';
  for (let i = 1; i <= totalPages; i++) {
    const isActive = i === current;
    pageButtonsHtml += `
      <button
        type="button"
        class="page-num-btn ${isActive ? 'active' : ''}"
        onclick="goToPage(${i})"
      >
        ${i}
      </button>
    `;
  }

  wrapper.innerHTML = `
    <div class="pagination-container">
      <button
        type="button"
        class="page-nav-btn"
        ${isFirst ? 'disabled' : ''}
        onclick="goToPage(${current - 1})"
        aria-label="Página Anterior"
      >
        ‹ Anterior
      </button>

      <div class="page-numbers-group">
        ${pageButtonsHtml}
      </div>

      <button
        type="button"
        class="page-nav-btn"
        ${isLast ? 'disabled' : ''}
        onclick="goToPage(${current + 1})"
        aria-label="Próxima Página"
      >
        Próxima ›
      </button>
    </div>
    <div class="pagination-summary">
      Página <strong>${current}</strong> de <strong>${totalPages}</strong> (${totalCount} lojas)
    </div>
  `;
}

// Application Bootstrap
async function initApp() {
  try {
    const res = await fetch('data/anuncios.json');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ao carregar data/anuncios.json`);
    }
    const data = await res.json();
    const rawList = Array.isArray(data) ? data : (data.anunciantes || []);

    state.allAdvertisers = rawList.map((adv) => {
      const rawImages = (adv.images && adv.images.length > 0)
        ? adv.images
        : (adv.primaryImage ? [adv.primaryImage] : []);

      const images = rawImages.map((img) => {
        if (typeof img === 'string') return img;
        return img.url || img.imageUrl || 'images/placeholder.jpg';
      });

      if (images.length === 0) {
        images.push('images/placeholder.jpg');
      }

      const prods = (adv.products || []).map((p) => ({
        title: p.name || p.title || 'Produto',
        name: p.name || p.title || 'Produto',
        price: p.price || '',
        description: p.description || '',
        portion: p.portion || ''
      }));

      const allTags = new Set();
      if (adv.category) allTags.add(adv.category);
      (adv.keywords || []).forEach((k) => k && allTags.add(k));
      (adv.tags || []).forEach((t) => t && allTags.add(t));

      return {
        id: adv.id,
        name: adv.businessName || adv.name || 'Estabelecimento Local',
        businessName: adv.businessName || adv.name || 'Estabelecimento Local',
        category: adv.category || 'Geral',
        summary: adv.summary || '',
        phone: adv.phone || '',
        formattedPhone: adv.formattedPhone || (adv.phone ? formatPhone(adv.phone) : ''),
        whatsappMessage: adv.whatsappMessage || '',
        images,
        products: prods,
        tags: Array.from(allTags),
        keywords: adv.keywords || [],
        address: adv.address || '',
        instagram: adv.instagram || '',
        workingHours: adv.workingHours || ''
      };
    });

    setupEventListeners();
    renderCategoriesSidebar();
    renderPageSizeSelector();
    renderCatalog();
  } catch (err) {
    console.error('Erro ao inicializar Vitrine Digital estática:', err);
    const grid = document.getElementById('advertiser-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state-box">
          <div class="empty-state-icon">⚠️</div>
          <h3 class="empty-state-title">Erro ao carregar catálogo</h3>
          <p class="empty-state-desc">${err.message}</p>
        </div>
      `;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
