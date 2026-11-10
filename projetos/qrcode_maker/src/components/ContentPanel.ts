import { QRState, ContentType } from '../types';
import { URL_SHORTENERS, shortenUrlWithFallback } from '../services/shorteners';
import { generatePixBRCode, PixOptions } from '../services/pixEngine';
import { generateWifiString, WifiOptions } from '../services/wifiEngine';

export function renderContentPanel(
  state: QRState,
  onUpdateState: (partial: Partial<QRState>) => void,
  onShowToast: (msg: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'panel-card';

  container.innerHTML = `
    <div class="panel-title-bar">
      <h2 class="panel-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        1. Conteúdo do QR Code
      </h2>
    </div>

    <!-- Segmented Control Elegante de Tipos de Conteúdo (Sem rolagem horizontal) -->
    <div class="content-type-tabs" role="tablist">
      <button class="content-type-btn ${state.contentType === 'url' ? 'active' : ''}" data-type="url" type="button">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        <span>Link / URL</span>
      </button>
      <button class="content-type-btn ${state.contentType === 'whatsapp' ? 'active' : ''}" data-type="whatsapp" type="button">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        <span>WhatsApp</span>
      </button>
      <button class="content-type-btn ${state.contentType === 'pix' ? 'active' : ''}" data-type="pix" type="button">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 2 12l10 10 10-10L12 2z"/><path d="M7 12h10"/><path d="M12 7v10"/></svg>
        <span>Pix</span>
      </button>
      <button class="content-type-btn ${state.contentType === 'wifi' ? 'active' : ''}" data-type="wifi" type="button">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
        <span>Wi-Fi</span>
      </button>
      <button class="content-type-btn ${state.contentType === 'vcard' ? 'active' : ''}" data-type="vcard" type="button">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>Contato</span>
      </button>
      <button class="content-type-btn ${state.contentType === 'text' ? 'active' : ''}" data-type="text" type="button">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
        <span>Texto</span>
      </button>
    </div>

    <!-- Painel URL com Encurtadores -->
    <div id="content-panel-url" class="content-form-section ${state.contentType === 'url' ? '' : 'hidden'}">
      <div class="input-group">
        <span class="input-icon-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        </span>
        <input type="url" id="input-main-url" class="input-text" placeholder="Cole sua URL aqui (ex: https://meusite.com.br)" value="${state.rawUrl}" spellcheck="false" autocomplete="off">
        <button type="button" id="btn-paste-clipboard" class="input-addon-btn" title="Colar link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
          Colar
        </button>
      </div>

      <!-- Barra de Encurtamento de URL (10+ Provedores) -->
      <div class="shortener-bar-card">
        <div class="shortener-bar-header">
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" stroke-width="2.2"><path d="m15 15 6 6m-6-6v4.8m0-4.8h4.8"/><path d="M9 19.8V15m0 0H4.2m4.8 0L3 21"/><path d="M15 4.2V9m0 0h4.8M15 9l6-6"/><path d="M9 4.2V9m0 0H4.2M9 9 3 3"/></svg>
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">Encurtador de URL</span>
            <span class="badge-tag-count" style="font-size: 0.7rem;">11 Serviços Disponíveis</span>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Links curtos geram QR Codes mais fáceis de escanear!</span>
        </div>

        <div class="shortener-controls-row">
          <select id="select-shortener-provider" class="shortener-select" aria-label="Selecione o encurtador">
            ${URL_SHORTENERS.map(s => {
              const tag = s.id === 'isgd' ? ' (Nativo) ★ Recomendado' : (['vgd', 'dagd', 'clckru'].includes(s.id) ? ' (Nativo)' : '');
              return `<option value="${s.id}" ${s.id === 'isgd' ? 'selected' : ''}>${s.name}${tag}</option>`;
            }).join('')}
          </select>
          <button type="button" id="btn-execute-shorten" class="btn-shorten-action">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span id="btn-shorten-label">Encurtar URL</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Painel WhatsApp -->
    <div id="content-panel-whatsapp" class="content-form-section ${state.contentType === 'whatsapp' ? '' : 'hidden'}">
      <div class="form-grid-2">
        <div class="form-field-group">
          <label class="form-label">Número com DDI e DDD (ex: 5511999998888)</label>
          <input type="tel" id="input-wa-phone" class="input-text no-icon" placeholder="Ex: 5511999998888">
        </div>
        <div class="form-field-group">
          <label class="form-label">Mensagem Automática</label>
          <input type="text" id="input-wa-msg" class="input-text no-icon" placeholder="Ex: Olá, gostaria de mais informações!">
        </div>
      </div>
    </div>

    <!-- Painel Pix (Padrão Oficial BACEN / BR Code / EMV QRCPS-MPM) -->
    <div id="content-panel-pix" class="content-form-section ${state.contentType === 'pix' ? '' : 'hidden'}">
      <div class="pix-notice-banner">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>Gera código compatível com <strong>todos os aplicativos bancários</strong> (Nubank, Itaú, Bradesco, Santander, Inter, Caixa, BB, etc.)</span>
      </div>

      <div class="form-grid-2">
        <div class="form-field-group">
          <label class="form-label">Tipo de Chave</label>
          <select id="select-pix-keytype" class="input-text no-icon">
            <option value="auto">Detectar Automaticamente</option>
            <option value="phone">Celular (com DDD)</option>
            <option value="cpf">CPF (11 dígitos)</option>
            <option value="cnpj">CNPJ (14 dígitos)</option>
            <option value="email">E-mail</option>
            <option value="evp">Chave Aleatória (EVP)</option>
          </select>
        </div>

        <div class="form-field-group">
          <label class="form-label">Chave Pix *</label>
          <input type="text" id="input-pix-key" class="input-text no-icon" placeholder="Ex: 11999998888, maria@email.com, 123.456.789-00">
        </div>

        <div class="form-field-group">
          <label class="form-label">Nome do Beneficiário *</label>
          <input type="text" id="input-pix-name" class="input-text no-icon" placeholder="Ex: Maria Silva (máx 25 letras)">
        </div>

        <div class="form-field-group">
          <label class="form-label">Cidade *</label>
          <input type="text" id="input-pix-city" class="input-text no-icon" placeholder="Ex: SAO PAULO (máx 15 letras)">
        </div>

        <div class="form-field-group">
          <label class="form-label">Valor R$ (Opcional - deixe vazio p/ valor livre)</label>
          <input type="number" step="0.01" min="0" id="input-pix-amount" class="input-text no-icon" placeholder="Ex: 50.00">
        </div>

        <div class="form-field-group">
          <label class="form-label">Identificador / TxID (Opcional)</label>
          <input type="text" id="input-pix-txid" class="input-text no-icon" placeholder="Padrão: *** ou seu código de pedido">
        </div>

        <div class="form-field-group" style="grid-column: span 2;">
          <label class="form-label">Descrição / Mensagem (Opcional)</label>
          <input type="text" id="input-pix-desc" class="input-text no-icon" placeholder="Ex: Pagamento Pedido 104">
        </div>
      </div>

      <!-- Caixa de Visualização e Cópia do Pix Copia e Cola -->
      <div class="pix-copia-cola-box">
        <div class="pix-copia-cola-header">
          <div class="pix-badge-emv">
            <span class="pulse-mini"></span>
            <span>BR Code Oficial (EMV)</span>
          </div>
          <button type="button" id="btn-copy-pix-code" class="btn-copy-pix">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span>Copiar Pix Copia e Cola</span>
          </button>
        </div>
        <div class="pix-code-preview-wrap">
          <code id="pix-emv-display" class="pix-code-preview">Preencha sua chave acima para gerar o código...</code>
        </div>
      </div>
    </div>

    <!-- Painel Wi-Fi (Padrão Universal ZXing / iOS / Android) -->
    <div id="content-panel-wifi" class="content-form-section ${state.contentType === 'wifi' ? '' : 'hidden'}">
      <div class="pix-notice-banner" style="background: rgba(14, 165, 233, 0.08); border-color: rgba(14, 165, 233, 0.25);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
        <span>Aponte a câmera do celular (iPhone ou Android) para <strong>conectar automaticamente ao Wi-Fi</strong> sem precisar digitar a senha.</span>
      </div>

      <div class="form-grid-2">
        <div class="form-field-group">
          <label class="form-label">Nome da Rede (SSID) *</label>
          <input type="text" id="input-wifi-ssid" class="input-text no-icon" placeholder="Ex: MinhaCasa_5G">
        </div>

        <div class="form-field-group">
          <label class="form-label">Tipo de Segurança *</label>
          <select id="select-wifi-enc" class="input-text no-icon">
            <option value="WPA2" selected>WPA2 / WPA2-PSK (AES) — Recomendado / Mais Comum</option>
            <option value="WPA">WPA / WPA-PSK (Universal / Roteadores Antigos)</option>
            <option value="WPA3">WPA3-Personal (SAE)</option>
            <option value="WEP">WEP (Legado)</option>
            <option value="nopass">Rede Aberta (Sem senha)</option>
          </select>
        </div>

        <div class="form-field-group" id="group-wifi-pass">
          <label class="form-label">Senha do Wi-Fi</label>
          <div style="position: relative; display: flex; align-items: center; width: 100%;">
            <input type="password" id="input-wifi-pass" class="input-text no-icon" placeholder="Senha da rede (mín. 8 caracteres)" style="padding-right: 2.5rem; width: 100%;">
            <button type="button" id="btn-toggle-wifi-pass" style="position: absolute; right: 0.6rem; background: none; border: none; cursor: pointer; color: var(--text-muted); display: grid; place-items: center; padding: 0.2rem;" title="Mostrar/ocultar senha">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <span id="wifi-pass-hint" style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">Mínimo 8 caracteres para WPA2/WPA/WPA3</span>
        </div>

        <div class="form-field-group" style="justify-content: flex-end; padding-bottom: 0.2rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; cursor: pointer; user-select: none; color: var(--text-secondary);">
            <input type="checkbox" id="input-wifi-hidden" style="width: 16px; height: 16px; accent-color: var(--brand-primary); cursor: pointer;">
            <span>Rede Oculta (Não transmite SSID)</span>
          </label>
        </div>

        <div style="grid-column: span 2; display: flex; justify-content: flex-end;">
          <button type="button" id="btn-apply-wifi-logo" class="btn-secondary-action" style="font-size: 0.78rem; padding: 0.35rem 0.75rem; display: inline-flex; align-items: center; gap: 0.35rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
            <span>Inserir Logo Oficial Wi-Fi no centro do QR Code</span>
          </button>
        </div>
      </div>

      <!-- Caixa de Visualização do Código de Conexão -->
      <div class="pix-copia-cola-box" style="margin-top: 1rem;">
        <div class="pix-copia-cola-header">
          <div class="pix-badge-emv" style="color: #0284c7;">
            <span class="pulse-mini" style="background: #0284c7; box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.7);"></span>
            <span>Padrão Universal ZXing (WIFI:)</span>
          </div>
          <button type="button" id="btn-copy-wifi-code" class="btn-copy-pix" style="background: #0284c7;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span>Copiar Código Wi-Fi</span>
          </button>
        </div>
        <div class="pix-code-preview-wrap">
          <code id="wifi-code-display" class="pix-code-preview">Preencha o nome da rede (SSID) acima para gerar o código...</code>
        </div>
      </div>
    </div>

    <!-- Painel VCard / Contato -->
    <div id="content-panel-vcard" class="content-form-section ${state.contentType === 'vcard' ? '' : 'hidden'}">
      <div class="form-grid-2">
        <div class="form-field-group">
          <label class="form-label">Nome Completo</label>
          <input type="text" id="input-vcard-name" class="input-text no-icon" placeholder="Ex: Carlos Eduardo">
        </div>
        <div class="form-field-group">
          <label class="form-label">Telefone / WhatsApp</label>
          <input type="tel" id="input-vcard-tel" class="input-text no-icon" placeholder="+55 11 98888-7777">
        </div>
        <div class="form-field-group">
          <label class="form-label">E-mail</label>
          <input type="email" id="input-vcard-email" class="input-text no-icon" placeholder="carlos@empresa.com">
        </div>
        <div class="form-field-group">
          <label class="form-label">Empresa / Cargo</label>
          <input type="text" id="input-vcard-org" class="input-text no-icon" placeholder="Ex: Diretor de Tecnologia">
        </div>
      </div>
    </div>

    <!-- Painel Texto Livre -->
    <div id="content-panel-text" class="content-form-section ${state.contentType === 'text' ? '' : 'hidden'}">
      <div class="form-field-group">
        <label class="form-label">Texto</label>
        <textarea id="input-text-free" class="input-text no-icon" rows="3" placeholder="Digite ou cole qualquer texto aqui..."></textarea>
      </div>
    </div>
  `;

  // --- Handlers de Eventos ---

  // Troca de Aba
  container.querySelectorAll('.content-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type') as ContentType;
      container.querySelectorAll('.content-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      container.querySelectorAll('.content-form-section').forEach(p => p.classList.add('hidden'));
      container.querySelector(`#content-panel-${type}`)?.classList.remove('hidden');

      onUpdateState({ contentType: type });
      syncOtherInputs();
    });
  });

  // Input de URL Principal
  const urlInput = container.querySelector('#input-main-url') as HTMLInputElement;
  urlInput?.addEventListener('input', () => {
    let val = urlInput.value.trim();
    if (val && !val.startsWith('http://') && !val.startsWith('https://')) {
      val = 'https://' + val;
    }
    onUpdateState({ rawUrl: urlInput.value, data: val || 'https://github.com/pycriador/olivelas-qrcode' });
  });

  // Botão Colar
  container.querySelector('#btn-paste-clipboard')?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlInput.value = text;
        let val = text.trim();
        if (val && !val.startsWith('http://') && !val.startsWith('https://')) {
          val = 'https://' + val;
        }
        onUpdateState({ rawUrl: text, data: val });
        onShowToast('Link colado com sucesso!');
      }
    } catch {
      urlInput.focus();
      onShowToast('Pressione Ctrl+V para colar');
    }
  });

  // Executar Encurtador de URL
  const btnShorten = container.querySelector('#btn-execute-shorten') as HTMLButtonElement;
  const selectShortener = container.querySelector('#select-shortener-provider') as HTMLSelectElement;
  const shortenLabel = container.querySelector('#btn-shorten-label') as HTMLSpanElement;

  btnShorten?.addEventListener('click', async () => {
    const raw = urlInput.value.trim();
    if (!raw) {
      onShowToast('Por favor, digite ou cole uma URL primeiro');
      urlInput.focus();
      return;
    }

    let urlToShorten = raw;
    if (!urlToShorten.startsWith('http://') && !urlToShorten.startsWith('https://')) {
      urlToShorten = 'https://' + urlToShorten;
    }

    const providerId = selectShortener.value;
    btnShorten.disabled = true;
    shortenLabel.textContent = 'Encurtando...';

    try {
      const res = await shortenUrlWithFallback(urlToShorten, providerId);
      if (res && res.shortUrl) {
        urlInput.value = res.shortUrl;
        onUpdateState({ rawUrl: res.shortUrl, data: res.shortUrl });
        try {
          await navigator.clipboard.writeText(res.shortUrl);
        } catch {}
        
        if (res.usedFallback) {
          onShowToast(`Encurtado com ${res.providerName} (alta disponibilidade)! Copiado!`);
        } else {
          onShowToast(`Encurtado via ${res.providerName}! Link copiado com sucesso!`);
        }
      } else {
        throw new Error('Retorno vazio');
      }
    } catch (err: any) {
      onShowToast(`Erro ao encurtar: ${err.message || 'Tente novamente.'}`);
    } finally {
      btnShorten.disabled = false;
      shortenLabel.textContent = 'Encurtar URL';
    }
  });

  // Botão de Copiar Pix Copia e Cola
  container.querySelector('#btn-copy-pix-code')?.addEventListener('click', async () => {
    const pixKey = (container.querySelector('#input-pix-key') as HTMLInputElement)?.value.trim();
    if (!pixKey) {
      onShowToast('Digite uma chave Pix primeiro para gerar o código');
      (container.querySelector('#input-pix-key') as HTMLInputElement)?.focus();
      return;
    }
    const brCode = generatePixBRCode({
      key: pixKey,
      keyType: (container.querySelector('#select-pix-keytype') as HTMLSelectElement)?.value as any || 'auto',
      name: (container.querySelector('#input-pix-name') as HTMLInputElement)?.value.trim(),
      city: (container.querySelector('#input-pix-city') as HTMLInputElement)?.value.trim(),
      amount: (container.querySelector('#input-pix-amount') as HTMLInputElement)?.value.trim(),
      txid: (container.querySelector('#input-pix-txid') as HTMLInputElement)?.value.trim(),
      description: (container.querySelector('#input-pix-desc') as HTMLInputElement)?.value.trim()
    });
    if (brCode) {
      try {
        await navigator.clipboard.writeText(brCode);
        onShowToast('Código Pix Copia e Cola copiado com sucesso! Válido em qualquer banco.');
      } catch {
        onShowToast('Código Pix gerado!');
      }
    }
  });

  // Botão de Copiar Configuração Wi-Fi
  container.querySelector('#btn-copy-wifi-code')?.addEventListener('click', async () => {
    const wifiSsid = (container.querySelector('#input-wifi-ssid') as HTMLInputElement)?.value.trim();
    if (!wifiSsid) {
      onShowToast('Digite o nome da rede Wi-Fi primeiro');
      (container.querySelector('#input-wifi-ssid') as HTMLInputElement)?.focus();
      return;
    }
    const wifiCode = generateWifiString({
      ssid: wifiSsid,
      password: (container.querySelector('#input-wifi-pass') as HTMLInputElement)?.value || '',
      encryption: (container.querySelector('#select-wifi-enc') as HTMLSelectElement)?.value as any || 'WPA',
      hidden: (container.querySelector('#input-wifi-hidden') as HTMLInputElement)?.checked || false
    });
    if (wifiCode) {
      try {
        await navigator.clipboard.writeText(wifiCode);
        onShowToast('Código de conexão Wi-Fi copiado com sucesso!');
      } catch {
        onShowToast('Código Wi-Fi gerado!');
      }
    }
  });

  // Alternar visualização da senha do Wi-Fi
  const btnToggleWifi = container.querySelector('#btn-toggle-wifi-pass');
  const inputWifiPass = container.querySelector('#input-wifi-pass') as HTMLInputElement;
  btnToggleWifi?.addEventListener('click', () => {
    if (inputWifiPass) {
      inputWifiPass.type = inputWifiPass.type === 'password' ? 'text' : 'password';
    }
  });

  // Aplicar logotipo do Wi-Fi ao QR Code com 1 clique
  container.querySelector('#btn-apply-wifi-logo')?.addEventListener('click', () => {
    onUpdateState({ logoType: 'wikipedia', selectedWikipediaLogoId: 'wifi' });
    onShowToast('Logotipo oficial do Wi-Fi aplicado ao centro do QR Code!');
  });

  // Formulários dinâmicos
  const syncOtherInputs = () => {
    const waPhone = (container.querySelector('#input-wa-phone') as HTMLInputElement)?.value.replace(/\D/g, '') || '';
    const waMsg = encodeURIComponent((container.querySelector('#input-wa-msg') as HTMLInputElement)?.value || '');
    
    // Pix Oficial BACEN
    const pixKey = (container.querySelector('#input-pix-key') as HTMLInputElement)?.value.trim() || '';
    const pixKeyType = (container.querySelector('#select-pix-keytype') as HTMLSelectElement)?.value as any || 'auto';
    const pixName = (container.querySelector('#input-pix-name') as HTMLInputElement)?.value.trim() || '';
    const pixCity = (container.querySelector('#input-pix-city') as HTMLInputElement)?.value.trim() || '';
    const pixAmt = (container.querySelector('#input-pix-amount') as HTMLInputElement)?.value.trim() || '';
    const pixTxid = (container.querySelector('#input-pix-txid') as HTMLInputElement)?.value.trim() || '';
    const pixDesc = (container.querySelector('#input-pix-desc') as HTMLInputElement)?.value.trim() || '';
    const pixDisplay = container.querySelector('#pix-emv-display') as HTMLElement;

    // Wi-Fi Padronizado ZXing / Android / iOS (WPA2 padrão)
    const wifiSsid = (container.querySelector('#input-wifi-ssid') as HTMLInputElement)?.value.trim() || '';
    const wifiPass = (container.querySelector('#input-wifi-pass') as HTMLInputElement)?.value || '';
    const wifiEnc = (container.querySelector('#select-wifi-enc') as HTMLSelectElement)?.value as any || 'WPA2';
    const wifiHidden = (container.querySelector('#input-wifi-hidden') as HTMLInputElement)?.checked || false;
    const wifiDisplay = container.querySelector('#wifi-code-display') as HTMLElement;
    const wifiPassGroup = container.querySelector('#group-wifi-pass') as HTMLElement;
    const wifiPassHint = container.querySelector('#wifi-pass-hint') as HTMLElement;

    if (wifiPassGroup) {
      wifiPassGroup.style.display = wifiEnc === 'nopass' ? 'none' : 'flex';
    }

    if (wifiPassHint) {
      if (wifiEnc === 'nopass') {
        wifiPassHint.textContent = 'Rede aberta não necessita de senha.';
        wifiPassHint.style.color = 'var(--text-muted)';
      } else if (wifiPass.length > 0 && wifiPass.length < 8 && (wifiEnc === 'WPA2' || wifiEnc === 'WPA' || wifiEnc === 'WPA3')) {
        wifiPassHint.textContent = '⚠️ Atenção: Senhas WPA/WPA2 devem ter no mínimo 8 caracteres para os celulares conectarem.';
        wifiPassHint.style.color = '#ef4444';
      } else {
        wifiPassHint.textContent = 'Mínimo de 8 caracteres para redes WPA2/WPA/WPA3.';
        wifiPassHint.style.color = 'var(--text-muted)';
      }
    }

    const vName = (container.querySelector('#input-vcard-name') as HTMLInputElement)?.value || '';
    const vTel = (container.querySelector('#input-vcard-tel') as HTMLInputElement)?.value || '';
    const vEmail = (container.querySelector('#input-vcard-email') as HTMLInputElement)?.value || '';
    const vOrg = (container.querySelector('#input-vcard-org') as HTMLInputElement)?.value || '';

    const textFree = (container.querySelector('#input-text-free') as HTMLTextAreaElement)?.value || '';

    let generatedData = state.data;
    if (state.contentType === 'whatsapp') {
      generatedData = `https://wa.me/${waPhone}${waMsg ? '?text=' + waMsg : ''}`;
    } else if (state.contentType === 'pix') {
      if (pixKey) {
        const brCode = generatePixBRCode({
          key: pixKey,
          keyType: pixKeyType,
          name: pixName,
          city: pixCity,
          amount: pixAmt,
          txid: pixTxid,
          description: pixDesc
        });
        generatedData = brCode;
        if (pixDisplay) pixDisplay.textContent = brCode;
      } else {
        generatedData = '00020126330014br.gov.bcb.pix0111000000000005204000053039865802BR5910RECEBEDOR6008BRASILIA62070503***63045E1B';
        if (pixDisplay) pixDisplay.textContent = 'Preencha sua chave acima para gerar o código...';
      }
    } else if (state.contentType === 'wifi') {
      if (wifiSsid) {
        const wifiCode = generateWifiString({
          ssid: wifiSsid,
          password: wifiPass,
          encryption: wifiEnc,
          hidden: wifiHidden
        });
        generatedData = wifiCode;
        if (wifiDisplay) wifiDisplay.textContent = wifiCode;
      } else {
        generatedData = 'WIFI:T:WPA2;S:MinhaRede_5G;P:senha123;;';
        if (wifiDisplay) wifiDisplay.textContent = 'Preencha o nome da rede (SSID) acima para gerar o código...';
      }
    } else if (state.contentType === 'vcard') {
      generatedData = `BEGIN:VCARD\nVERSION:3.0\nN:${vName}\nFN:${vName}\nORG:${vOrg}\nTEL:${vTel}\nEMAIL:${vEmail}\nEND:VCARD`;
    } else if (state.contentType === 'text') {
      generatedData = textFree || 'Olá, mundo!';
    }

    onUpdateState({ data: generatedData });
  };

  const dynamicInputs = [
    'input-wa-phone', 'input-wa-msg',
    'select-pix-keytype', 'input-pix-key', 'input-pix-name', 'input-pix-city', 'input-pix-amount', 'input-pix-txid', 'input-pix-desc',
    'input-wifi-ssid', 'input-wifi-pass', 'select-wifi-enc', 'input-wifi-hidden',
    'input-vcard-name', 'input-vcard-tel', 'input-vcard-email', 'input-vcard-org',
    'input-text-free'
  ];

  dynamicInputs.forEach(id => {
    const el = container.querySelector(`#${id}`);
    if (el) {
      el.addEventListener('input', syncOtherInputs);
      el.addEventListener('change', syncOtherInputs);
    }
  });

  return container;
}
