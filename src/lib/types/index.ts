// Pizza Harrison - Unified Domain Type Definitions
// Exact paise representation for all financial values (1 INR = 100 paise)

export type BranchId = 'pali_khera' | 'gla_university';

export type StaffRole = 'owner' | 'manager' | 'order_staff' | 'kitchen_staff';
export type UserRole = 'customer' | StaffRole;

export type OrderType = 'delivery' | 'pickup' | 'dine_in';

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'cod' | 'pay_at_counter' | 'upi_qr' | 'online';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type BookingStatus = 'requested' | 'confirmed' | 'rejected' | 'seated' | 'cancelled';

export type DiscountType = 'percentage' | 'flat' | 'bogo' | 'combo';

export type AddonCategory = 'extra_cheese' | 'veg_toppings' | 'sauces' | 'dips';

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size_name: string; // e.g. 'Regular 7"', 'Medium 9"', 'Large 12"'
  price_paise: number;
  is_default: boolean;
  is_available: boolean;
}

export interface CrustOption {
  id: string;
  name: string; // 'New Hand Tossed', 'Cheese Burst', 'Fresh Pan', 'Thin Crust'
  description?: string;
  price_paise: number;
  is_default: boolean;
  is_available: boolean;
}

export interface Addon {
  id: string;
  name: string;
  category: AddonCategory;
  price_paise: number;
  is_available: boolean;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  image_url?: string;
  is_veg: boolean;
  is_spicy: boolean;
  spice_level?: 'mild' | 'medium' | 'hot';
  ingredients?: string[];
  allergens?: string[];
  combo_items?: string[];
  original_price_paise?: number;
  combo_savings_paise?: number;
  is_bestseller: boolean;
  is_featured: boolean;
  is_available: boolean;
  is_price_verified: boolean; // Must be true before product can be published
  base_price_paise: number;
  sort_order: number;
  variants?: ProductVariant[];
  category?: Category;
}

export type ChecklistType = 'opening' | 'closing';

export interface DailyChecklistItem {
  id: string;
  task: string;
  category: 'operations' | 'inventory' | 'kitchen' | 'safety' | 'financial';
  completed: boolean;
  completed_by?: string;
  completed_at?: string;
  notes?: string;
}

