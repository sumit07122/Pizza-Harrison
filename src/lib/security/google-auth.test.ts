// Pizza Harrison — Google Auth & Security Verification Test Suite

import {
  findCustomerByEmail,
  findOrCreateCustomerFromGoogle,
  createCustomerSession,
  validateCustomerSession,
} from '../data/store';
import {
  isAuthorizedAdminEmail,
  createAdminSessionToken,
  verifyAdminSessionToken,
  PRIMARY_ADMIN_EMAIL,
} from './admin-auth';

async function runGoogleAuthTests() {
  console.log('\n=============================================================');
  console.log('🛡️ PIZZA HARRISON — GOOGLE AUTH & SECURITY VERIFICATION');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testId: string, description: string) {
    if (condition) {
      console.log(`  ✅ [${testId}] ${description}`);
      passed++;
    } else {
      console.error(`  ❌ [${testId}] ${description} -> FAILED`);
      failed++;
    }
  }

  // --- GROUP 1: ADMIN GOOGLE AUTHENTICATION ---
  console.log('--- GROUP 1: ADMIN GOOGLE ACCESS RESTRICTION ---');
  
  const adminEmail = PRIMARY_ADMIN_EMAIL;
  assert(
    isAuthorizedAdminEmail(adminEmail),
    'GGL-ADM-01',
    `Primary admin email (${adminEmail}) is authorized via Google`
  );

  const unauthorizedEmail = 'attacker@gmail.com';
  assert(
    !isAuthorizedAdminEmail(unauthorizedEmail),
    'GGL-ADM-02',
    `Unauthorized Google account (${unauthorizedEmail}) is strictly denied admin access`
  );

  const adminToken = createAdminSessionToken(adminEmail, 'Sumit Dev Thakur');
  const tokenValidation = verifyAdminSessionToken(adminToken);
  assert(
    tokenValidation.valid && tokenValidation.payload?.email === adminEmail,
    'GGL-ADM-03',
    'Admin Google session token generates valid cryptographic signature'
  );

  // --- GROUP 2: CUSTOMER GOOGLE SIGNUP & LOGIN ---
  console.log('\n--- GROUP 2: CUSTOMER GOOGLE SIGN-UP & LOGIN ---');

  const testGoogleEmail = 'test.student.gla@gmail.com';
  const testGoogleName = 'Vikram Singh';

  // 1. Initial Google signup
  const { customer: newCust, isNew } = await findOrCreateCustomerFromGoogle({
    email: testGoogleEmail,
    name: testGoogleName,
    google_id: 'goog-123456789',
    avatar_url: 'https://lh3.googleusercontent.com/a/test-avatar',
  });

  assert(
    isNew === true && newCust.email === testGoogleEmail && newCust.email_verified === true,
    'GGL-CUST-01',
    'New Google customer account created with email_verified: true'
  );

  assert(
    newCust.full_name === testGoogleName,
    'GGL-CUST-02',
    'Google customer full name preserved correctly'
  );

  // 2. Customer session establishment
  const custSession = await createCustomerSession(newCust.id, newCust.phone || 'google');
  assert(
    Boolean(custSession.token && custSession.token.length > 20),
    'GGL-CUST-03',
    'Customer session token generated successfully from Google auth'
  );

  const sessionCheck = await validateCustomerSession(custSession.token);
  assert(
    sessionCheck.valid === true && sessionCheck.customer?.email === testGoogleEmail,
    'GGL-CUST-04',
    'Customer Google session validates successfully against store'
  );

  // 3. Repeat login with existing Google account
  const { customer: existingCust, isNew: isNewRepeat } = await findOrCreateCustomerFromGoogle({
    email: testGoogleEmail,
    name: testGoogleName,
    google_id: 'goog-123456789',
  });

  assert(
    isNewRepeat === false && existingCust.id === newCust.id,
    'GGL-CUST-05',
    'Repeat Google login matches existing customer record without duplicates'
  );

  // --- SUMMARY ---
  console.log('\n=============================================================');
  console.log(`Results: ${passed}/${passed + failed} passed (${failed} failed)`);
  console.log('=============================================================\n');

  if (failed > 0) process.exit(1);
}

runGoogleAuthTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
