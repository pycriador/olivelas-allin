export interface MeasurementUnit {
  id: string;
  name: string;
  abbreviation: string;
  category?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}
