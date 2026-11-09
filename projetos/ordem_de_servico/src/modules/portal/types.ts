export type ShareVisibility = "public" | "protected" | "private";
export type ShareStatus = "active" | "expired" | "revoked" | "exhausted";
export type ApprovalDecision = "pending" | "approved" | "rejected" | "revision" | "cancelled";
export type GuaranteeStatus = "active" | "expired" | "cancelled" | "inProgress" | "completed";

export interface PublicServiceOrder {
  id: string;
  serviceOrderId: string;
  publicCode: string;
  token: string;
  qrCode: string;
  companyId: string;
  companyName: string;
  brandConfig?: PortalBranding;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  equipmentInfo: string;
  reportedDefect: string;
  diagnosis?: string;
  status: string;
  statusLabel: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  estimatedCompletion?: string;
  services: PortalServiceItem[];
  parts: PortalPartItem[];
  totalValue: number;
  warrantyEnd?: string;
  timeline: PortalTimelineEvent[];
  documents: PortalDocumentRef[];
  canApprove: boolean;
  canSign: boolean;
  canUpload: boolean;
  visibleFields: string[];
}

export interface PortalServiceItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
}

export interface PortalPartItem {
  id: string;
  name: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
}

export interface PortalTimelineEvent {
  id: string;
  status: string;
  label: string;
  description: string;
  timestamp: string;
  responsible?: string;
  showResponsible: boolean;
  icon: string;
  color: string;
}

export interface PortalDocumentRef {
  id: string;
  documentId: string;
  name: string;
  type: string;
  format: string;
  size?: number;
  canDownload: boolean;
  createdAt: string;
}

export interface ShareLink {
  id: string;
  serviceOrderId: string;
  publicCode: string;
  token: string;
  url: string;
  qrCode: string;
  password?: string;
  visibility: ShareVisibility;
  status: ShareStatus;
  maxAccessCount?: number;
  currentAccessCount: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  revokedAt?: string;
  createdBy: string;
  companyId: string;
  accessLog: ShareAccessLog[];
}

export interface ShareAccessLog {
  id: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  device?: string;
  browser?: string;
  location?: string;
}

export interface PortalDownload {
  id: string;
  documentId: string;
  documentName: string;
  documentType: string;
  format: string;
  fileSize?: number;
  downloadedAt: string;
  ip: string;
  userAgent: string;
  token?: string;
  companyId?: string;
  userId?: string;
  publicCode?: string;
}

export interface PortalUpload {
  id: string;
  serviceOrderId: string;
  publicCode: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  ip: string;
  userAgent: string;
  description?: string;
  documentId?: string;
  token?: string;
  companyId?: string;
}

export interface PortalApproval {
  id: string;
  serviceOrderId: string;
  publicCode: string;
  type: "budget" | "additionalService" | "terms" | "signature" | "guarantee";
  decision: ApprovalDecision;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  ip: string;
  userAgent: string;
  device?: string;
  browser?: string;
  location?: string;
  comment?: string;
  requestedAt: string;
  respondedAt?: string;
  expiresAt?: string;
  token: string;
  companyId: string;
}

export interface PortalGuarantee {
  id: string;
  serviceOrderId: string;
  publicCode: string;
  customerName: string;
  equipmentInfo: string;
  serviceDescription: string;
  warrantyStart: string;
  warrantyEnd: string;
  status: GuaranteeStatus;
  remainingDays?: number;
  repairs: PortalGuaranteeRepair[];
  documents: PortalDocumentRef[];
  returnRequested: boolean;
  returnReason?: string;
  returnRequestedAt?: string;
  evidences: PortalEvidence[];
}

export interface PortalGuaranteeRepair {
  id: string;
  date: string;
  description: string;
  parts: string[];
  cost: number;
}

export interface PortalEvidence {
  id: string;
  type: "photo" | "video" | "document";
  url: string;
  uploadedAt: string;
  description?: string;
}

