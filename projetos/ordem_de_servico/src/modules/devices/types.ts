export interface DeviceAddress {
  id: string;
  label: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export interface DeviceCustomField {
  id: string;
  label: string;
  value: string;
}

export interface DeviceTimelineEntry {
  id: string;
  type: "created" | "updated" | "comment" | "maintenance" | "status";
  description: string;
  userId?: string;
  userName?: string;
  createdAt: string;
}

export interface DeviceComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface DeviceAttachment {
  id: string;
  name: string;
  type: string;
  size?: number;
  url?: string;
  uploadedAt: string;
}

export interface DeviceChecklist {
  id: string;
  typeId: string;
  items: ChecklistItem[];
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  value: boolean;
  notes?: string;
}

export interface DevicePhoto {
  id: string;
  deviceId: string;
  category: "front" | "back" | "sides" | "label" | "serial" | "defect" | "accessories" | "general";
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface DeviceAccessory {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
}

export interface DeviceDocument {
  id: string;
  name: string;
  type: "invoice" | "warranty" | "report" | "photo" | "receipt" | "other";
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface DeviceTransfer {
  id: string;
  fromCustomerId: string;
  fromCustomerName: string;
  toCustomerId: string;
  toCustomerName: string;
  transferredAt: string;
  transferredBy: string;
  notes?: string;
}

export interface DeviceStats {
  total: number;
  active: number;
  inMaintenance: number;
  delivered: number;
  byCompany: Record<string, number>;
  byCategory: Record<string, number>;
  topBrands: { name: string; count: number }[];
  topModels: { name: string; count: number }[];
  withWarranty: number;
  withReturn: number;
  avgRepairTime: number;
  reincidentDevices: number;
}

export interface Device {
  id: string;
  customerId: string;
  tags?: string[];
  type?: string;
  categoryId?: string;
  manufacturerId?: string;
  brandId?: string;
  modelId?: string;
  serialNumber?: string;
  imei?: string;
  assetNumber?: string;
  color?: string;
  voltage?: string;
  password?: string;
  condition?: string;
  purchaseDate?: string;
  warrantyId?: string;
  notes?: string;
  companyId?: string;
  invoiceNumber?: string;
  manufacturerWarranty?: string;
  equipmentTypeId?: string;
  favorite?: boolean;
  files?: DeviceAttachment[];
  customFields?: DeviceCustomField[];
  timeline?: DeviceTimelineEntry[];
  checklist?: DeviceChecklist;
  photos?: DevicePhoto[];
  accessories?: DeviceAccessory[];
  deviceDocuments?: DeviceDocument[];
  transfers?: DeviceTransfer[];
  status: "active" | "inactive" | "in_maintenance" | "deactivated";
  createdAt?: string;
  updatedAt?: string;
}
