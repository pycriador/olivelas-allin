export interface SONumberingConfig {
  id: string;
  companyId?: string;
  prefix: string;
  suffix: string;
  digits: number;
  resetYearly: boolean;
  resetMonthly: boolean;
  currentSequence: number;
  lastReset?: string;
}

export interface SOStatus {
  id: string;
  name: string;
  color: string;
  order: number;
  isDefault: boolean;
  isFinal: boolean;
  companyId?: string;
}

export interface SOComment {
  id: string;
  author: string;
  authorId: string;
  companyId?: string;
  text: string;
  attachments?: SOAttachment[];
  mentions?: string[];
  editedAt?: string;
  createdAt: string;
}

export interface SOAttachment {
  id: string;
  name: string;
  type: "photo" | "pdf" | "video" | "audio" | "document";
  fileUrl?: string;
  size?: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface SOTimelineEntry {
  id: string;
  type: "created" | "updated" | "status_changed" | "assigned" | "comment" | "attachment" | "document_generated" | "message_sent" | "customer_changed" | "device_changed" | "technician_changed" | "diagnostic_created" | "diagnostic_updated" | "checklist_completed" | "execution_started" | "execution_paused" | "execution_resumed" | "execution_completed" | "service_added" | "part_added" | "warranty_created" | "return_created" | "photo_added" | "reopened" | "delivered" | "cancelled" | "return_delivered" | "budget_created" | "budget_sent" | "budget_viewed" | "budget_approved" | "budget_rejected" | "budget_expired" | "payment_added" | "payment_confirmed" | "payment_cancelled" | "receipt_generated" | "delivery_completed" | "signature_collected" | "closed";
  description: string;
  userId?: string;
  userName?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface SODocumentRef {
  id: string;
  documentId: string;
  type: "receipt" | "work_order" | "warranty" | "budget" | "proof";
  name: string;
  generatedAt: string;
}

export interface SOCommunicationRef {
  id: string;
  messageId: string;
  channel: string;
  to: string;
  subject: string;
  sentAt: string;
}

export interface SOServiceItem {
  id: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
}

export interface SOPartItem {
  id: string;
  partId: string;
  partName: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
}

export interface ServiceOrder {
  id: string;
  number: string;
  equipmentSerial?: string;
  customerPhone?: string;
  customerDocument?: string;
  companyName?: string;
  brand?: string;
  model?: string;
  companyId?: string;
  customerId: string;
  customerName: string;
  deviceId?: string;
  deviceInfo?: string;
  technicianId?: string;
  technicianName?: string;
  categoryId?: string;
  defectId?: string;
  defectName?: string;
  description: string;
  diagnosis?: string;
  notes?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: string;
  statusLabel: string;
  warrantyId?: string;
  entryDate: string;
  deadline?: string;
  deliveryDate?: string;
  estimatedValue?: number;
  finalValue?: number;
  services?: SOServiceItem[];
  parts?: SOPartItem[];
  timeline: SOTimelineEntry[];
  comments: SOComment[];
  attachments: SOAttachment[];
  documents: SODocumentRef[];
  communications: SOCommunicationRef[];
  tags?: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface SODashboardStats {
  open: number;
  diagnosis: number;
  awaitingApproval: number;
  awaitingParts: number;
  ready: number;
  delivered: number;
  cancelled: number;
  avgTime: number;
  avgDiagnosisTime: number;
  avgExecutionTime: number;
  technicianAssigned: number;
  inExecution: number;
  completedToday: number;
  returns: number;
  pendingIssues: number;
}

/* ───── Diagnostic ───── */

export interface DiagnosticRevision {
  id: string;
  version: number;
  reportedDefect: string;
  foundDefect: string;
  cause: string;
  proposedSolution: string;
  complexity: "low" | "medium" | "high";
  risk: "low" | "medium" | "high";
  notes: string;
  estimatedValue: number;
  estimatedTime: number;
  photos?: string[];
  files?: string[];
  technicianSignature?: string;
  technicianId?: string;
  technicianName?: string;
  createdAt: string;
  createdBy?: string;
}

export interface SODiagnostic {
  id: string;
  serviceOrderId: string;
  companyId?: string;
  currentVersion: number;
  revisions: DiagnosticRevision[];
  createdAt: string;
  updatedAt: string;
}

/* ───── Checklist ───── */

export interface SOChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  checkedAt?: string;
  checkedBy?: string;
  notes?: string;
}

export interface SOChecklistTemplate {
  id: string;
  name: string;
  description: string;
  items: string[];
  companyId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SOChecklist {
  id: string;
  serviceOrderId: string;
  companyId?: string;
  templateId?: string;
  templateName: string;
  items: SOChecklistItem[];
  completedAt?: string;
  completedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/* ───── Execution Activity ───── */

export interface SOExecutionComment {
  id: string;
  text: string;
  author: string;
  authorId: string;
  createdAt: string;
}

export interface SOExecutionActivity {
  id: string;
  serviceOrderId: string;
  companyId?: string;
  name: string;
  description: string;
  responsibleId?: string;
  responsibleName?: string;
  date: string;
  time: string;
  timeSpent: number;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  notes: string;
  attachments: string[];
  photos: string[];
  comments: SOExecutionComment[];
  createdAt: string;
  updatedAt: string;
}

/* ───── Time Tracking ───── */

export interface SOTimeTracking {
  id: string;
  serviceOrderId: string;
  companyId?: string;
  activityId?: string;
  startTime: string;
  pauseTime?: string;
  resumeTime?: string;
  completionTime?: string;
  totalTime?: number;
  productiveTime?: number;
  stoppedTime?: number;
  awaitingPartsTime?: number;
  technicianId?: string;
  technicianName?: string;
  createdAt: string;
  updatedAt: string;
}

/* ───── Photo ───── */

export interface SOPhoto {
  id: string;
  serviceOrderId: string;
  companyId?: string;
  returnId?: string;
  category: "entry" | "diagnosis" | "execution" | "exit" | "return" | "warranty";
  fileUrl: string;
  thumbnailUrl?: string;
  caption: string;
  order: number;
  favorite: boolean;
  uploadedBy: string;
  uploadedAt: string;
}

/* ───── Return ───── */

export interface SOReturn {
  id: string;
  serviceOrderId: string;
  companyId?: string;
  number: string;
  date: string;
  reason: string;
  reportedDefect: string;
  diagnosis: string;
  solution: string;
  warrantyApplied: boolean;
  charged: boolean;
  responsibleId?: string;
  responsibleName?: string;
  deliveryDate?: string;
  photos: string[];
  documents: string[];
  timeline: SOTimelineEntry[];
  comments: SOComment[];
  createdAt: string;
  updatedAt: string;
}

/* ───── Warranty ───── */

export interface SOWarranty {
  id: string;
  serviceOrderId: string;
  companyId?: string;
  serviceItemId?: string;
  returnId?: string;
  type: "service" | "part" | "labor" | "full";
  days: number;
  startDate: string;
  endDate: string;
  coverage: string;
  notes: string;
  status: "active" | "expired" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

/* ───── Technician Dashboard ───── */

export interface TechnicianDashboardStats {
  assigned: number;
  inExecution: number;
  awaitingParts: number;
  completedToday: number;
  avgTime: number;
  returns: number;
  pendingIssues: number;
  schedule: Array<{ date: string; count: number }>;
}

/* ───── Budget ───── */

export interface SOBudgetItem {
  id: string;
  type: "service" | "part";
  itemId?: string;
  description: string;
  quantity: number;
  unitValue: number;
  discount: number;
  discountType: "percent" | "fixed";
  markup: number;
  markupType: "percent" | "fixed";
  totalValue: number;
  warrantyDays?: number;
  responsible?: string;
  notes?: string;
}

export interface SOBudget {
  id: string;
  serviceOrderId: string;
  companyId?: string;
  version: number;
  items: SOBudgetItem[];
  discountTotal: number;
  discountType: "percent" | "fixed";
  discountReason?: string;
  discountAuthorizedBy?: string;
  markupTotal: number;
  taxes: number;
  shipping: number;
  subtotal: number;
  finalValue: number;
  validityDays: number;
  deadline: string;
  warrantyDescription: string;
  notes: string;
  status: "pending" | "sent" | "viewed" | "approved" | "rejected" | "expired" | "cancelled";
  approvalDate?: string;
  approvalUser?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

/* ───── Approval ───── */

export interface SOApproval {
  id: string;
  serviceOrderId: string;
  budgetId?: string;
  companyId?: string;
  status: "pending" | "sent" | "viewed" | "approved" | "rejected" | "expired" | "cancelled";
  sentAt?: string;
  viewedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  origin: "whatsapp" | "email" | "sms" | "portal" | "in-person";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/* ───── Payment ───── */

export interface SOPaymentInstallment {
  id: string;
  number: number;
  value: number;
  dueDate: string;
  paidAt?: string;
  status: "pending" | "paid" | "overdue";
}

export interface SOPayment {
  id: string;
  serviceOrderId: string;
  companyId?: string;
  method: "pix" | "cash" | "credit" | "debit" | "transfer" | "boleto" | "check" | "voucher" | "other";
  methodLabel: string;
  value: number;
  installments: number;
  installmentDetail?: SOPaymentInstallment[];
  date: string;
  time: string;
  notes?: string;
  responsible?: string;
  status: "pending" | "confirmed" | "cancelled";
  documentId?: string;
  receiptUrl?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/* ───── Delivery ───── */

export interface SODeliveryChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  checkedAt?: string;
}

export interface SODelivery {
  id: string;
  serviceOrderId: string;
  companyId?: string;
  responsable: string;
  date: string;
  time: string;
  exitPhotos: string[];
  signatureId?: string;
  documentsDelivered: string[];
  warrantyDelivered: boolean;
  paymentConfirmed: boolean;
  checklist: SODeliveryChecklistItem[];
  notes?: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}

/* ───── Signature ───── */

export interface SOSignature {
  id: string;
  serviceOrderId: string;
  companyId?: string;
  deliveryId?: string;
  type: "customer" | "technician" | "responsible" | "company";
  signatoryName: string;
  signatoryId?: string;
  signatureData: string;
  collectedAt: string;
  ipAddress?: string;
  createdAt: string;
}

/* ───── Receipt ───── */

export interface SOReceipt {
  id: string;
  serviceOrderId: string;
  companyId?: string;
  type: "entry" | "payment" | "withdrawal" | "proof" | "warranty";
  documentId?: string;
  number: string;
  generatedAt: string;
  generatedBy?: string;
  createdAt: string;
}

/* ───── Financial History ───── */

export interface SOFinancialHistoryEntry {
  id: string;
  serviceOrderId: string;
  companyId?: string;
  type: "budget_created" | "budget_approved" | "budget_rejected" | "payment_added" | "payment_confirmed" | "payment_cancelled" | "receipt_generated" | "delivery_completed" | "closed";
  description: string;
  value?: number;
  previousBalance?: number;
  newBalance?: number;
  userId?: string;
  userName?: string;
  createdAt: string;
}

/* ───── Portal Access ───── */

export interface SOPortalAccess {
  id: string;
  serviceOrderId: string;
  companyId?: string;
  publicCode: string;
  hash: string;
  qrData: string;
  publicUrl: string;
  status: string;
  statusLabel: string;
  timeline: SOTimelineEntry[];
  documents: string[];
  warranty: string;
  createdAt: string;
  updatedAt: string;
}

/* ───── Tests ───── */

export interface SOTest {
  id: string;
  serviceOrderId: string;
  companyId?: string;
  type: "visual" | "functional" | "stress" | "burn_in" | "connectivity" | "battery" | "screen" | "audio" | "camera" | "sensor" | "water_resistance" | "safety" | "performance" | "compatibility" | "other";
  typeLabel: string;
  result: "pending" | "passed" | "failed" | "inconclusive";
  notes: string;
  checklist: SOChecklistItem[];
  photos: string[];
  videos: string[];
  responsibleId?: string;
  responsibleName?: string;
  createdAt: string;
  updatedAt: string;
}

/* ───── Quality Control ───── */

export interface SOQualityControl {
  id: string;
  serviceOrderId: string;
  companyId?: string;
  result: "approved" | "rejected";
  observations: string;
  responsibleId?: string;
  responsibleName?: string;
  digitalSignature?: string;
  createdAt: string;
  updatedAt: string;
}

/* ───── Costs ───── */

export interface SOCosts {
  id: string;
  serviceOrderId: string;
  companyId?: string;
  partsCost: number;
  laborCost: number;
  additionalCosts: number;
  thirdPartyCosts: number;
  shippingCost: number;
  discount: number;
  totalCost: number;
  estimatedProfit: number;
  realizedProfit: number;
  margin: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/* ───── Analytics ───── */

export interface SOAnalytics {
  serviceOrderId: string;
  avgDiagnosisTime: number;
  avgExecutionTime: number;
  technicianAvgTimes: Array<{ technicianName: string; avgTime: number }>;
  recurrentEquipment: Array<{ deviceInfo: string; count: number }>;
  commonDefects: Array<{ defect: string; count: number }>;
  mostUsedParts: Array<{ partName: string; count: number }>;
  topReturnBrands: Array<{ brand: string; returnCount: number }>;
  warrantiesTriggered: number;
  returnsByPeriod: Array<{ period: string; count: number }>;
  avgApprovalTime: number;
}

/* ───── Enhanced Dashboard Stats ───── */

export interface EnhancedDashboardStats extends SODashboardStats {
  pendingBudgets: number;
  pendingApprovals: number;
  readyForPickup: number;
  awaitingPickup: number;
  totalValue: number;
  totalReceived: number;
  avgApprovalTime: number;
  avgPickupTime: number;
}
