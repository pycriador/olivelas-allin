/**
 * MESSAGES & AUTOMATIONS MODULE
 */

class MessagesManager {
  static getTemplates() {
    return StorageService.get("messages", []);
  }

  static saveTemplate(tpl) {
    const list = this.getTemplates();
    if (tpl.id) {
      const idx = list.findIndex(x => x.id === tpl.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...tpl };
        StorageService.logActivity("UPDATE_TEMPLATE", `Template atualizado: ${tpl.title}`, tpl.id);
      }
    } else {
      tpl.id = "MSG-" + String(list.length + 1).padStart(3, "0");
      list.push(tpl);
      StorageService.logActivity("CREATE_TEMPLATE", `Novo template criado: ${tpl.title}`, tpl.id);
    }
    StorageService.set("messages", list);
    return tpl;
  }

  static duplicateTemplate(id) {
    const list = this.getTemplates();
    const tpl = list.find(x => x.id === id);
    if (tpl) {
      const copy = {
        ...tpl,
        id: "MSG-" + String(list.length + 1).padStart(3, "0"),
        title: `${tpl.title} (Cópia)`
      };
      list.push(copy);
      StorageService.set("messages", list);
      StorageService.logActivity("DUPLICATE_TEMPLATE", `Template duplicado: ${copy.title}`, copy.id);
      return copy;
    }
    return null;
  }

  static toggleActive(id) {
    const list = this.getTemplates();
    const tpl = list.find(x => x.id === id);
    if (tpl) {
      tpl.active = !tpl.active;
      StorageService.set("messages", list);
      return tpl.active;
    }
    return false;
  }

  static replaceVariables(templateContent, data = {}) {
    let result = templateContent || "";
    result = result.replace(/\{\{nome\}\}/g, data.name || "Paciente");
    result = result.replace(/\{\{data\}\}/g, data.date || "21/09/2026");
    result = result.replace(/\{\{hora\}\}/g, data.time || "09:00");
    return result;
  }
}
