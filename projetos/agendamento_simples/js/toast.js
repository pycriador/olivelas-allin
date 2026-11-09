/**
 * TOAST NOTIFICATIONS SERVICE
 * Notificações visuais acessíveis e animadas
 */

class Toast {
  static container = null;

  static ensureContainer() {
    if (!this.container || !document.body.contains(this.container)) {
      this.container = document.createElement("div");
      this.container.className = "toast-container";
      this.container.setAttribute("role", "region");
      this.container.setAttribute("aria-live", "polite");
      this.container.setAttribute("aria-label", "Notificações do sistema");
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  /**
   * Dispara uma notificação toast
   * @param {string} message 
   * @param {'success'|'error'|'warning'|'info'} type 
   * @param {string} title 
   * @param {number} duration em ms
   */
  static show(message, type = "info", title = "", duration = 4000) {
    const container = this.ensureContainer();

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", "status");

    // Ícone correspondente ao tipo
    let iconSvg = "";
    if (type === "success") {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
      if (!title) title = "Sucesso";
    } else if (type === "error") {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
      if (!title) title = "Erro";
    } else if (type === "warning") {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      if (!title) title = "Aviso";
    } else {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
      if (!title) title = "Informação";
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" type="button" aria-label="Fechar notificação">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    const closeBtn = toast.querySelector(".toast-close");
    const removeToast = () => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-8px)";
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 200);
    };

    closeBtn.addEventListener("click", removeToast);

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(removeToast, duration);
    }
  }

  static success(message, title = "Sucesso") {
    this.show(message, "success", title);
  }

  static error(message, title = "Erro") {
    this.show(message, "error", title);
  }

  static warning(message, title = "Atenção") {
    this.show(message, "warning", title);
  }

  static info(message, title = "Informação") {
    this.show(message, "info", title);
  }
}
