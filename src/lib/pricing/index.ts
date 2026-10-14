// Pizza Harrison - Financial & Pricing Calculation Engine
// Strictly uses integer paise (1 INR = 100 paise) to avoid floating-point arithmetic errors.

import { Coupon, OrderType } from '../types';

export const DEFAULT_FEE_SETTINGS = {
  free_delivery_threshold_paise: 49900, // ₹499
  base_delivery_fee_paise: 4000,        // ₹40
  gst_percentage: 5,                    // 5% GST on restaurant services in India
  packaging_fee_paise: 1500,            // ₹15 packaging
  currency: 'INR' as const,
  timezone: 'Asia/Kolkata' as const,
};

/**
 * Formats integer paise into standard Indian Rupee representation.
 * Example: 24900 -> "₹249"
 * Example: 24950 -> "₹249.50"
 */
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  if (paise % 100 === 0) {
    return `₹${rupees.toLocaleString('en-IN')}`;
  }
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calculates single custom item unit price in integer paise.
 */
export function calculateItemUnitPricePaise(
  baseOrVariantPricePaise: number,
  crustPricePaise: number = 0,
  addonPricesPaise: number[] = []
): number {
  const addonsSum = addonPricesPaise.reduce((acc, curr) => acc + curr, 0);
  return Math.max(0, Math.round(baseOrVariantPricePaise + crustPricePaise + addonsSum));
}

/**
 * Calculates cart subtotal from items.
 */
export function calculateCartSubtotalPaise(
  items: Array<{ unitPricePaise: number; quantity: number }>
): number {
  return items.reduce((acc, item) => {
    const qty = Math.max(1, Math.round(item.quantity));
    return acc + Math.round(item.unitPricePaise * qty);
  }, 0);
}

/**
 * Calculates genuine coupon discount based on rules, caps, and minimum order values.
 */
export function calculateCouponDiscountPaise(
  subtotalPaise: number,
  coupon?: Coupon | null
): { discountPaise: number; error?: string } {
  if (!coupon) {
    return { discountPaise: 0 };
  }

  if (!coupon.is_active) {
    return { discountPaise: 0, error: `Coupon ${coupon.code} is no longer active.` };
  }

  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
    return { discountPaise: 0, error: `Coupon ${coupon.code} has expired.` };
  }

  if (coupon.min_order_paise > 0 && subtotalPaise < coupon.min_order_paise) {
    const deficitRupees = Math.ceil((coupon.min_order_paise - subtotalPaise) / 100);
    return {
      discountPaise: 0,
      error: `Add items worth ₹${deficitRupees} more to apply coupon ${coupon.code}.`,
    };
  }

  let calculatedDiscount = 0;
  if (coupon.discount_type === 'flat') {
    calculatedDiscount = coupon.discount_value;
  } else if (coupon.discount_type === 'percentage') {
    calculatedDiscount = Math.floor((subtotalPaise * coupon.discount_value) / 100);
  }

  // Apply maximum cap if specified
  if (coupon.max_discount_paise && coupon.max_discount_paise > 0) {
    calculatedDiscount = Math.min(calculatedDiscount, coupon.max_discount_paise);
  }

  // Discount cannot exceed subtotal
  calculatedDiscount = Math.min(calculatedDiscount, subtotalPaise);

  return { discountPaise: Math.max(0, calculatedDiscount) };
}

/**
 * Computes delivery charge based on fulfillment method and order subtotal.
 */
export function calculateDeliveryFeePaise(
  subtotalPaise: number,
  orderType: OrderType,
  freeDeliveryThresholdPaise: number = DEFAULT_FEE_SETTINGS.free_delivery_threshold_paise,
  baseDeliveryFeePaise: number = DEFAULT_FEE_SETTINGS.base_delivery_fee_paise
): number {
  if (orderType !== 'delivery') {
    return 0; // Free for pickup / takeaway
  }

  if (subtotalPaise >= freeDeliveryThresholdPaise) {
    return 0; // Free delivery threshold met!
  }

  return baseDeliveryFeePaise;
}

/**
 * Computes GST (5%) on taxable subtotal.
 */
export function calculateTaxPaise(
  taxableSubtotalPaise: number,
  gstPercentage: number = DEFAULT_FEE_SETTINGS.gst_percentage
): number {
  return Math.round((Math.max(0, taxableSubtotalPaise) * gstPercentage) / 100);
}

/**
 * Computes packaging fee for deliveries.
 */
export function calculatePackagingFeePaise(
  orderType: OrderType,
  feePaise: number = DEFAULT_FEE_SETTINGS.packaging_fee_paise
): number {
  return orderType === 'delivery' ? feePaise : 0;
}

export interface PricingBreakdown {
  subtotal_paise: number;
  discount_paise: number;
  taxable_subtotal_paise: number;
  delivery_fee_paise: number;
  packaging_fee_paise: number;
  tax_paise: number;
  total_paise: number;
  applied_coupon_code?: string;
  coupon_error?: string;
}

/**
 * Server-authoritative full bill calculation.
 */
export function calculateFullPricing(
  items: Array<{ unitPricePaise: number; quantity: number }>,
  orderType: OrderType,
  coupon?: Coupon | null,
  settings: typeof DEFAULT_FEE_SETTINGS = DEFAULT_FEE_SETTINGS
): PricingBreakdown {
  const subtotal_paise = calculateCartSubtotalPaise(items);
  const { discountPaise, error: couponError } = calculateCouponDiscountPaise(subtotal_paise, coupon);
  
  const taxable_subtotal_paise = Math.max(0, subtotal_paise - discountPaise);
  const delivery_fee_paise = calculateDeliveryFeePaise(
    subtotal_paise,
    orderType,
    settings.free_delivery_threshold_paise,
    settings.base_delivery_fee_paise
  );
  const packaging_fee_paise = calculatePackagingFeePaise(orderType, settings.packaging_fee_paise);
  const tax_paise = calculateTaxPaise(taxable_subtotal_paise, settings.gst_percentage);

  const total_paise = taxable_subtotal_paise + delivery_fee_paise + packaging_fee_paise + tax_paise;

  return {
    subtotal_paise,
    discount_paise: discountPaise,
    taxable_subtotal_paise,
    delivery_fee_paise,
    packaging_fee_paise,
    tax_paise,
    total_paise,
    applied_coupon_code: discountPaise > 0 && coupon ? coupon.code : undefined,
    coupon_error: couponError,
  };
}
