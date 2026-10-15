-- ============================================================================
-- 🍕 PIZZA HARRISON — COMPLETE PRODUCTION SUPABASE BACKEND SCHEMA
-- ============================================================================
-- Single-file drop-in script for the Supabase SQL Editor.
-- Configures authentic Mathura pizzeria database, RLS policies, automated triggers,
-- realtime feeds, seed data, and super admin access for: sumitdevthakur@gmail.com
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'staff', 'manager', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_type_enum AS ENUM ('delivery', 'pickup', 'dine_in');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_status_enum AS ENUM ('placed', 'confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('cod', 'pay_at_counter', 'upi_qr', 'online');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE branch_enum AS ENUM ('pali_khera', 'gla_university');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE addon_category AS ENUM ('extra_cheese', 'veg_toppings', 'sauces', 'dips');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE discount_type_enum AS ENUM ('percentage', 'flat');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE booking_status_enum AS ENUM ('requested', 'confirmed', 'rejected', 'seated', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. PROFILES TABLE (Staff & Store Administrators)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    full_name TEXT NOT NULL,
    phone VARCHAR(15),
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- 4. CUSTOMERS TABLE (Storefront Customer Accounts)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(255),
    full_name TEXT NOT NULL,
    password_hash TEXT, -- PBKDF2 hash "salt:hash"
    total_orders INT NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
    total_spent_paise BIGINT NOT NULL DEFAULT 0 CHECK (total_spent_paise >= 0),
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- 5. CUSTOMER ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL DEFAULT 'Home',
    recipient_name TEXT NOT NULL,
    phone VARCHAR(15) NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    landmark TEXT,
    area TEXT NOT NULL,
    pincode VARCHAR(10) NOT NULL DEFAULT '281004',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);

-- 6. CUSTOMER SESSIONS TABLE
CREATE TABLE IF NOT EXISTS customer_sessions (
    token VARCHAR(128) PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    phone VARCHAR(15) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PHONE VERIFICATIONS (Anti-Fraud OTP Queue)
CREATE TABLE IF NOT EXISTS phone_verifications (
    request_id VARCHAR(64) PRIMARY KEY,
    phone VARCHAR(15) NOT NULL,
    otp_hash VARCHAR(128) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    token VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone);

-- 8. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active, sort_order);

-- 9. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    image_url TEXT,
    is_veg BOOLEAN NOT NULL DEFAULT true,
    is_spicy BOOLEAN NOT NULL DEFAULT false,
    is_bestseller BOOLEAN NOT NULL DEFAULT false,
    is_available BOOLEAN NOT NULL DEFAULT true,
    base_price_paise BIGINT NOT NULL CHECK (base_price_paise >= 0),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);

-- 10. PRODUCT VARIANTS TABLE (Sizes)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size_name TEXT NOT NULL,
    price_paise BIGINT NOT NULL CHECK (price_paise >= 0),
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, size_name)
);

