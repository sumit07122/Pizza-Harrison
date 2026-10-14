import {
  fetchLoyaltyConfig,
  updateLoyaltyConfig,
  getLoyaltyAccountByPhone,
  processOrderCompletedLoyaltyStamp,
  revokeOrderLoyaltyStamp,
  redeemLoyaltyReward,
  recordLoyaltyAdjustment,
} from '../data/store';
import { Order } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
  }
}

async function runLoyaltyTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING PIZZA HARRISON LOYALTY & REWARDS TEST SUITE');
  console.log('======================================================\n');

  const testPhone = '9998887770';

  console.log('--- 1. CONFIGURATION & CAMPAIGN RULES ---');
  const initialConfig = await fetchLoyaltyConfig();
  assert(initialConfig.stamps_required === 6, 'Initial default stamps required is 6');
  assert(initialConfig.min_order_paise === 29900, 'Minimum order food subtotal is ₹299 (29900 paise)');

  // Owner modifies config
  const updated = await updateLoyaltyConfig(
    {
      is_active: true,
      min_order_paise: 29900,
      stamps_required: 6,
      reward_pizza_name: 'Regular Margherita or Farmhouse',
    },
    'Harrison Sharma (Owner)'
  );
  assert(updated.config.is_active === true, 'Owner can activate/deactivate program');

  console.log('\n--- 2. STAMP EARNING & THRESHOLD ELIGIBILITY ---');
  
  // Non-qualifying order: Subtotal ₹250 (< ₹299)
  const nonQualifyingOrder: Order = {
    id: `ord-test-nonqual-${Date.now()}`,
    order_number: 'PH-20261014-TEST1',
    customer_name: 'Sunil Mathur',
    customer_phone: testPhone,
    order_type: 'delivery',
    branch: 'pali_khera',
    items: [],
    subtotal_paise: 25000, // ₹250
    discount_paise: 0,
    delivery_fee_paise: 4000, // ₹40 delivery fee should NOT count
    packaging_fee_paise: 1500,
    tax_paise: 1250,
    total_paise: 31750, // Total is ₹317.50 but food subtotal is only ₹250
    status: 'completed',
    payment_status: 'completed',
    payment_method: 'cod',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const res1 = await processOrderCompletedLoyaltyStamp(nonQualifyingOrder);
  assert(res1.earned === false, 'Non-qualifying food subtotal (< ₹299) does not earn a stamp even if total >= ₹299 with delivery');

  // Qualifying order: Subtotal ₹349 (>= ₹299)
  const qualifyingOrder1: Order = {
    id: `ord-test-qual1-${Date.now()}`,
    order_number: 'PH-20261014-TEST2',
    customer_name: 'Sunil Mathur',
    customer_phone: testPhone,
    order_type: 'delivery',
    branch: 'pali_khera',
    items: [],
    subtotal_paise: 34900, // ₹349
    discount_paise: 0,
    delivery_fee_paise: 4000,
    packaging_fee_paise: 1500,
    tax_paise: 1745,
    total_paise: 42145,
    status: 'completed',
    payment_status: 'completed',
    payment_method: 'cod',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const res2 = await processOrderCompletedLoyaltyStamp(qualifyingOrder1);
  assert(res2.earned === true, 'Qualifying order (subtotal ₹349) successfully earns 1 stamp');

  // Idempotency check: Repeated order webhook / status update
  const res2Duplicate = await processOrderCompletedLoyaltyStamp(qualifyingOrder1);
  assert(res2Duplicate.earned === false, 'Duplicate order completion webhook does NOT award a second stamp (idempotent)');

  console.log('\n--- 3. REFUND & CANCELLATION STAMP REVOCATION ---');
  const initialAccount = (await getLoyaltyAccountByPhone(testPhone)).account;
  const stampsBeforeCancel = initialAccount?.stamps_count || 0;

  const revokeRes = await revokeOrderLoyaltyStamp(qualifyingOrder1.id, testPhone, 'Order cancelled after delivery confirmation');
  assert(revokeRes.revoked === true, 'Revocation successfully deducts earned stamp for cancelled/refunded order');

  const afterRevokeAccount = (await getLoyaltyAccountByPhone(testPhone)).account;
  assert((afterRevokeAccount?.stamps_count || 0) === stampsBeforeCancel - 1, 'Account stamps count accurately decreased by 1');

  // Duplicate revocation prevention
  const secondRevokeRes = await revokeOrderLoyaltyStamp(qualifyingOrder1.id, testPhone, 'Duplicate revoke attempt');
  assert(secondRevokeRes.revoked === false, 'Duplicate revocation does not deduct additional stamps');

  console.log('\n--- 4. REWARD UNLOCKING & REDEMPTION (6 STAMPS) ---');
  // Award 6 stamps to testPhone
  const testPhoneReward = '9991112223';
  for (let i = 1; i <= 6; i++) {
    const o: Order = {
      id: `ord-test-reward-${i}-${Date.now()}`,
      order_number: `PH-20261014-REW${i}`,
      customer_name: 'Pooja Agarwal',
      customer_phone: testPhoneReward,
      order_type: 'pickup',
      branch: 'pali_khera',
      items: [],
      subtotal_paise: 39900,
      discount_paise: 0,
      delivery_fee_paise: 0,
      packaging_fee_paise: 0,
      tax_paise: 1995,
      total_paise: 41895,
      status: 'completed',
      payment_status: 'completed',
      payment_method: 'upi_qr',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await processOrderCompletedLoyaltyStamp(o);
  }

  const rewardAccount = (await getLoyaltyAccountByPhone(testPhoneReward)).account;
  assert((rewardAccount?.available_rewards_count || 0) >= 1, '6 qualifying stamps unlocked 1 free pizza reward');

  // Redeem reward
  const redeemRes = await redeemLoyaltyReward(testPhoneReward, 'Harrison Sharma (Owner)');
  assert(redeemRes.success === true, 'Staff can successfully redeem unlocked free pizza reward');

  const afterRedeemAccount = (await getLoyaltyAccountByPhone(testPhoneReward)).account;
  assert((afterRedeemAccount?.available_rewards_count || 0) === 0, 'Available rewards count decrements to 0 after redemption');
  assert((afterRedeemAccount?.rewards_redeemed_count || 0) >= 1, 'Rewards redeemed count increments');

  // Prevent duplicate redemption with 0 balance
  const invalidRedeem = await redeemLoyaltyReward(testPhoneReward, 'Harrison Sharma (Owner)');
  assert(invalidRedeem.success === false, 'Cannot redeem when available reward balance is 0');

  console.log('\n--- 5. AUDITED STAFF ADJUSTMENTS WITH MANDATORY REASON ---');
  const adjustRes = await recordLoyaltyAdjustment(
    testPhoneReward,
    1,
    'Store opening anniversary bonus customer credit',
    'Harrison Sharma (Owner)'
  );
  assert(adjustRes.success === true, 'Audited adjustment with valid reason successfully credits stamp');

  const adjustMinus = await recordLoyaltyAdjustment(
    testPhoneReward,
    -1,
    'Correction of mistaken stamp credit',
    'Manager'
  );
  assert(adjustMinus.success === true, 'Audited adjustment can safely correct over-credited stamps');

  console.log('\n--- 6. CUSTOMER PRIVACY & LEDGER INTEGRITY ---');
  const { account: privAccount, ledger: privLedger } = await getLoyaltyAccountByPhone(testPhoneReward);
  assert(privLedger.length > 0, 'Ledger persistently logs each event with timestamp, reason, and actor');
  assert(privLedger.every((e) => !!e.reason && !!e.recorded_by), 'Every ledger entry records mandatory reason and actor');

  console.log('\n======================================================');
  console.log(`📊 RESULTS: ${passed}/${passed + failed} TESTS PASSED (${Math.round((passed / (passed + failed)) * 100)}% PASS RATE)`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runLoyaltyTests().catch((e) => {
  console.error('Test suite error:', e);
  process.exit(1);
});
