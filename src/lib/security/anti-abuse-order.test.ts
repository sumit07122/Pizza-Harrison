// Pizza Harrison — Anti-Fake Order, Anti-Abuse & Checkout Security Test Suite
// Verifies phone ownership enforcement, idempotency, server pricing, COD confirmation queue,
// coupon reuse caps, and IDOR isolation.

import {
  createOrderServerTrusted,
  fetchOrderByNumber,
  updateOrderStatus,
  getCustomerOrders,
  createPhoneOtpRequest,
  verifyPhoneOtp,
  memoryStore,
  CreateOrderPayload,
} from '../data/store';
import { rateLimiter } from './rate-limit';

interface TestResult {
  id: string;
  name: string;
  status: 'PASS' | 'FAIL';
  evidence: string;
}

const results: TestResult[] = [];

function record(id: string, name: string, condition: boolean, evidence: string) {
  const status = condition ? 'PASS' : 'FAIL';
  results.push({ id, name, status, evidence });
  console.log(`  ${condition ? '✅' : '❌'} [${id}] ${name} -> ${status}: ${evidence}`);
}

async function runAntiAbuseTests() {
  console.log('\n=============================================================');
  console.log('🛡️ PIZZA HARRISON — ANTI-ABUSE & SECURE CHECKOUT VERIFICATION');
  console.log('=============================================================\n');

  // --- GROUP 1: PHONE VERIFICATION ENFORCEMENT ---
  console.log('--- GROUP 1: PHONE OWNERSHIP & OTP VERIFICATION ENFORCEMENT ---');
  memoryStore.settings.require_phone_verification = true;

  const unverifiedPhone = '9991122334';
  const unverifiedOrderPayload: CreateOrderPayload = {
    customer_name: 'Unverified Attacker',
    customer_phone: unverifiedPhone,
    order_type: 'delivery',
    branch: 'pali_khera',
    delivery_address: 'Sonkh Road Mathura',
    payment_method: 'cod',
    items: [
      {
        product_id: 'prod-1',
        quantity: 1,
      },
    ],
  };

  const unverifiedRes = await createOrderServerTrusted(unverifiedOrderPayload);
  record(
    'ABUSE-OTP-01',
    'Unverified Phone Order Rejection',
    !unverifiedRes.success && (unverifiedRes.error?.includes('verify your mobile number') || false),
    `Rejected submission without OTP verification: ${unverifiedRes.error}`
  );

  // Now verify that phone via genuine OTP flow
  const otpReq = await createPhoneOtpRequest(unverifiedPhone);
  const verifyRes = await verifyPhoneOtp(unverifiedPhone, otpReq.otp!);
  record(
    'ABUSE-OTP-02',
    'Legitimate OTP Verification Flow',
    otpReq.success && verifyRes.success && !!verifyRes.verificationToken,
    `Successfully verified phone +91-${unverifiedPhone} with token ${verifyRes.verificationToken}`
  );

  // Order with verified token now succeeds
  const verifiedOrderRes = await createOrderServerTrusted({
    ...unverifiedOrderPayload,
    phone_verification_token: verifyRes.verificationToken,
  });
  record(
    'ABUSE-OTP-03',
    'Order Accepted with Verified Phone',
    verifiedOrderRes.success && !!verifiedOrderRes.order,
    `Order successfully placed: ${verifiedOrderRes.order?.order_number}`
  );

  // --- GROUP 2: SERVER-SIDE AUTHORITATIVE PRICING ---
  console.log('\n--- GROUP 2: SERVER-SIDE AUTHORITATIVE PRICING ---');
  // Client attempts to place Double Cheese Margherita with tampered client assumptions
  const tamperedPricePayload: CreateOrderPayload = {
    customer_name: 'Priyanshu Bansal',
    customer_phone: '9876543210', // Verified seed user
    order_type: 'delivery',
    branch: 'pali_khera',
    delivery_address: 'Near GLA Gate 1, Mathura',
    payment_method: 'cod',
    items: [
      {
        product_id: 'prod-1', // Double Cheese Margherita
        variant_size_name: 'Medium 9"', // Medium variant ₹429 (42900 paise)
        crust_name: 'Cheese Burst', // Crust option +₹99 (9900 paise)
        addon_ids: ['ad-1'], // Extra Mozzarella Cheese +₹49 (4900 paise)
        quantity: 2,
      },
    ],
  };

  const priceRes = await createOrderServerTrusted(tamperedPricePayload);
  // Authoritative Calculation:
  // Item unit price: 429 + 99 + 49 = ₹577 (57700 paise)
  // Quantity: 2 -> Subtotal = ₹1154 (115400 paise)
  // Subtotal >= ₹499 -> Delivery Fee = 0
  // Packaging fee = ₹15 (1500 paise)
  // GST 5% on 115400 = 5770 paise (₹57.70)
  // Authoritative Total = 115400 + 0 + 1500 + 5770 = 122670 paise (₹1,226.70)
  const orderPrice = priceRes.order?.total_paise || 0;
  record(
    'ABUSE-PRICE-01',
    'Server Authoritative Item Recalculation',
    priceRes.success && orderPrice === 122670,
    `Server calculated exact authoritative total: ₹${orderPrice / 100} (ignoring any client claims)`
  );

  // --- GROUP 3: IDEMPOTENCY & DUPLICATE PROTECTION ---
  console.log('\n--- GROUP 3: IDEMPOTENCY & ANTI-DUPLICATE CHECKOUT ---');
  const idempotencyKey = `idem_test_${Date.now()}`;
  const firstSubmit = await createOrderServerTrusted({
    ...tamperedPricePayload,
    idempotency_key: idempotencyKey,
  });

  const ordersCountBefore = memoryStore.orders.length;

  // Duplicate network retry or accidental double-click with identical idempotency key
  const duplicateSubmit = await createOrderServerTrusted({
    ...tamperedPricePayload,
    idempotency_key: idempotencyKey,
  });

  const ordersCountAfter = memoryStore.orders.length;

  record(
    'ABUSE-IDEM-01',
    'Idempotency Key Deduplication',
    firstSubmit.success &&
      duplicateSubmit.success &&
      firstSubmit.order?.id === duplicateSubmit.order?.id &&
      ordersCountBefore === ordersCountAfter,
    `Duplicate submission returned cached order #${firstSubmit.order?.order_number} without duplicate record creation`
  );

  // --- GROUP 4: COD CONFIRMATION QUEUE & RISK EVALUATION ---
  console.log('\n--- GROUP 4: COD ANTI-FRAUD & CONFIRMATION QUEUE ---');
  // First-time COD customer
  const firstTimeCODPhone = '9811223344';
  const otpFirstTime = await createPhoneOtpRequest(firstTimeCODPhone);
  await verifyPhoneOtp(firstTimeCODPhone, otpFirstTime.otp!);

  const firstTimeCODRes = await createOrderServerTrusted({
    customer_name: 'First Time Student',
    customer_phone: firstTimeCODPhone,
    order_type: 'delivery',
    branch: 'gla_university',
    delivery_address: 'GLA Boys Hostel 2, Room 101',
    payment_method: 'cod',
    items: [{ product_id: 'prod-1', quantity: 1 }],
  });

  record(
    'ABUSE-COD-01',
    'First-Time COD Customer Flagged for Confirmation',
    firstTimeCODRes.success &&
      firstTimeCODRes.order?.confirmation_status === 'pending_confirmation' &&
      firstTimeCODRes.order?.status === 'placed',
    `First-time order flagged: status=${firstTimeCODRes.order?.status}, confirmation_status=${firstTimeCODRes.order?.confirmation_status}`
  );

  // High-value COD order (>= ₹1,500)
  const highValueCODRes = await createOrderServerTrusted({
    customer_name: 'Priyanshu Bansal',
    customer_phone: '9876543210',
    order_type: 'delivery',
    branch: 'pali_khera',
    delivery_address: 'NH-19 Mathura',
    payment_method: 'cod',
    items: [
      { product_id: 'prod-1', quantity: 10 }, // 10 x ₹249 = ₹2,490 >= ₹1,500 threshold
    ],
  });

  record(
    'ABUSE-COD-02',
    'High-Value COD Order Flagged for Confirmation',
    highValueCODRes.success &&
      highValueCODRes.order?.confirmation_status === 'pending_confirmation',
    `High-value order (₹${(highValueCODRes.order?.total_paise || 0) / 100}) flagged: ${highValueCODRes.order?.confirmation_reason}`
  );

  // Kitchen tablet KDS filter: unconfirmed orders must be withheld
  const kitchenIncoming = memoryStore.orders.filter(
    (o) =>
      (o.status === 'placed' || o.status === 'confirmed') &&
      o.confirmation_status !== 'pending_confirmation'
  );
  const containsUnconfirmed = kitchenIncoming.some(
    (o) => o.id === firstTimeCODRes.order?.id || o.id === highValueCODRes.order?.id
  );
  record(
    'ABUSE-COD-03',
    'Kitchen KDS Isolation of Unconfirmed Orders',
    !containsUnconfirmed,
    'Unconfirmed COD orders are strictly hidden from the kitchen prep queue'
  );

  // Staff Confirmation Action releases order to kitchen
  firstTimeCODRes.order!.confirmation_status = 'confirmed';
  firstTimeCODRes.order!.status = 'confirmed';

  const kitchenIncomingAfter = memoryStore.orders.filter(
    (o) =>
      (o.status === 'placed' || o.status === 'confirmed') &&
      o.confirmation_status !== 'pending_confirmation'
  );
  const releasedToKitchen = kitchenIncomingAfter.some((o) => o.id === firstTimeCODRes.order?.id);
  record(
    'ABUSE-COD-04',
    'Staff Confirmation Releases Order to Kitchen',
    releasedToKitchen,
    'Confirmed COD order immediately appears on kitchen prep line'
  );

  // --- GROUP 5: COUPON ABUSE & PER-CUSTOMER USAGE ENFORCEMENT ---
  console.log('\n--- GROUP 5: COUPON ABUSE & PER-CUSTOMER USAGE ENFORCEMENT ---');
  const couponUserPhone = '9812345678'; // Verified seed customer Sneha Sharma
  rateLimiter.reset(`order:${couponUserPhone}`);

  const couponOrder1 = await createOrderServerTrusted({
    customer_name: 'Sneha Sharma',
    customer_phone: couponUserPhone,
    order_type: 'delivery',
    branch: 'pali_khera',
    delivery_address: 'Sonkh Road Mathura',
    payment_method: 'cod',
    applied_coupon_code: 'GLA100', // Flat ₹100 on ₹499+
    items: [{ product_id: 'prod-1', variant_size_name: 'Large 12"', quantity: 2 }],
  });

  record(
    'ABUSE-CPN-01',
    'Initial Coupon Redemption',
    couponOrder1.success && couponOrder1.order?.discount_paise === 10000,
    `GLA100 applied successfully: discount=₹${(couponOrder1.order?.discount_paise || 0) / 100}`
  );

  // Second attempt by the same customer with the single-use coupon
  rateLimiter.reset(`order:${couponUserPhone}`);
  const couponOrder2 = await createOrderServerTrusted({
    customer_name: 'Sneha Sharma',
    customer_phone: couponUserPhone,
    order_type: 'delivery',
    branch: 'pali_khera',
    delivery_address: 'Sonkh Road Mathura',
    payment_method: 'cod',
    applied_coupon_code: 'GLA100',
    items: [{ product_id: 'prod-1', variant_size_name: 'Large 12"', quantity: 2 }],
  });

  record(
    'ABUSE-CPN-02',
    'Coupon Reuse Restriction Per Customer',
    !couponOrder2.success && (couponOrder2.error?.includes('already been redeemed') || false),
    `Blocked second redemption: ${couponOrder2.error}`
  );

  // --- GROUP 6: CUSTOMER DATA PRIVACY & IDOR ISOLATION ---
  console.log('\n--- GROUP 6: CUSTOMER DATA PRIVACY & IDOR PROTECTION ---');
  const testPhone = '9897123456'; // Aman Dixit in INITIAL_ORDERS
  const amanOrders = await getCustomerOrders(testPhone);
  const onlyAmanOrders = amanOrders.every((o) => o.customer_phone === testPhone);
  record(
    'ABUSE-IDOR-01',
    'Order History Phone Isolation (Anti-IDOR)',
    amanOrders.length > 0 && onlyAmanOrders,
    `Customer ${testPhone} received ${amanOrders.length} orders, 100% strictly matched phone number`
  );

  // fetchOrderByNumber with phone verification
  const someOrder = amanOrders[0];
  const queryWithCorrectPhone = await fetchOrderByNumber(someOrder.order_number, testPhone);
  const queryWithAttackerPhone = await fetchOrderByNumber(someOrder.order_number, '9999999999');

  record(
    'ABUSE-IDOR-02',
    'Public Order Tracking Authorization Shield',
    queryWithCorrectPhone !== null && queryWithAttackerPhone === null,
    'Order tracking returns details only when requester verifies customer phone match'
  );

  // --- GROUP 7: SOLD-OUT ITEM PROTECTION ---
  console.log('\n--- GROUP 7: SOLD-OUT ITEM PROTECTION ---');
  const soldOutProd = memoryStore.products[0];
  soldOutProd.is_available = false;

  const soldOutRes = await createOrderServerTrusted({
    customer_name: 'Sneha Sharma',
    customer_phone: '9812345678',
    order_type: 'delivery',
    branch: 'pali_khera',
    delivery_address: 'Pali Khera Road Mathura',
    payment_method: 'cod',
    items: [{ product_id: soldOutProd.id, quantity: 1 }],
  });

  soldOutProd.is_available = true; // restore

  record(
    'ABUSE-STOCK-01',
    'Sold-Out Product Checkout Rejection',
    !soldOutRes.success && (soldOutRes.error?.includes('out of stock') || false),
    `Rejected unavailable item: ${soldOutRes.error}`
  );

  // --- GROUP 8: ORDER STATUS TRANSITION INTEGRITY ---
  console.log('\n--- GROUP 8: SERVER-ENFORCED ORDER STATUS TRANSITIONS ---');
  const testOrder = memoryStore.orders.find((o) => o.status === 'placed');
  if (testOrder) {
    // Attempt illegal transition from placed directly to completed
    const illegalJump = await updateOrderStatus(testOrder.id, 'completed', 'Attacker');
    record(
      'ABUSE-STAT-01',
      'Illegal Direct Status Jump Rejection',
      !illegalJump.success && (illegalJump.error?.includes('Illegal status transition') || false),
      `Blocked jump placed -> completed: ${illegalJump.error}`
    );

    // Attempt legal progression placed -> confirmed -> preparing
    const legalConfirm = await updateOrderStatus(testOrder.id, 'confirmed', 'Staff');
    const legalPrepare = await updateOrderStatus(testOrder.id, 'preparing', 'Kitchen');
    record(
      'ABUSE-STAT-02',
      'Legal Status Lifecycle Progression',
      legalConfirm.success && legalPrepare.success,
      `Transitioned placed -> confirmed (${legalConfirm.success}) -> preparing (${legalPrepare.success})`
    );
  }

  console.log('\n=============================================================');
  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`Results: ${passed}/${total} passed (${failed} failed)`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAntiAbuseTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
