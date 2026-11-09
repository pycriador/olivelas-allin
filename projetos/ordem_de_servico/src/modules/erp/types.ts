export interface ERPCompany {
  id: string;
  name: string;
  tradeName?: string;
  document: string; // CNPJ/CPF
  ie?: string; // Inscrição Estadual
  im?: string; // Inscrição Municipal
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  taxRegime: "simple" | "presumed" | "real";
  defaultTaxRate: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ERPDepartment {
  id: string;
  name: string;
  code: string;
  managerName?: string;
  budgetLimit?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ERPContract {
  id: string;
  number: string;
  clientName: string;
  clientId?: string;
  type: "service" | "rental" | "maintenance" | "sla";
  value: number;
  startDate: string;
  endDate: string;
  billingPeriod: "monthly" | "quarterly" | "yearly";
  status: "draft" | "active" | "suspended" | "expired";
  slaHours?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ERPBusinessRule {
  id: string;
  key: string;
  name: string;
  value: string;
  description: string;
  category: "fiscal" | "operational" | "financial";
  createdAt: string;
  updatedAt: string;
}

export interface ERPDashboardStats {
  totalCompanies: number;
  activeCompanies: number;
  totalDepartments: number;
  activeContracts: number;
  totalContractValue: number;
  expiredContracts: number;
  activeRules: number;
}
