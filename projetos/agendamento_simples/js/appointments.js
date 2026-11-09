/**
 * APPOINTMENTS MODULE
 * Gestão de consultas, criação com timeline e integração com Supabase + LocalStorage
 */

class AppointmentsManager {
  static getAppointments() {
    return StorageService.get("appointments", []);
  }

  static async fetchAppointments() {
    if (window.DatabaseService) {
      return await DatabaseService.appointments.getAll();
    }
    return this.getAppointments();
  }

  static getAppointmentById(id) {
    const list = this.getAppointments();
    return list.find(a => a.id === id) || null;
  }

  static async fetchAppointmentById(id) {
    const list = await this.fetchAppointments();
    return list.find(a => a.id === id) || null;
  }

  static async saveAppointment(data) {
    if (window.DatabaseService) {
      return await DatabaseService.appointments.save(data);
    }

    const list = this.getAppointments();
    let isNew = false;

    if (data.id) {
      const index = list.findIndex(a => a.id === data.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...data };
        StorageService.logActivity("UPDATE_APPOINTMENT", `Agendamento atualizado para ${data.patientName}`, data.id);
      }
    } else {
      isNew = true;
      data.id = "APT-" + String(list.length + 1).padStart(3, "0");
      data.googleEventId = "mock-google-event-" + Date.now();
      list.unshift(data);
      StorageService.logActivity("CREATE_APPOINTMENT", `Agendamento criado para ${data.patientName} (${data.service})`, data.id);
    }

    StorageService.set("appointments", list);
    return { success: true, appointment: data, isNew };
  }

  static async updateStatus(id, newStatus) {
    if (window.DatabaseService) {
      return await DatabaseService.appointments.updateStatus(id, newStatus);
    }

    const list = this.getAppointments();
    const apt = list.find(a => a.id === id);
    if (apt) {
      apt.status = newStatus;
      StorageService.set("appointments", list);
      StorageService.logActivity("UPDATE_APPOINTMENT_STATUS", `Status alterado para '${newStatus}' no agendamento ${id}`, id);
      return true;
    }
    return false;
  }

  static async deleteAppointment(id) {
    if (window.DatabaseService) {
      return await DatabaseService.appointments.delete(id);
    }

    const list = this.getAppointments();
    const apt = list.find(a => a.id === id);
    const filtered = list.filter(a => a.id !== id);
    StorageService.set("appointments", filtered);
    if (apt) {
      StorageService.logActivity("DELETE_APPOINTMENT", `Agendamento cancelado/removido: ${apt.patientName}`, id);
    }
    return true;
  }
}
