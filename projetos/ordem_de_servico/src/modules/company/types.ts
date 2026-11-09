export interface CompanySettings {
  theme: string;
  language: string;
  databaseUsed: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  documentFooter: string;
  defaultMessage: string;
}

export interface Company {
  id: string;
  logoUrl: string;
  legalName: string;
  tradeName: string;
  cnpj: string;
  stateRegistration: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  zipCode: string;
  address: string;
  number: string;
  complement: string;
  city: string;
  state: string;
  country: string;
  status: "active" | "inactive";
  notes: string;
  settings: CompanySettings;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  deletedBy: string | null;
  deletedAt: string | null;
}
