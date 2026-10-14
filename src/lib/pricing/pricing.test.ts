// Automated tests for Pizza Harrison Financial & Pricing Engine

import {
  formatINR,
  calculateItemUnitPricePaise,
  calculateCartSubtotalPaise,
  calculateCouponDiscountPaise,
  calculateDeliveryFeePaise,
  calculateTaxPaise,
  calculateFullPricing,
} from './index';
import { Coupon } from '../types';

function runTests() {
  console.log('--- Running Pricing Engine Tests ---');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // 1. Currency formatting
  assert(formatINR(24900) === '₹249', 'formatINR with whole rupees');
  assert(formatINR(24950) === '₹249.50', 'formatINR with paise fractions');

  // 2. Item unit price
  const unitPrice = calculateItemUnitPricePaise(34900, 9900, [4900, 3500]);
  assert(unitPrice === 53200, 'calculateItemUnitPricePaise (Medium 349 + Cheese Burst 99 + Extra Cheese 49 + Olives 35 = 532)');

  // 3. Subtotal
  const subtotal = calculateCartSubtotalPaise([
    { unitPricePaise: 53200, quantity: 2 },
    { unitPricePaise: 16900, quantity: 1 },
  ]);
  assert(subtotal === 123300, 'calculateCartSubtotalPaise (2*532 + 169 = 1233)');

  // 4. Coupon percentage with cap
  const pctCoupon: Coupon = {
    id: 'c-1',
    code: 'HARRISON20',
    description: '20% off up to ₹120',
    discount_type: 'percentage',
    discount_value: 20,
    min_order_paise: 39900,
    max_discount_paise: 12000, // ₹120 cap
    current_uses: 10,
    is_active: true,
    valid_from: '2026-01-01',
  };
  const capTest = calculateCouponDiscountPaise(80000, pctCoupon); // 20% of 800 = 160, capped at 120
  assert(capTest.discountPaise === 12000, 'Coupon 20% capped at ₹120');

  // 5. Coupon minimum order threshold
  const minOrderTest = calculateCouponDiscountPaise(35000, pctCoupon); // 350 < 399
  assert(minOrderTest.discountPaise === 0 && !!minOrderTest.error, 'Coupon min order validation error');

  // 6. Flat discount
  const flatCoupon: Coupon = {
    id: 'c-2',
    code: 'GLA100',
    description: 'Flat ₹100 off on ₹499+',
    discount_type: 'flat',
    discount_value: 10000,
    min_order_paise: 49900,
    current_uses: 50,
    is_active: true,
    valid_from: '2026-01-01',
  };
  const flatTest = calculateCouponDiscountPaise(60000, flatCoupon);
  assert(flatTest.discountPaise === 10000, 'Flat discount ₹100 applied accurately');

  // 7. Delivery fee threshold
  assert(calculateDeliveryFeePaise(55000, 'delivery', 49900, 4000) === 0, 'Free delivery threshold met');
  assert(calculateDeliveryFeePaise(35000, 'delivery', 49900, 4000) === 4000, 'Base delivery fee applied');
  assert(calculateDeliveryFeePaise(35000, 'pickup', 49900, 4000) === 0, 'Pickup has zero delivery fee');

  // 8. Tax (GST 5%)
  assert(calculateTaxPaise(50000, 5) === 2500, 'GST 5% on ₹500 is ₹25 (2500 paise)');

  // 9. Full Pricing Integration
  const fullPricing = calculateFullPricing(
    [{ unitPricePaise: 30000, quantity: 2 }], // ₹600 subtotal
    'delivery',
    flatCoupon // ₹100 off -> Taxable subtotal = ₹500
  );
  // Subtotal = ₹600 (60000)
  // Discount = ₹100 (10000)
  // Taxable Subtotal = ₹500 (50000)
  // Delivery Fee = ₹0 (because ₹600 >= ₹499 free threshold)
  // Packaging Fee = ₹15 (1500)
  // Tax (5% of 500) = ₹25 (2500)
  // Grand Total = 50000 + 0 + 1500 + 2500 = 54000 paise (₹540)
  assert(fullPricing.subtotal_paise === 60000, 'Full pricing subtotal is ₹600');
  assert(fullPricing.discount_paise === 10000, 'Full pricing discount is ₹100');
  assert(fullPricing.delivery_fee_paise === 0, 'Full pricing delivery fee is ₹0');
  assert(fullPricing.tax_paise === 2500, 'Full pricing tax is ₹25');
  assert(fullPricing.packaging_fee_paise === 1500, 'Full pricing packaging is ₹15');
  assert(fullPricing.total_paise === 54000, 'Full pricing total is ₹540 (54000 paise)');

  console.log(`\nAll ${passed}/${total} pricing tests passed with 100% precision!`);
}

runTests();
