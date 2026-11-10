import { QRState } from '../types';

export function renderHeader(
  state: QRState,
  onToggleTheme: () => void,
  onSwitchView: (view: 'app' | 'docs') => void,
  onToggleCollapse: () => void
): HTMLElement {
  const header = document.createElement('header');
  header.className = 'app-header';

  header.innerHTML = `
    <div class="header-container">
      <a href="#/" class="brand-wrapper" title="Ir para o Criador de QR Code">
        <div class="brand-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="8" height="8" x="2" y="2" rx="2"></rect>
            <rect width="8" height="8" x="14" y="2" rx="2"></rect>
            <rect width="8" height="8" x="2" y="14" rx="2"></rect>
            <rect width="4" height="4" x="15" y="15" rx="1"></rect>
          </svg>
        </div>
        <div>
          <span class="brand-title">Olivelas QR Code</span>
          <span class="brand-tag">PRO TS</span>
        </div>
      </a>

      <!-- Links de Navegação Principal com URL Própria -->
      <nav class="header-nav" aria-label="Navegação Principal">
        <a href="#/" id="nav-btn-creator" class="nav-link-btn ${state.activeView === 'app' ? 'active' : ''}" title="Acessar o Criador de QR Code (URL: #/)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="8" height="8" x="2" y="2" rx="2"/><rect width="8" height="8" x="14" y="2" rx="2"/><rect width="8" height="8" x="2" y="14" rx="2"/><rect width="4" height="4" x="15" y="15" rx="1"/></svg>
          <span>Criador</span>
        </a>
        <a href="#/docs" id="nav-btn-docs" class="nav-link-btn ${state.activeView === 'docs' ? 'active' : ''}" title="Acessar Documentação cURL & Python (URL: #/docs)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
          <span>cURL & Python API</span>
        </a>
        ${state.activeView === 'app' ? `
        <button id="btn-toggle-preview-nav" class="nav-link-btn btn-highlight" title="${state.isSidebarCollapsed ? 'Fixar e exibir o painel do QR Code' : 'Ocultar o painel do QR Code'}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${state.isSidebarCollapsed 
              ? '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>' 
              : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'}
          </svg>
          <span>${state.isSidebarCollapsed ? 'Mostrar QR Code' : 'Ocultar QR Code'}</span>
        </button>` : ''}
      </nav>

      <div class="header-actions">
        <span class="badge-counter">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          54+ Estilos Prontos
        </span>

        <button id="btn-theme-toggle" class="btn-icon" title="Alternar tema claro/escuro" aria-label="Alternar tema">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>

        <a href="https://github.com/pycriador/olivelas-qrcode" target="_blank" rel="noopener noreferrer" class="btn-icon" title="Ver código no GitHub" aria-label="GitHub">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
        </a>
      </div>
    </div>
  `;

  // Eventos
  header.querySelector('.brand-wrapper')?.addEventListener('click', (e) => {
    e.preventDefault();
    onSwitchView('app');
  });
  header.querySelector('#nav-btn-creator')?.addEventListener('click', (e) => {
    e.preventDefault();
    onSwitchView('app');
  });
  header.querySelector('#nav-btn-docs')?.addEventListener('click', (e) => {
    e.preventDefault();
    onSwitchView('docs');
  });
  header.querySelector('#btn-toggle-preview-nav')?.addEventListener('click', onToggleCollapse);
  header.querySelector('#btn-theme-toggle')?.addEventListener('click', onToggleTheme);

  return header;
}
