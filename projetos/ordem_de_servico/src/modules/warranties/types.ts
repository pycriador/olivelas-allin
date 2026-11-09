export interface Warranty {
  id: string;
  name: string;
  days: number;
  coverage?: string;
  notes?: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}
