import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireGlobalAdmin } from "@/lib/iam/permissions.server";

const setCampaignFeaturedSchema = z.object({
  campaignId: z.string().uuid(),
  featured: z.boolean(),
});

/**
 * Fixa (ou desfixa) uma campanha na pagina inicial.
 * Somente o Administrador Global pode escolher a campanha fixa e
 * apenas UMA campanha fica fixada por vez.
 */
export const setCampaignFeaturedAdminFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(setCampaignFeaturedSchema)
  .handler(async ({ context, data }) => {
    await requireGlobalAdmin(context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.featured) {
      const { error: clearError } = await supabaseAdmin
        .from("campaigns")
        .update({ is_featured: false })
        .eq("is_featured", true);
      if (clearError) throw clearError;
    }

    const { error } = await supabaseAdmin
      .from("campaigns")
      .update({ is_featured: data.featured })
      .eq("id", data.campaignId);
    if (error) throw error;

    return { ok: true };
  });
