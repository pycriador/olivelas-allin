import { useMemo } from "react";

import { useOrders } from "@/features/orders/hooks/use-orders";
import { formatCurrency } from "@/lib/format";

export type ParticipantOrigin = "ONLINE" | "MANUAL" | "WHATSAPP" | "MIXED";

export interface CampaignParticipant {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  numbersCount: number;
  ordersCount: number;
  paidOrdersCount: number;
  totalSpent: number;
  paidAmount: number;
  sources: string[];
  origin: ParticipantOrigin;
  lastOrderDate: string;
  orders: Array<{
    id: string;
    source: string;
    status: string;
    total: number;
    numbers: number[];
    createdAt: string;
  }>;
}

export function computeOrigin(sources: string[]): ParticipantOrigin {
  const has = {
    online: sources.includes("ONLINE"),
    manual: sources.includes("MANUAL"),
    whatsapp: sources.includes("WHATSAPP"),
  };
  const count = [has.online, has.manual, has.whatsapp].filter(Boolean).length;
  if (count > 1) return "MIXED";
  if (has.online) return "ONLINE";
  if (has.manual) return "MANUAL";
  if (has.whatsapp) return "WHATSAPP";
  return "MANUAL";
}

export function useCampaignParticipants(campaignId: string) {
  const { data, isLoading, isError } = useOrders({
    page: 1,
    pageSize: 2000,
    filters: { campaignId },
  });

  const participants = useMemo(() => {
    if (!data?.items) return [];

    const map = new Map<string, CampaignParticipant>();

    for (const order of data.items) {
      const cid = order.customer?.id;
      if (!cid) continue;

      const existing = map.get(cid);
      const numbers = order.items.map((i) => i.number);
      const source = order.source;
      const status = order.status;
      const total = Number(order.total);
      const isPaid = status === "PAID";

      if (existing) {
        existing.numbersCount += numbers.length;
        existing.ordersCount++;
        if (isPaid) existing.paidOrdersCount++;
        existing.totalSpent += total;
        if (isPaid) existing.paidAmount += total;
        if (!existing.sources.includes(source)) existing.sources.push(source);
        existing.orders.push({
          id: order.id,
          source,
          status,
          total,
          numbers,
          createdAt: order.created_at,
        });
        if (order.created_at > existing.lastOrderDate) existing.lastOrderDate = order.created_at;
      } else {
        map.set(cid, {
          customerId: cid,
          customerName: order.customer?.full_name ?? "",
          customerPhone: order.customer?.phone ?? "",
          customerEmail: order.customer?.email ?? null,
          numbersCount: numbers.length,
          ordersCount: 1,
          paidOrdersCount: isPaid ? 1 : 0,
          totalSpent: total,
          paidAmount: isPaid ? total : 0,
          sources: [source],
          origin: "MANUAL",
          lastOrderDate: order.created_at,
          orders: [{ id: order.id, source, status, total, numbers, createdAt: order.created_at }],
        });
      }
    }

    return [...map.values()]
      .map((p) => ({ ...p, origin: computeOrigin(p.sources) }))
      .sort((a, b) => b.lastOrderDate.localeCompare(a.lastOrderDate));
  }, [data]);

  return { participants, isLoading, isError };
}

export const ORIGIN_LABELS: Record<ParticipantOrigin, string> = {
  ONLINE: "Online",
  MANUAL: "Manual",
  WHATSAPP: "WhatsApp",
  MIXED: "Misto",
};
