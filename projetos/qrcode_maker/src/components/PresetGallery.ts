import { QRState, Preset } from '../types';
import { PRESETS_DATA } from '../services/presets';

export function renderPresetGallery(
  state: QRState,
  onApplyPreset: (preset: Preset) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'preset-gallery-wrapper';

  let currentCategory = 'all';
  let searchTerm = '';

  const renderCards = () => {
    const grid = container.querySelector('#presets-dynamic-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = PRESETS_DATA.filter(p => {
      const matchCat = currentCategory === 'all' || p.category === currentCategory;
      const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; padding: 2rem; text-align: center; color: var(--text-muted);">Nenhum estilo encontrado para sua busca.</div>';
      return;
    }

    filtered.forEach(preset => {
      const card = document.createElement('div');
      card.className = `preset-card ${state.activePresetId === preset.id ? 'active' : ''}`;
      card.setAttribute('data-id', preset.id);

      card.innerHTML = `
        <div class="preset-preview-box" style="background: ${preset.previewGradient}">
          <div class="preset-preview-inner"></div>
        </div>
        <span class="preset-title">${preset.name}</span>
      `;

      card.addEventListener('click', () => {
        container.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        onApplyPreset(preset);
      });

      grid.appendChild(card);
    });
  };

  container.innerHTML = `
    <!-- Barra de Busca Moderna -->
    <div class="preset-search-container">
      <div class="preset-search-input-wrap">
        <svg class="preset-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" id="preset-search-input" class="preset-search-input" placeholder="Buscar entre os 54 modelos (ex: Indigo, Instagram, Luxo, Neon...)" autocomplete="off">
      </div>
    </div>

    <!-- Filtros de Categoria em Chips Fluidos e Elegantes -->
    <div class="preset-filter-bar" role="tablist">
      <button class="filter-chip active" data-cat="all" type="button">
        <span>Todos</span>
        <span class="chip-count">54</span>
      </button>
      <button class="filter-chip" data-cat="popular" type="button"><span>🌟 Populares</span></button>
      <button class="filter-chip" data-cat="business" type="button"><span>💼 Corporativo & Luxo</span></button>
      <button class="filter-chip" data-cat="creative" type="button"><span>🎨 Gradientes Vibrantes</span></button>
      <button class="filter-chip" data-cat="social" type="button"><span>📱 Redes Sociais</span></button>
      <button class="filter-chip" data-cat="dark" type="button"><span>🌑 AMOLED & Cyber</span></button>
      <button class="filter-chip" data-cat="pastel" type="button"><span>🌸 Tons Pastel</span></button>
    </div>

    <!-- Grade Dinâmica -->
    <div id="presets-dynamic-grid" class="presets-grid"></div>
  `;

  // Eventos de Busca e Filtro
  container.querySelector('#preset-search-input')?.addEventListener('input', (e) => {
    searchTerm = (e.target as HTMLInputElement).value;
    renderCards();
  });

  container.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCategory = chip.getAttribute('data-cat') || 'all';
      renderCards();
    });
  });

  // Render inicial
  setTimeout(renderCards, 0);

  return container;
}
