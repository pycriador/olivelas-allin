import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { auditService } from '@/services/auditService';
import type {
  Category,
  Product,
  AddOnGroup,
  AddOn,
  MenuOverviewMetrics,
  CategoryFilters,
  ProductFilters,
  AddOnFilters,
} from '@/types/menu';
import type { PaginatedResponse } from '@/types/pagination';

// Storage keys for local fallback
const LOCAL_CATEGORIES_KEY = 'olivelas_menu_categories';
const LOCAL_PRODUCTS_KEY = 'olivelas_menu_products';
const LOCAL_GROUPS_KEY = 'olivelas_menu_addon_groups';
const LOCAL_ADDONS_KEY = 'olivelas_menu_addons';
const LOCAL_GROUP_ADDONS_KEY = 'olivelas_menu_group_addons';
const LOCAL_PROD_GROUPS_KEY = 'olivelas_menu_prod_groups';

// Initial seed helper for demo restaurants
function getInitialSeedData(restaurantId: string) {
  const cat1Id = `cat-${restaurantId}-1`;
  const cat2Id = `cat-${restaurantId}-2`;
  const cat3Id = `cat-${restaurantId}-3`;

  const seedCategories: Category[] = [
    {
      id: cat1Id,
      restaurant_id: restaurantId,
      name: 'Pratos Principais',
      description: 'Cortes nobres, massas artesanais e especialidades da casa.',
      image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      sort_order: 1,
      status: 'active',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: cat2Id,
      restaurant_id: restaurantId,
      name: 'Entradas & Petiscos',
      description: 'Aperitivos perfeitos para compartilhar com a mesa.',
      image_url: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80',
      sort_order: 2,
      status: 'active',
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: cat3Id,
      restaurant_id: restaurantId,
      name: 'Bebidas & Coquetéis',
      description: 'Vinhos selecionados, drinks autorais e sucos naturais.',
      image_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80',
      sort_order: 3,
      status: 'active',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const grp1Id = `grp-${restaurantId}-1`;
  const grp2Id = `grp-${restaurantId}-2`;

  const seedGroups: AddOnGroup[] = [
    {
      id: grp1Id,
      restaurant_id: restaurantId,
      name: 'Ponto da Carne',
      description: 'Como você prefere o preparo da sua carne.',
      min_selections: 1,
      max_selections: 1,
      required: true,
      sort_order: 1,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: grp2Id,
      restaurant_id: restaurantId,
      name: 'Adicionais Extras',
      description: 'Incremente seu prato com acompanhamentos especiais.',
      min_selections: 0,
      max_selections: 4,
      required: false,
      sort_order: 2,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const add1Id = `add-${restaurantId}-1`;
  const add2Id = `add-${restaurantId}-2`;
  const add3Id = `add-${restaurantId}-3`;
  const add4Id = `add-${restaurantId}-4`;
  const add5Id = `add-${restaurantId}-5`;
  const add6Id = `add-${restaurantId}-6`;

  const seedAddOns: AddOn[] = [
    {
      id: add5Id,
      restaurant_id: restaurantId,
      name: 'Mal Passado',
      price: 0,
      status: 'active',
      available: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: add1Id,
      restaurant_id: restaurantId,
      name: 'Ao Ponto para Mal',
      price: 0,
      status: 'active',
      available: true,
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: add2Id,
      restaurant_id: restaurantId,
      name: 'Ao Ponto',
      price: 0,
      status: 'active',
      available: true,
      sort_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: add6Id,
      restaurant_id: restaurantId,
      name: 'Bem Passado',
      price: 0,
      status: 'active',
      available: true,
      sort_order: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: add3Id,
      restaurant_id: restaurantId,
      name: 'Bacon Artesanal Crocante (100g)',
      price: 9.5,
      status: 'active',
      available: true,
      sort_order: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: add4Id,
      restaurant_id: restaurantId,
      name: 'Queijo Brie Maçaricado (80g)',
      price: 14.0,
      status: 'active',
      available: true,
      sort_order: 6,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const seedGroupAddOns = [
    { id: `ga-5`, group_id: grp1Id, add_on_id: add5Id, sort_order: 1, created_at: new Date().toISOString() },
    { id: `ga-1`, group_id: grp1Id, add_on_id: add1Id, sort_order: 2, created_at: new Date().toISOString() },
    { id: `ga-2`, group_id: grp1Id, add_on_id: add2Id, sort_order: 3, created_at: new Date().toISOString() },
    { id: `ga-6`, group_id: grp1Id, add_on_id: add6Id, sort_order: 4, created_at: new Date().toISOString() },
    { id: `ga-3`, group_id: grp2Id, add_on_id: add3Id, sort_order: 5, created_at: new Date().toISOString() },
    { id: `ga-4`, group_id: grp2Id, add_on_id: add4Id, sort_order: 6, created_at: new Date().toISOString() },
  ];

  const prod1Id = `prod-${restaurantId}-1`;
  const prod2Id = `prod-${restaurantId}-2`;
  const prod3Id = `prod-${restaurantId}-3`;

  const seedProducts: Product[] = [
    {
      id: prod1Id,
      restaurant_id: restaurantId,
      category_id: cat1Id,
      name: 'Ancho Angus na Brasa (350g)',
      short_description: 'Acompanha batatas rústicas com alecrim e farofa crocante.',
      description: 'Corte nobre da costela bovina com alto marmoreio, grelhado na brasa de carvão de eucalipto.',
      sku: 'CAR-001',
      image_url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80',
      price: 89.9,
      cost_price: 36.5,
      status: 'active',
      available: true,
      sort_order: 1,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: prod2Id,
      restaurant_id: restaurantId,
      category_id: cat1Id,
      name: 'Risotto de Cogumelos Selvagens',
      short_description: 'Arroz arbóreo, mix de cogumelos frescos e azeite trufado.',
      description: 'Cremoso risotto italiano com shimeji, shiitake e cogumelo paris, finalizado com Grana Padano.',
      sku: 'MAS-002',
      image_url: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=600&q=80',
      price: 74.0,
      cost_price: 24.0,
      status: 'active',
      available: true,
      sort_order: 2,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: prod3Id,
      restaurant_id: restaurantId,
      category_id: cat3Id,
      name: 'Gin Tônica Mediterrâneo',
      short_description: 'Gin premium, água tônica artesanal, zimbro e ramo de alecrim.',
      description: 'Coquetel refrescante e aromático servido em taça balon com gelo translúcido.',
      sku: 'BEB-010',
      image_url: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80',
      price: 38.0,
      cost_price: 11.2,
      status: 'active',
      available: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const seedProdGroups = [
    { id: 'pg-1', product_id: prod1Id, add_on_group_id: grp1Id, sort_order: 1, created_at: new Date().toISOString() },
    { id: 'pg-2', product_id: prod1Id, add_on_group_id: grp2Id, sort_order: 2, created_at: new Date().toISOString() },
  ];

  return {
    categories: seedCategories,
    products: seedProducts,
    groups: seedGroups,
    addOns: seedAddOns,
    groupAddOns: seedGroupAddOns,
    prodGroups: seedProdGroups,
  };
}

// Local storage accessors
function loadLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function ensureLocalSeed(restaurantId: string): void {
  const existingCats = loadLocal<Category>(LOCAL_CATEGORIES_KEY).filter((c) => c.restaurant_id === restaurantId);
  if (existingCats.length === 0) {
    const seed = getInitialSeedData(restaurantId);
    saveLocal(LOCAL_CATEGORIES_KEY, [...loadLocal<Category>(LOCAL_CATEGORIES_KEY), ...seed.categories]);
    saveLocal(LOCAL_PRODUCTS_KEY, [...loadLocal<Product>(LOCAL_PRODUCTS_KEY), ...seed.products]);
    saveLocal(LOCAL_GROUPS_KEY, [...loadLocal<AddOnGroup>(LOCAL_GROUPS_KEY), ...seed.groups]);
    saveLocal(LOCAL_ADDONS_KEY, [...loadLocal<AddOn>(LOCAL_ADDONS_KEY), ...seed.addOns]);
    saveLocal(LOCAL_GROUP_ADDONS_KEY, [...loadLocal<any>(LOCAL_GROUP_ADDONS_KEY), ...seed.groupAddOns]);
    saveLocal(LOCAL_PROD_GROUPS_KEY, [...loadLocal<any>(LOCAL_PROD_GROUPS_KEY), ...seed.prodGroups]);
  }
}

export const menuService = {
  // ============================================================================
  // OVERVIEW METRICS
  // ============================================================================
  async getMenuMetrics(restaurantId: string): Promise<MenuOverviewMetrics> {
    if (!isSupabaseConfigured) {
      ensureLocalSeed(restaurantId);
      const cats = loadLocal<Category>(LOCAL_CATEGORIES_KEY).filter((c) => c.restaurant_id === restaurantId);
      const prods = loadLocal<Product>(LOCAL_PRODUCTS_KEY).filter((p) => p.restaurant_id === restaurantId);
      const addons = loadLocal<AddOn>(LOCAL_ADDONS_KEY).filter((a) => a.restaurant_id === restaurantId);
      const groups = loadLocal<AddOnGroup>(LOCAL_GROUPS_KEY).filter((g) => g.restaurant_id === restaurantId);

      const activeProds = prods.filter((p) => p.status === 'active' && p.available);
      const unavailableProds = prods.filter((p) => !p.available || p.status === 'inactive');
      const productsWithoutImage = prods.filter((p) => !p.image_url || p.image_url.trim() === '');
      const emptyCats = cats.filter((c) => !prods.some((p) => p.category_id === c.id));

      return {
        totalCategories: cats.length,
        totalProducts: prods.length,
        activeProducts: activeProds.length,
        unavailableProducts: unavailableProds.length,
        totalAddOns: addons.length,
        totalAddOnGroups: groups.length,
        productsWithoutImage: productsWithoutImage.length,
        emptyCategories: emptyCats.length,
      };
    }

    try {
      const [catsRes, prodsRes, addonsRes, groupsRes] = await Promise.all([
        supabase.from('categories').select('id', { count: 'exact' }).eq('restaurant_id', restaurantId),
        supabase.from('products').select('id, category_id, status, available, image_url').eq('restaurant_id', restaurantId),
        supabase.from('add_ons').select('id', { count: 'exact' }).eq('restaurant_id', restaurantId),
        supabase.from('add_on_groups').select('id', { count: 'exact' }).eq('restaurant_id', restaurantId),
      ]);

      const prods = prodsRes.data || [];
      const totalCategories = catsRes.count || 0;
      const totalProducts = prods.length;
      const activeProducts = prods.filter((p) => p.status === 'active' && p.available).length;
      const unavailableProducts = prods.filter((p) => !p.available || p.status === 'inactive').length;
      const productsWithoutImage = prods.filter((p) => !p.image_url || p.image_url.trim() === '').length;
      const totalAddOns = addonsRes.count || 0;
      const totalAddOnGroups = groupsRes.count || 0;

      // Find empty categories
      let emptyCategories = 0;
      if (totalCategories > 0) {
        const { data: allCats } = await supabase.from('categories').select('id').eq('restaurant_id', restaurantId);
        const usedCatIds = new Set(prods.map((p) => p.category_id));
        emptyCategories = (allCats || []).filter((c) => !usedCatIds.has(c.id)).length;
      }

      return {
        totalCategories,
        totalProducts,
        activeProducts,
        unavailableProducts,
        totalAddOns,
        totalAddOnGroups,
        productsWithoutImage,
        emptyCategories,
      };
    } catch (err) {
      console.error('getMenuMetrics Supabase failed, falling back:', err);
      ensureLocalSeed(restaurantId);
      const prods = loadLocal<Product>(LOCAL_PRODUCTS_KEY).filter((p) => p.restaurant_id === restaurantId);
      const cats = loadLocal<Category>(LOCAL_CATEGORIES_KEY).filter((c) => c.restaurant_id === restaurantId);
      return {
        totalCategories: cats.length,
        totalProducts: prods.length,
        activeProducts: prods.filter((p) => p.status === 'active' && p.available).length,
        unavailableProducts: prods.filter((p) => !p.available || p.status === 'inactive').length,
        totalAddOns: loadLocal<AddOn>(LOCAL_ADDONS_KEY).filter((a) => a.restaurant_id === restaurantId).length,
        totalAddOnGroups: loadLocal<AddOnGroup>(LOCAL_GROUPS_KEY).filter((g) => g.restaurant_id === restaurantId).length,
        productsWithoutImage: prods.filter((p) => !p.image_url).length,
        emptyCategories: cats.filter((c) => !prods.some((p) => p.category_id === c.id)).length,
      };
    }
  },

  // ============================================================================
  // CATEGORIES
  // ============================================================================
  async getCategories(restaurantId: string, filters: CategoryFilters): Promise<PaginatedResponse<Category>> {
    const page = Math.max(1, filters.page);
    const pageSize = Math.max(1, filters.pageSize);

    if (!isSupabaseConfigured) {
      ensureLocalSeed(restaurantId);
      let list = loadLocal<Category>(LOCAL_CATEGORIES_KEY).filter((c) => c.restaurant_id === restaurantId);
      const allProds = loadLocal<Product>(LOCAL_PRODUCTS_KEY).filter((p) => p.restaurant_id === restaurantId);

      // Map product counts
      list = list.map((c) => ({
        ...c,
        product_count: allProds.filter((p) => p.category_id === c.id).length,
      }));

      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        list = list.filter((c) => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)));
      }
      if (filters.status && filters.status !== 'all') {
        list = list.filter((c) => c.status === filters.status);
      }

      list.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));

      const total = list.length;
      const start = (page - 1) * pageSize;
      const data = list.slice(start, start + pageSize);

      return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      };
    }

    try {
      let query = supabase
        .from('categories')
        .select('*', { count: 'exact' })
        .eq('restaurant_id', restaurantId);

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.ilike('name', `%${filters.search.trim()}%`);
      }

      query = query.order('sort_order', { ascending: true }).order('name', { ascending: true });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      // Hydrate product counts
      const categoryList = (data || []) as Category[];
      if (categoryList.length > 0) {
        const catIds = categoryList.map((c) => c.id);
        const { data: prods } = await supabase
          .from('products')
          .select('id, category_id')
          .in('category_id', catIds);

        const countMap: Record<string, number> = {};
        (prods || []).forEach((p) => {
          countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
        });

        categoryList.forEach((c) => {
          c.product_count = countMap[c.id] || 0;
        });
      }

      const total = count || 0;
      return {
        data: categoryList,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      };
    } catch (err) {
      console.warn('Supabase categories error, falling back:', err);
      ensureLocalSeed(restaurantId);
      const list = loadLocal<Category>(LOCAL_CATEGORIES_KEY).filter((c) => c.restaurant_id === restaurantId);
      return {
        data: list.slice(0, pageSize),
        total: list.length,
        page: 1,
        pageSize,
        totalPages: 1,
      };
    }
  },

  async getAllCategories(restaurantId: string): Promise<Category[]> {
    if (!isSupabaseConfigured) {
      ensureLocalSeed(restaurantId);
      return loadLocal<Category>(LOCAL_CATEGORIES_KEY)
        .filter((c) => c.restaurant_id === restaurantId && c.status === 'active')
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as Category[];
    } catch {
      ensureLocalSeed(restaurantId);
      return loadLocal<Category>(LOCAL_CATEGORIES_KEY).filter((c) => c.restaurant_id === restaurantId);
    }
  },

  async getCategoryById(categoryId: string): Promise<Category | null> {
    if (!isSupabaseConfigured) {
      const all = loadLocal<Category>(LOCAL_CATEGORIES_KEY);
      return all.find((c) => c.id === categoryId) || null;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .maybeSingle();

      if (error) throw error;
      return (data as Category) || null;
    } catch {
      const all = loadLocal<Category>(LOCAL_CATEGORIES_KEY);
      return all.find((c) => c.id === categoryId) || null;
    }
  },

  async createCategory(
    restaurantId: string,
    input: Partial<Category>,
    actorUserId?: string,
    supportSessionId?: string
  ): Promise<{ data?: Category; error?: string }> {
    const now = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const newItem: Category = {
        id: `cat-${Date.now()}`,
        restaurant_id: restaurantId,
        name: input.name?.trim() || 'Nova Categoria',
        description: input.description?.trim() || null,
        image_url: input.image_url || null,
        sort_order: input.sort_order ?? 0,
        status: input.status || 'active',
        created_at: now,
        updated_at: now,
        created_by: actorUserId || null,
        updated_by: actorUserId || null,
      };

      const existing = loadLocal<Category>(LOCAL_CATEGORIES_KEY);
      saveLocal(LOCAL_CATEGORIES_KEY, [...existing, newItem]);

      await auditService.logEvent({
        action: 'CATEGORY_CREATED',
        entity_type: 'category',
        entity_id: newItem.id,
        restaurant_id: restaurantId,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { name: newItem.name },
      });

      return { data: newItem };
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          restaurant_id: restaurantId,
          name: input.name?.trim(),
          description: input.description?.trim() || null,
          image_url: input.image_url || null,
          sort_order: input.sort_order ?? 0,
          status: input.status || 'active',
          created_by: actorUserId || null,
          updated_by: actorUserId || null,
        })
        .select()
        .single();

      if (error) throw error;

      await auditService.logEvent({
        action: 'CATEGORY_CREATED',
        entity_type: 'category',
        entity_id: data.id,
        restaurant_id: restaurantId,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { name: data.name },
      });

      return { data: data as Category };
    } catch (err: any) {
      return { error: err.message || 'Erro ao criar categoria.' };
    }
  },

  async updateCategory(
    categoryId: string,
    input: Partial<Category>,
    actorUserId?: string,
    supportSessionId?: string
  ): Promise<{ data?: Category; error?: string }> {
    const now = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const all = loadLocal<Category>(LOCAL_CATEGORIES_KEY);
      const index = all.findIndex((c) => c.id === categoryId);
      if (index === -1) return { error: 'Categoria não encontrada.' };

      const oldStatus = all[index].status;
      const updated: Category = {
        ...all[index],
        ...input,
        updated_at: now,
        updated_by: actorUserId || all[index].updated_by,
      };
      all[index] = updated;
      saveLocal(LOCAL_CATEGORIES_KEY, all);

      if (input.status && input.status !== oldStatus) {
        await auditService.logEvent({
          action: 'CATEGORY_STATUS_CHANGED',
          entity_type: 'category',
          entity_id: categoryId,
          restaurant_id: updated.restaurant_id,
          actor_user_id: actorUserId,
          support_session_id: supportSessionId,
          metadata: { old_status: oldStatus, new_status: input.status },
        });
      } else {
        await auditService.logEvent({
          action: 'CATEGORY_UPDATED',
          entity_type: 'category',
          entity_id: categoryId,
          restaurant_id: updated.restaurant_id,
          actor_user_id: actorUserId,
          support_session_id: supportSessionId,
          metadata: { changes: input },
        });
      }

      return { data: updated };
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          ...input,
          updated_at: now,
          updated_by: actorUserId || null,
        })
        .eq('id', categoryId)
        .select()
        .single();

      if (error) throw error;

      await auditService.logEvent({
        action: input.status !== undefined ? 'CATEGORY_STATUS_CHANGED' : 'CATEGORY_UPDATED',
        entity_type: 'category',
        entity_id: categoryId,
        restaurant_id: data.restaurant_id,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { changes: input },
      });

      return { data: data as Category };
    } catch (err: any) {
      return { error: err.message || 'Erro ao atualizar categoria.' };
    }
  },

  async deleteCategory(
    categoryId: string,
    actorUserId?: string,
    supportSessionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      const all = loadLocal<Category>(LOCAL_CATEGORIES_KEY);
      const cat = all.find((c) => c.id === categoryId);
      const prods = loadLocal<Product>(LOCAL_PRODUCTS_KEY);
      const hasProducts = prods.some((p) => p.category_id === categoryId);

      if (hasProducts) {
        // Soft delete / inactive
        return this.updateCategory(categoryId, { status: 'inactive' }, actorUserId, supportSessionId)
          .then((res) => ({ success: !res.error, error: res.error }));
      }

      saveLocal(LOCAL_CATEGORIES_KEY, all.filter((c) => c.id !== categoryId));

      if (cat) {
        await auditService.logEvent({
          action: 'CATEGORY_DELETED',
          entity_type: 'category',
          entity_id: categoryId,
          restaurant_id: cat.restaurant_id,
          actor_user_id: actorUserId,
          support_session_id: supportSessionId,
          metadata: { name: cat.name },
        });
      }

      return { success: true };
    }

    try {
      // Check if products exist in category
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('category_id', categoryId);

      if (count && count > 0) {
        // Fallback to inactivate per business rules
        const res = await this.updateCategory(categoryId, { status: 'inactive' }, actorUserId, supportSessionId);
        return { success: !res.error, error: res.error ? 'Não foi possível desativar categoria com produtos.' : undefined };
      }

      const { data: cat } = await supabase.from('categories').select('restaurant_id, name').eq('id', categoryId).single();

      const { error } = await supabase.from('categories').delete().eq('id', categoryId);
      if (error) throw error;

      if (cat) {
        await auditService.logEvent({
          action: 'CATEGORY_DELETED',
          entity_type: 'category',
          entity_id: categoryId,
          restaurant_id: cat.restaurant_id,
          actor_user_id: actorUserId,
          support_session_id: supportSessionId,
          metadata: { name: cat.name },
        });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao excluir categoria.' };
    }
  },

  // ============================================================================
  // PRODUCTS
  // ============================================================================
  async getProducts(restaurantId: string, filters: ProductFilters): Promise<PaginatedResponse<Product>> {
    const page = Math.max(1, filters.page);
    const pageSize = Math.max(1, filters.pageSize);

    if (!isSupabaseConfigured) {
      ensureLocalSeed(restaurantId);
      let list = loadLocal<Product>(LOCAL_PRODUCTS_KEY).filter((p) => p.restaurant_id === restaurantId);
      const cats = loadLocal<Category>(LOCAL_CATEGORIES_KEY);

      list = list.map((p) => ({
        ...p,
        category: cats.find((c) => c.id === p.category_id) || null,
      }));

      if (filters.category && filters.category !== 'all') {
        list = list.filter((p) => p.category_id === filters.category);
      }
      if (filters.status && filters.status !== 'all') {
        list = list.filter((p) => p.status === filters.status);
      }
      if (filters.available !== undefined && filters.available !== 'all') {
        const isAvail = filters.available === 'true';
        list = list.filter((p) => p.available === isAvail);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.sku && p.sku.toLowerCase().includes(q)) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            (p.short_description && p.short_description.toLowerCase().includes(q))
        );
      }

      list.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));

      const total = list.length;
      const start = (page - 1) * pageSize;
      const data = list.slice(start, start + pageSize);

      return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      };
    }

    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('restaurant_id', restaurantId);

      if (filters.category && filters.category !== 'all') {
        query = query.eq('category_id', filters.category);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.available !== undefined && filters.available !== 'all') {
        query = query.eq('available', filters.available === 'true');
      }
      if (filters.search) {
        const q = filters.search.trim();
        query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,description.ilike.%${q}%,short_description.ilike.%${q}%`);
      }

      query = query.order('sort_order', { ascending: true }).order('name', { ascending: true });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      // Hydrate category objects
      const products = (data || []) as Product[];
      if (products.length > 0) {
        const catIds = Array.from(new Set(products.map((p) => p.category_id)));
        const { data: cats } = await supabase.from('categories').select('*').in('id', catIds);
        const catMap = new Map((cats || []).map((c) => [c.id, c]));

        products.forEach((p) => {
          p.category = catMap.get(p.category_id) || null;
        });
      }

      const total = count || 0;
      return {
        data: products,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      };
    } catch (err) {
      console.warn('Supabase products fetch failed, falling back:', err);
      ensureLocalSeed(restaurantId);
      const list = loadLocal<Product>(LOCAL_PRODUCTS_KEY).filter((p) => p.restaurant_id === restaurantId);
      return {
        data: list.slice(0, pageSize),
        total: list.length,
        page: 1,
        pageSize,
        totalPages: 1,
      };
    }
  },

  async getProductById(productId: string): Promise<Product | null> {
    if (!isSupabaseConfigured) {
      const prods = loadLocal<Product>(LOCAL_PRODUCTS_KEY);
      const p = prods.find((x) => x.id === productId);
      if (!p) return null;
      const cats = loadLocal<Category>(LOCAL_CATEGORIES_KEY);
      const prodGroups = loadLocal<any>(LOCAL_PROD_GROUPS_KEY).filter((pg: any) => pg.product_id === productId);
      return {
        ...p,
        category: cats.find((c) => c.id === p.category_id) || null,
        add_on_group_ids: prodGroups.map((pg: any) => pg.add_on_group_id),
      };
    }

    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      if (error || !product) return null;

      // Hydrate category
      const { data: cat } = await supabase
        .from('categories')
        .select('*')
        .eq('id', product.category_id)
        .maybeSingle();

      // Hydrate attached group IDs
      const { data: prodGroups } = await supabase
        .from('product_add_on_groups')
        .select('add_on_group_id')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });

      return {
        ...(product as Product),
        category: cat as Category,
        add_on_group_ids: (prodGroups || []).map((pg) => pg.add_on_group_id),
      };
    } catch {
      const prods = loadLocal<Product>(LOCAL_PRODUCTS_KEY);
      return prods.find((x) => x.id === productId) || null;
    }
  },

  async createProduct(
    restaurantId: string,
    input: Partial<Product>,
    actorUserId?: string,
    supportSessionId?: string
  ): Promise<{ data?: Product; error?: string }> {
    const now = new Date().toISOString();

    if (!input.category_id) {
      return { error: 'A categoria do produto é obrigatória.' };
    }
    if (!input.name || !input.name.trim()) {
      return { error: 'O nome do produto é obrigatório.' };
    }

    const price = Number(input.price ?? 0);
    const costPrice = input.cost_price !== undefined && input.cost_price !== null ? Number(input.cost_price) : null;

    if (!isSupabaseConfigured) {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        restaurant_id: restaurantId,
        category_id: input.category_id,
        name: input.name.trim(),
        short_description: input.short_description?.trim() || null,
        description: input.description?.trim() || null,
        sku: input.sku?.trim() || null,
        image_url: input.image_url || null,
        price,
        cost_price: costPrice,
        status: input.status || 'active',
        available: input.available ?? true,
        sort_order: input.sort_order ?? 0,
        created_at: now,
        updated_at: now,
        created_by: actorUserId || null,
        updated_by: actorUserId || null,
      };

      const prods = loadLocal<Product>(LOCAL_PRODUCTS_KEY);
      saveLocal(LOCAL_PRODUCTS_KEY, [...prods, newProduct]);

      // Attach add-on groups if supplied
      if (input.add_on_group_ids && input.add_on_group_ids.length > 0) {
        const prodGroups = loadLocal<any>(LOCAL_PROD_GROUPS_KEY);
        const newAttachments = input.add_on_group_ids.map((groupId, idx) => ({
          id: `pg-${Date.now()}-${idx}`,
          product_id: newProduct.id,
          add_on_group_id: groupId,
          sort_order: idx + 1,
          created_at: now,
        }));
        saveLocal(LOCAL_PROD_GROUPS_KEY, [...prodGroups, ...newAttachments]);
      }

      await auditService.logEvent({
        action: 'PRODUCT_CREATED',
        entity_type: 'product',
        entity_id: newProduct.id,
        restaurant_id: restaurantId,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { name: newProduct.name, price: newProduct.price },
      });

      return { data: newProduct };
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          restaurant_id: restaurantId,
          category_id: input.category_id,
          name: input.name.trim(),
          short_description: input.short_description?.trim() || null,
          description: input.description?.trim() || null,
          sku: input.sku?.trim() || null,
          image_url: input.image_url || null,
          price,
          cost_price: costPrice,
          status: input.status || 'active',
          available: input.available ?? true,
          sort_order: input.sort_order ?? 0,
          created_by: actorUserId || null,
          updated_by: actorUserId || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Attach add-on groups
      if (input.add_on_group_ids && input.add_on_group_ids.length > 0) {
        await this.setProductAddOnGroups(data.id, input.add_on_group_ids, actorUserId, supportSessionId);
      }

      await auditService.logEvent({
        action: 'PRODUCT_CREATED',
        entity_type: 'product',
        entity_id: data.id,
        restaurant_id: restaurantId,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { name: data.name, price: data.price },
      });

      return { data: data as Product };
    } catch (err: any) {
      return { error: err.message || 'Erro ao cadastrar produto.' };
    }
  },

  async updateProduct(
    productId: string,
    input: Partial<Product>,
    actorUserId?: string,
    supportSessionId?: string
  ): Promise<{ data?: Product; error?: string }> {
    const now = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const prods = loadLocal<Product>(LOCAL_PRODUCTS_KEY);
      const idx = prods.findIndex((p) => p.id === productId);
      if (idx === -1) return { error: 'Produto não encontrado.' };

      const old = prods[idx];
      const updated: Product = {
        ...old,
        ...input,
        price: input.price !== undefined ? Number(input.price) : old.price,
        cost_price: input.cost_price !== undefined ? (input.cost_price === null ? null : Number(input.cost_price)) : old.cost_price,
        updated_at: now,
        updated_by: actorUserId || old.updated_by,
      };
      prods[idx] = updated;
      saveLocal(LOCAL_PRODUCTS_KEY, prods);

      // Audit price change specifically
      if (input.price !== undefined && Number(input.price) !== old.price) {
        await auditService.logEvent({
          action: 'PRODUCT_PRICE_CHANGED',
          entity_type: 'product',
          entity_id: productId,
          restaurant_id: updated.restaurant_id,
          actor_user_id: actorUserId,
          support_session_id: supportSessionId,
          metadata: { old_price: old.price, new_price: input.price },
        });
      } else {
        await auditService.logEvent({
          action: 'PRODUCT_UPDATED',
          entity_type: 'product',
          entity_id: productId,
          restaurant_id: updated.restaurant_id,
          actor_user_id: actorUserId,
          support_session_id: supportSessionId,
          metadata: { changes: input },
        });
      }

      if (input.add_on_group_ids) {
        await this.setProductAddOnGroups(productId, input.add_on_group_ids, actorUserId, supportSessionId);
      }

      return { data: updated };
    }

    try {
      // Fetch current price for audit check
      const { data: current } = await supabase.from('products').select('price, restaurant_id').eq('id', productId).single();

      const payload: any = {
        ...input,
        updated_at: now,
        updated_by: actorUserId || null,
      };
      delete payload.category;
      delete payload.add_on_group_ids;

      if (payload.price !== undefined) payload.price = Number(payload.price);
      if (payload.cost_price !== undefined) payload.cost_price = payload.cost_price === null ? null : Number(payload.cost_price);

      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;

      if (input.price !== undefined && current && Number(input.price) !== Number(current.price)) {
        await auditService.logEvent({
          action: 'PRODUCT_PRICE_CHANGED',
          entity_type: 'product',
          entity_id: productId,
          restaurant_id: data.restaurant_id,
          actor_user_id: actorUserId,
          support_session_id: supportSessionId,
          metadata: { old_price: current.price, new_price: input.price },
        });
      } else {
        await auditService.logEvent({
          action: 'PRODUCT_UPDATED',
          entity_type: 'product',
          entity_id: productId,
          restaurant_id: data.restaurant_id,
          actor_user_id: actorUserId,
          support_session_id: supportSessionId,
          metadata: { changes: input },
        });
      }

      if (input.add_on_group_ids) {
        await this.setProductAddOnGroups(productId, input.add_on_group_ids, actorUserId, supportSessionId);
      }

      return { data: data as Product };
    } catch (err: any) {
      return { error: err.message || 'Erro ao atualizar produto.' };
    }
  },

  async toggleProductAvailability(
    productId: string,
    available: boolean,
    actorUserId?: string,
    supportSessionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      const prods = loadLocal<Product>(LOCAL_PRODUCTS_KEY);
      const idx = prods.findIndex((p) => p.id === productId);
      if (idx === -1) return { success: false, error: 'Produto não encontrado.' };

      prods[idx].available = available;
      prods[idx].updated_at = new Date().toISOString();
      saveLocal(LOCAL_PRODUCTS_KEY, prods);

      await auditService.logEvent({
        action: 'PRODUCT_AVAILABILITY_CHANGED',
        entity_type: 'product',
        entity_id: productId,
        restaurant_id: prods[idx].restaurant_id,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { available },
      });

      return { success: true };
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .update({ available, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .select('restaurant_id')
        .single();

      if (error) throw error;

      await auditService.logEvent({
        action: 'PRODUCT_AVAILABILITY_CHANGED',
        entity_type: 'product',
        entity_id: productId,
        restaurant_id: data.restaurant_id,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { available },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao alterar disponibilidade.' };
    }
  },

  async toggleProductStatus(
    productId: string,
    status: 'active' | 'inactive',
    actorUserId?: string,
    supportSessionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      const prods = loadLocal<Product>(LOCAL_PRODUCTS_KEY);
      const idx = prods.findIndex((p) => p.id === productId);
      if (idx === -1) return { success: false, error: 'Produto não encontrado.' };

      prods[idx].status = status;
      prods[idx].updated_at = new Date().toISOString();
      saveLocal(LOCAL_PRODUCTS_KEY, prods);

      await auditService.logEvent({
        action: 'PRODUCT_STATUS_CHANGED',
        entity_type: 'product',
        entity_id: productId,
        restaurant_id: prods[idx].restaurant_id,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { status },
      });

      return { success: true };
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .select('restaurant_id')
        .single();

      if (error) throw error;

      await auditService.logEvent({
        action: 'PRODUCT_STATUS_CHANGED',
        entity_type: 'product',
        entity_id: productId,
        restaurant_id: data.restaurant_id,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { status },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao alterar status do produto.' };
    }
  },

  async deleteProduct(
    productId: string,
    actorUserId?: string,
    supportSessionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      const prods = loadLocal<Product>(LOCAL_PRODUCTS_KEY);
      const prod = prods.find((p) => p.id === productId);

      // Business rule: Soft delete / inactivate
      const res = await this.toggleProductStatus(productId, 'inactive', actorUserId, supportSessionId);
      if (!res.success) return res;

      if (prod) {
        await auditService.logEvent({
          action: 'PRODUCT_DELETED',
          entity_type: 'product',
          entity_id: productId,
          restaurant_id: prod.restaurant_id,
          actor_user_id: actorUserId,
          support_session_id: supportSessionId,
          metadata: { name: prod.name, action_mode: 'soft_inactivated' },
        });
      }

      return { success: true };
    }

    try {
      // Soft-inactivate product per rule #28
      const { data: prod } = await supabase.from('products').select('name, restaurant_id').eq('id', productId).single();

      const { error } = await supabase
        .from('products')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;

      if (prod) {
        await auditService.logEvent({
          action: 'PRODUCT_DELETED',
          entity_type: 'product',
          entity_id: productId,
          restaurant_id: prod.restaurant_id,
          actor_user_id: actorUserId,
          support_session_id: supportSessionId,
          metadata: { name: prod.name, action_mode: 'soft_inactivated' },
        });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao desativar produto.' };
    }
  },

  // ============================================================================
  // ADD-ON GROUPS & ADD-ONS
  // ============================================================================
  async getAddOnGroups(restaurantId: string): Promise<AddOnGroup[]> {
    if (!isSupabaseConfigured) {
      ensureLocalSeed(restaurantId);
      const groups = loadLocal<AddOnGroup>(LOCAL_GROUPS_KEY).filter((g) => g.restaurant_id === restaurantId);
      const groupAddOns = loadLocal<any>(LOCAL_GROUP_ADDONS_KEY);
      const allAddOns = loadLocal<AddOn>(LOCAL_ADDONS_KEY);

      return groups.map((g) => {
        const linkedIds = groupAddOns.filter((ga: any) => ga.group_id === g.id).map((ga: any) => ga.add_on_id);
        const attachedAddOns = allAddOns.filter((a) => linkedIds.includes(a.id));
        return {
          ...g,
          add_ons: attachedAddOns,
        };
      }).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    }

    try {
      const { data: groups, error } = await supabase
        .from('add_on_groups')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      const groupList = (groups || []) as AddOnGroup[];

      if (groupList.length > 0) {
        const groupIds = groupList.map((g) => g.id);
        const { data: joins } = await supabase
          .from('group_add_ons')
          .select('group_id, add_on_id, sort_order')
          .in('group_id', groupIds)
          .order('sort_order', { ascending: true });

        const addOnIds = Array.from(new Set((joins || []).map((j) => j.add_on_id)));
        let addOnsMap = new Map<string, AddOn>();
        if (addOnIds.length > 0) {
          const { data: addOns } = await supabase.from('add_ons').select('*').in('id', addOnIds);
          addOnsMap = new Map((addOns || []).map((a) => [a.id, a as AddOn]));
        }

        groupList.forEach((grp) => {
          const matchedJoins = (joins || []).filter((j) => j.group_id === grp.id);
          grp.add_ons = matchedJoins.map((j) => addOnsMap.get(j.add_on_id)).filter(Boolean) as AddOn[];
        });
      }

      return groupList;
    } catch {
      ensureLocalSeed(restaurantId);
      return loadLocal<AddOnGroup>(LOCAL_GROUPS_KEY).filter((g) => g.restaurant_id === restaurantId);
    }
  },

  async createAddOnGroup(
    restaurantId: string,
    input: Partial<AddOnGroup>,
    actorUserId?: string,
    supportSessionId?: string
  ): Promise<{ data?: AddOnGroup; error?: string }> {
    const min_selections = Math.max(0, input.min_selections ?? 0);
    const max_selections = Math.max(min_selections, input.max_selections ?? 1);
    const required = input.required ?? (min_selections >= 1);
    const now = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const newGroup: AddOnGroup = {
        id: `grp-${Date.now()}`,
        restaurant_id: restaurantId,
        name: input.name?.trim() || 'Novo Grupo',
        description: input.description?.trim() || null,
        min_selections,
        max_selections,
        required,
        sort_order: input.sort_order ?? 0,
        status: input.status || 'active',
        created_at: now,
        updated_at: now,
      };

      const groups = loadLocal<AddOnGroup>(LOCAL_GROUPS_KEY);
      saveLocal(LOCAL_GROUPS_KEY, [...groups, newGroup]);

      await auditService.logEvent({
        action: 'ADD_ON_GROUP_CREATED',
        entity_type: 'add_on_group',
        entity_id: newGroup.id,
        restaurant_id: restaurantId,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { name: newGroup.name },
      });

      return { data: newGroup };
    }

    try {
      const { data, error } = await supabase
        .from('add_on_groups')
        .insert({
          restaurant_id: restaurantId,
          name: input.name?.trim(),
          description: input.description?.trim() || null,
          min_selections,
          max_selections,
          required,
          sort_order: input.sort_order ?? 0,
          status: input.status || 'active',
        })
        .select()
        .single();

      if (error) throw error;

      await auditService.logEvent({
        action: 'ADD_ON_GROUP_CREATED',
        entity_type: 'add_on_group',
        entity_id: data.id,
        restaurant_id: restaurantId,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { name: data.name },
      });

      return { data: data as AddOnGroup };
    } catch (err: any) {
      return { error: err.message || 'Erro ao criar grupo de adicionais.' };
    }
  },

  async updateAddOnGroup(
    groupId: string,
    input: Partial<AddOnGroup>,
    actorUserId?: string,
    supportSessionId?: string
  ): Promise<{ data?: AddOnGroup; error?: string }> {
    const now = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const groups = loadLocal<AddOnGroup>(LOCAL_GROUPS_KEY);
      const idx = groups.findIndex((g) => g.id === groupId);
      if (idx === -1) return { error: 'Grupo não encontrado.' };

      const updated: AddOnGroup = {
        ...groups[idx],
        ...input,
        updated_at: now,
      };
      groups[idx] = updated;
      saveLocal(LOCAL_GROUPS_KEY, groups);

      await auditService.logEvent({
        action: 'ADD_ON_GROUP_UPDATED',
        entity_type: 'add_on_group',
        entity_id: groupId,
        restaurant_id: updated.restaurant_id,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { changes: input },
      });

      return { data: updated };
    }

    try {
      const { data, error } = await supabase
        .from('add_on_groups')
        .update({
          ...input,
          updated_at: now,
        })
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;

      await auditService.logEvent({
        action: 'ADD_ON_GROUP_UPDATED',
        entity_type: 'add_on_group',
        entity_id: groupId,
        restaurant_id: data.restaurant_id,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { changes: input },
      });

      return { data: data as AddOnGroup };
    } catch (err: any) {
      return { error: err.message || 'Erro ao atualizar grupo de adicionais.' };
    }
  },

  async deleteAddOnGroup(
    groupId: string,
    actorUserId?: string,
    supportSessionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      const groups = loadLocal<AddOnGroup>(LOCAL_GROUPS_KEY);
      const grp = groups.find((g) => g.id === groupId);
      saveLocal(LOCAL_GROUPS_KEY, groups.filter((g) => g.id !== groupId));

      if (grp) {
        await auditService.logEvent({
          action: 'ADD_ON_GROUP_DELETED',
          entity_type: 'add_on_group',
          entity_id: groupId,
          restaurant_id: grp.restaurant_id,
          actor_user_id: actorUserId,
          support_session_id: supportSessionId,
          metadata: { name: grp.name },
        });
      }

      return { success: true };
    }

    try {
      const { data: grp } = await supabase.from('add_on_groups').select('name, restaurant_id').eq('id', groupId).single();
      const { error } = await supabase.from('add_on_groups').delete().eq('id', groupId);
      if (error) throw error;

      if (grp) {
        await auditService.logEvent({
          action: 'ADD_ON_GROUP_DELETED',
          entity_type: 'add_on_group',
          entity_id: groupId,
          restaurant_id: grp.restaurant_id,
          actor_user_id: actorUserId,
          support_session_id: supportSessionId,
          metadata: { name: grp.name },
        });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao excluir grupo de adicionais.' };
    }
  },

  async getAddOns(restaurantId: string, filters: AddOnFilters): Promise<PaginatedResponse<AddOn>> {
    const page = Math.max(1, filters.page);
    const pageSize = Math.max(1, filters.pageSize);

    if (!isSupabaseConfigured) {
      ensureLocalSeed(restaurantId);
      let list = loadLocal<AddOn>(LOCAL_ADDONS_KEY).filter((a) => a.restaurant_id === restaurantId);
      const joins = loadLocal<any>(LOCAL_GROUP_ADDONS_KEY);

      list = list.map((a) => ({
        ...a,
        group_ids: joins.filter((j: any) => j.add_on_id === a.id).map((j: any) => j.group_id),
      }));

      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        list = list.filter((a) => a.name.toLowerCase().includes(q) || (a.description && a.description.toLowerCase().includes(q)));
      }
      if (filters.status && filters.status !== 'all') {
        list = list.filter((a) => a.status === filters.status);
      }

      list.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));

      const total = list.length;
      const start = (page - 1) * pageSize;
      const data = list.slice(start, start + pageSize);

      return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      };
    }

    try {
      let query = supabase
        .from('add_ons')
        .select('*', { count: 'exact' })
        .eq('restaurant_id', restaurantId);

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.ilike('name', `%${filters.search.trim()}%`);
      }

      query = query.order('sort_order', { ascending: true }).order('name', { ascending: true });

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      const addOns = (data || []) as AddOn[];
      if (addOns.length > 0) {
        const addOnIds = addOns.map((a) => a.id);
        const { data: joins } = await supabase.from('group_add_ons').select('group_id, add_on_id').in('add_on_id', addOnIds);
        const joinMap: Record<string, string[]> = {};
        (joins || []).forEach((j) => {
          joinMap[j.add_on_id] = [...(joinMap[j.add_on_id] || []), j.group_id];
        });
        addOns.forEach((a) => {
          a.group_ids = joinMap[a.id] || [];
        });
      }

      const total = count || 0;
      return {
        data: addOns,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      };
    } catch {
      ensureLocalSeed(restaurantId);
      const list = loadLocal<AddOn>(LOCAL_ADDONS_KEY).filter((a) => a.restaurant_id === restaurantId);
      return {
        data: list.slice(0, pageSize),
        total: list.length,
        page: 1,
        pageSize,
        totalPages: 1,
      };
    }
  },

  async getAllAddOns(restaurantId: string): Promise<AddOn[]> {
    if (!isSupabaseConfigured) {
      ensureLocalSeed(restaurantId);
      return loadLocal<AddOn>(LOCAL_ADDONS_KEY).filter((a) => a.restaurant_id === restaurantId && a.status === 'active');
    }

    try {
      const { data, error } = await supabase
        .from('add_ons')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as AddOn[];
    } catch {
      ensureLocalSeed(restaurantId);
      return loadLocal<AddOn>(LOCAL_ADDONS_KEY).filter((a) => a.restaurant_id === restaurantId);
    }
  },

  async getAddOnById(addOnId: string): Promise<AddOn | null> {
    if (!isSupabaseConfigured) {
      const list = loadLocal<AddOn>(LOCAL_ADDONS_KEY);
      const found = list.find((a) => a.id === addOnId);
      if (!found) return null;
      const joins = loadLocal<any>(LOCAL_GROUP_ADDONS_KEY);
      return {
        ...found,
        group_ids: joins.filter((j: any) => j.add_on_id === addOnId).map((j: any) => j.group_id),
      };
    }

    try {
      const { data, error } = await supabase.from('add_ons').select('*').eq('id', addOnId).maybeSingle();
      if (error || !data) return null;

      const { data: joins } = await supabase.from('group_add_ons').select('group_id').eq('add_on_id', addOnId);
      return {
        ...(data as AddOn),
        group_ids: (joins || []).map((j) => j.group_id),
      };
    } catch {
      const list = loadLocal<AddOn>(LOCAL_ADDONS_KEY);
      return list.find((a) => a.id === addOnId) || null;
    }
  },

  async createAddOn(
    restaurantId: string,
    input: Partial<AddOn>,
    groupIds?: string[],
    actorUserId?: string,
    supportSessionId?: string
  ): Promise<{ data?: AddOn; error?: string }> {
    const now = new Date().toISOString();
    const price = Number(input.price ?? 0);

    if (!isSupabaseConfigured) {
      const newItem: AddOn = {
        id: `add-${Date.now()}`,
        restaurant_id: restaurantId,
        name: input.name?.trim() || 'Novo Adicional',
        description: input.description?.trim() || null,
        price,
        image_url: input.image_url || null,
        status: input.status || 'active',
        available: input.available ?? true,
        sort_order: input.sort_order ?? 0,
        created_at: now,
        updated_at: now,
      };

      const addons = loadLocal<AddOn>(LOCAL_ADDONS_KEY);
      saveLocal(LOCAL_ADDONS_KEY, [...addons, newItem]);

      if (groupIds && groupIds.length > 0) {
        const joins = loadLocal<any>(LOCAL_GROUP_ADDONS_KEY);
        const newJoins = groupIds.map((gid) => ({
          id: `ga-${Date.now()}-${gid}`,
          group_id: gid,
          add_on_id: newItem.id,
          sort_order: 1,
          created_at: now,
        }));
        saveLocal(LOCAL_GROUP_ADDONS_KEY, [...joins, ...newJoins]);
      }

      await auditService.logEvent({
        action: 'ADD_ON_CREATED',
        entity_type: 'add_on',
        entity_id: newItem.id,
        restaurant_id: restaurantId,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { name: newItem.name, price: newItem.price },
      });

      return { data: newItem };
    }

    try {
      const { data, error } = await supabase
        .from('add_ons')
        .insert({
          restaurant_id: restaurantId,
          name: input.name?.trim(),
          description: input.description?.trim() || null,
          price,
          image_url: input.image_url || null,
          status: input.status || 'active',
          available: input.available ?? true,
          sort_order: input.sort_order ?? 0,
        })
        .select()
        .single();

      if (error) throw error;

      if (groupIds && groupIds.length > 0) {
        const inserts = groupIds.map((gid) => ({
          group_id: gid,
          add_on_id: data.id,
        }));
        await supabase.from('group_add_ons').insert(inserts);
      }

      await auditService.logEvent({
        action: 'ADD_ON_CREATED',
        entity_type: 'add_on',
        entity_id: data.id,
        restaurant_id: restaurantId,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { name: data.name, price: data.price },
      });

      return { data: data as AddOn };
    } catch (err: any) {
      return { error: err.message || 'Erro ao criar adicional.' };
    }
  },

  async updateAddOn(
    addOnId: string,
    input: Partial<AddOn>,
    groupIds?: string[],
    actorUserId?: string,
    supportSessionId?: string
  ): Promise<{ data?: AddOn; error?: string }> {
    const now = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const addons = loadLocal<AddOn>(LOCAL_ADDONS_KEY);
      const idx = addons.findIndex((a) => a.id === addOnId);
      if (idx === -1) return { error: 'Adicional não encontrado.' };

      const updated: AddOn = {
        ...addons[idx],
        ...input,
        price: input.price !== undefined ? Number(input.price) : addons[idx].price,
        updated_at: now,
      };
      addons[idx] = updated;
      saveLocal(LOCAL_ADDONS_KEY, addons);

      if (groupIds !== undefined) {
        let joins = loadLocal<any>(LOCAL_GROUP_ADDONS_KEY).filter((j: any) => j.add_on_id !== addOnId);
        const newJoins = groupIds.map((gid) => ({
          id: `ga-${Date.now()}-${gid}`,
          group_id: gid,
          add_on_id: addOnId,
          sort_order: 1,
          created_at: now,
        }));
        saveLocal(LOCAL_GROUP_ADDONS_KEY, [...joins, ...newJoins]);
      }

      await auditService.logEvent({
        action: 'ADD_ON_UPDATED',
        entity_type: 'add_on',
        entity_id: addOnId,
        restaurant_id: updated.restaurant_id,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { changes: input },
      });

      return { data: updated };
    }

    try {
      const payload: any = { ...input, updated_at: now };
      delete payload.group_ids;
      if (payload.price !== undefined) payload.price = Number(payload.price);

      const { data, error } = await supabase
        .from('add_ons')
        .update(payload)
        .eq('id', addOnId)
        .select()
        .single();

      if (error) throw error;

      if (groupIds !== undefined) {
        await supabase.from('group_add_ons').delete().eq('add_on_id', addOnId);
        if (groupIds.length > 0) {
          const inserts = groupIds.map((gid) => ({
            group_id: gid,
            add_on_id: addOnId,
          }));
          await supabase.from('group_add_ons').insert(inserts);
        }
      }

      await auditService.logEvent({
        action: 'ADD_ON_UPDATED',
        entity_type: 'add_on',
        entity_id: addOnId,
        restaurant_id: data.restaurant_id,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { changes: input },
      });

      return { data: data as AddOn };
    } catch (err: any) {
      return { error: err.message || 'Erro ao atualizar adicional.' };
    }
  },

  async deleteAddOn(
    addOnId: string,
    actorUserId?: string,
    supportSessionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      const addons = loadLocal<AddOn>(LOCAL_ADDONS_KEY);
      const item = addons.find((a) => a.id === addOnId);
      saveLocal(LOCAL_ADDONS_KEY, addons.filter((a) => a.id !== addOnId));

      if (item) {
        await auditService.logEvent({
          action: 'ADD_ON_DELETED',
          entity_type: 'add_on',
          entity_id: addOnId,
          restaurant_id: item.restaurant_id,
          actor_user_id: actorUserId,
          support_session_id: supportSessionId,
          metadata: { name: item.name },
        });
      }

      return { success: true };
    }

    try {
      const { data: item } = await supabase.from('add_ons').select('name, restaurant_id').eq('id', addOnId).single();
      const { error } = await supabase.from('add_ons').delete().eq('id', addOnId);
      if (error) throw error;

      if (item) {
        await auditService.logEvent({
          action: 'ADD_ON_DELETED',
          entity_type: 'add_on',
          entity_id: addOnId,
          restaurant_id: item.restaurant_id,
          actor_user_id: actorUserId,
          support_session_id: supportSessionId,
          metadata: { name: item.name },
        });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao remover adicional.' };
    }
  },

  // ============================================================================
  // PRODUCT ADD-ON GROUPS ASSOCIATIONS
  // ============================================================================
  async getProductAddOnGroups(productId: string): Promise<AddOnGroup[]> {
    if (!isSupabaseConfigured) {
      const links = loadLocal<any>(LOCAL_PROD_GROUPS_KEY).filter((pg: any) => pg.product_id === productId);
      const groupIds = links.map((l: any) => l.add_on_group_id);
      const allGroups = loadLocal<AddOnGroup>(LOCAL_GROUPS_KEY);
      return allGroups.filter((g) => groupIds.includes(g.id));
    }

    try {
      const { data: links, error } = await supabase
        .from('product_add_on_groups')
        .select('add_on_group_id, sort_order')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });

      if (error || !links || links.length === 0) return [];

      const groupIds = links.map((l) => l.add_on_group_id);
      const { data: groups } = await supabase.from('add_on_groups').select('*').in('id', groupIds);
      return (groups || []) as AddOnGroup[];
    } catch {
      return [];
    }
  },

  async setProductAddOnGroups(
    productId: string,
    groupIds: string[],
    actorUserId?: string,
    supportSessionId?: string
  ): Promise<{ success: boolean; error?: string }> {
    const now = new Date().toISOString();

    if (!isSupabaseConfigured) {
      let prodGroups = loadLocal<any>(LOCAL_PROD_GROUPS_KEY).filter((pg: any) => pg.product_id !== productId);
      const newItems = groupIds.map((gid, index) => ({
        id: `pg-${Date.now()}-${index}`,
        product_id: productId,
        add_on_group_id: gid,
        sort_order: index + 1,
        created_at: now,
      }));
      saveLocal(LOCAL_PROD_GROUPS_KEY, [...prodGroups, ...newItems]);

      await auditService.logEvent({
        action: 'PRODUCT_ADD_ON_GROUP_ATTACHED',
        entity_type: 'product',
        entity_id: productId,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { group_ids: groupIds },
      });

      return { success: true };
    }

    try {
      // Delete existing attachments
      await supabase.from('product_add_on_groups').delete().eq('product_id', productId);

      if (groupIds.length > 0) {
        const inserts = groupIds.map((gid, idx) => ({
          product_id: productId,
          add_on_group_id: gid,
          sort_order: idx + 1,
        }));
        const { error } = await supabase.from('product_add_on_groups').insert(inserts);
        if (error) throw error;
      }

      await auditService.logEvent({
        action: 'PRODUCT_ADD_ON_GROUP_ATTACHED',
        entity_type: 'product',
        entity_id: productId,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { group_ids: groupIds },
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao associar grupos de adicionais ao produto.' };
    }
  },

  // ============================================================================
  // IMAGE UPLOAD TO SUPABASE STORAGE / LOCAL FALLBACK
  // ============================================================================
  async uploadMenuImage(
    file: File,
    restaurantId: string,
    folder: 'categories' | 'products' | 'add-ons',
    actorUserId?: string,
    supportSessionId?: string
  ): Promise<{ url?: string; error?: string }> {
    // Basic validation
    if (!file.type.startsWith('image/')) {
      return { error: 'O arquivo enviado deve ser uma imagem válida (PNG, JPG, WEBP).' };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { error: 'O tamanho da imagem não deve exceder 5MB.' };
    }

    if (!isSupabaseConfigured) {
      // Local fallback with FileReader base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Url = reader.result as string;
          await auditService.logEvent({
            action: 'MENU_IMAGE_UPLOADED',
            entity_type: folder,
            restaurant_id: restaurantId,
            actor_user_id: actorUserId,
            support_session_id: supportSessionId,
            metadata: { fileName: file.name, folder, size: file.size },
          });
          resolve({ url: base64Url });
        };
        reader.onerror = () => {
          resolve({ error: 'Erro ao processar imagem localmente.' });
        };
        reader.readAsDataURL(file);
      });
    }

    try {
      const ext = file.name.split('.').pop() || 'png';
      const cleanFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = `restaurants/${restaurantId}/menu/${folder}/${cleanFileName}`;

      const { data, error } = await supabase.storage
        .from('restaurant-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.warn('Supabase storage upload error, falling back to base64:', error.message);
        // Fallback to base64
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ url: reader.result as string });
          reader.onerror = () => resolve({ error: error.message });
          reader.readAsDataURL(file);
        });
      }

      const { data: publicUrlData } = supabase.storage
        .from('restaurant-assets')
        .getPublicUrl(data.path);

      const finalUrl = publicUrlData.publicUrl;

      await auditService.logEvent({
        action: 'MENU_IMAGE_UPLOADED',
        entity_type: folder,
        restaurant_id: restaurantId,
        actor_user_id: actorUserId,
        support_session_id: supportSessionId,
        metadata: { path: data.path, fileName: file.name },
      });

      return { url: finalUrl };
    } catch (err: any) {
      return { error: err.message || 'Erro durante o upload da imagem.' };
    }
  },
};
