export interface EquipmentType {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}
