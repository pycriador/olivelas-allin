import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  ChefHat,
  Receipt,
  XCircle,
  MoreVertical,
  DollarSign,
  ShoppingBag,
} from 'lucide-react';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { operationsService } from '@/services/operationsService';
import { Order, OrderStatus, OrderType, OrderItem } from '@/types/operations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ResponsiveTable } from '@/components/common/ResponsiveTable';
import { Modal } from '@/components/ui/modal';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  pending: {
    label: 'Pendente',
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/30',
  },
  in_preparation: {
    label: 'Em Preparo',
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/30',
  },
  ready: {
    label: 'Pronto p/ Servir',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    border: 'border-emerald-500/30',
  },
  delivered: {
    label: 'Entregue',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-500',
    border: 'border-indigo-500/30',
  },
  paid: {
    label: 'Pago / Finalizado',
    bg: 'bg-green-500/10',
    text: 'text-green-600',
    border: 'border-green-500/30',
  },
  cancelled: {
    label: 'Cancelado',
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    border: 'border-red-500/30',
  },
};

const TYPE_LABELS: Record<OrderType, string> = {
  table: 'Mesa / Salão',
  counter: 'Balcão / Takeaway',
  delivery: 'Delivery',
  takeaway: 'Retirada',
};

// Produtos padrão para montagem rápida de pedido
const DEFAULT_CATALOG_ITEMS = [
  { id: 'p1', name: 'Bacalhau à Gomes de Sá', price: 115.0 },
  { id: 'p2', name: 'Polvo à Lagareiro', price: 78.0 },
  { id: 'p3', name: 'Arroz de Marisco Tradicional', price: 68.0 },
  { id: 'p4', name: 'Francesinha do Porto', price: 48.0 },
  { id: 'p5', name: 'Pastel de Nata (4 un)', price: 32.0 },
  { id: 'p6', name: 'Vinho Tinto Alentejano Reserva', price: 39.0 },
  { id: 'p7', name: 'Água das Pedras com Gás', price: 7.0 },
  { id: 'p8', name: 'Café Expresso Duplo', price: 13.0 },
];

