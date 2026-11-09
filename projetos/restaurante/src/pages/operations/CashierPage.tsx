import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Receipt,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  QrCode,
  Banknote,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Printer,
  MoreVertical,
} from 'lucide-react';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useAuth } from '@/contexts/AuthContext';
import { operationsService } from '@/services/operationsService';
import {
  CashierShift,
  CashTransaction,
  Order,
  PaymentMethod,
} from '@/types/operations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ResponsiveTable } from '@/components/common/ResponsiveTable';
import { Modal } from '@/components/ui/modal';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, { label: string; icon: any }> = {
  cash: { label: 'Dinheiro', icon: Banknote },
  pix: { label: 'PIX', icon: QrCode },
  credit: { label: 'Cartão de Crédito', icon: CreditCard },
  debit: { label: 'Cartão de Débito', icon: CreditCard },
  voucher: { label: 'Vale Refeição (VR)', icon: Receipt },
};

export function CashierPage() {
  const { currentRestaurant } = useRestaurant();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shift, setShift] = useState<CashierShift | null>(() => {
    return currentRestaurant ? operationsService.getCurrentShift(currentRestaurant.id) : null;
  });

  const [transactions, setTransactions] = useState<CashTransaction[]>(() => {
    return currentRestaurant ? operationsService.getTransactions(currentRestaurant.id) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    return currentRestaurant ? operationsService.getOrders(currentRestaurant.id) : [];
  });

  // Modais
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedOrderToPay, setSelectedOrderToPay] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [cashTendered, setCashTendered] = useState('');

  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'cash_in' | 'cash_out'>('cash_out');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDesc, setMovementDesc] = useState('');

  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [actualCashCount, setActualCashCount] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('200.00');

  const refreshData = () => {
    if (currentRestaurant) {
      setShift(operationsService.getCurrentShift(currentRestaurant.id));
      setTransactions(operationsService.getTransactions(currentRestaurant.id));
      setOrders(operationsService.getOrders(currentRestaurant.id));
    }
  };

  const pendingPaymentOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'paid' && o.status !== 'cancelled');
  }, [orders]);

  // Handlers
  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant) return;
    const balance = parseFloat(openingBalance);
    if (isNaN(balance) || balance < 0) {
      toast.error('Informe um saldo de abertura válido.');
      return;
    }
    operationsService.openShift(
      currentRestaurant.id,
      user?.id || 'usr-1',
      user?.name || user?.email || 'Operador',
      balance
    );
    toast.success('Turno de caixa aberto com sucesso!');
    setIsOpenShiftModalOpen(false);
    refreshData();
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant || !shift) return;
    const actual = parseFloat(actualCashCount);
    if (isNaN(actual) || actual < 0) {
      toast.error('Informe o valor físico apurado na gaveta.');
      return;
    }

    const closed = operationsService.closeShift(
      currentRestaurant.id,
      shift.id,
      actual,
      closingNotes
    );
    const diff = closed.difference || 0;
    if (diff === 0) {
      toast.success('Turno fechado com sucesso! Caixa bateu exatamente.');
    } else if (diff > 0) {
      toast.success(`Turno fechado! Sobra de caixa de R$ ${diff.toFixed(2)} registrada.`);
    } else {
      toast.warning(`Turno fechado! Diferença/falta de R$ ${Math.abs(diff).toFixed(2)} registrada.`);
    }
    setIsCloseShiftModalOpen(false);
    refreshData();
  };

  const handleCashMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant || !shift) return;
    const amt = parseFloat(movementAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Informe um valor válido.');
      return;
    }
    if (!movementDesc.trim()) {
      toast.error('Informe a justificativa da movimentação.');
      return;
    }

    operationsService.addCashMovement(
      currentRestaurant.id,
      shift.id,
      movementType,
      amt,
      movementDesc.trim()
    );
    toast.success(
      movementType === 'cash_out'
        ? `Sangria de R$ ${amt.toFixed(2)} realizada!`
        : `Suprimento de R$ ${amt.toFixed(2)} registrado!`
    );
    setIsCashMovementModalOpen(false);
    setMovementAmount('');
    setMovementDesc('');
    refreshData();
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant || !selectedOrderToPay) return;

    const discount = parseFloat(discountAmount) || 0;
    operationsService.payOrder(
      currentRestaurant.id,
      selectedOrderToPay.id,
      paymentMethod,
      discount
    );

    toast.success(`Pagamento do Pedido #${selectedOrderToPay.code} recebido com sucesso!`);
    setIsPaymentModalOpen(false);
    setSelectedOrderToPay(null);
    setDiscountAmount('0');
    setCashTendered('');
    refreshData();
  };

  // Cálculo de troco para dinheiro
  const totalDue = selectedOrderToPay
    ? Math.max(0, +(selectedOrderToPay.subtotal + selectedOrderToPay.service_fee - (parseFloat(discountAmount) || 0)).toFixed(2))
    : 0;

  const changeDue =
    paymentMethod === 'cash' && cashTendered
      ? Math.max(0, +(parseFloat(cashTendered) - totalDue).toFixed(2))
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary" />
              Caixa &amp; PDV
            </h1>
            <Badge
              variant="outline"
              className={
                shift?.status === 'open'
                  ? 'border-emerald-500/40 text-emerald-500 font-mono text-[10px]'
                  : 'border-muted-foreground/40 text-muted-foreground font-mono text-[10px]'
              }
            >
              {shift?.status === 'open' ? '🟢 Turno Aberto' : '⚪ Caixa Fechado'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Controle de turnos, recebimento de comandas, conciliação e sangrias.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {shift?.status === 'open' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMovementType('cash_out');
                  setIsCashMovementModalOpen(true);
                }}
                className="h-8 gap-1.5 text-xs text-amber-600 border-amber-600/30 hover:bg-amber-500/10"
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                Sangria / Suprimento
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActualCashCount(shift.expected_cash.toString());
                  setIsCloseShiftModalOpen(true);
                }}
                className="h-8 gap-1.5 text-xs text-red-600 border-red-600/30 hover:bg-red-500/10"
              >
                <Lock className="h-3.5 w-3.5" />
                Fechar Turno
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsOpenShiftModalOpen(true)}
              className="h-8 gap-1.5 text-xs font-semibold"
            >
              <Unlock className="h-3.5 w-3.5" />
              Abrir Caixa
            </Button>
          )}
        </div>
      </div>

      {/* Caixa KPIs */}
      {shift?.status === 'open' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Abertura de Caixa</p>
                <p className="text-xl font-bold text-foreground mt-0.5 font-mono">
                  R$ {shift.opening_balance.toFixed(2)}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Banknote className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Vendas do Turno</p>
                <p className="text-xl font-bold text-emerald-500 mt-0.5 font-mono">
                  R$ {shift.total_sales.toFixed(2)}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Sangrias (Retiradas)</p>
                <p className="text-xl font-bold text-amber-500 mt-0.5 font-mono">
                  - R$ {shift.cash_out.toFixed(2)}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Gaveta Estimada</p>
                <p className="text-xl font-bold text-primary mt-0.5 font-mono">
                  R$ {shift.expected_cash.toFixed(2)}
                </p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grid com 2 Abas/Seções: Pedidos Aguardando Pagamento & Extrato do Turno */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos Aguardando Pagamento */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Comandas Aguardando Fechamento ({pendingPaymentOrders.length})
            </h2>
          </div>

          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
            <ResponsiveTable>
              <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pendingPaymentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Todas as comandas foram encerradas e pagas.
                    </td>
                  </tr>
                ) : (
                  pendingPaymentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-foreground">
                        #{order.code}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {order.type === 'table' ? `Mesa ${order.table_number}` : 'Balcão'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {order.customer_name || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-primary">
                        R$ {order.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono text-[10px] capitalize">
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                              Ações ▾
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-xs">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrderToPay(order);
                                setIsPaymentModalOpen(true);
                              }}
                              className="text-emerald-600 font-semibold focus:text-emerald-600"
                            >
                              <DollarSign className="h-3.5 w-3.5 mr-2" />
                              Receber Pagamento
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/app/orders/${order.id}`)}>
                              <Eye className="h-3.5 w-3.5 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => window.print()}>
                              <Printer className="h-3.5 w-3.5 mr-2" />
                              Imprimir Pré-Conta
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </ResponsiveTable>
          </div>
        </div>

        {/* Extrato de Transações do Caixa */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Banknote className="h-4 w-4 text-emerald-500" />
              Extrato do Turno
            </h2>
            <span className="text-[11px] font-mono text-muted-foreground">
              {transactions.length} registros
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-border rounded-lg text-xs text-muted-foreground">
                Nenhuma movimentação registrada no turno atual.
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-lg border border-border/80 bg-card p-3 text-xs space-y-1 hover:border-border transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground truncate max-w-[180px]">
                      {tx.description}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        tx.type === 'cash_out' ? 'text-amber-500' : 'text-emerald-500'
                      }`}
                    >
                      {tx.type === 'cash_out' ? '-' : '+'} R$ {tx.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="capitalize">{tx.payment_method}</span>
                    <span className="font-mono">
                      {new Date(tx.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Receber Pagamento */}
      <Modal
        isOpen={Boolean(isPaymentModalOpen && selectedOrderToPay)}
        onClose={() => setIsPaymentModalOpen(false)}
        title={selectedOrderToPay ? `Recebimento • Pedido #${selectedOrderToPay.code}` : ''}
        description={
          selectedOrderToPay
            ? `${selectedOrderToPay.type === 'table' ? `Mesa ${selectedOrderToPay.table_number}` : 'Balcão'} • ${selectedOrderToPay.customer_name}`
            : ''
        }
        asDrawerOnMobile={true}
      >
        {selectedOrderToPay && (
          <form onSubmit={handleProcessPayment} className="space-y-4">
              {/* Formas de Pagamento Grid */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Forma de Pagamento:</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([k, item]) => {
                    const Icon = item.icon;
                    const isSel = paymentMethod === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setPaymentMethod(k as PaymentMethod)}
                        className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-colors text-xs font-medium ${
                          isSel
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Desconto */}
              <div className="space-y-1.5">
                <Label htmlFor="disc" className="text-xs">
                  Desconto Concedido (R$)
                </Label>
                <Input
                  id="disc"
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              {/* Se Dinheiro: campo de valor entregue e troco */}
              {paymentMethod === 'cash' && (
                <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2 text-xs">
                  <div className="space-y-1">
                    <Label htmlFor="tendered" className="text-xs">
                      Valor Entregue pelo Cliente (R$)
                    </Label>
                    <Input
                      id="tendered"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 100.00"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  {parseFloat(cashTendered) > 0 && (
                    <div className="flex justify-between items-center pt-1 font-bold">
                      <span>Troco a devolver:</span>
                      <span className="font-mono text-emerald-500 text-sm">
                        R$ {changeDue.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Totais */}
              <div className="rounded-lg bg-primary/10 border border-primary/30 p-3 text-xs space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal + Taxa (10%):</span>
                  <span className="font-mono">
                    R$ {(selectedOrderToPay.subtotal + selectedOrderToPay.service_fee).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t border-primary/20">
                  <span>Total Final a Cobrar:</span>
                  <span className="font-mono text-primary text-base">R$ {totalDue.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2 border-t border-border pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-full sm:w-auto h-11 sm:h-8 text-xs"
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="w-full sm:w-auto h-11 sm:h-8 text-xs bg-emerald-600 hover:bg-emerald-700 font-semibold">
                  Confirmar Pagamento
                </Button>
              </div>
            </form>
          )}
      </Modal>

      {/* Modal Abertura de Caixa */}
      <Modal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
        title="Abrir Turno de Caixa"
        description="Defina o valor em dinheiro para troco no início do expediente."
        maxWidth="sm"
        asDrawerOnMobile={true}
      >
        <form onSubmit={handleOpenShift} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="openBal" className="text-xs">
              Saldo de Abertura / Fundo de Troco (R$) *
            </Label>
            <Input
              id="openBal"
              type="number"
              step="0.01"
              min="0"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              required
              className="h-9 sm:h-8 text-xs font-mono"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2 border-t border-border pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpenShiftModalOpen(false)}
              className="w-full sm:w-auto h-11 sm:h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="w-full sm:w-auto h-11 sm:h-8 text-xs font-semibold">
              Confirmar Abertura
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Sangria / Suprimento */}
      <Modal
        isOpen={isCashMovementModalOpen}
        onClose={() => setIsCashMovementModalOpen(false)}
        title="Movimentação Avulsa de Caixa"
        description="Registre retiradas (sangria) ou depósitos (suprimento) na gaveta."
        maxWidth="sm"
        asDrawerOnMobile={true}
      >
        <form onSubmit={handleCashMovement} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de Movimento:</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMovementType('cash_out')}
                className={`p-2.5 rounded-lg text-xs font-medium border min-h-[44px] transition-colors ${
                  movementType === 'cash_out'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-500 font-bold'
                    : 'border-border text-muted-foreground'
                }`}
              >
                Sangria (Saída)
              </button>
              <button
                type="button"
                onClick={() => setMovementType('cash_in')}
                className={`p-2.5 rounded-lg text-xs font-medium border min-h-[44px] transition-colors ${
                  movementType === 'cash_in'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-bold'
                    : 'border-border text-muted-foreground'
                }`}
              >
                Suprimento (Entrada)
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="movAmt" className="text-xs">
              Valor em Reais (R$) *
            </Label>
            <Input
              id="movAmt"
              type="number"
              step="0.01"
              min="0.01"
              value={movementAmount}
              onChange={(e) => setMovementAmount(e.target.value)}
              required
              className="h-9 sm:h-8 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="movDesc" className="text-xs">
              Justificativa / Descrição *
            </Label>
            <Input
              id="movDesc"
              placeholder="Ex: Compra de gelo de emergência"
              value={movementDesc}
              onChange={(e) => setMovementDesc(e.target.value)}
              required
              className="h-9 sm:h-8 text-xs"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2 border-t border-border pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCashMovementModalOpen(false)}
              className="w-full sm:w-auto h-11 sm:h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="w-full sm:w-auto h-11 sm:h-8 text-xs font-semibold">
              Registrar Movimento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Fechamento de Turno */}
      <Modal
        isOpen={Boolean(isCloseShiftModalOpen && shift)}
        onClose={() => setIsCloseShiftModalOpen(false)}
        title="Fechamento do Turno"
        description="Conferência física de dinheiro na gaveta e encerramento do caixa."
        maxWidth="sm"
        asDrawerOnMobile={true}
      >
        {shift && (
          <form onSubmit={handleCloseShift} className="space-y-4">
            <div className="p-3 rounded-lg border border-border bg-muted/20 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gaveta Estimada pelo Sistema:</span>
                <span className="font-mono font-bold text-foreground">
                  R$ {shift.expected_cash.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="actualCash" className="text-xs">
                Valor Físico Apurado na Gaveta (R$) *
              </Label>
              <Input
                id="actualCash"
                type="number"
                step="0.01"
                min="0"
                value={actualCashCount}
                onChange={(e) => setActualCashCount(e.target.value)}
                required
                className="h-9 sm:h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="closeNotes" className="text-xs">
                Observações do Fechamento
              </Label>
              <Input
                id="closeNotes"
                placeholder="Ex: Tudo conferido sem divergências"
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                className="h-9 sm:h-8 text-xs"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2 border-t border-border pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCloseShiftModalOpen(false)}
                className="w-full sm:w-auto h-11 sm:h-8 text-xs"
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="w-full sm:w-auto h-11 sm:h-8 text-xs bg-red-600 hover:bg-red-700 font-semibold">
                Fechar Caixa
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
