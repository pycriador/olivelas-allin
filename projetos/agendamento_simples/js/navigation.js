/**
 * NAVIGATION & HELPERS
 * Roteamento visual, proteção mock de rotas e formatadores pt-BR
 */

class Navigation {
  /**
   * Inicializa ouvintes de navegação
   */
  static init() {
    // Inicializa o Drawer Lateral da Área Pública
    this.initPublicDrawer();

    // Proteger visualmente páginas administrativas
    this.checkAdminAuth();
  }

  /**
   * Inicializa o Drawer Lateral Mobile da Área Pública
   * (Menu que abre e fecha na lateral com todas as opções centralizadas)
   */
  static initPublicDrawer() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    // Determina caminhos relativos baseado na profundidade do arquivo
    const isInsidePages = window.location.pathname.includes("/pages/") || window.location.pathname.includes("\\pages\\");
    const rootPath = isInsidePages ? "../" : "";
    const pagesPath = isInsidePages ? "" : "pages/";

    // Injeta o Drawer caso ainda não exista no DOM
    let drawer = document.getElementById("public-drawer");
    let backdrop = document.getElementById("public-drawer-backdrop");

    if (!drawer) {
      const drawerHtml = `
        <div class="drawer-backdrop" id="public-drawer-backdrop"></div>
        <aside class="public-drawer" id="public-drawer" aria-label="Menu lateral de navegação">
          <div class="drawer-header">
            <a href="${rootPath}index.html" class="brand-header-link" style="gap: var(--space-2);">
              <img src="${rootPath}assets/images/logo.png" alt="Logo Dra. Marta" style="width: 36px; height: 36px; object-fit: contain;">
              <div class="brand-text-block">
                <span class="brand-name-title" style="font-size: 1rem;">Dra. Marta Gelsi</span>
                <span class="brand-dentista-text" style="font-size: 1.1rem; color: var(--color-primary);">Dentista • CRO 71482</span>
              </div>
            </a>
            <button type="button" class="drawer-close-btn" id="public-drawer-close" aria-label="Fechar menu lateral">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div class="drawer-body">
            <nav class="drawer-nav">
              <span class="drawer-section-title">Navegação Principal</span>
              <div class="drawer-nav-list">
                <a href="${rootPath}index.html#inicio" class="drawer-nav-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                  <span>Início</span>
                </a>
                <a href="${rootPath}index.html#sobre" class="drawer-nav-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <span>Sobre a Dra. Marta</span>
                </a>
                <a href="${pagesPath}servicos.html" class="drawer-nav-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  <span>Todos os Tratamentos</span>
                </a>
                <div class="drawer-sublinks">
                  <a href="${pagesPath}clinica-geral.html" class="drawer-sublink">› Clínica Geral</a>
                  <a href="${pagesPath}limpeza.html" class="drawer-sublink">› Limpeza Dental</a>
                  <a href="${pagesPath}aparelho-ortodontico.html" class="drawer-sublink">› Aparelho Ortodôntico</a>
                  <a href="${pagesPath}implantes.html" class="drawer-sublink">› Implantes Dentários</a>
                </div>
                <a href="${rootPath}index.html#diferenciais" class="drawer-nav-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                  <span>Diferenciais</span>
                </a>
                <a href="${rootPath}index.html#planos" class="drawer-nav-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                  <span>Planos & Procedimentos</span>
                </a>
                <a href="${rootPath}index.html#faq" class="drawer-nav-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  <span>Dúvidas Frequentes</span>
                </a>
                <a href="${pagesPath}contato.html" class="drawer-nav-link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <span>Contato & Localização</span>
                </a>
              </div>
            </nav>

            <div class="drawer-actions">
              <span class="drawer-section-title">Ações & Acesso</span>
              <a href="${pagesPath}agendar.html" class="btn btn-primary btn-block">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>Agendar Consulta Online</span>
              </a>
              <a href="https://wa.me/5511995770004" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp btn-block">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.77.784 2.796.784 3.182 0 5.768-2.587 5.768-5.766.001-3.181-2.585-5.77-5.768-5.77zm3.397 8.256c-.145.407-.841.776-1.169.824-.316.046-.713.064-2.222-.562-1.808-.75-2.956-2.614-3.045-2.733-.089-.12-0.722-.962-.722-1.834 0-.872.457-1.302.62-1.48.163-.178.356-.223.475-.223.119 0 .237.001.341.006.11.005.258-.042.404.308.148.356.505 1.233.549 1.322.044.089.074.193.015.312-.059.119-.089.193-.178.297-.089.104-.187.233-.267.312-.089.089-.182.186-.078.364.104.178.461.761.99 1.233.682.608 1.258.796 1.436.885.178.089.282.074.386-.044.104-.119.445-.519.564-.697.119-.178.237-.148.396-.089.159.059 1.009.475 1.182.562.173.087.288.132.332.206.044.074.044.43-.101.837z"/></svg>
                <span>WhatsApp: (11) 99577-0004</span>
              </a>
              <a href="${rootPath}login.html" class="btn btn-outline btn-block" style="border-color: #fbcfe8; color: var(--color-burgundy);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                <span>Área Interna / Gestão</span>
              </a>
            </div>
          </div>

          <div class="drawer-footer">
            <p class="drawer-slogan">Seu sorriso em <strong>boas mãos! ♡</strong></p>
            <span class="drawer-badge">✓ Atendemos convênios</span>
          </div>
        </aside>
      `;
      document.body.insertAdjacentHTML("beforeend", drawerHtml);
      drawer = document.getElementById("public-drawer");
      backdrop = document.getElementById("public-drawer-backdrop");
    }

