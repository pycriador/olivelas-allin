import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to real-time payments changes via Supabase Realtime.
 * Invalidates relevant query caches when payments are inserted, updated, or deleted.
 */
export function useRealtimePayments(campaignId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!campaignId) return;

    const channel = supabase
      .channel(`payments:${campaignId}`)
      .on(
        "postgres_changes" as never,
        {
          event: "*",
          schema: "public",
          table: "payments",
          filter: `campaign_id=eq.${campaignId}`,
        } as never,
        () => {
          queryClient.invalidateQueries({ queryKey: ["payments"] });
          queryClient.invalidateQueries({ queryKey: ["payment-metrics"] });
          queryClient.invalidateQueries({ queryKey: ["sales"] });
          queryClient.invalidateQueries({ queryKey: ["sales-metrics"] });
          queryClient.invalidateQueries({ queryKey: ["campaign-number-metrics"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, queryClient]);
}