-- 11. CRUST OPTIONS TABLE
CREATE TABLE IF NOT EXISTS crust_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    price_paise BIGINT NOT NULL DEFAULT 0 CHECK (price_paise >= 0),
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ADDONS TABLE (Toppings, Dips & Extra Cheese)
CREATE TABLE IF NOT EXISTS addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category addon_category NOT NULL DEFAULT 'veg_toppings',
    price_paise BIGINT NOT NULL CHECK (price_paise >= 0),
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(32) NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone VARCHAR(15) NOT NULL,
    customer_email VARCHAR(255),
    branch branch_enum NOT NULL DEFAULT 'pali_khera',
    order_type order_type_enum NOT NULL DEFAULT 'delivery',
    status order_status_enum NOT NULL DEFAULT 'placed',
    confirmation_status VARCHAR(30) NOT NULL DEFAULT 'confirmed', -- 'pending_confirmation', 'confirmed', 'rejected'
    confirmation_reason TEXT,
    idempotency_key VARCHAR(128) UNIQUE,
    source VARCHAR(50) NOT NULL DEFAULT 'direct_web',
    delivery_address_json JSONB,
    table_number VARCHAR(10),
    special_instructions TEXT,
    payment_method payment_method_enum NOT NULL DEFAULT 'cod',
    payment_status payment_status_enum NOT NULL DEFAULT 'pending',
    subtotal_paise BIGINT NOT NULL CHECK (subtotal_paise >= 0),
    discount_paise BIGINT NOT NULL DEFAULT 0 CHECK (discount_paise >= 0),
    coupon_code VARCHAR(32),
    delivery_fee_paise BIGINT NOT NULL DEFAULT 0 CHECK (delivery_fee_paise >= 0),
    gst_paise BIGINT NOT NULL DEFAULT 0 CHECK (gst_paise >= 0),
    packaging_fee_paise BIGINT NOT NULL DEFAULT 0 CHECK (packaging_fee_paise >= 0),
    total_paise BIGINT NOT NULL CHECK (total_paise >= 0),
    estimated_delivery_time TIMESTAMPTZ,
    cancellation_reason TEXT,
    whatsapp_handoff_initiated BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_confirmation ON orders(confirmation_status);

-- 14. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    size_name TEXT NOT NULL,
    crust_name TEXT,
    addons_json JSONB,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_paise BIGINT NOT NULL CHECK (unit_price_paise >= 0),
    total_price_paise BIGINT NOT NULL CHECK (total_price_paise >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 15. ORDER STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status order_status_enum NOT NULL,
    note TEXT,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. TABLE BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference VARCHAR(32) NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone VARCHAR(15) NOT NULL,
    customer_email VARCHAR(255),
    branch branch_enum NOT NULL DEFAULT 'pali_khera',
    guest_count INT NOT NULL CHECK (guest_count >= 1 AND guest_count <= 50),
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    seating_preference TEXT DEFAULT 'indoor_ac',
    special_requests TEXT,
    status booking_status_enum NOT NULL DEFAULT 'requested',
    staff_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date, booking_time);

