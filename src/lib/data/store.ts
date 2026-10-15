// Pizza Harrison - Unified Data Repository & Transaction Layer
// Seamlessly delegates to Supabase PostgreSQL when credentials exist,
// or provides resilient in-memory storage seeded with authentic Mathura data.

import {
  Category,
  Product,
  CrustOption,
  Addon,
  Order,
  OrderStatus,
  Booking,
  BookingStatus,
  Coupon,
  Review,
  BranchDetails,
  Profile,
  StaffRole,
  RestaurantSettings,
  AuditLog,
  CustomerSummary,
  InventoryItem,
  StockMovement,
  StoreExpense,
  LoyaltyProgramConfig,
  LoyaltyAccount,
  LoyaltyLedgerEntry,
  DailyChecklistRecord,
  DailyChecklistItem,
  CustomerAccount,
  CustomerAddress,
  CustomerSession,
  PhoneVerificationRequest,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_CRUSTS,
  INITIAL_ADDONS,
  INITIAL_COUPONS,
  INITIAL_REVIEWS,
  INITIAL_ORDERS,
  INITIAL_BOOKINGS,
  INITIAL_BRANCHES,
  INITIAL_STAFF_MEMBERS,
  INITIAL_SETTINGS,
  INITIAL_AUDIT_LOGS,
  INITIAL_INVENTORY_ITEMS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_STORE_EXPENSES,
  INITIAL_LOYALTY_CONFIG,
  INITIAL_LOYALTY_ACCOUNTS,
  INITIAL_LOYALTY_LEDGER,
  INITIAL_DAILY_CHECKLISTS,
  DEFAULT_OPENING_TASKS,
  DEFAULT_CLOSING_TASKS,
  INITIAL_CUSTOMERS,
} from './mock-data';
import { getSupabaseServerClient } from '../supabase/server';
import { calculateFullPricing } from '../pricing';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  generateSecureOtp,
  hashOtp,
  timingSafeMatch,
} from '../security/crypto';
import { rateLimiter, RATE_LIMITS } from '../security/rate-limit';

// Global singleton in-memory state for development & fallback mode
class MemoryDataStore {
  categories: Category[] = JSON.parse(JSON.stringify(INITIAL_CATEGORIES));
  products: Product[] = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
  crusts: CrustOption[] = [...INITIAL_CRUSTS];
  addons: Addon[] = [...INITIAL_ADDONS];
  coupons: Coupon[] = JSON.parse(JSON.stringify(INITIAL_COUPONS));
  reviews: Review[] = [...INITIAL_REVIEWS];
  orders: Order[] = JSON.parse(JSON.stringify(INITIAL_ORDERS));
  bookings: Booking[] = JSON.parse(JSON.stringify(INITIAL_BOOKINGS));
  branches: BranchDetails[] = [...INITIAL_BRANCHES];
  staff: Profile[] = JSON.parse(JSON.stringify(INITIAL_STAFF_MEMBERS));
  settings: RestaurantSettings = JSON.parse(JSON.stringify(INITIAL_SETTINGS));
  auditLogs: AuditLog[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
  inventory: InventoryItem[] = JSON.parse(JSON.stringify(INITIAL_INVENTORY_ITEMS));
  stockMovements: StockMovement[] = JSON.parse(JSON.stringify(INITIAL_STOCK_MOVEMENTS));
  expenses: StoreExpense[] = JSON.parse(JSON.stringify(INITIAL_STORE_EXPENSES));
  loyaltyConfig: LoyaltyProgramConfig = JSON.parse(JSON.stringify(INITIAL_LOYALTY_CONFIG));
  loyaltyAccounts: LoyaltyAccount[] = JSON.parse(JSON.stringify(INITIAL_LOYALTY_ACCOUNTS));
  loyaltyLedger: LoyaltyLedgerEntry[] = JSON.parse(JSON.stringify(INITIAL_LOYALTY_LEDGER));
  dailyChecklists: DailyChecklistRecord[] = JSON.parse(JSON.stringify(INITIAL_DAILY_CHECKLISTS));
  customers: CustomerAccount[] = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
  customerSessions: CustomerSession[] = [];
  phoneVerifications: PhoneVerificationRequest[] = [];
  orderIdempotencyKeys: Map<string, { order: Order; timestamp: number }> = new Map();
}

const globalForStore = globalThis as unknown as { pizzaStore: MemoryDataStore };
export const memoryStore = globalForStore.pizzaStore || new MemoryDataStore();
if (process.env.NODE_ENV !== 'production') globalForStore.pizzaStore = memoryStore;

// --- MENU & CATALOG API ---

export async function fetchCategories(): Promise<Category[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (!error && data && data.length > 0) return data;
  }
  return memoryStore.categories.filter((c) => c.is_active);
}

export async function fetchProducts(categoryId?: string): Promise<Product[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    let query = supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('is_available', true)
      .order('sort_order', { ascending: true });
    if (categoryId) query = query.eq('category_id', categoryId);

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        ...item,
        variants: item.product_variants || [],
      }));
    }
  }

  let list = memoryStore.products;
  if (categoryId) {
    list = list.filter((p) => p.category_id === categoryId);
  }
  return list;
}

export async function fetchAllProductsAdmin(): Promise<Product[]> {
  return memoryStore.products;
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const products = await fetchProducts();
  return products.find((p) => p.slug === slug) || null;
}

export async function fetchCrustOptions(): Promise<CrustOption[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('crust_options').select('*').eq('is_available', true);
      if (!error && data && data.length > 0) return data;
    } catch (e) {}
  }
  return memoryStore.crusts.filter((c) => c.is_available);
}

export async function fetchAddons(): Promise<Addon[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('addons').select('*').eq('is_available', true);
      if (!error && data && data.length > 0) return data;
    } catch (e) {}
  }
  return memoryStore.addons.filter((a) => a.is_available);
}

export async function toggleProductAvailability(
  productId: string,
  isAvailable: boolean
): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    await supabase.from('products').update({ is_available: isAvailable }).eq('id', productId);
  }
  const item = memoryStore.products.find((p) => p.id === productId);
  if (item) {
    item.is_available = isAvailable;
    return true;
  }
  return false;
}

export async function updateProductPricePaise(
  productId: string,
  variantSizeName: string | null,
  newPricePaise: number
): Promise<boolean> {
  const item = memoryStore.products.find((p) => p.id === productId);
  if (!item) return false;

  if (variantSizeName && item.variants) {
    const variant = item.variants.find((v) => v.size_name === variantSizeName);
    if (variant) {
      variant.price_paise = newPricePaise;
      return true;
    }
  } else {
    item.base_price_paise = newPricePaise;
    return true;
  }
  return false;
}

// --- COUPON VALIDATION ENGINE ---

export async function validateCouponCode(
  code: string,
  subtotalPaise: number
): Promise<{ valid: boolean; discountPaise: number; message: string; coupon?: Coupon }> {
  const cleanCode = code.trim().toUpperCase();
  const coupon = memoryStore.coupons.find((c) => c.code.toUpperCase() === cleanCode);

  if (!coupon) {
    return { valid: false, discountPaise: 0, message: 'Invalid promo code. Please check spelling.' };
  }
  if (!coupon.is_active) {
    return { valid: false, discountPaise: 0, message: `Coupon ${coupon.code} is no longer active.` };
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
    return { valid: false, discountPaise: 0, message: `Coupon ${coupon.code} has expired.` };
  }
  if (coupon.min_order_paise > 0 && subtotalPaise < coupon.min_order_paise) {
    const needed = Math.ceil((coupon.min_order_paise - subtotalPaise) / 100);
    return {
      valid: false,
      discountPaise: 0,
      message: `Add items worth ₹${needed} more to apply coupon ${coupon.code}. (Min ₹${coupon.min_order_paise / 100})`,
    };
  }

  let discount = 0;
  if (coupon.discount_type === 'flat') {
    discount = coupon.discount_value;
  } else if (coupon.discount_type === 'percentage') {
    discount = Math.floor((subtotalPaise * coupon.discount_value) / 100);
  }

  if (coupon.max_discount_paise && coupon.max_discount_paise > 0) {
    discount = Math.min(discount, coupon.max_discount_paise);
  }
  discount = Math.min(discount, subtotalPaise);

  return {
    valid: true,
    discountPaise: discount,
    message: `Coupon ${coupon.code} applied! Saved ₹${discount / 100}.`,
    coupon,
  };
}

// --- TRUSTED ORDER CREATION & LIFECYCLE ---

export interface CreateOrderPayload {
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  order_type: 'delivery' | 'pickup' | 'dine_in';
  branch: 'pali_khera' | 'gla_university';
  delivery_address?: string;
  delivery_landmark?: string;
  delivery_instructions?: string;
  payment_method: 'cod' | 'pay_at_counter' | 'upi_qr' | 'online';
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

/**
 * Verify if a phone number has been authenticated or verified via OTP.
 */
export async function verifyCustomerPhoneOwnership(
  phone: string,
  customerId?: string,
  token?: string
): Promise<boolean> {
  const cleanPhone = phone.replace(/\D/g, '');

  // 1. Check if token matches an active customer session
  if (token) {
    const session = memoryStore.customerSessions.find(
      (s) => s.token === token && s.phone === cleanPhone && s.expires_at > Date.now()
    );
    if (session) return true;

    // Check if token matches a valid phone verification request
    const ver = memoryStore.phoneVerifications.find(
      (v) => v.id === token && v.phone === cleanPhone && v.verified && v.expires_at > Date.now()
    );
    if (ver) return true;
  }

  // 2. Check if customerId belongs to a verified registered customer
  if (customerId) {
    const cust = memoryStore.customers.find((c) => c.id === customerId && c.phone === cleanPhone);
    if (cust && cust.phone_verified) return true;
  }

  // 3. Check if phone is in verified registered customer database
  const knownCustomer = memoryStore.customers.find((c) => c.phone === cleanPhone);
  if (knownCustomer && knownCustomer.phone_verified) {
    return true;
  }

  // 4. Check if phone was verified via recent OTP verification within validity window
  const recentVerified = memoryStore.phoneVerifications.find(
    (v) => v.phone === cleanPhone && v.verified && v.expires_at > Date.now()
  );
  if (recentVerified) {
    return true;
  }

  // 5. In test / dev environments when setting is explicitly disabled
  if (memoryStore.settings.require_phone_verification === false) {
    return true;
  }

  return false;
}

export async function createOrderServerTrusted(
  payload: CreateOrderPayload
): Promise<{ success: boolean; order?: Order; error?: string }> {
  // 1. Basic validation
  if (!payload.customer_name || payload.customer_name.trim().length < 2) {
    return { success: false, error: 'Valid customer name is required.' };
  }
  const cleanPhone = payload.customer_phone.replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return { success: false, error: 'Valid 10-digit mobile number is required.' };
  }
  if (!payload.items || payload.items.length === 0) {
    return { success: false, error: 'Cannot create order with an empty cart.' };
  }
  if (payload.order_type === 'delivery' && (!payload.delivery_address || payload.delivery_address.trim().length < 5)) {
    return { success: false, error: 'Complete delivery address is required for food delivery.' };
  }

  // Check store online ordering status
  if (!memoryStore.settings.is_online_ordering_enabled) {
    return {
      success: false,
      error: 'Pizza Harrison is currently closed and not accepting online orders right now. Please check our opening hours or call the store directly.',
    };
  }

