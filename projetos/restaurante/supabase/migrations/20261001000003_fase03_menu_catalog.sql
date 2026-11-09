-- ==============================================================================
-- OLIVELAS RESTAURANT — FASE 03: CARDÁPIO, CATEGORIAS, PRODUTOS E ADICIONAIS
-- Migration: 20261001000003_fase03_menu_catalog.sql
-- ==============================================================================

-- 0. HELPER FUNCTION: handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    description TEXT,
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS on_categories_updated ON public.categories;
CREATE TRIGGER on_categories_updated
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_categories_restaurant_sort ON public.categories(restaurant_id, sort_order ASC, name ASC);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_status ON public.categories(restaurant_id, status);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    short_description TEXT,
    description TEXT,
    sku TEXT,
    image_url TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    cost_price NUMERIC(10, 2) CHECK (cost_price IS NULL OR cost_price >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    available BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS on_products_updated ON public.products;
CREATE TRIGGER on_products_updated
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_products_restaurant_category ON public.products(restaurant_id, category_id);
CREATE INDEX IF NOT EXISTS idx_products_restaurant_status ON public.products(restaurant_id, status, available);
CREATE INDEX IF NOT EXISTS idx_products_restaurant_sort ON public.products(restaurant_id, sort_order ASC, name ASC);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(restaurant_id, sku) WHERE sku IS NOT NULL;

-- 3. ADD-ON GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.add_on_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    description TEXT,
    min_selections INTEGER NOT NULL DEFAULT 0 CHECK (min_selections >= 0),
    max_selections INTEGER NOT NULL DEFAULT 1 CHECK (max_selections >= min_selections),
    required BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS on_add_on_groups_updated ON public.add_on_groups;
CREATE TRIGGER on_add_on_groups_updated
    BEFORE UPDATE ON public.add_on_groups
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_add_on_groups_restaurant ON public.add_on_groups(restaurant_id, sort_order ASC);

-- 4. ADD-ONS TABLE (Individual add-on items)
CREATE TABLE IF NOT EXISTS public.add_ons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    available BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS on_add_ons_updated ON public.add_ons;
CREATE TRIGGER on_add_ons_updated
    BEFORE UPDATE ON public.add_ons
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_add_ons_restaurant ON public.add_ons(restaurant_id, sort_order ASC, name ASC);
CREATE INDEX IF NOT EXISTS idx_add_ons_status ON public.add_ons(restaurant_id, status, available);

-- 5. GROUP ADD-ONS JOIN TABLE (Associations between AddOnGroups and AddOns)
CREATE TABLE IF NOT EXISTS public.group_add_ons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.add_on_groups(id) ON DELETE CASCADE,
    add_on_id UUID NOT NULL REFERENCES public.add_ons(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_group_add_on UNIQUE (group_id, add_on_id)
);

CREATE INDEX IF NOT EXISTS idx_group_add_ons_group ON public.group_add_ons(group_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_group_add_ons_addon ON public.group_add_ons(add_on_id);

-- 6. PRODUCT ADD-ON GROUPS JOIN TABLE (Associations between Products and AddOnGroups)
CREATE TABLE IF NOT EXISTS public.product_add_on_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    add_on_group_id UUID NOT NULL REFERENCES public.add_on_groups(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_product_add_on_group UNIQUE (product_id, add_on_group_id)
);

CREATE INDEX IF NOT EXISTS idx_product_add_on_groups_prod ON public.product_add_on_groups(product_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_product_add_on_groups_group ON public.product_add_on_groups(add_on_group_id);

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.add_on_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_add_on_groups ENABLE ROW LEVEL SECURITY;

-- CATEGORIES POLICIES
DROP POLICY IF EXISTS categories_select_policy ON public.categories;
CREATE POLICY categories_select_policy ON public.categories
    FOR SELECT USING (
        public.is_global_admin() OR public.is_restaurant_member(restaurant_id)
    );

DROP POLICY IF EXISTS categories_insert_policy ON public.categories;
CREATE POLICY categories_insert_policy ON public.categories
    FOR INSERT WITH CHECK (
        public.is_global_admin() OR
        public.has_restaurant_role(restaurant_id, 'restaurant_admin') OR
        public.has_restaurant_role(restaurant_id, 'manager')
    );

DROP POLICY IF EXISTS categories_update_policy ON public.categories;
CREATE POLICY categories_update_policy ON public.categories
    FOR UPDATE USING (
        public.is_global_admin() OR
        public.has_restaurant_role(restaurant_id, 'restaurant_admin') OR
        public.has_restaurant_role(restaurant_id, 'manager')
    );

DROP POLICY IF EXISTS categories_delete_policy ON public.categories;
CREATE POLICY categories_delete_policy ON public.categories
    FOR DELETE USING (
        public.is_global_admin() OR
        public.has_restaurant_role(restaurant_id, 'restaurant_admin')
    );

-- PRODUCTS POLICIES
DROP POLICY IF EXISTS products_select_policy ON public.products;
CREATE POLICY products_select_policy ON public.products
    FOR SELECT USING (
        public.is_global_admin() OR public.is_restaurant_member(restaurant_id)
    );

DROP POLICY IF EXISTS products_insert_policy ON public.products;
CREATE POLICY products_insert_policy ON public.products
    FOR INSERT WITH CHECK (
        public.is_global_admin() OR
        public.has_restaurant_role(restaurant_id, 'restaurant_admin') OR
        public.has_restaurant_role(restaurant_id, 'manager')
    );

DROP POLICY IF EXISTS products_update_policy ON public.products;
CREATE POLICY products_update_policy ON public.products
    FOR UPDATE USING (
        public.is_global_admin() OR
        public.has_restaurant_role(restaurant_id, 'restaurant_admin') OR
        public.has_restaurant_role(restaurant_id, 'manager')
    );

DROP POLICY IF EXISTS products_delete_policy ON public.products;
CREATE POLICY products_delete_policy ON public.products
    FOR DELETE USING (
        public.is_global_admin() OR
        public.has_restaurant_role(restaurant_id, 'restaurant_admin')
    );

-- ADD-ON GROUPS POLICIES
DROP POLICY IF EXISTS add_on_groups_select_policy ON public.add_on_groups;
CREATE POLICY add_on_groups_select_policy ON public.add_on_groups
    FOR SELECT USING (
        public.is_global_admin() OR public.is_restaurant_member(restaurant_id)
    );

DROP POLICY IF EXISTS add_on_groups_insert_policy ON public.add_on_groups;
CREATE POLICY add_on_groups_insert_policy ON public.add_on_groups
    FOR INSERT WITH CHECK (
        public.is_global_admin() OR
        public.has_restaurant_role(restaurant_id, 'restaurant_admin') OR
        public.has_restaurant_role(restaurant_id, 'manager')
    );

DROP POLICY IF EXISTS add_on_groups_update_policy ON public.add_on_groups;
CREATE POLICY add_on_groups_update_policy ON public.add_on_groups
    FOR UPDATE USING (
        public.is_global_admin() OR
        public.has_restaurant_role(restaurant_id, 'restaurant_admin') OR
        public.has_restaurant_role(restaurant_id, 'manager')
    );

DROP POLICY IF EXISTS add_on_groups_delete_policy ON public.add_on_groups;
CREATE POLICY add_on_groups_delete_policy ON public.add_on_groups
    FOR DELETE USING (
        public.is_global_admin() OR
        public.has_restaurant_role(restaurant_id, 'restaurant_admin')
    );

-- ADD-ONS POLICIES
DROP POLICY IF EXISTS add_ons_select_policy ON public.add_ons;
CREATE POLICY add_ons_select_policy ON public.add_ons
    FOR SELECT USING (
        public.is_global_admin() OR public.is_restaurant_member(restaurant_id)
    );

DROP POLICY IF EXISTS add_ons_insert_policy ON public.add_ons;
CREATE POLICY add_ons_insert_policy ON public.add_ons
    FOR INSERT WITH CHECK (
        public.is_global_admin() OR
        public.has_restaurant_role(restaurant_id, 'restaurant_admin') OR
        public.has_restaurant_role(restaurant_id, 'manager')
    );

DROP POLICY IF EXISTS add_ons_update_policy ON public.add_ons;
CREATE POLICY add_ons_update_policy ON public.add_ons
    FOR UPDATE USING (
        public.is_global_admin() OR
        public.has_restaurant_role(restaurant_id, 'restaurant_admin') OR
        public.has_restaurant_role(restaurant_id, 'manager')
    );

DROP POLICY IF EXISTS add_ons_delete_policy ON public.add_ons;
CREATE POLICY add_ons_delete_policy ON public.add_ons
    FOR DELETE USING (
        public.is_global_admin() OR
        public.has_restaurant_role(restaurant_id, 'restaurant_admin')
    );

-- GROUP ADD-ONS POLICIES
DROP POLICY IF EXISTS group_add_ons_select_policy ON public.group_add_ons;
CREATE POLICY group_add_ons_select_policy ON public.group_add_ons
    FOR SELECT USING (
        public.is_global_admin() OR
        EXISTS (
            SELECT 1 FROM public.add_on_groups g
            WHERE g.id = group_id
              AND public.is_restaurant_member(g.restaurant_id)
        )
    );

DROP POLICY IF EXISTS group_add_ons_modify_policy ON public.group_add_ons;
CREATE POLICY group_add_ons_modify_policy ON public.group_add_ons
    FOR ALL USING (
        public.is_global_admin() OR
        EXISTS (
            SELECT 1 FROM public.add_on_groups g
            WHERE g.id = group_id
              AND (
                  public.has_restaurant_role(g.restaurant_id, 'restaurant_admin') OR
                  public.has_restaurant_role(g.restaurant_id, 'manager')
              )
        )
    );

-- PRODUCT ADD-ON GROUPS POLICIES
DROP POLICY IF EXISTS product_add_on_groups_select_policy ON public.product_add_on_groups;
CREATE POLICY product_add_on_groups_select_policy ON public.product_add_on_groups
    FOR SELECT USING (
        public.is_global_admin() OR
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_id
              AND public.is_restaurant_member(p.restaurant_id)
        )
    );

DROP POLICY IF EXISTS product_add_on_groups_modify_policy ON public.product_add_on_groups;
CREATE POLICY product_add_on_groups_modify_policy ON public.product_add_on_groups
    FOR ALL USING (
        public.is_global_admin() OR
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_id
              AND (
                  public.has_restaurant_role(p.restaurant_id, 'restaurant_admin') OR
                  public.has_restaurant_role(p.restaurant_id, 'manager')
              )
        )
    );

-- ==============================================================================
-- 8. STORAGE CONFIGURATION & POLICIES
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('restaurant-assets', 'restaurant-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public can read assets (images of menu, logo, categories)
DROP POLICY IF EXISTS "Public read restaurant assets" ON storage.objects;
CREATE POLICY "Public read restaurant assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'restaurant-assets');

-- Restaurant members or global admin can upload/update/delete menu assets
DROP POLICY IF EXISTS "Restaurant members upload assets" ON storage.objects;
CREATE POLICY "Restaurant members upload assets"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'restaurant-assets'
    AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Restaurant members update assets" ON storage.objects;
CREATE POLICY "Restaurant members update assets"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'restaurant-assets'
    AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Restaurant members delete assets" ON storage.objects;
CREATE POLICY "Restaurant members delete assets"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'restaurant-assets'
    AND auth.role() = 'authenticated'
);
