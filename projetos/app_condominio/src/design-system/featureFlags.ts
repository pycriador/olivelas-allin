import { Condominium, ModuleKey } from '../types';
import { mockModules } from '../mock-data/modules';

/**
 * Standard module configuration helper
 */
export const DEFAULT_MODULE_FLAGS: Record<ModuleKey, boolean> = {
  bills: true,
  documents: true,
  announcements: true,
  reservations: true,
  calendar: true,
  requests: true,
  occurrences: true,
  assemblies: true,
  ai_search: true,
  access_control: false,
};

/**
 * Helper to check if a specific module is active for the current condominium context.
 */
export function isModuleEnabled(
  moduleKey: ModuleKey,
  condominium?: Condominium | null,
  condoOverrides?: Record<string, Record<string, boolean>>
): boolean {
  if (!condominium) return true; // Default fallback

  // Check tenant custom overrides first
  if (condoOverrides && condoOverrides[condominium.id]?.[moduleKey] !== undefined) {
    return condoOverrides[condominium.id][moduleKey];
  }

  // Check condominium enabledModules configuration
  if (condominium.enabledModules && condominium.enabledModules[moduleKey] !== undefined) {
    return condominium.enabledModules[moduleKey];
  }

  // Check global module definition default
  const modDef = mockModules.find((m) => m.key === moduleKey);
  return modDef ? modDef.globalEnabled : true;
}
