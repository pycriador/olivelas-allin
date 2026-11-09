export const DEMO_ENV_COLLECTION = "demo_env_config";
export const DEMO_SCENARIO_COLLECTION = "demo_env_scenarios";
export const DEMO_LOG_COLLECTION = "demo_env_logs";
export const DEMO_HISTORY_COLLECTION = "demo_env_history";
export const DEMO_SEED_COLLECTION = "demo_env_seeds";
export const DEMO_DIAGNOSIS_COLLECTION = "demo_env_diagnosis";
export const DEMO_INTEGRITY_COLLECTION = "demo_env_integrity";

export type ScenarioType = "small" | "medium" | "large";
export type DemoEnvAction = "restore" | "clean" | "generate" | "scenario" | "seed" | "import" | "export";
export type DemoEnvStatus = "pending" | "running" | "completed" | "failed";

export interface ScenarioDefinition {
  type: ScenarioType;
  label: string;
  description: string;
  companies: number;
  users: number;
  customers: number;
  devices: number;
  technicians: number;
  serviceOrders: number;
  returns: number;
  warranties: number;
  documents: number;
  events?: number;
  payments?: number;
  reports?: number;
  dashboards?: number;
  estimatedTime: string;
  icon: string;
}

export const SCENARIOS: ScenarioDefinition[] = [
  {
    type: "small", label: "Pequena Assistência",
    description: "Ambiente básico para demonstrações rápidas e testes funcionais",
    companies: 1, users: 8, customers: 80, devices: 150,
    technicians: 3, serviceOrders: 120, returns: 10, warranties: 20,
    documents: 300, payments: 80, reports: 5, dashboards: 3,
    estimatedTime: "~30 segundos", icon: "Store",
  },
  {
    type: "medium", label: "Assistência Média",
    description: "Ambiente completo para treinamentos e apresentações comerciais",
    companies: 3, users: 40, customers: 600, devices: 1000,
    technicians: 20, serviceOrders: 1500, returns: 120, warranties: 250,
    documents: 3000, payments: 1000, reports: 15, dashboards: 8,
    estimatedTime: "~2 minutos", icon: "Building2",
  },
  {
    type: "large", label: "Grande Rede",
    description: "Ambiente robusto para validação de performance e escala",
    companies: 12, users: 350, customers: 15000, devices: 28000,
    technicians: 220, serviceOrders: 50000, returns: 3500, warranties: 8000,
    documents: 120000, events: 500000, payments: 35000, reports: 50, dashboards: 20,
    estimatedTime: "~10 minutos", icon: "Globe",
  },
];

export interface CustomGeneratorConfig {
  companies: number;
  users: number;
  customers: number;
  devices: number;
  technicians: number;
  serviceOrders: number;
  payments: number;
  warranties: number;
  returns: number;
  events: number;
  audits: number;
  workflows: number;
  documents: number;
  reports: number;
  dashboards: number;
}

export const DEFAULT_CUSTOM_CONFIG: CustomGeneratorConfig = {
  companies: 1, users: 10, customers: 100, devices: 200,
  technicians: 5, serviceOrders: 150, payments: 100,
  warranties: 30, returns: 15, events: 1000, audits: 200,
  workflows: 10, documents: 500, reports: 10, dashboards: 5,
};

export interface DemoEnvironmentConfig {
  id: string;
  lastRestore: string | null;
  lastClean: string | null;
  lastImport: string | null;
  lastExport: string | null;
  lastGeneration: string | null;
  currentScenario: ScenarioType | "custom" | null;
  status: "clean" | "populated" | "generating";
}

export interface DemoEnvLog {
  id: string;
  action: DemoEnvAction;
  status: DemoEnvStatus;
  message: string;
  details: string;
  duration: number;
  createdBy: string;
  companyId: string | null;
  timestamp: string;
}

export interface DemoEnvHistory {
  id: string;
  action: DemoEnvAction;
  scenarioType?: ScenarioType | "custom";
  status: DemoEnvStatus;
  totalRecords: number;
  duration: number;
  details: string;
  createdBy: string;
  timestamp: string;
}

export interface DemoSeedEntry {
  id: string;
  name: string;
  collection: string;
  status: "pending" | "running" | "completed" | "failed";
  recordsCount: number;
  duration: number;
  error: string | null;
  lastRun: string | null;
  lastRunBy: string | null;
  createdAt: string;
}

export interface DiagnosisResult {
  id: string;
  category: string;
  status: "healthy" | "warning" | "error";
  title: string;
  description: string;
  details: string;
  affectedCount: number;
  timestamp: string;
}

export interface IntegrityCheck {
  id: string;
  check: string;
  status: "passed" | "failed" | "warning";
  description: string;
  details: string;
  affectedEntities: string[];
  timestamp: string;
}

export interface ExportPayload {
  companies: unknown[];
  users: unknown[];
  customers: unknown[];
  devices: unknown[];
  serviceOrders: unknown[];
  returns: unknown[];
  warranties: unknown[];
  payments: unknown[];
  documents: unknown[];
  events: unknown[];
  reports: unknown[];
  dashboards: unknown[];
  metadata: {
    version: string;
    exportedAt: string;
    exportedBy: string;
    totalRecords: number;
  };
}

export interface DashboardStats {
  companies: number;
  users: number;
  customers: number;
  devices: number;
  technicians: number;
  serviceOrders: number;
  returns: number;
  warranties: number;
  payments: number;
  documents: number;
  events: number;
  workflows: number;
  audits: number;
  integrations: number;
  reports: number;
  dashboards: number;
  lastGeneration: string | null;
  lastClean: string | null;
  lastImport: string | null;
  lastExport: string | null;
}
