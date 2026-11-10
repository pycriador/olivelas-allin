export const APP_VERSION = "1.0.0-RC1";
export const APP_NAME = "Olivelas - Ordens de Serviço & Assistência";

export interface ModuleDefinition {
  id: string;
  name: string;
  icon: string;
  path: string;
  category: "platform" | "business" | "admin";
}

export const MODULES: ModuleDefinition[] = [
  { id: "core", name: "modules.core", icon: "Layers", path: "/modules/core", category: "platform" },
  { id: "metadata", name: "modules.metadata", icon: "Database", path: "/modules/metadata", category: "platform" },
  { id: "documents", name: "modules.documents", icon: "FileText", path: "/modules/documents", category: "business" },
  { id: "communication", name: "modules.communication", icon: "MessageSquare", path: "/modules/communication", category: "business" },
  { id: "records", name: "modules.records", icon: "Users", path: "/modules/records", category: "business" },
  { id: "customers", name: "modules.customers", icon: "UserCircle", path: "/modules/customers", category: "business" },
  { id: "assets", name: "modules.assetManagement", icon: "Package", path: "/modules/assets", category: "business" },
  { id: "devices", name: "modules.devices", icon: "Smartphone", path: "/modules/devices", category: "business" },
  { id: "technicians", name: "modules.technicians", icon: "Wrench", path: "/modules/technicians", category: "business" },
  { id: "manufacturers", name: "modules.manufacturers", icon: "Factory", path: "/modules/manufacturers", category: "business" },
  { id: "brands", name: "modules.brands", icon: "Trademark", path: "/modules/brands", category: "business" },
  { id: "models", name: "modules.models", icon: "Cpu", path: "/modules/models", category: "business" },
  { id: "categories", name: "modules.categories", icon: "Tags", path: "/modules/categories", category: "business" },
  { id: "defects", name: "modules.defects", icon: "Bug", path: "/modules/defects", category: "business" },
  { id: "services", name: "modules.services", icon: "ConciergeBell", path: "/modules/services", category: "business" },
  { id: "parts", name: "modules.parts", icon: "Puzzle", path: "/modules/parts", category: "business" },
  { id: "suppliers", name: "modules.suppliers", icon: "Truck", path: "/modules/suppliers", category: "business" },
  { id: "payment-methods", name: "modules.paymentMethods", icon: "CreditCard", path: "/modules/payment-methods", category: "business" },
  { id: "payment-terms", name: "modules.paymentTerms", icon: "CalendarRange", path: "/modules/payment-terms", category: "business" },
  { id: "warranties", name: "modules.warranties", icon: "ShieldCheck", path: "/modules/warranties", category: "business" },
  { id: "measurement-units", name: "modules.measurementUnits", icon: "Ruler", path: "/modules/measurement-units", category: "business" },
  { id: "service-orders", name: "modules.serviceOrders", icon: "Wrench", path: "/modules/service-orders", category: "business" },
  { id: "financial", name: "modules.financial", icon: "DollarSign", path: "/modules/financial", category: "business" },
  { id: "inventory", name: "modules.inventory", icon: "Package", path: "/modules/inventory", category: "business" },
  { id: "purchasing", name: "modules.purchasing", icon: "ShoppingCart", path: "/modules/purchasing", category: "business" },
  { id: "erp", name: "modules.erp", icon: "Building", path: "/modules/erp", category: "business" },
  { id: "hr", name: "modules.hr", icon: "Users2", path: "/modules/hr", category: "business" },
  { id: "crm", name: "modules.crm", icon: "HeartHandshake", path: "/modules/crm", category: "business" },
  { id: "reporting", name: "modules.reporting", icon: "BarChart3", path: "/modules/reporting", category: "business" },
  { id: "administration", name: "modules.administration", icon: "Shield", path: "/modules/administration", category: "admin" },
  { id: "ai", name: "modules.ai", icon: "Brain", path: "/modules/ai", category: "platform" },
  { id: "integrations", name: "modules.integrations", icon: "Cable", path: "/modules/integrations", category: "platform" },
  { id: "events", name: "modules.events", icon: "Zap", path: "/modules/events", category: "platform" },
  { id: "automation", name: "modules.automation", icon: "Workflow", path: "/modules/automation", category: "platform" },
  { id: "portal", name: "modules.portal", icon: "Globe", path: "/modules/portal", category: "platform" },
];
