export interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
  config?: Record<string, unknown>;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}
