import {
  RestaurantTable,
  TableStatus,
  TableArea,
  RestaurantArea,
  Order,
  OrderStatus,
  OrderType,
  PaymentMethod,
  CashierShift,
  CashTransaction,
  OperationalReportsSummary,
} from '@/types/operations';

// Local storage keys
const TABLES_KEY_PREFIX = 'olivelas_tables_';
const AREAS_KEY_PREFIX = 'olivelas_areas_';
const ORDERS_KEY_PREFIX = 'olivelas_orders_';
const SHIFTS_KEY_PREFIX = 'olivelas_shifts_';
const TRANSACTIONS_KEY_PREFIX = 'olivelas_transactions_';

// Seed initial restaurant areas if none exist
function seedAreas(restaurantId: string): RestaurantArea[] {
  const initial: RestaurantArea[] = [
    {
      id: 'area-main-hall',
      restaurant_id: restaurantId,
      name: 'Salão Principal',
      code: 'main_hall',
      description: 'Ambiente climatizado e salão central do restaurante',
      color: 'emerald',
      sort_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'area-patio',
      restaurant_id: restaurantId,
      name: 'Varanda / Deck',
      code: 'patio',
      description: 'Espaço aberto e arejado com vista panorâmica',
      color: 'amber',
      sort_order: 2,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'area-balcony',
      restaurant_id: restaurantId,
      name: 'Sacada',
      code: 'balcony',
      description: 'Mesas bistrô para casais e pequenas reuniões',
      color: 'blue',
      sort_order: 3,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'area-bar',
      restaurant_id: restaurantId,
      name: 'Área do Bar',
      code: 'bar',
      description: 'Ambiente próximo à coquetelaria e balcão',
      color: 'purple',
      sort_order: 4,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'area-vip',
      restaurant_id: restaurantId,
      name: 'Espaço VIP',
      code: 'vip',
      description: 'Reservado para eventos privados e degustações',
      color: 'rose',
      sort_order: 5,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];
  localStorage.setItem(AREAS_KEY_PREFIX + restaurantId, JSON.stringify(initial));
  return initial;
}

// Seed initial tables if none exist
function seedTables(restaurantId: string): RestaurantTable[] {
  const initial: RestaurantTable[] = [
    {
      id: 'table-01',
      restaurant_id: restaurantId,
      number: 1,
      label: 'Mesa 01',
      area: 'main_hall',
      capacity: 4,
      status: 'occupied',
      current_order_id: 'ord-101',
      waiter_name: 'Carlos Oliveira',
      occupied_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'table-02',
      restaurant_id: restaurantId,
      number: 2,
      label: 'Mesa 02',
      area: 'main_hall',
      capacity: 2,
      status: 'bill_requested',
      current_order_id: 'ord-102',
      waiter_name: 'Juliana Costa',
      occupied_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'table-03',
      restaurant_id: restaurantId,
      number: 3,
      label: 'Mesa 03',
      area: 'main_hall',
      capacity: 6,
      status: 'available',
      created_at: new Date().toISOString(),
    },
    {
      id: 'table-04',
      restaurant_id: restaurantId,
      number: 4,
      label: 'Mesa 04',
      area: 'main_hall',
      capacity: 4,
      status: 'available',
      created_at: new Date().toISOString(),
    },
    {
      id: 'table-05',
      restaurant_id: restaurantId,
      number: 5,
      label: 'Mesa 05',
      area: 'patio',
      capacity: 4,
      status: 'occupied',
      current_order_id: 'ord-103',
      waiter_name: 'Carlos Oliveira',
      occupied_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'table-06',
      restaurant_id: restaurantId,
      number: 6,
      label: 'Mesa 06',
      area: 'patio',
      capacity: 2,
      status: 'reserved',
      notes: 'Reserva para às 21h - Família Silva',
      created_at: new Date().toISOString(),
    },
    {
      id: 'table-07',
      restaurant_id: restaurantId,
      number: 7,
      label: 'Mesa 07',
      area: 'bar',
      capacity: 2,
      status: 'available',
      created_at: new Date().toISOString(),
    },
    {
      id: 'table-08',
      restaurant_id: restaurantId,
      number: 8,
      label: 'Mesa 08',
      area: 'vip',
      capacity: 8,
      status: 'available',
      created_at: new Date().toISOString(),
    },
  ];
  localStorage.setItem(TABLES_KEY_PREFIX + restaurantId, JSON.stringify(initial));
  return initial;
}

// Seed initial orders if none exist
function seedOrders(restaurantId: string): Order[] {
  const initial: Order[] = [
    {
      id: 'ord-101',
      restaurant_id: restaurantId,
      code: 'PED-101',
      type: 'table',
      table_id: 'table-01',
      table_number: 1,
      customer_name: 'Marcos Vinicius',
      waiter_name: 'Carlos Oliveira',
      status: 'in_preparation',
      subtotal: 154.0,
      service_fee: 15.4,
      discount: 0,
      total: 169.4,
      items: [
        {
          id: 'item-1',
          product_id: 'p-1',
          product_name: 'Bacalhau à Gomes de Sá Especial',
          quantity: 1,
          unit_price: 115.0,
          total_price: 115.0,
          notes: 'Ao ponto, azeite extra virgem à parte',
          add_ons: [
            { id: 'ad-1', name: 'Azeitonas Portuguesas Extra', price: 12.0, quantity: 1 },
          ],
        },
        {
          id: 'item-2',
          product_id: 'p-2',
          product_name: 'Vinho Tinto Alentejano Reserva',
          quantity: 1,
          unit_price: 39.0,
          total_price: 39.0,
          add_ons: [],
        },
      ],
      created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'ord-102',
      restaurant_id: restaurantId,
      code: 'PED-102',
      type: 'table',
      table_id: 'table-02',
      table_number: 2,
      customer_name: 'Renata Lemos',
      waiter_name: 'Juliana Costa',
      status: 'ready',
      subtotal: 92.0,
      service_fee: 9.2,
      discount: 5.0,
      total: 96.2,
      items: [
        {
          id: 'item-3',
          product_id: 'p-3',
          product_name: 'Polvo à Lagareiro',
          quantity: 1,
          unit_price: 78.0,
          total_price: 78.0,
          notes: 'Bem dourado com batatas ao murro',
          add_ons: [],
        },
        {
          id: 'item-4',
          product_id: 'p-4',
          product_name: 'Água das Pedras com Limão',
          quantity: 2,
          unit_price: 7.0,
          total_price: 14.0,
          add_ons: [],
        },
      ],
      created_at: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
      id: 'ord-103',
      restaurant_id: restaurantId,
      code: 'PED-103',
      type: 'table',
      table_id: 'table-05',
      table_number: 5,
      customer_name: 'Fernanda e Lucas',
      waiter_name: 'Carlos Oliveira',
      status: 'pending',
      subtotal: 68.0,
      service_fee: 6.8,
      discount: 0,
      total: 74.8,
      items: [
        {
          id: 'item-5',
          product_id: 'p-5',
          product_name: 'Arroz de Marisco Tradicional',
          quantity: 1,
          unit_price: 68.0,
          total_price: 68.0,
          notes: 'Sem coentro pfv',
          add_ons: [],
        },
      ],
      created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    },
    {
      id: 'ord-100',
      restaurant_id: restaurantId,
      code: 'PED-100',
      type: 'counter',
      customer_name: 'Rafael Santos',
      waiter_name: 'Caixa Balcão',
      status: 'paid',
      subtotal: 45.0,
      service_fee: 0,
      discount: 0,
      total: 45.0,
      payment_method: 'pix',
      items: [
        {
          id: 'item-6',
          product_id: 'p-6',
          product_name: 'Pastel de Nata Clássico (4 un)',
          quantity: 1,
          unit_price: 32.0,
          total_price: 32.0,
          add_ons: [],
        },
        {
          id: 'item-7',
          product_id: 'p-7',
          product_name: 'Café Expresso Duplo',
          quantity: 1,
          unit_price: 13.0,
          total_price: 13.0,
          add_ons: [],
        },
      ],
      created_at: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    },
  ];
  localStorage.setItem(ORDERS_KEY_PREFIX + restaurantId, JSON.stringify(initial));
  return initial;
}

// Seed initial cashier shift if none exists
function seedShift(restaurantId: string): CashierShift {
  const current: CashierShift = {
    id: 'shift-' + Date.now(),
    restaurant_id: restaurantId,
    user_id: 'usr-admin',
    user_name: 'Operador Principal',
    opened_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    opening_balance: 300.0,
    cash_in: 0,
    cash_out: 50.0,
    total_sales: 780.5,
    expected_cash: 520.0,
    status: 'open',
    notes: 'Turno almoço e tarde iniciado normalmente.',
  };
  localStorage.setItem(SHIFTS_KEY_PREFIX + restaurantId, JSON.stringify([current]));

  const initialTx: CashTransaction[] = [
    {
      id: 'tx-1',
      restaurant_id: restaurantId,
      shift_id: current.id,
      type: 'sale',
      amount: 45.0,
      payment_method: 'pix',
      order_id: 'ord-100',
      order_code: 'PED-100',
      description: 'Venda Balcão #PED-100',
      created_at: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    },
    {
      id: 'tx-2',
      restaurant_id: restaurantId,
      shift_id: current.id,
      type: 'cash_out',
      amount: 50.0,
      payment_method: 'cash',
      description: 'Sangria de caixa - Compra de gelo de emergência',
      created_at: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    },
  ];
  localStorage.setItem(TRANSACTIONS_KEY_PREFIX + restaurantId, JSON.stringify(initialTx));
  return current;
}

export const operationsService = {
  // ==========================================
  // SETORES / ÁREAS DO RESTAURANTE
  // ==========================================
  getAreas(restaurantId: string): RestaurantArea[] {
    const raw = localStorage.getItem(AREAS_KEY_PREFIX + restaurantId);
    if (!raw) return seedAreas(restaurantId);
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : seedAreas(restaurantId);
    } catch {
      return seedAreas(restaurantId);
    }
  },

  saveAreas(restaurantId: string, areas: RestaurantArea[]): void {
    localStorage.setItem(AREAS_KEY_PREFIX + restaurantId, JSON.stringify(areas));
  },

  getAreaById(restaurantId: string, areaId: string): RestaurantArea | null {
    const areas = this.getAreas(restaurantId);
    return areas.find((a) => a.id === areaId || a.code === areaId) || null;
  },

  createArea(
    restaurantId: string,
    data: Omit<RestaurantArea, 'id' | 'restaurant_id' | 'created_at'>
  ): RestaurantArea {
    const areas = this.getAreas(restaurantId);
    const newArea: RestaurantArea = {
      ...data,
      id: 'area-' + Date.now(),
      restaurant_id: restaurantId,
      created_at: new Date().toISOString(),
    };
    areas.push(newArea);
    this.saveAreas(restaurantId, areas);
    return newArea;
  },

  updateArea(
    restaurantId: string,
    areaId: string,
    data: Partial<Omit<RestaurantArea, 'id' | 'restaurant_id' | 'created_at'>>
  ): RestaurantArea {
    const areas = this.getAreas(restaurantId);
    const idx = areas.findIndex((a) => a.id === areaId);
    if (idx === -1) throw new Error('Setor não encontrado');

    const oldCode = areas[idx].code;
    areas[idx] = {
      ...areas[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };
    this.saveAreas(restaurantId, areas);

    // If code changed, update tables that used oldCode
    if (data.code && data.code !== oldCode) {
      const tables = this.getTables(restaurantId);
      let changed = false;
      tables.forEach((t) => {
        if (t.area === oldCode) {
          t.area = data.code!;
          changed = true;
        }
      });
      if (changed) {
        this.saveTables(restaurantId, tables);
      }
    }

    return areas[idx];
  },

  toggleAreaStatus(restaurantId: string, areaId: string): RestaurantArea {
    const areas = this.getAreas(restaurantId);
    const idx = areas.findIndex((a) => a.id === areaId);
    if (idx === -1) throw new Error('Setor não encontrado');

    areas[idx].is_active = !areas[idx].is_active;
    areas[idx].updated_at = new Date().toISOString();
    this.saveAreas(restaurantId, areas);
    return areas[idx];
  },

  deleteArea(restaurantId: string, areaId: string): { success: boolean; message?: string } {
    const areas = this.getAreas(restaurantId);
    const target = areas.find((a) => a.id === areaId);
    if (!target) return { success: false, message: 'Setor não encontrado' };

    // Check if any tables are using this area
    const tables = this.getTables(restaurantId);
    const linkedTables = tables.filter((t) => t.area === target.code || t.area === target.id);
    if (linkedTables.length > 0) {
      return {
        success: false,
        message: `Não é possível excluir o setor "${target.name}" pois existem ${linkedTables.length} mesa(s) vinculada(s) a ele. Realoque ou altere o setor dessas mesas antes de excluir.`,
      };
    }

    const filtered = areas.filter((a) => a.id !== areaId);
    this.saveAreas(restaurantId, filtered);
    return { success: true };
  },

  // ==========================================
  // MESAS
  // ==========================================
  getTables(restaurantId: string): RestaurantTable[] {
    const raw = localStorage.getItem(TABLES_KEY_PREFIX + restaurantId);
    if (!raw) return seedTables(restaurantId);
    try {
      return JSON.parse(raw);
    } catch {
      return seedTables(restaurantId);
    }
  },

  saveTables(restaurantId: string, tables: RestaurantTable[]): void {
    localStorage.setItem(TABLES_KEY_PREFIX + restaurantId, JSON.stringify(tables));
  },

  getTableById(restaurantId: string, tableId: string): RestaurantTable | null {
    const tables = this.getTables(restaurantId);
    return tables.find((t) => t.id === tableId) || null;
  },

  createTable(
    restaurantId: string,
    data: { number: number; label: string; area: TableArea; capacity: number; notes?: string }
  ): RestaurantTable {
    const tables = this.getTables(restaurantId);
    const newTable: RestaurantTable = {
      id: 'table-' + Date.now(),
      restaurant_id: restaurantId,
      number: data.number,
      label: data.label || `Mesa ${data.number}`,
      area: data.area,
      capacity: data.capacity,
      status: 'available',
      notes: data.notes,
      created_at: new Date().toISOString(),
    };
    tables.push(newTable);
    this.saveTables(restaurantId, tables);
    return newTable;
  },

  updateTable(
    restaurantId: string,
    tableId: string,
    data: Partial<RestaurantTable>
  ): RestaurantTable {
    const tables = this.getTables(restaurantId);
    const idx = tables.findIndex((t) => t.id === tableId);
    if (idx === -1) throw new Error('Mesa não encontrada');

    tables[idx] = { ...tables[idx], ...data };
    this.saveTables(restaurantId, tables);
    return tables[idx];
  },

  updateTableStatus(
    restaurantId: string,
    tableId: string,
    status: TableStatus,
    extra?: { waiter_name?: string; order_id?: string }
  ): RestaurantTable {
    const tables = this.getTables(restaurantId);
    const idx = tables.findIndex((t) => t.id === tableId);
    if (idx === -1) throw new Error('Mesa não encontrada');

    tables[idx].status = status;
    if (status === 'occupied') {
      tables[idx].occupied_at = tables[idx].occupied_at || new Date().toISOString();
      if (extra?.waiter_name) tables[idx].waiter_name = extra.waiter_name;
      if (extra?.order_id) tables[idx].current_order_id = extra.order_id;
    } else if (status === 'available') {
      tables[idx].occupied_at = null;
      tables[idx].waiter_name = null;
      tables[idx].current_order_id = null;
    }
    this.saveTables(restaurantId, tables);
    return tables[idx];
  },

  deleteTable(restaurantId: string, tableId: string): void {
    const tables = this.getTables(restaurantId).filter((t) => t.id !== tableId);
    this.saveTables(restaurantId, tables);
  },

  // ==========================================
  // PEDIDOS
  // ==========================================
  getOrders(restaurantId: string): Order[] {
    const raw = localStorage.getItem(ORDERS_KEY_PREFIX + restaurantId);
    if (!raw) return seedOrders(restaurantId);
    try {
      return JSON.parse(raw);
    } catch {
      return seedOrders(restaurantId);
    }
  },

  saveOrders(restaurantId: string, orders: Order[]): void {
    localStorage.setItem(ORDERS_KEY_PREFIX + restaurantId, JSON.stringify(orders));
  },

  getOrderById(restaurantId: string, orderId: string): Order | null {
    const orders = this.getOrders(restaurantId);
    return orders.find((o) => o.id === orderId) || null;
  },

  createOrder(
    restaurantId: string,
    data: {
      type: OrderType;
      table_id?: string;
      table_number?: number;
      customer_name?: string;
      waiter_name?: string;
      items: Order['items'];
      notes?: string;
    }
  ): Order {
    const orders = this.getOrders(restaurantId);
    const subtotal = data.items.reduce((sum, item) => sum + item.total_price, 0);
    const service_fee = data.type === 'table' ? +(subtotal * 0.1).toFixed(2) : 0;
    const total = +(subtotal + service_fee).toFixed(2);

    const code = `PED-${orders.length + 101}`;
    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      restaurant_id: restaurantId,
      code,
      type: data.type,
      table_id: data.table_id,
      table_number: data.table_number,
      customer_name: data.customer_name || (data.table_number ? `Mesa ${data.table_number}` : 'Balcão'),
      waiter_name: data.waiter_name || 'Atendente',
      status: 'pending',
      subtotal,
      service_fee,
      discount: 0,
      total,
      items: data.items,
      notes: data.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    orders.unshift(newOrder);
    this.saveOrders(restaurantId, orders);

    // Se o pedido for para mesa, ocupar a mesa
    if (data.table_id) {
      this.updateTableStatus(restaurantId, data.table_id, 'occupied', {
        waiter_name: newOrder.waiter_name || undefined,
        order_id: newOrder.id,
      });
    }

    return newOrder;
  },

  updateOrderStatus(restaurantId: string, orderId: string, status: OrderStatus): Order {
    const orders = this.getOrders(restaurantId);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error('Pedido não encontrado');

    orders[idx].status = status;
    orders[idx].updated_at = new Date().toISOString();
    if (status === 'paid' || status === 'delivered') {
      orders[idx].completed_at = new Date().toISOString();
    }

    this.saveOrders(restaurantId, orders);
    return orders[idx];
  },

  openTableComanda(
    restaurantId: string,
    tableId: string,
    data: { customer_name?: string; waiter_name?: string; party_size?: number; notes?: string }
  ): { table: RestaurantTable; order: Order } {
    const table = this.getTableById(restaurantId, tableId);
    if (!table) throw new Error('Mesa não encontrada');

    // Create a new active order for this table
    const orders = this.getOrders(restaurantId);
    const code = `PED-${orders.length + 101}`;
    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      restaurant_id: restaurantId,
      code,
      type: 'table',
      table_id: table.id,
      table_number: table.number,
      customer_name: data.customer_name || table.label,
      waiter_name: data.waiter_name || 'Carlos Oliveira',
      status: 'pending',
      subtotal: 0,
      service_fee: 0,
      discount: 0,
      total: 0,
      items: [],
      notes: data.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    orders.unshift(newOrder);
    this.saveOrders(restaurantId, orders);

    // Update table status to occupied
    const updatedTable = this.updateTableStatus(restaurantId, table.id, 'occupied', {
      waiter_name: newOrder.waiter_name || undefined,
      order_id: newOrder.id,
    });

    if (data.notes) {
      this.updateTable(restaurantId, table.id, { notes: data.notes });
    }

    return { table: updatedTable, order: newOrder };
  },

  reserveTable(
    restaurantId: string,
    tableId: string,
    data: {
      customer_name: string;
      contact_phone?: string;
      reserved_for: string;
      party_size: number;
      notes?: string;
    }
  ): RestaurantTable {
    const table = this.getTableById(restaurantId, tableId);
    if (!table) throw new Error('Mesa não encontrada');

    const reservationNote = `Reserva para ${data.customer_name} às ${data.reserved_for} (${data.party_size} pess.) - Tel: ${data.contact_phone || 'Não informado'}${data.notes ? ` • Obs: ${data.notes}` : ''}`;

    const updated = this.updateTable(restaurantId, tableId, {
      status: 'reserved',
      notes: reservationNote,
      capacity: data.party_size > table.capacity ? data.party_size : table.capacity,
    });

    return updated;
  },

  checkInReservation(
    restaurantId: string,
    tableId: string,
    waiterName?: string
  ): { table: RestaurantTable; order: Order } {
    const table = this.getTableById(restaurantId, tableId);
    if (!table) throw new Error('Mesa não encontrada');

    let customerName = table.label;
    if (table.notes && table.notes.includes('Reserva para ')) {
      const match = table.notes.match(/Reserva para ([^à]+) às/);
      if (match && match[1]) {
        customerName = match[1].trim();
      }
    }

    return this.openTableComanda(restaurantId, tableId, {
      customer_name: customerName,
      waiter_name: waiterName || 'Carlos Oliveira',
      notes: 'Cliente em atendimento pós-reserva',
    });
  },

  cancelReservation(restaurantId: string, tableId: string): RestaurantTable {
    return this.updateTable(restaurantId, tableId, {
      status: 'available',
      notes: null,
      current_order_id: null,
      waiter_name: null,
      occupied_at: null,
    });
  },

  addItemToOrder(
    restaurantId: string,
    orderId: string,
    itemData: {
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      notes?: string;
      add_ons?: { id: string; name: string; price: number; quantity: number }[];
    }
  ): Order {
    const orders = this.getOrders(restaurantId);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error('Pedido não encontrado');

    const order = orders[idx];
    const addOnsTotal = (itemData.add_ons || []).reduce((acc, ad) => acc + ad.price * ad.quantity, 0);
    const itemTotal = +( (itemData.unit_price + addOnsTotal) * itemData.quantity ).toFixed(2);

    const newItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      product_id: itemData.product_id,
      product_name: itemData.product_name,
      quantity: itemData.quantity,
      unit_price: itemData.unit_price,
      total_price: itemTotal,
      notes: itemData.notes,
      add_ons: itemData.add_ons || [],
    };

    order.items.push(newItem);
    order.subtotal = +(order.items.reduce((sum, it) => sum + it.total_price, 0)).toFixed(2);
    order.service_fee = order.type === 'table' ? +(order.subtotal * 0.1).toFixed(2) : 0;
    order.total = +(Math.max(0, order.subtotal + order.service_fee - (order.discount || 0))).toFixed(2);
    order.updated_at = new Date().toISOString();

    // If order was ready or delivered and new items are added, set to pending so it can be sent to kitchen!
    if (order.status === 'delivered' || order.status === 'ready') {
      order.status = 'pending';
    }

    this.saveOrders(restaurantId, orders);
    return order;
  },

  sendOrderToKitchen(restaurantId: string, orderId: string): Order {
    return this.updateOrderStatus(restaurantId, orderId, 'in_preparation');
  },

  // ==========================================
  // KDS (KITCHEN DISPLAY SYSTEM)
  // ==========================================
  getKdsOrders(restaurantId: string): Order[] {
    const orders = this.getOrders(restaurantId);
    // KDS mostra pedidos não pagos/não cancelados (pendente, em preparo, pronto)
    return orders.filter(
      (o) => o.status === 'pending' || o.status === 'in_preparation' || o.status === 'ready'
    );
  },

  advanceKdsStatus(restaurantId: string, orderId: string): Order {
    const order = this.getOrderById(restaurantId, orderId);
    if (!order) throw new Error('Pedido não encontrado');

    let nextStatus: OrderStatus = order.status;
    if (order.status === 'pending') {
      nextStatus = 'in_preparation';
    } else if (order.status === 'in_preparation') {
      nextStatus = 'ready';
    } else if (order.status === 'ready') {
      nextStatus = 'delivered';
    }

    return this.updateOrderStatus(restaurantId, orderId, nextStatus);
  },

  // ==========================================
  // CAIXA (CASHIER & PDV)
  // ==========================================
  getCurrentShift(restaurantId: string): CashierShift | null {
    const raw = localStorage.getItem(SHIFTS_KEY_PREFIX + restaurantId);
    if (!raw) {
      const seeded = seedShift(restaurantId);
      return seeded;
    }
    try {
      const shifts: CashierShift[] = JSON.parse(raw);
      const open = shifts.find((s) => s.status === 'open');
      return open || null;
    } catch {
      return null;
    }
  },

  openShift(
    restaurantId: string,
    userId: string,
    userName: string,
    openingBalance: number,
    notes?: string
  ): CashierShift {
    const raw = localStorage.getItem(SHIFTS_KEY_PREFIX + restaurantId);
    const shifts: CashierShift[] = raw ? JSON.parse(raw) : [];

    const newShift: CashierShift = {
      id: 'shift-' + Date.now(),
      restaurant_id: restaurantId,
      user_id: userId,
      user_name: userName,
      opened_at: new Date().toISOString(),
      opening_balance: openingBalance,
      cash_in: 0,
      cash_out: 0,
      total_sales: 0,
      expected_cash: openingBalance,
      status: 'open',
      notes,
    };

    shifts.unshift(newShift);
    localStorage.setItem(SHIFTS_KEY_PREFIX + restaurantId, JSON.stringify(shifts));
    return newShift;
  },

  closeShift(
    restaurantId: string,
    shiftId: string,
    actualCash: number,
    notes?: string
  ): CashierShift {
    const raw = localStorage.getItem(SHIFTS_KEY_PREFIX + restaurantId);
    const shifts: CashierShift[] = raw ? JSON.parse(raw) : [];
    const idx = shifts.findIndex((s) => s.id === shiftId);
    if (idx === -1) throw new Error('Turno de caixa não encontrado');

    const expected = shifts[idx].expected_cash;
    shifts[idx].actual_cash = actualCash;
    shifts[idx].difference = +(actualCash - expected).toFixed(2);
    shifts[idx].closed_at = new Date().toISOString();
    shifts[idx].status = 'closed';
    if (notes) shifts[idx].notes = (shifts[idx].notes ? shifts[idx].notes + ' | ' : '') + notes;

    localStorage.setItem(SHIFTS_KEY_PREFIX + restaurantId, JSON.stringify(shifts));
    return shifts[idx];
  },

  addCashMovement(
    restaurantId: string,
    shiftId: string,
    type: 'cash_in' | 'cash_out',
    amount: number,
    description: string
  ): CashTransaction {
    const raw = localStorage.getItem(SHIFTS_KEY_PREFIX + restaurantId);
    const shifts: CashierShift[] = raw ? JSON.parse(raw) : [];
    const idx = shifts.findIndex((s) => s.id === shiftId);
    if (idx !== -1) {
      if (type === 'cash_in') {
        shifts[idx].cash_in += amount;
        shifts[idx].expected_cash += amount;
      } else {
        shifts[idx].cash_out += amount;
        shifts[idx].expected_cash -= amount;
      }
      localStorage.setItem(SHIFTS_KEY_PREFIX + restaurantId, JSON.stringify(shifts));
    }

    const txRaw = localStorage.getItem(TRANSACTIONS_KEY_PREFIX + restaurantId);
    const txs: CashTransaction[] = txRaw ? JSON.parse(txRaw) : [];
    const newTx: CashTransaction = {
      id: 'tx-' + Date.now(),
      restaurant_id: restaurantId,
      shift_id: shiftId,
      type,
      amount,
      payment_method: 'cash',
      description,
      created_at: new Date().toISOString(),
    };
    txs.unshift(newTx);
    localStorage.setItem(TRANSACTIONS_KEY_PREFIX + restaurantId, JSON.stringify(txs));
    return newTx;
  },

  payOrder(
    restaurantId: string,
    orderId: string,
    paymentMethod: PaymentMethod,
    discount: number = 0
  ): Order {
    const order = this.getOrderById(restaurantId, orderId);
    if (!order) throw new Error('Pedido não encontrado');

    const shift = this.getCurrentShift(restaurantId);
    const finalTotal = Math.max(0, +(order.subtotal + order.service_fee - discount).toFixed(2));

    order.discount = discount;
    order.total = finalTotal;
    order.payment_method = paymentMethod;
    order.status = 'paid';
    order.completed_at = new Date().toISOString();
    order.updated_at = new Date().toISOString();

    const orders = this.getOrders(restaurantId);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      orders[idx] = order;
      this.saveOrders(restaurantId, orders);
    }

    // Se mesa vinculada, liberar mesa ou colocar para limpeza
    if (order.table_id) {
      this.updateTableStatus(restaurantId, order.table_id, 'available');
    }

    // Se caixa aberto, registrar transação
    if (shift) {
      const txRaw = localStorage.getItem(TRANSACTIONS_KEY_PREFIX + restaurantId);
      const txs: CashTransaction[] = txRaw ? JSON.parse(txRaw) : [];
      const newTx: CashTransaction = {
        id: 'tx-' + Date.now(),
        restaurant_id: restaurantId,
        shift_id: shift.id,
        type: 'sale',
        amount: finalTotal,
        payment_method: paymentMethod,
        order_id: order.id,
        order_code: order.code,
        description: `Recebimento pedido #${order.code} (${order.customer_name})`,
        created_at: new Date().toISOString(),
      };
      txs.unshift(newTx);
      localStorage.setItem(TRANSACTIONS_KEY_PREFIX + restaurantId, JSON.stringify(txs));

      // Atualizar shift
      const rawShifts = localStorage.getItem(SHIFTS_KEY_PREFIX + restaurantId);
      const shifts: CashierShift[] = rawShifts ? JSON.parse(rawShifts) : [];
      const shiftIdx = shifts.findIndex((s) => s.id === shift.id);
      if (shiftIdx !== -1) {
        shifts[shiftIdx].total_sales += finalTotal;
        if (paymentMethod === 'cash') {
          shifts[shiftIdx].expected_cash += finalTotal;
        }
        localStorage.setItem(SHIFTS_KEY_PREFIX + restaurantId, JSON.stringify(shifts));
      }
    }

    return order;
  },

  getTransactions(restaurantId: string): CashTransaction[] {
    const raw = localStorage.getItem(TRANSACTIONS_KEY_PREFIX + restaurantId);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  // ==========================================
  // RELATÓRIOS & INTELIGÊNCIA
  // ==========================================
  getReportsSummary(restaurantId: string): OperationalReportsSummary {
    const orders = this.getOrders(restaurantId);
    const tables = this.getTables(restaurantId);
    const txs = this.getTransactions(restaurantId);

    const paidOrders = orders.filter((o) => o.status === 'paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;
    const averageTicket = paidOrders.length > 0 ? +(totalRevenue / paidOrders.length).toFixed(2) : 0;
    const activeTablesCount = tables.filter((t) => t.status === 'occupied').length;

    // Produtos mais vendidos
    const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (!productStats[item.product_name]) {
          productStats[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 };
        }
        productStats[item.product_name].quantity += item.quantity;
        productStats[item.product_name].revenue += item.total_price;
      });
    });

    const topSellingProducts = Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Vendas por Forma de Pagamento
    const paymentMethods: Record<PaymentMethod, { label: string; amount: number; count: number }> = {
      cash: { label: 'Dinheiro', amount: 0, count: 0 },
      pix: { label: 'PIX Instantâneo', amount: 0, count: 0 },
      credit: { label: 'Cartão de Crédito', amount: 0, count: 0 },
      debit: { label: 'Cartão de Débito', amount: 0, count: 0 },
      voucher: { label: 'Vale Refeição (VR)', amount: 0, count: 0 },
    };

    txs.filter((t) => t.type === 'sale').forEach((t) => {
      if (paymentMethods[t.payment_method]) {
        paymentMethods[t.payment_method].amount += t.amount;
        paymentMethods[t.payment_method].count += 1;
      }
    });

    const salesByPaymentMethod = Object.entries(paymentMethods).map(([method, data]) => ({
      method: method as PaymentMethod,
      label: data.label,
      amount: +data.amount.toFixed(2),
      count: data.count,
    }));

    return {
      totalRevenue: +totalRevenue.toFixed(2),
      totalOrders,
      averageTicket,
      activeTablesCount,
      topSellingProducts: topSellingProducts.length > 0 ? topSellingProducts : [
        { name: 'Bacalhau à Gomes de Sá Especial', quantity: 18, revenue: 2070.0 },
        { name: 'Pastel de Nata Clássico', quantity: 34, revenue: 272.0 },
        { name: 'Polvo à Lagareiro', quantity: 12, revenue: 936.0 },
        { name: 'Vinho Tinto Alentejano', quantity: 15, revenue: 585.0 },
        { name: 'Arroz de Marisco Tradicional', quantity: 9, revenue: 612.0 },
      ],
      salesByCategory: [
        { category: 'Pratos Principais', revenue: 3618.0, percentage: 68 },
        { category: 'Vinhos & Bebidas', revenue: 975.0, percentage: 18 },
        { category: 'Sobremesas', revenue: 480.0, percentage: 9 },
        { category: 'Entradas', revenue: 260.0, percentage: 5 },
      ],
      salesByPaymentMethod,
      hourlyTraffic: [
        { hour: '11:00', orders: 2, revenue: 140 },
        { hour: '12:00', orders: 12, revenue: 1120 },
        { hour: '13:00', orders: 18, revenue: 1650 },
        { hour: '14:00', orders: 7, revenue: 580 },
        { hour: '19:00', orders: 8, revenue: 790 },
        { hour: '20:00', orders: 21, revenue: 2140 },
        { hour: '21:00', orders: 14, revenue: 1320 },
      ],
    };
  },
};
