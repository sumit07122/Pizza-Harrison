-- Pizza Harrison - Migration 00003: Customer Accounts, Anti-Abuse, Loyalty & Operations
-- Enhances database for complete production backend with Supabase RLS and Admin Access Control
-- AUTHORIZED ADMIN: sumitdevthakur@gmail.com

-- 1. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(255),
    full_name TEXT NOT NULL,
    password_hash TEXT, -- PBKDF2 hash: "salt:hash"
    total_orders INT NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
    total_spent_paise BIGINT NOT NULL DEFAULT 0 CHECK (total_spent_paise >= 0),
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- 2. CUSTOMER ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL DEFAULT 'Home', -- 'Home', 'Work', 'Hostel', 'Other'
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

-- 3. CUSTOMER SESSIONS TABLE
CREATE TABLE IF NOT EXISTS customer_sessions (
    token VARCHAR(128) PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    phone VARCHAR(15) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_sessions_expiry ON customer_sessions(expires_at);

-- 4. PHONE VERIFICATIONS (Anti-Fraud OTP Queue)
CREATE TABLE IF NOT EXISTS phone_verifications (
    request_id VARCHAR(64) PRIMARY KEY,
    phone VARCHAR(15) NOT NULL,
    otp_hash VARCHAR(128) NOT NULL, -- HMAC-SHA256 hash
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    token VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expiry ON phone_verifications(expires_at);

-- 5. ORDER IDEMPOTENCY KEYS (Anti-Double Charge & Duplication)
CREATE TABLE IF NOT EXISTS order_idempotency_keys (
    key VARCHAR(128) PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. LOYALTY ACCOUNTS & REWARDS
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
    event_type VARCHAR(50) NOT NULL, -- 'STAMP_EARNED', 'REWARD_REDEEMED', 'ADMIN_ADJUSTMENT'
    stamps_change INT NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    order_total_paise BIGINT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_ledger_phone ON loyalty_ledger(phone);

-- 7. DAILY KITCHEN CHECKLISTS
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

-- 8. INVENTORY & STOCK
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Dairy', 'Vegetables', 'Flour & Dough', 'Packaging', 'Beverages'
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0,
    min_threshold NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL, -- 'kg', 'ltr', 'pcs', 'boxes'
    cost_per_unit_paise BIGINT NOT NULL DEFAULT 0,
    branch branch_enum NOT NULL DEFAULT 'pali_khera',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('inflow', 'outflow', 'waste', 'adjustment')),
    quantity NUMERIC(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    recorded_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. STORE EXPENSES
CREATE TABLE IF NOT EXISTS store_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Vegetables', 'Dairy & Cheese', 'Utilities', 'Salaries', 'Repairs'
    amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
    branch branch_enum NOT NULL DEFAULT 'pali_khera',
    paid_to TEXT NOT NULL,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'upi',
    recorded_by TEXT NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. ALTER ORDERS TABLE WITH ANTI-ABUSE COLUMNS
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS confirmation_status VARCHAR(30) NOT NULL DEFAULT 'confirmed',
ADD COLUMN IF NOT EXISTS confirmation_reason TEXT,
ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128) UNIQUE,
ADD COLUMN IF NOT EXISTS source VARCHAR(50) NOT NULL DEFAULT 'direct_web',
ADD COLUMN IF NOT EXISTS whatsapp_handoff_initiated BOOLEAN NOT NULL DEFAULT false;

-- 11. ROOT ADMIN INITIALIZATION
-- Ensures sumitdevthakur@gmail.com has owner/admin status in profiles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        INSERT INTO profiles (id, full_name, phone, role, created_at, updated_at)
        VALUES (
            '00000000-0000-0000-0000-000000000001',
            'Sumit Dev Thakur (Root Admin)',
            '7451800502',
            'admin',
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'admin',
            full_name = 'Sumit Dev Thakur (Root Admin)',
            updated_at = NOW();
    END IF;
END $$;

-- 12. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_expenses ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is sumitdevthakur@gmail.com
CREATE OR REPLACE FUNCTION is_root_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() ->> 'email' = 'sumitdevthakur@gmail.com' OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'staff', 'manager')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Super Admin Full CRUD Policies on all operational tables
CREATE POLICY "Root Admin full access on customers" ON customers
    FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

CREATE POLICY "Root Admin full access on orders" ON orders
    FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

CREATE POLICY "Root Admin full access on order items" ON order_items
    FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

CREATE POLICY "Root Admin full access on inventory" ON inventory_items
    FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

CREATE POLICY "Root Admin full access on stock movements" ON stock_movements
    FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

CREATE POLICY "Root Admin full access on store expenses" ON store_expenses
    FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

CREATE POLICY "Root Admin full access on daily checklists" ON daily_checklists
    FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

CREATE POLICY "Root Admin full access on loyalty accounts" ON loyalty_accounts
    FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

CREATE POLICY "Root Admin full access on loyalty ledger" ON loyalty_ledger
    FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

CREATE POLICY "Root Admin full access on bookings" ON bookings
    FOR ALL USING (is_root_admin()) WITH CHECK (is_root_admin());

-- Customer self-service policies
CREATE POLICY "Customers can view their own profile" ON customers
    FOR SELECT USING (phone = current_setting('request.jwt.claim.phone', true) OR is_root_admin());

CREATE POLICY "Customers can manage their own addresses" ON customer_addresses
    FOR ALL USING (
        customer_id IN (SELECT id FROM customers WHERE phone = current_setting('request.jwt.claim.phone', true)) 
        OR is_root_admin()
    );

CREATE POLICY "Customers can view their own loyalty balance" ON loyalty_accounts
    FOR SELECT USING (phone = current_setting('request.jwt.claim.phone', true) OR is_root_admin());

CREATE POLICY "Customers can view their own loyalty ledger" ON loyalty_ledger
    FOR SELECT USING (phone = current_setting('request.jwt.claim.phone', true) OR is_root_admin());

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE daily_checklists;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_items;