  // 2. Rate Limiting Protection (Anti-Abuse)
  const rateKey = `order:${cleanPhone}`;
  const rateCheck = rateLimiter.check(rateKey, RATE_LIMITS.ORDER_CREATE.limit, RATE_LIMITS.ORDER_CREATE.windowMs);
  if (!rateCheck.allowed) {
    return {
      success: false,
      error: `Too many order attempts in a short period. Please wait ${Math.ceil(rateCheck.resetMs / 60000)} minute(s) before trying again.`,
    };
  }

  // 3. Idempotency Check (Anti-Duplicate Submission)
  if (payload.idempotency_key) {
    const existingEntry = memoryStore.orderIdempotencyKeys.get(payload.idempotency_key);
    if (existingEntry && Date.now() - existingEntry.timestamp < 10 * 60 * 1000) {
      return { success: true, order: existingEntry.order };
    }
  }

  // 4. Check Phone Verification Enforcement
  const isPhoneVerified = await verifyCustomerPhoneOwnership(
    cleanPhone,
    payload.customer_id,
    payload.phone_verification_token
  );
  if (!isPhoneVerified) {
    return {
      success: false,
      error: 'Please verify your mobile number with OTP before submitting your order.',
    };
  }

  // 5. Fetch current prices & build immutable items snapshot
  const orderItemsSnapshot: any[] = [];
  const itemsForPricing: Array<{ unitPricePaise: number; quantity: number }> = [];

  for (const requestedItem of payload.items) {
    const product = memoryStore.products.find((p) => p.id === requestedItem.product_id);
    if (!product) {
      return { success: false, error: `Product ID ${requestedItem.product_id} no longer exists.` };
    }
    if (!product.is_available) {
      return { success: false, error: `Sorry, ${product.name} is currently out of stock.` };
    }

    let unitPrice = product.base_price_paise;
    let variantName: string | undefined = undefined;

    if (requestedItem.variant_size_name && product.variants) {
      const variant = product.variants.find((v) => v.size_name === requestedItem.variant_size_name);
      if (variant) {
        unitPrice = variant.price_paise;
        variantName = variant.size_name;
      }
    }

    let crustPrice = 0;
    let crustName: string | undefined = undefined;
    if (requestedItem.crust_name) {
      const crust = memoryStore.crusts.find((c) => c.name === requestedItem.crust_name);
      if (crust) {
        crustPrice = crust.price_paise;
        crustName = crust.name;
      }
    }

    const addonsSnapshot: Array<{ name: string; price_paise: number }> = [];
    let addonsSum = 0;
    if (requestedItem.addon_ids && requestedItem.addon_ids.length > 0) {
      for (const addonId of requestedItem.addon_ids) {
        const addon = memoryStore.addons.find((a) => a.id === addonId);
        if (addon) {
          addonsSum += addon.price_paise;
          addonsSnapshot.push({ name: addon.name, price_paise: addon.price_paise });
        }
      }
    }

    const itemUnitPrice = unitPrice + crustPrice + addonsSum;
    const qty = Math.max(1, Math.round(requestedItem.quantity));
    const itemTotal = itemUnitPrice * qty;

    itemsForPricing.push({ unitPricePaise: itemUnitPrice, quantity: qty });

    orderItemsSnapshot.push({
      id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      product_id: product.id,
      product_name: product.name,
      variant_name: variantName,
      crust_name: crustName,
      unit_price_paise: itemUnitPrice,
      quantity: qty,
      addons_json: addonsSnapshot,
      item_total_paise: itemTotal,
    });
  }

  // 6. Validate coupon if supplied with per-customer limit check
  let verifiedCoupon: Coupon | null = null;
  if (payload.applied_coupon_code) {
    const subtotal = itemsForPricing.reduce((sum, it) => sum + it.unitPricePaise * it.quantity, 0);
    const couponValidation = await validateCouponCode(payload.applied_coupon_code, subtotal);
    if (!couponValidation.valid) {
      return { success: false, error: couponValidation.message };
    }
    if (couponValidation.coupon) {
      // Check per-customer usage limit
      const maxPerCust = couponValidation.coupon.max_uses_per_customer || 1;
      const priorUses = memoryStore.orders.filter(
        (o) =>
          o.customer_phone === cleanPhone &&
          o.applied_coupon_code?.toUpperCase() === couponValidation.coupon!.code.toUpperCase() &&
          o.status !== 'cancelled'
      ).length;

      if (priorUses >= maxPerCust) {
        return {
          success: false,
          error: `Coupon ${couponValidation.coupon.code} is limited to ${maxPerCust} use(s) per customer. It has already been redeemed on a previous order.`,
        };
      }
      verifiedCoupon = couponValidation.coupon;
    }
  }

  // 7. Calculate final authoritative bill breakdown
  const bill = calculateFullPricing(itemsForPricing, payload.order_type, verifiedCoupon);

  // 8. Anti-Fraud & COD Confirmation Policy
  let confirmationStatus: 'confirmed' | 'pending_confirmation' = 'confirmed';
  let confirmationReason: string | undefined = undefined;

  if (payload.payment_method === 'cod') {
    if (memoryStore.settings.enabled_payment_methods?.cod === false) {
      return { success: false, error: 'Cash on Delivery (COD) is currently disabled by store management.' };
    }

    const threshold = memoryStore.settings.cod_confirmation_threshold_paise || 150000; // ₹1,500
    const priorCompleted = memoryStore.orders.filter(
      (o) => o.customer_phone === cleanPhone && o.status === 'completed'
    );
    const isFirstTime = priorCompleted.length === 0;
    const isHighValue = bill.total_paise >= threshold;

    if (isFirstTime || isHighValue) {
      confirmationStatus = 'pending_confirmation';
      confirmationReason = isFirstTime && isHighValue
        ? `First-time COD customer & high-value order (₹${bill.total_paise / 100} >= ₹${threshold / 100}). Staff phone verification required before kitchen prep.`
        : isFirstTime
        ? 'First-time COD customer. Staff telephone confirmation required before baking.'
        : `High-value COD order (₹${bill.total_paise / 100} >= ₹${threshold / 100}). Staff verification required before baking.`;
    }
  }

  // 9. Generate human-readable order number: PH-YYYYMMDD-XXXX
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const orderNumber = `PH-${dateStr}-${randomSuffix}`;

  const newOrder: Order = {
    id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    order_number: orderNumber,
    customer_id: payload.customer_id,
    customer_name: payload.customer_name.trim(),
    customer_phone: cleanPhone,
    customer_email: payload.customer_email?.trim(),
    order_type: payload.order_type,
    branch: payload.branch,
    delivery_address: payload.delivery_address?.trim(),
    delivery_landmark: payload.delivery_landmark?.trim(),
    delivery_instructions: payload.delivery_instructions?.trim(),
    status: confirmationStatus === 'pending_confirmation' ? 'placed' : 'confirmed',
    confirmation_status: confirmationStatus,
    confirmation_reason: confirmationReason,
    idempotency_key: payload.idempotency_key,
    payment_method: payload.payment_method,
    payment_status: 'pending',
    subtotal_paise: bill.subtotal_paise,
    discount_paise: bill.discount_paise,
    delivery_fee_paise: bill.delivery_fee_paise,
    tax_paise: bill.tax_paise,
    packaging_fee_paise: bill.packaging_fee_paise,
    total_paise: bill.total_paise,
    applied_coupon_code: bill.applied_coupon_code,
    notes: payload.notes?.trim(),
    internal_notes: confirmationReason ? `[COD Verification Flag] ${confirmationReason}` : undefined,
    items: orderItemsSnapshot,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 10. Cache idempotency key
  if (payload.idempotency_key) {
    memoryStore.orderIdempotencyKeys.set(payload.idempotency_key, {
      order: newOrder,
      timestamp: Date.now(),
    });
  }

  // 11. Save order to memory store
  memoryStore.orders.unshift(newOrder);

  // 12. Also write to Supabase if configured
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.from('orders').insert({
        order_number: newOrder.order_number,
        customer_name: newOrder.customer_name,
        customer_phone: newOrder.customer_phone,
        customer_email: newOrder.customer_email,
        order_type: newOrder.order_type,
        branch: newOrder.branch,
        delivery_address: newOrder.delivery_address,
        delivery_landmark: newOrder.delivery_landmark,
        status: newOrder.status,
        confirmation_status: newOrder.confirmation_status,
        payment_method: newOrder.payment_method,
        payment_status: newOrder.payment_status,
        subtotal_paise: newOrder.subtotal_paise,
        discount_paise: newOrder.discount_paise,
        delivery_fee_paise: newOrder.delivery_fee_paise,
        tax_paise: newOrder.tax_paise,
        packaging_fee_paise: newOrder.packaging_fee_paise,
        total_paise: newOrder.total_paise,
        applied_coupon_code: newOrder.applied_coupon_code,
      });
    } catch (e) {
      console.warn('Supabase remote write error (using memory store):', e);
    }
  }

  return { success: true, order: newOrder };
}

// --- ORDER LOOKUP & PROGRESSION ---

export async function fetchOrderByNumber(
  orderNumber: string,
  phone?: string
): Promise<Order | null> {
  const cleanNumber = orderNumber.trim().toUpperCase();
  const order = memoryStore.orders.find((o) => o.order_number.toUpperCase() === cleanNumber);
  if (!order) return null;

  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone && !order.customer_phone.includes(cleanPhone)) {
      return null; // Phone authorization check
    }
  }
  return order;
}

export async function fetchAllOrdersAdmin(): Promise<Order[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as unknown as Order[];
      }
    } catch (e) {}
  }
  return memoryStore.orders;
}

const LEGAL_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'ready_for_pickup', 'cancelled'],
  out_for_delivery: ['completed', 'cancelled'],
  ready_for_pickup: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  changedBy: string = 'Staff'
): Promise<{ success: boolean; error?: string; order?: Order }> {
  const order = memoryStore.orders.find((o) => o.id === orderId || o.order_number === orderId);
  if (!order) return { success: false, error: 'Order not found.' };

  const currentStatus = order.status;
  const allowed = LEGAL_STATUS_TRANSITIONS[currentStatus];
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      error: `Illegal status transition from "${currentStatus}" to "${newStatus}".`,
    };
  }

  order.status = newStatus;
  order.updated_at = new Date().toISOString();

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase
        .from('orders')
        .update({
          status: newStatus,
          payment_status: order.payment_status,
          updated_at: order.updated_at,
        })
        .or(`id.eq.${order.id},order_number.eq.${order.order_number}`);
    } catch (e) {
      console.warn('Supabase status update error:', e);
    }
  }

  if (newStatus === 'completed') {
    if (order.payment_method === 'cod') {
      order.payment_status = 'completed'; // Paid upon delivery
    }
    // Award customer loyalty stamp if eligible
    processOrderCompletedLoyaltyStamp(order);
  }

  return { success: true, order };
}

// --- TABLE BOOKINGS ---

export interface CreateBookingPayload {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  branch: 'pali_khera' | 'gla_university';
  guest_count: number;
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // HH:MM
  seating_preference: string;
  special_requests?: string;
}

