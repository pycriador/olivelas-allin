import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  LayoutGrid,
  List,
  Plus,
  Users,
  Clock,
  Receipt,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  QrCode,
  Sparkles,
  MapPin,
  Calendar,
  Phone,
  UserCheck,
  UtensilsCrossed,
} from 'lucide-react';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { operationsService } from '@/services/operationsService';
import { RestaurantTable, TableArea, TableStatus, RestaurantArea } from '@/types/operations';
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

const AREA_LABELS: Record<TableArea, string> = {
  main_hall: 'Salão Principal',
  patio: 'Varanda / Deck',
  balcony: 'Sacada',
  bar: 'Área do Bar',
  vip: 'Espaço VIP',
};

const STATUS_CONFIG: Record<
  TableStatus,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  available: {
    label: 'Livre',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-500',
    dot: 'bg-emerald-500',
  },
  occupied: {
    label: 'Ocupada',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-500',
    dot: 'bg-amber-500',
  },
  bill_requested: {
    label: 'Conta Solicitada',
    bg: 'bg-red-500/10',
    border: 'border-red-500/40 animate-pulse',
    text: 'text-red-500',
    dot: 'bg-red-500',
  },
  reserved: {
    label: 'Reservada',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-500',
    dot: 'bg-blue-500',
  },
  cleaning: {
    label: 'Em Limpeza',
    bg: 'bg-muted/40',
    border: 'border-muted-foreground/30',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
};

