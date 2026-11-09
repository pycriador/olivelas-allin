import type {
  CampaignNumber,
  CampaignNumberStatus,
  NumberGridStatus,
} from "@/types/campaign-number";

export interface EnrichedNumber {
  id: string;
  campaignId: string;
  number: number;
  status: CampaignNumberStatus;
  statusDisplay: NumberGridStatus;
  reservedBy: string | null;
  reservationToken: string | null;
  reservedUntil: string | null;
  purchaseId: string | null;
  createdAt: string;
  updatedAt: string;
  customerName: string | null;
  customerPhone: string | null;
  customerId: string | null;
  orderId: string | null;
  orderSource: string | null;
  orderStatus: string | null;
  paymentMethod: string | null;
  orderTotal: number | null;
  orderItemCount: number | null;
  orderNotes: string | null;
}

export function numberRowToEnriched(
  row: CampaignNumber,
  now: number,
  orders: Map<
    string,
    {
      id: string;
      source: string;
      status: string;
      payment_method: string | null;
      total: number;
      notes: string | null;
      item_count: number;
      customer: { id: string; full_name: string; phone: string } | null;
    }
  >,
): EnrichedNumber {
  const order = (row.purchase_id ? orders.get(row.purchase_id) : undefined) ?? null;

  return {
    id: row.id,
    campaignId: row.campaign_id,
    number: row.number,
    status: row.status,
    statusDisplay: row.status,
    reservedBy: row.reserved_by ?? null,
    reservationToken: row.reservation_token ?? null,
    reservedUntil: row.reserved_until ?? null,
    purchaseId: row.purchase_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customerName: order?.customer?.full_name ?? null,
    customerPhone: order?.customer?.phone ?? null,
    customerId: order?.customer?.id ?? null,
    orderId: order?.id ?? null,
    orderSource: order?.source ?? null,
    orderStatus: order?.status ?? null,
    paymentMethod: order?.payment_method ?? null,
    orderTotal: order?.total ?? null,
    orderItemCount: order?.item_count ?? null,
    orderNotes: order?.notes ?? null,
  };
}
