/**
 * WHATSAPP MODULE (MOCK)
 * Simulação de envio, campanhas e mensagens rápidas
 */

class WhatsAppManager {
  static getCampaigns() {
    return StorageService.get("whatsappCampaigns", [
      {
        id: "CMP-001",
        name: "Campanha de Limpeza Dental Preventiva",
        audience: "Pacientes sem consulta há 6 meses (42 pacientes)",
        message: "Olá, {{nome}}! Já se passaram 6 meses desde o seu último cuidado. Que tal agendar sua limpeza preventiva com a Dra. Marta Gelsi Dias?",
        date: "2026-09-18",
        status: "Concluída"
      },
      {
        id: "CMP-002",
        name: "Campanha de Avaliação Ortodôntica",
        audience: "Interessados em alinhadores (18 pacientes)",
        message: "Olá, {{nome}}! Descubra como alinhar o seu sorriso com conforto e discrição. Agende sua avaliação com a Dra. Marta Gelsi Dias.",
        date: "2026-09-22",
        status: "Agendada"
      },
      {
        id: "CMP-003",
        name: "Campanha de Implante Dentário",
        audience: "Pacientes em fase de planejamento cirúrgico (9 pacientes)",
        message: "Olá, {{nome}}! Temos horários disponíveis esta semana para o seu planejamento de implante. Entre em contato para confirmar.",
        date: "2026-09-25",
        status: "Rascunho"
      }
    ]);
  }

  static saveCampaign(data) {
    const list = this.getCampaigns();
    if (data.id) {
      const idx = list.findIndex(x => x.id === data.id);
      if (idx !== -1) list[idx] = { ...list[idx], ...data };
    } else {
      data.id = "CMP-" + String(list.length + 1).padStart(3, "0");
      list.unshift(data);
    }
    StorageService.set("whatsappCampaigns", list);
    StorageService.logActivity("CAMPAIGN_SAVED", `Campanha WhatsApp salva: ${data.name}`, data.id);
    return data;
  }
}
