/**
 * MODAL MANAGER SERVICE
 * Gerenciamento de modais acessíveis e substituto para alert/confirm
 */

class Modal {
  static activeModals = [];

  static init() {
    // Fechar ao pressionar ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.activeModals.length > 0) {
        const topModal = this.activeModals[this.activeModals.length - 1];
        this.close(topModal);
      }
    });

    // Delegar cliques de fechamento
    document.addEventListener("click", (e) => {
      const backdrop = e.target.closest(".modal-backdrop");
      if (backdrop && e.target === backdrop) {
        // Clicou diretamente no backdrop (light dismiss)
        this.close(backdrop);
      }

      const closeTrigger = e.target.closest("[data-modal-close]");
      if (closeTrigger) {
        const modalToClose = closeTrigger.closest(".modal-backdrop");
        if (modalToClose) this.close(modalToClose);
      }
    });
  }

  /**
   * Abre um modal pelo elemento ou ID
   * @param {HTMLElement|string} target 
   */
  static open(target) {
    const modal = typeof target === "string" ? document.getElementById(target) : target;
    if (!modal) return;

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (!this.activeModals.includes(modal)) {
      this.activeModals.push(modal);
    }

    // Focar no primeiro elemento focável
    const focusable = modal.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    if (focusable) focusable.focus();
  }

  /**
   * Fecha um modal
   * @param {HTMLElement|string} target 
   */
  static close(target) {
    const modal = typeof target === "string" ? document.getElementById(target) : target;
    if (!modal) return;

    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");

    this.activeModals = this.activeModals.filter(m => m !== modal);

    if (this.activeModals.length === 0) {
      document.body.style.overflow = "";
    }
  }

  /**
   * Substituto completo para o confirm() nativo do navegador
   * @param {Object} options 
   */
  static confirm({
    title = "Confirmar ação",
    message = "Tem certeza de que deseja prosseguir?",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    danger = false,
    onConfirm = () => {},
    onCancel = () => {}
  }) {
    // Criação dinâmica do modal de confirmação
    let confirmModal = document.getElementById("generic-confirm-modal");
    if (!confirmModal) {
      confirmModal = document.createElement("div");
      confirmModal.id = "generic-confirm-modal";
      confirmModal.className = "modal-backdrop";
      confirmModal.setAttribute("role", "dialog");
      confirmModal.setAttribute("aria-modal", "true");
      confirmModal.setAttribute("aria-hidden", "true");
      document.body.appendChild(confirmModal);
    }

    const btnClass = danger ? "btn btn-danger" : "btn btn-primary";

    confirmModal.innerHTML = `
      <div class="modal-dialog modal-dialog-sm">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="btn btn-ghost btn-icon" data-modal-close aria-label="Fechar modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="text-secondary">${message}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="confirm-modal-cancel-btn">${cancelText}</button>
          <button type="button" class="${btnClass}" id="confirm-modal-action-btn">${confirmText}</button>
        </div>
      </div>
    `;

    const cancelBtn = confirmModal.querySelector("#confirm-modal-cancel-btn");
    const actionBtn = confirmModal.querySelector("#confirm-modal-action-btn");

    const cleanup = () => {
      Modal.close(confirmModal);
    };

    cancelBtn.onclick = () => {
      cleanup();
      if (typeof onCancel === "function") onCancel();
    };

    actionBtn.onclick = () => {
      cleanup();
      if (typeof onConfirm === "function") onConfirm();
    };

    Modal.open(confirmModal);
  }
}

// Inicializar ouvintes globais de modal
Modal.init();
