/**
 * Olivelas QR Code - Aplicação Principal
 * Gerador de QR Code com 54+ presets e personalizações granulares de formatos e cores.
 */

(function () {
  'use strict';

  // --- Estado Global ---
  const state = {
    contentType: 'url',
    data: 'https://github.com/pycriador/olivelas-qrcode',
    // Configurações do QR
    dotsType: 'rounded',
    dotsColor: '#4f46e5',
    dotsGradientEnabled: true,
    dotsGradientType: 'linear',
    dotsGradientRotation: 45,
    dotsColor2: '#7c3aed',
    
    cornersSquareType: 'extra-rounded',
    cornersSquareColor: '#4338ca',
    cornersDotType: 'dot',
    cornersDotColor: '#4338ca',
    cornersSync: true,

    bgColor: '#ffffff',
    bgTransparent: false,

    logoType: 'none', // 'none' | 'icon' | 'custom'
    logoIconId: null,
    logoCustomDataUrl: null,
    logoSize: 0.35,
    logoMargin: 6,

    frameStyle: 'none', // 'none' | 'bottom' | 'top' | 'card'
    frameText: 'ESCANEIE-ME',
    frameBgColor: '#4f46e5',
    frameTextColor: '#ffffff',

    exportSize: 1024,
    errorCorrectionLevel: 'Q',
    margin: 10,

    activePresetId: 'midnight-indigo',
    history: []
  };

  let qrCodeInstance = null;
  let updateDebounceTimer = null;

  // --- Elementos do DOM ---
  const elements = {
    qrTarget: document.getElementById('qr-target'),
    previewFrame: document.getElementById('preview-frame'),
    frameTopBadge: document.getElementById('frame-top-badge'),
    frameBottomText: document.getElementById('frame-bottom-text'),
    urlInput: document.getElementById('url-input'),
    btnPaste: document.getElementById('btn-paste-url'),
    presetsContainer: document.getElementById('presets-grid'),
    toast: document.getElementById('toast-msg'),
    themeToggleBtn: document.getElementById('btn-theme-toggle'),
    activeUrlDisplay: document.getElementById('preview-active-url'),
    contrastBadge: document.getElementById('preview-contrast-badge')
  };

  // --- Inicialização ---
  function init() {
    initTheme();
    initQRCode();
    renderPresets('all');
    setupEventListeners();
    loadHistory();
    updateQR();
  }

  // --- Inicialização do QRCodeStyling ---
  function initQRCode() {
    if (typeof QRCodeStyling === 'undefined') {
      console.error('Biblioteca QRCodeStyling não carregada.');
      return;
    }

    qrCodeInstance = new QRCodeStyling({
      width: 300,
      height: 300,
      type: 'canvas',
      data: state.data,
      margin: state.margin,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: state.errorCorrectionLevel
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: state.logoSize,
        margin: state.logoMargin,
        crossOrigin: 'anonymous'
      },
      dotsOptions: {
        type: state.dotsType,
        color: state.dotsColor
      },
      backgroundOptions: {
        color: state.bgTransparent ? 'transparent' : state.bgColor
      },
      cornersSquareOptions: {
        type: state.cornersSquareType,
        color: state.cornersSquareColor
      },
      cornersDotOptions: {
        type: state.cornersDotType,
        color: state.cornersDotColor
      }
    });

    elements.qrTarget.innerHTML = '';
    qrCodeInstance.append(elements.qrTarget);
  }

  // --- Atualização do QR Code com Debounce ---
  function updateQR(immediate = false) {
    clearTimeout(updateDebounceTimer);

    const applyUpdate = () => {
      if (!qrCodeInstance) return;

      // 1. Dados e Conteúdo
      const content = getContentString();
      state.data = content;

      if (elements.activeUrlDisplay) {
        elements.activeUrlDisplay.textContent = content.length > 35 ? content.substring(0, 32) + '...' : content;
      }

      // 2. Dots Options (Gradiente ou Cor Sólida)
      const dotsOptions = {
        type: state.dotsType
      };

      if (state.dotsGradientEnabled && state.dotsColor2) {
        dotsOptions.gradient = {
          type: state.dotsGradientType || 'linear',
          rotation: (parseInt(state.dotsGradientRotation, 10) || 0) * (Math.PI / 180),
          colorStops: [
            { offset: 0, color: state.dotsColor },
            { offset: 1, color: state.dotsColor2 }
          ]
        };
        delete dotsOptions.color;
      } else {
        dotsOptions.color = state.dotsColor;
        delete dotsOptions.gradient;
      }

      // 3. Cantos
      const cornerSquareColor = state.cornersSync ? state.dotsColor : state.cornersSquareColor;
      const cornerDotColor = state.cornersSync ? state.dotsColor : state.cornersDotColor;

      // 4. Logo
      let logoUrl = null;
      if (state.logoType === 'icon' && state.logoIconId) {
        logoUrl = window.getIconDataUrl(state.logoIconId);
      } else if (state.logoType === 'custom' && state.logoCustomDataUrl) {
        logoUrl = state.logoCustomDataUrl;
      }

      // 5. Aplicar ao QRCodeStyling
      qrCodeInstance.update({
        data: content || 'https://github.com/pycriador/olivelas-qrcode',
        margin: state.margin,
        qrOptions: {
          errorCorrectionLevel: state.errorCorrectionLevel
        },
        dotsOptions: dotsOptions,
        cornersSquareOptions: {
          type: state.cornersSquareType,
          color: cornerSquareColor
        },
        cornersDotOptions: {
          type: state.cornersDotType,
          color: cornerDotColor
        },
        backgroundOptions: {
          color: state.bgTransparent ? 'transparent' : state.bgColor
        },
        image: logoUrl,
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: state.logoSize,
          margin: state.logoMargin,
          crossOrigin: 'anonymous'
        }
      });

      // 6. Atualizar Moldura Visual (Frame)
      updateFrameVisual();
      checkContrast();
    };

    if (immediate) {
      applyUpdate();
    } else {
      updateDebounceTimer = setTimeout(applyUpdate, 150);
    }
  }

  // --- Atualização Visual da Moldura (Frame) ---
  function updateFrameVisual() {
    if (!elements.previewFrame) return;

    const frame = state.frameStyle;
    elements.frameTopBadge.classList.add('hidden');
    elements.frameBottomText.classList.add('hidden');
    elements.previewFrame.style.border = 'none';
    elements.previewFrame.style.background = '#ffffff';

    if (frame === 'bottom') {
      elements.frameBottomText.classList.remove('hidden');
      elements.frameBottomText.textContent = state.frameText || 'ESCANEIE-ME';
      elements.frameBottomText.style.color = state.frameTextColor;
      elements.previewFrame.style.background = state.frameBgColor;
    } else if (frame === 'top') {
      elements.frameTopBadge.classList.remove('hidden');
      elements.frameTopBadge.textContent = state.frameText || 'SCAN HERE';
      elements.frameTopBadge.style.background = state.frameBgColor;
      elements.frameTopBadge.style.color = state.frameTextColor;
    } else if (frame === 'card') {
      elements.frameBottomText.classList.remove('hidden');
      elements.frameBottomText.textContent = state.frameText || 'APONTE A CÂMERA';
      elements.frameBottomText.style.color = state.dotsColor;
      elements.previewFrame.style.border = `3px solid ${state.dotsColor}`;
    }
  }

  // --- Validação Simples de Contraste ---
  function checkContrast() {
    if (!elements.contrastBadge) return;
    // Se o fundo for branco e a cor do dot for muito clara (ex: amarela clara ou branca)
    const isLightDot = isColorTooLight(state.dotsColor);
    const isWhiteBg = state.bgColor.toLowerCase() === '#ffffff' || state.bgColor.toLowerCase() === '#fff';

    if (isWhiteBg && isLightDot) {
      elements.contrastBadge.classList.remove('hidden');
      elements.contrastBadge.textContent = '⚠️ Contraste Baixo (Pode falhar no leitor)';
      elements.contrastBadge.style.color = '#dc2626';
    } else {
      elements.contrastBadge.classList.remove('hidden');
      elements.contrastBadge.textContent = '✓ Excelente Legibilidade';
      elements.contrastBadge.style.color = '#10b981';
    }
  }

  function isColorTooLight(hex) {
    if (!hex || hex.length < 6) return false;
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.85;
  }

  // --- Construtor de Conteúdo de Acordo com a Aba Ativa ---
  function getContentString() {
    switch (state.contentType) {
      case 'url': {
        let url = (elements.urlInput ? elements.urlInput.value.trim() : '');
        if (!url) return 'https://github.com/pycriador/olivelas-qrcode';
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        return url;
      }
      case 'whatsapp': {
        const phone = (document.getElementById('wa-phone')?.value || '').replace(/\D/g, '');
        const msg = encodeURIComponent(document.getElementById('wa-message')?.value || '');
        if (!phone) return 'https://wa.me/';
        return `https://wa.me/${phone}${msg ? '?text=' + msg : ''}`;
      }
      case 'pix': {
        const key = document.getElementById('pix-key')?.value.trim() || '';
        const name = document.getElementById('pix-name')?.value.trim() || 'RECEBEDOR';
        const city = document.getElementById('pix-city')?.value.trim() || 'BRASILIA';
        const amount = document.getElementById('pix-amount')?.value.trim() || '';
        return generatePixPayload(key, name, city, amount);
      }
      case 'wifi': {
        const ssid = document.getElementById('wifi-ssid')?.value || '';
        const pass = document.getElementById('wifi-pass')?.value || '';
        const type = document.getElementById('wifi-type')?.value || 'WPA';
        const hidden = document.getElementById('wifi-hidden')?.checked ? 'true' : 'false';
        return `WIFI:S:${ssid};T:${type};P:${pass};H:${hidden};;`;
      }
      case 'vcard': {
        const fn = document.getElementById('vcard-name')?.value || '';
        const tel = document.getElementById('vcard-tel')?.value || '';
        const email = document.getElementById('vcard-email')?.value || '';
        const org = document.getElementById('vcard-org')?.value || '';
        return `BEGIN:VCARD\nVERSION:3.0\nN:${fn}\nFN:${fn}\nORG:${org}\nTEL:${tel}\nEMAIL:${email}\nEND:VCARD`;
      }
      case 'text': {
        return document.getElementById('text-free')?.value || 'Olá, mundo!';
      }
      default:
        return 'https://github.com/pycriador/olivelas-qrcode';
    }
  }

  // --- Gerador do Payload Padrão BR Code / Pix ---
  function generatePixPayload(key, name, city, amount) {
    if (!key) return 'PIX INVÁLIDO - INSIRA A CHAVE';
    // Formato simplificado ou chave direta
    if (!amount) {
      return `Chave Pix: ${key}\nNome: ${name}\nCidade: ${city}`;
    }
    return `PIX: chave=${key}; valor=${amount}; nome=${name}; cidade=${city};`;
  }

  // --- Renderização dos 54 Presets ---
  function renderPresets(category = 'all') {
    if (!elements.presetsContainer || !window.QR_PRESETS) return;

    elements.presetsContainer.innerHTML = '';
    const filtered = category === 'all'
      ? window.QR_PRESETS
      : window.QR_PRESETS.filter(p => p.category === category);

    filtered.forEach(preset => {
      const card = document.createElement('div');
      card.className = `preset-card ${state.activePresetId === preset.id ? 'active' : ''}`;
      card.setAttribute('data-preset-id', preset.id);

      const previewBox = document.createElement('div');
      previewBox.className = 'preset-preview-box';
      previewBox.style.background = preset.previewGradient || preset.dotsColor;

      const innerBox = document.createElement('div');
      innerBox.className = 'preset-preview-inner';
      previewBox.appendChild(innerBox);

      const title = document.createElement('div');
      title.className = 'preset-title';
      title.textContent = preset.name;

      card.appendChild(previewBox);
      card.appendChild(title);

      card.addEventListener('click', () => applyPreset(preset));
      elements.presetsContainer.appendChild(card);
    });
  }

  // --- Aplicação de um Preset ---
  function applyPreset(preset) {
    state.activePresetId = preset.id;
    state.dotsType = preset.dotsType;
    state.cornersSquareType = preset.cornersSquareType;
    state.cornersDotType = preset.cornersDotType;
    state.bgColor = preset.bgColor || '#ffffff';
    state.bgTransparent = false;

    if (preset.dotsGradient) {
      state.dotsGradientEnabled = true;
      state.dotsGradientType = preset.dotsGradient.type || 'linear';
      state.dotsGradientRotation = preset.dotsGradient.rotation || 45;
      state.dotsColor = preset.dotsGradient.color1;
      state.dotsColor2 = preset.dotsGradient.color2;
    } else {
      state.dotsGradientEnabled = false;
      state.dotsColor = preset.dotsColor;
    }

    state.cornersSquareColor = preset.cornersColor || preset.dotsColor;
    state.cornersDotColor = preset.cornersColor || preset.dotsColor;
    state.cornersSync = true;

    if (preset.presetLogo) {
      state.logoType = 'icon';
      state.logoIconId = preset.presetLogo;
    }

    // Sincronizar inputs visuais na aba de customização
    syncControlsWithState();

    // Atualizar classe ativa nos cards de preset
    document.querySelectorAll('.preset-card').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-preset-id') === preset.id);
    });

    updateQR(true);
    showToast(`Estilo "${preset.name}" aplicado!`);
  }

  // --- Sincronizar os controles manuais com o State ---
  function syncControlsWithState() {
    const dotsColorInput = document.getElementById('input-dots-color');
    if (dotsColorInput) dotsColorInput.value = state.dotsColor;

    const dotsColor2Input = document.getElementById('input-dots-color2');
    if (dotsColor2Input) dotsColor2Input.value = state.dotsColor2 || '#7c3aed';

    const bgColorInput = document.getElementById('input-bg-color');
    if (bgColorInput) bgColorInput.value = state.bgColor;

    const gradToggle = document.getElementById('toggle-gradient');
    if (gradToggle) gradToggle.checked = state.dotsGradientEnabled;

    const gradControls = document.getElementById('gradient-controls-wrapper');
    if (gradControls) gradControls.classList.toggle('hidden', !state.dotsGradientEnabled);

    // Formato dos pontos
    document.querySelectorAll('[data-dots-shape]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-dots-shape') === state.dotsType);
    });

    // Formato dos cantos
    document.querySelectorAll('[data-corner-shape]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-corner-shape') === state.cornersSquareType);
    });

    // Formato dos marcadores internos
    document.querySelectorAll('[data-corner-dot-shape]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-corner-dot-shape') === state.cornersDotType);
    });

    // Logos
    document.querySelectorAll('[data-logo-id]').forEach(btn => {
      btn.classList.toggle('active', state.logoType === 'icon' && btn.getAttribute('data-logo-id') === state.logoIconId);
    });
  }

  // --- Event Listeners Globais ---
  function setupEventListeners() {
    // 1. Input de URL
    if (elements.urlInput) {
      elements.urlInput.addEventListener('input', () => updateQR());
    }

    // 2. Botão Colar URL da área de transferência
    if (elements.btnPaste) {
      elements.btnPaste.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            elements.urlInput.value = text;
            updateQR(true);
            showToast('Link colado com sucesso!');
          }
        } catch (err) {
          elements.urlInput.focus();
          showToast('Pressione Ctrl+V para colar');
        }
      });
    }

    // 3. Abas de Tipos de Conteúdo (URL, WhatsApp, Pix, Wi-Fi, Contato, Texto)
    document.querySelectorAll('.content-type-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.content-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const type = btn.getAttribute('data-type');
        state.contentType = type;

        // Ocultar todos os painéis e mostrar o selecionado
        document.querySelectorAll('.content-form-panel').forEach(p => p.classList.add('hidden'));
        const panel = document.getElementById(`panel-${type}`);
        if (panel) panel.classList.remove('hidden');

        updateQR(true);
      });
    });

    // Inputs dinâmicos dos formulários
    ['wa-phone', 'wa-message', 'pix-key', 'pix-name', 'pix-city', 'pix-amount',
     'wifi-ssid', 'wifi-pass', 'wifi-type', 'wifi-hidden',
     'vcard-name', 'vcard-tel', 'vcard-email', 'vcard-org', 'text-free'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => updateQR());
    });

    // 4. Abas Principais (Presets vs Personalização Manual)
    document.querySelectorAll('.nav-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetTab = btn.getAttribute('data-tab');
        document.querySelectorAll('.sub-tab-content').forEach(c => c.classList.add('hidden'));
        const tabEl = document.getElementById(`tab-${targetTab}`);
        if (tabEl) tabEl.classList.remove('hidden');
      });
    });

    // 5. Filtro de Categorias dos Presets
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const cat = chip.getAttribute('data-category');
        renderPresets(cat);
      });
    });

    // 6. Seleção de Formato dos Pontos (Dots)
    document.querySelectorAll('[data-dots-shape]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-dots-shape]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.dotsType = btn.getAttribute('data-dots-shape');
        state.activePresetId = null;
        updateQR(true);
      });
    });

    // 7. Seleção de Formato dos Cantos Externos
    document.querySelectorAll('[data-corner-shape]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-corner-shape]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.cornersSquareType = btn.getAttribute('data-corner-shape');
        state.activePresetId = null;
        updateQR(true);
      });
    });

    // 8. Seleção de Formato dos Cantos Internos (Dot)
    document.querySelectorAll('[data-corner-dot-shape]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-corner-dot-shape]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.cornersDotType = btn.getAttribute('data-corner-dot-shape');
        state.activePresetId = null;
        updateQR(true);
      });
    });

    // 9. Cores & Gradientes
    const dotsColorInput = document.getElementById('input-dots-color');
    if (dotsColorInput) {
      dotsColorInput.addEventListener('input', (e) => {
        state.dotsColor = e.target.value;
        const hex = document.getElementById('hex-dots-color');
        if (hex) hex.textContent = e.target.value;
        updateQR();
      });
    }

    const dotsColor2Input = document.getElementById('input-dots-color2');
    if (dotsColor2Input) {
      dotsColor2Input.addEventListener('input', (e) => {
        state.dotsColor2 = e.target.value;
        const hex = document.getElementById('hex-dots-color2');
        if (hex) hex.textContent = e.target.value;
        updateQR();
      });
    }

    const toggleGrad = document.getElementById('toggle-gradient');
    if (toggleGrad) {
      toggleGrad.addEventListener('change', (e) => {
        state.dotsGradientEnabled = e.target.checked;
        const wrap = document.getElementById('gradient-controls-wrapper');
        if (wrap) wrap.classList.toggle('hidden', !state.dotsGradientEnabled);
        updateQR(true);
      });
    }

    const sliderRotation = document.getElementById('slider-gradient-rotation');
    if (sliderRotation) {
      sliderRotation.addEventListener('input', (e) => {
        state.dotsGradientRotation = e.target.value;
        const val = document.getElementById('val-gradient-rotation');
        if (val) val.textContent = `${e.target.value}°`;
        updateQR();
      });
    }

    // Cor de Fundo
    const bgColorInput = document.getElementById('input-bg-color');
    if (bgColorInput) {
      bgColorInput.addEventListener('input', (e) => {
        state.bgColor = e.target.value;
        state.bgTransparent = false;
        const hex = document.getElementById('hex-bg-color');
        if (hex) hex.textContent = e.target.value;
        updateQR();
      });
    }

    const toggleTransparent = document.getElementById('toggle-transparent-bg');
    if (toggleTransparent) {
      toggleTransparent.addEventListener('change', (e) => {
        state.bgTransparent = e.target.checked;
        updateQR(true);
      });
    }

    // 10. Seleção de Logotipos Prontos
    document.querySelectorAll('[data-logo-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-logo-id');
        if (state.logoType === 'icon' && state.logoIconId === id) {
          // Desmarcar se clicar novamente
          state.logoType = 'none';
          state.logoIconId = null;
          btn.classList.remove('active');
        } else {
          document.querySelectorAll('[data-logo-id]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.logoType = 'icon';
          state.logoIconId = id;
          state.logoCustomDataUrl = null;
          const customName = document.getElementById('custom-logo-name');
          if (customName) customName.textContent = '';
        }
        updateQR(true);
      });
    });

    // Upload de Logo Customizado
    const logoFileInput = document.getElementById('file-logo-upload');
    const uploadBox = document.getElementById('upload-logo-box');
    if (uploadBox && logoFileInput) {
      uploadBox.addEventListener('click', () => logoFileInput.click());
      logoFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            state.logoType = 'custom';
            state.logoCustomDataUrl = event.target.result;
            state.logoIconId = null;
            document.querySelectorAll('[data-logo-id]').forEach(b => b.classList.remove('active'));
            const customName = document.getElementById('custom-logo-name');
            if (customName) customName.textContent = `Arquivo: ${file.name}`;
            updateQR(true);
            showToast('Logo carregado!');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    const btnRemoveLogo = document.getElementById('btn-remove-logo');
    if (btnRemoveLogo) {
      btnRemoveLogo.addEventListener('click', () => {
        state.logoType = 'none';
        state.logoIconId = null;
        state.logoCustomDataUrl = null;
        document.querySelectorAll('[data-logo-id]').forEach(b => b.classList.remove('active'));
        const customName = document.getElementById('custom-logo-name');
        if (customName) customName.textContent = '';
        updateQR(true);
        showToast('Logo removido');
      });
    }

    // Sliders de Logo
    const sliderLogoSize = document.getElementById('slider-logo-size');
    if (sliderLogoSize) {
      sliderLogoSize.addEventListener('input', (e) => {
        state.logoSize = parseFloat(e.target.value);
        document.getElementById('val-logo-size').textContent = `${Math.round(state.logoSize * 100)}%`;
        updateQR();
      });
    }

    // 11. Molduras & Textos (Frames)
    document.querySelectorAll('[data-frame-style]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-frame-style]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.frameStyle = btn.getAttribute('data-frame-style');
        updateQR(true);
      });
    });

    const frameTextInput = document.getElementById('input-frame-text');
    if (frameTextInput) {
      frameTextInput.addEventListener('input', (e) => {
        state.frameText = e.target.value;
        updateQR();
      });
    }

    const frameBgInput = document.getElementById('input-frame-bg');
    if (frameBgInput) {
      frameBgInput.addEventListener('input', (e) => {
        state.frameBgColor = e.target.value;
        updateQR();
      });
    }

    // 12. Botões de Download
    const btnDownloadPng = document.getElementById('btn-download-png');
    if (btnDownloadPng) {
      btnDownloadPng.addEventListener('click', () => downloadFile('png'));
    }

    const btnDownloadSvg = document.getElementById('btn-download-svg');
    if (btnDownloadSvg) {
      btnDownloadSvg.addEventListener('click', () => downloadFile('svg'));
    }

    const btnDownloadWebp = document.getElementById('btn-download-webp');
    if (btnDownloadWebp) {
      btnDownloadWebp.addEventListener('click', () => downloadFile('webp'));
    }

    // 13. Copiar para Área de Transferência
    const btnCopy = document.getElementById('btn-copy-image');
    if (btnCopy) {
      btnCopy.addEventListener('click', copyImageToClipboard);
    }

    // 14. Imprimir
    const btnPrint = document.getElementById('btn-print-qr');
    if (btnPrint) {
      btnPrint.addEventListener('click', printQRCode);
    }

    // 15. Testar Link
    const btnTest = document.getElementById('btn-test-url');
    if (btnTest) {
      btnTest.addEventListener('click', () => {
        const content = getContentString();
        if (content.startsWith('http://') || content.startsWith('https://')) {
          window.open(content, '_blank', 'noopener,noreferrer');
        } else {
          showToast('O conteúdo atual não é um link direto');
        }
      });
    }

    // 16. Tema Claro/Escuro
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.addEventListener('click', toggleTheme);
    }
  }

  // --- Sistema de Download Inteligente ---
  async function downloadFile(extension = 'png') {
    if (!qrCodeInstance) return;

    saveToHistory();

    // Se o estilo de moldura for "none", baixa diretamente pela lib
    if (state.frameStyle === 'none') {
      qrCodeInstance.download({
        name: 'olivelas-qrcode',
        extension: extension
      });
      showToast(`Baixando QR Code (${extension.toUpperCase()})...`);
      return;
    }

    // Se tiver moldura (bottom, top, card), sintetizamos em canvas com alta resolução
    try {
      showToast('Renderizando moldura em alta definição...');
      const compositeCanvas = await createCompositeFramedCanvas();
      
      const link = document.createElement('a');
      link.download = `olivelas-qrcode-com-moldura.${extension}`;
      link.href = compositeCanvas.toDataURL(extension === 'webp' ? 'image/webp' : 'image/png', 0.95);
      link.click();
      showToast('Download concluído com sucesso!');
    } catch (err) {
      console.error(err);
      qrCodeInstance.download({ name: 'olivelas-qrcode', extension: extension });
    }
  }

  // --- Criação do Canvas Composto com Moldura ---
  async function createCompositeFramedCanvas() {
    return new Promise((resolve) => {
      const qrCanvas = elements.qrTarget.querySelector('canvas');
      if (!qrCanvas) {
        resolve(null);
        return;
      }

      const qrSize = 1000;
      const padding = 100;
      const textHeight = 160;
      const width = qrSize + (padding * 2);
      const height = qrSize + (padding * 2) + (state.frameStyle !== 'none' ? textHeight : 0);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Fundo
      if (state.frameStyle === 'bottom') {
        ctx.fillStyle = state.frameBgColor || '#4f46e5';
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      // Moldura estilo Card
      if (state.frameStyle === 'card') {
        ctx.lineWidth = 16;
        ctx.strokeStyle = state.dotsColor;
        ctx.strokeRect(30, 30, width - 60, height - 60);
      }

      // Desenhar QR Code no Centro
      const qrOffsetY = state.frameStyle === 'top' ? textHeight : padding;
      ctx.drawImage(qrCanvas, padding, qrOffsetY, qrSize, qrSize);

      // Desenhar Texto da Moldura
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

      if (state.frameStyle === 'bottom') {
        ctx.fillStyle = state.frameTextColor || '#ffffff';
        ctx.fillText(state.frameText || 'ESCANEIE-ME', width / 2, height - (textHeight / 2));
      } else if (state.frameStyle === 'top') {
        ctx.fillStyle = state.frameBgColor || '#4f46e5';
        ctx.fillText(state.frameText || 'SCAN HERE', width / 2, textHeight / 2);
      } else if (state.frameStyle === 'card') {
        ctx.fillStyle = state.dotsColor;
        ctx.fillText(state.frameText || 'APONTE A CÂMERA', width / 2, height - (textHeight / 2));
      }

      resolve(canvas);
    });
  }

  // --- Copiar Imagem para o Clipboard ---
  async function copyImageToClipboard() {
    try {
      const qrCanvas = elements.qrTarget.querySelector('canvas');
      if (!qrCanvas) return;

      let canvasToCopy = qrCanvas;
      if (state.frameStyle !== 'none') {
        canvasToCopy = await createCompositeFramedCanvas();
      }

      canvasToCopy.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          showToast('Imagem copiada para a área de transferência! (Cole no WhatsApp, Figma, etc)');
        } catch (e) {
          showToast('Não foi possível copiar automaticamente no navegador');
        }
      }, 'image/png');
    } catch (err) {
      showToast('Erro ao copiar imagem');
    }
  }

  // --- Impressão ---
  function printQRCode() {
    const qrCanvas = elements.qrTarget.querySelector('canvas');
    if (!qrCanvas) return;

    const dataUrl = qrCanvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir QR Code - Olivelas</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; text-align: center; }
            img { max-width: 400px; height: auto; }
            h2 { margin-top: 1.5rem; color: #1e293b; }
            p { color: #64748b; font-size: 0.9rem; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="QR Code" />
          <h2>${state.frameText || 'Escaneie para Acessar'}</h2>
          <p>${getContentString()}</p>
          <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  // --- Toast de Notificação ---
  function showToast(message) {
    if (!elements.toast) return;
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    clearTimeout(elements.toast._timer);
    elements.toast._timer = setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 2800);
  }

  // --- Histórico no LocalStorage ---
  function saveToHistory() {
    try {
      const item = {
        data: getContentString(),
        type: state.contentType,
        presetId: state.activePresetId,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      let list = JSON.parse(localStorage.getItem('olivelas_qr_history') || '[]');
      list = [item, ...list.filter(x => x.data !== item.data)].slice(0, 5);
      localStorage.setItem('olivelas_qr_history', JSON.stringify(list));
      loadHistory();
    } catch (e) {}
  }

  function loadHistory() {
    const container = document.getElementById('history-container');
    if (!container) return;
    try {
      const list = JSON.parse(localStorage.getItem('olivelas_qr_history') || '[]');
      if (list.length === 0) {
        container.innerHTML = '<p style="font-size:0.8rem;color:var(--text-muted);">Nenhum QR code gerado recentemente.</p>';
        return;
      }
      container.innerHTML = '';
      list.forEach(item => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0.6rem;background:var(--bg-surface-secondary);border-radius:6px;margin-bottom:0.4rem;font-size:0.8rem;cursor:pointer;';
        row.innerHTML = `<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:230px;color:var(--brand-primary);">${item.data}</span><span style="color:var(--text-muted);font-size:0.7rem;">${item.date}</span>`;
        row.addEventListener('click', () => {
          if (elements.urlInput) elements.urlInput.value = item.data;
          updateQR(true);
          showToast('Código recente carregado!');
        });
        container.appendChild(row);
      });
    } catch (e) {}
  }

  // --- Gerenciador de Tema (Dark / Light) ---
  function initTheme() {
    const savedTheme = localStorage.getItem('olivelas_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(current);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('olivelas_theme', theme);
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.innerHTML = theme === 'dark'
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
  }

  // Auto-start quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
