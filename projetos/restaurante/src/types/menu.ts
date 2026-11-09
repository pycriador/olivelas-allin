export type MenuStatus = 'active' | 'inactive';

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  sort_order: number;
  status: MenuStatus;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  product_count?: number;
}

export interface Product {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  short_description?: string | null;
  description?: string | null;
  sku?: string | null;
  image_url?: string | null;
  price: number;
  cost_price?: number | null;
  status: MenuStatus;
  available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  category?: Category | null;
  add_on_group_ids?: string[];
}

export interface AddOnGroup {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string | null;
  min_selections: number;
  max_selections: number;
  required: boolean;
  sort_order: number;
  status: MenuStatus;
  created_at: string;
  updated_at: string;
  add_ons?: AddOn[];
}

export interface AddOn {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
  status: MenuStatus;
  available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  group_ids?: string[];
}

export interface GroupAddOn {
  id: string;
  group_id: string;
  add_on_id: string;
  sort_order: number;
  created_at: string;
}

export interface ProductAddOnGroup {
  id: string;
  product_id: string;
  add_on_group_id: string;
  sort_order: number;
  created_at: string;
}

export interface MenuOverviewMetrics {
  totalCategories: number;
  totalProducts: number;
  activeProducts: number;
  unavailableProducts: number;
  totalAddOns: number;
  totalAddOnGroups: number;
  productsWithoutImage: number;
  emptyCategories: number;
}

export interface CategoryFilters {
  search?: string;
  status?: string;
  page: number;
  pageSize: number;
  sort?: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  status?: string;
  available?: string;
  page: number;
  pageSize: number;
  sort?: string;
}

export interface AddOnFilters {
  search?: string;
  status?: string;
  page: number;
  pageSize: number;
}
