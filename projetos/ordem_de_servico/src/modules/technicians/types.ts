export interface Technician {
  id: string;
  name: string;
  cpf?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  position?: string;
  specialties?: string[];
  certifications?: string[];
  workHours?: string;
  status: "active" | "inactive";
  photo?: string;
  notes?: string;
  schedule?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}
