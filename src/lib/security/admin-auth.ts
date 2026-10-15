// Pizza Harrison - Store Administrator Security & Authentication Layer
// STRICT ACCESS CONTROL: Only authorized admin email (sumitdevthakur@gmail.com) is permitted.

import crypto from 'crypto';

export const PRIMARY_ADMIN_EMAIL = 'sumitdevthakur@gmail.com';
export const ADMIN_COOKIE_NAME = 'ph_admin_session';

const ADMIN_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.ADMIN_ACCESS_SECRET ||
  'pizza-harrison-secure-admin-secret-key-2026-mathura';

export interface AdminSessionPayload {
  email: string;
  role: 'admin' | 'owner';
  name: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Validates whether an email is the authorized Pizza Harrison Administrator.
 */
export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
}

/**
 * Creates a signed cryptographic token for the authorized admin session.
 * Expiry: 7 days.
 */
export function createAdminSessionToken(
  email: string = PRIMARY_ADMIN_EMAIL,
  name: string = 'Sumit Dev Thakur'
): string {
  if (!isAuthorizedAdminEmail(email)) {
    throw new Error(`Unauthorized email: Only ${PRIMARY_ADMIN_EMAIL} can establish an admin session.`);
  }

  const now = Date.now();
  const payload: AdminSessionPayload = {
    email: PRIMARY_ADMIN_EMAIL,
    role: 'admin',
    name,
    issuedAt: now,
    expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies an admin session token with cryptographic signature validation.
 * Strictly checks that the email matches sumitdevthakur@gmail.com.
 */
export function verifyAdminSessionToken(token?: string | null): {
  valid: boolean;
  payload?: AdminSessionPayload;
  error?: string;
} {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { valid: false, error: 'Missing or malformed session token.' };
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return { valid: false, error: 'Malformed token components.' };
  }

  const expectedSignature = crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  // Timing safe comparison
  const sigA = Buffer.from(signature);
  const sigB = Buffer.from(expectedSignature);
  if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
    return { valid: false, error: 'Invalid token signature.' };
  }

  try {
    const payloadStr = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const payload: AdminSessionPayload = JSON.parse(payloadStr);

    if (Date.now() > payload.expiresAt) {
      return { valid: false, error: 'Admin session has expired. Please sign in again.' };
    }

    if (!isAuthorizedAdminEmail(payload.email)) {
      return { valid: false, error: `Unauthorized administrator: ${payload.email}` };
    }

    return { valid: true, payload };
  } catch (e: any) {
    return { valid: false, error: 'Failed to decode session payload.' };
  }
}

/**
 * Verify admin credentials:
 * Allowed if:
 * 1. Email strictly matches sumitdevthakur@gmail.com
 * 2. Password matches ADMIN_PASSWORD env or default master key "PizzaHarrison@2026"
 *    OR master OTP "745180" (derived from restaurant phone)
 */
export function verifyAdminCredentials(
  email: string,
  passwordOrOtp: string
): { success: boolean; error?: string } {
  if (!isAuthorizedAdminEmail(email)) {
    return {
      success: false,
      error: `Access Restricted: Only authorized store administrator (${PRIMARY_ADMIN_EMAIL}) is permitted to access the management portal. Other users view the customer storefront.`,
    };
  }

  const cleanInput = (passwordOrOtp || '').trim();
  const configuredPassword = process.env.ADMIN_PASSWORD || 'PizzaHarrison@2026';
  const masterOtp = '745180'; // Fast emergency login key matching restaurant official phone prefix

  const matchesPassword = cleanInput === configuredPassword;
  const matchesOtp = cleanInput === masterOtp;

  if (matchesPassword || matchesOtp) {
    return { success: true };
  }

  return {
    success: false,
    error: 'Incorrect administrator password or verification code.',
  };
}
