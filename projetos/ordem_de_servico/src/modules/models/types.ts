export interface Model {
  id: string;
  name: string;
  brandId?: string;
  categoryId?: string;
  equipmentTypeId?: string;
  internalCode?: string;
  manufacturerCode?: string;
  year?: number;
  description?: string;
  notes?: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}
