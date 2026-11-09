/**
 * PATIENTS MODULE
 * Gestão de pacientes, busca, filtros e persistência no Supabase + LocalStorage
 */

class PatientsManager {
  static getPatients() {
    return StorageService.get("patients", []);
  }

  static async fetchPatients() {
    if (window.DatabaseService) {
      return await DatabaseService.patients.getAll();
    }
    return this.getPatients();
  }

  static getPatientById(id) {
    const list = this.getPatients();
    return list.find(p => p.id === id) || null;
  }

  static async fetchPatientById(id) {
    if (window.DatabaseService) {
      return await DatabaseService.patients.getById(id);
    }
    return this.getPatientById(id);
  }

  static async savePatient(patientData) {
    if (window.DatabaseService) {
      return await DatabaseService.patients.save(patientData);
    }

    const list = this.getPatients();
    let isNew = false;

    if (patientData.id) {
      const index = list.findIndex(p => p.id === patientData.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...patientData };
        StorageService.logActivity("UPDATE_PATIENT", `Paciente atualizado: ${patientData.name}`, patientData.id);
      }
    } else {
      isNew = true;
      patientData.id = "PAT-" + String(list.length + 1).padStart(3, "0");
      patientData.lastAppointment = "—";
      list.unshift(patientData);
      StorageService.logActivity("CREATE_PATIENT", `Novo paciente cadastrado: ${patientData.name}`, patientData.id);
    }

    StorageService.set("patients", list);
    return { success: true, patient: patientData, isNew };
  }

  static async deletePatient(id) {
    if (window.DatabaseService) {
      return await DatabaseService.patients.delete(id);
    }

    const list = this.getPatients();
    const patient = list.find(p => p.id === id);
    const filtered = list.filter(p => p.id !== id);
    StorageService.set("patients", filtered);
    if (patient) {
      StorageService.logActivity("DELETE_PATIENT", `Paciente excluído: ${patient.name}`, id);
    }
    return true;
  }

  static filterPatients({ search = "", status = "" } = {}) {
    let list = this.getPatients();
    const query = search.toLowerCase().trim();

    if (query) {
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.phone && p.phone.includes(query)) ||
        (p.cpf && p.cpf.includes(query)) ||
        (p.email && p.email.toLowerCase().includes(query))
      );
    }

    if (status) {
      list = list.filter(p => p.status === status);
    }

    return list;
  }
}
