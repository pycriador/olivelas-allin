import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type {
  Device, DevicePhoto, DeviceDocument, DeviceTransfer, DeviceStats, DeviceTimelineEntry,
} from "./types";

const COLLECTION = "devices";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const deviceService = {
  async list(): Promise<Device[]> { return getStorage().findAll<Device>(COLLECTION); },
  async get(id: string): Promise<Device | null> { return getStorage().find<Device>(COLLECTION, id); },
  async getByCustomer(customerId: string): Promise<Device[]> {
    const all = await this.list();
    return all.filter((d) => d.customerId === customerId);
  },
  async create(data: Omit<Device, "id">): Promise<Device> {
    const created = await getStorage().create<Device>(COLLECTION, data);
    eventBus.publish(EVENT_NAMES.DEVICE_CREATED, "entity", "devices", { id: created.id, customerId: created.customerId, modelId: created.modelId }).catch(() => {});
    return created;
  },
  async update(id: string, patch: Partial<Device>): Promise<Device> {
    const updated = await getStorage().update<Device>(COLLECTION, id, patch);
    eventBus.publish(EVENT_NAMES.DEVICE_UPDATED, "entity", "devices", { id, ...patch }).catch(() => {});
    return updated;
  },
  async remove(id: string): Promise<void> {
    await getStorage().delete(COLLECTION, id);
    eventBus.publish(EVENT_NAMES.DEVICE_DELETED, "entity", "devices", { id }).catch(() => {});
  },
  async search(query: string): Promise<Device[]> {
    const all = await this.list();
    const q = query.toLowerCase();
    return all.filter((d) =>
      (d.serialNumber && d.serialNumber.toLowerCase().includes(q)) ||
      (d.assetNumber && d.assetNumber.toLowerCase().includes(q)) ||
      (d.customerId && d.customerId.toLowerCase().includes(q)) ||
      (d.brandId && d.brandId.toLowerCase().includes(q)) ||
      (d.modelId && d.modelId.toLowerCase().includes(q)) ||
      (d.type && d.type.toLowerCase().includes(q)) ||
      (d.companyId && d.companyId.toLowerCase().includes(q)) ||
      (d.imei && d.imei.toLowerCase().includes(q))
    );
  },
  async getStats(): Promise<DeviceStats> {
    const all = await this.list();
    const stats: DeviceStats = {
      total: all.length,
      active: all.filter((d) => d.status === "active").length,
      inMaintenance: all.filter((d) => d.status === "in_maintenance").length,
      delivered: all.filter((d) => d.status === "active").length,
      byCompany: {},
      byCategory: {},
      topBrands: [],
      topModels: [],
      withWarranty: all.filter((d) => d.warrantyId).length,
      withReturn: 0,
      avgRepairTime: 0,
      reincidentDevices: 0,
    };
    all.forEach((d) => {
      if (d.companyId) stats.byCompany[d.companyId] = (stats.byCompany[d.companyId] ?? 0) + 1;
      if (d.categoryId) stats.byCategory[d.categoryId] = (stats.byCategory[d.categoryId] ?? 0) + 1;
    });
    return stats;
  },
  async transferOwner(deviceId: string, toCustomerId: string, toCustomerName: string, transferredBy: string, notes?: string): Promise<Device> {
    const device = await this.get(deviceId);
    if (!device) throw new Error("Device not found");
    const transfer: DeviceTransfer = {
      id: uid(),
      fromCustomerId: device.customerId,
      fromCustomerName: "",
      toCustomerId,
      toCustomerName,
      transferredAt: new Date().toISOString(),
      transferredBy,
      notes,
    };
    const transfers = device.transfers ?? [];
    transfers.push(transfer);
    const timeline = device.timeline ?? [];
    timeline.push({
      id: uid(),
      type: "status",
      description: `Dispositivo transferido para ${toCustomerName}`,
      userName: transferredBy,
      createdAt: new Date().toISOString(),
    });
    const updated = await getStorage().update<Device>(COLLECTION, deviceId, {
      customerId: toCustomerId,
      transfers,
      timeline,
    });
    eventBus.publish(EVENT_NAMES.ASSET_TRANSFERRED, "entity", "devices", {
      deviceId, fromCustomerId: device.customerId, toCustomerId, transferredBy, notes,
    }).catch(() => {});
    return updated;
  },
  async addTimeline(deviceId: string, entry: Omit<DeviceTimelineEntry, "id" | "createdAt">): Promise<Device> {
    const device = await this.get(deviceId);
    if (!device) throw new Error("Device not found");
    const timelineEntry = { ...entry, id: uid(), createdAt: new Date().toISOString() };
    const timeline = device.timeline ?? [];
    timeline.push(timelineEntry);
    return getStorage().update<Device>(COLLECTION, deviceId, { timeline });
  },
  async addPhoto(deviceId: string, photo: Omit<DevicePhoto, "id">): Promise<Device> {
    const device = await this.get(deviceId);
    if (!device) throw new Error("Device not found");
    const newPhoto: DevicePhoto = { ...photo, id: uid() };
    const photos = device.photos ?? [];
    photos.push(newPhoto);
    const updated = await getStorage().update<Device>(COLLECTION, deviceId, { photos });
    eventBus.publish(EVENT_NAMES.ASSET_PHOTO_UPLOADED, "entity", "devices", { deviceId, photoId: newPhoto.id, category: photo.category }).catch(() => {});
    return updated;
  },
  async removePhoto(deviceId: string, photoId: string): Promise<Device> {
    const device = await this.get(deviceId);
    if (!device) throw new Error("Device not found");
    const photos = (device.photos ?? []).filter((p) => p.id !== photoId);
    return getStorage().update<Device>(COLLECTION, deviceId, { photos });
  },
  async addDocument(deviceId: string, doc: Omit<DeviceDocument, "id">): Promise<Device> {
    const device = await this.get(deviceId);
    if (!device) throw new Error("Device not found");
    const newDoc: DeviceDocument = { ...doc, id: uid() };
    const deviceDocuments = device.deviceDocuments ?? [];
    deviceDocuments.push(newDoc);
    const updated = await getStorage().update<Device>(COLLECTION, deviceId, { deviceDocuments });
    eventBus.publish(EVENT_NAMES.ASSET_DOCUMENT_ATTACHED, "entity", "devices", { deviceId, documentId: newDoc.id, type: doc.type }).catch(() => {});
    return updated;
  },
  async removeDocument(deviceId: string, docId: string): Promise<Device> {
    const device = await this.get(deviceId);
    if (!device) throw new Error("Device not found");
    const deviceDocuments = (device.deviceDocuments ?? []).filter((d) => d.id !== docId);
    return getStorage().update<Device>(COLLECTION, deviceId, { deviceDocuments });
  },
  async importDevices(data: Omit<Device, "id">[]): Promise<{ total: number; imported: number; errors: number; errorsList: string[] }> {
    const errorsList: string[] = [];
    let imported = 0;
    const existing = await this.list();
    for (const item of data) {
      try {
        const duplicate = existing.find(
          (d) => d.serialNumber && item.serialNumber && d.serialNumber === item.serialNumber,
        );
        if (duplicate) {
          errorsList.push(`Duplicate serialNumber: ${item.serialNumber}`);
          continue;
        }
        await this.create(item);
        imported++;
      } catch (err: any) {
        errorsList.push(err.message ?? "Unknown error");
      }
    }
    return { total: data.length, imported, errors: data.length - imported, errorsList };
  },
  async exportDevices(ids?: string[]): Promise<Device[]> {
    const all = await this.list();
    if (!ids || ids.length === 0) return all;
    return all.filter((d) => ids.includes(d.id));
  },
};
