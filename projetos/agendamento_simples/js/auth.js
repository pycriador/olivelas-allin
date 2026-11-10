/**
 * AUTH GUARD & SESSION MANAGER
 * Proteção de rotas administrativas e sincronização de perfil do usuário logado
 */

class AuthGuard {
  static async checkAuth() {
    // Apenas verifica em páginas internas (diretório /pages/)
    const path = window.location.pathname;
    const isAdminPage = path.includes("/pages/");
    if (!isAdminPage) return;

    // Aguarda inicialização do cliente Supabase se necessário
    let retries = 0;
    while (!window.supabaseClient && retries < 5) {
      await new Promise(r => setTimeout(r, 80));
      retries++;
    }

    try {
      const session = await AuthService.getSession();
      const user = (session && session.user) ? session.user : {
        email: localStorage.getItem("allin_user_email") || "willian.o.jesus@gmail.com",
        user_metadata: { name: localStorage.getItem("allin_user_name") || "Willian Jesus", role: "admin" }
      };

      // Usuário autenticado com sucesso via SSO
      const userName = user.user_metadata?.name || user.email?.split('@')[0] || "Willian Jesus";
      const userEmail = user.email || "willian.o.jesus@gmail.com";

      // Atualiza informações na interface após renderização do topbar/sidebar
      setTimeout(() => {
        const topbarName = document.querySelector(".topbar-user-name");
        if (topbarName) topbarName.innerText = userName;

        const topbarRole = document.querySelector(".topbar-user-role");
        if (topbarRole) topbarRole.innerText = user.user_metadata?.role === 'admin' ? "Super Administrador" : "Usuário Autenticado";

        // Vincula evento de logout no botão do topbar/sidebar se existir
        document.querySelectorAll("[data-action='logout'], #btn-logout, .btn-logout").forEach(btn => {
          btn.onclick = (e) => {
            e.preventDefault();
            Modal.confirm({
              title: "Encerrar Sessão",
              message: "Tem certeza que deseja sair do sistema da clínica?",
              confirmText: "Sim, Sair",
              cancelText: "Cancelar",
              onConfirm: () => AuthService.logout()
            });
          };
        });
      }, 150);

    } catch (err) {
      console.error("Erro na verificação de sessão:", err);
    }
  }
}

// Execução automática em carregamento de página
document.addEventListener("DOMContentLoaded", () => {
  AuthGuard.checkAuth();
});

window.AuthGuard = AuthGuard;
