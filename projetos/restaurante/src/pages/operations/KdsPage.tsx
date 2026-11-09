import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Eye,
  MoreVertical,
  Volume2,
  VolumeX,
  Filter,
} from 'lucide-react';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { operationsService } from '@/services/operationsService';
import { Order, OrderStatus } from '@/types/operations';
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

export function KdsPage() {
  const { currentRestaurant } = useRestaurant();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const refreshKds = () => {
    if (currentRestaurant) {
      setOrders(operationsService.getKdsOrders(currentRestaurant.id));
    }
  };

  useEffect(() => {
    refreshKds();
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [currentRestaurant]);

  const handleAdvanceStatus = (order: Order) => {
    if (!currentRestaurant) return;
    const updated = operationsService.advanceKdsStatus(currentRestaurant.id, order.id);
    toast.success(`Pedido #${order.code} avançado para o próximo estágio!`);
    refreshKds();
  };

  // Group by status
  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === 'pending'),
    [orders]
  );
  const inPrepOrders = useMemo(
    () => orders.filter((o) => o.status === 'in_preparation'),
    [orders]
  );
  const readyOrders = useMemo(
    () => orders.filter((o) => o.status === 'ready'),
    [orders]
  );

  const getElapsedMinutes = (dateStr: string) => {
    const diffMs = currentTime.getTime() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const getTimerBadge = (minutes: number) => {
    if (minutes < 10) {
      return (
        <span className="flex items-center gap-1 font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-xs">
          <Clock className="h-3 w-3" /> {minutes} min
        </span>
      );
    }
    if (minutes < 20) {
      return (
        <span className="flex items-center gap-1 font-mono text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded text-xs">
          <Clock className="h-3 w-3" /> {minutes} min
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 font-mono text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded text-xs animate-pulse">
        <AlertTriangle className="h-3 w-3" /> {minutes} min (Atraso)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header do KDS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-primary" />
              Cozinha &amp; KDS
            </h1>
            <Badge variant="outline" className="border-primary/40 text-primary font-mono text-[10px]">
              Display em Tempo Real
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor de produção para praças de cozinha, bar e controle de comandas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Som Ativo / Silencioso */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              toast.info(soundEnabled ? 'Avisos sonoros desativados' : 'Avisos sonoros ativados');
            }}
            className="h-8 gap-1.5 text-xs"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-primary" /> Som Ativo
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-muted-foreground" /> Mudo
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshKds}
            className="h-8 gap-1.5 text-xs"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Seletor de Praças / Filtro */}
      <div className="flex items-center justify-between bg-card/40 p-2.5 rounded-lg border border-border">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-muted-foreground font-semibold px-2 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Praça:
          </span>
          <button
            onClick={() => setSelectedStation('all')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              selectedStation === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Todas as Praças ({orders.length})
          </button>
          <button
            onClick={() => setSelectedStation('hot')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              selectedStation === 'hot'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Fogão &amp; Forno
          </button>
          <button
            onClick={() => setSelectedStation('bar')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              selectedStation === 'bar'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Bar &amp; Bebidas
          </button>
        </div>

        <div className="text-xs font-mono text-muted-foreground hidden md:block">
          Horário local: <span className="text-foreground font-bold">{currentTime.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Grid de 3 Colunas KDS Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna 1: Pendentes / Novos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-amber-500">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">
                Novos Pedidos
              </h2>
            </div>
            <Badge variant="outline" className="font-mono text-amber-500 border-amber-500/40">
              {pendingOrders.length}
            </Badge>
          </div>

          <div className="space-y-3">
            {pendingOrders.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-lg text-xs text-muted-foreground">
                Nenhum pedido novo pendente.
              </div>
            ) : (
              pendingOrders.map((order) => {
                const minutes = getElapsedMinutes(order.created_at);
                return (
                  <Card
                    key={order.id}
                    className="border-amber-500/40 bg-card shadow-xs transition-shadow hover:shadow-md"
                  >
                    <CardHeader className="p-3.5 pb-2 border-b border-border/60">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-sm text-foreground">
                            #{order.code}
                          </span>
                          <span className="ml-2 font-semibold text-xs text-primary">
                            {order.type === 'table' ? `Mesa ${order.table_number}` : 'Balcão'}
                          </span>
                        </div>
                        {getTimerBadge(minutes)}
                      </div>
                    </CardHeader>
                    <CardContent className="p-3.5 space-y-3 text-xs">
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="border-b border-border/40 pb-1.5 last:border-0">
                            <div className="font-bold text-foreground flex items-center justify-between">
                              <span>
                                {item.quantity}x {item.product_name}
                              </span>
                            </div>
                            {item.notes && (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium italic mt-0.5">
                                Obs: {item.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-border/60">
                        <Button
                          size="sm"
                          onClick={() => handleAdvanceStatus(order)}
                          className="h-8 w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs gap-1.5"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          Iniciar Preparo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna 2: Em Preparo */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-blue-500">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">
                Em Preparação
              </h2>
            </div>
            <Badge variant="outline" className="font-mono text-blue-500 border-blue-500/40">
              {inPrepOrders.length}
            </Badge>
          </div>

          <div className="space-y-3">
            {inPrepOrders.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-lg text-xs text-muted-foreground">
                Nenhum prato em cocção no momento.
              </div>
            ) : (
              inPrepOrders.map((order) => {
                const minutes = getElapsedMinutes(order.created_at);
                return (
                  <Card
                    key={order.id}
                    className="border-blue-500/40 bg-card shadow-xs transition-shadow hover:shadow-md"
                  >
                    <CardHeader className="p-3.5 pb-2 border-b border-border/60">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-sm text-foreground">
                            #{order.code}
                          </span>
                          <span className="ml-2 font-semibold text-xs text-primary">
                            {order.type === 'table' ? `Mesa ${order.table_number}` : 'Balcão'}
                          </span>
                        </div>
                        {getTimerBadge(minutes)}
                      </div>
                    </CardHeader>
                    <CardContent className="p-3.5 space-y-3 text-xs">
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="border-b border-border/40 pb-1.5 last:border-0">
                            <div className="font-bold text-foreground">
                              {item.quantity}x {item.product_name}
                            </div>
                            {item.notes && (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium italic mt-0.5">
                                Obs: {item.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-border/60">
                        <Button
                          size="sm"
                          onClick={() => handleAdvanceStatus(order)}
                          className="h-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Marcar como Pronto
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna 3: Prontos para Servir */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-500">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">
                Prontos p/ Servir
              </h2>
            </div>
            <Badge variant="outline" className="font-mono text-emerald-500 border-emerald-500/40">
              {readyOrders.length}
            </Badge>
          </div>

          <div className="space-y-3">
            {readyOrders.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-lg text-xs text-muted-foreground">
                Nenhum prato aguardando retirada.
              </div>
            ) : (
              readyOrders.map((order) => {
                const minutes = getElapsedMinutes(order.created_at);
                return (
                  <Card
                    key={order.id}
                    className="border-emerald-500/40 bg-card shadow-xs transition-shadow hover:shadow-md"
                  >
                    <CardHeader className="p-3.5 pb-2 border-b border-border/60">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-sm text-foreground">
                            #{order.code}
                          </span>
                          <span className="ml-2 font-semibold text-xs text-emerald-600">
                            {order.type === 'table' ? `Mesa ${order.table_number}` : 'Balcão'}
                          </span>
                        </div>
                        {getTimerBadge(minutes)}
                      </div>
                    </CardHeader>
                    <CardContent className="p-3.5 space-y-3 text-xs">
                      <div className="space-y-1.5">
                        {order.items.map((item) => (
                          <div key={item.id} className="text-foreground font-semibold">
                            {item.quantity}x {item.product_name}
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-border/60">
                        <Button
                          size="sm"
                          onClick={() => handleAdvanceStatus(order)}
                          className="h-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Entregar ao Garçom
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
