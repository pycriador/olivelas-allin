export interface Brand {
  id: string;
  name: string;
  manufacturerId?: string;
  logo?: string;
  status: "active" | "inactive";
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
