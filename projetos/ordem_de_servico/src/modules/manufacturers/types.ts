export interface Manufacturer {
  id: string;
  name: string;
  logo?: string;
  country?: string;
  website?: string;
  status: "active" | "inactive";
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
