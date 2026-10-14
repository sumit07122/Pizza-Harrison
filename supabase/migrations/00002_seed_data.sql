-- Pizza Harrison - Migration 00002: Seed Data
-- Authentic Mathura Menu, Branches, Crusts, Toppings, and Coupons

-- 1. CATEGORIES
INSERT INTO categories (id, name, slug, description, sort_order, is_active) VALUES
('c1000000-0000-0000-0000-000000000001', 'Signature Pizzas', 'signature-pizzas', 'Handcrafted artisanal pizzas with slow-fermented dough and fresh toppings', 1, true),
('c1000000-0000-0000-0000-000000000002', 'Cheese Burst Specials', 'cheese-burst', 'Overflowing with gooey, molten premium mozzarella cheese blend', 2, true),
('c1000000-0000-0000-0000-000000000003', 'Stuffed Garlic Breads & Sides', 'garlic-breads-sides', 'Freshly baked garlic breads stuffed with cheese, corn, and herb butter', 3, true),
('c1000000-0000-0000-0000-000000000004', 'Burgers & Fries', 'burgers-fries', 'Crispy patties, seasoned fries, and gourmet sauces', 4, true),
('c1000000-0000-0000-0000-000000000005', 'Pastas', 'pastas', 'Penne tossed in creamy Alfredo white sauce or tangy Arrabbiata red sauce', 5, true),
('c1000000-0000-0000-0000-000000000006', 'Desserts & Thick Shakes', 'desserts-shakes', 'Decadent Choco Lava cakes and creamy ice cream shakes', 6, true)
ON CONFLICT (slug) DO NOTHING;

-- 2. CRUST OPTIONS
INSERT INTO crust_options (id, name, description, price_paise, is_default, is_available) VALUES
('cr000000-0000-0000-0000-000000000001', 'New Hand Tossed', 'Classic artisan hand-stretched dough with seasoned crust', 0, true, true),
('cr000000-0000-0000-0000-000000000002', 'Cheese Burst', 'Crust filled with warm, molten liquid mozzarella cheese', 9900, false, true),
('cr000000-0000-0000-0000-000000000003', 'Fresh Pan', 'Soft and airy crust baked golden in heavy iron pans', 4900, false, true),
('cr000000-0000-0000-0000-000000000004', 'Thin Crust', 'Ultra light and crispy Italian style crust', 3900, false, true)
ON CONFLICT (name) DO NOTHING;

-- 3. ADDONS
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

