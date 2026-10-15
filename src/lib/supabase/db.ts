// Pizza Harrison - Supabase PostgreSQL Database Adapter & Connector
// Automatically connects to Supabase when environment variables exist,
// falling back safely to local memory store when credentials are empty or offline.

import { getSupabaseServerClient, isSupabaseServerConfigured } from './server';
import { Order, CustomerAccount, Booking } from '../types';

export interface DatabaseStatus {
  connected: boolean;
  configured: boolean;
  provider: 'supabase' | 'in_memory_fallback';
  url: string | null;
  error?: string;
  tableCounts?: {
    orders?: number;
    customers?: number;
    bookings?: number;
    categories?: number;
    products?: number;
  };
}

/**
 * Checks live connection health to Supabase PostgreSQL database.
 */
export async function testDatabaseConnection(): Promise<DatabaseStatus> {
  if (!isSupabaseServerConfigured) {
    return {
      connected: false,
      configured: false,
      provider: 'in_memory_fallback',
      url: null,
      error: 'Supabase credentials not configured in environment variables (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).',
    };
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      connected: false,
      configured: false,
      provider: 'in_memory_fallback',
      url: null,
      error: 'Failed to initialize Supabase client instance.',
    };
  }

  try {
    // Run simple lightweight ping query
    const [ordersRes, customersRes, bookingsRes] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
    ]);

    if (ordersRes.error && !ordersRes.error.message.includes('permission')) {
      return {
        connected: false,
        configured: true,
        provider: 'supabase',
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
        error: ordersRes.error.message,
      };
    }

    return {
      connected: true,
      configured: true,
      provider: 'supabase',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      tableCounts: {
        orders: ordersRes.count ?? 0,
        customers: customersRes.count ?? 0,
        bookings: bookingsRes.count ?? 0,
      },
    };
  } catch (err: any) {
    return {
      connected: false,
      configured: true,
      provider: 'in_memory_fallback',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      error: err.message || 'Connection timeout or network failure.',
    };
  }
}

/**
 * Persists an order to Supabase PostgreSQL with error handling.
 */
export async function persistOrderToSupabase(order: Order): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database not configured.' };

  try {
    const { error: orderErr } = await supabase.from('orders').insert({
      id: order.id,
      order_number: order.order_number,
      customer_id: order.customer_id || null,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email || null,
      branch: order.branch,
      order_type: order.order_type,
      status: order.status,
      confirmation_status: order.confirmation_status || 'confirmed',
      confirmation_reason: order.confirmation_reason || null,
      idempotency_key: order.idempotency_key || null,
      delivery_address_json: order.delivery_address || null,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      subtotal_paise: order.subtotal_paise,
      discount_paise: order.discount_paise,
      coupon_code: order.applied_coupon_code || null,
      delivery_fee_paise: order.delivery_fee_paise,
      gst_paise: order.tax_paise,
      packaging_fee_paise: order.packaging_fee_paise,
      total_paise: order.total_paise,
      created_at: order.created_at,
      updated_at: order.updated_at,
    });

    if (orderErr) {
      console.warn('[Supabase DB] Order insertion warning:', orderErr.message);
      return { success: false, error: orderErr.message };
    }

    // Insert order items if present
    if (order.items && order.items.length > 0) {
      const itemsToInsert = order.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        size_name: item.variant_name || item.variant || 'Regular 7"',
        crust_name: item.crust_name || item.crust || null,
        addons_json: item.addons_json || item.addons || [],
        quantity: item.quantity,
        unit_price_paise: item.unit_price_paise,
        total_price_paise: item.item_total_paise || item.total_paise || (item.unit_price_paise * item.quantity),
      }));

      await supabase.from('order_items').insert(itemsToInsert);
    }

    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase DB] Error persisting order:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Persists a new customer account to Supabase PostgreSQL.
 */
export async function persistCustomerToSupabase(customer: CustomerAccount): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database not configured.' };

  try {
    const { error } = await supabase.from('customers').insert({
      id: customer.id,
      phone: customer.phone,
      email: customer.email || null,
      full_name: customer.full_name,
      password_hash: customer.password_hash || null,
      total_orders: customer.total_orders || 0,
      created_at: customer.created_at,
      updated_at: customer.updated_at,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Persists a table booking reservation to Supabase PostgreSQL.
 */
export async function persistBookingToSupabase(booking: Booking): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { success: false, error: 'Database not configured.' };

  try {
    const { error } = await supabase.from('bookings').insert({
      id: booking.id,
      booking_reference: booking.booking_reference,
      customer_name: booking.customer_name,
      customer_phone: booking.customer_phone,
      customer_email: booking.customer_email || null,
      branch: booking.branch,
      guest_count: booking.guest_count,
      booking_date: booking.booking_date,
      booking_time: booking.booking_time,
      seating_preference: booking.seating_preference || 'indoor_ac',
      special_requests: booking.special_requests || null,
      status: booking.status,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
