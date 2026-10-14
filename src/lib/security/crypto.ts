// Pizza Harrison - Cryptographic & Security Utilities
// Uses standard Web Crypto API / Node.js crypto for zero-dependency, timing-safe operations.

import crypto from 'crypto';

// ==========================================
// 1. PASSWORD HASHING (PBKDF2 with Salt)
// ==========================================

const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

/**
 * Hash a customer or staff password using PBKDF2 with a unique cryptographically random salt.
 * Returns format: "salt:hash"
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify a plaintext password against a stored "salt:hash" string using timing-safe equality.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!storedHash || !storedHash.includes(':')) {
      return resolve(false);
    }
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) {
      return resolve(false);
    }

    crypto.pbkdf2(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
      if (err) return resolve(false);
      const derivedHex = derivedKey.toString('hex');
      try {
        const bufA = Buffer.from(derivedHex, 'hex');
        const bufB = Buffer.from(originalHash, 'hex');
        if (bufA.length !== bufB.length) return resolve(false);
        resolve(crypto.timingSafeEqual(bufA, bufB));
      } catch (_) {
        resolve(false);
      }
    });
  });
}

// ==========================================
// 2. CRYPTOGRAPHIC RANDOM TOKENS & SESSIONS
// ==========================================

/**
 * Generate a cryptographically random hex token (e.g. for customer sessions or private order tokens).
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a cryptographically random 6-digit numeric OTP.
 */
export function generateSecureOtp(): string {
  // Uses crypto.randomInt for uniform, non-skewed distribution [100000, 999999]
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hash an OTP for secure storage in database / memory cache so raw OTPs are never exposed in storage.
 */
export function hashOtp(otp: string, phone: string): string {
  return crypto
    .createHmac('sha256', process.env.ADMIN_ACCESS_SECRET || 'pizza-harrison-default-salt')
    .update(`${phone}:${otp}`)
    .digest('hex');
}

/**
 * Timing-safe string comparison.
 */
export function timingSafeMatch(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export const timingSafeEqualString = timingSafeMatch;
export const generateSessionToken = generateSecureToken;

/**
 * Verify an OTP against a stored HMAC hash using timing-safe comparison.
 */
export function verifyOtpHash(otp: string, phone: string, storedHash: string): boolean {
  const computed = hashOtp(otp, phone);
  return timingSafeMatch(computed, storedHash);
}
