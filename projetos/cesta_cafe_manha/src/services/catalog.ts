import { supabase } from "@/integrations/supabase/client";
import type { Category, Product } from "@/types/domain";

export type ProductInput = {
  name: string;
  sku: string | null;
  category_id: string | null;
  unit: string;
  cost_price: number;
  sale_price: number;
  min_stock: number;
  description: string | null;
  active: boolean;
};

export type CategoryInput = {
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  active: boolean;
};

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createProduct(input: ProductInput, actorId: string): Promise<Product> {
  const { data, error } = await supabase.from("products").insert(input).select("*").single();
  if (error) throw error;
  await logAudit(actorId, "insert", "products", data.id, null, data);
  return data;
}

export async function updateProduct(
  product: Product,
  input: ProductInput,
  actorId: string,
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update(input)
    .eq("id", product.id)
    .select("*")
    .single();
  if (error) throw error;
  await logAudit(actorId, "update", "products", product.id, product, data);
  return data;
}

export async function deleteProduct(product: Product, actorId: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", product.id);
  if (error) throw error;
  await logAudit(actorId, "delete", "products", product.id, product, null);
}

export async function createCategory(input: CategoryInput, actorId: string): Promise<Category> {
  const { data, error } = await supabase.from("categories").insert(input).select("*").single();
  if (error) throw error;
  await logAudit(actorId, "insert", "categories", data.id, null, data);
  return data;
}

export async function updateCategory(
  category: Category,
  input: CategoryInput,
  actorId: string,
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .update(input)
    .eq("id", category.id)
    .select("*")
    .single();
  if (error) throw error;
  await logAudit(actorId, "update", "categories", category.id, category, data);
  return data;
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

async function logAudit(
  actorId: string,
  action: string,
  table: string,
  recordId: string,
  before: unknown,
  after: unknown,
): Promise<void> {
  await supabase.from("audit_logs").insert({
    user_id: actorId,
    action,
    table_name: table,
    record_id: recordId,
    before_data: (before ?? null) as never,
    after_data: (after ?? null) as never,
  });
}