export async function createTableBooking(
  payload: CreateBookingPayload
): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  if (!payload.customer_name || payload.customer_name.trim().length < 2) {
    return { success: false, error: 'Please enter your name.' };
  }
  const cleanPhone = payload.customer_phone.replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
  }
  if (!payload.booking_date || !payload.booking_time) {
    return { success: false, error: 'Please select a date and time.' };
  }

  // Validate no past dates
  const bookingDateObj = new Date(`${payload.booking_date}T${payload.booking_time}`);
  if (bookingDateObj < new Date()) {
    return { success: false, error: 'Cannot book a table for past dates or times.' };
  }

  if (payload.guest_count < 1 || payload.guest_count > 30) {
    return { success: false, error: 'Online reservations accommodate 1 to 30 guests. For larger parties, call us directly.' };
  }

  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const ref = `TB-${todayStr}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const newBooking: Booking = {
    id: `bk-${Date.now()}`,
    booking_reference: ref,
    customer_name: payload.customer_name.trim(),
    customer_phone: cleanPhone,
    customer_email: payload.customer_email?.trim(),
    branch: payload.branch,
    guest_count: Number(payload.guest_count),
    booking_date: payload.booking_date,
    booking_time: payload.booking_time,
    seating_preference: payload.seating_preference || 'Indoor AC',
    special_requests: payload.special_requests?.trim(),
    status: 'requested', // Always initialized as requested
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.from('bookings').insert({
        id: newBooking.id,
        booking_reference: newBooking.booking_reference,
        customer_name: newBooking.customer_name,
        customer_phone: newBooking.customer_phone,
        customer_email: newBooking.customer_email || null,
        branch: newBooking.branch,
        guest_count: newBooking.guest_count,
        booking_date: newBooking.booking_date,
        booking_time: newBooking.booking_time,
        seating_preference: newBooking.seating_preference || 'indoor_ac',
        special_requests: newBooking.special_requests || null,
        status: newBooking.status,
        created_at: newBooking.created_at,
        updated_at: newBooking.updated_at,
      });
    } catch (e) {
      console.warn('Supabase booking write error:', e);
    }
  }

  memoryStore.bookings.unshift(newBooking);
  return { success: true, booking: newBooking };
}

export async function fetchAllBookingsAdmin(): Promise<Booking[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data as unknown as Booking[];
    } catch (e) {}
  }
  return memoryStore.bookings;
}

export async function updateBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  staffNotes?: string
): Promise<{ success: boolean; error?: string; booking?: Booking }> {
  const booking = memoryStore.bookings.find((b) => b.id === bookingId || b.booking_reference === bookingId);
  if (!booking) return { success: false, error: 'Booking not found.' };

  booking.status = newStatus;
  if (staffNotes) booking.staff_notes = staffNotes;
  booking.updated_at = new Date().toISOString();

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase
        .from('bookings')
        .update({
          status: newStatus,
          staff_notes: staffNotes || booking.staff_notes || null,
          updated_at: booking.updated_at,
        })
        .or(`id.eq.${bookingId},booking_reference.eq.${bookingId}`);
    } catch (e) {
      console.warn('Supabase booking status update error:', e);
    }
  }

  return { success: true, booking };
}

// --- REVIEWS ---

export async function fetchApprovedReviews(): Promise<Review[]> {
  return memoryStore.reviews.filter((r) => r.is_approved);
}

export async function fetchAllReviewsAdmin(): Promise<Review[]> {
  return memoryStore.reviews;
}

export async function submitCustomerReview(payload: {
  customer_name: string;
  rating: number;
  comment: string;
  branch: 'pali_khera' | 'gla_university';
}): Promise<{ success: boolean; error?: string; review?: Review }> {
  if (!payload.customer_name || payload.customer_name.trim().length < 2) {
    return { success: false, error: 'Name is required.' };
  }
  if (!payload.comment || payload.comment.trim().length < 5) {
    return { success: false, error: 'Review comment must be at least 5 characters.' };
  }
  const rating = Math.min(5, Math.max(1, Math.round(payload.rating || 5)));

  const newReview: Review = {
    id: `rev-${Date.now()}`,
    customer_name: payload.customer_name.trim(),
    rating,
    comment: payload.comment.trim(),
    branch: payload.branch,
    is_approved: false, // Default requires moderation
    created_at: new Date().toISOString(),
  };

  memoryStore.reviews.unshift(newReview);
  return { success: true, review: newReview };
}

export async function moderateReview(
  reviewId: string,
  isApproved: boolean
): Promise<{ success: boolean }> {
  const rev = memoryStore.reviews.find((r) => r.id === reviewId);
  if (rev) {
    rev.is_approved = isApproved;
    return { success: true };
  }
  return { success: false };
}

// ==========================================
// --- CATEGORY MANAGEMENT ---
// ==========================================

export async function fetchAllCategoriesAdmin(): Promise<Category[]> {
  return memoryStore.categories.sort((a, b) => a.sort_order - b.sort_order);
}

export async function createCategory(
  cat: Omit<Category, 'id'>,
  createdBy: string = 'Admin'
): Promise<{ success: boolean; category?: Category; error?: string }> {
  if (!cat.name || cat.name.trim().length < 2) {
    return { success: false, error: 'Category name must be at least 2 characters.' };
  }
  const slug = cat.slug?.trim() || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (memoryStore.categories.some((c) => c.slug === slug)) {
    return { success: false, error: `Category with slug "${slug}" already exists.` };
  }

  const newCat: Category = {
    id: `cat-${Date.now()}`,
    name: cat.name.trim(),
    slug,
    description: cat.description?.trim(),
    image_url: cat.image_url?.trim(),
    sort_order: Number(cat.sort_order) || memoryStore.categories.length + 1,
    is_active: cat.is_active !== undefined ? cat.is_active : true,
  };

  memoryStore.categories.push(newCat);
  addAuditLogEntry({
    user_name: createdBy,
    action: 'CATEGORY_CREATED',
    entity_type: 'category',
    entity_id: newCat.id,
    details: `Created category "${newCat.name}" with slug "${newCat.slug}".`,
  });

  return { success: true, category: newCat };
}

export async function updateCategory(
  id: string,
  updates: Partial<Category>,
  updatedBy: string = 'Admin'
): Promise<{ success: boolean; category?: Category; error?: string }> {
  const cat = memoryStore.categories.find((c) => c.id === id);
  if (!cat) return { success: false, error: 'Category not found.' };

  if (updates.name) cat.name = updates.name.trim();
  if (updates.slug) cat.slug = updates.slug.trim();
  if (updates.description !== undefined) cat.description = updates.description.trim();
  if (updates.image_url !== undefined) cat.image_url = updates.image_url.trim();
  if (updates.sort_order !== undefined) cat.sort_order = Number(updates.sort_order);
  if (updates.is_active !== undefined) cat.is_active = Boolean(updates.is_active);

  addAuditLogEntry({
    user_name: updatedBy,
    action: 'CATEGORY_UPDATED',
    entity_type: 'category',
    entity_id: cat.id,
    details: `Updated category "${cat.name}".`,
  });

  return { success: true, category: cat };
}

export async function deleteCategory(
  id: string,
  deletedBy: string = 'Admin'
): Promise<{ success: boolean; error?: string }> {
  const index = memoryStore.categories.findIndex((c) => c.id === id);
  if (index === -1) return { success: false, error: 'Category not found.' };

  const name = memoryStore.categories[index].name;
  memoryStore.categories.splice(index, 1);

  addAuditLogEntry({
    user_name: deletedBy,
    action: 'CATEGORY_DELETED',
    entity_type: 'category',
    entity_id: id,
    details: `Removed category "${name}".`,
  });

  return { success: true };
}

// ==========================================
// --- MENU & PRODUCT MANAGEMENT ---
// ==========================================

export async function createProduct(
  product: Omit<Product, 'id'>,
  createdBy: string = 'Admin'
): Promise<{ success: boolean; product?: Product; error?: string }> {
  if (!product.name || product.name.trim().length < 2) {
    return { success: false, error: 'Product name must be at least 2 characters.' };
  }
  if (!product.category_id) {
    return { success: false, error: 'Product must be assigned to a category.' };
  }
  if (!product.base_price_paise || product.base_price_paise <= 0) {
    return { success: false, error: 'Product must have a valid positive base price.' };
  }

  // Business Rule: Do not permit publication of products with missing or unverified prices.
  if (product.is_available && !product.is_price_verified) {
    return {
      success: false,
      error: 'Cannot publish product: price must be verified before making available to customers.',
    };
  }

  // Validate variants if present
  if (product.variants && product.variants.length > 0) {
    for (const v of product.variants) {
      if (!v.price_paise || v.price_paise <= 0) {
        return { success: false, error: `Variant "${v.size_name}" must have a valid price greater than zero.` };
      }
    }
  }

  const slug = product.slug?.trim() || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    category_id: product.category_id,
    name: product.name.trim(),
    slug,
    description: product.description?.trim() || '',
    image_url: product.image_url?.trim(),
    is_veg: product.is_veg !== undefined ? product.is_veg : true,
    is_spicy: Boolean(product.is_spicy),
    is_bestseller: Boolean(product.is_bestseller),
    is_featured: Boolean(product.is_featured),
    is_available: Boolean(product.is_available && product.is_price_verified),
    is_price_verified: Boolean(product.is_price_verified),
    base_price_paise: Math.round(product.base_price_paise),
    sort_order: Number(product.sort_order) || memoryStore.products.length + 1,
    variants: product.variants || [],
  };

  memoryStore.products.push(newProduct);

  addAuditLogEntry({
    user_name: createdBy,
    action: 'PRODUCT_CREATED',
    entity_type: 'product',
    entity_id: newProduct.id,
    details: `Created product "${newProduct.name}" with base price ₹${newProduct.base_price_paise / 100}.`,
  });

  return { success: true, product: newProduct };
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>,
  updatedBy: string = 'Admin'
): Promise<{ success: boolean; product?: Product; error?: string }> {
  const prod = memoryStore.products.find((p) => p.id === id);
  if (!prod) return { success: false, error: 'Product not found.' };

  const priceChanged =
    updates.base_price_paise !== undefined && updates.base_price_paise !== prod.base_price_paise;

  // Price verification rule: Cannot publish or make available if price is unverified
  const targetAvailable = updates.is_available !== undefined ? updates.is_available : prod.is_available;
  const targetVerified = updates.is_price_verified !== undefined ? updates.is_price_verified : prod.is_price_verified;
  const targetPrice = updates.base_price_paise !== undefined ? updates.base_price_paise : prod.base_price_paise;

  if (targetAvailable && (!targetVerified || targetPrice <= 0)) {
    return {
      success: false,
      error: 'Cannot publish product: Price must be positive and verified by staff.',
    };
  }

  // Validate variant prices
  if (updates.variants) {
    for (const v of updates.variants) {
      if (!v.price_paise || v.price_paise <= 0) {
        return { success: false, error: `Variant "${v.size_name}" must have a valid positive price.` };
      }
    }
  }

  const oldPrice = prod.base_price_paise;
  Object.assign(prod, updates);

  if (priceChanged) {
    addAuditLogEntry({
      user_name: updatedBy,
      action: 'PRODUCT_PRICE_UPDATED',
      entity_type: 'product',
      entity_id: prod.id,
      details: `Updated "${prod.name}" price from ₹${oldPrice / 100} to ₹${prod.base_price_paise / 100}.`,
    });
  } else {
    addAuditLogEntry({
      user_name: updatedBy,
      action: 'PRODUCT_UPDATED',
      entity_type: 'product',
      entity_id: prod.id,
      details: `Updated product "${prod.name}" details.`,
    });
  }

  return { success: true, product: prod };
}

export async function deleteProduct(
  id: string,
  deletedBy: string = 'Admin'
): Promise<{ success: boolean; error?: string }> {
  const index = memoryStore.products.findIndex((p) => p.id === id);
  if (index === -1) return { success: false, error: 'Product not found.' };

  const name = memoryStore.products[index].name;
  memoryStore.products.splice(index, 1);

  addAuditLogEntry({
    user_name: deletedBy,
    action: 'PRODUCT_ARCHIVED',
    entity_type: 'product',
    entity_id: id,
    details: `Archived/Removed product "${name}".`,
  });

  return { success: true };
}

export async function verifyProductPrice(
  productId: string,
  isVerified: boolean,
  verifiedBy: string = 'Admin'
): Promise<{ success: boolean; error?: string }> {
  const prod = memoryStore.products.find((p) => p.id === productId);
  if (!prod) return { success: false, error: 'Product not found.' };

  prod.is_price_verified = isVerified;
  if (!isVerified) {
    prod.is_available = false; // Automatically unpublish if unverified
  }

  addAuditLogEntry({
    user_name: verifiedBy,
    action: isVerified ? 'PRICE_VERIFICATION_APPROVED' : 'PRICE_VERIFICATION_REVOKED',
    entity_type: 'product',
    entity_id: prod.id,
    details: `${isVerified ? 'Approved' : 'Revoked'} price verification for "${prod.name}".`,
  });

  return { success: true };
}

// ==========================================
// --- COUPONS & OFFERS MANAGEMENT ---
// ==========================================

export async function fetchAllCouponsAdmin(): Promise<Coupon[]> {
  return memoryStore.coupons;
}

export async function createCoupon(
  coupon: Omit<Coupon, 'id' | 'current_uses'>,
  createdBy: string = 'Admin'
): Promise<{ success: boolean; coupon?: Coupon; error?: string }> {
  if (!coupon.code || coupon.code.trim().length < 3) {
    return { success: false, error: 'Coupon code must be at least 3 characters.' };
  }
  const cleanCode = coupon.code.trim().toUpperCase();
  if (memoryStore.coupons.some((c) => c.code.toUpperCase() === cleanCode)) {
    return { success: false, error: `Coupon code "${cleanCode}" already exists.` };
  }
  if (!coupon.discount_value || coupon.discount_value <= 0) {
    return { success: false, error: 'Discount value must be greater than zero.' };
  }

  const newCoupon: Coupon = {
    id: `cp-${Date.now()}`,
    code: cleanCode,
    description: coupon.description?.trim() || `Promo ${cleanCode}`,
    discount_type: coupon.discount_type || 'flat',
    discount_value: Math.round(coupon.discount_value),
    min_order_paise: Math.max(0, Math.round(coupon.min_order_paise || 0)),
    max_discount_paise: coupon.max_discount_paise ? Math.round(coupon.max_discount_paise) : null,
    eligible_categories: coupon.eligible_categories || [],
    eligible_products: coupon.eligible_products || [],
    terms_conditions: coupon.terms_conditions?.trim(),
    max_uses: coupon.max_uses ? Number(coupon.max_uses) : null,
    current_uses: 0,
    is_active: coupon.is_active !== undefined ? coupon.is_active : true,
    valid_from: coupon.valid_from || new Date().toISOString(),
    valid_until: coupon.valid_until || null,
  };

  memoryStore.coupons.unshift(newCoupon);

  addAuditLogEntry({
    user_name: createdBy,
    action: 'COUPON_CREATED',
    entity_type: 'coupon',
    entity_id: newCoupon.code,
    details: `Created coupon ${newCoupon.code} (${newCoupon.discount_type}: ${newCoupon.discount_value}).`,
  });

  return { success: true, coupon: newCoupon };
}

export async function updateCoupon(
  id: string,
  updates: Partial<Coupon>,
  updatedBy: string = 'Admin'
): Promise<{ success: boolean; coupon?: Coupon; error?: string }> {
  const coupon = memoryStore.coupons.find((c) => c.id === id);
  if (!coupon) return { success: false, error: 'Coupon not found.' };

  Object.assign(coupon, updates);

  addAuditLogEntry({
    user_name: updatedBy,
    action: 'COUPON_UPDATED',
    entity_type: 'coupon',
    entity_id: coupon.code,
    details: `Updated parameters for coupon ${coupon.code}.`,
  });

  return { success: true, coupon };
}

export async function toggleCouponActive(
  id: string,
  isActive: boolean,
  updatedBy: string = 'Admin'
): Promise<{ success: boolean }> {
  const coupon = memoryStore.coupons.find((c) => c.id === id);
  if (coupon) {
    coupon.is_active = isActive;
    addAuditLogEntry({
      user_name: updatedBy,
      action: isActive ? 'COUPON_ACTIVATED' : 'COUPON_DEACTIVATED',
      entity_type: 'coupon',
      entity_id: coupon.code,
      details: `${isActive ? 'Activated' : 'Deactivated'} coupon ${coupon.code}.`,
    });
    return { success: true };
  }
  return { success: false };
}

// ==========================================
// --- ORDER CANCELLATIONS & OPERATIONS ---
// ==========================================

export async function cancelOrder(
  orderId: string,
  reason: string,
  cancelledBy: string = 'Admin Staff'
): Promise<{ success: boolean; error?: string; order?: Order }> {
  const order = memoryStore.orders.find((o) => o.id === orderId || o.order_number === orderId);
  if (!order) return { success: false, error: 'Order not found.' };

  if (order.status === 'completed') {
    return { success: false, error: 'Completed orders cannot be cancelled.' };
  }
  if (order.status === 'cancelled') {
    return { success: false, error: 'Order is already cancelled.' };
  }

  order.status = 'cancelled';
  order.cancellation_reason = reason.trim() || 'Cancelled by restaurant';
  order.cancelled_by = cancelledBy;
  order.updated_at = new Date().toISOString();

  // Consistent Refund Handling: Exclude cancelled orders from revenue
  if (order.payment_status === 'completed') {
    order.payment_status = 'refunded';
    order.refunded_paise = order.total_paise;
  }

  // Revoke loyalty stamp if one was awarded
  revokeOrderLoyaltyStamp(order, reason);

  addAuditLogEntry({
    user_name: cancelledBy,
    action: 'ORDER_CANCELLED',
    entity_type: 'order',
    entity_id: order.order_number,
    details: `Cancelled order ${order.order_number}. Reason: ${order.cancellation_reason}`,
  });

  return { success: true, order };
}

export async function addOrderInternalNote(
  orderId: string,
  note: string,
  updatedBy: string = 'Staff'
): Promise<{ success: boolean; order?: Order }> {
  const order = memoryStore.orders.find((o) => o.id === orderId || o.order_number === orderId);
  if (!order) return { success: false };

  const existingNotes = order.internal_notes ? `${order.internal_notes}\n` : '';
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  order.internal_notes = `${existingNotes}[${timestamp} - ${updatedBy}]: ${note.trim()}`;
  order.updated_at = new Date().toISOString();

  return { success: true, order };
}

export function filterOrders(filter: {
  search?: string;
  status?: string;
  branch?: string;
  orderType?: string;
  dateRange?: string; // 'today' | '7days' | '30days' | 'all' | 'custom'
  startDate?: string;
  endDate?: string;
}): Order[] {
  let list = [...memoryStore.orders];

  // 1. Search by reference, customer name, or phone
  if (filter.search && filter.search.trim().length > 0) {
    const q = filter.search.trim().toLowerCase();
    list = list.filter(
      (o) =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q)
    );
  }

  // 2. Status filter
  if (filter.status && filter.status !== 'all') {
    if (filter.status === 'pending_confirmation') {
      list = list.filter((o) => o.confirmation_status === 'pending_confirmation');
    } else {
      list = list.filter((o) => o.status === filter.status);
    }
  }

  // 3. Branch filter
  if (filter.branch && filter.branch !== 'all') {
    list = list.filter((o) => o.branch === filter.branch);
  }

  // 4. Order type
  if (filter.orderType && filter.orderType !== 'all') {
    list = list.filter((o) => o.order_type === filter.orderType);
  }

  // 5. Date filter
  const now = new Date();
  if (filter.dateRange === 'today') {
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    list = list.filter((o) => new Date(o.created_at).getTime() >= todayMidnight);
  } else if (filter.dateRange === '7days') {
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    list = list.filter((o) => new Date(o.created_at).getTime() >= sevenDaysAgo);
  } else if (filter.dateRange === '30days') {
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    list = list.filter((o) => new Date(o.created_at).getTime() >= thirtyDaysAgo);
  } else if (filter.dateRange === 'custom') {
    if (filter.startDate) {
      const start = new Date(filter.startDate).getTime();
      list = list.filter((o) => new Date(o.created_at).getTime() >= start);
    }
    if (filter.endDate) {
      const end = new Date(filter.endDate).getTime() + 24 * 60 * 60 * 1000;
      list = list.filter((o) => new Date(o.created_at).getTime() <= end);
    }
  }

  return list;
}

export function exportOrdersToCSV(orders: Order[]): string {
  const headers = [
    'Order Ref',
    'Date (IST)',
    'Customer Name',
    'Customer Phone',
    'Branch',
    'Fulfillment Type',
    'Status',
    'Payment Method',
    'Payment Status',
    'Subtotal (INR)',
    'Discount (INR)',
    'Delivery Fee (INR)',
    'Taxes (INR)',
    'Total (INR)',
    'Refunded (INR)',
    'Coupon Code',
    'Cancellation Reason',
  ];

  const rows = orders.map((o) => [
    `"${o.order_number}"`,
    `"${new Date(o.created_at).toLocaleString('en-IN')}"`,
    `"${o.customer_name.replace(/"/g, '""')}"`,
    `"${o.customer_phone}"`,
    `"${o.branch}"`,
    `"${o.order_type}"`,
    `"${o.status}"`,
    `"${o.payment_method}"`,
    `"${o.payment_status}"`,
    (o.subtotal_paise / 100).toFixed(2),
    (o.discount_paise / 100).toFixed(2),
    (o.delivery_fee_paise / 100).toFixed(2),
    (o.tax_paise / 100).toFixed(2),
    (o.total_paise / 100).toFixed(2),
    ((o.refunded_paise || 0) / 100).toFixed(2),
    `"${o.applied_coupon_code || ''}"`,
    `"${(o.cancellation_reason || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportBookingsToCSV(bookings: Booking[]): string {
  const headers = [
    'Booking Ref',
    'Date',
    'Time',
    'Branch',
    'Guest Count',
    'Customer Name',
    'Phone',
    'Status',
    'Seating Preference',
    'Special Requests',
    'Staff Notes',
  ];

  const rows = bookings.map((b) => [
    `"${b.booking_reference}"`,
    `"${b.booking_date}"`,
    `"${b.booking_time}"`,
    `"${b.branch}"`,
    b.guest_count,
    `"${b.customer_name.replace(/"/g, '""')}"`,
    `"${b.customer_phone}"`,
    `"${b.status}"`,
    `"${b.seating_preference}"`,
    `"${(b.special_requests || '').replace(/"/g, '""')}"`,
    `"${(b.staff_notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// ==========================================
// --- CUSTOMER DIRECTORY ---
// ==========================================

export function fetchCustomersDirectory(search?: string): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();

  for (const o of memoryStore.orders) {
    const key = o.customer_phone.replace(/\D/g, '');
    if (!key) continue;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        phone: key,
        name: o.customer_name,
        email: o.customer_email,
        total_orders: 1,
        total_spent_paise: o.status !== 'cancelled' ? o.total_paise : 0,
        last_order_date: o.created_at,
        is_repeat: false,
      });
    } else {
      existing.total_orders += 1;
      if (o.status !== 'cancelled') {
        existing.total_spent_paise += o.total_paise;
      }
      if (new Date(o.created_at) > new Date(existing.last_order_date)) {
        existing.last_order_date = o.created_at;
        existing.name = o.customer_name; // update to latest name
      }
      existing.is_repeat = existing.total_orders >= 2;
    }
  }

  let list = Array.from(map.values()).sort((a, b) => b.total_spent_paise - a.total_spent_paise);

  if (search && search.trim().length > 0) {
    const q = search.trim().toLowerCase();
    list = list.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }

  return list;
}

// ==========================================
// --- STAFF & ROLE MANAGEMENT (RBAC) ---
// ==========================================

export async function fetchStaffMembers(): Promise<Profile[]> {
  return memoryStore.staff;
}

export function checkPermission(
  role: StaffRole,
  permission:
    | 'view_financials'
    | 'manage_staff'
    | 'manage_menu'
    | 'manage_settings'
    | 'manage_orders'
    | 'view_customers'
    | 'export_data'
    | 'kitchen_ops'
): boolean {
  if (role === 'owner') return true; // Owner has unrestricted access

  switch (role) {
    case 'manager':
      // Managers handle operational workflows & reports; cannot modify staff roles or system-level retention
      return [
        'view_financials',
        'manage_menu',
        'manage_orders',
        'view_customers',
        'export_data',
        'kitchen_ops',
      ].includes(permission);

    case 'order_staff':
      // Order staff can manage orders, table bookings, customer calls
      return ['manage_orders', 'view_customers'].includes(permission);

    case 'kitchen_staff':
      // Kitchen staff restricted to kitchen operations only
      return permission === 'kitchen_ops';

    default:
      return false;
  }
}

export async function createStaffMember(
  member: Omit<Profile, 'id' | 'created_at' | 'updated_at'>,
  requesterRole: StaffRole,
  requesterName: string = 'Owner'
): Promise<{ success: boolean; staff?: Profile; error?: string }> {
  if (requesterRole !== 'owner') {
    return { success: false, error: 'Only the restaurant owner can add staff members.' };
  }
  if (!member.full_name || member.full_name.trim().length < 2) {
    return { success: false, error: 'Staff name is required.' };
  }

  const newStaff: Profile = {
    id: `st-${Date.now()}`,
    full_name: member.full_name.trim(),
    phone: member.phone?.trim(),
    email: member.email?.trim(),
    role: member.role,
    is_active: member.is_active !== undefined ? member.is_active : true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  memoryStore.staff.push(newStaff);

  addAuditLogEntry({
    user_name: requesterName,
    action: 'STAFF_MEMBER_CREATED',
    entity_type: 'staff',
    entity_id: newStaff.id,
    details: `Added new staff member "${newStaff.full_name}" with role "${newStaff.role}".`,
  });

  return { success: true, staff: newStaff };
}

export async function updateStaffRole(
  staffId: string,
  newRole: StaffRole,
  requesterRole: StaffRole,
  requesterName: string = 'Owner'
): Promise<{ success: boolean; staff?: Profile; error?: string }> {
  if (requesterRole !== 'owner') {
    return { success: false, error: 'Access denied: Only the restaurant owner can grant or revoke staff roles.' };
  }

  const staff = memoryStore.staff.find((s) => s.id === staffId);
  if (!staff) return { success: false, error: 'Staff member not found.' };

  const oldRole = staff.role;
  staff.role = newRole;
  staff.updated_at = new Date().toISOString();

  addAuditLogEntry({
    user_name: requesterName,
    action: 'STAFF_ROLE_CHANGED',
    entity_type: 'staff',
    entity_id: staff.id,
    details: `Changed role for "${staff.full_name}" from "${oldRole}" to "${newRole}".`,
  });

  return { success: true, staff };
}

// ==========================================
// --- RESTAURANT SETTINGS ---
// ==========================================

export async function fetchRestaurantSettings(): Promise<RestaurantSettings> {
  return memoryStore.settings;
}

export async function updateRestaurantSettings(
  updates: Partial<RestaurantSettings>,
  requesterRole: StaffRole,
  requesterName: string = 'Manager'
): Promise<{ success: boolean; settings?: RestaurantSettings; error?: string }> {
  if (requesterRole !== 'owner' && requesterRole !== 'manager') {
    return { success: false, error: 'Unauthorized: Only Owner or Manager can modify restaurant settings.' };
  }

  Object.assign(memoryStore.settings, updates);

  addAuditLogEntry({
    user_name: requesterName,
    action: 'SETTINGS_UPDATED',
    entity_type: 'settings',
    entity_id: 'restaurant_settings',
    details: `Updated settings: ${Object.keys(updates).join(', ')}.`,
  });

  return { success: true, settings: memoryStore.settings };
}

// ==========================================
// --- AUDIT TRAIL LOGGING ---
// ==========================================

export async function fetchAuditLogsAdmin(): Promise<AuditLog[]> {
  return memoryStore.auditLogs.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function addAuditLogEntry(entry: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ...entry,
    created_at: new Date().toISOString(),
  };
  memoryStore.auditLogs.unshift(newLog);
  return newLog;
}

// ==========================================
// --- ANALYTICS ENGINE ---
// ==========================================

export function computeAnalytics(
  dateRange: 'today' | '7days' | '30days' | 'custom' = 'today',
  startDate?: string,
  endDate?: string
) {
  const filteredOrders = filterOrders({ dateRange, startDate, endDate });

  const totalOrders = filteredOrders.length;
  const cancelledOrders = filteredOrders.filter((o) => o.status === 'cancelled');
  const nonCancelledOrders = filteredOrders.filter((o) => o.status !== 'cancelled');
  const completedOrders = filteredOrders.filter((o) => o.status === 'completed');

  // Exact monetary calculations:
  // Gross Food Sales = Sum of subtotals + packaging + delivery on valid orders
  const grossSalesPaise = nonCancelledOrders.reduce(
    (sum, o) => sum + o.subtotal_paise + o.packaging_fee_paise + o.delivery_fee_paise,
    0
  );

  const totalDiscountsPaise = nonCancelledOrders.reduce((sum, o) => sum + o.discount_paise, 0);
  const netRevenuePaise = nonCancelledOrders.reduce((sum, o) => sum + o.total_paise, 0);
  const totalRefundedPaise = cancelledOrders.reduce((sum, o) => sum + (o.refunded_paise || 0), 0);

  // Business Model: Food cost & operational packaging estimated at ~38%
  const estimatedCostPaise = Math.round(grossSalesPaise * 0.38);
  const estimatedGrossProfitPaise = Math.max(0, netRevenuePaise - estimatedCostPaise);

  const avgOrderValuePaise =
    nonCancelledOrders.length > 0 ? Math.round(netRevenuePaise / nonCancelledOrders.length) : 0;

  // Status distribution
  const statusDistribution: Record<string, number> = {
    placed: 0,
    confirmed: 0,
    preparing: 0,
    out_for_delivery: 0,
    ready_for_pickup: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const o of filteredOrders) {
    statusDistribution[o.status] = (statusDistribution[o.status] || 0) + 1;
  }

  // Top products
  const productSalesMap = new Map<string, { name: string; quantity: number; revenuePaise: number }>();
  for (const o of nonCancelledOrders) {
    if (o.items) {
      for (const it of o.items) {
        const existing = productSalesMap.get(it.product_name);
        if (!existing) {
          productSalesMap.set(it.product_name, {
            name: it.product_name,
            quantity: it.quantity,
            revenuePaise: it.item_total_paise,
          });
        } else {
          existing.quantity += it.quantity;
          existing.revenuePaise += it.item_total_paise;
        }
      }
    }
  }

  const topSellingProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Daily trend
  const dailyMap = new Map<string, { date: string; salesPaise: number; orderCount: number }>();
  for (const o of nonCancelledOrders) {
    const d = o.created_at.slice(0, 10);
    const ex = dailyMap.get(d);
    if (!ex) {
      dailyMap.set(d, { date: d, salesPaise: o.total_paise, orderCount: 1 });
    } else {
      ex.salesPaise += o.total_paise;
      ex.orderCount += 1;
    }
  }
  const salesTrend = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Customers
  const customers = fetchCustomersDirectory();
  const repeatCount = customers.filter((c) => c.is_repeat).length;
  const repeatCustomerRate = customers.length > 0 ? Math.round((repeatCount / customers.length) * 100) : 0;

  return {
    dateRange,
    totalOrders,
    cancelledCount: cancelledOrders.length,
    completedCount: completedOrders.length,
    grossSalesPaise,
    totalDiscountsPaise,
    netRevenuePaise,
    totalRefundedPaise,
    estimatedCostPaise,
    estimatedGrossProfitPaise,
    avgOrderValuePaise,
    statusDistribution,
    awaitingConfirmationCount: filteredOrders.filter((o) => o.confirmation_status === 'pending_confirmation').length,
    topSellingProducts,
    salesTrend,
    repeatCustomerRate,
    totalUniqueCustomers: customers.length,
  };
}

// ==========================================
// STORE OPERATIONAL STATUS (OPEN / CLOSED)
// ==========================================

export async function setStoreAcceptingOrders(
  isEnabled: boolean,
  updatedBy: string = 'Owner',
  reason?: string
): Promise<{ success: boolean; settings: RestaurantSettings }> {
  memoryStore.settings.is_online_ordering_enabled = isEnabled;
  addAuditLogEntry({
    user_name: updatedBy,
    action: isEnabled ? 'STORE_OPENED_ORDERS_RESUMED' : 'STORE_CLOSED_ORDERS_STOPPED',
    entity_type: 'settings',
    entity_id: 'store_status',
    details: isEnabled
      ? 'Store marked open. Online ordering enabled for customers.'
      : `Store closed to new orders. Reason: ${reason || 'Daily closure / Kitchen maintenance'}. Active orders can still be completed by staff.`,
  });
  return { success: true, settings: memoryStore.settings };
}

// ==========================================
// INVENTORY & STOCK MANAGEMENT API
// ==========================================

export async function fetchInventoryItems(): Promise<InventoryItem[]> {
  return [...memoryStore.inventory];
}

export async function addStockPurchase(payload: {
  item_id: string;
  quantity: number;
  purchase_cost_paise: number;
  supplier_name?: string;
  recorded_by: string;
  reason?: string;
}): Promise<{ success: boolean; item?: InventoryItem; error?: string }> {
  const item = memoryStore.inventory.find((i) => i.id === payload.item_id);
  if (!item) return { success: false, error: 'Inventory item not found.' };
  if (payload.quantity <= 0) return { success: false, error: 'Purchase quantity must be greater than zero.' };

  const prevQty = item.current_quantity;
  item.current_quantity += payload.quantity;
  item.last_purchased_date = new Date().toISOString().slice(0, 10);
  item.last_updated_at = new Date().toISOString();
  if (payload.supplier_name) item.supplier_name = payload.supplier_name;

  const movement: StockMovement = {
    id: `sm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    item_id: item.id,
    item_name: item.name,
    movement_type: 'purchase',
    quantity_delta: payload.quantity,
    previous_quantity: prevQty,
    new_quantity: item.current_quantity,
    reason: payload.reason || `Stock purchase: +${payload.quantity} ${item.unit} from ${payload.supplier_name || 'Vendor'}`,
    purchase_cost_paise: payload.purchase_cost_paise,
    recorded_by: payload.recorded_by,
    created_at: new Date().toISOString(),
  };
  memoryStore.stockMovements.unshift(movement);

  addAuditLogEntry({
    user_name: payload.recorded_by,
    action: 'INVENTORY_PURCHASE_RECORDED',
    entity_type: 'inventory',
    entity_id: item.id,
    details: `Purchased +${payload.quantity} ${item.unit} of "${item.name}". New stock: ${item.current_quantity} ${item.unit}. Total cost: ₹${(payload.purchase_cost_paise / 100).toFixed(2)}`,
  });

  return { success: true, item };
}

