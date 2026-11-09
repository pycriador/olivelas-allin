import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle, Clock, CreditCard, Loader2, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BuyerInfoForm } from "./BuyerInfoForm";
import { PixDisplay } from "./PixDisplay";
import { usePublicCampaign } from "@/hooks/useCampaigns";
import { usePublicCampaignNumbers, useActiveReservation } from "@/hooks/useNumbers";
import { useCreatePayment, usePublicPayment } from "@/hooks/usePayments";
import { useRealtimePayments } from "@/hooks/useRealtimePayments";
import { useRealtimeNumbers } from "@/hooks/useRealtimeNumbers";
import { formatMoney } from "@/services/types";

type CheckoutStep = "INFO" | "PROCESSING" | "PAYMENT" | "CONFIRMED" | "EXPIRED";

interface CheckoutPageProps {
  slug: string;
}

export function CheckoutPage({ slug }: CheckoutPageProps) {
  const navigate = useNavigate();
  const { data: campaign, isPending: campaignPending } = usePublicCampaign(slug);
  const { data: numbersData } = usePublicCampaignNumbers(slug);
  const { data: reservation } = useActiveReservation(numbersData?.campaign_id);
  const createPayment = useCreatePayment();

  useRealtimePayments(numbersData?.campaign_id);
  useRealtimeNumbers(numbersData?.campaign_id);

  const [step, setStep] = useState<CheckoutStep>("INFO");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const { data: paymentData } = usePublicPayment(paymentId ?? undefined);

  // Track payment status changes
  useEffect(() => {
    if (!paymentData) return;
    if (paymentData.status === "CONFIRMED") {
      setStep("CONFIRMED");
    } else if (paymentData.status === "EXPIRED") {
      setStep("EXPIRED");
    } else if (paymentData.status === "FAILED" || paymentData.status === "CANCELLED") {
      setStep("INFO");
    }
  }, [paymentData]);

  const handleBuyerInfo = useCallback(
    async (buyerInfo: { name: string; phone: string; email: string; document: string }) => {
      if (!numbersData?.campaign_id || !reservation?.id) return;

      setStep("PROCESSING");

      try {
        const id = await createPayment.mutateAsync({
          campaign_id: numbersData.campaign_id,
          reservation_id: reservation.id,
          method: "PIX",
          amount: (reservation.numbers?.length ?? 0) * (campaign?.number_price ?? 0),
          buyer_name: buyerInfo.name,
          buyer_phone: buyerInfo.phone,
          buyer_email: buyerInfo.email,
          buyer_document: buyerInfo.document,
        });

        setPaymentId(id);

        // Call server to create provider payment
        const resp = await fetch("/api/payments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_id: id }),
        });

        if (resp.ok) {
          setStep("PAYMENT");
        } else {
          setStep("INFO");
        }
      } catch {
        setStep("INFO");
      }
    },
    [numbersData, reservation, campaign, createPayment],
  );

  if (campaignPending) {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-16">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!campaign || !reservation) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <AlertCircle className="size-12 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Checkout indisponível</h1>
        <p className="text-sm text-muted-foreground">
          {!reservation
            ? "Você não possui uma reserva ativa. Selecione e reserve números primeiro."
            : "Campanha não encontrada."}
        </p>
        <Button variant="outline" onClick={() => navigate({ to: "/c/$slug", params: { slug } })}>
          Voltar à campanha
        </Button>
      </div>
    );
  }

  const totalAmount = (reservation.numbers?.length ?? 0) * (campaign.number_price ?? 0);

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-12">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Checkout</p>
        <h1 className="font-display text-xl font-bold tracking-tight">{campaign.name}</h1>
        <p className="text-sm text-muted-foreground">
          {reservation.numbers?.length} número(s) reservado(s) — {formatMoney(totalAmount, campaign.currency)}
        </p>
      </div>

      {/* Step: Buyer Info */}
      {step === "INFO" && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-2">
              <CreditCard className="size-5 text-muted-foreground" />
              <h2 className="font-semibold">Seus dados</h2>
            </div>
            <BuyerInfoForm onSubmit={handleBuyerInfo} isPending={createPayment.isPending} />
          </CardContent>
        </Card>
      )}

      {/* Step: Processing */}
      {step === "PROCESSING" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Processando pagamento...</p>
          </CardContent>
        </Card>
      )}

      {/* Step: Payment (PIX) */}
      {step === "PAYMENT" && paymentData && (
        <Card>
          <CardContent className="pt-6">
            <PixDisplay
              pixCode={paymentData.pix_code ?? ""}
              pixQrBase64={paymentData.pix_qr_base64}
              expiresAt={paymentData.pix_expires_at}
              amount={paymentData.amount}
              currency={paymentData.currency}
              onExpired={() => setStep("EXPIRED")}
            />
          </CardContent>
        </Card>
      )}

      {/* Step: Confirmed */}
      {step === "CONFIRMED" && (
        <Card className="border-emerald-200 bg-emerald-500/5 dark:border-emerald-800">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <CheckCircle className="size-12 text-emerald-600" />
            <h2 className="font-display text-xl font-bold">Pagamento confirmado!</h2>
            <p className="text-center text-sm text-muted-foreground">
              Seus números foram reservados com sucesso. Você pode acompanhar na campanha.
            </p>
            <Button onClick={() => navigate({ to: "/c/$slug", params: { slug } })}>
              Voltar à campanha
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Expired */}
      {step === "EXPIRED" && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <AlertCircle className="size-12 text-destructive" />
            <h2 className="font-display text-xl font-bold">Código expirado</h2>
            <p className="text-center text-sm text-muted-foreground">
              O tempo para pagamento expirou. Volte à campanha e reserve novamente.
            </p>
            <Button variant="outline" onClick={() => navigate({ to: "/c/$slug", params: { slug } })}>
              Voltar à campanha
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Números reservados */}
      {reservation.numbers && reservation.numbers.length > 0 && step !== "CONFIRMED" && (
        <div className="text-center text-sm text-muted-foreground">
          Números reservados: {reservation.numbers.sort((a, b) => a - b).join(", ")}
        </div>
      )}
    </div>
  );
}
