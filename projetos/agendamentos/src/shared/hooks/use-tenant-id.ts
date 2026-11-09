import { useCurrentProfile } from "./use-current-profile";

export function useTenantId(): string | null {
  const { data } = useCurrentProfile();
  return data?.profile?.tenant_id ?? null;
}
