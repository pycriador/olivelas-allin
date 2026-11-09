import { getStorage } from "@/core/providers/storage";
import {
  DEMO_ENV_COLLECTION, DEMO_SCENARIO_COLLECTION, DEMO_LOG_COLLECTION,
  DEMO_HISTORY_COLLECTION, DEMO_SEED_COLLECTION, DEMO_DIAGNOSIS_COLLECTION,
  DEMO_INTEGRITY_COLLECTION,
  type DemoEnvironmentConfig, type DemoEnvLog, type DemoEnvHistory,
  type DemoSeedEntry,
} from "./types";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

let seeded = false;

export async function seedDemoEnv(): Promise<void> {
  if (seeded) return;
  const existing = await getStorage().count(DEMO_ENV_COLLECTION);
  if (existing > 0) { seeded = true; return; }

  const config: DemoEnvironmentConfig = {
    id: uid(), lastRestore: null, lastClean: null,
    lastImport: null, lastExport: null, lastGeneration: null,
    currentScenario: null, status: "clean",
  };
  await getStorage().create(DEMO_ENV_COLLECTION, config);

  const logEntries: Omit<DemoEnvLog, "id">[] = [
    { action: "seed", status: "completed", message: "Módulo Demo Environment inicializado",
      details: "Ambiente de demonstração configurado com sucesso", duration: 0,
      createdBy: "system", companyId: null, timestamp: new Date().toISOString() },
  ];
  for (const log of logEntries) {
    await getStorage().create(DEMO_LOG_COLLECTION, { id: uid(), ...log });
  }

  seeded = true;
}
