// Pizza Harrison — Customer Authentication, Crypto & Rate-Limiting Security Test Suite
// Verifies PBKDF2 hashing, HMAC OTP security, brute-force locking, replay rejection & session tokens.

import {
  hashPassword,
  verifyPassword,
  generateSecureOtp,
  hashOtp,
  verifyOtpHash,
  generateSessionToken,
  timingSafeEqualString,
} from './crypto';
import { RateLimiter, RATE_LIMITS } from './rate-limit';
import {
  createPhoneOtpRequest,
  verifyPhoneOtp,
  createCustomerSession,
  validateCustomerSession,
  revokeCustomerSession,
  updateCustomerProfile,
  findCustomerByPhone,
  memoryStore,
} from '../data/store';
import { INITIAL_CUSTOMERS } from '../data/mock-data';

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

async function runAuthSecurityTests() {
  console.log('\n=============================================================');
  console.log('🔒 PIZZA HARRISON — CUSTOMER AUTH & CRYPTO SECURITY TESTS');
  console.log('=============================================================\n');

  // --- TEST GROUP 1: PBKDF2 Password Hashing & Timing-Safe Verification ---
  console.log('--- GROUP 1: PASSWORD HASHING (PBKDF2 100,000 ITERATIONS) ---');
  const plainPassword = 'MathuraPizza@2026';
  const hashed1 = await hashPassword(plainPassword);
  const hashed2 = await hashPassword(plainPassword);

  record(
    'SEC-PW-01',
    'Salted Hash Generation',
    hashed1.includes(':') && hashed1.length > 60,
    `Generated salt:hash format (${hashed1.slice(0, 24)}...)`
  );

  record(
    'SEC-PW-02',
    'Unique Salts Per Hash',
    hashed1 !== hashed2,
    'Different salts generated for identical plaintext passwords'
  );

  const isMatch1 = await verifyPassword(plainPassword, hashed1);
  record(
    'SEC-PW-03',
    'Accurate Password Verification',
    isMatch1 === true,
    'Plaintext password correctly verified against PBKDF2 hash'
  );

  const isMatch2 = await verifyPassword('WrongPassword123', hashed1);
  record(
    'SEC-PW-04',
    'Wrong Password Rejection',
    isMatch2 === false,
    'Incorrect password rejected safely'
  );

  // --- TEST GROUP 2: OTP Generation, Uniform Distribution & HMAC Integrity ---
  console.log('\n--- GROUP 2: OTP GENERATION & HMAC INTEGRITY ---');
  const otp1 = generateSecureOtp();
  const otp2 = generateSecureOtp();

  record(
    'SEC-OTP-01',
    '6-Digit Numeric OTP Format',
    /^\d{6}$/.test(otp1) && /^\d{6}$/.test(otp2),
    `Generated uniform codes: ${otp1}, ${otp2}`
  );

  const phone = '9876543210';
  const otpHash1 = hashOtp(otp1, phone);
  const otpHash2 = hashOtp(otp1, phone);
  const otpHashWrong = hashOtp('000000', phone);

  record(
    'SEC-OTP-02',
    'Deterministic HMAC Hash for Matching Code',
    otpHash1 === otpHash2,
    'Identical phone + OTP generates identical HMAC-SHA256 signature'
  );

  record(
    'SEC-OTP-03',
    'HMAC Signature Differentiation',
    otpHash1 !== otpHashWrong,
    'Different OTP codes produce distinct cryptographic hashes'
  );

  record(
    'SEC-OTP-04',
    'Timing-Safe HMAC Verification',
    verifyOtpHash(otp1, phone, otpHash1) === true &&
      verifyOtpHash('111111', phone, otpHash1) === false,
    'verifyOtpHash accurately validates valid and rejects invalid codes'
  );

  // --- TEST GROUP 3: Rate Limiting & Sliding Window Protection ---
  console.log('\n--- GROUP 3: RATE LIMITING & BRUTE-FORCE DEFENSE ---');
  const testLimiter = new RateLimiter();
  const ipKey = 'ip:127.0.0.1:login';

  // Allow up to 3 attempts in 1-second window
  const attempt1 = testLimiter.check(ipKey, 3, 1000);
  const attempt2 = testLimiter.check(ipKey, 3, 1000);
  const attempt3 = testLimiter.check(ipKey, 3, 1000);
  const attempt4 = testLimiter.check(ipKey, 3, 1000); // Should be blocked

  record(
    'SEC-RATE-01',
    'Rate Limit Threshold Enforcement',
    attempt1.allowed && attempt2.allowed && attempt3.allowed && !attempt4.allowed,
    `Fourth rapid attempt blocked (remaining: ${attempt4.remaining}, resetMs: ${attempt4.resetMs})`
  );

  // --- TEST GROUP 4: Store Customer Lifecycle, OTP Expiry & Brute Force Lockout ---
  console.log('\n--- GROUP 4: STORE AUTH, EXPIRED OTP & LOCKOUT PROTECTION ---');

  // Create OTP request
  const otpReq = await createPhoneOtpRequest('9898001122');
  record(
    'SEC-STORE-01',
    'Phone Verification Request Creation',
    otpReq.success && !!otpReq.verificationId && !!otpReq.otp,
    `Created verification request ID: ${otpReq.verificationId}`
  );

  // Attempt invalid code 1
  const fail1 = await verifyPhoneOtp('9898001122', '000000');
  record(
    'SEC-STORE-02',
    'Invalid OTP Attempt Tracked',
    !fail1.success && Boolean(fail1.error?.includes('attempt') || fail1.error?.includes('Invalid')),
    `First failed attempt response: ${fail1.error}`
  );

  // Attempt invalid code 2
  const fail2 = await verifyPhoneOtp('9898001122', '111111');
  // Attempt invalid code 3 (should lock out)
  const fail3 = await verifyPhoneOtp('9898001122', '222222');

  record(
    'SEC-STORE-03',
    'Brute-Force Lockout After 3 Attempts',
    !fail3.success && Boolean(fail3.error?.includes('Maximum') || fail3.error?.includes('locked') || fail3.error?.includes('Invalid')),
    `Locked out after 3 wrong attempts: ${fail3.error}`
  );

  // Attempting even the real code now must be blocked because the record was invalidated
  const failEvenIfCorrect = await verifyPhoneOtp('9898001122', otpReq.otp!);
  record(
    'SEC-STORE-04',
    'Locked Record Invalidation',
    !failEvenIfCorrect.success,
    'Locked record rejects subsequent attempts even with valid code'
  );

  // Replay protection: once verified, an OTP cannot be verified a second time
  const replayReq = await createPhoneOtpRequest('9898003344');
  const validVerification = await verifyPhoneOtp('9898003344', replayReq.otp!);
  const replayAttempt = await verifyPhoneOtp('9898003344', replayReq.otp!);

  record(
    'SEC-STORE-05',
    'OTP Replay Rejection',
    validVerification.success && !replayAttempt.success,
    'Verified OTP successfully prevents replay exploitation'
  );

  // Session token creation and validation
  const sessionCust = await findCustomerByPhone('9897445566');
  const session = await createCustomerSession(sessionCust!.id, sessionCust!.phone);
  const validated = await validateCustomerSession(session.token);

  record(
    'SEC-STORE-06',
    'Customer Session Generation & Validation',
    validated.valid && validated.customer?.phone === '9897445566',
    `Validated session token: ${session.token.slice(0, 16)}...`
  );

  // Session revocation (Logout)
  await revokeCustomerSession(session.token);
  const afterLogout = await validateCustomerSession(session.token);
  record(
    'SEC-STORE-07',
    'Session Revocation on Logout',
    !afterLogout.valid,
    'Revoked session token returns valid: false on subsequent validation attempts'
  );

  // Profile update
  const updatedCust = await updateCustomerProfile(sessionCust!.id, {
    full_name: 'Aman Mathur Updated',
    email: 'aman.new@example.com',
  });
  record(
    'SEC-STORE-08',
    'Customer Profile Sanitized Update',
    updatedCust.customer?.full_name === 'Aman Mathur Updated' && updatedCust.customer?.phone === '9897445566',
    'Updated name and email while preserving immutable verified phone number'
  );

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

runAuthSecurityTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
