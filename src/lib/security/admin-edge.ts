// Pizza Harrison - Edge Runtime Compatible Admin Verifier
// Compatible with Next.js Middleware and Edge Runtime without Node crypto dependencies.

export const PRIMARY_ADMIN_EMAIL = 'sumitdevthakur@gmail.com';
export const ADMIN_COOKIE_NAME = 'ph_admin_session';

const ADMIN_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.ADMIN_ACCESS_SECRET ||
  'pizza-harrison-secure-admin-secret-key-2026-mathura';

function base64UrlToUint8Array(str: string): Uint8Array {
  // Add padding if needed
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Validates admin token inside Edge Middleware using Web Crypto API.
 */
export async function verifyAdminSessionEdge(token?: string | null): Promise<boolean> {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return false;
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return false;
  }

  try {
    // 1. Verify cryptographic HMAC signature
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(ADMIN_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = base64UrlToUint8Array(signature);
    const dataBytes = enc.encode(encodedPayload);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      dataBytes as unknown as BufferSource
    );

    if (!isValid) return false;

    // 2. Decode payload and verify email + expiration
    const payloadJson = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);

    if (Date.now() > payload.expiresAt) {
      return false;
    }

    if (payload.email?.toLowerCase() !== PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}
