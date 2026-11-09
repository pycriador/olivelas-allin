/**
 * REUSABLE UI COMPONENTS
 * Renderização dinâmica de componentes compartilhados
 */

class UIComponents {
  /**
   * Renderiza a Sidebar Administrativa Padronizada
   * @param {string} activePage Chave da página ativa
   * @param {string} basePath Caminho relativo para a raiz ou páginas
   */
  static renderAdminSidebar(activePage = "", basePath = "") {
    const sidebarEl = document.getElementById("admin-sidebar-container");
    if (!sidebarEl) return;

    // Itens de menu administrativo
    const navItems = [
      {
        id: "dashboard",
        label: "Dashboard",
        href: `${basePath}dashboard.html`,
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>`
      },
      {
        id: "pacientes",
        label: "Pacientes",
        href: `${basePath}pacientes.html`,
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`
      },
      {
        id: "agenda",
        label: "Agenda",
        href: `${basePath}agenda.html`,
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`
      },
      {
        id: "agendamentos",
        label: "Agendamentos",
        href: `${basePath}agendamentos.html`,
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
      },
      {
        id: "servicos",
        label: "Serviços",
        href: `${basePath}servicos-admin.html`,
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
      },
      {
        id: "planos",
        label: "Planos",
        href: `${basePath}planos.html`,
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>`
      },
      {
        id: "horarios",
        label: "Horários",
        href: `${basePath}horarios.html`,
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
      },
      {
        id: "mensagens",
        label: "Mensagens",
        href: `${basePath}mensagens.html`,
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`
      },
      {
        id: "whatsapp",
        label: "WhatsApp",
        href: `${basePath}whatsapp.html`,
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`
      },
      {
        id: "google-calendar",
        label: "Google Calendar",
        href: `${basePath}google-calendar.html`,
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><circle cx="12" cy="15" r="2"></circle></svg>`
      },
      {
        id: "configuracoes",
        label: "Configurações",
        href: `${basePath}configuracoes.html`,
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
      }
    ];

    const linksHtml = navItems.map(item => `
      <a href="${item.href}" class="sidebar-link ${activePage === item.id ? 'active' : ''}">
        ${item.icon}
        <span>${item.label}</span>
      </a>
    `).join("");

    sidebarEl.innerHTML = `
      <aside class="admin-sidebar" id="app-sidebar">
        <div class="sidebar-header">
          <img src="${basePath ? basePath + 'assets/images/logo.png' : '../assets/images/logo.png'}" alt="Logo Dra. Marta" style="width: 36px; height: 36px; object-fit: contain; flex-shrink: 0;">
          <div class="sidebar-brand-text">
            <span class="sidebar-brand-title">Dra. Marta Gelsi</span>
            <span class="sidebar-brand-subtitle">Dentista • CRO 71482</span>
          </div>
          <button type="button" class="sidebar-close-btn" id="btn-close-sidebar" aria-label="Fechar menu lateral">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <nav class="sidebar-nav">
          <span class="nav-section-title">Menu Principal</span>
          ${linksHtml}
          
          <div style="margin: var(--space-4) 0; border-top: 1px solid var(--color-border);"></div>
          <span class="nav-section-title">Navegação Externa</span>
          <a href="${basePath ? basePath + 'index.html' : '../index.html'}" class="sidebar-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <span>Ver Site Público</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <a href="${basePath}perfil.html" class="sidebar-link ${activePage === 'perfil' ? 'active' : ''}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>Meu Perfil</span>
          </a>
          <button type="button" class="sidebar-link" id="btn-sidebar-logout" style="width: 100%; text-align: left;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>Sair</span>
          </button>
        </div>
      </aside>
      <div class="sidebar-overlay" id="sidebar-backdrop"></div>
    `;

    // Logout listener
    const logoutBtn = sidebarEl.querySelector("#btn-sidebar-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        Modal.confirm({
          title: "Sair da plataforma",
          message: "Deseja realmente encerrar a sessão administrativa?",
          confirmText: "Sim, sair",
          cancelText: "Cancelar",
          danger: true,
          onConfirm: async () => {
            if (window.AuthService) {
              await AuthService.logout();
            } else {
              StorageService.clearSession();
              Toast.info("Sessão encerrada com sucesso.");
              setTimeout(() => {
                window.location.href = `${basePath}../login.html`;
              }, 500);
            }
          }
        });
      });
    }

    // Fechar menu mobile via botão X
    const closeBtn = sidebarEl.querySelector("#btn-close-sidebar");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        UIComponents.toggleMobileSidebar(false);
      });
    }

    // Toggle menu para mobile
    const backdrop = sidebarEl.querySelector("#sidebar-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", () => {
        UIComponents.toggleMobileSidebar(false);
      });
    }

    // Fechar sidebar ao clicar em qualquer link no mobile
    const sidebarLinks = sidebarEl.querySelectorAll(".sidebar-link");
    sidebarLinks.forEach(link => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 1024) {
          UIComponents.toggleMobileSidebar(false);
        }
      });
    });
  }

  /**
   * Abre/fecha a sidebar em visualizações móveis
   */
  static toggleMobileSidebar(forceState) {
    const sidebar = document.getElementById("app-sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (!sidebar || !backdrop) return;

    const isOpen = sidebar.classList.contains("open");
    const shouldOpen = forceState !== undefined ? forceState : !isOpen;

    if (shouldOpen) {
      sidebar.classList.add("open");
      backdrop.classList.add("open");
      document.body.style.overflow = "hidden";
    } else {
      sidebar.classList.remove("open");
      backdrop.classList.remove("open");
      document.body.style.overflow = "";
    }
  }

  /**
   * Renderiza a barra superior administrativa
   */
  static renderAdminTopbar(pageTitle = "Painel", pageCategory = "Administração") {
    const topbarEl = document.getElementById("admin-topbar-container");
    if (!topbarEl) return;

    const session = StorageService.getSession();
    const userName = session ? (session.name || "Dra. Marta Gelsi") : "Dra. Marta Gelsi";
    const userRole = session ? (session.role || "Dentista • CRO 71482") : "Dentista • CRO 71482";

    topbarEl.innerHTML = `
      <header class="admin-topbar">
        <div class="topbar-left">
          <button type="button" class="topbar-toggle-menu btn-icon" id="btn-toggle-drawer" aria-label="Abrir menu lateral">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <div class="topbar-title-wrapper">
            <div class="breadcrumb topbar-breadcrumb" style="margin-bottom: 0;">
              <span>${pageCategory}</span>
              <span class="breadcrumb-separator">/</span>
              <span class="text-primary">${pageTitle}</span>
            </div>
            <span class="topbar-mobile-title">${pageTitle}</span>
          </div>
        </div>

        <div class="topbar-right">
          <span class="demo-banner">Dados demonstrativos</span>
          <div class="topbar-user" title="${userName} — ${userRole}">
            <div class="user-avatar">MG</div>
            <div class="user-info">
              <span class="user-name">${userName}</span>
              <span class="user-role">${userRole}</span>
            </div>
          </div>
        </div>
      </header>
    `;

    const toggleBtn = topbarEl.querySelector("#btn-toggle-drawer");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        UIComponents.toggleMobileSidebar();
      });
    }
  }

  /**
   * Retorna badge formatado pelo status
   */
  static renderStatusBadge(status) {
    const s = (status || "").toLowerCase();
    if (s.includes("confirmado") || s === "active" || s === "ativo" || s === "concluído") {
      return `<span class="badge badge-success">${status}</span>`;
    }
    if (s.includes("pendente") || s.includes("aguardando")) {
      return `<span class="badge badge-warning">${status}</span>`;
    }
    if (s.includes("cancelado") || s === "inactive" || s === "inativo" || s.includes("não compareceu")) {
      return `<span class="badge badge-danger">${status}</span>`;
    }
    return `<span class="badge badge-info">${status}</span>`;
  }

  /**
   * Renderiza tela de estado vazio
   */
  static renderEmptyState(title, description, actionHtml = "") {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <h4 class="empty-state-title">${title}</h4>
        <p class="empty-state-text">${description}</p>
        ${actionHtml}
      </div>
    `;
  }

  /**
   * Adiciona o botão flutuante de WhatsApp na página
   */
  static addFloatingWhatsApp() {
    if (document.getElementById("floating-whatsapp-btn")) return;

    const btn = document.createElement("a");
    btn.id = "floating-whatsapp-btn";
    btn.href = "https://wa.me/5511995770004";
    btn.target = "_blank";
    btn.rel = "noopener noreferrer";
    btn.className = "floating-whatsapp";
    btn.setAttribute("aria-label", "Falar com Dra. Marta Gelsi Dias pelo WhatsApp");
    btn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.77.784 2.796.784 3.182 0 5.768-2.587 5.768-5.766.001-3.181-2.585-5.77-5.768-5.77zm3.397 8.256c-.145.407-.841.776-1.169.824-.316.046-.713.064-2.222-.562-1.808-.75-2.956-2.614-3.045-2.733-.089-.12-0.722-.962-.722-1.834 0-.872.457-1.302.62-1.48.163-.178.356-.223.475-.223.119 0 .237.001.341.006.11.005.258-.042.404.308.148.356.505 1.233.549 1.322.044.089.074.193.015.312-.059.119-.089.193-.178.297-.089.104-.187.233-.267.312-.089.089-.182.186-.078.364.104.178.461.761.99 1.233.682.608 1.258.796 1.436.885.178.089.282.074.386-.044.104-.119.445-.519.564-.697.119-.178.237-.148.396-.089.159.059 1.009.475 1.182.562.173.087.288.132.332.206.044.074.044.43-.101.837z"/>
      </svg>
    `;
    document.body.appendChild(btn);
  }
}