export async function adjustStockQuantity(payload: {
  item_id: string;
  quantity_delta: number;
  movement_type: 'adjustment' | 'wastage' | 'manual_count';
  reason: string;
  recorded_by: string;
}): Promise<{ success: boolean; item?: InventoryItem; error?: string }> {
  const item = memoryStore.inventory.find((i) => i.id === payload.item_id);
  if (!item) return { success: false, error: 'Inventory item not found.' };
  if (!payload.reason || payload.reason.trim().length < 4) {
    return { success: false, error: 'A valid reason (minimum 4 characters) is required for inventory adjustments.' };
  }

  const prevQty = item.current_quantity;
  let newQty = prevQty;
  if (payload.movement_type === 'manual_count') {
    newQty = Math.max(0, payload.quantity_delta);
  } else {
    newQty = Math.max(0, prevQty + payload.quantity_delta);
  }
  const delta = newQty - prevQty;

  item.current_quantity = newQty;
  item.last_updated_at = new Date().toISOString();

  const movement: StockMovement = {
    id: `sm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    item_id: item.id,
    item_name: item.name,
    movement_type: payload.movement_type,
    quantity_delta: delta,
    previous_quantity: prevQty,
    new_quantity: newQty,
    reason: payload.reason.trim(),
    recorded_by: payload.recorded_by,
    created_at: new Date().toISOString(),
  };
  memoryStore.stockMovements.unshift(movement);

  addAuditLogEntry({
    user_name: payload.recorded_by,
    action: 'INVENTORY_MANUAL_ADJUSTMENT',
    entity_type: 'inventory',
    entity_id: item.id,
    details: `Adjusted stock for "${item.name}" from ${prevQty} to ${newQty} ${item.unit} (${delta >= 0 ? '+' : ''}${delta}). Reason: ${payload.reason}`,
  });

  return { success: true, item };
}

export async function fetchStockMovements(itemId?: string): Promise<StockMovement[]> {
  if (itemId) {
    return memoryStore.stockMovements.filter((sm) => sm.item_id === itemId);
  }
  return [...memoryStore.stockMovements];
}

// ==========================================
// STORE EXPENSES API
// ==========================================

export async function fetchStoreExpenses(dateFrom?: string, dateTo?: string): Promise<StoreExpense[]> {
  let list = [...memoryStore.expenses];
  if (dateFrom) list = list.filter((e) => e.date >= dateFrom);
  if (dateTo) list = list.filter((e) => e.date <= dateTo);
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

export async function recordStoreExpense(payload: {
  category: any;
  description: string;
  amount_paise: number;
  payment_method: 'cash' | 'upi' | 'bank_transfer';
  receipt_number?: string;
  date?: string;
  recorded_by: string;
}): Promise<{ success: boolean; expense?: StoreExpense; error?: string }> {
  if (!payload.description || payload.description.trim().length < 3) {
    return { success: false, error: 'A valid description is required for recorded expense.' };
  }
  if (!payload.amount_paise || payload.amount_paise <= 0) {
    return { success: false, error: 'Expense amount must be greater than zero.' };
  }

  const newExpense: StoreExpense = {
    id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    category: payload.category,
    description: payload.description.trim(),
    amount_paise: payload.amount_paise,
    payment_method: payload.payment_method,
    receipt_number: payload.receipt_number?.trim(),
    recorded_by: payload.recorded_by,
    date: payload.date || new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
  };

  memoryStore.expenses.unshift(newExpense);

  addAuditLogEntry({
    user_name: payload.recorded_by,
    action: 'STORE_EXPENSE_RECORDED',
    entity_type: 'expense',
    entity_id: newExpense.id,
    details: `Recorded ${payload.category} expense of ₹${(payload.amount_paise / 100).toFixed(2)}: "${payload.description}". Paid via ${payload.payment_method.toUpperCase()}`,
  });

  return { success: true, expense: newExpense };
}

// ==========================================
// CUSTOMER LOYALTY PROGRAM API
// ==========================================

export async function fetchLoyaltyConfig(): Promise<LoyaltyProgramConfig> {
  return { ...memoryStore.loyaltyConfig };
}

export async function updateLoyaltyConfig(
  newConfig: Partial<LoyaltyProgramConfig>,
  updatedBy: string = 'Owner'
): Promise<{ success: boolean; config: LoyaltyProgramConfig }> {
  memoryStore.loyaltyConfig = {
    ...memoryStore.loyaltyConfig,
    ...newConfig,
  };

  addAuditLogEntry({
    user_name: updatedBy,
    action: 'LOYALTY_CONFIG_UPDATED',
    entity_type: 'loyalty',
    details: `Updated loyalty program settings. Status: ${memoryStore.loyaltyConfig.is_active ? 'ACTIVE' : 'DISABLED'}. Min spend: ₹${(memoryStore.loyaltyConfig.min_order_paise / 100).toFixed(0)}. Stamps needed: ${memoryStore.loyaltyConfig.stamps_required}.`,
  });

  return { success: true, config: memoryStore.loyaltyConfig };
}

export async function getLoyaltyAccountByPhone(phone: string): Promise<{
  account: LoyaltyAccount | null;
  ledger: LoyaltyLedgerEntry[];
  config: LoyaltyProgramConfig;
}> {
  const cleanPhone = phone.replace(/\D/g, '');
  const account = memoryStore.loyaltyAccounts.find((a) => a.customer_phone === cleanPhone) || null;
  const ledger = memoryStore.loyaltyLedger.filter((l) => l.customer_phone === cleanPhone);

  return {
    account,
    ledger,
    config: memoryStore.loyaltyConfig,
  };
}

export async function processOrderCompletedLoyaltyStamp(
  order: Order
): Promise<{ earned: boolean; reason?: string }> {
  if (!memoryStore.loyaltyConfig.is_active) {
    return { earned: false, reason: 'Loyalty program is currently disabled.' };
  }

  // Idempotency: verify stamp not already awarded for this order
  const existingEntry = memoryStore.loyaltyLedger.find(
    (l) => l.order_number === order.order_number && l.event_type === 'stamp_earned'
  );
  if (existingEntry) {
    return { earned: false, reason: 'Stamp already awarded for this order.' };
  }

  const foodSubtotalPaise = order.subtotal_paise;
  if (foodSubtotalPaise < memoryStore.loyaltyConfig.min_order_paise) {
    // Record non-qualifying entry for customer transparency
    memoryStore.loyaltyLedger.unshift({
      id: `led-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customer_phone: order.customer_phone,
      order_id: order.id,
      order_number: order.order_number,
      event_type: 'manual_adjustment',
      stamps_delta: 0,
      order_subtotal_paise: foodSubtotalPaise,
      reason: `Order did not qualify: Food subtotal of ₹${(foodSubtotalPaise / 100).toFixed(0)} is below the ₹${(memoryStore.loyaltyConfig.min_order_paise / 100).toFixed(0)} minimum.`,
      recorded_by: 'System',
      created_at: new Date().toISOString(),
    });
    return { earned: false, reason: 'Subtotal below minimum spend.' };
  }

  let account = memoryStore.loyaltyAccounts.find((a) => a.customer_phone === order.customer_phone);
  if (!account) {
    account = {
      id: `loy-${Date.now()}`,
      customer_phone: order.customer_phone,
      customer_name: order.customer_name,
      stamps_count: 0,
      total_stamps_earned: 0,
      available_rewards_count: 0,
      rewards_redeemed_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryStore.loyaltyAccounts.push(account);
  }

  account.stamps_count += 1;
  account.total_stamps_earned += 1;
  account.updated_at = new Date().toISOString();

  let rewardUnlocked = false;
  if (account.stamps_count >= memoryStore.loyaltyConfig.stamps_required) {
    account.stamps_count -= memoryStore.loyaltyConfig.stamps_required;
    account.available_rewards_count += 1;
    rewardUnlocked = true;
  }

  memoryStore.loyaltyLedger.unshift({
    id: `led-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    customer_phone: order.customer_phone,
    order_id: order.id,
    order_number: order.order_number,
    event_type: 'stamp_earned',
    stamps_delta: 1,
    order_subtotal_paise: foodSubtotalPaise,
    reason: `Earned 1 stamp from qualifying order ${order.order_number} (Subtotal ₹${(foodSubtotalPaise / 100).toFixed(0)})`,
    recorded_by: 'System',
    created_at: new Date().toISOString(),
  });

  if (rewardUnlocked) {
    memoryStore.loyaltyLedger.unshift({
      id: `led-rew-${Date.now()}`,
      customer_phone: order.customer_phone,
      order_number: order.order_number,
      event_type: 'reward_unlocked',
      stamps_delta: 0,
      reason: `🎉 Congratulations! 6 stamps completed. Unlocked 1 Free Pizza reward: ${memoryStore.loyaltyConfig.reward_pizza_name}`,
      recorded_by: 'System',
      created_at: new Date().toISOString(),
    });
  }

  return { earned: true };
}

export async function revokeOrderLoyaltyStamp(
  orderOrId: Order | string,
  phoneOrReason?: string,
  maybeReason?: string
): Promise<{ revoked: boolean; reason?: string }> {
  let orderNumber: string = '';
  let customerPhone: string = '';
  let reason: string = 'Order cancelled or refunded';

  if (typeof orderOrId === 'object' && orderOrId !== null) {
    orderNumber = orderOrId.order_number;
    customerPhone = orderOrId.customer_phone;
    reason = phoneOrReason || reason;
  } else {
    // orderOrId is order_id or order_number
    const foundOrder = memoryStore.orders.find((o) => o.id === orderOrId || o.order_number === orderOrId);
    if (foundOrder) {
      orderNumber = foundOrder.order_number;
      customerPhone = foundOrder.customer_phone;
      reason = phoneOrReason || maybeReason || reason;
    } else {
      orderNumber = orderOrId;
      customerPhone = phoneOrReason || '';
      reason = maybeReason || 'Order cancelled or refunded';
    }
  }

  // Idempotency: Verify a stamp was actually awarded for this order
  const existingStampEarned = memoryStore.loyaltyLedger.find(
    (l) =>
      (orderNumber && l.order_number === orderNumber && l.event_type === 'stamp_earned') ||
      (typeof orderOrId === 'string' && l.order_id === orderOrId && l.event_type === 'stamp_earned')
  );
  if (!existingStampEarned) {
    return { revoked: false, reason: 'No loyalty stamp was awarded for this order.' };
  }

  const effectiveOrderNumber = existingStampEarned.order_number || orderNumber;
  const effectivePhone = existingStampEarned.customer_phone || customerPhone;

  // Verify not already revoked
  const alreadyRevoked = memoryStore.loyaltyLedger.find(
    (l) =>
      (effectiveOrderNumber && l.order_number === effectiveOrderNumber && l.event_type === 'stamp_revoked') ||
      (typeof orderOrId === 'string' && l.order_id === orderOrId && l.event_type === 'stamp_revoked')
  );
  if (alreadyRevoked) {
    return { revoked: false, reason: 'Stamp has already been revoked for this order.' };
  }

  const account = memoryStore.loyaltyAccounts.find((a) => a.customer_phone === effectivePhone);
  if (account) {
    account.stamps_count = Math.max(0, account.stamps_count - 1);
    account.total_stamps_earned = Math.max(0, account.total_stamps_earned - 1);
    account.updated_at = new Date().toISOString();
  }

  memoryStore.loyaltyLedger.unshift({
    id: `led-rev-${Date.now()}`,
    customer_phone: effectivePhone,
    order_id: typeof orderOrId === 'string' ? orderOrId : (orderOrId as Order).id,
    order_number: effectiveOrderNumber,
    event_type: 'stamp_revoked',
    stamps_delta: -1,
    reason: `Stamp revoked due to order cancellation/refund: ${reason}`,
    recorded_by: 'System',
    created_at: new Date().toISOString(),
  });

  return { revoked: true, reason: 'Stamp successfully revoked.' };
}

export async function redeemLoyaltyReward(
  payloadOrPhone: { customer_phone: string; order_number?: string; staff_name?: string } | string,
  staffName?: string,
  orderNumber?: string
): Promise<{ success: boolean; error?: string; rewardPizzaName?: string }> {
  let customerPhone = '';
  let orderNum = orderNumber;
  let staff = staffName || 'Staff';

  if (typeof payloadOrPhone === 'object') {
    customerPhone = payloadOrPhone.customer_phone;
    orderNum = payloadOrPhone.order_number;
    staff = payloadOrPhone.staff_name || 'Staff';
  } else {
    customerPhone = payloadOrPhone;
  }

  const cleanPhone = customerPhone.replace(/\D/g, '');
  const account = memoryStore.loyaltyAccounts.find((a) => a.customer_phone === cleanPhone);

  if (!account || account.available_rewards_count <= 0) {
    return { success: false, error: 'No available free pizza rewards found for this phone number.' };
  }

  account.available_rewards_count -= 1;
  account.rewards_redeemed_count += 1;
  account.updated_at = new Date().toISOString();

  memoryStore.loyaltyLedger.unshift({
    id: `led-red-${Date.now()}`,
    customer_phone: cleanPhone,
    order_number: orderNum,
    event_type: 'reward_redeemed',
    stamps_delta: 0,
    reason: `Redeemed free reward pizza: ${memoryStore.loyaltyConfig.reward_pizza_name}${orderNum ? ` on order ${orderNum}` : ''}`,
    recorded_by: staff,
    created_at: new Date().toISOString(),
  });

  addAuditLogEntry({
    user_name: staff,
    action: 'LOYALTY_REWARD_REDEEMED',
    entity_type: 'loyalty',
    details: `Customer ${cleanPhone} redeemed 1 free pizza reward (${memoryStore.loyaltyConfig.reward_pizza_name}).`,
  });

  return { success: true, rewardPizzaName: memoryStore.loyaltyConfig.reward_pizza_name };
}

export async function recordLoyaltyAdjustment(
  payloadOrPhone:
    | {
        customer_phone: string;
        stamps_delta: number;
        reason: string;
        recorded_by: string;
      }
    | string,
  stampsDelta?: number,
  reason?: string,
  recordedBy?: string
): Promise<{ success: boolean; account?: LoyaltyAccount; error?: string }> {
  let customerPhone = '';
  let delta = 0;
  let auditReason = '';
  let staff = 'Staff';

  if (typeof payloadOrPhone === 'object') {
    customerPhone = payloadOrPhone.customer_phone;
    delta = payloadOrPhone.stamps_delta;
    auditReason = payloadOrPhone.reason;
    staff = payloadOrPhone.recorded_by;
  } else {
    customerPhone = payloadOrPhone;
    delta = stampsDelta || 0;
    auditReason = reason || '';
    staff = recordedBy || 'Staff';
  }

  const cleanPhone = customerPhone.replace(/\D/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
    return { success: false, error: 'Valid 10-digit customer phone number is required.' };
  }
  if (!auditReason || auditReason.trim().length < 5) {
    return { success: false, error: 'A mandatory audit reason (minimum 5 characters) is required for staff adjustments.' };
  }

  let account = memoryStore.loyaltyAccounts.find((a) => a.customer_phone === cleanPhone);
  if (!account) {
    account = {
      id: `loy-${Date.now()}`,
      customer_phone: cleanPhone,
      customer_name: 'Customer',
      stamps_count: 0,
      total_stamps_earned: 0,
      available_rewards_count: 0,
      rewards_redeemed_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryStore.loyaltyAccounts.push(account);
  }

  const prevStamps = account.stamps_count;
  account.stamps_count = Math.max(0, account.stamps_count + delta);
  if (delta > 0) {
    account.total_stamps_earned += delta;
  } else {
    account.total_stamps_earned = Math.max(0, account.total_stamps_earned + delta);
  }
  account.updated_at = new Date().toISOString();

  if (account.stamps_count >= memoryStore.loyaltyConfig.stamps_required) {
    account.stamps_count -= memoryStore.loyaltyConfig.stamps_required;
    account.available_rewards_count += 1;
  }

  memoryStore.loyaltyLedger.unshift({
    id: `led-adj-${Date.now()}`,
    customer_phone: cleanPhone,
    event_type: 'manual_adjustment',
    stamps_delta: delta,
    reason: `Staff adjustment by ${staff}: ${auditReason} (Stamps: ${prevStamps} -> ${account.stamps_count})`,
    recorded_by: staff,
    created_at: new Date().toISOString(),
  });

  addAuditLogEntry({
    user_name: staff,
    action: 'LOYALTY_MANUAL_ADJUSTMENT',
    entity_type: 'loyalty',
    details: `Customer ${cleanPhone}: adjustment of ${delta > 0 ? `+${delta}` : delta} stamps. Reason: ${auditReason}`,
  });

  return { success: true, account };
}

export async function fetchLoyaltyLedger(phone?: string): Promise<LoyaltyLedgerEntry[]> {
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    return memoryStore.loyaltyLedger.filter((l) => l.customer_phone === cleanPhone);
  }
  return [...memoryStore.loyaltyLedger];
}

// ==========================================
// DAILY OPENING & CLOSING CHECKLISTS API
// ==========================================

export async function fetchDailyChecklists(dateStr?: string): Promise<DailyChecklistRecord[]> {
  const targetDate = dateStr || new Date().toISOString().slice(0, 10);

  // Ensure an opening & closing instance exist for targetDate
  let opening = memoryStore.dailyChecklists.find(
    (c) => c.date === targetDate && c.type === 'opening'
  );
  if (!opening) {
    opening = {
      id: `chk-${targetDate}-opening`,
      date: targetDate,
      type: 'opening',
      status: 'pending',
      items: DEFAULT_OPENING_TASKS.map((t) => ({ ...t, completed: false })),
    };
    memoryStore.dailyChecklists.unshift(opening);
  }

  let closing = memoryStore.dailyChecklists.find(
    (c) => c.date === targetDate && c.type === 'closing'
  );
  if (!closing) {
    closing = {
      id: `chk-${targetDate}-closing`,
      date: targetDate,
      type: 'closing',
      status: 'pending',
      items: DEFAULT_CLOSING_TASKS.map((t) => ({ ...t, completed: false })),
    };
    memoryStore.dailyChecklists.unshift(closing);
  }

  return memoryStore.dailyChecklists.filter((c) => c.date === targetDate);
}

export async function toggleDailyChecklistItem(
  checklistId: string,
  itemId: string,
  staffName: string = 'Staff'
): Promise<{ success: boolean; record?: DailyChecklistRecord; error?: string }> {
  const record = memoryStore.dailyChecklists.find((c) => c.id === checklistId);
  if (!record) {
    return { success: false, error: 'Checklist record not found.' };
  }

  const item = record.items.find((i: DailyChecklistItem) => i.id === itemId);
  if (!item) {
    return { success: false, error: 'Checklist task item not found.' };
  }

  item.completed = !item.completed;
  if (item.completed) {
    item.completed_by = staffName;
    item.completed_at = new Date().toISOString();
  } else {
    item.completed_by = undefined;
    item.completed_at = undefined;
  }

  const allCompleted = record.items.every((i: DailyChecklistItem) => i.completed);
  const anyCompleted = record.items.some((i: DailyChecklistItem) => i.completed);
  record.status = allCompleted ? 'completed' : anyCompleted ? 'in_progress' : 'pending';

  return { success: true, record };
}

export async function submitDailyChecklist(
  checklistId: string,
  staffName: string = 'Staff'
): Promise<{ success: boolean; record?: DailyChecklistRecord; error?: string }> {
  const record = memoryStore.dailyChecklists.find((c) => c.id === checklistId);
  if (!record) {
    return { success: false, error: 'Checklist record not found.' };
  }

  const incompleteCount = record.items.filter((i: DailyChecklistItem) => !i.completed).length;
  record.status = 'completed';
  record.submitted_by = staffName;
  record.submitted_at = new Date().toISOString();

  addAuditLogEntry({
    user_name: staffName,
    action: `CHECKLIST_${record.type.toUpperCase()}_SUBMITTED`,
    entity_type: 'operations',
    details: `Staff submitted daily ${record.type} checklist for ${record.date} (${record.items.length - incompleteCount}/${record.items.length} tasks completed).`,
  });

  return { success: true, record };
}

// ==========================================
// CUSTOMER IDENTITY & ACCOUNT REPOSITORY
// ==========================================

export async function findCustomerByPhone(phone: string): Promise<CustomerAccount | null> {
  const clean = phone.replace(/\D/g, '');
  const customer = memoryStore.customers.find((c) => c.phone === clean);
  return customer ? JSON.parse(JSON.stringify(customer)) : null;
}

export async function findCustomerById(id: string): Promise<CustomerAccount | null> {
  const customer = memoryStore.customers.find((c) => c.id === id);
  return customer ? JSON.parse(JSON.stringify(customer)) : null;
}

export async function createCustomerAccount(data: {
  phone: string;
  full_name: string;
  email?: string;
  password?: string;
}): Promise<{ success: boolean; customer?: CustomerAccount; error?: string }> {
  const cleanPhone = data.phone.replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return { success: false, error: 'Valid 10-digit Indian mobile number is required.' };
  }
  if (!data.full_name || data.full_name.trim().length < 2) {
    return { success: false, error: 'Full name must be at least 2 characters.' };
  }

  const existing = memoryStore.customers.find((c) => c.phone === cleanPhone);
  if (existing) {
    return { success: false, error: 'An account with this mobile number already exists. Please log in.' };
  }

  let passwordHash: string | undefined = undefined;
  if (data.password && data.password.length >= 6) {
    passwordHash = await hashPassword(data.password);
  }

  const newCustomer: CustomerAccount = {
    id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    phone: cleanPhone,
    phone_verified: true, // Verified via OTP before calling createCustomerAccount
    full_name: data.full_name.trim(),
    email: data.email?.trim() || undefined,
    email_verified: false,
    password_hash: passwordHash,
    saved_addresses: [],
    favorites: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.from('customers').insert({
        id: newCustomer.id,
        phone: newCustomer.phone,
        email: newCustomer.email || null,
        full_name: newCustomer.full_name,
        password_hash: newCustomer.password_hash || null,
        created_at: newCustomer.created_at,
        updated_at: newCustomer.updated_at,
      });
    } catch (e) {
      console.warn('Supabase customer write error:', e);
    }
  }

  memoryStore.customers.unshift(newCustomer);

  addAuditLogEntry({
    user_name: newCustomer.full_name,
    action: 'CUSTOMER_REGISTERED',
    entity_type: 'customer',
    entity_id: newCustomer.id,
    details: `Customer registered account with verified phone ${cleanPhone}.`,
  });

  return { success: true, customer: newCustomer };
}

export async function authenticateCustomerWithPassword(
  phone: string,
  password: string
): Promise<{ success: boolean; customer?: CustomerAccount; error?: string }> {
  const cleanPhone = phone.replace(/\D/g, '');
  const rateKey = `login:${cleanPhone}`;
  const rate = rateLimiter.check(rateKey, RATE_LIMITS.LOGIN.limit, RATE_LIMITS.LOGIN.windowMs);

  if (!rate.allowed) {
    return {
      success: false,
      error: `Too many failed login attempts. Please wait ${Math.ceil(rate.resetMs / 60000)} minute(s) before trying again.`,
    };
  }

  const customer = memoryStore.customers.find((c) => c.phone === cleanPhone);
  if (!customer || !customer.password_hash) {
    return { success: false, error: 'Invalid mobile number or password.' };
  }

  const isMatch = await verifyPassword(password, customer.password_hash);
  if (!isMatch) {
    return { success: false, error: 'Invalid mobile number or password.' };
  }

  rateLimiter.reset(rateKey);
  return { success: true, customer: JSON.parse(JSON.stringify(customer)) };
}

export async function updateCustomerProfile(
  customerId: string,
  data: { full_name?: string; email?: string }
): Promise<{ success: boolean; customer?: CustomerAccount; error?: string }> {
  const customer = memoryStore.customers.find((c) => c.id === customerId);
  if (!customer) {
    return { success: false, error: 'Customer not found.' };
  }

  if (data.full_name && data.full_name.trim().length >= 2) {
    customer.full_name = data.full_name.trim();
  }
  if (data.email !== undefined) {
    customer.email = data.email.trim() || undefined;
  }
  customer.updated_at = new Date().toISOString();

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.from('customers').update({
        full_name: customer.full_name,
        email: customer.email || null,
        updated_at: customer.updated_at,
      }).eq('id', customerId);
    } catch (e) {
      console.warn('Supabase profile update fallback:', e);
    }
  }

  return { success: true, customer: JSON.parse(JSON.stringify(customer)) };
}

// ==========================================
// CUSTOMER SESSION MANAGEMENT
// ==========================================

export async function createCustomerSession(
  customerId: string,
  phone: string
): Promise<CustomerSession> {
  const token = generateSecureToken(32);
  const session: CustomerSession = {
    token,
    customer_id: customerId,
    phone: phone.replace(/\D/g, ''),
    expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days validity
    created_at: new Date().toISOString(),
  };

  memoryStore.customerSessions.unshift(session);
  return session;
}

export async function validateCustomerSession(
  token: string
): Promise<{ valid: boolean; session?: CustomerSession; customer?: CustomerAccount }> {
  if (!token) return { valid: false };

  const session = memoryStore.customerSessions.find(
    (s) => s.token === token && s.expires_at > Date.now()
  );
  if (!session) return { valid: false };

  const customer = memoryStore.customers.find((c) => c.id === session.customer_id);
  if (!customer) return { valid: false };

  return {
    valid: true,
    session,
    customer: JSON.parse(JSON.stringify(customer)),
  };
}

export async function revokeCustomerSession(token: string): Promise<boolean> {
  const initialLen = memoryStore.customerSessions.length;
  memoryStore.customerSessions = memoryStore.customerSessions.filter((s) => s.token !== token);
  return memoryStore.customerSessions.length < initialLen;
}

// ==========================================
// PHONE OTP VERIFICATION SYSTEM
// ==========================================

export async function createPhoneOtpRequest(phone: string): Promise<{
  success: boolean;
  otp?: string;
  expiresAt: number;
  provider: string;
  verificationId?: string;
  error?: string;
}> {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return { success: false, expiresAt: 0, provider: 'none', error: 'Valid 10-digit Indian mobile number is required.' };
  }

  // Rate Limiting Protection (Anti-Abuse)
  const rateKey = `otp:${cleanPhone}`;
  const rate = rateLimiter.check(rateKey, RATE_LIMITS.OTP_SEND.limit, RATE_LIMITS.OTP_SEND.windowMs);
  if (!rate.allowed) {
    return {
      success: false,
      expiresAt: 0,
      provider: 'rate_limited',
      error: `Too many OTP requests for this phone number. Please wait ${Math.ceil(rate.resetMs / 60000)} minute(s).`,
    };
  }

  const otp = generateSecureOtp();
  const otpHash = hashOtp(otp, cleanPhone);
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration
  const verificationId = `vreq-${Date.now()}-${generateSecureToken(8)}`;

  const reqRecord: PhoneVerificationRequest = {
    id: verificationId,
    phone: cleanPhone,
    otp_hash: otpHash,
    expires_at: expiresAt,
    attempts: 0,
    verified: false,
    created_at: Date.now(),
  };

  memoryStore.phoneVerifications.unshift(reqRecord);

  // Check SMS gateway configuration
  const hasExternalSms = Boolean(
    process.env.FAST2SMS_API_KEY ||
    (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  );

  const provider = hasExternalSms ? 'configured_gateway' : 'sandbox';

  if (!hasExternalSms) {
    console.info(`[SMS Sandbox] Generated OTP for +91-${cleanPhone}: ${otp} (Expires in 5 minutes)`);
  }

  return {
    success: true,
    otp: provider === 'sandbox' ? otp : undefined, // In sandbox mode, return for developer ease
    expiresAt,
    provider,
    verificationId,
  };
}

export async function verifyPhoneOtp(
  phone: string,
  otp: string
): Promise<{ success: boolean; verificationToken?: string; customer?: CustomerAccount; error?: string }> {
  const cleanPhone = phone.replace(/\D/g, '');
  const cleanOtp = otp.trim();

  const reqRecord = memoryStore.phoneVerifications.find(
    (v) => v.phone === cleanPhone && !v.verified && v.expires_at > Date.now()
  );

  if (!reqRecord) {
    return { success: false, error: 'No active OTP request found or verification code expired. Please request a new OTP.' };
  }

  if (reqRecord.attempts >= 3) {
    reqRecord.expires_at = 0; // Invalidate
    return { success: false, error: 'Maximum incorrect verification attempts exceeded. Please request a fresh OTP.' };
  }

  const computedHash = hashOtp(cleanOtp, cleanPhone);
  const isMatch = timingSafeMatch(computedHash, reqRecord.otp_hash);

  if (!isMatch) {
    reqRecord.attempts += 1;
    const remaining = 3 - reqRecord.attempts;
    return {
      success: false,
      error: `Invalid OTP code. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Code locked.'}`,
    };
  }

  // Mark verified
  reqRecord.verified = true;

  // Check if customer account exists, and mark phone verified
  let customer = memoryStore.customers.find((c) => c.phone === cleanPhone);
  if (customer) {
    customer.phone_verified = true;
    customer.updated_at = new Date().toISOString();
  }

  return {
    success: true,
    verificationToken: reqRecord.id,
    customer: customer ? JSON.parse(JSON.stringify(customer)) : undefined,
  };
}

