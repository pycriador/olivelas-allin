import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to real-time campaign_numbers changes via Supabase Realtime.
 * Invalidates relevant query caches when numbers are inserted, updated, or deleted.
 */
export function useRealtimeNumbers(campaignId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!campaignId) return;

    const channel = supabase
      .channel(`numbers:${campaignId}`)
      .on(
        "postgres_changes" as never,
        {
          event: "*",
          schema: "public",
          table: "campaign_numbers",
          filter: `campaign_id=eq.${campaignId}`,
        } as never,
        () => {
          queryClient.invalidateQueries({ queryKey: ["campaign-numbers"] });
          queryClient.invalidateQueries({ queryKey: ["campaign-number-metrics"] });
          queryClient.invalidateQueries({ queryKey: ["public-campaign-numbers"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, queryClient]);
}