-- 17. COUPONS TABLE
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    discount_type discount_type_enum NOT NULL,
    discount_value INT NOT NULL CHECK (discount_value > 0),
    min_order_paise BIGINT NOT NULL DEFAULT 0 CHECK (min_order_paise >= 0),
    max_discount_paise BIGINT CHECK (max_discount_paise IS NULL OR max_discount_paise > 0),
    max_uses INT DEFAULT NULL CHECK (max_uses IS NULL OR max_uses > 0),
    current_uses INT NOT NULL DEFAULT 0 CHECK (current_uses >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. LOYALTY REWARDS & LEDGER
CREATE TABLE IF NOT EXISTS loyalty_accounts (
    phone VARCHAR(15) PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    stamps_count INT NOT NULL DEFAULT 0 CHECK (stamps_count >= 0 AND stamps_count <= 100),
    lifetime_stamps INT NOT NULL DEFAULT 0 CHECK (lifetime_stamps >= 0),
    total_rewards_claimed INT NOT NULL DEFAULT 0 CHECK (total_rewards_claimed >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loyalty_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(15) NOT NULL REFERENCES loyalty_accounts(phone) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    stamps_change INT NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    order_total_paise BIGINT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. DAILY KITCHEN CHECKLISTS
CREATE TABLE IF NOT EXISTS daily_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch branch_enum NOT NULL DEFAULT 'pali_khera',
    checklist_date DATE NOT NULL,
    checklist_type VARCHAR(20) NOT NULL CHECK (checklist_type IN ('opening', 'closing')),
    items_json JSONB NOT NULL,
    submitted_by TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    UNIQUE(branch, checklist_date, checklist_type)
);

-- 20. INVENTORY & STORE EXPENSES
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0,
    min_threshold NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    cost_per_unit_paise BIGINT NOT NULL DEFAULT 0,
    branch branch_enum NOT NULL DEFAULT 'pali_khera',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    branch branch_enum NOT NULL DEFAULT 'pali_khera',
    paid_to TEXT NOT NULL,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'upi',
    recorded_by TEXT NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. RESTAURANT SETTINGS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS restaurant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value_json JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_state_json JSONB,
    new_state_json JSONB,
    actor_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================================
-- 22. SEED ROOT ADMINISTRATOR (sumitdevthakur@gmail.com)
-- ============================================================================
INSERT INTO profiles (id, email, full_name, phone, role, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'sumitdevthakur@gmail.com',
    'Sumit Dev Thakur',
    '7451800502',
    'admin',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    full_name = 'Sumit Dev Thakur',
    updated_at = NOW();

-- ============================================================================
-- 23. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE crust_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Returns true if caller is sumitdevthakur@gmail.com or admin profile
CREATE OR REPLACE FUNCTION is_root_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() ->> 'email' = 'sumitdevthakur@gmail.com' OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.email = auth.jwt() ->> 'email' 
            AND profiles.role = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Catalog Public Read Policies
DROP POLICY IF EXISTS "Public read categories" ON categories;
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read products" ON products;
CREATE POLICY "Public read products" ON products FOR SELECT USING (is_available = true);

DROP POLICY IF EXISTS "Public read variants" ON product_variants;
CREATE POLICY "Public read variants" ON product_variants FOR SELECT USING (is_available = true);

DROP POLICY IF EXISTS "Public read crusts" ON crust_options;
CREATE POLICY "Public read crusts" ON crust_options FOR SELECT USING (is_available = true);

DROP POLICY IF EXISTS "Public read addons" ON addons;
CREATE POLICY "Public read addons" ON addons FOR SELECT USING (is_available = true);

DROP POLICY IF EXISTS "Public read coupons" ON coupons;
CREATE POLICY "Public read coupons" ON coupons FOR SELECT USING (is_active = true);

-- Order & Booking Public Creation Policies
DROP POLICY IF EXISTS "Public create orders" ON orders;
CREATE POLICY "Public create orders" ON orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public create order items" ON order_items;
CREATE POLICY "Public create order items" ON order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public create bookings" ON bookings;
CREATE POLICY "Public create bookings" ON bookings FOR INSERT WITH CHECK (true);

-- ROOT ADMIN POLICIES (sumitdevthakur@gmail.com ONLY)
DROP POLICY IF EXISTS "Admin full access to all orders" ON orders;
CREATE POLICY "Admin full access to all orders" ON orders FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

DROP POLICY IF EXISTS "Admin full access to all order items" ON order_items;
CREATE POLICY "Admin full access to all order items" ON order_items FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

DROP POLICY IF EXISTS "Admin full access to customers" ON customers;
CREATE POLICY "Admin full access to customers" ON customers FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

DROP POLICY IF EXISTS "Admin full access to inventory" ON inventory_items;
CREATE POLICY "Admin full access to inventory" ON inventory_items FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

DROP POLICY IF EXISTS "Admin full access to store expenses" ON store_expenses;
CREATE POLICY "Admin full access to store expenses" ON store_expenses FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

DROP POLICY IF EXISTS "Admin full access to daily checklists" ON daily_checklists;
CREATE POLICY "Admin full access to daily checklists" ON daily_checklists FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

DROP POLICY IF EXISTS "Admin full access to loyalty accounts" ON loyalty_accounts;
CREATE POLICY "Admin full access to loyalty accounts" ON loyalty_accounts FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

DROP POLICY IF EXISTS "Admin full access to loyalty ledger" ON loyalty_ledger;
CREATE POLICY "Admin full access to loyalty ledger" ON loyalty_ledger FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

DROP POLICY IF EXISTS "Admin full access to bookings" ON bookings;
CREATE POLICY "Admin full access to bookings" ON bookings FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

DROP POLICY IF EXISTS "Admin full access to audit logs" ON audit_logs;
CREATE POLICY "Admin full access to audit logs" ON audit_logs FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

-- ============================================================================
-- 24. REALTIME REPLICATION PUBLICATION
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_checklists;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_items;

-- ============================================================================
-- 25. SEED DATA (Authentic Mathura Menu, Coupons, Inventory, Checklists)
-- ============================================================================

-- Categories
INSERT INTO categories (id, name, slug, description, sort_order, is_active) VALUES
('c1000000-0000-0000-0000-000000000001', 'Signature Pizzas', 'signature-pizzas', 'Handcrafted artisanal pizzas with slow-fermented dough and fresh toppings', 1, true),
('c1000000-0000-0000-0000-000000000002', 'Cheese Burst Specials', 'cheese-burst', 'Overflowing with gooey, molten premium mozzarella cheese blend', 2, true),
('c1000000-0000-0000-0000-000000000003', 'Stuffed Garlic Breads & Sides', 'garlic-breads-sides', 'Freshly baked garlic breads stuffed with cheese, corn, and herb butter', 3, true),
('c1000000-0000-0000-0000-000000000004', 'Burgers & Fries', 'burgers-fries', 'Crispy patties, seasoned fries, and gourmet sauces', 4, true),
('c1000000-0000-0000-0000-000000000005', 'Pastas', 'pastas', 'Penne tossed in creamy Alfredo white sauce or tangy Arrabbiata red sauce', 5, true),
('c1000000-0000-0000-0000-000000000006', 'Desserts & Thick Shakes', 'desserts-shakes', 'Decadent Choco Lava cakes and creamy ice cream shakes', 6, true)
ON CONFLICT (slug) DO NOTHING;

-- Crusts
INSERT INTO crust_options (id, name, description, price_paise, is_default, is_available) VALUES
('cr000000-0000-0000-0000-000000000001', 'New Hand Tossed', 'Classic artisan hand-stretched dough with seasoned crust', 0, true, true),
('cr000000-0000-0000-0000-000000000002', 'Cheese Burst', 'Crust filled with warm, molten liquid mozzarella cheese', 9900, false, true),
('cr000000-0000-0000-0000-000000000003', 'Fresh Pan', 'Soft and airy crust baked golden in heavy iron pans', 4900, false, true),
('cr000000-0000-0000-0000-000000000004', 'Thin Crust', 'Ultra light and crispy Italian style crust', 3900, false, true)
ON CONFLICT (name) DO NOTHING;

-- Addons
INSERT INTO addons (id, name, category, price_paise, is_available) VALUES
('ad000000-0000-0000-0000-000000000001', 'Extra Mozzarella Cheese', 'extra_cheese', 4900, true),
('ad000000-0000-0000-0000-000000000002', 'Fresh Spiced Paneer', 'veg_toppings', 4900, true),
('ad000000-0000-0000-0000-000000000003', 'Crisp Green Capsicum', 'veg_toppings', 3500, true),
('ad000000-0000-0000-0000-000000000004', 'Sweet Golden Corn', 'veg_toppings', 3500, true),
('ad000000-0000-0000-0000-000000000005', 'Sliced Black Olives', 'veg_toppings', 3500, true),
('ad000000-0000-0000-0000-000000000006', 'Tangy Sliced Jalapenos', 'veg_toppings', 3500, true),
('ad000000-0000-0000-0000-000000000007', 'Spicy Red Paprika', 'veg_toppings', 3500, true),
('ad000000-0000-0000-0000-000000000008', 'Fresh Button Mushrooms', 'veg_toppings', 4000, true),
('ad000000-0000-0000-0000-000000000009', 'Creamy Cheese Dip', 'dips', 2500, true),
('ad000000-0000-0000-0000-000000000010', 'Zesty Peri Peri Dip', 'dips', 2500, true)
ON CONFLICT (name) DO NOTHING;

-- Products
INSERT INTO products (id, category_id, name, slug, description, is_veg, is_spicy, is_bestseller, is_available, base_price_paise, sort_order) VALUES
('p1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Double Cheese Margherita', 'double-cheese-margherita', 'Rich heritage tomato sauce smothered with double portion of 100% mozzarella and basil oil', true, false, true, true, 24900, 1),
('p1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Harrison Farmhouse Deluxe', 'harrison-farmhouse-deluxe', 'Crunchy onion, crisp green capsicum, ripe tomatoes, golden corn, and button mushrooms', true, false, true, true, 34900, 2),
('p1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'Paneer Makhani Fusion', 'paneer-makhani-fusion', 'Tender paneer cubes marinated in creamy makhani sauce with crunchy capsicum & red paprika', true, true, true, true, 36900, 3),
('p1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'Veggie Lover’s Paradise', 'veggie-lovers-paradise', 'Loaded with capsicum, onion, tomatoes, jalapenos, paneer, corn, olives, and mushrooms', true, false, false, true, 35900, 4),
('p1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 'Mexican Fiery Wave', 'mexican-fiery-wave', 'Spicy Mexican seasoning, jalapenos, crisp onions, juicy sweet corn, and red paprika', true, true, false, true, 33900, 5),
('p1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', 'Peppy Paneer Cheese Burst', 'peppy-paneer-cheese-burst', 'Chunky spiced paneer with crisp capsicum, red paprika and molten cheese burst crust', true, true, true, true, 41900, 6),
('p1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000002', 'Harrison 7-Cheese Overload', 'harrison-7-cheese-overload', 'Mozzarella, Cheddar, Gouda, Parmesan, Monterey Jack, Ricotta drizzle, and Liquid Cream Cheese', true, false, true, true, 44900, 7),
('p1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000003', 'Stuffed Cheesy Garlic Bread', 'stuffed-cheesy-garlic-bread', 'Freshly baked baguette stuffed with mozzarella, seasoned sweet corn, and herb garlic butter', true, false, true, true, 16900, 8),
('p1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000003', 'Peri Peri Crinkle Fries', 'peri-peri-crinkle-fries', 'Crispy golden crinkle cut potatoes dusted with signature fiery peri-peri seasoning', true, true, true, true, 12900, 10),
('p1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000006', 'Warm Molten Choco Lava', 'warm-molten-choco-lava', 'Moist chocolate sponge cake filled with hot decadent molten Belgian chocolate center', true, false, true, true, 9900, 15)
ON CONFLICT (slug) DO NOTHING;

-- Variants
INSERT INTO product_variants (product_id, size_name, price_paise, is_default, is_available) VALUES
('p1000000-0000-0000-0000-000000000001', 'Regular 7"', 24900, true, true),
('p1000000-0000-0000-0000-000000000001', 'Medium 9"', 42900, false, true),
('p1000000-0000-0000-0000-000000000001', 'Large 12"', 61900, false, true),
('p1000000-0000-0000-0000-000000000002', 'Regular 7"', 34900, true, true),
('p1000000-0000-0000-0000-000000000002', 'Medium 9"', 56900, false, true),
('p1000000-0000-0000-0000-000000000002', 'Large 12"', 79900, false, true)
ON CONFLICT (product_id, size_name) DO NOTHING;

-- Coupons
INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_paise, max_discount_paise, max_uses, is_active) VALUES
('cp000000-0000-0000-0000-000000000001', 'GLA100', 'Flat ₹100 OFF for GLA University students & Mathura foodies on orders above ₹499', 'flat', 100, 49900, 10000, 1000, true),
('cp000000-0000-0000-0000-000000000002', 'PIZZA20', '20% OFF on all signature pizzas up to ₹120 on orders above ₹399', 'percentage', 20, 39900, 12000, 500, true),
('cp000000-0000-0000-0000-000000000003', 'HARRISON50', 'Flat ₹50 OFF on your first artisan pizza order above ₹299', 'flat', 50, 29900, 5000, 2000, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
