import { CampaignProgress } from "./campaign-progress";
import { CampaignMetrics } from "./campaign-metrics";
import { FinancialCards } from "./financial-cards";
import {
  useRealtimeCampaign,
  countNumberStates,
} from "@/features/campaigns/hooks/use-realtime-campaign";
import { useOrders, useOrderMetrics } from "@/features/orders/hooks/use-orders";
import { useNow } from "@/features/campaigns/hooks/use-countdown";
import { CampaignStatusBadge } from "@/features/campaigns/components/campaign-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { CampaignWithRelations } from "@/types/campaign";

export interface CampaignOverviewTabProps {
  campaign: CampaignWithRelations;
}

export function CampaignOverviewTab({ campaign }: CampaignOverviewTabProps) {
  const numbersQuery = useRealtimeCampaign(campaign.id);
  const numbers = numbersQuery.data ?? [];
  const now = useNow();
  const totalNumbers = campaign.number_end - campaign.number_start + 1;

  const counts = countNumberStates(numbers, now, totalNumbers);

  const { data: ordersData } = useOrders({
    page: 1,
    pageSize: 1,
    filters: { campaignId: campaign.id },
  });
  const { data: metrics } = useOrderMetrics();

  const paidPct =
    totalNumbers > 0 ? Math.round(((counts.paid + counts.winner) / totalNumbers) * 100) : 0;
  const reservedPct = totalNumbers > 0 ? Math.round((counts.reserved / totalNumbers) * 100) : 0;

  const campaignMetrics = metrics?.byCampaign.find((m) => m.campaign_id === campaign.id);

  const receivedRevenue = (counts.paid + counts.winner) * campaign.price_per_number;
  const reservedRevenue = counts.reserved * campaign.price_per_number;
  const expectedRevenue = totalNumbers * campaign.price_per_number;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">{campaign.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{campaign.product_name}</p>
            </div>
            <CampaignStatusBadge status={campaign.status} />
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Valor unitário</dt>
                <dd className="font-semibold">{formatCurrency(campaign.price_per_number)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Números</dt>
                <dd className="font-semibold">{formatNumber(totalNumbers)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Faixa</dt>
                <dd className="font-semibold tabular-nums">
                  {campaign.number_start} a {campaign.number_end}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Início</dt>
                <dd className="font-semibold">
                  {campaign.start_date
                    ? new Date(campaign.start_date).toLocaleDateString("pt-BR")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Sorteio</dt>
                <dd className="font-semibold">
                  {campaign.end_date
                    ? new Date(campaign.end_date).toLocaleDateString("pt-BR")
                    : "—"}
                </dd>
              </div>
              {campaign.contact_phone ? (
                <div>
                  <dt className="text-muted-foreground">Contato</dt>
                  <dd className="font-semibold">{campaign.contact_phone}</dd>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Indicadores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">Percentual vendido</span>
                <span className="tabular-nums text-muted-foreground">{paidPct}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${paidPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">Percentual reservado</span>
                <span className="tabular-nums text-muted-foreground">{reservedPct}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-warning transition-all duration-500"
                  style={{ width: `${reservedPct}%` }}
                />
              </div>
            </div>

            <div>
              <CampaignProgress
                label="Ocupação"
                value={counts.paid + counts.reserved + counts.winner}
                max={totalNumbers}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <section>
        <h3 className="mb-3 text-lg font-semibold tracking-tight">Números</h3>
        {numbersQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : (
          <CampaignMetrics counts={counts} />
        )}
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold tracking-tight">Financeiro</h3>
        <FinancialCards
          expectedRevenue={expectedRevenue}
          receivedRevenue={receivedRevenue}
          reservedRevenue={reservedRevenue}
          averageTicket={
            campaignMetrics?.revenue ? campaignMetrics.revenue / (campaignMetrics.paid || 1) : 0
          }
          orderCount={campaignMetrics?.orders ?? 0}
          customerCount={0}
        />
      </section>
    </div>
  );
}
