import { getStorage } from "@/core/providers/storage";
import { eventBus, EVENT_NAMES } from "@/modules/events/service";
import type {
  PublicServiceOrder, ShareLink, PortalDownload, PortalUpload, PortalApproval,
  PortalGuarantee, PortalBranding, PortalAnalytics, PortalAudit,
} from "./types";

const SO_COL = "por_service_orders";
const SHARE_COL = "por_shares";
const DOWNLOAD_COL = "por_downloads";
const UPLOAD_COL = "por_uploads";
const APPROVAL_COL = "por_approvals";
const GUARANTEE_COL = "por_guarantees";
const BRANDING_COL = "por_branding";
const ANALYTICS_COL = "por_analytics";
const AUDIT_COL = "por_audits";

function uid(): string { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; }
function now(): string { return new Date().toISOString(); }

function makeService<T extends { id: string }>(collection: string, eventNames?: { created?: string; updated?: string; deleted?: string }) {
  return {
    async list(): Promise<T[]> { return getStorage().findAll<T>(collection); },
    async get(id: string): Promise<T | null> { return getStorage().find<T>(collection, id); },
    async create(data: Omit<T, "id">): Promise<T> { const c = await getStorage().create<T>(collection, data); if (eventNames?.created) eventBus.publish(eventNames.created, "system", "portal", { id: c.id }).catch(() => {}); return c; },
    async update(id: string, patch: Partial<T>): Promise<T> { const u = await getStorage().update<T>(collection, id, patch); if (eventNames?.updated) eventBus.publish(eventNames.updated, "system", "portal", { id, ...patch }).catch(() => {}); return u; },
    async remove(id: string): Promise<void> { await getStorage().delete(collection, id); if (eventNames?.deleted) eventBus.publish(eventNames.deleted, "system", "portal", { id }).catch(() => {}); },
    async count(): Promise<number> { return getStorage().count(collection); },
  };
}

export const publicServiceOrderService = makeService<PublicServiceOrder>(SO_COL);
export const shareService = makeService<ShareLink>(SHARE_COL, {
  created: "portal.link.generated",
  updated: "portal.link.updated",
  deleted: "portal.link.deleted",
});
export const downloadService = makeService<PortalDownload>(DOWNLOAD_COL);
export const uploadService = makeService<PortalUpload>(UPLOAD_COL);
export const approvalService = makeService<PortalApproval>(APPROVAL_COL);
export const guaranteeService = makeService<PortalGuarantee>(GUARANTEE_COL);
export const brandingService = makeService<PortalBranding>(BRANDING_COL);
export const analyticsService = makeService<PortalAnalytics>(ANALYTICS_COL);
export const portalAuditService = makeService<PortalAudit>(AUDIT_COL);

export const portalService = {
  async findByPublicCode(code: string): Promise<PublicServiceOrder | null> {
    const all = await getStorage().findAll<PublicServiceOrder>(SO_COL);
    return all.find(o => o.publicCode === code) ?? null;
  },

  async findByToken(token: string): Promise<PublicServiceOrder | null> {
    const all = await getStorage().findAll<PublicServiceOrder>(SO_COL);
    return all.find(o => o.token === token) ?? null;
  },

  async findByServiceOrderId(sid: string): Promise<PublicServiceOrder | null> {
    const all = await getStorage().findAll<PublicServiceOrder>(SO_COL);
    return all.find(o => o.serviceOrderId === sid) ?? null;
  },

  async findByCompany(companyId: string): Promise<PublicServiceOrder[]> {
    const all = await getStorage().findAll<PublicServiceOrder>(SO_COL);
    return all.filter(o => o.companyId === companyId);
  },

  async recordAccess(publicCode: string, ip: string, userAgent: string): Promise<void> {
    const so = await this.findByPublicCode(publicCode);
    if (!so) return;
    eventBus.publish("portal.accessed", "system", "portal", { publicCode, ip, userAgent }).catch(() => {});
  },

  async generateShareLink(serviceOrderId: string, options: { maxAccessCount?: number; expiresInHours?: number; password?: string; visibility?: string }): Promise<ShareLink | null> {
    const so = await this.findByServiceOrderId(serviceOrderId);
    if (!so) return null;
    const token = uid();
    const link: Omit<ShareLink, "id"> = {
      serviceOrderId, publicCode: so.publicCode, token,
      url: `/portal/shared/${token}`,
      qrCode: `qr-${token}`,
      password: options.password,
      visibility: (options.visibility as any) ?? "public",
      status: "active",
      maxAccessCount: options.maxAccessCount,
      currentAccessCount: 0,
      expiresAt: options.expiresInHours ? new Date(Date.now() + options.expiresInHours * 3600000).toISOString() : undefined,
      createdAt: now(), updatedAt: now(),
      createdBy: "system", companyId: so.companyId,
      accessLog: [],
    };
    return shareService.create(link);
  },
};

export const publicPortalUtils = {
  generatePublicCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  },

  generateToken(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 16)}`;
  },
};