// ==========================================
// SAVED ADDRESSES & FAVORITES
// ==========================================

export async function saveCustomerAddress(
  customerId: string,
  address: Omit<CustomerAddress, 'id'> & { id?: string }
): Promise<{ success: boolean; customer?: CustomerAccount; error?: string }> {
  const customer = memoryStore.customers.find((c) => c.id === customerId);
  if (!customer) return { success: false, error: 'Customer not found.' };

  if (address.is_default) {
    customer.saved_addresses.forEach((a) => (a.is_default = false));
  }

  if (address.id) {
    const existingIdx = customer.saved_addresses.findIndex((a) => a.id === address.id);
    if (existingIdx >= 0) {
      customer.saved_addresses[existingIdx] = {
        ...address,
        id: address.id,
      };
    }
  } else {
    customer.saved_addresses.push({
      ...address,
      id: `addr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      is_default: customer.saved_addresses.length === 0 ? true : Boolean(address.is_default),
    });
  }

  customer.updated_at = new Date().toISOString();
  return { success: true, customer: JSON.parse(JSON.stringify(customer)) };
}

export async function deleteCustomerAddress(
  customerId: string,
  addressId: string
): Promise<{ success: boolean; customer?: CustomerAccount; error?: string }> {
  const customer = memoryStore.customers.find((c) => c.id === customerId);
  if (!customer) return { success: false, error: 'Customer not found.' };

  customer.saved_addresses = customer.saved_addresses.filter((a) => a.id !== addressId);
  customer.updated_at = new Date().toISOString();
  return { success: true, customer: JSON.parse(JSON.stringify(customer)) };
}

export async function toggleCustomerFavorite(
  customerId: string,
  productId: string
): Promise<{ success: boolean; favorites: string[]; error?: string }> {
  const customer = memoryStore.customers.find((c) => c.id === customerId);
  if (!customer) return { success: false, favorites: [], error: 'Customer not found.' };

  const exists = customer.favorites.includes(productId);
  if (exists) {
    customer.favorites = customer.favorites.filter((id) => id !== productId);
  } else {
    customer.favorites.push(productId);
  }

  customer.updated_at = new Date().toISOString();
  return { success: true, favorites: [...customer.favorites] };
}

export async function getCustomerOrders(phoneOrCustomerId: string): Promise<Order[]> {
  const clean = phoneOrCustomerId.replace(/\D/g, '');
  return memoryStore.orders.filter(
    (o) => o.customer_phone === clean || o.customer_id === phoneOrCustomerId
  );
}

// ==========================================
// ANTI-FRAUD COD CONFIRMATION ACTIONS
// ==========================================

export async function confirmPendingOrder(
  orderId: string,
  confirmedBy: string = 'Staff Manager'
): Promise<{ success: boolean; order?: Order; error?: string }> {
  const order = memoryStore.orders.find((o) => o.id === orderId);
  if (!order) return { success: false, error: 'Order not found.' };

  order.confirmation_status = 'confirmed';
  order.status = 'confirmed';
  order.updated_at = new Date().toISOString();
  order.internal_notes = order.internal_notes
    ? `${order.internal_notes} | Verified & confirmed by ${confirmedBy}`
    : `Verified & confirmed by ${confirmedBy}`;

  addAuditLogEntry({
    user_name: confirmedBy,
    action: 'ORDER_COD_CONFIRMED',
    entity_type: 'order',
    entity_id: order.id,
    details: `Staff confirmed COD order #${order.order_number} and released to kitchen queue.`,
  });

  return { success: true, order };
}

export async function rejectPendingOrder(
  orderId: string,
  reason: string,
  rejectedBy: string = 'Staff Manager'
): Promise<{ success: boolean; order?: Order; error?: string }> {
  const order = memoryStore.orders.find((o) => o.id === orderId);
  if (!order) return { success: false, error: 'Order not found.' };

  order.confirmation_status = 'rejected';
  order.status = 'cancelled';
  order.cancellation_reason = reason;
  order.cancelled_by = rejectedBy;
  order.updated_at = new Date().toISOString();

  addAuditLogEntry({
    user_name: rejectedBy,
    action: 'ORDER_COD_REJECTED',
    entity_type: 'order',
    entity_id: order.id,
    details: `Staff rejected unconfirmed COD order #${order.order_number}: ${reason}`,
  });

  return { success: true, order };
}


