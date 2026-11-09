import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ShoppingBag,
  ChefHat,
  CheckCircle2,
  Receipt,
  XCircle,
  Clock,
  Printer,
  DollarSign,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { operationsService } from '@/services/operationsService';
import { OrderStatus } from '@/types/operations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const STATUS_LABELS: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'text-amber-500' },
  in_preparation: { label: 'Em Preparação', color: 'text-blue-500' },
  ready: { label: 'Pronto p/ Servir', color: 'text-emerald-500' },
  delivered: { label: 'Entregue ao Cliente', color: 'text-indigo-500' },
  paid: { label: 'Finalizado e Pago', color: 'text-green-600' },
  cancelled: { label: 'Cancelado', color: 'text-red-500' },
};

export function OrderDetailsPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { currentRestaurant } = useRestaurant();
  const navigate = useNavigate();

  const [refreshKey, setRefreshKey] = useState(0);

  const order = useMemo(() => {
    if (!currentRestaurant || !orderId) return null;
    return operationsService.getOrderById(currentRestaurant.id, orderId);
  }, [currentRestaurant, orderId, refreshKey]);

  if (!order) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-muted-foreground text-sm">Pedido não encontrado.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/app/orders">Voltar para Pedidos</Link>
        </Button>
      </div>
    );
  }

  const handleUpdateStatus = (newStatus: OrderStatus) => {
    if (!currentRestaurant) return;
    operationsService.updateOrderStatus(currentRestaurant.id, order.id, newStatus);
    toast.success(`Pedido #${order.code} atualizado para ${STATUS_LABELS[newStatus].label}!`);
    setRefreshKey((k) => k + 1);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/orders')}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Pedido #{order.code}
              </h1>
              <Badge variant="outline" className={`font-mono text-xs ${STATUS_LABELS[order.status].color}`}>
                {STATUS_LABELS[order.status].label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {order.type === 'table' ? `Mesa ${order.table_number}` : 'Balcão / Takeaway'} • Criado em{' '}
              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 gap-1.5 text-xs">
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
              {order.status === 'pending' && (
                <DropdownMenuItem
                  onClick={() => handleUpdateStatus('in_preparation')}
                  className="text-blue-600"
                >
                  <ChefHat className="h-3.5 w-3.5 mr-2" />
                  Mandar p/ Cozinha
                </DropdownMenuItem>
              )}
              {order.status === 'in_preparation' && (
                <DropdownMenuItem
                  onClick={() => handleUpdateStatus('ready')}
                  className="text-emerald-600"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                  Marcar como Pronto
                </DropdownMenuItem>
              )}
              {order.status === 'ready' && (
                <DropdownMenuItem
                  onClick={() => handleUpdateStatus('delivered')}
                  className="text-indigo-600"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                  Marcar como Entregue
                </DropdownMenuItem>
              )}
              {order.status !== 'paid' && order.status !== 'cancelled' && (
                <DropdownMenuItem onClick={() => navigate('/app/cashier')}>
                  <Receipt className="h-3.5 w-3.5 mr-2" />
                  Receber no Caixa
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {order.status !== 'paid' && order.status !== 'cancelled' && (
                <DropdownMenuItem
                  onClick={() => handleUpdateStatus('cancelled')}
                  className="text-destructive"
                >
                  <XCircle className="h-3.5 w-3.5 mr-2" />
                  Cancelar Pedido
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Itens do Pedido */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-primary" />
                Itens Solicitados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="divide-y divide-border/60 border border-border rounded-lg bg-card">
                {order.items.map((item) => (
                  <div key={item.id} className="p-4 flex items-start justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                        <span className="text-primary font-mono">{item.quantity}x</span>
                        <span>{item.product_name}</span>
                      </div>
                      {item.notes && (
                        <p className="text-[11px] text-muted-foreground italic mt-0.5">
                          Observação: {item.notes}
                        </p>
                      )}
                      {item.add_ons && item.add_ons.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.add_ons.map((ad) => (
                            <span
                              key={ad.id}
                              className="text-[10px] bg-muted/60 px-2 py-0.5 rounded border border-border/60"
                            >
                              + {ad.name} (R$ {ad.price.toFixed(2)})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-foreground">
                        R$ {item.total_price.toFixed(2)}
                      </span>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        R$ {item.unit_price.toFixed(2)} un.
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="rounded-lg bg-muted/30 p-3 text-xs border border-border">
                  <span className="font-semibold text-foreground">Observações Gerais:</span>
                  <p className="text-muted-foreground mt-0.5">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumo Financeiro & Metadados */}
        <div className="space-y-6">
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Resumo da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal dos itens:</span>
                <span className="font-mono text-foreground font-medium">
                  R$ {order.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Taxa de serviço (10%):</span>
                <span className="font-mono text-foreground font-medium">
                  R$ {order.service_fee.toFixed(2)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Desconto aplicado:</span>
                  <span className="font-mono">- R$ {order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-border pt-3 flex justify-between font-bold text-base text-foreground">
                <span>Total a Pagar:</span>
                <span className="font-mono text-primary">R$ {order.total.toFixed(2)}</span>
              </div>

              {order.payment_method && (
                <div className="rounded-md bg-emerald-500/10 p-2 text-center text-emerald-600 font-semibold text-xs border border-emerald-500/20">
                  Pago via {order.payment_method.toUpperCase()}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
                Dados do Atendimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium text-foreground">{order.customer_name || 'Balcão'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Atendente:</span>
                <span className="font-medium text-foreground">{order.waiter_name || 'Sistema'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Localização:</span>
                <span className="font-semibold text-foreground">
                  {order.type === 'table' ? `Mesa ${order.table_number}` : 'Balcão'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Abertura:</span>
                <span className="font-mono text-foreground">
                  {new Date(order.created_at).toLocaleTimeString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
