import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type {
  ServiceOrder, SONumberingConfig, SOStatus, SOComment, SOAttachment,
  SOTimelineEntry, SOServiceItem, SOPartItem, SODiagnostic, DiagnosticRevision,
  SOChecklist, SOChecklistItem, SOChecklistTemplate, SOExecutionActivity,
  SOExecutionComment, SOTimeTracking, SOPhoto, SOReturn, SOWarranty,
  TechnicianDashboardStats, SOBudget, SOBudgetItem, SOApproval, SOPayment,
  SOPaymentInstallment, SODelivery, SODeliveryChecklistItem, SOSignature,
  SOReceipt, SOFinancialHistoryEntry, SOPortalAccess, EnhancedDashboardStats,
  SOTest, SOQualityControl, SOCosts, SOAnalytics, SODashboardStats,
} from "./types";

const COLLECTION = "service_orders";
const NUM_COL = "so_numbering";
const STATUS_COL = "so_statuses";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function generateSONumber(companyId?: string): Promise<string> {
  const all = await getStorage().findAll<SONumberingConfig>(NUM_COL);
  let config = all.find((c) => c.companyId === companyId) ?? all.find((c) => !c.companyId);
  if (!config) {
    config = { id: uid(), prefix: "SF-", suffix: "", digits: 6, resetYearly: false, resetMonthly: false, currentSequence: 0 };
    config = await getStorage().create<SONumberingConfig>(NUM_COL, config);
  }

  let seq = config.currentSequence + 1;
  const now = new Date();
  if (config.resetYearly) {
    const year = String(now.getFullYear());
    if (config.lastReset !== year) { seq = 1; config.lastReset = year; }
  }
  if (config.resetMonthly) {
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    if (config.lastReset !== month) { seq = 1; config.lastReset = month; }
  }

  await getStorage().update<SONumberingConfig>(NUM_COL, config.id, { currentSequence: seq, lastReset: config.lastReset });
  const num = String(seq).padStart(config.digits, "0");
  return `${config.prefix}${num}${config.suffix}`;
}

export async function getDefaultStatuses(): Promise<SOStatus[]> {
  const existing = await getStorage().findAll<SOStatus>(STATUS_COL);
  if (existing.length > 0) return existing;

  const defaults: Omit<SOStatus, "id">[] = [
    { name: "Em Aberto", color: "#6b7280", order: 1, isDefault: true, isFinal: false },
    { name: "Em Diagnóstico", color: "#3b82f6", order: 2, isDefault: false, isFinal: false },
    { name: "Aguardando Aprovação", color: "#f59e0b", order: 3, isDefault: false, isFinal: false },
    { name: "Aprovada", color: "#10b981", order: 4, isDefault: false, isFinal: false },
    { name: "Em Execução", color: "#8b5cf6", order: 5, isDefault: false, isFinal: false },
    { name: "Aguardando Peça", color: "#f97316", order: 6, isDefault: false, isFinal: false },
    { name: "Pronta", color: "#22c55e", order: 7, isDefault: false, isFinal: false },
    { name: "Aguardando Retirada", color: "#14b8a6", order: 8, isDefault: false, isFinal: false },
    { name: "Entregue", color: "#059669", order: 9, isDefault: false, isFinal: true },
    { name: "Cancelada", color: "#ef4444", order: 10, isDefault: false, isFinal: true },
  ];

  const created: SOStatus[] = [];
  for (const d of defaults) {
    const s = await getStorage().create<SOStatus>(STATUS_COL, d);
    created.push(s);
  }
  return created;
}

function addTimeline(so: ServiceOrder, type: SOTimelineEntry["type"], description: string, userName?: string): SOTimelineEntry {
  const entry: SOTimelineEntry = {
    id: uid(), type, description, userName, createdAt: new Date().toISOString(),
  };
  so.timeline = [...(so.timeline ?? []), entry];
  return entry;
}

