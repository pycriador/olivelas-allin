export interface Service {
  id: string;
  name: string;
  description?: string;
  suggestedValue?: number;
  avgTime?: number;
  defaultWarranty?: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}
