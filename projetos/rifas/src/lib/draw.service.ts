import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getUserRoleCode } from "@/lib/iam/permissions.server";

export const MAX_DRAW_PER_PUBLISHER = 5;

export interface DrawResult {
  number: number;
  customerName: string | null;
  customerPhone: string | null;
  orderId: string | null;
}

export interface CampaignDrawView {
  campaignId: string;
  campaignTitle: string;
  status: string;
  totalNumbers: number;
  paidNumbers: number;
  winners: DrawResult[];
  drawDate: string | null;
  canDraw: boolean;
  canReset: boolean;
}

async function buildDrawResult(
  campaign: {
    id: string;
    title: string;
    status: string;
    number_start: number;
    number_end: number;
    draw_date: string | null;
  },
  userRole: string | null,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [numbersRes, winnersRes] = await Promise.all([
    supabaseAdmin
      .from("campaign_numbers")
      .select("number, status, purchase_id")
      .eq("campaign_id", campaign.id)
      .in("status", ["PAID", "WINNER"]),
    supabaseAdmin
      .from("campaign_numbers")
      .select("number, purchase_id")
      .eq("campaign_id", campaign.id)
      .eq("status", "WINNER"),
  ]);

  if (numbersRes.error) throw numbersRes.error;
  if (winnersRes.error) throw winnersRes.error;

  const paidNumbers = numbersRes.data ?? [];
  const winners = winnersRes.data ?? [];

  const winnerOrders = [...new Set(winners.map((w) => w.purchase_id).filter(Boolean))] as string[];
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("id, customer:customers(full_name, phone)")
    .in("id", winnerOrders);

  const customerMap = new Map<string, { name: string; phone: string }>();
  for (const order of (orders ?? []) as Array<{
    id: string;
    customer: { full_name: string; phone: string } | null;
  }>) {
    if (order.customer) {
      customerMap.set(order.id, {
        name: order.customer.full_name,
        phone: order.customer.phone,
      });
    }
  }

  const totalNumbers = campaign.number_end - campaign.number_start + 1;
  const hasWinners = winners.length > 0;
  const canReset = hasWinners && (userRole === "GLOBAL_ADMIN" || userRole === "ADMIN");

  return {
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    status: campaign.status,
    totalNumbers,
    paidNumbers: paidNumbers.length,
    winners: winners.map((w) => ({
      number: w.number,
      customerName: w.purchase_id ? (customerMap.get(w.purchase_id)?.name ?? null) : null,
      customerPhone: w.purchase_id ? (customerMap.get(w.purchase_id)?.phone ?? null) : null,
      orderId: w.purchase_id ?? null,
    })),
    drawDate: campaign.draw_date,
    canDraw: campaign.status === "FINISHED" && paidNumbers.length > 0 && !hasWinners,
    canReset,
  };
}

/**
 * Carrega a view do sorteio para uma campanha.
 */
export const loadDrawView = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ campaignId: z.string() }))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const userRole = await getUserRoleCode(context.userId);

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("campaigns")
      .select("id, title, status, number_start, number_end, draw_date")
      .eq("id", data.campaignId)
      .maybeSingle();

    if (campaignError) throw campaignError;
    if (!campaign) throw new Error("Campanha nao encontrada");

    return buildDrawResult(campaign, userRole);
  });

/**
 * Realiza o sorteio da campanha. Seleciona aleatoriamente
 * ate `winnerCount` numeros entre os PAID.
 * PUBLISHER: limite de 5 vencedores.
 * ADMIN / GLOBAL_ADMIN: sem limite.
 */