export function OrdersPage() {
  const { currentRestaurant } = useRestaurant();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>(() => {
    return currentRestaurant ? operationsService.getOrders(currentRestaurant.id) : [];
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal Novo Pedido
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('table');
  const [tableNumber, setTableNumber] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [waiterName, setWaiterName] = useState('Carlos Oliveira');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<
    Array<{ product_id: string; product_name: string; price: number; quantity: number }>
  >([
    { product_id: 'p1', product_name: 'Bacalhau à Gomes de Sá', price: 115.0, quantity: 1 },
  ]);

  const refreshOrders = () => {
    if (currentRestaurant) {
      setOrders(operationsService.getOrders(currentRestaurant.id));
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (typeFilter !== 'all' && o.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchCode = o.code.toLowerCase().includes(q);
        const matchCust = o.customer_name?.toLowerCase().includes(q);
        const matchTable = o.table_number?.toString().includes(q);
        if (!matchCode && !matchCust && !matchTable) return false;
      }
      return true;
    });
  }, [orders, statusFilter, typeFilter, search]);

  // KPIs
  const totalCount = orders.length;
  const activeCount = orders.filter((o) => ['pending', 'in_preparation', 'ready'].includes(o.status)).length;
  const paidCount = orders.filter((o) => o.status === 'paid').length;
  const totalSales = orders
    .filter((o) => o.status === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  const handleAdvanceStatus = (order: Order, nextStatus: OrderStatus) => {
    if (!currentRestaurant) return;
    operationsService.updateOrderStatus(currentRestaurant.id, order.id, nextStatus);
    toast.success(`Pedido #${order.code} atualizado para ${STATUS_CONFIG[nextStatus].label}!`);
    refreshOrders();
  };

  const handleCancelOrder = (order: Order) => {
    if (!currentRestaurant) return;
    if (confirm(`Deseja cancelar o Pedido #${order.code}?`)) {
      operationsService.updateOrderStatus(currentRestaurant.id, order.id, 'cancelled');
      toast.success(`Pedido #${order.code} foi cancelado.`);
      refreshOrders();
    }
  };

  const handleAddItemToOrder = (productId: string) => {
    const found = DEFAULT_CATALOG_ITEMS.find((p) => p.id === productId);
    if (!found) return;

    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.product_id === productId);
      if (existing) {
        return prev.map((i) =>
          i.product_id === productId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product_id: found.id, product_name: found.name, price: found.price, quantity: 1 }];
    });
  };

  const handleRemoveItemFromOrder = (productId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItemFromOrder(productId);
      return;
    }
    setSelectedItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, quantity } : i))
    );
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant) return;
    if (selectedItems.length === 0) {
      toast.error('Adicione pelo menos 1 item ao pedido.');
      return;
    }

    const items: OrderItem[] = selectedItems.map((i) => ({
      id: 'item-' + Math.random().toString(36).slice(2, 7),
      product_id: i.product_id,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: i.price,
      total_price: +(i.price * i.quantity).toFixed(2),
      add_ons: [],
    }));

    const num = orderType === 'table' ? parseInt(tableNumber, 10) : undefined;

    const newOrder = operationsService.createOrder(currentRestaurant.id, {
      type: orderType,
      table_number: num,
      customer_name: customerName.trim() || (num ? `Mesa ${num}` : 'Cliente Balcão'),
      waiter_name: waiterName.trim() || 'Atendente',
      items,
      notes: notes.trim() || undefined,
    });

    toast.success(`Pedido #${newOrder.code} aberto com sucesso!`);
    setIsModalOpen(false);
    refreshOrders();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Pedidos &amp; Comandas
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary font-mono text-[10px]">
              Fase Operacional
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerenciamento do fluxo de atendimento, cozinha e encerramento de pedidos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setSelectedItems([
                { product_id: 'p1', product_name: 'Bacalhau à Gomes de Sá', price: 115.0, quantity: 1 },
              ]);
              setIsModalOpen(true);
            }}
            className="h-9 gap-1.5 text-xs font-medium shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total de Pedidos</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{totalCount}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Em Andamento</p>
              <p className="text-2xl font-bold text-amber-500 mt-0.5">{activeCount}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Finalizados / Pagos</p>
              <p className="text-2xl font-bold text-emerald-500 mt-0.5">{paidCount}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Faturamento Hoje</p>
              <p className="text-2xl font-bold text-foreground mt-0.5 font-mono">
                R$ {totalSales.toFixed(2)}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card/40 p-3 rounded-lg border border-border">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="in_preparation">Em Preparo</option>
            <option value="ready">Pronto</option>
            <option value="delivered">Entregue</option>
            <option value="paid">Pago</option>
            <option value="cancelled">Cancelado</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todos os Tipos</option>
            <option value="table">Mesa / Salão</option>
            <option value="counter">Balcão</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Buscar por código, cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
        <ResponsiveTable>
          <table className="w-full text-xs text-left">
          <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Tipo / Local</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Itens</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Criado em</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum pedido encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const st = STATUS_CONFIG[order.status];
                return (
                  <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">
                      <Link
                        to={`/app/orders/${order.id}`}
                        className="hover:underline text-primary"
                      >
                        #{order.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">
                        {order.type === 'table' ? `Mesa ${order.table_number}` : TYPE_LABELS[order.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium">
                      {order.customer_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {order.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-foreground">
                      R$ {order.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.bg} ${st.text} ${st.border}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* Radix Dropdown Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                            Ações ▾
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 text-xs">
                          <DropdownMenuItem onClick={() => navigate(`/app/orders/${order.id}`)}>
                            <Eye className="h-3.5 w-3.5 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>

                          {order.status === 'pending' && (
                            <DropdownMenuItem
                              onClick={() => handleAdvanceStatus(order, 'in_preparation')}
                              className="text-blue-600 focus:text-blue-600"
                            >
                              <ChefHat className="h-3.5 w-3.5 mr-2" />
                              Enviar p/ Cozinha
                            </DropdownMenuItem>
                          )}

                          {order.status === 'in_preparation' && (
                            <DropdownMenuItem
                              onClick={() => handleAdvanceStatus(order, 'ready')}
                              className="text-emerald-600 focus:text-emerald-600"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                              Marcar como Pronto
                            </DropdownMenuItem>
                          )}

                          {order.status === 'ready' && (
                            <DropdownMenuItem
                              onClick={() => handleAdvanceStatus(order, 'delivered')}
                              className="text-indigo-600 focus:text-indigo-600"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                              Marcar como Entregue
                            </DropdownMenuItem>
                          )}

                          {order.status !== 'paid' && order.status !== 'cancelled' && (
                            <DropdownMenuItem onClick={() => navigate('/app/cashier')}>
                              <Receipt className="h-3.5 w-3.5 mr-2" />
                              Pagar no Caixa
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          {order.status !== 'paid' && order.status !== 'cancelled' && (
                            <DropdownMenuItem
                              onClick={() => handleCancelOrder(order)}
                              className="text-destructive focus:text-destructive"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-2" />
                              Cancelar Pedido
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </ResponsiveTable>
      </div>

      {/* Modal Novo Pedido */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Abrir Novo Pedido"
        description="Adicione itens ao pedido e encaminhe para a fila de preparo"
        asDrawerOnMobile={true}
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="orderType" className="text-xs">
                    Tipo de Atendimento *
                  </Label>
                  <select
                    id="orderType"
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as OrderType)}
                    className="w-full h-8 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="table">Mesa / Salão</option>
                    <option value="counter">Balcão</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>

                {orderType === 'table' ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="tableNumber" className="text-xs">
                      Número da Mesa *
                    </Label>
                    <Input
                      id="tableNumber"
                      type="number"
                      min="1"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="custName" className="text-xs">
                      Nome do Cliente *
                    </Label>
                    <Input
                      id="custName"
                      placeholder="Ex: Maria Santos"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Itens do Cardápio para Adicionar */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">
                  Selecione os Itens do Cardápio:
                </Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border border-border rounded-lg bg-muted/20">
                  {DEFAULT_CATALOG_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAddItemToOrder(item.id)}
                      className="p-2 text-left rounded-md bg-background hover:bg-accent border border-border/60 transition-colors text-xs flex flex-col justify-between"
                    >
                      <span className="font-medium text-foreground truncate">{item.name}</span>
                      <span className="font-mono text-primary font-bold text-[11px] mt-1">
                        + R$ {item.price.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Itens Selecionados no Pedido */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">
                  Comanda Atual ({selectedItems.length} itens):
                </Label>
                <div className="space-y-1.5 border border-border rounded-lg p-2.5 bg-background">
                  {selectedItems.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-center justify-between text-xs py-1 border-b border-border/40 last:border-0"
                    >
                      <span className="font-medium text-foreground truncate max-w-[180px]">
                        {item.product_name}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-border rounded">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                            className="px-2 py-0.5 text-xs hover:bg-muted"
                          >
                            -
                          </button>
                          <span className="px-2 font-mono text-xs font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                            className="px-2 py-0.5 text-xs hover:bg-muted"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-mono font-bold text-foreground w-16 text-right">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItemFromOrder(item.product_id)}
                          className="text-red-500 hover:text-red-700 text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs">
                  Observações da Cozinha
                </Label>
                <Input
                  id="notes"
                  placeholder="Ex: Ponto da carne, sem cebola..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              {/* Resumo do Total */}
              <div className="rounded-lg bg-muted/40 p-3 text-xs flex justify-between items-center font-bold">
                <span>Subtotal Estimado:</span>
                <span className="text-base text-primary font-mono">
                  R${' '}
                  {selectedItems
                    .reduce((sum, i) => sum + i.price * i.quantity, 0)
                    .toFixed(2)}
                </span>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2 border-t border-border pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto h-11 sm:h-8 text-xs"
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="w-full sm:w-auto h-11 sm:h-8 text-xs font-semibold">
                  Criar Pedido &amp; Mandar p/ Cozinha
                </Button>
              </div>
            </form>
      </Modal>
    </div>
  );
}
