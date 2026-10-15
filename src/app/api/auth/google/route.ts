import { NextRequest, NextResponse } from 'next/server';
import {
  isAuthorizedAdminEmail,
  createAdminSessionToken,
  PRIMARY_ADMIN_EMAIL,
} from '@/lib/security/admin-auth';
import {
  findOrCreateCustomerFromGoogle,
  createCustomerSession,
} from '@/lib/data/store';

// Helper to decode JWT token payload without external heavy dependencies
function decodeGoogleJwt(token: string): { email?: string; name?: string; sub?: string; picture?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payloadStr);
  } catch (e) {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let email = body.email?.trim().toLowerCase();
    let name = body.name?.trim();
    let googleId = body.google_id;
    let avatarUrl = body.avatar_url;
    const role = body.role || 'customer'; // 'admin' | 'customer'

    // If a Google Credential JWT is supplied from Google Identity Services
    if (body.credential && typeof body.credential === 'string') {
      const decoded = decodeGoogleJwt(body.credential);
      if (decoded?.email) {
        email = decoded.email.trim().toLowerCase();
        name = decoded.name || email.split('@')[0];
        googleId = decoded.sub;
        avatarUrl = decoded.picture;
      }
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid Google email is required to sign in.' },
        { status: 400 }
      );
    }

    // ==========================================
    // 1. ADMIN GOOGLE AUTHENTICATION FLOW
    // ==========================================
    if (role === 'admin') {
      if (!isAuthorizedAdminEmail(email)) {
        return NextResponse.json(
          {
            success: false,
            error: `Access Denied: Google account (${email}) is not authorized. The administrator portal is strictly reserved for ${PRIMARY_ADMIN_EMAIL}.`,
          },
          { status: 403 }
        );
      }

      // Generate signed cryptographic admin session
      const adminToken = createAdminSessionToken(PRIMARY_ADMIN_EMAIL, name || 'Sumit Dev Thakur');

      const res = NextResponse.json({
        success: true,
        role: 'admin',
        message: 'Administrator verified successfully via Google.',
        redirect: '/admin',
      });

      res.cookies.set('ph_admin_session', adminToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return res;
    }

    // ==========================================
    // 2. CUSTOMER GOOGLE AUTHENTICATION FLOW
    // ==========================================
    const { customer, isNew } = await findOrCreateCustomerFromGoogle({
      email,
      name: name || email.split('@')[0],
      google_id: googleId,
      avatar_url: avatarUrl,
    });

    const session = await createCustomerSession(customer.id, customer.phone || 'google');

    const res = NextResponse.json({
      success: true,
      role: 'customer',
      isNew,
      message: isNew
        ? `Welcome to Pizza Harrison, ${customer.full_name}!`
        : `Welcome back, ${customer.full_name}!`,
      customer,
      sessionToken: session.token,
      redirect: '/account',
    });

    res.cookies.set('ph_customer_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal error during Google authentication.' },
      { status: 500 }
    );
  }
}