export const performCampaignDraw = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ campaignId: z.string(), winnerCount: z.number().min(1) }))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const userRole = await getUserRoleCode(context.userId);
    if (!userRole) throw new Error("Forbidden: usuario sem role");

    const effectiveCount =
      userRole === "PUBLISHER"
        ? Math.min(data.winnerCount, MAX_DRAW_PER_PUBLISHER)
        : data.winnerCount;

    const { data: campaign, error: campError } = await supabaseAdmin
      .from("campaigns")
      .select("id, status, draw_date")
      .eq("id", data.campaignId)
      .maybeSingle();

    if (campError) throw campError;
    if (!campaign) throw new Error("Campanha nao encontrada");
    if (campaign.status !== "FINISHED")
      throw new Error("A campanha precisa estar FINALIZADA para sortear.");
    if (campaign.draw_date)
      throw new Error("Sorteio ja realizado. Use Resetar para sortear novamente.");

    const { data: numbers, error: numError } = await supabaseAdmin
      .from("campaign_numbers")
      .select("number, purchase_id")
      .eq("campaign_id", data.campaignId)
      .eq("status", "PAID")
      .order("number");

    if (numError) throw numError;
    if (!numbers || numbers.length === 0)
      throw new Error("Nenhum numero pago encontrado para sortear.");

    const shuffled = [...numbers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i]!;
      shuffled[i] = shuffled[j]!;
      shuffled[j] = temp;
    }

    const selected = shuffled.slice(0, Math.min(effectiveCount, shuffled.length));
    const selectedNumbers = selected.map((s) => s.number);
    const selectedOrders = [
      ...new Set(selected.map((s) => s.purchase_id).filter(Boolean)),
    ] as string[];

    const { data: orders, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, customer:customers(full_name, phone)")
      .in("id", selectedOrders);

    if (orderError) throw orderError;

    const customerMap = new Map<string, { name: string; phone: string }>();
    for (const order of (orders ?? []) as Array<{
      id: string;
      customer: { full_name: string; phone: string } | null;
    }>) {
      if (order.customer) {
        customerMap.set(order.id, {
          name: order.customer.full_name,
          phone: order.customer.phone,
        });
      }
    }

    const now = new Date().toISOString();

    await Promise.all([
      supabaseAdmin
        .from("campaign_numbers")
        .update({ status: "WINNER" })
        .eq("campaign_id", data.campaignId)
        .in("number", selectedNumbers),
      supabaseAdmin.from("campaigns").update({ draw_date: now }).eq("id", data.campaignId),
    ]);

    await supabaseAdmin.rpc("log_order_audit", {
      p_action: "ORDER_STATUS_CHANGED",
      p_order_id: data.campaignId,
      p_campaign_id: data.campaignId,
      p_actor_id: context.userId,
      p_metadata: {
        event: "DRAW_PERFORMED",
        winners: selectedNumbers,
        total_paid: numbers.length,
        winner_count: selectedNumbers.length,
        draw_date: now,
      },
    });

    return selected.map((s) => {
      const orderId = s.purchase_id ?? null;
      const cust = orderId ? customerMap.get(orderId) : null;
      return {
        number: s.number,
        customerName: cust?.name ?? null,
        customerPhone: cust?.phone ?? null,
        orderId,
      };
    });
  });

/**
 * Reseta o sorteio da campanha: vencedores voltam para PAID,
 * draw_date limpo. Apenas ADMIN ou GLOBAL_ADMIN.
 */
export const resetCampaignDraw = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ campaignId: z.string() }))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const userRole = await getUserRoleCode(context.userId);
    if (userRole !== "GLOBAL_ADMIN" && userRole !== "ADMIN")
      throw new Error("Apenas administradores podem resetar o sorteio.");

    const { data: campaign, error: campError } = await supabaseAdmin
      .from("campaigns")
      .select("id, draw_date")
      .eq("id", data.campaignId)
      .maybeSingle();

    if (campError) throw campError;
    if (!campaign) throw new Error("Campanha nao encontrada");
    if (!campaign.draw_date) throw new Error("Nenhum sorteio realizado para resetar.");

    const { error: winError } = await supabaseAdmin
      .from("campaign_numbers")
      .update({ status: "PAID" })
      .eq("campaign_id", data.campaignId)
      .eq("status", "WINNER");

    if (winError) throw winError;

    await supabaseAdmin.from("campaigns").update({ draw_date: null }).eq("id", data.campaignId);

    await supabaseAdmin.rpc("log_order_audit", {
      p_action: "ORDER_STATUS_CHANGED",
      p_order_id: data.campaignId,
      p_campaign_id: data.campaignId,
      p_actor_id: context.userId,
      p_metadata: {
        event: "DRAW_RESET",
        reset_date: new Date().toISOString(),
      },
    });

    return { ok: true };
  });