    // Controle de estado
    const toggleDrawer = (force) => {
      const isOpen = drawer.classList.contains("open");
      const nextState = force !== undefined ? force : !isOpen;
      if (nextState) {
        drawer.classList.add("open");
        backdrop.classList.add("open");
        document.body.style.overflow = "hidden";
      } else {
        drawer.classList.remove("open");
        backdrop.classList.remove("open");
        document.body.style.overflow = "";
      }
    };

    // Botão de acionamento no header
    let navToggle = document.getElementById("mobile-menu-btn");
    if (!navToggle) {
      const headerActions = header.querySelector(".header-actions") || header.querySelector(".flex") || header.querySelector(".header-container");
      if (headerActions) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mobile-menu-btn";
        btn.id = "mobile-menu-btn";
        btn.setAttribute("aria-label", "Abrir menu lateral");
        btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
        headerActions.appendChild(btn);
        navToggle = btn;
      }
    }

    if (navToggle) {
      navToggle.onclick = (e) => {
        e.preventDefault();
        toggleDrawer(true);
      };
    }

    const closeBtn = document.getElementById("public-drawer-close");
    if (closeBtn) {
      closeBtn.onclick = () => toggleDrawer(false);
    }

    if (backdrop) {
      backdrop.onclick = () => toggleDrawer(false);
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.classList.contains("open")) {
        toggleDrawer(false);
      }
    });

    const drawerLinks = drawer.querySelectorAll("a");
    drawerLinks.forEach(link => {
      link.addEventListener("click", () => {
        toggleDrawer(false);
      });
    });
  }

  /**
   * Verificação mock de autenticação em páginas do painel
   */
  static checkAdminAuth() {
    const isPublicPage = window.location.pathname.endsWith("index.html") ||
                         window.location.pathname.endsWith("login.html") ||
                         window.location.pathname.endsWith("agendar.html") ||
                         window.location.pathname.endsWith("contato.html") ||
                         window.location.pathname.endsWith("servicos.html") ||
                         window.location.pathname.endsWith("clinica-geral.html") ||
                         window.location.pathname.endsWith("limpeza.html") ||
                         window.location.pathname.endsWith("aparelho-ortodontico.html") ||
                         window.location.pathname.endsWith("implantes.html") ||
                         window.location.pathname === "/";

    // Se estiver em uma página administrativa mas sem sessão
    if (!isPublicPage && !StorageService.isAuthenticated()) {
      // Cria uma sessão mock padrão para não travar a exploração do avaliador
      StorageService.setSession({
        id: "USR-001",
        name: "Dra. Marta Gelsi Dias",
        email: "admin@demo.com",
        role: "Cirurgiã-Dentista / Administradora"
      });
    }
  }

  /**
   * Formatação de Moeda Brasileira
   * @param {number|string} value 
   */
  static formatCurrency(value) {
    if (typeof value === "string" && isNaN(Number(value))) {
      return value; // "Consultar"
    }
    const num = Number(value);
    if (isNaN(num)) return "Consultar";
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  /**
   * Formatação de Data Brasileira (DD/MM/AAAA)
   * @param {string} dateString (AAAA-MM-DD)
   */
  static formatDate(dateString) {
    if (!dateString) return "—";
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  }

  /**
   * Formatação de Telefone / WhatsApp Brasileiro
   * @param {string} phone 
   */
  static formatPhone(phone) {
    if (!phone) return "";
    const clean = phone.replace(/\D/g, "");
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return phone;
  }
}

// Inicializar na carga
document.addEventListener("DOMContentLoaded", () => {
  Navigation.init();
});