export interface DailyChecklistRecord {
  id: string;
  date: string; // YYYY-MM-DD
  type: ChecklistType;
  items: DailyChecklistItem[];
  submitted_by?: string;
  submitted_at?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface CartItemAddon {
  id: string;
  name: string;
  price_paise: number;
}

export interface CartItem {
  id: string;
  product: Product;
  selectedVariant?: ProductVariant;
  selectedCrust?: CrustOption;
  selectedAddons: CartItemAddon[];
  specialInstructions?: string;
  unitPricePaise: number;
  quantity: number;
  totalPricePaise: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  variant_name?: string;
  variant?: string;
  crust_name?: string;
  crust?: string;
  unit_price_paise: number;
  quantity: number;
  addons_json: Array<{ name: string; price_paise: number }>;
  addons?: Array<{ name: string; price_paise: number }>;
  item_total_paise: number;
  total_paise?: number;
  special_instructions?: string;
}

export interface Order {
  id: string;
  order_number: string; // e.g. 'PH-20261014-9481'
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  order_type: OrderType;
  branch: BranchId;
  branch_id?: BranchId;
  delivery_address?: string;
  delivery_landmark?: string;
  delivery_instructions?: string;
  status: OrderStatus;
  confirmation_status?: 'confirmed' | 'pending_confirmation' | 'rejected';
  confirmation_reason?: string;
  idempotency_key?: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal_paise: number;
  discount_paise: number;
  delivery_fee_paise: number;
  tax_paise: number;
  packaging_fee_paise: number;
  total_paise: number;
  pricing?: {
    total_paise: number;
    subtotal_paise: number;
    discount_paise: number;
    delivery_fee_paise: number;
    tax_paise: number;
    packaging_fee_paise: number;
  };
  refunded_paise?: number;
  applied_coupon_code?: string;
  notes?: string;
  internal_notes?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status?: OrderStatus;
  new_status: OrderStatus;
  changed_by?: string;
  notes?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  booking_reference: string; // e.g. 'TB-20261014-412'
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  branch: BranchId;
  guest_count: number;
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // HH:MM
  seating_preference: string;
  special_requests?: string;
  status: BookingStatus;
  staff_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number; // percentage (e.g. 20) or flat paise (e.g. 10000 = ₹100)
  min_order_paise: number;
  max_discount_paise?: number | null;
  eligible_categories?: string[]; // category IDs or empty for all
  eligible_products?: string[];   // product IDs or empty for all
  terms_conditions?: string;
  max_uses?: number | null;
  max_uses_per_customer?: number | null; // e.g. 1 for first-order coupons
  current_uses: number;
  is_active: boolean;
  valid_from: string;
  valid_until?: string | null;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountPaise: number;
  message: string;
  coupon?: Coupon;
}

export interface CustomerSummary {
  phone: string;
  name: string;
  email?: string;
  total_orders: number;
  total_spent_paise: number;
  last_order_date: string;
  is_repeat: boolean;
}

export interface Review {
  id: string;
  customer_name: string;
  rating: number; // 1 to 5
  comment: string;
  branch: BranchId;
  is_approved: boolean;
  order_id?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  old_state_json?: any;
  new_state_json?: any;
  ip_address?: string;
  created_at: string;
}

export interface BranchDetails {
  id: BranchId;
  name: string;
  address: string;
  phone: string;
  opens_at: string;
  closes_at: string;
  is_open: boolean;
  has_dine_in: boolean;
  google_maps_url: string;
}

export interface HolidayClosure {
  id: string;
  date: string; // YYYY-MM-DD
  reason: string;
  branch: BranchId | 'all';
}

export interface RestaurantSettings {
  business_name: string;
  tagline: string;
  city: string;
  primary_phone: string;
  whatsapp_number: string;
  support_email: string;
  currency: 'INR';
  timezone: 'Asia/Kolkata';
  free_delivery_threshold_paise: number;
  base_delivery_fee_paise: number;
  gst_percentage: number;
  packaging_fee_paise: number;
  estimated_prep_time_minutes: number;
  is_online_ordering_enabled: boolean;
  is_table_booking_enabled: boolean;
  enabled_payment_methods: {
    cod: boolean;
    pay_at_counter: boolean;
    upi_qr: boolean;
    online_gateway: boolean;
  };
  holiday_closures: HolidayClosure[];
  privacy_data_retention_days: number;
  cod_confirmation_threshold_paise?: number; // e.g. 150000 = ₹1,500
  require_phone_verification?: boolean;
}

// ==========================================
// INVENTORY & STOCK MANAGEMENT
// ==========================================

export type InventoryItemCategory =
  | 'flour_dough'
  | 'cheese_dairy'
  | 'sauces'
  | 'vegetables'
  | 'packaging'
  | 'beverages'
  | 'cleaning_supplies'
  | 'utilities'
  | 'other';

export type InventoryUnit = 'kg' | 'liters' | 'packets' | 'boxes' | 'pcs';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryItemCategory;
  unit: InventoryUnit;
  current_quantity: number;
  low_stock_threshold: number;
  purchase_cost_paise: number; // Cost per unit in paise
  supplier_name?: string;
  last_purchased_date?: string;
  last_updated_at: string;
}

export type StockMovementType = 'purchase' | 'adjustment' | 'wastage' | 'manual_count';

export interface StockMovement {
  id: string;
  item_id: string;
  item_name: string;
  movement_type: StockMovementType;
  quantity_delta: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  purchase_cost_paise?: number;
  recorded_by: string;
  created_at: string;
}

// ==========================================
// STORE EXPENSES
// ==========================================

