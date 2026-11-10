/// <reference types="vite/client" />

interface ElectronAPI {
  isElectron: boolean;
  platform: string;
  openExternal: (url: string) => Promise<boolean>;
  selectDirectory: (defaultPath?: string) => Promise<string | null>;
  getAppInfo: () => Promise<{
    isElectron: boolean;
    version: string;
    platform: string;
    serverPort: number;
    dataDir: string;
  }>;
}

interface Window {
  electronAPI?: ElectronAPI;
}