export interface PortalBranding {
  id: string;
  companyId: string;
  companyName: string;
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  theme: "light" | "dark" | "auto";
  footerText?: string;
  footerLinks: PortalFooterLink[];
  customDomain?: string;
  language: string;
  isActive: boolean;
  updatedAt: string;
}

export interface PortalFooterLink {
  id: string;
  label: string;
  url: string;
}

export interface PortalAnalytics {
  id: string;
  companyId: string;
  period: string;
  totalAccesses: number;
  uniqueVisitors: number;
  totalDownloads: number;
  totalUploads: number;
  totalApprovals: number;
  totalRejections: number;
  totalSignatures: number;
  averageTime: number;
  devices: Record<string, number>;
  browsers: Record<string, number>;
  origins: Record<string, number>;
  topDocuments: { documentId: string; documentName: string; count: number }[];
  qrCodeUsage: number;
  date: string;
}

export interface PortalAudit {
  id: string;
  action: "accessed" | "downloaded" | "uploaded" | "approved" | "rejected" | "signed" | "shared" | "linkGenerated" | "linkExpired" | "linkRevoked" | "guaranteeRequested" | "error" | "consulted";
  entityType: "serviceOrder" | "document" | "share" | "approval" | "guarantee" | "upload" | "portal" | "branding";
  entityId: string;
  description: string;
  ip: string;
  userAgent: string;
  token?: string;
  publicCode?: string;
  companyId?: string;
  userId?: string;
  timestamp: string;
  duration?: number;
  success: boolean;
}

export const PORTAL_CONSTANTS = {
  SHARE_VISIBILITY: ["public", "protected", "private"] as ShareVisibility[],
  SHARE_STATUS: ["active", "expired", "revoked", "exhausted"] as ShareStatus[],
  APPROVAL_TYPES: ["budget", "additionalService", "terms", "signature", "guarantee"],
  APPROVAL_DECISIONS: ["pending", "approved", "rejected", "revision", "cancelled"] as ApprovalDecision[],
  GUARANTEE_STATUS: ["active", "expired", "cancelled", "inProgress", "completed"] as GuaranteeStatus[],
  AUDIT_ACTIONS: ["accessed", "downloaded", "uploaded", "approved", "rejected", "signed", "shared", "linkGenerated", "linkExpired", "linkRevoked", "guaranteeRequested", "error", "consulted"],
  AUDIT_ENTITY_TYPES: ["serviceOrder", "document", "share", "approval", "guarantee", "upload", "portal", "branding"],
  TIMELINE_STATUS: ["received", "diagnosis", "awaitingApproval", "approved", "execution", "testing", "completed", "readyForPickup", "delivered", "returned", "warranty"],
  TIMELINE_LABELS: {
    received: "Recebimento",
    diagnosis: "Diagnóstico",
    awaitingApproval: "Aguardando Aprovação",
    approved: "Aprovada",
    execution: "Execução",
    testing: "Teste",
    completed: "Finalizada",
    readyForPickup: "Pronta para Retirada",
    delivered: "Entregue",
    returned: "Retorno",
    warranty: "Garantia",
  } as Record<string, string>,
  TIMELINE_COLORS: {
    received: "#3B82F6", diagnosis: "#F59E0B", awaitingApproval: "#8B5CF6",
    approved: "#10B981", execution: "#0EA5E9", testing: "#F97316",
    completed: "#22C55E", readyForPickup: "#6366F1", delivered: "#14B8A6",
    returned: "#EF4444", warranty: "#EC4899",
  } as Record<string, string>,
  TIMELINE_ICONS: {
    received: "Package", diagnosis: "Search", awaitingApproval: "Clock",
    approved: "CheckCircle2", execution: "Wrench", testing: "FlaskConical",
    completed: "CheckCircle", readyForPickup: "ShoppingBag", delivered: "Truck",
    returned: "Undo2", warranty: "ShieldCheck",
  } as Record<string, string>,
};


