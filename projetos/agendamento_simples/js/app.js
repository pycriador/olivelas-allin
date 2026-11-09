/**
 * APP ENTRY POINT
 * Inicialização e orquestração dos módulos da plataforma
 */

document.addEventListener("DOMContentLoaded", () => {
  // Garantir inicialização do armazenamento
  StorageService.init();

  console.info("Plataforma Dra. Marta Gelsi Dias inicializada com sucesso (FASE 01 - Foundation).");

  // Configurar listeners de botões de demonstração caso existam na página
  const btnTestToast = document.getElementById("demo-btn-toast");
  if (btnTestToast) {
    btnTestToast.addEventListener("click", () => {
      Toast.success("A fundação do sistema de notificações está ativa e funcionando!", "Notificação do Sistema");
    });
  }

  const btnTestModal = document.getElementById("demo-btn-modal");
  if (btnTestModal) {
    btnTestModal.addEventListener("click", () => {
      Modal.confirm({
        title: "Confirmação do Design System",
        message: "O sistema de modais acessíveis substitui com sucesso o uso de alert() e confirm() do navegador.",
        confirmText: "Compreendido",
        cancelText: "Fechar",
        onConfirm: () => {
          Toast.info("Ação confirmada pelo usuário.");
        }
      });
    });
  }

  const btnResetData = document.getElementById("demo-btn-reset-storage");
  if (btnResetData) {
    btnResetData.addEventListener("click", () => {
      Modal.confirm({
        title: "Restaurar Dados Mock",
        message: "Deseja restaurar todos os dados iniciais do LocalStorage?",
        confirmText: "Restaurar",
        cancelText: "Cancelar",
        danger: true,
        onConfirm: () => {
          StorageService.clear();
          StorageService.resetToMock();
          Toast.success("Dados demonstrativos restaurados com sucesso!");
          setTimeout(() => location.reload(), 800);
        }
      });
    });
  }
});
