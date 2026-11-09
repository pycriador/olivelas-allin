import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import { ocrEngine } from "./ocr-engine";
import type { ConferenceSession, ConferenceMapping, OCRResult, OCRField } from "./types";

const COLLECTION = "ai_conference_sessions";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const CRITICAL_FIELDS = [
  "cliente_cpf", "cliente_cnpj", "valor_servico", "telefone",
  "os_numero", "aparelho_serial", "aparelho_imei",
];

export const conferenceService = {
  async list(): Promise<ConferenceSession[]> {
    return getStorage().findAll<ConferenceSession>(COLLECTION);
  },

  async get(id: string): Promise<ConferenceSession | null> {
    return getStorage().find<ConferenceSession>(COLLECTION, id);
  },

  async createFromOCR(sourceId: string, sourceName: string, imageData?: string): Promise<ConferenceSession> {
    const ocrRequest = await ocrEngine.process({
      sourceId,
      sourceType: "image",
      sourceName,
      imageData,
    });

    if (!ocrRequest.result) {
      throw new Error("OCR processing returned no result");
    }

    const mappings = this.buildMappings(ocrRequest.result);

    const session: ConferenceSession = {
      id: uid(),
      sourceId,
      sourceName,
      sourceType: "image",
      imageData,
      ocrRequestId: ocrRequest.id,
      ocrResult: ocrRequest.result,
      status: "reviewing",
      mapping: mappings,
      createdAt: new Date().toISOString(),
    };

    const created = await getStorage().create<ConferenceSession>(COLLECTION, session);

    eventBus.publish(EVENT_NAMES.AI_CONFERENCE_STARTED, "ai", "ai-conference", {
      id: created.id,
      sourceId,
      fields: mappings.length,
    }).catch(() => {});

    return created;
  },

  buildMappings(result: OCRResult): ConferenceMapping[] {
    const fieldMap: Record<string, string> = {
      cliente_nome: "customer.name",
      cliente_cpf: "customer.cpf",
      cliente_cnpj: "customer.cnpj",
      os_numero: "serviceOrder.number",
      aparelho_modelo: "device.model",
      aparelho_serial: "device.serialNumber",
      aparelho_imei: "device.imei",
      defeito_relatado: "serviceOrder.defectReported",
      valor_servico: "serviceOrder.totalValue",
      telefone: "customer.phone",
      endereco: "customer.address",
      email: "customer.email",
      tecnico_nome: "serviceOrder.technician",
      data_entrada: "serviceOrder.entryDate",
      data_saida: "serviceOrder.exitDate",
      garantia_dias: "warranty.days",
      marca: "device.brand",
      modelo: "device.model",
      cor: "device.color",
      observacoes: "serviceOrder.notes",
      forma_pagamento: "payment.method",
      parcelas: "payment.installments",
    };

    return result.fields.map((field) => ({
      id: uid(),
      ocrField: field.name,
      ocrValue: field.value,
      ocrConfidence: field.confidence,
      mappedField: fieldMap[field.name] || `general.${field.name}`,
      mappedValue: field.value,
      status: field.confidence >= 0.7 ? "pending" : "rejected",
      critical: CRITICAL_FIELDS.includes(field.name),
      source: "ocr",
      notes: field.confidence < 0.7 ? "Baixa confiança - revisar" : undefined,
    }));
  },

  async updateMapping(sessionId: string, mappingId: string, patch: Partial<ConferenceMapping>): Promise<ConferenceSession> {
    const session = await this.get(sessionId);
    if (!session) throw new Error(`Conference session ${sessionId} not found`);

    const newMappings = session.mapping.map((m) =>
      m.id === mappingId ? { ...m, ...patch } : m
    );

    return getStorage().update<ConferenceSession>(COLLECTION, sessionId, {
      mapping: newMappings,
      updatedAt: new Date().toISOString(),
    });
  },

  async acceptField(sessionId: string, mappingId: string): Promise<ConferenceSession> {
    return this.updateMapping(sessionId, mappingId, { status: "accepted" });
  },

  async rejectField(sessionId: string, mappingId: string): Promise<ConferenceSession> {
    return this.updateMapping(sessionId, mappingId, { status: "rejected" });
  },

  async editField(sessionId: string, mappingId: string, newValue: string): Promise<ConferenceSession> {
    return this.updateMapping(sessionId, mappingId, {
      mappedValue: newValue,
      status: "edited",
    });
  },

  async ignoreField(sessionId: string, mappingId: string): Promise<ConferenceSession> {
    return this.updateMapping(sessionId, mappingId, { status: "ignored" });
  },

  async confirm(sessionId: string): Promise<ConferenceSession> {
    const session = await this.get(sessionId);
    if (!session) throw new Error(`Conference session ${sessionId} not found`);

    const updated = await getStorage().update<ConferenceSession>(COLLECTION, sessionId, {
      status: "confirmed",
      updatedAt: new Date().toISOString(),
    });

    eventBus.publish(EVENT_NAMES.AI_CONFERENCE_CONFIRMED, "ai", "ai-conference", {
      id: sessionId,
      sourceId: session.sourceId,
      acceptedCount: session.mapping.filter((m) => m.status === "accepted" || m.status === "edited").length,
    }).catch(() => {});

    return updated;
  },

  async reject(sessionId: string): Promise<ConferenceSession> {
    const updated = await getStorage().update<ConferenceSession>(COLLECTION, sessionId, {
      status: "rejected",
      updatedAt: new Date().toISOString(),
    });

    eventBus.publish(EVENT_NAMES.AI_CONFERENCE_REJECTED, "ai", "ai-conference", {
      id: sessionId,
      sourceId: (await this.get(sessionId))?.sourceId,
    }).catch(() => {});

    return updated;
  },

  async getExtractedData(sessionId: string): Promise<Record<string, string>> {
    const session = await this.get(sessionId);
    if (!session) throw new Error(`Conference session ${sessionId} not found`);

    const data: Record<string, string> = {};
    for (const m of session.mapping) {
      if (m.status === "accepted" || m.status === "edited") {
        data[m.mappedField] = m.mappedValue;
      }
    }
    return data;
  },

  async remove(sessionId: string): Promise<void> {
    await getStorage().delete(COLLECTION, sessionId);
  },
};
