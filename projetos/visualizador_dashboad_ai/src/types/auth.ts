import type { Survey, AnalysisDisplaySettings } from './survey';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isAdmin?: boolean;
}

export interface UserCredentialsStatus {
  isAdmin?: boolean;
  googleConfigured: boolean;
  googleClientEmail?: string;
  googleProjectId?: string;
  hasGoogleApiKey: boolean;
  hasGeminiApiKey: boolean;
  isUsingAiStudioDefault?: boolean;
}

export interface UserProjectSummary {
  id: string;
  name: string;
  description?: string;
  sourceName?: string;
  sourceType?: string;
  questionCount: number;
  responseCount: number;
  updatedAt: string;
  createdAt: string;
}

export interface DashboardBackupJSON {
  version: string;
  exportedAt: string;
  appName: string;
  projectId: string;
  projectName: string;
  projectDescription?: string;
  survey: Survey;
  displaySettings?: AnalysisDisplaySettings;
}
