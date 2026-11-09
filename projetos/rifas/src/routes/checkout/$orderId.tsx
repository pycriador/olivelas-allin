import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Copy, ExternalLink, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { loadCheckoutOrder, createPixPaymentForOrder } from "@/lib/payments/payment.server";
import { campaignMediaPublicUrl } from "@/services/campaign.service";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/types/order";
import { PAYMENT_STATUS_LABELS } from "@/types/payment";
import type { CheckoutOrderView } from "@/types/payment";

export const Route = createFileRoute("/checkout/$orderId")({
  loader: async ({ params }) => loadCheckoutOrder(params.orderId),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `Checkout — ${loaderData.campaign.title}` : "Checkout — RaffleHub" },
      { name: "description", content: "Finalize sua compra no RaffleHub." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const data = Route.useLoaderData();
  const { orderId } = useParams({ from: "/checkout/$orderId" });
  const [name, setName] = useState(data?.customer?.name ?? "");
  const [phone, setPhone] = useState(data?.customer?.phone ?? "");
  const [email, setEmail] = useState(data?.customer?.email ?? "");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const canSubmit =
    name.trim().length >= 2 &&
    phone.replace(/\D/g, "").length >= 8 &&
    acceptTerms &&
    acceptPrivacy &&
    !isSubmitting;

  async function handleCheckout() {
    setIsSubmitting(true);
    try {
      await createPixPaymentForOrder(orderId);
      window.location.href = `/checkout/${orderId}/pix`;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao processar pagamento");
    } finally {
      setIsSubmitting(false);
    }
  }

  const coverUrl = campaignMediaPublicUrl(data.campaign.coverImage);

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <a href={`/r/${data.campaign.slug}`}>
          <ArrowLeft className="size-4" />
          Voltar para campanha
        </a>
      </Button>

      <PageHeader title="Checkout" description="Revise seus dados e confirme a compra." />

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              {coverUrl ? (
                <img src={coverUrl} alt="" className="size-10 rounded-lg object-cover" />
              ) : null}
              {data.campaign.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Produto</span>
              <span className="font-medium">{data.campaign.productName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Numeros selecionados</span>
              <span className="font-medium tabular-nums">{data.numbers.join(", ")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Quantidade</span>
              <span className="font-medium tabular-nums">{data.quantity}x</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Valor unitario</span>
              <span className="tabular-nums">{formatCurrency(data.unitPrice)}</span>
            </div>
            {data.discount > 0 ? (
              <div className="flex items-center justify-between text-red-500">
                <span>Desconto</span>
                <span>- {formatCurrency(data.discount)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(data.total)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Seus dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ch-name">Nome completo *</Label>
              <Input
                id="ch-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ch-phone">WhatsApp *</Label>
              <Input
                id="ch-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ch-email">Email</Label>
              <Input
                id="ch-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
            <Checkbox
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(Boolean(checked))}
              className="mt-0.5"
            />
            <span>
              Li e aceito os{" "}
              <a href="#" className="underline">
                termos da campanha
              </a>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
            <Checkbox
              checked={acceptPrivacy}
              onCheckedChange={(checked) => setAcceptPrivacy(Boolean(checked))}
              className="mt-0.5"
            />
            <span>
              Concordo com a{" "}
              <a href="#" className="underline">
                politica de privacidade
              </a>
            </span>
          </label>
        </div>

        {data.payment ? (
          <Card className="border-warning bg-warning/10">
            <CardContent className="flex items-center gap-3 p-4 text-sm">
              <Shield className="size-5 text-warning" />
              <div>
                <p className="font-medium">Voce ja possui um pagamento em andamento</p>
                <p className="text-muted-foreground">
                  Status: {PAYMENT_STATUS_LABELS[data.payment.status]}
                </p>
                {data.payment.pixQrCode ? (
                  <Button asChild variant="link" size="sm" className="h-auto p-0">
                    <a href={`/checkout/${orderId}/pix`}>Ver PIX</a>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Button
          type="button"
          className="w-full"
          size="lg"
          disabled={!canSubmit}
          onClick={() => void handleCheckout()}
        >
          {isSubmitting ? "Processando..." : "Continuar para pagamento"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          <Shield className="inline size-3" /> Pagamento seguro via PIX
        </p>
      </div>
    </main>
  );
}
