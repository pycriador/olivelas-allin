import type { FormPage } from "./forms";

export type ResponseStatus = "complete" | "partial";

export interface FormResponse {
  id: string;
  formId: string;
  formVersion: number;
  schemaSnapshot: FormPage[];
  answers: Record<string, unknown>;
  respondentId: string | null;
  status: ResponseStatus;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  metadata: Record<string, unknown>;
  submittedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  kind: string;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface FieldAnalytics {
  fieldId: string;
  label: string;
  type: string;
  answered: number;
  /** for option/choice fields */
  distribution: { label: string; count: number }[];
  /** for numeric/scale/rating fields */
  average: number | null;
  /** for text fields */
  samples: string[];
}

export interface FormAnalytics {
  total: number;
  completed: number;
  partial: number;
  completionRate: number;
  avgDurationMs: number | null;
  perDay: { date: string; count: number }[];
  fields: FieldAnalytics[];
}
