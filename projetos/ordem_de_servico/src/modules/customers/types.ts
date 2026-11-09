export interface CustomerAddress {
  id: string;
  label: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  addressType: "residential" | "commercial" | "delivery" | "billing" | "other";
}

export interface CustomerContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  position?: string;
  isDefault: boolean;
  whatsapp?: string;
  cellphone?: string;
  notes?: string;
}

export interface CustomerDocument {
  id: string;
  name: string;
  type: string;
  fileUrl?: string;
  uploadedAt: string;
}

export interface CustomerCustomField {
  id: string;
  label: string;
  value: string;
}

export interface CustomerTimelineEntry {
  id: string;
  type: "created" | "updated" | "comment" | "status" | "merge" | "link" | "import" | "export" | "upload" | "download" | "shared" | "service_order" | "warranty" | "communication" | "document" | "equipment";
  description: string;
  userId?: string;
  userName?: string;
  createdAt: string;
}

export interface CustomerComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface CustomerObservation {
  id: string;
  date: string;
  userId: string;
  userName: string;
  text: string;
  category: string;
  visibility: "public" | "private";
}

export interface CustomerAttachment {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileSize?: number;
  uploadedAt: string;
  uploadedBy: string;
  uploadedByName: string;
}

export interface CustomerWarranty {
  id: string;
  equipmentId?: string;
  equipmentName?: string;
  serviceOrderId?: string;
  warrantyType: string;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled";
  description?: string;
}

export interface CustomerEquipment {
  id: string;
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
  status: string;
  warranty?: string;
  lastServiceOrder?: string;
  repairCount: number;
}

export interface CustomerServiceOrder {
  id: string;
  number: string;
  date: string;
  status: string;
  equipment: string;
  value: number;
  warranty?: string;
  technician?: string;
  companyId?: string;
}

export interface CustomerCommunication {
  id: string;
  channel: "email" | "whatsapp" | "sms" | "telegram" | "notification";
  subject: string;
  content: string;
  sentAt: string;
  sentBy: string;
  sentByName: string;
  status: "sent" | "failed" | "read";
}

export interface CustomerRelationship {
  id: string;
  relatedCustomerId: string;
  relatedCustomerName: string;
  type: "family" | "business" | "reference" | "other";
  description?: string;
}

export interface CustomerVersion {
  id: string;
  version: number;
  data: Record<string, unknown>;
  changedBy: string;
  changedByName: string;
  changedAt: string;
}

export interface CustomerDuplicity {
  id: string;
  customerId: string;
  duplicateCustomerId: string;
  score: number;
  matchedFields: string[];
  status: "pending" | "resolved" | "ignored";
  createdAt: string;
  resolvedAt?: string;
}

export interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
  errorsList: string[];
}

export interface Customer {
  id: string;
  name: string;
  type: "individual" | "legal";
  cpf?: string;
  cnpj?: string;
  rg?: string;
  stateRegistration?: string;
  birthDate?: string;
  phone?: string;
  cellphone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  notes?: string;
  status: "active" | "inactive" | "blocked";
  tags?: string[];
  classification?: string;
  primaryCompanyId?: string;
  linkedCompanyIds?: string[];
  addresses?: CustomerAddress[];
  contacts?: CustomerContact[];
  documents?: CustomerDocument[];
  photo?: string;
  customFields?: CustomerCustomField[];
  timeline?: CustomerTimelineEntry[];
  comments?: CustomerComment[];
  history?: CustomerTimelineEntry[];
  versions?: CustomerVersion[];
  observations?: CustomerObservation[];
  attachments?: CustomerAttachment[];
  warranties?: CustomerWarranty[];
  equipments?: CustomerEquipment[];
  serviceOrders?: CustomerServiceOrder[];
  communications?: CustomerCommunication[];
  relationships?: CustomerRelationship[];
  favorite?: boolean;
  fantasyName?: string;
  companyName?: string;
  municipalRegistration?: string;
  profession?: string;
  secondaryEmail?: string;
  origin?: string;
  responsibleUserId?: string;
  responsibleUserName?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  deletedBy?: string;
}