export const serviceOrderService = {
  async list(): Promise<ServiceOrder[]> { return getStorage().findAll<ServiceOrder>(COLLECTION); },

  async get(id: string): Promise<ServiceOrder | null> { return getStorage().find<ServiceOrder>(COLLECTION, id); },

  async create(data: {
    customerId: string; customerName: string; deviceId?: string; deviceInfo?: string;
    technicianId?: string; technicianName?: string; categoryId?: string;
    defectId?: string; defectName?: string; description: string; diagnosis?: string;
    notes?: string; priority: "low" | "medium" | "high" | "urgent";
    warrantyId?: string; deadline?: string; estimatedValue?: number;
    companyId?: string;
  }, userName?: string): Promise<ServiceOrder> {
    const statuses = await getDefaultStatuses();
    const defaultStatus = statuses.find((s) => s.isDefault) ?? statuses[0];
    const number = await generateSONumber(data.companyId);
    const statusLabel = defaultStatus.name;

    const now = new Date().toISOString();
    const entry: Omit<ServiceOrder, "id"> = {
      number, companyId: data.companyId, customerId: data.customerId, customerName: data.customerName,
      deviceId: data.deviceId, deviceInfo: data.deviceInfo, technicianId: data.technicianId,
      technicianName: data.technicianName, categoryId: data.categoryId, defectId: data.defectId,
      defectName: data.defectName, description: data.description, diagnosis: data.diagnosis,
      notes: data.notes, priority: data.priority, status: defaultStatus.name, statusLabel,
      warrantyId: data.warrantyId, entryDate: now.split("T")[0], deadline: data.deadline,
      deliveryDate: undefined, estimatedValue: data.estimatedValue, finalValue: undefined,
      services: [], parts: [], timeline: [], comments: [], attachments: [], documents: [],
      communications: [], tags: [], pinned: false, createdAt: now, updatedAt: now,
      createdBy: userName, updatedBy: userName,
    };

    entry.timeline = [{
      id: uid(), type: "created", description: `OS ${number} criada`, userName, createdAt: now,
    }];

    const created = await getStorage().create<ServiceOrder>(COLLECTION, entry);
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_CREATED, "entity", "service-orders", { id: created.id, number: created.number, customerName: created.customerName }).catch(() => {});
    return created;
  },

  async update(id: string, patch: Partial<ServiceOrder>, userName?: string): Promise<ServiceOrder> {
    const existing = await this.get(id);
    if (!existing) throw new Error("Service order not found");

    const changes: string[] = [];
    if (patch.customerId && patch.customerId !== existing.customerId) { changes.push("Cliente alterado"); addTimeline(existing, "customer_changed", `Cliente alterado para ${patch.customerName ?? patch.customerId}`, userName); }
    if (patch.deviceId && patch.deviceId !== existing.deviceId) { changes.push("Aparelho alterado"); addTimeline(existing, "device_changed", `Aparelho alterado`, userName); }
    if (patch.technicianId && patch.technicianId !== existing.technicianId) { changes.push("Técnico alterado"); addTimeline(existing, "technician_changed", `Técnico alterado para ${patch.technicianName ?? patch.technicianId}`, userName); }
    if (patch.status && patch.status !== existing.status) {
      addTimeline(existing, "status_changed", `Status alterado de "${existing.statusLabel}" para "${patch.status}"`, userName);
    }

    if (changes.length === 0) addTimeline(existing, "updated", "OS atualizada", userName);

    const updated = await getStorage().update<ServiceOrder>(COLLECTION, id, { ...patch, timeline: existing.timeline, updatedAt: new Date().toISOString(), updatedBy: userName });

    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_UPDATED, "entity", "service-orders", { id, ...patch }).catch(() => {});
    if (patch.status && patch.status !== existing.status) {
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_STATUS_CHANGED, "entity", "service-orders", { id, from: existing.status, to: patch.status }).catch(() => {});
    }

    return updated;
  },

  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_DELETED, "entity", "service-orders", { id }).catch(() => {});
  },

  /* Comments */
  async addComment(orderId: string, data: Omit<SOComment, "id" | "createdAt">): Promise<ServiceOrder> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const comment: SOComment = { ...data, id: uid(), createdAt: new Date().toISOString() };
    const timeline = addTimeline(so, "comment", `Comentário: ${data.text.substring(0, 80)}${data.text.length > 80 ? "..." : ""}`, data.author);
    const updated = await getStorage().update<ServiceOrder>(COLLECTION, orderId, {
      comments: [...(so.comments ?? []), comment],
      timeline: [...(so.timeline ?? []), timeline],
      updatedAt: new Date().toISOString(),
    });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_COMMENT_ADDED, "entity", "service-orders", { id: orderId, commentId: comment.id }).catch(() => {});
    return updated;
  },

  async editComment(orderId: string, commentId: string, text: string): Promise<ServiceOrder> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const comments = (so.comments ?? []).map((c) => c.id === commentId ? { ...c, text, editedAt: new Date().toISOString() } : c);
    const updated = await getStorage().update<ServiceOrder>(COLLECTION, orderId, { comments, updatedAt: new Date().toISOString() });
    return updated;
  },

  async removeComment(orderId: string, commentId: string): Promise<ServiceOrder> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const comments = (so.comments ?? []).filter((c) => c.id !== commentId);
    return getStorage().update<ServiceOrder>(COLLECTION, orderId, { comments, updatedAt: new Date().toISOString() });
  },

  /* Attachments */
  async addAttachment(orderId: string, data: Omit<SOAttachment, "id" | "uploadedAt">): Promise<ServiceOrder> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const attachment: SOAttachment = { ...data, id: uid(), uploadedAt: new Date().toISOString() };
    const timeline = addTimeline(so, "attachment", `Anexo: ${data.name}`, data.uploadedBy);
    const updated = await getStorage().update<ServiceOrder>(COLLECTION, orderId, {
      attachments: [...(so.attachments ?? []), attachment],
      timeline: [...(so.timeline ?? []), timeline],
      updatedAt: new Date().toISOString(),
    });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_ATTACHMENT_ADDED, "entity", "service-orders", { id: orderId, attachmentId: attachment.id, name: data.name }).catch(() => {});
    return updated;
  },

  async removeAttachment(orderId: string, attachmentId: string): Promise<ServiceOrder> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const attachments = (so.attachments ?? []).filter((a) => a.id !== attachmentId);
    return getStorage().update<ServiceOrder>(COLLECTION, orderId, { attachments, updatedAt: new Date().toISOString() });
  },

  /* Services/Parts */
  async addService(orderId: string, item: Omit<SOServiceItem, "id">): Promise<ServiceOrder> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const serviceItem: SOServiceItem = { ...item, id: uid() };
    return getStorage().update<ServiceOrder>(COLLECTION, orderId, {
      services: [...(so.services ?? []), serviceItem],
      finalValue: (so.finalValue ?? 0) + serviceItem.totalValue,
      updatedAt: new Date().toISOString(),
    });
  },

  async addPart(orderId: string, item: Omit<SOPartItem, "id">): Promise<ServiceOrder> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const partItem: SOPartItem = { ...item, id: uid() };
    return getStorage().update<ServiceOrder>(COLLECTION, orderId, {
      parts: [...(so.parts ?? []), partItem],
      finalValue: (so.finalValue ?? 0) + partItem.totalValue,
      updatedAt: new Date().toISOString(),
    });
  },

  /* Favorites */
  async togglePin(id: string): Promise<ServiceOrder> {
    const so = await this.get(id);
    if (!so) throw new Error("Service order not found");
    return getStorage().update<ServiceOrder>(COLLECTION, id, { pinned: !so.pinned, updatedAt: new Date().toISOString() });
  },

  /* Dashboard Stats */
  async getDashboardStats(): Promise<{ open: number; diagnosis: number; awaitingApproval: number; awaitingParts: number; ready: number; delivered: number; cancelled: number; avgTime: number }> {
    // Kept for backward compatibility; use getEnhancedDashboardStats for full stats
    const all = await this.list();
    return {
      open: all.filter((s) => s.status === "Em Aberto").length,
      diagnosis: all.filter((s) => s.status === "Em Diagnóstico").length,
      awaitingApproval: all.filter((s) => s.status === "Aguardando Aprovação").length,
      awaitingParts: all.filter((s) => s.status === "Aguardando Peça").length,
      ready: all.filter((s) => s.status === "Pronta").length,
      delivered: all.filter((s) => s.status === "Entregue").length,
      cancelled: all.filter((s) => s.status === "Cancelada").length,
      avgTime: 0,
    };
  },

  /* Status Management */
  async getStatuses(): Promise<SOStatus[]> { return getDefaultStatuses(); },
  async createStatus(data: Omit<SOStatus, "id">): Promise<SOStatus> { return getStorage().create<SOStatus>(STATUS_COL, data); },
  async updateStatus(id: string, patch: Partial<SOStatus>): Promise<SOStatus> { return getStorage().update<SOStatus>(STATUS_COL, id, patch); },
  async removeStatus(id: string): Promise<void> { return getStorage().delete(STATUS_COL, id); },

  /* ───── Diagnostics ───── */

  async getDiagnostic(orderId: string): Promise<SODiagnostic | null> {
    const so = await this.get(orderId);
    if (!so) return null;
    const diagKey = `so_diag_${orderId}`;
    const all = await getStorage().findAll<SODiagnostic>(diagKey);
    return all.find((d) => d.serviceOrderId === orderId) ?? null;
  },

  async createDiagnostic(orderId: string, data: Omit<DiagnosticRevision, "id" | "version" | "createdAt">, userName?: string): Promise<SODiagnostic> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const diagKey = `so_diag_${orderId}`;
    const existing = await this.getDiagnostic(orderId);
    const version = existing ? existing.currentVersion + 1 : 1;
    const rev: DiagnosticRevision = {
      ...data, id: uid(), version, createdAt: new Date().toISOString(), createdBy: userName,
    };
    if (existing) {
      existing.revisions.push(rev);
      existing.currentVersion = version;
      existing.updatedAt = new Date().toISOString();
      await getStorage().update<SODiagnostic>(diagKey, existing.id, existing);
      const timeline = addTimeline(so, "diagnostic_updated", `Diagnóstico atualizado (v${version})`, userName);
      await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_DIAGNOSTIC_UPDATED, "entity", "service-orders", { id: orderId, version }).catch(() => {});
      return existing;
    }
    const diagnostic: SODiagnostic = {
      id: uid(), serviceOrderId: orderId, companyId: so.companyId ?? undefined,
      currentVersion: version, revisions: [rev], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await getStorage().create<SODiagnostic>(diagKey, diagnostic);
    const timeline = addTimeline(so, "diagnostic_created", `Diagnóstico criado (v${version})`, userName);
    await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_DIAGNOSTIC_CREATED, "entity", "service-orders", { id: orderId, version }).catch(() => {});
    return diagnostic;
  },

  /* ───── Checklists ───── */

  async getChecklists(orderId: string): Promise<SOChecklist[]> {
    const chkKey = `so_chk_${orderId}`;
    return getStorage().findAll<SOChecklist>(chkKey);
  },

  async createChecklist(orderId: string, data: { templateId?: string; templateName: string; items: string[] }, userName?: string): Promise<SOChecklist> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const chkKey = `so_chk_${orderId}`;
    const checklist: SOChecklist = {
      id: uid(), serviceOrderId: orderId, templateId: data.templateId,
      templateName: data.templateName,
      items: data.items.map((label) => ({ id: uid(), label, checked: false }) as SOChecklistItem),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await getStorage().create<SOChecklist>(chkKey, checklist);
    await getStorage().update<ServiceOrder>(COLLECTION, orderId, { updatedAt: new Date().toISOString() });
    return checklist;
  },

  async updateChecklistItem(orderId: string, checklistId: string, itemId: string, checked: boolean, userName?: string): Promise<SOChecklist> {
    const chkKey = `so_chk_${orderId}`;
    const all = await getStorage().findAll<SOChecklist>(chkKey);
    const checklist = all.find((c) => c.id === checklistId);
    if (!checklist) throw new Error("Checklist not found");
    checklist.items = checklist.items.map((item) =>
      item.id === itemId ? { ...item, checked, checkedAt: checked ? new Date().toISOString() : undefined, checkedBy: checked ? userName : undefined } : item,
    );
    const allChecked = checklist.items.every((i) => i.checked);
    if (allChecked && !checklist.completedAt) {
      checklist.completedAt = new Date().toISOString();
      checklist.completedBy = userName;
      const so = await this.get(orderId);
      if (so) {
        const timeline = addTimeline(so, "checklist_completed", `Checklist "${checklist.templateName}" concluído`, userName);
        await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
      }
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_CHECKLIST_COMPLETED, "entity", "service-orders", { id: orderId, checklistId }).catch(() => {});
    }
    checklist.updatedAt = new Date().toISOString();
    await getStorage().update<SOChecklist>(chkKey, checklistId, checklist);
    return checklist;
  },

  /* ───── Checklist Templates ───── */

  async listChecklistTemplates(): Promise<SOChecklistTemplate[]> {
    return getStorage().findAll<SOChecklistTemplate>("so_checklist_templates");
  },

  async createChecklistTemplate(data: Omit<SOChecklistTemplate, "id" | "createdAt" | "updatedAt">): Promise<SOChecklistTemplate> {
    const template: SOChecklistTemplate = {
      ...data, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    return getStorage().create<SOChecklistTemplate>("so_checklist_templates", template);
  },

  async removeChecklistTemplate(id: string): Promise<void> {
    return getStorage().delete("so_checklist_templates", id);
  },

  /* ───── Execution Activities ───── */

  async getExecutionActivities(orderId: string): Promise<SOExecutionActivity[]> {
    const actKey = `so_act_${orderId}`;
    return getStorage().findAll<SOExecutionActivity>(actKey);
  },

  async createExecutionActivity(orderId: string, data: Omit<SOExecutionActivity, "id" | "serviceOrderId" | "comments" | "createdAt" | "updatedAt">, userName?: string): Promise<SOExecutionActivity> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const actKey = `so_act_${orderId}`;
    const activity: SOExecutionActivity = {
      ...data, id: uid(), serviceOrderId: orderId, comments: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await getStorage().create<SOExecutionActivity>(actKey, activity);
    if (data.status === "in_progress") {
      const timeline = addTimeline(so, "execution_started", `Atividade "${data.name}" iniciada`, userName);
      await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_EXECUTION_STARTED, "entity", "service-orders", { id: orderId, activityId: activity.id, name: data.name }).catch(() => {});
    }
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_EXECUTION_ACTIVITY_CREATED, "entity", "service-orders", { id: orderId, activityId: activity.id }).catch(() => {});
    return activity;
  },

  async updateExecutionActivity(orderId: string, activityId: string, patch: Partial<SOExecutionActivity>, userName?: string): Promise<SOExecutionActivity> {
    const actKey = `so_act_${orderId}`;
    const all = await getStorage().findAll<SOExecutionActivity>(actKey);
    const activity = all.find((a) => a.id === activityId);
    if (!activity) throw new Error("Activity not found");
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const oldStatus = activity.status;
    const updated = { ...activity, ...patch, updatedAt: new Date().toISOString() };
    await getStorage().update<SOExecutionActivity>(actKey, activityId, updated);
    if (patch.status && patch.status !== oldStatus) {
      const eventName = patch.status === "completed" ? EVENT_NAMES.SERVICE_ORDER_EXECUTION_COMPLETED
        : patch.status === "cancelled" ? EVENT_NAMES.SERVICE_ORDER_EXECUTION_ACTIVITY_CANCELLED
        : patch.status === "in_progress" ? EVENT_NAMES.SERVICE_ORDER_EXECUTION_STARTED : null;
      const tlType = patch.status === "in_progress" ? "execution_started" as const
        : patch.status === "completed" ? "execution_completed" as const
        : undefined;
      if (tlType) {
        const timeline = addTimeline(so, tlType, `Atividade "${updated.name}" ${patch.status === "in_progress" ? "iniciada" : "concluída"}`, userName);
        await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
      }
      if (eventName) {
        eventBus.publish(eventName, "entity", "service-orders", { id: orderId, activityId, status: patch.status }).catch(() => {});
      }
    }
    return updated;
  },

  async addExecutionComment(orderId: string, activityId: string, text: string, author: string, authorId: string): Promise<SOExecutionActivity> {
    const actKey = `so_act_${orderId}`;
    const all = await getStorage().findAll<SOExecutionActivity>(actKey);
    const activity = all.find((a) => a.id === activityId);
    if (!activity) throw new Error("Activity not found");
    const comment: SOExecutionComment = { id: uid(), text, author, authorId, createdAt: new Date().toISOString() };
    activity.comments.push(comment);
    activity.updatedAt = new Date().toISOString();
    await getStorage().update<SOExecutionActivity>(actKey, activityId, activity);
    return activity;
  },

  async removeExecutionActivity(orderId: string, activityId: string): Promise<void> {
    const actKey = `so_act_${orderId}`;
    return getStorage().delete(actKey, activityId);
  },

  /* ───── Time Tracking ───── */

  async getTimeTracking(orderId: string): Promise<SOTimeTracking[]> {
    const ttKey = `so_tt_${orderId}`;
    return getStorage().findAll<SOTimeTracking>(ttKey);
  },

  async startTimeTracking(orderId: string, technicianId?: string, technicianName?: string): Promise<SOTimeTracking> {
    const ttKey = `so_tt_${orderId}`;
    const tracking: SOTimeTracking = {
      id: uid(), serviceOrderId: orderId, startTime: new Date().toISOString(),
      technicianId, technicianName, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await getStorage().create<SOTimeTracking>(ttKey, tracking);
    const so = await this.get(orderId);
    if (so) {
      const timeline = addTimeline(so, "execution_started", "Execução iniciada", technicianName);
      await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
    }
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_EXECUTION_STARTED, "entity", "service-orders", { id: orderId, trackingId: tracking.id }).catch(() => {});
    return tracking;
  },

  async updateTimeTracking(orderId: string, trackingId: string, patch: Partial<SOTimeTracking>): Promise<SOTimeTracking> {
    const ttKey = `so_tt_${orderId}`;
    const updated = await getStorage().update<SOTimeTracking>(ttKey, trackingId, { ...patch, updatedAt: new Date().toISOString() });
    const so = await this.get(orderId);
    if (so && patch.pauseTime) {
      const timeline = addTimeline(so, "execution_paused", "Execução pausada", patch.technicianName);
      await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_EXECUTION_PAUSED, "entity", "service-orders", { id: orderId }).catch(() => {});
    }
    if (so && patch.resumeTime) {
      const timeline = addTimeline(so, "execution_resumed", "Execução retomada", patch.technicianName);
      await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_EXECUTION_RESUMED, "entity", "service-orders", { id: orderId }).catch(() => {});
    }
    if (so && patch.completionTime) {
      const timeline = addTimeline(so, "execution_completed", "Execução concluída", patch.technicianName);
      await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_EXECUTION_COMPLETED, "entity", "service-orders", { id: orderId }).catch(() => {});
    }
    return updated;
  },

  /* ───── Photos ───── */

  async getPhotos(orderId: string): Promise<SOPhoto[]> {
    const photoKey = `so_photo_${orderId}`;
    return getStorage().findAll<SOPhoto>(photoKey);
  },

  async addPhoto(orderId: string, data: Omit<SOPhoto, "id" | "uploadedAt" | "serviceOrderId">, userName?: string): Promise<SOPhoto> {
    const photoKey = `so_photo_${orderId}`;
    const photo: SOPhoto = {
      ...data, id: uid(), serviceOrderId: orderId, uploadedAt: new Date().toISOString(), uploadedBy: userName ?? "",
    };
    await getStorage().create<SOPhoto>(photoKey, photo);
    const so = await this.get(orderId);
    if (so) {
      const timeline = addTimeline(so, "photo_added", `Foto adicionada: ${data.caption || data.category}`, userName);
      await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
    }
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_PHOTO_ADDED, "entity", "service-orders", { id: orderId, photoId: photo.id, category: data.category }).catch(() => {});
    return photo;
  },

  async removePhoto(orderId: string, photoId: string): Promise<void> {
    const photoKey = `so_photo_${orderId}`;
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_PHOTO_REMOVED, "entity", "service-orders", { id: orderId, photoId }).catch(() => {});
    return getStorage().delete(photoKey, photoId);
  },

  async togglePhotoFavorite(orderId: string, photoId: string): Promise<SOPhoto> {
    const photoKey = `so_photo_${orderId}`;
    const all = await getStorage().findAll<SOPhoto>(photoKey);
    const photo = all.find((p) => p.id === photoId);
    if (!photo) throw new Error("Photo not found");
    photo.favorite = !photo.favorite;
    await getStorage().update<SOPhoto>(photoKey, photoId, photo);
    return photo;
  },

  /* ───── Returns ───── */

  async getReturns(orderId: string): Promise<SOReturn[]> {
    const retKey = `so_ret_${orderId}`;
    const all = await getStorage().findAll<SOReturn>(retKey);
    return all.filter((r) => r.serviceOrderId === orderId);
  },

  async createReturn(orderId: string, data: {
    reason: string; reportedDefect: string; diagnosis: string; solution: string;
    warrantyApplied?: boolean; charged?: boolean; responsibleName?: string;
  }, userName?: string): Promise<SOReturn> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const retKey = `so_ret_${orderId}`;
    const existing = await this.getReturns(orderId);
    const ret: SOReturn = {
      id: uid(), serviceOrderId: orderId, number: `${so.number}-R${existing.length + 1}`,
      date: new Date().toISOString().split("T")[0], reason: data.reason,
      reportedDefect: data.reportedDefect, diagnosis: data.diagnosis, solution: data.solution,
      warrantyApplied: data.warrantyApplied ?? false, charged: data.charged ?? true,
      responsibleName: data.responsibleName, photos: [], documents: [], timeline: [], comments: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    ret.timeline.push({
      id: uid(), type: "return_created", description: `Retorno ${ret.number} criado`, userName, createdAt: new Date().toISOString(),
    });
    await getStorage().create<SOReturn>(retKey, ret);
    const timeline = addTimeline(so, "return_created", `Retorno ${ret.number} registrado`, userName);
    await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_RETURN_CREATED, "entity", "service-orders", { id: orderId, returnId: ret.id, number: ret.number }).catch(() => {});
    return ret;
  },

  async updateReturn(orderId: string, returnId: string, patch: Partial<SOReturn>): Promise<SOReturn> {
    const retKey = `so_ret_${orderId}`;
    const updated = await getStorage().update<SOReturn>(retKey, returnId, { ...patch, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_RETURN_UPDATED, "entity", "service-orders", { id: orderId, returnId }).catch(() => {});
    return updated;
  },

  async addReturnComment(orderId: string, returnId: string, data: Omit<SOComment, "id" | "createdAt">): Promise<SOReturn> {
    const retKey = `so_ret_${orderId}`;
    const all = await getStorage().findAll<SOReturn>(retKey);
    const ret = all.find((r) => r.id === returnId);
    if (!ret) throw new Error("Return not found");
    const comment: SOComment = { ...data, id: uid(), createdAt: new Date().toISOString() };
    ret.comments.push(comment);
    ret.updatedAt = new Date().toISOString();
    await getStorage().update<SOReturn>(retKey, returnId, ret);
    return ret;
  },

  /* ───── Warranties ───── */

  async getWarranties(orderId: string): Promise<SOWarranty[]> {
    const wrnKey = `so_wrn_${orderId}`;
    return getStorage().findAll<SOWarranty>(wrnKey);
  },

  async createWarranty(orderId: string, data: Omit<SOWarranty, "id" | "serviceOrderId" | "status" | "createdAt" | "updatedAt">): Promise<SOWarranty> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const wrnKey = `so_wrn_${orderId}`;
    const startDate = data.startDate || new Date().toISOString().split("T")[0];
    const end = new Date(startDate);
    end.setDate(end.getDate() + data.days);
    const warranty: SOWarranty = {
      ...data, id: uid(), serviceOrderId: orderId, startDate,
      endDate: data.endDate || end.toISOString().split("T")[0],
      status: "active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await getStorage().create<SOWarranty>(wrnKey, warranty);
    const timeline = addTimeline(so, "warranty_created", `Garantia criada: ${data.days} dias (${data.type})`);
    await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_WARRANTY_CREATED, "entity", "service-orders", { id: orderId, warrantyId: warranty.id, days: data.days }).catch(() => {});
    return warranty;
  },

  async updateWarranty(orderId: string, warrantyId: string, patch: Partial<SOWarranty>): Promise<SOWarranty> {
    const wrnKey = `so_wrn_${orderId}`;
    const updated = await getStorage().update<SOWarranty>(wrnKey, warrantyId, { ...patch, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_WARRANTY_UPDATED, "entity", "service-orders", { id: orderId, warrantyId }).catch(() => {});
    return updated;
  },

  /* ───── Technician Dashboard ───── */

  async getTechnicianDashboardStats(technicianId?: string): Promise<TechnicianDashboardStats> {
    const all = await this.list();
    const techOrders = technicianId ? all.filter((s) => s.technicianId === technicianId) : all;
    const today = new Date().toISOString().split("T")[0];
    return {
      assigned: techOrders.filter((s) => !["Entregue", "Cancelada"].includes(s.status)).length,
      inExecution: techOrders.filter((s) => s.status === "Em Execução").length,
      awaitingParts: techOrders.filter((s) => s.status === "Aguardando Peça").length,
      completedToday: techOrders.filter((s) => s.deliveryDate === today || (s.status === "Entregue" && s.deliveryDate === today)).length,
      avgTime: 0,
      returns: techOrders.length,
      pendingIssues: techOrders.filter((s) => s.status === "Em Diagnóstico" || s.status === "Aguardando Aprovação").length,
      schedule: [],
    };
  },

  /* ───── Device History ───── */

  async getDeviceHistory(deviceId: string): Promise<ServiceOrder[]> {
    const all = await this.list();
    return all.filter((so) => so.deviceId === deviceId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /* ───── Reopen ───── */

  async reopen(id: string, userName?: string): Promise<ServiceOrder> {
    const so = await this.get(id);
    if (!so) throw new Error("Service order not found");
    const timeline = addTimeline(so, "reopened", `OS reaberta`, userName);
    return getStorage().update<ServiceOrder>(COLLECTION, id, {
      status: "Em Aberto", statusLabel: "Em Aberto",
      timeline: so.timeline, updatedAt: new Date().toISOString(), updatedBy: userName,
    });
  },

  /* ───── Enhanced Dashboard Stats ───── */

  async getEnhancedDashboardStats(): Promise<SODashboardStats> {
    const base = await this.getDashboardStats();
    const all = await this.list();
    return {
      ...base,
      technicianAssigned: all.filter((s) => s.technicianId && !["Entregue", "Cancelada"].includes(s.status)).length,
      inExecution: all.filter((s) => s.status === "Em Execução").length,
      completedToday: all.filter((s) => {
        if (!s.deliveryDate) return false;
        const today = new Date().toISOString().split("T")[0];
        return s.deliveryDate === today;
      }).length,
      returns: 0,
      pendingIssues: all.filter((s) => s.status === "Em Diagnóstico" || s.status === "Aguardando Aprovação" || s.status === "Aguardando Peça").length,
      avgDiagnosisTime: 0,
      avgExecutionTime: 0,
    };
  },

  /* ───── Budget ───── */

  async getBudget(orderId: string): Promise<SOBudget | null> {
    const col = `so_budget_${orderId}`;
    const all = await getStorage().findAll<SOBudget>(col);
    return all.sort((a, b) => b.version - a.version)[0] ?? null;
  },

  async getBudgetVersions(orderId: string): Promise<SOBudget[]> {
    const col = `so_budget_${orderId}`;
    const all = await getStorage().findAll<SOBudget>(col);
    return all.sort((a, b) => b.version - a.version);
  },

  async createBudget(orderId: string, data: { items: Omit<SOBudgetItem, "id">[]; discountTotal?: number; discountType?: "percent" | "fixed"; discountReason?: string; markupTotal?: number; taxes?: number; shipping?: number; validityDays?: number; deadline?: string; warrantyDescription?: string; notes?: string }, userName?: string): Promise<SOBudget> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const col = `so_budget_${orderId}`;
    const existing = await this.getBudgetVersions(orderId);
    const version = existing.length + 1;
    const items: SOBudgetItem[] = data.items.map((item) => {
      const discount = item.discount ?? 0;
      const markup = item.markup ?? 0;
      const baseTotal = item.quantity * item.unitValue;
      const discountVal = item.discountType === "percent" ? baseTotal * (discount / 100) : discount;
      const markupVal = item.markupType === "percent" ? baseTotal * (markup / 100) : markup;
      return { ...item, id: uid(), totalValue: baseTotal - discountVal + markupVal };
    });
    const subtotal = items.reduce((s, i) => s + i.totalValue, 0);
    const discTotal = data.discountTotal ?? 0;
    const discVal = data.discountType === "percent" ? subtotal * (discTotal / 100) : discTotal;
    const markupVal = data.markupTotal ?? 0;
    const finalValue = subtotal - discVal + markupVal + (data.taxes ?? 0) + (data.shipping ?? 0);
    const budget: SOBudget = {
      id: uid(), serviceOrderId: orderId, version, items,
      discountTotal: discTotal, discountType: data.discountType ?? "fixed", discountReason: data.discountReason,
      markupTotal: markupVal, taxes: data.taxes ?? 0, shipping: data.shipping ?? 0,
      subtotal, finalValue, validityDays: data.validityDays ?? 7,
      deadline: data.deadline ?? new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      warrantyDescription: data.warrantyDescription ?? "", notes: data.notes ?? "",
      status: "pending", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: userName,
    };
    await getStorage().create<SOBudget>(col, budget);
    await this.addFinancialHistory(orderId, { type: "budget_created", description: `Orçamento v${version} criado`, value: finalValue, userName });
    const timeline = addTimeline(so, "budget_created", `Orçamento v${version} criado - R$ ${finalValue.toFixed(2)}`, userName);
    await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_BUDGET_CREATED, "entity", "service-orders", { id: orderId, budgetId: budget.id, version, finalValue }).catch(() => {});
    return budget;
  },

  async updateBudget(orderId: string, budgetId: string, patch: Partial<SOBudget>, userName?: string): Promise<SOBudget> {
    const col = `so_budget_${orderId}`;
    const updated = await getStorage().update<SOBudget>(col, budgetId, { ...patch, updatedAt: new Date().toISOString() });
    if (patch.status === "approved") {
      const so = await this.get(orderId);
      if (so) {
        const timeline = addTimeline(so, "budget_approved", `Orçamento aprovado`, userName);
        await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
      }
      await this.addFinancialHistory(orderId, { type: "budget_approved", description: "Orçamento aprovado", userName });
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_BUDGET_APPROVED, "entity", "service-orders", { id: orderId, budgetId }).catch(() => {});
    }
    if (patch.status === "rejected") {
      const so = await this.get(orderId);
      if (so) {
        const timeline = addTimeline(so, "budget_rejected", `Orçamento rejeitado: ${patch.rejectionReason ?? "Sem motivo"}`, userName);
        await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
      }
      await this.addFinancialHistory(orderId, { type: "budget_rejected", description: `Orçamento rejeitado: ${patch.rejectionReason ?? ""}`, userName });
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_BUDGET_REJECTED, "entity", "service-orders", { id: orderId, budgetId, reason: patch.rejectionReason }).catch(() => {});
    }
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_BUDGET_UPDATED, "entity", "service-orders", { id: orderId, budgetId, status: patch.status }).catch(() => {});
    return updated;
  },

  /* ───── Approval ───── */

  async getApproval(orderId: string): Promise<SOApproval | null> {
    const col = `so_approval_${orderId}`;
    const all = await getStorage().findAll<SOApproval>(col);
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
  },

  async createApproval(orderId: string, data: { budgetId?: string; origin: SOApproval["origin"]; notes?: string }, userName?: string): Promise<SOApproval> {
    const col = `so_approval_${orderId}`;
    const approval: SOApproval = {
      id: uid(), serviceOrderId: orderId, budgetId: data.budgetId,
      status: "pending", origin: data.origin, notes: data.notes,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await getStorage().create<SOApproval>(col, approval);
    return approval;
  },

  async updateApproval(orderId: string, approvalId: string, patch: Partial<SOApproval>, userName?: string): Promise<SOApproval> {
    const col = `so_approval_${orderId}`;
    const now = new Date().toISOString();
    const updates: Partial<SOApproval> = { ...patch, updatedAt: now };
    if (patch.status === "sent") updates.sentAt = now;
    if (patch.status === "viewed") updates.viewedAt = now;
    if (patch.status === "approved") updates.approvedAt = now;
    if (patch.status === "rejected") updates.rejectedAt = now;
    const updated = await getStorage().update<SOApproval>(col, approvalId, updates);
    const so = await this.get(orderId);
    if (so && patch.status === "approved") {
      const timeline = addTimeline(so, "budget_approved", `Orçamento aprovado via ${patch.origin || "portal"}`, userName);
      await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_BUDGET_APPROVED, "entity", "service-orders", { id: orderId, approvalId }).catch(() => {});
    }
    if (so && patch.status === "rejected") {
      const timeline = addTimeline(so, "budget_rejected", `Orçamento rejeitado via ${patch.origin || "portal"}`, userName);
      await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
    }
    return updated;
  },

  /* ───── Payment ───── */

  async getPayments(orderId: string): Promise<SOPayment[]> {
    const col = `so_payment_${orderId}`;
    return getStorage().findAll<SOPayment>(col);
  },

  async createPayment(orderId: string, data: { method: SOPayment["method"]; methodLabel: string; value: number; installments?: number; date?: string; notes?: string; responsible?: string }, userName?: string): Promise<SOPayment> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const col = `so_payment_${orderId}`;
    const installments = data.installments ?? 1;
    const installmentValue = data.value / installments;
    const installmentDetail: SOPaymentInstallment[] = [];
    for (let i = 1; i <= installments; i++) {
      const due = new Date();
      due.setMonth(due.getMonth() + i - 1);
      installmentDetail.push({
        id: uid(), number: i, value: installmentValue, dueDate: due.toISOString().split("T")[0], status: "pending",
      });
    }
    const payment: SOPayment = {
      id: uid(), serviceOrderId: orderId,
      method: data.method, methodLabel: data.methodLabel, value: data.value,
      installments, installmentDetail,
      date: data.date ?? new Date().toISOString().split("T")[0],
      time: new Date().toISOString().split("T")[1]?.split(".")[0] ?? "00:00",
      notes: data.notes, responsible: data.responsible ?? userName,
      status: "pending", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await getStorage().create<SOPayment>(col, payment);
    await this.addFinancialHistory(orderId, { type: "payment_added", description: `Pagamento: ${data.methodLabel} R$ ${data.value.toFixed(2)}`, value: data.value, userName });
    const timeline = addTimeline(so, "payment_added", `Pagamento adicionado: ${data.methodLabel} R$ ${data.value.toFixed(2)}`, userName);
    await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_PAYMENT_CREATED, "entity", "service-orders", { id: orderId, paymentId: payment.id, value: data.value }).catch(() => {});
    return payment;
  },

  async confirmPayment(orderId: string, paymentId: string, userName?: string): Promise<SOPayment> {
    const col = `so_payment_${orderId}`;
    const all = await getStorage().findAll<SOPayment>(col);
    const payment = all.find((p) => p.id === paymentId);
    if (!payment) throw new Error("Payment not found");
    const now = new Date().toISOString();
    payment.status = "confirmed";
    payment.confirmedAt = now;
    payment.confirmedBy = userName;
    payment.installmentDetail = payment.installmentDetail?.map((inst) => ({ ...inst, status: "paid" as const, paidAt: now }));
    payment.updatedAt = now;
    await getStorage().update<SOPayment>(col, paymentId, payment);
    const so = await this.get(orderId);
    if (so) {
      const timeline = addTimeline(so, "payment_confirmed", `Pagamento confirmado: ${payment.methodLabel} R$ ${payment.value.toFixed(2)}`, userName);
      await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
    }
    await this.addFinancialHistory(orderId, { type: "payment_confirmed", description: `Pagamento confirmado: R$ ${payment.value.toFixed(2)}`, value: payment.value, userName });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_PAYMENT_CONFIRMED, "entity", "service-orders", { id: orderId, paymentId, value: payment.value }).catch(() => {});
    return payment;
  },

  /* ───── Signature ───── */

  async getSignatures(orderId: string): Promise<SOSignature[]> {
    const col = `so_sig_${orderId}`;
    return getStorage().findAll<SOSignature>(col);
  },

  async collectSignature(orderId: string, data: { type: SOSignature["type"]; signatoryName: string; signatoryId?: string; signatureData: string; deliveryId?: string }, userName?: string): Promise<SOSignature> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const col = `so_sig_${orderId}`;
    const signature: SOSignature = {
      id: uid(), serviceOrderId: orderId, type: data.type,
      signatoryName: data.signatoryName, signatoryId: data.signatoryId,
      signatureData: data.signatureData, deliveryId: data.deliveryId,
      collectedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
    };
    await getStorage().create<SOSignature>(col, signature);
    const timeline = addTimeline(so, "signature_collected", `Assinatura coletada: ${data.signatoryName} (${data.type})`, userName);
    await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_SIGNATURE_COLLECTED, "entity", "service-orders", { id: orderId, signatureId: signature.id, type: data.type }).catch(() => {});
    return signature;
  },

  /* ───── Delivery ───── */

  async getDelivery(orderId: string): Promise<SODelivery | null> {
    const col = `so_delivery_${orderId}`;
    const all = await getStorage().findAll<SODelivery>(col);
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
  },

  async completeDelivery(orderId: string, data: { responsable: string; date?: string; time?: string; exitPhotos?: string[]; signatureId?: string; documentsDelivered?: string[]; warrantyDelivered?: boolean; paymentConfirmed?: boolean; checklist?: { label: string; checked: boolean }[]; notes?: string }, userName?: string): Promise<SODelivery> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const col = `so_delivery_${orderId}`;
    const now = new Date();
    const checklist: SODeliveryChecklistItem[] = (data.checklist ?? []).map((c) => ({ id: uid(), label: c.label, checked: c.checked, checkedAt: c.checked ? now.toISOString() : undefined }));
    const delivery: SODelivery = {
      id: uid(), serviceOrderId: orderId, responsable: data.responsable,
      date: data.date ?? now.toISOString().split("T")[0],
      time: data.time ?? now.toISOString().split("T")[1]?.split(".")[0] ?? "00:00",
      exitPhotos: data.exitPhotos ?? [], signatureId: data.signatureId,
      documentsDelivered: data.documentsDelivered ?? [], warrantyDelivered: data.warrantyDelivered ?? false,
      paymentConfirmed: data.paymentConfirmed ?? false, checklist,
      notes: data.notes, completedAt: now.toISOString(), createdAt: now.toISOString(), updatedAt: now.toISOString(),
    };
    await getStorage().create<SODelivery>(col, delivery);
    const allPaid = (await this.getPayments(orderId)).every((p) => p.status === "confirmed");
    const timeline = addTimeline(so, "delivery_completed", `Entrega realizada por ${data.responsable}`, userName);
    const updates: Partial<ServiceOrder> = {
      timeline: so.timeline, deliveryDate: delivery.date, updatedAt: now.toISOString(), updatedBy: userName,
    };
    if (allPaid && delivery.paymentConfirmed) {
      updates.status = "Entregue";
      updates.statusLabel = "Entregue";
    }
    await getStorage().update<ServiceOrder>(COLLECTION, orderId, updates);
    await this.addFinancialHistory(orderId, { type: "delivery_completed", description: `Entrega concluída por ${data.responsable}`, userName });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_DELIVERY_COMPLETED, "entity", "service-orders", { id: orderId, deliveryId: delivery.id }).catch(() => {});
    return delivery;
  },

  /* ───── Receipt ───── */

  async getReceipts(orderId: string): Promise<SOReceipt[]> {
    const col = `so_receipt_${orderId}`;
    return getStorage().findAll<SOReceipt>(col);
  },

  async generateReceipt(orderId: string, type: SOReceipt["type"], generatedBy?: string): Promise<SOReceipt> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const col = `so_receipt_${orderId}`;
    const existing = await this.getReceipts(orderId);
    const receipt: SOReceipt = {
      id: uid(), serviceOrderId: orderId, type,
      number: `${so.number}-${type}-${existing.length + 1}`,
      generatedAt: new Date().toISOString(), generatedBy, createdAt: new Date().toISOString(),
    };
    await getStorage().create<SOReceipt>(col, receipt);
    const timeline = addTimeline(so, "receipt_generated", `Recibo gerado: ${type} (${receipt.number})`, generatedBy);
    await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_RECEIPT_GENERATED, "entity", "service-orders", { id: orderId, receiptId: receipt.id, type }).catch(() => {});
    return receipt;
  },

  /* ───── Financial History ───── */

  async getFinancialHistory(orderId: string): Promise<SOFinancialHistoryEntry[]> {
    const col = `so_fin_${orderId}`;
    const all = await getStorage().findAll<SOFinancialHistoryEntry>(col);
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addFinancialHistory(orderId: string, data: { type: SOFinancialHistoryEntry["type"]; description: string; value?: number; userName?: string }): Promise<SOFinancialHistoryEntry> {
    const col = `so_fin_${orderId}`;
    const all = await this.getFinancialHistory(orderId);
    const prevBalance = all.length > 0 ? (all[0].newBalance ?? 0) : 0;
    const entry: SOFinancialHistoryEntry = {
      id: uid(), serviceOrderId: orderId, type: data.type,
      description: data.description, value: data.value,
      previousBalance: prevBalance,
      newBalance: prevBalance + (data.type === "payment_confirmed" ? (data.value ?? 0) : 0),
      userName: data.userName, createdAt: new Date().toISOString(),
    };
    await getStorage().create<SOFinancialHistoryEntry>(col, entry);
    return entry;
  },

  /* ───── Portal Access ───── */

  async getPortalAccess(orderId: string): Promise<SOPortalAccess | null> {
    const col = "so_portal_access";
    const all = await getStorage().findAll<SOPortalAccess>(col);
    return all.find((p) => p.serviceOrderId === orderId) ?? null;
  },

  async generatePortalAccess(orderId: string): Promise<SOPortalAccess> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const col = "so_portal_access";
    const existing = await this.getPortalAccess(orderId);
    if (existing) return existing;
    const publicCode = `${so.number}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const hash = btoa(publicCode);
    const portal: SOPortalAccess = {
      id: uid(), serviceOrderId: orderId, publicCode, hash,
      qrData: JSON.stringify({ type: "so", publicCode, hash }),
      publicUrl: `/portal/${publicCode}`,
      status: so.status, statusLabel: so.statusLabel,
      timeline: so.timeline ?? [],
      documents: (so.documents ?? []).map((d) => d.name),
      warranty: so.warrantyId ?? "",
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await getStorage().create<SOPortalAccess>(col, portal);
    return portal;
  },

  /* ───── Closing ───── */

  async validateClosing(orderId: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const so = await this.get(orderId);
    if (!so) return { valid: false, errors: ["OS não encontrada"] };
    const payments = await this.getPayments(orderId);
    if (payments.length === 0) errors.push("Nenhum pagamento registrado");
    const allPaid = payments.every((p) => p.status === "confirmed");
    if (!allPaid) errors.push("Existem pagamentos pendentes");
    const delivery = await this.getDelivery(orderId);
    if (!delivery) errors.push("Entrega não realizada");
    if (delivery && !delivery.paymentConfirmed) errors.push("Pagamento não confirmado na entrega");
    const signatures = await this.getSignatures(orderId);
    const hasCustomerSig = signatures.some((s) => s.type === "customer");
    if (!hasCustomerSig) errors.push("Assinatura do cliente não coletada");
    return { valid: errors.length === 0, errors };
  },

  async closeOrder(orderId: string, userName?: string): Promise<ServiceOrder> {
    const validation = await this.validateClosing(orderId);
    if (!validation.valid) throw new Error(`Não é possível encerrar: ${validation.errors.join("; ")}`);
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const timeline = addTimeline(so, "closed", `OS encerrada`, userName);
    const updated = await getStorage().update<ServiceOrder>(COLLECTION, orderId, {
      status: "Entregue", statusLabel: "Entregue",
      timeline: so.timeline, deliveryDate: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString(), updatedBy: userName,
    });
    await this.addFinancialHistory(orderId, { type: "closed", description: "OS encerrada", userName });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_CLOSED, "entity", "service-orders", { id: orderId }).catch(() => {});
    return updated;
  },

  /* ───── Enhanced Dashboard with Budget/Payment Stats ───── */

  async getEnhancedDashboardStatsV2(): Promise<EnhancedDashboardStats> {
    const base = await this.getEnhancedDashboardStats();
    const all = await this.list();
    let totalValue = 0;
    let totalReceived = 0;
    let budgets = 0;
    let approvals = 0;
    for (const so of all) {
      const budget = await this.getBudget(so.id);
      if (budget) {
        budgets++;
        totalValue += budget.finalValue;
        if (budget.status === "approved") approvals++;
        if (budget.status === "approved") totalReceived += budget.finalValue;
      }
      const payments = await this.getPayments(so.id);
      for (const p of payments) {
        if (p.status === "confirmed") totalReceived += p.value;
      }
    }
    return {
      ...base,
      pendingBudgets: budgets - approvals,
      pendingApprovals: all.filter((s) => s.status === "Aguardando Aprovação").length,
      readyForPickup: all.filter((s) => s.status === "Pronta").length,
      awaitingPickup: all.filter((s) => s.status === "Aguardando Retirada").length,
      totalValue,
      totalReceived,
      avgApprovalTime: 0,
      avgPickupTime: 0,
    };
  },

  /* ───── Tests ───── */

  async getTests(orderId: string): Promise<SOTest[]> {
    const col = `so_test_${orderId}`;
    return getStorage().findAll<SOTest>(col);
  },

  async createTest(orderId: string, data: Omit<SOTest, "id" | "serviceOrderId" | "createdAt" | "updatedAt">, userName?: string): Promise<SOTest> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const col = `so_test_${orderId}`;
    const test: SOTest = {
      ...data, id: uid(), serviceOrderId: orderId,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await getStorage().create<SOTest>(col, test);
    const timeline = addTimeline(so, "checklist_completed", `Teste ${test.typeLabel} registrado`, userName);
    await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
    if (test.result !== "pending") {
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_TEST_COMPLETED, "entity", "service-orders", { id: orderId, testId: test.id, result: test.result }).catch(() => {});
    }
    return test;
  },

  async updateTest(orderId: string, testId: string, patch: Partial<SOTest>, userName?: string): Promise<SOTest> {
    const col = `so_test_${orderId}`;
    const all = await getStorage().findAll<SOTest>(col);
    const test = all.find((t) => t.id === testId);
    if (!test) throw new Error("Test not found");
    const updated = { ...test, ...patch, updatedAt: new Date().toISOString() };
    await getStorage().update<SOTest>(col, testId, updated);
    if (patch.result && patch.result !== test.result) {
      const so = await this.get(orderId);
      if (so) {
        const tlType = patch.result === "passed" ? "checklist_completed" : "execution_completed";
        const timeline = addTimeline(so, tlType, `Teste "${updated.typeLabel}": ${patch.result === "passed" ? "APROVADO" : "FALHOU"}`, userName);
        await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
      }
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_TEST_COMPLETED, "entity", "service-orders", { id: orderId, testId, result: patch.result }).catch(() => {});
    }
    return updated;
  },

  async removeTest(orderId: string, testId: string): Promise<void> {
    const col = `so_test_${orderId}`;
    return getStorage().delete(col, testId);
  },

  async canDeliver(orderId: string): Promise<{ allowed: boolean; pendingTests: number }> {
    const tests = await this.getTests(orderId);
    const pending = tests.filter((t) => t.result === "pending").length;
    return { allowed: pending === 0, pendingTests: pending };
  },

  /* ───── Quality Control ───── */

  async getQualityControl(orderId: string): Promise<SOQualityControl | null> {
    const col = `so_qc_${orderId}`;
    const all = await getStorage().findAll<SOQualityControl>(col);
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
  },

  async createQualityControl(orderId: string, data: { result: "approved" | "rejected"; observations: string; responsibleName?: string }, userName?: string): Promise<SOQualityControl> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const col = `so_qc_${orderId}`;
    const qc: SOQualityControl = {
      id: uid(), serviceOrderId: orderId,
      result: data.result, observations: data.observations,
      responsibleName: data.responsibleName ?? userName,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await getStorage().create<SOQualityControl>(col, qc);
    const tlType = data.result === "approved" ? "checklist_completed" : "execution_completed";
    const desc = data.result === "approved" ? "Controle de qualidade: APROVADO" : "Controle de qualidade: REPROVADO";
    const timeline = addTimeline(so, tlType, desc, userName);
    await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, updatedAt: new Date().toISOString() });
    if (data.result === "approved") {
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_QUALITY_APPROVED, "entity", "service-orders", { id: orderId, qcId: qc.id }).catch(() => {});
    } else {
      eventBus.publish(EVENT_NAMES.SERVICE_ORDER_QUALITY_REJECTED, "entity", "service-orders", { id: orderId, qcId: qc.id }).catch(() => {});
    }
    return qc;
  },

  /* ───── Costs ───── */

  async getCosts(orderId: string): Promise<SOCosts | null> {
    const col = `so_cost_${orderId}`;
    const all = await getStorage().findAll<SOCosts>(col);
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
  },

  async calculateCosts(orderId: string): Promise<SOCosts> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const col = `so_cost_${orderId}`;
    const parts = so.parts ?? [];
    const services = so.services ?? [];
    const partsCost = parts.reduce((s, p) => s + p.totalValue, 0);
    const laborCost = services.reduce((s, sv) => s + sv.totalValue, 0);
    const totalCost = partsCost + laborCost;
    const finalValue = so.finalValue ?? totalCost;
    const estimatedProfit = finalValue - totalCost;
    const margin = totalCost > 0 ? ((estimatedProfit / totalCost) * 100) : 0;
    const costs: SOCosts = {
      id: uid(), serviceOrderId: orderId,
      partsCost, laborCost, additionalCosts: 0, thirdPartyCosts: 0,
      shippingCost: 0, discount: 0, totalCost,
      estimatedProfit, realizedProfit: 0, margin,
      notes: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await getStorage().create<SOCosts>(col, costs);
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_COSTS_UPDATED, "entity", "service-orders", { id: orderId, costsId: costs.id }).catch(() => {});
    return costs;
  },

  async updateCosts(orderId: string, patch: Partial<SOCosts>): Promise<SOCosts> {
    const col = `so_cost_${orderId}`;
    const existing = await this.getCosts(orderId);
    if (!existing) {
      const costs = await this.calculateCosts(orderId);
      const updated = { ...costs, ...patch, updatedAt: new Date().toISOString() };
      await getStorage().update<SOCosts>(col, costs.id, updated);
      return updated;
    }
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    await getStorage().update<SOCosts>(col, existing.id, updated);
    return updated;
  },

  /* ───── Analytics ───── */

  async getAnalytics(orderId: string): Promise<SOAnalytics | null> {
    const so = await this.get(orderId);
    if (!so) return null;
    const all = await this.list();
    const techAvgTimes: Array<{ technicianName: string; avgTime: number }> = [];
    const techMap = new Map<string, { total: number; count: number }>();
    for (const s of all) {
      if (s.technicianName) {
        const entry = techMap.get(s.technicianName) ?? { total: 0, count: 0 };
        entry.count++;
        techMap.set(s.technicianName, entry);
      }
    }
    for (const [name, data] of techMap) {
      techAvgTimes.push({ technicianName: name, avgTime: Math.round(data.total / data.count) });
    }
    const defectCount = new Map<string, number>();
    for (const s of all) {
      if (s.defectName) {
        defectCount.set(s.defectName, (defectCount.get(s.defectName) ?? 0) + 1);
      }
    }
    const commonDefects = Array.from(defectCount.entries()).map(([defect, count]) => ({ defect, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    const mostUsedParts: Array<{ partName: string; count: number }> = [];
    const partCount = new Map<string, number>();
    for (const s of all) {
      for (const p of s.parts ?? []) {
        partCount.set(p.partName, (partCount.get(p.partName) ?? 0) + p.quantity);
      }
    }
    for (const [name, count] of partCount) {
      mostUsedParts.push({ partName: name, count });
    }
    return {
      serviceOrderId: orderId,
      avgDiagnosisTime: 0, avgExecutionTime: 0,
      technicianAvgTimes: techAvgTimes,
      recurrentEquipment: [],
      commonDefects, mostUsedParts: mostUsedParts.sort((a, b) => b.count - a.count).slice(0, 10),
      topReturnBrands: [], warrantiesTriggered: 0, returnsByPeriod: [], avgApprovalTime: 0,
    };
  },

  /* ───── Document Generation ───── */

  async generateDiagnosticDocument(orderId: string): Promise<string> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const diag = await this.getDiagnostic(orderId);
    const rev = diag?.revisions[diag.revisions.length - 1];
    const docId = `${so.id}-diag-${Date.now()}`;
    const timeline = addTimeline(so, "document_generated", `Laudo Técnico gerado`, "System");
    so.documents = [...(so.documents ?? []), { id: uid(), documentId: docId, type: "proof", name: `Laudo_${so.number}`, generatedAt: new Date().toISOString() }];
    await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, documents: so.documents, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_DOCUMENT_GENERATED, "entity", "service-orders", { id: orderId, documentId: docId, type: "diagnostic" }).catch(() => {});
    return docId;
  },

  async generateBudgetDocument(orderId: string): Promise<string> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const budget = await this.getBudget(orderId);
    const docId = `${so.id}-budget-${Date.now()}`;
    const timeline = addTimeline(so, "document_generated", `Orçamento v${budget?.version ?? 1} gerado`, "System");
    so.documents = [...(so.documents ?? []), { id: uid(), documentId: docId, type: "budget", name: `Orcamento_${so.number}_v${budget?.version ?? 1}`, generatedAt: new Date().toISOString() }];
    await getStorage().update<ServiceOrder>(COLLECTION, orderId, { timeline: so.timeline, documents: so.documents, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_DOCUMENT_GENERATED, "entity", "service-orders", { id: orderId, documentId: docId, type: "budget" }).catch(() => {});
    return docId;
  },

  async generateWarrantyCertificate(orderId: string, warrantyId: string): Promise<string> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const wrnKey = `so_wrn_${orderId}`;
    const all = await getStorage().findAll<SOWarranty>(wrnKey);
    const warranty = all.find((w) => w.id === warrantyId);
    if (!warranty) throw new Error("Warranty not found");
    const docId = `${so.id}-warranty-${Date.now()}`;
    so.documents = [...(so.documents ?? []), { id: uid(), documentId: docId, type: "warranty", name: `Certificado_Garantia_${so.number}`, generatedAt: new Date().toISOString() }];
    await getStorage().update<ServiceOrder>(COLLECTION, orderId, { documents: so.documents, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_DOCUMENT_GENERATED, "entity", "service-orders", { id: orderId, documentId: docId, type: "warranty" }).catch(() => {});
    return docId;
  },

  async generateDeliveryReceipt(orderId: string): Promise<string> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const delivery = await this.getDelivery(orderId);
    const docId = `${so.id}-delivery-${Date.now()}`;
    so.documents = [...(so.documents ?? []), { id: uid(), documentId: docId, type: "receipt", name: `Recibo_Entrega_${so.number}`, generatedAt: new Date().toISOString() }];
    await getStorage().update<ServiceOrder>(COLLECTION, orderId, { documents: so.documents, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_DOCUMENT_GENERATED, "entity", "service-orders", { id: orderId, documentId: docId, type: "delivery" }).catch(() => {});
    return docId;
  },

  async generateTechnicalReport(orderId: string): Promise<string> {
    const so = await this.get(orderId);
    if (!so) throw new Error("Service order not found");
    const docId = `${so.id}-tech-report-${Date.now()}`;
    so.documents = [...(so.documents ?? []), { id: uid(), documentId: docId, type: "work_order", name: `Relatorio_Tecnico_${so.number}`, generatedAt: new Date().toISOString() }];
    await getStorage().update<ServiceOrder>(COLLECTION, orderId, { documents: so.documents, updatedAt: new Date().toISOString() });
    eventBus.publish(EVENT_NAMES.SERVICE_ORDER_DOCUMENT_GENERATED, "entity", "service-orders", { id: orderId, documentId: docId, type: "technical_report" }).catch(() => {});
    return docId;
  },
};
