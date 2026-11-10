import { QRState } from '../types';
import { WIKIPEDIA_LOGOS } from '../services/wikipediaLogos';

/**
 * Processa qualquer imagem enviada pelo usuário (PNG, JPG, SVG, WebP)
 * encaixando-a proporcionalmente em um escudo quadrado de alta resolução com fundo branco protetor.
 * Isso impede que a imagem seja distorcida ou esmagada pelo gerador de QR Code.
 */
function processCustomImageBadge(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const size = 600;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // 1. Desenhar escudo branco protetor arredondado
        ctx.fillStyle = '#ffffff';
        const radius = 140;
        ctx.beginPath();
        ctx.roundRect(0, 0, size, size, radius);
        ctx.fill();

        // 2. Borda suave para contraste perfeito
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();

        // 3. Calcular escala 'contain' para preservar proporção
        const padding = 70;
        const availSize = size - (padding * 2);

        let drawW = availSize;
        let drawH = availSize;
        const aspect = img.width / img.height;

        if (aspect > 1) {
          // Mais larga que alta
          drawW = availSize;
          drawH = availSize / aspect;
        } else {
          // Mais alta que larga ou quadrada
          drawH = availSize;
          drawW = availSize * aspect;
        }

        const drawX = (size - drawW) / 2;
        const drawY = (size - drawH) / 2;

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        resolve(canvas.toDataURL('image/png', 0.95));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function renderIconSelector(
  state: QRState,
  onUpdateState: (partial: Partial<QRState>) => void,
  onShowToast: (msg: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'custom-section';

  container.innerHTML = `
    <div class="section-label">
      <span>Logotipo Central Oficial (Wikipedia / Wikimedia Commons)</span>
      <span class="badge-tag-count">Vetores Padronizados</span>
    </div>
    <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.85rem; line-height: 1.5;">
      Ícones oficiais com escudo protetor branco integrado para evitar colisão com os pontos e garantir 100% de legibilidade na leitura.
    </p>

    <!-- Upload de Logo Próprio -->
    <div id="box-upload-logo" class="upload-logo-box">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      <div>
        <span style="font-weight: 600; display: block;">Enviar Imagem Personalizada</span>
        <span style="font-size: 0.75rem; color: var(--text-muted);">Ajustada automaticamente sem distorções</span>
      </div>
      <input type="file" id="input-file-custom-logo" accept="image/*" class="hidden">
    </div>

    <!-- Feedback do arquivo carregado -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; min-height: 24px;">
      <span id="label-custom-logo-name" style="font-size: 0.8rem; font-weight: 600; color: var(--brand-primary);">${state.customLogoFileName || ''}</span>
      <button type="button" id="btn-clear-logo" style="background: none; border: none; font-size: 0.75rem; color: var(--brand-danger); cursor: pointer; text-decoration: underline; ${state.logoType === 'none' ? 'display: none;' : ''}">Remover Logo</button>
    </div>

    <!-- Grade de Ícones Oficiais do Wikimedia -->
    <div style="margin-top: 1rem;">
      <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 0.6rem;">
        Ou escolha uma marca oficial:
      </span>
      <div class="wiki-logos-grid">
        ${WIKIPEDIA_LOGOS.map(logo => `
          <div class="wiki-logo-card ${state.logoType === 'wikipedia' && state.selectedWikipediaLogoId === logo.id ? 'active' : ''}" data-wiki-id="${logo.id}" title="${logo.name}">
            <div class="wiki-logo-icon-wrap">
              <img src="${logo.badgeDataUrl}" alt="${logo.name}" width="38" height="38" style="display: block; border-radius: 8px; pointer-events: none;" />
            </div>
            <span class="wiki-logo-name">${logo.name}</span>
            <a href="${logo.wikipediaUrl}" target="_blank" rel="noopener noreferrer" class="wiki-source-link" title="Ver arquivo original no Wikimedia Commons">
              Wikimedia
            </a>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Sliders de Ajuste -->
    <div class="slider-group" style="margin-top: 1.25rem;">
      <div class="slider-header">
        <span>Tamanho do Logotipo no QR Code</span>
        <span id="val-logo-size-indicator">${Math.round(state.logoSize * 100)}%</span>
      </div>
      <input type="range" id="slider-logo-size-control" class="slider-input" min="0.15" max="0.40" step="0.05" value="${state.logoSize}">
    </div>
  `;

  // Upload Customizado com ajuste proporcional automático
  const fileInput = container.querySelector('#input-file-custom-logo') as HTMLInputElement;
  container.querySelector('#box-upload-logo')?.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      try {
        const processedDataUrl = await processCustomImageBadge(file);
        container.querySelectorAll('.wiki-logo-card').forEach(c => c.classList.remove('active'));
        (container.querySelector('#label-custom-logo-name') as HTMLElement).textContent = `Arquivo: ${file.name}`;
        (container.querySelector('#btn-clear-logo') as HTMLElement).style.display = 'inline';

        onUpdateState({
          logoType: 'custom',
          customLogoDataUrl: processedDataUrl,
          customLogoFileName: file.name,
          selectedWikipediaLogoId: null
        });
        onShowToast('Logotipo ajustado com proporção perfeita!');
      } catch {
        onShowToast('Erro ao carregar a imagem selecionada.');
      }
    }
  });

  // Limpar Logo
  container.querySelector('#btn-clear-logo')?.addEventListener('click', () => {
    container.querySelectorAll('.wiki-logo-card').forEach(c => c.classList.remove('active'));
    (container.querySelector('#label-custom-logo-name') as HTMLElement).textContent = '';
    (container.querySelector('#btn-clear-logo') as HTMLElement).style.display = 'none';

    onUpdateState({
      logoType: 'none',
      selectedWikipediaLogoId: null,
      customLogoDataUrl: null,
      customLogoFileName: null
    });
    onShowToast('Logotipo removido');
  });

  // Selecionar Logo do Wikimedia
  container.querySelectorAll('.wiki-logo-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).tagName.toLowerCase() === 'a') return;

      const id = card.getAttribute('data-wiki-id');
      const clearBtn = container.querySelector('#btn-clear-logo') as HTMLElement;

      if (state.logoType === 'wikipedia' && state.selectedWikipediaLogoId === id) {
        card.classList.remove('active');
        clearBtn.style.display = 'none';
        onUpdateState({ logoType: 'none', selectedWikipediaLogoId: null });
      } else {
        container.querySelectorAll('.wiki-logo-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        (container.querySelector('#label-custom-logo-name') as HTMLElement).textContent = '';
        clearBtn.style.display = 'inline';

        onUpdateState({
          logoType: 'wikipedia',
          selectedWikipediaLogoId: id,
          customLogoDataUrl: null,
          customLogoFileName: null
        });
        onShowToast('Logotipo oficial do Wikimedia aplicado!');
      }
    });
  });

  // Slider de Tamanho
  container.querySelector('#slider-logo-size-control')?.addEventListener('input', (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    (container.querySelector('#val-logo-size-indicator') as HTMLElement).textContent = `${Math.round(val * 100)}%`;
    onUpdateState({ logoSize: val });
  });

  return container;
}
