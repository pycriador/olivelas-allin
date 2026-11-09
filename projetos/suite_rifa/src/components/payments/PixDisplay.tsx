import { useState, useEffect, useCallback } from "react";
import { Copy, Check, Clock, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PixDisplayProps {
  pixCode: string;
  pixQrBase64: string | null;
  expiresAt: string | null;
  amount: number;
  currency?: string;
  onExpired?: () => void;
}

export function PixDisplay({
  pixCode,
  pixQrBase64,
  expiresAt,
  amount,
  currency = "BRL",
  onExpired,
}: PixDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!expiresAt) return;

    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expirado");
        onExpired?.();
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(pixCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [pixCode]);

  const formatMoney = (v: number, cur: string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: cur }).format(v);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Escaneie o QR Code ou copie o código PIX</p>
        <p className="font-display text-2xl font-bold">{formatMoney(amount, currency)}</p>
      </div>

      {/* QR Code */}
      <Card>
        <CardContent className="flex items-center justify-center pt-6">
          {pixQrBase64 ? (
            <img
              src={`data:image/png;base64,${pixQrBase64}`}
              alt="QR Code PIX"
              className="h-56 w-56 rounded-lg border"
            />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center rounded-lg border bg-muted">
              <QrCode className="size-12 text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* PIX Code (Copia e Cola) */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Pix Copia e Cola</p>
        <div className="flex gap-2">
          <div className="flex-1 truncate rounded-lg border bg-muted px-3 py-2 font-mono text-xs">
            {pixCode}
          </div>
          <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>
      </div>

      {/* Countdown */}
      {expiresAt && timeLeft && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" />
          <span>
            {timeLeft === "Expirado" ? (
              <span className="text-destructive font-medium">Código expirado</span>
            ) : (
              <>Expira em <span className="font-mono font-medium text-foreground">{timeLeft}</span></>
            )}
          </span>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Após o pagamento, seus números serão liberados automaticamente.
      </p>
    </div>
  );
}
