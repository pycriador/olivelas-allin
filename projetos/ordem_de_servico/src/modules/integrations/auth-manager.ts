import type { AuthConfig, AuthType } from "./types";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const authManager = {
  async createConfig(type: AuthType, config: Record<string, string>): Promise<AuthConfig> {
    return { type, config, headers: this.buildHeaders(type, config) };
  },

  buildHeaders(type: AuthType, config: Record<string, string>): Record<string, string> {
    switch (type) {
      case "bearer":
        return { Authorization: `Bearer ${config.token || ""}` };
      case "basic": {
        const encoded = btoa(`${config.username || ""}:${config.password || ""}`);
        return { Authorization: `Basic ${encoded}` };
      }
      case "api-key":
        return { "X-API-Key": config.apiKey || "" };
      case "jwt":
        return { Authorization: `Bearer ${config.token || ""}` };
      case "client-credentials":
        return { Authorization: `Bearer ${config.accessToken || ""}` };
      case "refresh-token":
        return { Authorization: `Bearer ${config.accessToken || ""}`, "X-Refresh-Token": config.refreshToken || "" };
      case "custom-headers":
        return config.headers ? JSON.parse(config.headers) : {};
      default:
        return {};
    }
  },

  async validateConfig(auth: AuthConfig): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (!auth.type) errors.push("Auth type is required");
    if (!auth.config || Object.keys(auth.config).length === 0) errors.push("Auth config is required");
    return { valid: errors.length === 0, errors };
  },
};
