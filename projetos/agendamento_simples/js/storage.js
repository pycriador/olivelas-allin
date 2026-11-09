/**
 * STORAGE SERVICE
 * Camada de persistência mock utilizando LocalStorage
 */

const STORAGE_PREFIX = "marta_gelsi_";

class StorageService {
  /**
   * Inicializa o armazenamento com os dados mock iniciais caso ainda não existam.
   */
  static init() {
    try {
      if (!localStorage.getItem(STORAGE_PREFIX + "initialized")) {
        this.resetToMock();
      }
    } catch (e) {
      console.warn("LocalStorage indisponível ou bloqueado. Operando em memória.", e);
    }
  }

  /**
   * Restaura todos os dados para o estado inicial mock
   */
  static resetToMock() {
    if (typeof initialMockData === "undefined") {
      console.error("initialMockData não encontrado!");
      return;
    }

    this.set("patients", initialMockData.patients);
    this.set("appointments", initialMockData.appointments);
    this.set("services", initialMockData.services);
    this.set("plans", initialMockData.plans);
    this.set("messages", initialMockData.messages);
    this.set("schedules", initialMockData.schedules);
    this.set("settings", initialMockData.settings);
    this.set("auditLogs", initialMockData.auditLogs);
    this.set("initialized", "true");
    console.info("StorageService: Dados mock inicializados com sucesso.");
  }

  /**
   * Obtém um item do LocalStorage
   * @param {string} key 
   * @param {any} defaultValue 
   * @returns {any}
   */
  static get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch (e) {
      console.error(`Erro ao ler chave '${key}' do LocalStorage:`, e);
      return defaultValue;
    }
  }

  /**
   * Salva um item no LocalStorage
   * @param {string} key 
   * @param {any} value 
   */
  static set(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Erro ao salvar chave '${key}' no LocalStorage:`, e);
      return false;
    }
  }

  /**
   * Remove uma chave específica
   * @param {string} key 
   */
  static remove(key) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (e) {
      console.error(`Erro ao remover chave '${key}' do LocalStorage:`, e);
    }
  }

  /**
   * Limpa todos os dados da aplicação
   */
  static clear() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.error("Erro ao limpar dados do LocalStorage:", e);
    }
  }

  /**
   * Registra uma ação de auditoria no log mock
   * @param {string} action 
   * @param {string} description 
   * @param {string} entityId 
   * @param {string} user 
   */
  static logActivity(action, description, entityId = "", user = "Administrador") {
    const logs = this.get("auditLogs", []);
    const now = new Date();
    const formattedDate = now.toLocaleDateString("pt-BR") + " " + now.toLocaleTimeString("pt-BR");
    
    const newLog = {
      id: "LOG-" + String(logs.length + 1).padStart(3, "0"),
      action,
      description,
      user,
      timestamp: formattedDate,
      entityId
    };

    logs.unshift(newLog); // Mais recente primeiro
    // Manter no máximo os últimos 50 registros
    if (logs.length > 50) logs.pop();
    this.set("auditLogs", logs);
  }

  /**
   * Gestão da sessão mock do usuário
   */
  static getSession() {
    return this.get("session", null);
  }

  static setSession(user) {
    this.set("session", user);
    this.logActivity("LOGIN", `Login realizado pelo usuário: ${user.email || user.name}`, "AUTH");
  }

  static clearSession() {
    const session = this.getSession();
    if (session) {
      this.logActivity("LOGOUT", `Logout realizado pelo usuário: ${session.email || session.name}`, "AUTH");
    }
    this.remove("session");
  }

  static isAuthenticated() {
    return !!this.getSession();
  }
}

// Inicializar na carga do script
StorageService.init();