export function TablesPage() {
  const { currentRestaurant } = useRestaurant();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const areaQuery = searchParams.get('area');

  const [tables, setTables] = useState<RestaurantTable[]>(() => {
    return currentRestaurant ? operationsService.getTables(currentRestaurant.id) : [];
  });

  const [areas, setAreas] = useState<RestaurantArea[]>(() => {
    return currentRestaurant ? operationsService.getAreas(currentRestaurant.id) : [];
  });

  const [selectedArea, setSelectedArea] = useState<string>(areaQuery || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    if (areaQuery) {
      setSelectedArea(areaQuery);
    }
  }, [areaQuery]);

  // Modal State - Table CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [tableLabel, setTableLabel] = useState('');
  const [tableArea, setTableArea] = useState<TableArea>('main_hall');
  const [tableCapacity, setTableCapacity] = useState('4');
  const [tableNotes, setTableNotes] = useState('');

  // Modal State - Abrir Comanda
  const [isComandaModalOpen, setIsComandaModalOpen] = useState(false);
  const [tableForComanda, setTableForComanda] = useState<RestaurantTable | null>(null);
  const [comandaCustomerName, setComandaCustomerName] = useState('');
  const [comandaWaiterName, setComandaWaiterName] = useState('Carlos Oliveira');
  const [comandaPartySize, setComandaPartySize] = useState('2');
  const [comandaNotes, setComandaNotes] = useState('');

  // Modal State - Reservar Mesa
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [tableForReservation, setTableForReservation] = useState<RestaurantTable | null>(null);
  const [reserveCustomerName, setReserveCustomerName] = useState('');
  const [reserveContactPhone, setReserveContactPhone] = useState('');
  const [reserveTime, setReserveTime] = useState('Hoje às 20:00');
  const [reservePartySize, setReservePartySize] = useState('4');
  const [reserveNotes, setReserveNotes] = useState('');

  // Reload data
  const refreshTables = () => {
    if (currentRestaurant) {
      setTables(operationsService.getTables(currentRestaurant.id));
      setAreas(operationsService.getAreas(currentRestaurant.id));
    }
  };

  const getAreaLabel = (areaCode: string) => {
    const found = areas.find((a) => a.code === areaCode || a.id === areaCode);
    if (found) return found.name;
    const defaults: Record<string, string> = {
      main_hall: 'Salão Principal',
      patio: 'Varanda / Deck',
      balcony: 'Sacada',
      bar: 'Área do Bar',
      vip: 'Espaço VIP',
    };
    return defaults[areaCode] || areaCode;
  };

  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      if (selectedArea !== 'all' && t.area !== selectedArea) return false;
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesLabel = t.label.toLowerCase().includes(q);
        const matchesNumber = t.number.toString().includes(q);
        const matchesWaiter = t.waiter_name?.toLowerCase().includes(q);
        if (!matchesLabel && !matchesNumber && !matchesWaiter) return false;
      }
      return true;
    });
  }, [tables, selectedArea, selectedStatus, search]);

  // KPIs
  const totalCount = tables.length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const billRequestedCount = tables.filter((t) => t.status === 'bill_requested').length;
  const occupancyRate = totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0;

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingTable(null);
    setTableNumber((tables.length + 1).toString());
    setTableLabel(`Mesa ${(tables.length + 1).toString().padStart(2, '0')}`);
    setTableArea(areas.length > 0 ? areas[0].code : 'main_hall');
    setTableCapacity('4');
    setTableNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (table: RestaurantTable) => {
    setEditingTable(table);
    setTableNumber(table.number.toString());
    setTableLabel(table.label);
    setTableArea(table.area);
    setTableCapacity(table.capacity.toString());
    setTableNotes(table.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant) return;

    const num = parseInt(tableNumber, 10);
    const cap = parseInt(tableCapacity, 10);

    if (isNaN(num) || num <= 0) {
      toast.error('Informe um número de mesa válido.');
      return;
    }

    if (editingTable) {
      operationsService.updateTable(currentRestaurant.id, editingTable.id, {
        number: num,
        label: tableLabel.trim() || `Mesa ${num}`,
        area: tableArea,
        capacity: isNaN(cap) || cap <= 0 ? 4 : cap,
        notes: tableNotes.trim() || undefined,
      });
      toast.success('Mesa atualizada com sucesso!');
    } else {
      operationsService.createTable(currentRestaurant.id, {
        number: num,
        label: tableLabel.trim() || `Mesa ${num}`,
        area: tableArea,
        capacity: isNaN(cap) || cap <= 0 ? 4 : cap,
        notes: tableNotes.trim() || undefined,
      });
      toast.success('Nova mesa adicionada ao salão!');
    }

    setIsModalOpen(false);
    refreshTables();
  };

  const handleStatusChange = (table: RestaurantTable, newStatus: TableStatus) => {
    if (!currentRestaurant) return;
    operationsService.updateTableStatus(currentRestaurant.id, table.id, newStatus);
    toast.success(`Mesa ${table.number} atualizada para ${STATUS_CONFIG[newStatus].label}!`);
    refreshTables();
  };

  // Flow: Abrir Comanda
  const handleOpenComandaModal = (table: RestaurantTable) => {
    setTableForComanda(table);
    setComandaCustomerName(table.label);
    setComandaWaiterName(table.waiter_name || 'Carlos Oliveira');
    setComandaPartySize(table.capacity.toString());
    setComandaNotes('');
    setIsComandaModalOpen(true);
  };

  const handleConfirmOpenComanda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant || !tableForComanda) return;

    try {
      operationsService.openTableComanda(currentRestaurant.id, tableForComanda.id, {
        customer_name: comandaCustomerName.trim() || tableForComanda.label,
        waiter_name: comandaWaiterName.trim() || 'Atendente',
        party_size: parseInt(comandaPartySize, 10) || tableForComanda.capacity,
        notes: comandaNotes.trim() || undefined,
      });

      toast.success(`Comanda aberta com sucesso para ${tableForComanda.label}!`);
      setIsComandaModalOpen(false);
      refreshTables();
      navigate(`/app/tables/${tableForComanda.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao abrir comanda.');
    }
  };

  // Flow: Reservar Mesa
  const handleOpenReservationModal = (table: RestaurantTable) => {
    setTableForReservation(table);
    setReserveCustomerName('');
    setReserveContactPhone('');
    setReserveTime('Hoje às 20:00');
    setReservePartySize(table.capacity.toString());
    setReserveNotes('');
    setIsReservationModalOpen(true);
  };

  const handleConfirmReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant || !tableForReservation) return;

    if (!reserveCustomerName.trim()) {
      toast.error('Informe o nome para a reserva.');
      return;
    }

    try {
      operationsService.reserveTable(currentRestaurant.id, tableForReservation.id, {
        customer_name: reserveCustomerName.trim(),
        contact_phone: reserveContactPhone.trim() || undefined,
        reserved_for: reserveTime.trim(),
        party_size: parseInt(reservePartySize, 10) || tableForReservation.capacity,
        notes: reserveNotes.trim() || undefined,
      });

      toast.success(`Reserva confirmada para ${tableForReservation.label}!`);
      setIsReservationModalOpen(false);
      refreshTables();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao reservar mesa.');
    }
  };

  const handleCheckInReservation = (table: RestaurantTable) => {
    if (!currentRestaurant) return;
    try {
      operationsService.checkInReservation(currentRestaurant.id, table.id);
      toast.success(`Check-in realizado! Comanda aberta para ${table.label}.`);
      refreshTables();
      navigate(`/app/tables/${table.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao realizar check-in.');
    }
  };

  const handleCancelReservation = (table: RestaurantTable) => {
    if (!currentRestaurant) return;
    if (confirm(`Deseja cancelar a reserva da ${table.label} e liberá-la para o salão?`)) {
      operationsService.cancelReservation(currentRestaurant.id, table.id);
      toast.success(`Reserva da ${table.label} cancelada. Mesa livre!`);
      refreshTables();
    }
  };

  const handleDeleteTable = (table: RestaurantTable) => {
    if (!currentRestaurant) return;
    if (confirm(`Deseja realmente remover a Mesa ${table.number}?`)) {
      operationsService.deleteTable(currentRestaurant.id, table.id);
      toast.success(`Mesa ${table.number} removida com sucesso.`);
      refreshTables();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Mesas &amp; Salão
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary font-mono text-[10px]">
              Fase Operacional
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerenciamento em tempo real de ocupação, reservas, setores e comandas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Visualização em Tabela"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <Link to="/app/tables/areas">
              <MapPin className="h-4 w-4 text-primary" />
              Setores &amp; Ambientes
            </Link>
          </Button>

          <Button onClick={handleOpenCreateModal} className="h-9 gap-1.5 text-xs font-medium shadow-xs">
            <Plus className="h-4 w-4" />
            Nova Mesa
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total de Mesas</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{totalCount}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <LayoutGrid className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Mesas Ocupadas</p>
              <p className="text-2xl font-bold text-amber-500 mt-0.5">{occupiedCount}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Taxa de Ocupação</p>
              <p className="text-2xl font-bold text-emerald-500 mt-0.5">{occupancyRate}%</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Contas Solicitadas</p>
              <p className="text-2xl font-bold text-red-500 mt-0.5">{billRequestedCount}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-card/40 p-3 rounded-lg border border-border">
        <div className="flex flex-wrap items-center gap-2">
          {/* Area Selector */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-md text-xs border border-border/60 overflow-x-auto max-w-full">
            <button
              onClick={() => setSelectedArea('all')}
              className={`px-2.5 py-1 rounded text-xs transition-colors font-medium whitespace-nowrap ${
                selectedArea === 'all'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todos Setores
            </button>
            {areas
              .filter((a) => a.is_active)
              .map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedArea(a.code)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors font-medium whitespace-nowrap ${
                    selectedArea === a.code
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {a.name}
                </button>
              ))}
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todos os Status</option>
            <option value="available">🟢 Livre</option>
            <option value="occupied">🟡 Ocupada</option>
            <option value="bill_requested">🔴 Conta Solicitada</option>
            <option value="reserved">🔵 Reservada</option>
            <option value="cleaning">⚪ Limpeza</option>
          </select>
        </div>

        <div className="w-full md:w-64">
          <Input
            placeholder="Buscar por mesa, garçom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const st = STATUS_CONFIG[table.status];
            return (
              <Card
                key={table.id}
                className={`border transition-all duration-200 hover:shadow-md ${st.border} ${st.bg}`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-foreground">
                          {table.label}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                          <Users className="h-3 w-3" />
                          {table.capacity}p
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-medium">
                        {getAreaLabel(table.area)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.text} bg-background/80 border border-current/20`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>

                      {/* Dropdown Menu Ações */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-background/80">
                            <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 text-xs">
                          <DropdownMenuItem onClick={() => navigate(`/app/tables/${table.id}`)}>
                            <Eye className="h-3.5 w-3.5 mr-2 text-primary" />
                            Ver Detalhes &amp; QR
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {table.status === 'available' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleOpenComandaModal(table)}
                                className="text-emerald-600 focus:text-emerald-600 font-medium"
                              >
                                <UtensilsCrossed className="h-3.5 w-3.5 mr-2" />
                                Abrir Comanda
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenReservationModal(table)}
                                className="text-blue-600 focus:text-blue-600"
                              >
                                <Calendar className="h-3.5 w-3.5 mr-2" />
                                Reservar Mesa
                              </DropdownMenuItem>
                            </>
                          )}

                          {table.status === 'reserved' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleCheckInReservation(table)}
                                className="text-blue-600 focus:text-blue-600 font-medium"
                              >
                                <UserCheck className="h-3.5 w-3.5 mr-2" />
                                Check-in / Ocupar Mesa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCancelReservation(table)}
                                className="text-rose-600 focus:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Cancelar Reserva
                              </DropdownMenuItem>
                            </>
                          )}

                          {table.status === 'occupied' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => navigate(`/app/tables/${table.id}`)}
                                className="font-medium"
                              >
                                <UtensilsCrossed className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                Comanda &amp; Adicionar Pedido
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(table, 'bill_requested')}
                                className="text-rose-600 focus:text-rose-600"
                              >
                                <Receipt className="h-3.5 w-3.5 mr-2" />
                                Solicitar Conta
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(table, 'available')}
                                className="text-emerald-600 focus:text-emerald-600"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                Liberar Mesa
                              </DropdownMenuItem>
                            </>
                          )}

                          {table.status === 'bill_requested' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => navigate(`/app/tables/${table.id}`)}
                                className="text-rose-600 focus:text-rose-600 font-medium"
                              >
                                <Receipt className="h-3.5 w-3.5 mr-2" />
                                Ver Conta &amp; Pagamento
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(table, 'available')}
                                className="text-emerald-600 focus:text-emerald-600"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                Concluir &amp; Liberar Mesa
                              </DropdownMenuItem>
                            </>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem onClick={() => handleOpenEditModal(table)}>
                            <Edit2 className="h-3.5 w-3.5 mr-2" />
                            Editar Mesa
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleDeleteTable(table)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Excluir Mesa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Informações da ocupação / reserva */}
                  {table.status === 'occupied' && (
                    <div className="rounded-md bg-background/60 p-2.5 text-xs space-y-1 border border-border/40">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="h-3 w-3" /> Tempo:
                        </span>
                        <span className="font-mono text-foreground text-[11px]">~45 min</span>
                      </div>
                      {table.waiter_name && (
                        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                          <span>Atendente:</span>
                          <span className="font-medium text-foreground">{table.waiter_name}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {table.status === 'reserved' && (
                    <div className="rounded-md bg-blue-50/80 dark:bg-blue-950/40 p-2.5 text-xs space-y-1 border border-blue-200 dark:border-blue-900">
                      <div className="flex items-center justify-between text-blue-700 dark:text-blue-300">
                        <span className="flex items-center gap-1 text-[11px] font-semibold">
                          <Calendar className="h-3 w-3" /> Reserva Agendada
                        </span>
                      </div>
                      <p className="text-[11px] text-foreground font-medium truncate">
                        {table.notes || 'Cliente com reserva'}
                      </p>
                    </div>
                  )}

                  {table.status === 'available' && table.notes && (
                    <p className="text-[11px] text-muted-foreground italic truncate">
                      "{table.notes}"
                    </p>
                  )}

                  {/* Contextual Action Button */}
                  <div className="pt-1">
                    {table.status === 'available' && (
                      <div className="grid grid-cols-5 gap-1.5">
                        <Button
                          size="sm"
                          className="col-span-4 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          onClick={() => handleOpenComandaModal(table)}
                        >
                          <UtensilsCrossed className="h-3.5 w-3.5 mr-1.5" />
                          Abrir Comanda
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="col-span-1 h-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                          onClick={() => handleOpenReservationModal(table)}
                          title="Reservar Mesa"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}

                    {table.status === 'reserved' && (
                      <Button
                        size="sm"
                        className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        onClick={() => handleCheckInReservation(table)}
                      >
                        <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                        Check-in / Ocupar
                      </Button>
                    )}

                    {table.status === 'occupied' && (
                      <Button
                        size="sm"
                        className="w-full h-8 text-xs font-semibold"
                        onClick={() => navigate(`/app/tables/${table.id}`)}
                      >
                        <UtensilsCrossed className="h-3.5 w-3.5 mr-1.5" />
                        Comanda &amp; Pedidos
                      </Button>
                    )}

                    {table.status === 'bill_requested' && (
                      <Button
                        size="sm"
                        className="w-full h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold animate-pulse"
                        onClick={() => navigate(`/app/tables/${table.id}`)}
                      >
                        <Receipt className="h-3.5 w-3.5 mr-1.5" />
                        Ver Conta / Receber
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <ResponsiveTable>
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Mesa</th>
                <th className="px-4 py-3">Setor</th>
                <th className="px-4 py-3">Capacidade</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Garçom</th>
                <th className="px-4 py-3">Notas</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredTables.map((table) => {
                const st = STATUS_CONFIG[table.status];
                return (
                  <tr key={table.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <Link
                        to={`/app/tables/${table.id}`}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        {table.label}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {getAreaLabel(table.area)}
                    </td>
                    <td className="px-4 py-3 text-foreground font-mono">
                      {table.capacity} pessoas
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.text} ${st.bg} border ${st.border}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {table.waiter_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {table.notes || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                            Ações ▾
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 text-xs">
                          <DropdownMenuItem onClick={() => navigate(`/app/tables/${table.id}`)}>
                            <Eye className="h-3.5 w-3.5 mr-2 text-primary" />
                            Ver Detalhes &amp; QR
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {table.status === 'available' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleOpenComandaModal(table)}
                                className="text-emerald-600 focus:text-emerald-600 font-medium"
                              >
                                <UtensilsCrossed className="h-3.5 w-3.5 mr-2" />
                                Abrir Comanda
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenReservationModal(table)}
                                className="text-blue-600 focus:text-blue-600"
                              >
                                <Calendar className="h-3.5 w-3.5 mr-2" />
                                Reservar Mesa
                              </DropdownMenuItem>
                            </>
                          )}

                          {table.status === 'reserved' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleCheckInReservation(table)}
                                className="text-blue-600 focus:text-blue-600 font-medium"
                              >
                                <UserCheck className="h-3.5 w-3.5 mr-2" />
                                Check-in / Ocupar Mesa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCancelReservation(table)}
                                className="text-rose-600 focus:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Cancelar Reserva
                              </DropdownMenuItem>
                            </>
                          )}

                          {table.status === 'occupied' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => navigate(`/app/tables/${table.id}`)}
                                className="font-medium"
                              >
                                <UtensilsCrossed className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                Comanda &amp; Adicionar Pedido
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(table, 'bill_requested')}
                                className="text-rose-600 focus:text-rose-600"
                              >
                                <Receipt className="h-3.5 w-3.5 mr-2" />
                                Solicitar Conta
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(table, 'available')}
                                className="text-emerald-600 focus:text-emerald-600"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                Liberar Mesa
                              </DropdownMenuItem>
                            </>
                          )}

                          {table.status === 'bill_requested' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => navigate(`/app/tables/${table.id}`)}
                                className="text-rose-600 focus:text-rose-600 font-medium"
                              >
                                <Receipt className="h-3.5 w-3.5 mr-2" />
                                Ver Conta &amp; Pagamento
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(table, 'available')}
                                className="text-emerald-600 focus:text-emerald-600"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                Concluir &amp; Liberar Mesa
                              </DropdownMenuItem>
                            </>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem onClick={() => handleOpenEditModal(table)}>
                            <Edit2 className="h-3.5 w-3.5 mr-2" />
                            Editar Mesa
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleDeleteTable(table)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Excluir Mesa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ResponsiveTable>
      )}

      {/* Modal Criar / Editar Mesa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTable ? 'Editar Mesa' : 'Nova Mesa no Salão'}
        asDrawerOnMobile={true}
      >
        <form onSubmit={handleSaveTable} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tableNumber" className="text-xs">
                Número da Mesa *
              </Label>
              <Input
                id="tableNumber"
                type="number"
                min="1"
                value={tableNumber}
                onChange={(e) => {
                  setTableNumber(e.target.value);
                  if (!editingTable) {
                    setTableLabel(`Mesa ${e.target.value.padStart(2, '0')}`);
                  }
                }}
                required
                className="h-9 sm:h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tableCapacity" className="text-xs">
                Capacidade (Lugares) *
              </Label>
              <Input
                id="tableCapacity"
                type="number"
                min="1"
                max="50"
                value={tableCapacity}
                onChange={(e) => setTableCapacity(e.target.value)}
                required
                className="h-9 sm:h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tableLabel" className="text-xs">
              Nome / Identificação *
            </Label>
            <Input
              id="tableLabel"
              value={tableLabel}
              onChange={(e) => setTableLabel(e.target.value)}
              placeholder="Ex: Mesa 01, Bancada 03, Lounge VIP"
              required
              className="h-9 sm:h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="tableArea" className="text-xs">
                Setor / Área do Restaurante *
              </Label>
              <Link
                to="/app/tables/areas"
                className="text-[11px] text-primary hover:underline flex items-center gap-1"
                target="_blank"
              >
                + Gerenciar Setores
              </Link>
            </div>
            <select
              id="tableArea"
              value={tableArea}
              onChange={(e) => setTableArea(e.target.value as TableArea)}
              className="w-full h-9 sm:h-8 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {areas
                .filter((a) => a.is_active)
                .map((a) => (
                  <option key={a.id} value={a.code}>
                    {a.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tableNotes" className="text-xs">
              Observações / Localização
            </Label>
            <Input
              id="tableNotes"
              value={tableNotes}
              onChange={(e) => setTableNotes(e.target.value)}
              placeholder="Ex: Próxima à janela com vista para o jardim"
              className="h-9 sm:h-8 text-xs"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto h-11 sm:h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="w-full sm:w-auto h-11 sm:h-8 text-xs">
              {editingTable ? 'Salvar Alterações' : 'Cadastrar Mesa'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Abrir Comanda */}
      <Modal
        isOpen={isComandaModalOpen}
        onClose={() => setIsComandaModalOpen(false)}
        title={`Abrir Comanda • ${tableForComanda?.label || 'Mesa'}`}
        asDrawerOnMobile={true}
      >
        <form onSubmit={handleConfirmOpenComanda} className="space-y-4">
          <div className="p-3 bg-muted/40 rounded-lg border border-border/60 text-xs text-muted-foreground flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">
                {tableForComanda?.label} • {tableForComanda && getAreaLabel(tableForComanda.area)}
              </p>
              <p className="text-[11px] mt-0.5">
                Capacidade: {tableForComanda?.capacity} lugares sentados
              </p>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
              Mesa Livre
            </Badge>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comandaCustomer" className="text-xs">
              Nome do Cliente / Identificação
            </Label>
            <Input
              id="comandaCustomer"
              value={comandaCustomerName}
              onChange={(e) => setComandaCustomerName(e.target.value)}
              placeholder="Ex: Família Silva, Carlos, etc."
              className="h-9 sm:h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="comandaWaiter" className="text-xs">
                Garçom / Atendente
              </Label>
              <Input
                id="comandaWaiter"
                value={comandaWaiterName}
                onChange={(e) => setComandaWaiterName(e.target.value)}
                placeholder="Nome do atendente"
                className="h-9 sm:h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comandaParty" className="text-xs">
                Nº de Pessoas
              </Label>
              <Input
                id="comandaParty"
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
            <Label htmlFor="comandaNotes" className="text-xs">
              Observações Iniciais
            </Label>
            <Input
              id="comandaNotes"
              value={comandaNotes}
              onChange={(e) => setComandaNotes(e.target.value)}
              placeholder="Ex: Mesa de aniversário, preferências, etc."
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

      {/* Modal Reservar Mesa */}
      <Modal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        title={`Reservar Mesa • ${tableForReservation?.label || 'Mesa'}`}
        asDrawerOnMobile={true}
      >
        <form onSubmit={handleConfirmReservation} className="space-y-4">
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900 text-xs text-muted-foreground flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">
                {tableForReservation?.label} • {tableForReservation && getAreaLabel(tableForReservation.area)}
              </p>
              <p className="text-[11px] mt-0.5">
                Capacidade normal: {tableForReservation?.capacity} pessoas
              </p>
            </div>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-medium">
              Nova Reserva
            </Badge>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reserveCustomer" className="text-xs">
              Nome do Cliente para a Reserva *
            </Label>
            <Input
              id="reserveCustomer"
              value={reserveCustomerName}
              onChange={(e) => setReserveCustomerName(e.target.value)}
              placeholder="Ex: Beatriz Albuquerque"
              required
              className="h-9 sm:h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="reservePhone" className="text-xs">
                Telefone / WhatsApp
              </Label>
              <Input
                id="reservePhone"
                value={reserveContactPhone}
                onChange={(e) => setReserveContactPhone(e.target.value)}
                placeholder="Ex: (11) 98765-4321"
                className="h-9 sm:h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reserveTime" className="text-xs">
                Horário Previsto *
              </Label>
              <Input
                id="reserveTime"
                value={reserveTime}
                onChange={(e) => setReserveTime(e.target.value)}
                placeholder="Ex: Hoje às 20:30"
                required
                className="h-9 sm:h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reserveParty" className="text-xs">
              Quantidade de Pessoas
            </Label>
            <Input
              id="reserveParty"
              type="number"
              min="1"
              max="50"
              value={reservePartySize}
              onChange={(e) => setReservePartySize(e.target.value)}
              className="h-9 sm:h-8 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reserveNotes" className="text-xs">
              Observações Especiais
            </Label>
            <Input
              id="reserveNotes"
              value={reserveNotes}
              onChange={(e) => setReserveNotes(e.target.value)}
              placeholder="Ex: Decoração de aniversário, cadeira para criança, etc."
              className="h-9 sm:h-8 text-xs"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReservationModalOpen(false)}
              className="w-full sm:w-auto h-11 sm:h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="w-full sm:w-auto h-11 sm:h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              Confirmar Reserva
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
