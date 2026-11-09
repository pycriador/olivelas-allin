import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Clock, Copy, QrCode, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { loadCheckoutOrder } from "@/lib/payments/payment.server";
import { formatCurrency } from "@/lib/format";
import { PAYMENT_STATUS_LABELS } from "@/types/payment";
import type { CheckoutOrderView } from "@/types/payment";

export const Route = createFileRoute("/checkout/$orderId/pix")({
  loader: async ({ params }) => loadCheckoutOrder(params.orderId),
  head: ({ loaderData }) => ({
    meta: [
      { title: "Pagamento PIX — RaffleHub" },
      { name: "description", content: "Pague sua rifa via PIX de forma segura." },
    ],
  }),
  component: PixPaymentPage,
});

function PixPaymentPage() {
  const data = Route.useLoaderData();
  const { orderId } = useParams({ from: "/checkout/$orderId/pix" });
  const [copied, setCopied] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (data?.payment?.status === "PAID") {
      toast.success("Pagamento confirmado!");
      window.location.href = `/r/${data.campaign.slug}`;
    }
  }, [data]);

  if (!data?.payment?.pixQrCode) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <EmptyState
          title="Pagamento nao encontrado"
          description="Nao foi possivel carregar os dados do pagamento."
          actions={
            <Button asChild>
              <a href={`/checkout/${orderId}`}>Voltar ao checkout</a>
            </Button>
          }
        />
      </main>
    );
  }

  const payment = data.payment;
  const expiresMs = payment.expiresAt ? new Date(payment.expiresAt).getTime() - now : 0;
  const totalSeconds = Math.max(0, Math.floor(expiresMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pct = payment.expiresAt
    ? Math.min(100, Math.max(0, (expiresMs / (15 * 60 * 1000)) * 100))
    : 100;

  const isPaid = payment.status === "PAID";
  const isExpired =
    payment.status === "EXPIRED" || (payment.status !== "PAID" && totalSeconds <= 0);

  async function copyPix() {
    if (!payment.pixCopyPaste) return;
    try {
      await navigator.clipboard.writeText(payment.pixCopyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nao foi possivel copiar");
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <a href={`/r/${data.campaign.slug}`}>
          <ArrowLeft className="size-4" />
          Voltar para campanha
        </a>
      </Button>

      <PageHeader title="Pagamento via PIX" description={data.campaign.title} />

      {isPaid ? (
        <Card className="mt-6 border-success">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <CheckCircle2 className="size-12 text-success" />
            <p className="text-lg font-semibold">Pagamento confirmado!</p>
            <p className="text-sm text-muted-foreground">
              Seus numeros estao reservados. Obrigado por participar!
            </p>
          </CardContent>
        </Card>
      ) : isExpired ? (
        <Card className="mt-6 border-destructive">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Clock className="size-12 text-destructive" />
            <p className="text-lg font-semibold">Pagamento expirado</p>
            <p className="text-sm text-muted-foreground">
              Seus numeros foram liberados. Tente novamente.
            </p>
            <Button asChild>
              <a href={`/r/${data.campaign.slug}`}>Selecionar numeros novamente</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <div className="flex items-center gap-2 text-sm font-medium">
                <QrCode className="size-5 text-primary" />
                Escaneie o QR Code
              </div>
              <div className="rounded-xl border bg-white p-4">
                {payment.pixQrCode ? (
                  <img src={payment.pixQrCode} alt="QR Code PIX" className="size-48 sm:size-56" />
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Pix Copia e Cola</Label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-md border bg-muted/50 p-3">
                <p className="break-all text-xs text-muted-foreground">{payment.pixCopyPaste}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => void copyPix()}
              >
                {copied ? (
                  <CheckCircle2 aria-hidden="true" className="size-4 text-success" />
                ) : (
                  <Copy aria-hidden="true" className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Total a pagar</span>
                <span className="tabular-nums">{formatCurrency(payment.amount)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Tempo restante</span>
                  <span className="tabular-nums">
                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                  </span>
                </div>
                <Progress value={pct} />
              </div>
              <div className="flex flex-wrap gap-1">
                {data.numbers.map((n) => (
                  <span key={n} className="rounded bg-muted px-1.5 py-0.5 text-xs tabular-nums">
                    {n}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            <Shield className="inline size-3" /> Pagamento seguro via {payment.gateway}
          </p>
        </div>
      )}
    </main>
  );
}
