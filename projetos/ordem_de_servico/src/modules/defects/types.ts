export interface Defect {
  id: string;
  name: string;
  categoryId?: string;
  tags?: string[];
  priority: "low" | "medium" | "high" | "critical";
  description?: string;
  suggestedSolution?: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}