export type ExpenseCategory =
  | 'raw_materials'
  | 'utilities'
  | 'packaging'
  | 'maintenance'
  | 'staff_wages'
  | 'rent'
  | 'marketing'
  | 'other';

export interface StoreExpense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount_paise: number;
  payment_method: 'cash' | 'upi' | 'bank_transfer';
  receipt_number?: string;
  recorded_by: string;
  date: string;
  created_at: string;
}

// ==========================================
// CUSTOMER LOYALTY PROGRAM (PIZZA HARRISON REWARDS)
// ==========================================

export type LoyaltyEventType =
  | 'stamp_earned'
  | 'stamp_revoked'
  | 'reward_unlocked'
  | 'reward_redeemed'
  | 'manual_adjustment';

export interface LoyaltyProgramConfig {
  is_active: boolean;
  min_order_paise: number; // ₹299 = 29900 paise
  stamps_required: number; // 6 stamps
  reward_pizza_name: string; // 'Regular Margherita or Farmhouse'
  eligible_reward_product_ids: string[];
  allow_coupon_stacking: boolean;
  terms: string;
}

export interface LoyaltyAccount {
  id: string;
  customer_phone: string;
  customer_name: string;
  stamps_count: number; // Current stamps towards next reward (0 to 5)
  total_stamps_earned: number;
  available_rewards_count: number;
  rewards_redeemed_count: number;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyLedgerEntry {
  id: string;
  customer_phone: string;
  order_id?: string;
  order_number?: string;
  event_type: LoyaltyEventType;
  stamps_delta: number;
  order_subtotal_paise?: number;
  reason: string;
  recorded_by: string;
  created_at: string;
}

// ==========================================
// STORE OPERATIONS: DAILY SOP CHECKLISTS
// ==========================================

export interface DailyChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  completed_by?: string;
  completed_at?: string;
}

export interface DailyChecklistRecord {
  id: string;
  date: string;
  type: 'opening' | 'closing';
  status: 'pending' | 'in_progress' | 'completed';
  items: DailyChecklistItem[];
  submitted_by?: string;
  submitted_at?: string;
  notes?: string;
}

// ==========================================
// CUSTOMER IDENTITY, ACCOUNTS & VERIFICATION
// ==========================================

export interface CustomerAddress {
  id: string;
  label: 'Home' | 'Hostel' | 'Office' | 'Other' | string;
  type?: 'Home' | 'Hostel' | 'Office' | 'Other' | 'Work' | 'home' | 'work' | 'other' | string;
  address_line: string;
  street?: string;
  area?: string;
  city?: string;
  pincode?: string;
  landmark?: string;
  is_default: boolean;
}

export interface CustomerAccount {
  id: string; // e.g. 'cust-179200384'
  phone: string; // 10-digit Indian phone
  phone_verified: boolean;
  full_name: string;
  name?: string; // alias
  email?: string;
  email_verified?: boolean;
  avatar_url?: string;
  google_id?: string;
  password_hash?: string; // salt:hash format
  saved_addresses: CustomerAddress[];
  favorites: string[]; // product IDs
  loyalty_stamps?: number;
  total_orders?: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerSession {
  token: string;
  customer_id: string;
  phone: string;
  expires_at: number; // timestamp in ms
  created_at: string;
}

export interface PhoneVerificationRequest {
  id: string;
  phone: string;
  otp_hash: string;
  expires_at: number; // timestamp in ms
  attempts: number;
  verified: boolean;
  created_at: number;
}

export interface CreateOrderPayload {
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  order_type: OrderType;
  branch: BranchId;
  delivery_address?: string;
  delivery_landmark?: string;
  delivery_instructions?: string;
  payment_method: PaymentMethod;
  applied_coupon_code?: string;
  notes?: string;
  idempotency_key?: string;
  phone_verification_token?: string;
  items: Array<{
    product_id: string;
    variant_size_name?: string;
    crust_name?: string;
    addon_ids?: string[];
    quantity: number;
    special_instructions?: string;
  }>;
}


