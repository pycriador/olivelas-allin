import { getStorage } from "../providers/storage";

export type ThemeMode = "light" | "dark" | "system";
export type Language = "pt-BR" | "en" | "es";

export interface AppConfiguration {
  id: "app";
  theme: ThemeMode;
  language: Language;
  activeConnectionId: string | null;
  activeCompanyId: string | null;
  preferences: Record<string, unknown>;
}

const DEFAULT_CONFIG: AppConfiguration = {
  id: "app",
  theme: "system",
  language: "pt-BR",
  activeConnectionId: null,
  activeCompanyId: null,
  preferences: {},
};

const COLLECTION = "configuration";

export const configurationService = {
  async get(): Promise<AppConfiguration> {
    const found = await getStorage().find<AppConfiguration>(COLLECTION, "app");
    if (found) return { ...DEFAULT_CONFIG, ...found };
    await getStorage().create<AppConfiguration>(COLLECTION, DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  },
  async update(patch: Partial<AppConfiguration>): Promise<AppConfiguration> {
    const current = await this.get();
    return getStorage().update<AppConfiguration>(COLLECTION, "app", { ...current, ...patch });
  },
};
