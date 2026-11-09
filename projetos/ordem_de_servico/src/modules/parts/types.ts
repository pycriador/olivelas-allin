export interface Part {
  id: string;
  code: string;
  sku?: string;
  name: string;
  manufacturerId?: string;
  supplierId?: string;
  categoryId?: string;
  costPrice?: number;
  suggestedPrice?: number;
  quantity: number;
  unitId?: string;
  minStock?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
