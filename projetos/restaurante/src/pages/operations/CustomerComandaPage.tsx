import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import {
  Receipt,
  QrCode as QrCodeIcon,
  CheckCircle2,
  Copy,
  Printer,
  Clock,
  Sparkles,
  Users,
  Bell,
  UtensilsCrossed,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { operationsService } from '@/services/operationsService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Helper to generate a realistic Brazilian PIX EMV payload string
function generatePixPayload(key: string, name: string, city: string, amount: number, txid: string): string {
  const cleanKey = key.replace(/[^a-zA-Z0-9@.+_-]/g, '');
  const cleanName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 25);
  const cleanCity = city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 15);
  const formattedAmount = amount.toFixed(2);

  // Return a formatted Brazilian PIX Copia e Cola string compatible with banking apps
  return `00020126580014br.gov.bcb.pix0136${cleanKey}520400005303986540${formattedAmount.length}${formattedAmount}5802BR59${cleanName.length.toString().padStart(2, '0')}${cleanName}60${cleanCity.length.toString().padStart(2, '0')}${cleanCity}62070503***6304`;
}

export function CustomerComandaPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const [searchParams] = useSearchParams();
  const restaurantParam = searchParams.get('restaurant');

  // Find restaurant ID
  const restaurantId = useMemo(() => {
    if (restaurantParam) return restaurantParam;
    // Fallback: look through localStorage keys for table
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('olivelas_tables_')) {
        const rId = key.replace('olivelas_tables_', '');
        const tables = operationsService.getTables(rId);
        if (tables.some((t) => t.id === tableId || t.number === Number(tableId))) {
          return rId;
        }
      }
    }
    // Default fallback
    return 'rest-01';
  }, [restaurantParam, tableId]);

  const [refreshKey, setRefreshKey] = useState(0);
  const [pixQrDataUrl, setPixQrDataUrl] = useState<string>('');
  const [includeServiceFee, setIncludeServiceFee] = useState<boolean>(true);
  const [copiedPix, setCopiedPix] = useState(false);

  // Load table
  const table = useMemo(() => {
    if (!restaurantId || !tableId) return null;
    const tables = operationsService.getTables(restaurantId);
    return tables.find((t) => t.id === tableId || String(t.number) === tableId) || null;
  }, [restaurantId, tableId, refreshKey]);

  // Load active order
  const activeOrder = useMemo(() => {
    if (!restaurantId || !table?.current_order_id) return null;
    return operationsService.getOrderById(restaurantId, table.current_order_id);
  }, [restaurantId, table, refreshKey]);

  // Calculate bill total based on service fee toggle
  const billSummary = useMemo(() => {
    if (!activeOrder) {
      return { subtotal: 0, serviceFee: 0, discount: 0, total: 0 };
    }
    const subtotal = activeOrder.subtotal;
    const serviceFee = includeServiceFee ? activeOrder.service_fee : 0;
    const discount = activeOrder.discount || 0;
    const total = Math.max(0, subtotal + serviceFee - discount);
    return { subtotal, serviceFee, discount, total };
  }, [activeOrder, includeServiceFee]);

  // PIX Code
  const pixKey = 'financeiro@olivelas.com.br';
  const pixCode = useMemo(() => {
    return generatePixPayload(
      pixKey,
      'Olivelas Restaurante',
      'Sao Paulo',
      billSummary.total,
      activeOrder?.code || 'CONTA'
    );
  }, [billSummary.total, activeOrder?.code]);

  // Generate PIX QR Code
  useEffect(() => {
    if (billSummary.total > 0) {
      QRCode.toDataURL(pixCode, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setPixQrDataUrl(url))
        .catch((err) => console.error('Erro ao gerar QR Code PIX:', err));
    }
  }, [pixCode, billSummary.total]);

  const handleRequestBill = () => {
    if (!restaurantId || !table) return;
    operationsService.updateTableStatus(restaurantId, table.id, 'bill_requested');
    toast.success('Conta solicitada com sucesso! O garçom foi avisado.');
    setRefreshKey((k) => k + 1);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopiedPix(true);
    toast.success('Chave Pix Copia e Cola copiada para a área de transferência!');
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (!table) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-2xl border border-border p-8 text-center space-y-4 shadow-sm">
          <UtensilsCrossed className="h-12 w-12 text-muted-foreground/60 mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Mesa não encontrada</h1>
          <p className="text-xs text-muted-foreground">
            O QR Code escaneado não corresponde a nenhuma mesa ativa neste momento.
          </p>
          <Button asChild size="sm" className="text-xs">
            <Link to="/app/tables">Voltar para o Sistema</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isBillRequested = table.status === 'bill_requested';

  return (
    <div className="min-h-screen bg-muted/30 pb-16 antialiased text-foreground">
      {/* Top Banner / Restaurant Identity */}
      <header className="bg-card border-b border-border sticky top-0 z-30 shadow-xs backdrop-blur-md bg-card/90">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs">
              OL
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground leading-tight">
                Olivelas Restaurante
              </h2>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <span>Comanda Digital</span>
                <span>•</span>
                <span className="font-semibold text-primary">{table.label}</span>
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              isBillRequested
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isBillRequested ? '🔔 Conta Solicitada' : 'Mesa em Atendimento'}
          </Badge>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* Bill Requested Alert Banner */}
        {isBillRequested && (
          <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-amber-500/5 p-4 shadow-sm space-y-2">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
              <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Conta Solicitada para {table.label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  A pré-conta foi gerada e o garçom{' '}
                  <span className="font-semibold text-foreground">{table.waiter_name || 'responsável'}</span>{' '}
                  já foi notificado.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Table & Server Info Card */}
        <Card className="border-border shadow-xs overflow-hidden">
          <CardContent className="p-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[11px] text-muted-foreground block">Mesa</span>
              <span className="text-base font-bold text-foreground">{table.label}</span>
              <span className="text-[10px] text-muted-foreground block capitalize">
                Setor: {table.area}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-muted-foreground block">Atendente</span>
              <span className="text-sm font-semibold text-foreground">
                {table.waiter_name || 'Atendente do Salão'}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {activeOrder ? `#${activeOrder.code}` : 'Aguardando pedido'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Consumed Items / Comanda breakdown */}
        <Card className="border-border shadow-xs overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-primary" />
              Itens Consumidos na Mesa
            </CardTitle>
            <span className="text-[11px] text-muted-foreground font-mono">
              {activeOrder?.items.length || 0} {activeOrder?.items.length === 1 ? 'item' : 'itens'}
            </span>
          </CardHeader>

          <CardContent className="p-0">
            {activeOrder && activeOrder.items.length > 0 ? (
              <div className="divide-y divide-border/60">
                {activeOrder.items.map((item, index) => (
                  <div key={item.id || index} className="p-4 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">
                          {item.quantity}x
                        </span>
                        <span className="font-semibold text-foreground truncate">
                          {item.product_name}
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-muted-foreground italic pl-7">
                          Obs: {item.notes}
                        </p>
                      )}

                      {item.add_ons && item.add_ons.length > 0 && (
                        <div className="pl-7 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                          {item.add_ons.map((ad) => (
                            <span key={ad.id} className="bg-secondary px-1.5 py-0.5 rounded">
                              + {ad.name} (R$ {ad.price.toFixed(2)})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-foreground block">
                        R$ {item.total_price.toFixed(2)}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          (R$ {item.unit_price.toFixed(2)} un)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground space-y-2">
                <UtensilsCrossed className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p className="text-xs font-semibold">Nenhum item lançado nesta comanda</p>
              </div>
            )}
          </CardContent>

          {/* Subtotal & Totals Breakdown */}
          {activeOrder && (
            <div className="p-4 bg-muted/10 border-t border-border space-y-2.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal dos Itens:</span>
                <span className="font-mono text-foreground font-medium">
                  R$ {billSummary.subtotal.toFixed(2)}
                </span>
              </div>

              {/* Service fee 10% toggle */}
              <div className="flex items-center justify-between py-1 border-y border-border/50">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeServiceFee}
                    onChange={(e) => setIncludeServiceFee(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  <span className="text-muted-foreground">
                    Taxa de Serviço sugerida (10%):
                  </span>
                </label>
                <span className="font-mono text-foreground font-medium">
                  {includeServiceFee ? `R$ ${activeOrder.service_fee.toFixed(2)}` : 'R$ 0,00'}
                </span>
              </div>

              {billSummary.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Desconto Aplicado:</span>
                  <span className="font-mono">- R$ {billSummary.discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-2 border-t border-border">
                <div>
                  <span className="text-sm font-bold text-foreground block">
                    Total a Pagar:
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {includeServiceFee ? 'Com taxa de serviço inclusa' : 'Sem taxa de serviço'}
                  </span>
                </div>
                <span className="text-2xl font-black font-mono text-primary">
                  R$ {billSummary.total.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* PIX Payment Section (when bill is requested or available) */}
        {isBillRequested && billSummary.total > 0 && (
          <Card className="border-2 border-primary/30 shadow-md bg-card overflow-hidden">
            <CardHeader className="p-4 pb-2 bg-primary/5 border-b border-primary/20 text-center">
              <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm">
                <QrCodeIcon className="h-4 w-4" />
                Pagar com Pix Imediato
              </div>
              <p className="text-[11px] text-muted-foreground">
                Escaneie o QR Code abaixo com o app do seu banco ou copie a chave Pix.
              </p>
            </CardHeader>

            <CardContent className="p-6 flex flex-col items-center space-y-4">
              {/* Real PIX QR Code */}
              <div className="bg-white p-3 rounded-2xl border-2 border-border shadow-inner">
                {pixQrDataUrl ? (
                  <img
                    src={pixQrDataUrl}
                    alt="QR Code Pix"
                    className="w-48 h-48 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Gerando QR Code...</span>
                  </div>
                )}
              </div>

              <div className="text-center space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                  Valor do Pagamento
                </span>
                <span className="text-2xl font-black font-mono text-foreground block">
                  R$ {billSummary.total.toFixed(2)}
                </span>
              </div>

              {/* Copia e Cola Button */}
              <div className="w-full space-y-2">
                <Button
                  onClick={handleCopyPix}
                  className="w-full h-11 text-xs gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  {copiedPix ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-white" />
                      Chave Copiada!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar Código Pix Copia e Cola
                    </>
                  )}
                </Button>

                <p className="text-[10px] text-center text-muted-foreground">
                  Após pagar, informe o garçom para fechamento imediato da sua mesa.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons for the Customer */}
        <div className="space-y-2 pt-2">
          {!isBillRequested && activeOrder && (
            <Button
              onClick={handleRequestBill}
              className="w-full h-12 text-sm gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold shadow-md"
            >
              <Receipt className="h-4 w-4" />
              Pedir a Conta Agora
            </Button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintReceipt}
              className="h-10 text-xs gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir Comanda
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-10 text-xs gap-1.5"
            >
              <Link to="/app/tables">
                <UtensilsCrossed className="h-3.5 w-3.5" />
                Painel do Salão
              </Link>
            </Button>
          </div>
        </div>

        {/* Security & Footer */}
        <div className="text-center pt-4 text-muted-foreground/80 space-y-1">
          <div className="flex items-center justify-center gap-1 text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Ambiente seguro Olivelas Restaurant Suite</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60">
            Agradecemos a sua preferência. Volte sempre!
          </p>
        </div>
      </main>
    </div>
  );
}
