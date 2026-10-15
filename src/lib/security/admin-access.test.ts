// Pizza Harrison - Automated Test Suite: Admin Access Control & Security
// Verifies that ONLY sumitdevthakur@gmail.com can view and access the admin panel.

import {
  isAuthorizedAdminEmail,
  verifyAdminCredentials,
  createAdminSessionToken,
  verifyAdminSessionToken,
  PRIMARY_ADMIN_EMAIL,
} from './admin-auth';
import { verifyAdminSessionEdge } from './admin-edge';
import { testDatabaseConnection } from '../supabase/db';

async function runAdminAccessTests() {
  console.log('\n=============================================================');
  console.log('🛡️ PIZZA HARRISON — ADMIN ACCESS & SECURITY VERIFICATION');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testId: string, description: string) {
    if (condition) {
      console.log(`  ✅ [${testId}] ${description}`);
      passed++;
    } else {
      console.error(`  ❌ [${testId}] FAILED: ${description}`);
      failed++;
    }
  }

  // --- GROUP 1: STRICT EMAIL RESTRICTION ---
  console.log('--- GROUP 1: STRICT EMAIL RESTRICTION (sumitdevthakur@gmail.com) ---');

  assert(
    PRIMARY_ADMIN_EMAIL === 'sumitdevthakur@gmail.com',
    'ADM-EMAIL-01',
    `Primary admin email is configured to sumitdevthakur@gmail.com`
  );

  assert(
    isAuthorizedAdminEmail('sumitdevthakur@gmail.com') === true,
    'ADM-EMAIL-02',
    `Exact match sumitdevthakur@gmail.com is authorized`
  );

  assert(
    isAuthorizedAdminEmail('SUMITDEVTHAKUR@GMAIL.COM') === true,
    'ADM-EMAIL-03',
    `Case-insensitive check for SUMITDEVTHAKUR@GMAIL.COM is authorized`
  );

  assert(
    isAuthorizedAdminEmail('otheruser@gmail.com') === false,
    'ADM-EMAIL-04',
    `Unauthorized email otheruser@gmail.com is rejected`
  );

  assert(
    isAuthorizedAdminEmail('admin@pizzaharrison.com') === false,
    'ADM-EMAIL-05',
    `Unauthorized email admin@pizzaharrison.com is rejected`
  );

  assert(
    isAuthorizedAdminEmail('') === false && isAuthorizedAdminEmail(null) === false,
    'ADM-EMAIL-06',
    `Empty or null emails are safely rejected`
  );

  // --- GROUP 2: CREDENTIAL VERIFICATION & LOGIN ---
  console.log('\n--- GROUP 2: CREDENTIAL VERIFICATION & LOGIN ---');

  const validLogin = verifyAdminCredentials('sumitdevthakur@gmail.com', 'PizzaHarrison@2026');
  assert(
    validLogin.success === true,
    'ADM-AUTH-01',
    `Valid credentials for sumitdevthakur@gmail.com succeed`
  );

  const otpLogin = verifyAdminCredentials('sumitdevthakur@gmail.com', '745180');
  assert(
    otpLogin.success === true,
    'ADM-AUTH-02',
    `Emergency master OTP 745180 for sumitdevthakur@gmail.com succeeds`
  );

  const blockedWrongEmail = verifyAdminCredentials('hacker@gmail.com', 'PizzaHarrison@2026');
  assert(
    blockedWrongEmail.success === false && Boolean(blockedWrongEmail.error?.includes('sumitdevthakur@gmail.com')),
    'ADM-AUTH-03',
    `Wrong email with correct password is strictly blocked with restriction notice`
  );

  const blockedWrongPassword = verifyAdminCredentials('sumitdevthakur@gmail.com', 'WrongPass123');
  assert(
    blockedWrongPassword.success === false,
    'ADM-AUTH-04',
    `Correct email with wrong password is safely rejected`
  );

  // --- GROUP 3: CRYPTOGRAPHIC SESSION TOKEN & EDGE VALIDATION ---
  console.log('\n--- GROUP 3: CRYPTOGRAPHIC SESSION TOKEN & EDGE VALIDATION ---');

  const validToken = createAdminSessionToken('sumitdevthakur@gmail.com', 'Sumit Dev Thakur');
  assert(
    typeof validToken === 'string' && validToken.includes('.'),
    'ADM-TOK-01',
    `Signed admin session token generated with signature`
  );

  const verification = verifyAdminSessionToken(validToken);
  assert(
    verification.valid === true && verification.payload?.email === 'sumitdevthakur@gmail.com',
    'ADM-TOK-02',
    `Node runtime verifies admin token for sumitdevthakur@gmail.com`
  );

  const edgeVerification = await verifyAdminSessionEdge(validToken);
  assert(
    edgeVerification === true,
    'ADM-TOK-03',
    `Edge middleware Web Crypto API verifies admin token for sumitdevthakur@gmail.com`
  );

  // Tampered token test
  const tamperedToken = validToken.slice(0, -4) + 'abcd';
  const tamperedCheck = verifyAdminSessionToken(tamperedToken);
  assert(
    tamperedCheck.valid === false,
    'ADM-TOK-04',
    `Tampered signature token is strictly rejected`
  );

  // Fake email token test
  let fakeTokenBlocked = false;
  try {
    createAdminSessionToken('fakeadmin@gmail.com', 'Attacker');
  } catch (err: any) {
    fakeTokenBlocked = true;
  }
  assert(
    fakeTokenBlocked === true,
    'ADM-TOK-05',
    `Attempting to issue token for non-admin email throws unauthorized error`
  );

  // --- GROUP 4: DATABASE CONNECTION & ADAPTER ---
  console.log('\n--- GROUP 4: DATABASE CONNECTION & ADAPTER ---');

  const dbStatus = await testDatabaseConnection();
  assert(
    dbStatus.provider === 'supabase' || dbStatus.provider === 'in_memory_fallback',
    'ADM-DB-01',
    `Database status diagnostic reports provider correctly (${dbStatus.provider})`
  );

  console.log('\n=============================================================');
  console.log(`Results: ${passed}/${passed + failed} passed (${failed} failed)`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAdminAccessTests().catch((err) => {
  console.error('Test runner encountered unexpected error:', err);
  process.exit(1);
});
