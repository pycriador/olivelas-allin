import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Download, Share2, Ticket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/common/empty-state";
import { loadCheckoutOrder } from "@/lib/payments/payment.server";
import { campaignMediaPublicUrl } from "@/services/campaign.service";
import { formatCurrency, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/confirmation/$orderId")({
  loader: async ({ params }) => loadCheckoutOrder(params.orderId),
  head: ({ loaderData }) => ({
    meta: [
      {
        title:
          loaderData?.payment?.status === "PAID"
            ? "Pagamento confirmado — RaffleHub"
            : "Confirmacao — RaffleHub",
      },
      { name: "description", content: "Comprovante de pagamento no RaffleHub." },
    ],
  }),
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const data = Route.useLoaderData();

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <EmptyState
          title="Pedido nao encontrado"
          description="Verifique o link ou tente novamente."
        />
      </main>
    );
  }

  const payment = data.payment;
  const isPaid = payment?.status === "PAID";
  const coverUrl = campaignMediaPublicUrl(data.campaign.coverImage);

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-8">
      <div className="text-center">
        {isPaid ? (
          <CheckCircle2 className="mx-auto size-16 text-success" />
        ) : (
          <Ticket className="mx-auto size-16 text-primary" />
        )}
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {isPaid ? "Pagamento confirmado!" : "Resumo do pedido"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isPaid
            ? `Seus numeros foram confirmados em ${data.campaign.title}.`
            : "Aguardando confirmacao de pagamento."}
        </p>
      </div>

      {isPaid ? (
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="size-4" />
            Baixar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = window.location.href;
              if (navigator.share) {
                void navigator.share({ title: "Comprovante RaffleHub", url });
              } else {
                void navigator.clipboard.writeText(url);
              }
            }}
          >
            <Share2 className="size-4" />
            Compartilhar
          </Button>
        </div>
      ) : null}

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            {coverUrl ? (
              <img src={coverUrl} alt="" className="size-10 rounded-lg object-cover" />
            ) : null}
            <div>
              <p>{data.campaign.title}</p>
              <p className="text-sm font-normal text-muted-foreground">
                {data.campaign.productName}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Numeros" value={data.numbers.join(", ")} />
          <Row label="Quantidade" value={`${data.quantity}x`} />
          <Separator />
          <Row label="Valor unitario" value={formatCurrency(data.unitPrice)} />
          <Row label="Total" value={formatCurrency(data.total)} bold />
        </CardContent>
      </Card>

      {payment ? (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Gateway" value={payment.gateway} />
            <Row label="Metodo" value={payment.method} />
            <Row label="Status" value={payment.status} />
            <Row label="Valor" value={formatCurrency(payment.amount)} bold />
            <Row label="ID do pedido" value={data.orderId.slice(0, 8)} mono />
            {payment.paidAt ? <Row label="Pago em" value={formatDateTime(payment.paidAt)} /> : null}
            {payment.createdAt ? (
              <Row label="Criado em" value={formatDateTime(payment.createdAt)} />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 text-center">
        <Button asChild variant="link">
          <a href={`/r/${data.campaign.slug}`}>Voltar para campanha</a>
        </Button>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  bold,
  mono,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold" : mono ? "font-mono" : ""}>{value}</span>
    </div>
  );
}
