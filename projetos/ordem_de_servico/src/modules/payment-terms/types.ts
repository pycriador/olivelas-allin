export interface PaymentTerm {
  id: string;
  name: string;
  description?: string;
  installments: number;
  interest?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}
