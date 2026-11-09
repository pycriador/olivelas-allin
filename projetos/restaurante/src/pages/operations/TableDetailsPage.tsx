import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import {
  ArrowLeft,
  QrCode,
  Users,
  Clock,
  Printer,
  ShoppingBag,
  CheckCircle2,
  Receipt,
  Plus,
  ExternalLink,
  Copy,
  Download,
  CreditCard,
  ChefHat,
  Search,
  Minus,
  UtensilsCrossed,
} from 'lucide-react';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { operationsService } from '@/services/operationsService';
import { menuService } from '@/services/menuService';
import { TableStatus } from '@/types/operations';
import { Product } from '@/types/menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function TableDetailsPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const { currentRestaurant } = useRestaurant();
  const navigate = useNavigate();

  const [refreshKey, setRefreshKey] = useState(0);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal: Abrir Comanda
  const [isComandaModalOpen, setIsComandaModalOpen] = useState(false);
  const [comandaCustomerName, setComandaCustomerName] = useState('');
  const [comandaWaiterName, setComandaWaiterName] = useState('Carlos Oliveira');
  const [comandaPartySize, setComandaPartySize] = useState('4');
  const [comandaNotes, setComandaNotes] = useState('');

  // Modal: Adicionar Item ao Pedido
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [menuProducts, setMenuProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  const table = useMemo(() => {
    if (!currentRestaurant || !tableId) return null;
    return operationsService.getTableById(currentRestaurant.id, tableId);
  }, [currentRestaurant, tableId, refreshKey]);

  const activeOrder = useMemo(() => {
    if (!currentRestaurant || !table?.current_order_id) return null;
    return operationsService.getOrderById(currentRestaurant.id, table.current_order_id);
  }, [currentRestaurant, table, refreshKey]);

  // Customer comanda public URL
  const customerComandaUrl = useMemo(() => {
    if (!currentRestaurant || !table) return '';
    return `${window.location.origin}/comanda/${table.id}?restaurant=${currentRestaurant.id}`;
  }, [currentRestaurant, table]);

  // Generate real scannable QR Code image
  useEffect(() => {
    if (customerComandaUrl) {
      QRCode.toDataURL(customerComandaUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#09090b',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('Erro ao gerar QR Code da mesa:', err));
    }
  }, [customerComandaUrl]);

  // Load menu products when Add Item modal is opened
  useEffect(() => {
    if (isAddItemModalOpen && currentRestaurant) {
      setLoadingProducts(true);
      menuService
        .getProducts(currentRestaurant.id, { page: 1, pageSize: 100, status: 'active' })
        .then((res) => {
          setMenuProducts(res.data);
          if (res.data.length > 0 && !selectedProductId) {
            setSelectedProductId(res.data[0].id);
          }
        })
        .catch((err) => {
          console.error('Erro ao carregar produtos do cardápio:', err);
        })
        .finally(() => setLoadingProducts(false));
    }
  }, [isAddItemModalOpen, currentRestaurant]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return menuProducts;
    const q = productSearch.toLowerCase().trim();
    return menuProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [menuProducts, productSearch]);

  const selectedProduct = useMemo(() => {
    return menuProducts.find((p) => p.id === selectedProductId) || null;
  }, [menuProducts, selectedProductId]);

  if (!table) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-muted-foreground text-sm">Mesa não encontrada.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/app/tables">Voltar para Mesas</Link>
        </Button>
      </div>
    );
  }

  const handleStatusChange = (newStatus: TableStatus) => {
    if (!currentRestaurant) return;
    operationsService.updateTableStatus(currentRestaurant.id, table.id, newStatus);
    toast.success(`Status da mesa atualizado com sucesso!`);
    setRefreshKey((k) => k + 1);
  };

  const handlePrintQr = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(customerComandaUrl);
    setCopiedLink(true);
    toast.success('Link da comanda digital copiado!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `qrcode-${table.label.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
    toast.success('QR Code baixado com sucesso!');
  };

  // Flow: Abrir Comanda
  const handleOpenComandaModal = () => {
    setComandaCustomerName(table.label);
    setComandaWaiterName(table.waiter_name || 'Carlos Oliveira');
    setComandaPartySize(table.capacity.toString());
    setComandaNotes('');
    setIsComandaModalOpen(true);
  };

  const handleConfirmOpenComanda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant || !table) return;

    try {
      operationsService.openTableComanda(currentRestaurant.id, table.id, {
        customer_name: comandaCustomerName.trim() || table.label,
        waiter_name: comandaWaiterName.trim() || 'Atendente',
        party_size: parseInt(comandaPartySize, 10) || table.capacity,
        notes: comandaNotes.trim() || undefined,
      });

      toast.success(`Comanda aberta com sucesso para ${table.label}!`);
      setIsComandaModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao abrir comanda.');
    }
  };

  // Flow: Adicionar Item ao Pedido
  const handleConfirmAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant || !activeOrder) return;

    const product = menuProducts.find((p) => p.id === selectedProductId);
    if (!product) {
      toast.error('Selecione um produto do cardápio.');
      return;
    }
    if (itemQuantity <= 0) {
      toast.error('Informe uma quantidade válida.');
      return;
    }

    try {
      operationsService.addItemToOrder(currentRestaurant.id, activeOrder.id, {
        product_id: product.id,
        product_name: product.name,
        quantity: itemQuantity,
        unit_price: product.price,
        notes: itemNotes.trim() || undefined,
      });

      toast.success(`${itemQuantity}x ${product.name} adicionado(s) à comanda!`);
      setIsAddItemModalOpen(false);
      setItemQuantity(1);
      setItemNotes('');
      setProductSearch('');
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar item.');
    }
  };

  // Flow: Enviar para Cozinha
  const handleSendToKitchen = () => {
    if (!currentRestaurant || !activeOrder) return;
    if (activeOrder.items.length === 0) {
      toast.error('Adicione itens à comanda antes de enviar para a cozinha.');
      return;
    }

    try {
      operationsService.sendOrderToKitchen(currentRestaurant.id, activeOrder.id);
      toast.success(
        `Pedido #${activeOrder.code} enviado para a cozinha! O status agora é "Em Preparação".`
      );
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar pedido para a cozinha.');
    }
  };

  // Flow: Liberar Mesa
  const handleReleaseTable = () => {
    if (!currentRestaurant || !table) return;
    if (
      confirm(
        `Deseja realmente liberar a ${table.label}? A comanda será encerrada e a mesa ficará disponível no salão.`
      )
    ) {
      operationsService.updateTableStatus(currentRestaurant.id, table.id, 'available');
      toast.success(`${table.label} liberada com sucesso!`);
      setRefreshKey((k) => k + 1);
    }
  };

  const isBillRequested = table.status === 'bill_requested';

  return (
    <div className="space-y-6">
      {/* Bill Requested Alert Banner */}
      {isBillRequested && activeOrder && (
        <div className="rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/5 p-4 sm:p-5 shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Receipt className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">
                    Conta Solicitada na {table.label}!
                  </h2>
                  <Badge
                    variant="outline"
                    className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[10px] uppercase font-bold"
                  >
                    Aguardando Pagamento
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  O cliente solicitou o fechamento da conta pelo autoatendimento. Valor total a receber:{' '}
                  <strong className="text-foreground font-mono text-sm">
                    R$ {activeOrder.total.toFixed(2)}
                  </strong>
                  .
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(customerComandaUrl, '_blank')}
                className="h-8 text-xs gap-1.5 bg-background/80"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ver Comanda do Cliente
              </Button>

              <Button
                size="sm"
                onClick={() => navigate('/app/cashier')}
                className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <CreditCard className="h-3.5 w-3.5" />
                Receber no Caixa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/tables')}
            className="h-8 w-8 p-0 shrink-0"
            title="Voltar para Mesas"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{table.label}</h1>
              <Badge variant="outline" className="font-mono text-xs uppercase bg-muted">
                {table.area}
              </Badge>
              {isBillRequested && (
                <Badge
                  variant="outline"
                  className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-semibold"
                >
                  Conta Solicitada
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Capacidade para até {table.capacity} pessoas sentadas •{' '}
              {table.waiter_name ? `Atendido por ${table.waiter_name}` : 'Sem atendente'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrintQr} className="h-8 gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" />
            Imprimir Comanda
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                Ações ▾
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 text-xs">
              {table.status === 'available' ? (
                <DropdownMenuItem onClick={handleOpenComandaModal} className="text-emerald-600 font-medium">
                  <UtensilsCrossed className="h-3.5 w-3.5 mr-2" />
                  Abrir Comanda
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleReleaseTable} className="text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                  Liberar Mesa
                </DropdownMenuItem>
              )}

              {activeOrder && (
                <>
                  <DropdownMenuItem onClick={() => setIsAddItemModalOpen(true)}>
                    <Plus className="h-3.5 w-3.5 mr-2 text-primary" />
                    Adicionar Itens / Pedido
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSendToKitchen}>
                    <ChefHat className="h-3.5 w-3.5 mr-2 text-amber-600" />
                    Enviar para a Cozinha
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('bill_requested')}>
                    <Receipt className="h-3.5 w-3.5 mr-2 text-amber-500" />
                    Marcar como Conta Solicitada
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => window.open(customerComandaUrl, '_blank')}>
                <ExternalLink className="h-3.5 w-3.5 mr-2 text-primary" />
                Abrir Comanda do Cliente
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="h-3.5 w-3.5 mr-2" />
                Copiar Link da Comanda
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleDownloadQr}>
                <Download className="h-3.5 w-3.5 mr-2" />
                Baixar QR Code (PNG)
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => navigate('/app/orders')}>
                <ShoppingBag className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                Ver Todos os Pedidos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Real QR Code & Table Metadata */}
        <div className="space-y-6">
          <Card className="border-border shadow-xs text-center overflow-hidden">
            <CardHeader className="pb-2 bg-muted/20 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <QrCode className="h-3.5 w-3.5 text-primary" />
                  QR Code da Mesa
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium"
                >
                  Ativo &amp; Funcional
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-5">
              {/* Real Scannable QR Code */}
              <div className="mx-auto w-52 bg-white p-3 rounded-2xl border-2 border-border shadow-inner flex flex-col items-center justify-center">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt={`QR Code ${table.label}`}
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Gerando QR Code...</span>
                  </div>
                )}
                <div className="pt-2 text-center border-t border-zinc-200 w-full mt-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-900 block">
                    {table.label}
                  </span>
                  <span className="text-[9px] text-zinc-500 block">
                    Autoatendimento &amp; Comanda
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Clientes podem escanear este código para abrir o cardápio, acompanhar o consumo em tempo
                real e <strong>pedir a conta</strong>.
              </p>

              {/* QR Code Action Buttons */}
              <div className="space-y-2 pt-1 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(customerComandaUrl, '_blank')}
                  className="w-full h-8 text-xs gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-primary" />
                  Abrir Comanda Digital
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="h-8 text-xs gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    {copiedLink ? 'Copiado!' : 'Copiar Link'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadQr}
                    className="h-8 text-xs gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Baixar PNG
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table Details Metadata */}
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 bg-muted/20 border-b border-border/50">
              <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                Status Atual do Salão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs pt-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Estado da Mesa:</span>
                <span className="font-semibold capitalize text-foreground flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isBillRequested
                        ? 'bg-amber-500 animate-pulse'
                        : table.status === 'occupied'
                        ? 'bg-amber-500'
                        : table.status === 'reserved'
                        ? 'bg-blue-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  {isBillRequested
                    ? 'Conta Solicitada'
                    : table.status === 'occupied'
                    ? 'Ocupada'
                    : table.status === 'reserved'
                    ? 'Reservada'
                    : 'Livre'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Atendente Responsável:</span>
                <span className="font-medium text-foreground">
                  {table.waiter_name || 'Nenhum atribuído'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Tempo Ocupada:</span>
                <span className="font-mono text-foreground">
                  {table.occupied_at ? '45 min' : 'Livre'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Capacidade Máxima:</span>
                <span className="font-mono text-foreground">{table.capacity} lugares</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Active Order / Comanda */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between bg-muted/20 border-b border-border/50">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Comanda Ativa da Mesa
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Itens e consumação vinculados a esta mesa.
                </p>
              </div>

              {activeOrder && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddItemModalOpen(true)}
                    className="h-8 text-xs gap-1.5 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    + Adicionar Pedido
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent className="pt-4">
              {activeOrder ? (
                <div className="space-y-4">
                  {/* Order Overview Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted/40 p-3 rounded-lg border border-border text-xs gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">
                          Pedido #{activeOrder.code}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          Cliente: <strong className="text-foreground">{activeOrder.customer_name}</strong>
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Atendido por {activeOrder.waiter_name || 'Equipe'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeOrder.status === 'in_preparation' ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 font-semibold"
                        >
                          <ChefHat className="h-3 w-3 animate-spin" />
                          Em Preparação na Cozinha
                        </Badge>
                      ) : activeOrder.status === 'ready' ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 font-semibold"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Pronto para Servir
                        </Badge>
                      ) : activeOrder.status === 'delivered' ? (
                        <Badge
                          variant="outline"
                          className="bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1 font-semibold"
                        >
                          <UtensilsCrossed className="h-3 w-3" />
                          Entregue à Mesa
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-rose-500/10 text-rose-600 border-rose-500/30 gap-1 font-semibold"
                        >
                          <Clock className="h-3 w-3" />
                          Pendente de Envio
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Items List */}
                  {activeOrder.items.length > 0 ? (
                    <div className="divide-y divide-border/60 rounded-lg border border-border bg-card">
                      {activeOrder.items.map((item) => (
                        <div key={item.id} className="p-3 text-xs flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-foreground">
                              {item.quantity}x {item.product_name}
                            </p>
                            {item.notes && (
                              <p className="text-[11px] text-muted-foreground italic">
                                Obs: {item.notes}
                              </p>
                            )}
                            {item.add_ons && item.add_ons.length > 0 && (
                              <div className="text-[10px] text-muted-foreground mt-0.5 space-x-2">
                                {item.add_ons.map((ad) => (
                                  <span key={ad.id} className="bg-muted px-1.5 py-0.5 rounded">
                                    + {ad.name} (R$ {ad.price.toFixed(2)})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="font-mono font-semibold text-foreground">
                            R$ {item.total_price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed border-border rounded-lg text-xs space-y-2">
                      <p className="text-muted-foreground">Nenhum item adicionado ainda nesta comanda.</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddItemModalOpen(true)}
                        className="h-8 text-xs gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Lançar Primeiro Item
                      </Button>
                    </div>
                  )}

                  {/* Totais & Fechamento */}
                  <div className="rounded-xl bg-muted/20 p-4 border border-border/80 space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal dos itens:</span>
                      <span className="font-mono">R$ {activeOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Taxa de serviço sugerida (10%):</span>
                      <span className="font-mono">R$ {activeOrder.service_fee.toFixed(2)}</span>
                    </div>
                    {activeOrder.discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Desconto aplicado:</span>
                        <span className="font-mono">- R$ {activeOrder.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-2 flex justify-between font-bold text-base text-foreground">
                      <span>Total da Comanda:</span>
                      <span className="font-mono text-primary text-xl">
                        R$ {activeOrder.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddItemModalOpen(true)}
                        className="w-full sm:w-auto h-9 sm:h-8 text-xs gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5 text-primary" />
                        Adicionar Item
                      </Button>

                      <Button
                        size="sm"
                        onClick={handleSendToKitchen}
                        disabled={activeOrder.items.length === 0}
                        className="w-full sm:w-auto h-9 sm:h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5"
                      >
                        <ChefHat className="h-3.5 w-3.5" />
                        Enviar para Cozinha
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(customerComandaUrl, '_blank')}
                        className="w-full sm:w-auto h-9 sm:h-8 text-xs gap-1.5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Comanda Digital
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => navigate('/app/cashier')}
                        className="w-full sm:w-auto h-9 sm:h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Receber no Caixa
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-border rounded-lg space-y-3">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground/60" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Nenhuma comanda aberta</p>
                    <p className="text-[11px] text-muted-foreground">
                      Esta mesa está atualmente livre para novos clientes.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleOpenComandaModal}
                    className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    <UtensilsCrossed className="h-3.5 w-3.5" />
                    Abrir Comanda
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: Abrir Comanda */}
      <Modal
        isOpen={isComandaModalOpen}
        onClose={() => setIsComandaModalOpen(false)}
        title={`Abrir Comanda • ${table.label}`}
        asDrawerOnMobile={true}
      >
        <form onSubmit={handleConfirmOpenComanda} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="custName" className="text-xs">
              Nome do Cliente / Identificação
            </Label>
            <Input
              id="custName"
              value={comandaCustomerName}
              onChange={(e) => setComandaCustomerName(e.target.value)}
              placeholder="Ex: Família Santos, João..."
              className="h-9 sm:h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="custWaiter" className="text-xs">
                Garçom / Atendente
              </Label>
              <Input
                id="custWaiter"
                value={comandaWaiterName}
                onChange={(e) => setComandaWaiterName(e.target.value)}
                placeholder="Nome do garçom"
                className="h-9 sm:h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="custParty" className="text-xs">
                Nº de Pessoas
              </Label>
              <Input
                id="custParty"
                type="number"
                min="1"
                max="50"
                value={comandaPartySize}
                onChange={(e) => setComandaPartySize(e.target.value)}
                className="h-9 sm:h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="custNotes" className="text-xs">
              Observações Iniciais
            </Label>
            <Input
              id="custNotes"
              value={comandaNotes}
              onChange={(e) => setComandaNotes(e.target.value)}
              placeholder="Ex: Aniversariante, preferência de mesa, etc."
              className="h-9 sm:h-8 text-xs"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsComandaModalOpen(false)}
              className="w-full sm:w-auto h-11 sm:h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="w-full sm:w-auto h-11 sm:h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <UtensilsCrossed className="h-3.5 w-3.5 mr-1.5" />
              Confirmar &amp; Abrir Comanda
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Adicionar Itens ao Pedido */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title="Adicionar Itens ao Pedido"
        asDrawerOnMobile={true}
      >
        <form onSubmit={handleConfirmAddItem} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Buscar no Cardápio</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Digite o nome do prato ou bebida..."
                className="pl-8 h-9 sm:h-8 text-xs"
              />
            </div>
          </div>

          {/* Product Selection List */}
          <div className="space-y-1.5">
            <Label className="text-xs">Selecione o Prato / Bebida</Label>
            <div className="max-h-52 overflow-y-auto rounded-lg border border-border divide-y divide-border/60">
              {loadingProducts ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Carregando produtos do cardápio...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Nenhum produto encontrado.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedProductId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProductId(p.id)}
                      className={`w-full text-left p-2.5 flex items-center justify-between text-xs transition-colors ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted/40 text-foreground'
                      }`}
                    >
                      <div>
                        <p className="font-semibold leading-tight">{p.name}</p>
                        {p.short_description && (
                          <p className="text-[10px] text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                            {p.short_description}
                          </p>
                        )}
                      </div>
                      <span className="font-mono font-bold shrink-0 ml-2">
                        R$ {p.price.toFixed(2)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Item Preview & Quantity */}
          {selectedProduct && (
            <div className="p-3 bg-muted/40 rounded-lg border border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">{selectedProduct.name}</p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  Unitário: R$ {selectedProduct.price.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
                  className="h-8 w-8 p-0"
                  disabled={itemQuantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-mono font-bold text-xs">{itemQuantity}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setItemQuantity((q) => q + 1)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="itemNotes" className="text-xs">
              Observações do Item (Opcional)
            </Label>
            <Input
              id="itemNotes"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              placeholder="Ex: Ponto da carne, sem cebola, gelo e limão à parte..."
              className="h-9 sm:h-8 text-xs"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddItemModalOpen(false)}
              className="w-full sm:w-auto h-11 sm:h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!selectedProductId}
              className="w-full sm:w-auto h-11 sm:h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Adicionar ao Pedido (R${' '}
              {selectedProduct ? (selectedProduct.price * itemQuantity).toFixed(2) : '0.00'})
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
