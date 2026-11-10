import { supabase } from "@/integrations/supabase/client";

export async function logAudit(input: {
  organizationId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}) {
  const { data: userData } = await supabase.auth.getUser();
  await supabase.from("audit_logs").insert({
    organization_id: input.organizationId,
    user_id: userData.user?.id ?? null,
    action: input.action,
    resource: input.resource ?? null,
    resource_id: input.resourceId ?? null,
    metadata: (input.metadata ?? {}) as never,
  });
}