-- 4. PRODUCTS
INSERT INTO products (id, category_id, name, slug, description, is_veg, is_spicy, is_bestseller, is_available, base_price_paise, sort_order) VALUES
-- Signature Pizzas
('p1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Double Cheese Margherita', 'double-cheese-margherita', 'Rich heritage tomato sauce smothered with double portion of 100% mozzarella and basil oil', true, false, true, true, 24900, 1),
('p1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Harrison Farmhouse Deluxe', 'harrison-farmhouse-deluxe', 'Crunchy onion, crisp green capsicum, ripe tomatoes, golden corn, and button mushrooms', true, false, true, true, 34900, 2),
('p1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'Paneer Makhani Fusion', 'paneer-makhani-fusion', 'Tender paneer cubes marinated in creamy makhani sauce with crunchy capsicum & red paprika', true, true, true, true, 36900, 3),
('p1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000001', 'Veggie Lover’s Paradise', 'veggie-lovers-paradise', 'Loaded with capsicum, onion, tomatoes, jalapenos, paneer, corn, olives, and mushrooms', true, false, false, true, 35900, 4),
('p1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 'Mexican Fiery Wave', 'mexican-fiery-wave', 'Spicy Mexican seasoning, jalapenos, crisp onions, juicy sweet corn, and red paprika', true, true, false, true, 33900, 5),

-- Cheese Burst Specials
('p1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', 'Peppy Paneer Cheese Burst', 'peppy-paneer-cheese-burst', 'Chunky spiced paneer with crisp capsicum, red paprika and molten cheese burst crust', true, true, true, true, 41900, 6),
('p1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000002', 'Harrison 7-Cheese Overload', 'harrison-7-cheese-overload', 'Mozzarella, Cheddar, Gouda, Parmesan, Monterey Jack, Ricotta drizzle, and Liquid Cream Cheese', true, false, true, true, 44900, 7),

-- Sides & Garlic Breads
('p1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000003', 'Stuffed Cheesy Garlic Bread', 'stuffed-cheesy-garlic-bread', 'Freshly baked baguette stuffed with mozzarella, seasoned sweet corn, and herb garlic butter', true, false, true, true, 16900, 8),
('p1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000003', 'Paneer Tikka Stuffed Bread', 'paneer-tikka-stuffed-bread', 'Stuffed with succulent marinated paneer tikka, spicy jalapenos, and melted cheese', true, true, false, true, 18900, 9),
('p1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000003', 'Peri Peri Crinkle Fries', 'peri-peri-crinkle-fries', 'Crispy golden crinkle cut potatoes dusted with signature fiery peri-peri seasoning', true, true, true, true, 12900, 10),

-- Burgers
('p1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000004', 'Harrison Crispy Paneer Burger', 'harrison-crispy-paneer-burger', 'Thick spiced cottage cheese steak patty, iceberg lettuce, melted cheese, and smoky tandoori mayo', true, false, true, true, 13900, 11),
('p1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000004', 'Veggie Crunch Supreme Burger', 'veggie-crunch-supreme-burger', 'Crispy spiced potato and vegetable patty with creamy herb dressing in toasted brioche bun', true, false, false, true, 9900, 12),

-- Pastas
('p1000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000005', 'Creamy Alfredo White Pasta', 'creamy-alfredo-white-pasta', 'Al dente penne in rich garlic Parmesan cream sauce with olives, mushrooms, and sweet corn', true, false, true, true, 21900, 13),
('p1000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000005', 'Spicy Arrabbiata Red Pasta', 'spicy-arrabbiata-red-pasta', 'Penne tossed in fiery sun-ripened Italian tomato sauce with basil and red chili flakes', true, true, false, true, 19900, 14),

-- Desserts & Shakes
('p1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000006', 'Warm Molten Choco Lava', 'warm-molten-choco-lava', 'Moist chocolate sponge cake filled with hot decadent molten Belgian chocolate center', true, false, true, true, 9900, 15),
('p1000000-0000-0000-0000-000000000016', 'c1000000-0000-0000-0000-000000000006', 'Oreo Overload Thick Shake', 'oreo-overload-thick-shake', 'Thick creamy vanilla ice cream shake blended with crushed Oreo cookies and chocolate fudge', true, false, true, true, 15900, 16),
('p1000000-0000-0000-0000-000000000017', 'c1000000-0000-0000-0000-000000000006', 'Crispy KitKat Fudge Shake', 'crispy-kitkat-fudge-shake', 'Rich chocolate shake with crunchy KitKat wafer chunks and whipped chocolate topping', true, false, false, true, 15900, 17)
ON CONFLICT (slug) DO NOTHING;

-- 5. PRODUCT VARIANTS (Size Pricing)
-- For Margherita
INSERT INTO product_variants (product_id, size_name, price_paise, is_default, is_available) VALUES
('p1000000-0000-0000-0000-000000000001', 'Regular 7"', 24900, true, true),
('p1000000-0000-0000-0000-000000000001', 'Medium 9"', 42900, false, true),
('p1000000-0000-0000-0000-000000000001', 'Large 12"', 61900, false, true),
-- For Farmhouse Deluxe
('p1000000-0000-0000-0000-000000000002', 'Regular 7"', 34900, true, true),
('p1000000-0000-0000-0000-000000000002', 'Medium 9"', 56900, false, true),
('p1000000-0000-0000-0000-000000000002', 'Large 12"', 79900, false, true),
-- For Paneer Makhani
('p1000000-0000-0000-0000-000000000003', 'Regular 7"', 36900, true, true),
('p1000000-0000-0000-0000-000000000003', 'Medium 9"', 59900, false, true),
('p1000000-0000-0000-0000-000000000003', 'Large 12"', 84900, false, true),
-- For Veggie Paradise
('p1000000-0000-0000-0000-000000000004', 'Regular 7"', 35900, true, true),
('p1000000-0000-0000-0000-000000000004', 'Medium 9"', 58900, false, true),
('p1000000-0000-0000-0000-000000000004', 'Large 12"', 82900, false, true),
-- For Mexican Fiery Wave
('p1000000-0000-0000-0000-000000000005', 'Regular 7"', 33900, true, true),
('p1000000-0000-0000-0000-000000000005', 'Medium 9"', 54900, false, true),
('p1000000-0000-0000-0000-000000000005', 'Large 12"', 77900, false, true),
-- For Peppy Paneer Cheese Burst
('p1000000-0000-0000-0000-000000000006', 'Regular 7"', 41900, true, true),
('p1000000-0000-0000-0000-000000000006', 'Medium 9"', 67900, false, true),
('p1000000-0000-0000-0000-000000000006', 'Large 12"', 92900, false, true),
-- For 7-Cheese Overload
('p1000000-0000-0000-0000-000000000007', 'Regular 7"', 44900, true, true),
('p1000000-0000-0000-0000-000000000007', 'Medium 9"', 71900, false, true),
('p1000000-0000-0000-0000-000000000007', 'Large 12"', 98900, false, true)
ON CONFLICT (product_id, size_name) DO NOTHING;

-- 6. COUPONS
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_paise, max_discount_paise, max_uses, is_active) VALUES
('GLA100', 'GLA University Special: Flat ₹100 Off on orders above ₹499', 'flat', 10000, 49900, NULL, 5000, true),
('HARRISON20', '20% Off on orders above ₹399 (Max discount ₹120)', 'percentage', 20, 39900, 12000, 10000, true),
('WELCOME50', 'Flat ₹50 Off on orders above ₹299 for new Mathura customers', 'flat', 5000, 29900, NULL, 5000, true),
('MIDNIGHT50', 'Late Night Feast: Flat ₹75 Off on orders above ₹349', 'flat', 7500, 34900, NULL, 2000, true)
ON CONFLICT (code) DO NOTHING;

-- 7. RESTAURANT SETTINGS
INSERT INTO restaurant_settings (key, value_json) VALUES
('branches', '[
  {
    "id": "pali_khera",
    "name": "Pizza Harrison - Pali Khera (Main Outlet)",
    "address": "Sonkh Road, Opp. Indian Oil Petrol Pump, Pali Khera, Mathura, UP 281004",
    "phone": "+91 94100 85555",
    "opens_at": "11:00",
    "closes_at": "23:30",
    "is_open": true,
    "has_dine_in": true,
    "google_maps_url": "https://maps.google.com/?q=Pizza+Harrison+Mathura+Sonkh+Road"
  },
  {
    "id": "gla_university",
    "name": "Pizza Harrison - GLA University Campus Branch",
    "address": "Near Gate No. 1, GLA University, NH-19, Chaumuhan, Mathura, UP 281406",
    "phone": "+91 98970 85555",
    "opens_at": "10:30",
    "closes_at": "01:00",
    "is_open": true,
    "has_dine_in": true,
    "google_maps_url": "https://maps.google.com/?q=GLA+University+Mathura+Gate+1"
  }
]'::JSONB),
('fees_and_taxes', '{
  "free_delivery_threshold_paise": 49900,
  "base_delivery_fee_paise": 4000,
  "gst_percentage": 5,
  "packaging_fee_paise": 1500,
  "currency": "INR",
  "timezone": "Asia/Kolkata"
}'::JSONB)
ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json;
