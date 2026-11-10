import { QRState, DotType, CornerSquareType, CornerDotType, FrameStyle, ErrorCorrectionLevel } from '../types';
import { renderIconSelector } from './IconSelector';
import { renderPresetGallery } from './PresetGallery';

export function renderCustomizerPanel(
  state: QRState,
  onUpdateState: (partial: Partial<QRState>) => void,
  onShowToast: (msg: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'panel-card';

  let activeSubTab = 'presets';

  container.innerHTML = `
    <!-- Navegação de Sub-Abas -->
    <div class="nav-tab-pills" role="tablist">
      <button class="nav-pill-btn active" data-subtab="presets">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        54+ Estilos Prontos
      </button>
      <button class="nav-pill-btn" data-subtab="custom">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        Personalização Granular
      </button>
    </div>

    <!-- Container da Galeria de Presets -->
    <div id="subtab-content-presets"></div>

    <!-- Container da Customização Granular com Layout em Grid Ampla -->
    <div id="subtab-content-custom" class="hidden">
      <div class="custom-grid-layout">
        
        <!-- Coluna 1: Formas, Cantos e Logotipos -->
        <div class="custom-col">
          <!-- 1. Formato dos Pontos -->
          <div class="custom-section">
            <div class="section-label">
              <span>Formato dos Pontos (Dots)</span>
              <span class="badge-tag-count">6 opções</span>
            </div>
            <div class="shape-selector-grid">
              <button class="shape-opt-btn ${state.dotsType === 'rounded' ? 'active' : ''}" data-dots="rounded">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9"/></svg>
                Arredondado
              </button>
              <button class="shape-opt-btn ${state.dotsType === 'dots' ? 'active' : ''}" data-dots="dots">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><circle cx="8" cy="16" r="3"/><circle cx="16" cy="16" r="3"/></svg>
                Pontos
              </button>
              <button class="shape-opt-btn ${state.dotsType === 'classy' ? 'active' : ''}" data-dots="classy">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor"><rect width="16" height="16" x="4" y="4" rx="3"/></svg>
                Elegante
              </button>
              <button class="shape-opt-btn ${state.dotsType === 'classy-rounded' ? 'active' : ''}" data-dots="classy-rounded">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M4 12a8 8 0 0 1 8-8h8v8a8 8 0 0 1-8 8H4z"/></svg>
                Curvo Suave
              </button>
              <button class="shape-opt-btn ${state.dotsType === 'square' ? 'active' : ''}" data-dots="square">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor"><rect width="18" height="18" x="3" y="3"/></svg>
                Quadrado
              </button>
              <button class="shape-opt-btn ${state.dotsType === 'extra-rounded' ? 'active' : ''}" data-dots="extra-rounded">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor"><rect width="18" height="18" x="3" y="3" rx="8"/></svg>
                Ultra Curvo
              </button>
            </div>
          </div>

          <!-- 2. Formato dos Cantos -->
          <div class="custom-section">
            <div class="section-label"><span>Marcador Externo dos Cantos</span></div>
            <div class="shape-selector-grid">
              <button class="shape-opt-btn ${state.cornersSquareType === 'extra-rounded' ? 'active' : ''}" data-cs="extra-rounded">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="16" height="16" x="4" y="4" rx="5"/></svg>
                Arredondado
              </button>
              <button class="shape-opt-btn ${state.cornersSquareType === 'square' ? 'active' : ''}" data-cs="square">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="16" height="16" x="4" y="4"/></svg>
                Quadrado
              </button>
              <button class="shape-opt-btn ${state.cornersSquareType === 'dot' ? 'active' : ''}" data-cs="dot">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="8"/></svg>
                Circular
              </button>
            </div>

            <div class="section-label" style="margin-top: 1rem;"><span>Ponto Central do Canto</span></div>
            <div class="shape-selector-grid">
              <button class="shape-opt-btn ${state.cornersDotType === 'dot' ? 'active' : ''}" data-cd="dot">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>
                Círculo
              </button>
              <button class="shape-opt-btn ${state.cornersDotType === 'square' ? 'active' : ''}" data-cd="square">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="currentColor"><rect width="12" height="12" x="6" y="6"/></svg>
                Quadrado
              </button>
            </div>
          </div>

          <!-- 4. Seção de Logotipos Oficiais da Wikipedia -->
          <div id="subtab-icon-selector-slot"></div>
        </div>

        <!-- Coluna 2: Cores, Molduras e Exportação -->
        <div class="custom-col">
          <!-- 3. Cores e Gradientes -->
          <div class="custom-section">
            <div class="section-label"><span>Cores & Gradientes</span></div>
            
            <div class="color-picker-row">
              <div class="color-input-wrapper">
                <input type="color" id="ctrl-dots-color" class="color-picker-native" value="${state.dotsColor}" aria-label="Cor principal">
                <span id="hex-label-dots1" class="color-hex-text">${state.dotsColor}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <input type="checkbox" id="chk-gradient" ${state.dotsGradientEnabled ? 'checked' : ''}>
                <label for="chk-gradient" style="font-size: 0.85rem; font-weight: 600; cursor: pointer;">Habilitar Gradiente</label>
              </div>
            </div>

            <div id="wrapper-grad-controls" class="${state.dotsGradientEnabled ? '' : 'hidden'}">
              <div class="color-picker-row">
                <label style="font-size: 0.8rem; font-weight: 600; min-width: 90px;">Segunda Cor:</label>
                <div class="color-input-wrapper">
                  <input type="color" id="ctrl-dots-color2" class="color-picker-native" value="${state.dotsColor2}" aria-label="Segunda cor">
                  <span id="hex-label-dots2" class="color-hex-text">${state.dotsColor2}</span>
                </div>
              </div>

              <div class="slider-group">
                <div class="slider-header">
                  <span>Ângulo de Rotação</span>
                  <span id="val-grad-rot">${state.dotsGradientRotation}°</span>
                </div>
                <input type="range" id="slider-grad-rot" class="slider-input" min="0" max="360" value="${state.dotsGradientRotation}">
              </div>
            </div>

            <!-- Fundo -->
            <div style="margin-top: 1rem;">
              <div class="section-label"><span>Cor de Fundo</span></div>
              <div class="color-picker-row">
                <div class="color-input-wrapper">
                  <input type="color" id="ctrl-bg-color" class="color-picker-native" value="${state.bgColor}" aria-label="Cor de fundo">
                  <span id="hex-label-bg" class="color-hex-text">${state.bgColor}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <input type="checkbox" id="chk-bg-trans" ${state.bgTransparent ? 'checked' : ''}>
                  <label for="chk-bg-trans" style="font-size: 0.85rem; font-weight: 600; cursor: pointer;">Fundo Transparente</label>
                </div>
              </div>
            </div>
          </div>

          <!-- 5. Molduras / Call to Action -->
          <div class="custom-section">
            <div class="section-label"><span>Moldura e Chamada para Ação</span></div>
            <div class="shape-selector-grid">
              <button class="shape-opt-btn ${state.frameStyle === 'none' ? 'active' : ''}" data-frame="none">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                Sem Moldura
              </button>
              <button class="shape-opt-btn ${state.frameStyle === 'bottom' ? 'active' : ''}" data-frame="bottom">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="3" y1="17" x2="21" y2="17"/></svg>
                Texto Inferior
              </button>
              <button class="shape-opt-btn ${state.frameStyle === 'top' ? 'active' : ''}" data-frame="top">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="3" y1="7" x2="21" y2="7"/></svg>
                Badge Superior
              </button>
              <button class="shape-opt-btn ${state.frameStyle === 'card' ? 'active' : ''}" data-frame="card">
                <svg class="shape-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="4"/></svg>
                Card Elegante
              </button>
            </div>

            <div style="margin-top: 0.75rem;">
              <label class="form-label">Texto da Moldura</label>
              <input type="text" id="input-frame-label" class="input-text no-icon" value="${state.frameText}" placeholder="Ex: ESCANEIE-ME">
            </div>

            <div class="color-picker-row" style="margin-top: 0.75rem;">
              <label style="font-size: 0.8rem; font-weight: 600; min-width: 110px;">Cor da Moldura:</label>
              <div class="color-input-wrapper">
                <input type="color" id="ctrl-frame-bg" class="color-picker-native" value="${state.frameBgColor}">
              </div>
            </div>
          </div>

          <!-- 6. Configurações Técnicas de Exportação -->
          <div class="custom-section">
            <div class="section-label"><span>Qualidade & Resolução</span></div>
            <div class="form-grid-2">
              <div>
                <label class="form-label">Resolução de Download</label>
                <select id="select-export-res" class="input-text no-icon">
                  <option value="512" ${state.exportSize === 512 ? 'selected' : ''}>512 x 512 px (Padrão Web)</option>
                  <option value="1024" ${state.exportSize === 1024 ? 'selected' : ''}>1024 x 1024 px (Alta Definição)</option>
                  <option value="2048" ${state.exportSize === 2048 ? 'selected' : ''}>2048 x 2048 px (Impressão Ultra HD)</option>
                </select>
              </div>
              <div>
                <label class="form-label">Correção de Erros</label>
                <select id="select-error-corr" class="input-text no-icon">
                  <option value="L" ${state.errorCorrectionLevel === 'L' ? 'selected' : ''}>L (Baixa - 7%)</option>
                  <option value="M" ${state.errorCorrectionLevel === 'M' ? 'selected' : ''}>M (Média - 15%)</option>
                  <option value="Q" ${state.errorCorrectionLevel === 'Q' ? 'selected' : ''}>Q (Alta - 25% Recomendado)</option>
                  <option value="H" ${state.errorCorrectionLevel === 'H' ? 'selected' : ''}>H (Máxima - 30% Ideal p/ Logos)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Render da galeria de presets
  const presetsSlot = container.querySelector('#subtab-content-presets') as HTMLElement;
  presetsSlot.appendChild(renderPresetGallery(state, (preset) => {
    onUpdateState({
      activePresetId: preset.id,
      dotsType: preset.dotsType,
      cornersSquareType: preset.cornersSquareType,
      cornersDotType: preset.cornersDotType,
      bgColor: preset.bgColor,
      bgTransparent: false,
      dotsColor: preset.dotsColor,
      dotsColor2: preset.dotsGradient?.color2 || '#7c3aed',
      dotsGradientEnabled: !!preset.dotsGradient,
      dotsGradientRotation: preset.dotsGradient?.rotation || 45,
      cornersSquareColor: preset.cornersColor,
      cornersDotColor: preset.cornersColor,
      cornersSync: true,
      logoType: preset.presetLogo ? 'wikipedia' : state.logoType,
      selectedWikipediaLogoId: preset.presetLogo || null
    });
    onShowToast(`Estilo "${preset.name}" aplicado!`);
  }));

  // Render do seletor de ícones
  const iconSlot = container.querySelector('#subtab-icon-selector-slot') as HTMLElement;
  iconSlot.appendChild(renderIconSelector(state, onUpdateState, onShowToast));

  // Alternar Sub-Abas
  container.querySelectorAll('.nav-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-subtab') || 'presets';
      activeSubTab = target;
      container.querySelectorAll('.nav-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      container.querySelector('#subtab-content-presets')?.classList.toggle('hidden', activeSubTab !== 'presets');
      container.querySelector('#subtab-content-custom')?.classList.toggle('hidden', activeSubTab !== 'custom');
    });
  });

  // Handlers dos Formatos
  container.querySelectorAll('[data-dots]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-dots]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onUpdateState({ dotsType: btn.getAttribute('data-dots') as DotType, activePresetId: null });
    });
  });

  container.querySelectorAll('[data-cs]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-cs]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onUpdateState({ cornersSquareType: btn.getAttribute('data-cs') as CornerSquareType, activePresetId: null });
    });
  });

  container.querySelectorAll('[data-cd]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-cd]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onUpdateState({ cornersDotType: btn.getAttribute('data-cd') as CornerDotType, activePresetId: null });
    });
  });

  // Cores
  container.querySelector('#ctrl-dots-color')?.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    (container.querySelector('#hex-label-dots1') as HTMLElement).textContent = val;
    onUpdateState({ dotsColor: val, activePresetId: null });
  });

  container.querySelector('#ctrl-dots-color2')?.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    (container.querySelector('#hex-label-dots2') as HTMLElement).textContent = val;
    onUpdateState({ dotsColor2: val, activePresetId: null });
  });

  container.querySelector('#chk-gradient')?.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    container.querySelector('#wrapper-grad-controls')?.classList.toggle('hidden', !checked);
    onUpdateState({ dotsGradientEnabled: checked, activePresetId: null });
  });

  container.querySelector('#slider-grad-rot')?.addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    (container.querySelector('#val-grad-rot') as HTMLElement).textContent = `${val}°`;
    onUpdateState({ dotsGradientRotation: val });
  });

  container.querySelector('#ctrl-bg-color')?.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    (container.querySelector('#hex-label-bg') as HTMLElement).textContent = val;
    onUpdateState({ bgColor: val, bgTransparent: false });
  });

  container.querySelector('#chk-bg-trans')?.addEventListener('change', (e) => {
    onUpdateState({ bgTransparent: (e.target as HTMLInputElement).checked });
  });

  // Molduras
  container.querySelectorAll('[data-frame]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-frame]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onUpdateState({ frameStyle: btn.getAttribute('data-frame') as FrameStyle });
    });
  });

  container.querySelector('#input-frame-label')?.addEventListener('input', (e) => {
    onUpdateState({ frameText: (e.target as HTMLInputElement).value });
  });

  container.querySelector('#ctrl-frame-bg')?.addEventListener('input', (e) => {
    onUpdateState({ frameBgColor: (e.target as HTMLInputElement).value });
  });

  // Resolução & Correção
  container.querySelector('#select-export-res')?.addEventListener('change', (e) => {
    onUpdateState({ exportSize: parseInt((e.target as HTMLSelectElement).value, 10) });
  });

  container.querySelector('#select-error-corr')?.addEventListener('change', (e) => {
    onUpdateState({ errorCorrectionLevel: (e.target as HTMLSelectElement).value as ErrorCorrectionLevel });
  });

  return container;
}
